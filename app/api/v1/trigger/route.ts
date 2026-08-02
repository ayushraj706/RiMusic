import { NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import admin from "firebase-admin";

// 1. Firebase Admin SDK Initialization
if (!getApps().length) {
  initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}

const db = getDatabase();

export async function POST(req: Request) {
  try {
    // 2. Request Header से Bearer Token (API Key) निकालना
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid Authorization header" },
        { status: 401 }
      );
    }
    const clientApiKey = authHeader.replace("Bearer ", "").trim();

    // 3. Request Body से डेटा निकालना
    const body = await req.json();
    const { template, phone, variables, language } = body;

    if (!template || !phone) {
      return NextResponse.json(
        { error: "Bad Request: 'template' and 'phone' fields are required" },
        { status: 400 }
      );
    }

    // 4. ⚡ BLAZING FAST LOOKUP: सीधा apiKeysMap से यूज़र का UID ढूँढना (लूप की छुट्टी!)
    const mapRef = db.ref(`apiKeysMap/${clientApiKey}`);
    const mapSnap = await mapRef.once("value");

    if (!mapSnap.exists()) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or revoked API Key" },
        { status: 401 }
      );
    }

    const mappingData = mapSnap.val();
    // फ्रंटएंड से हमने object के रूप में {uid: ..., keyId: ...} सेव किया है
    const matchedUserId = typeof mappingData === "object" ? mappingData.uid : mappingData;

    // 5. सिर्फ उसी (matched) यूज़र का config फेच करना
    const configRef = db.ref(`users/${matchedUserId}/config`);
    const configSnap = await configRef.once("value");

    if (!configSnap.exists()) {
      return NextResponse.json(
        { error: "Configuration not found for this API Key" },
        { status: 404 }
      );
    }

    const matchedConfig = configSnap.val();
    const { accessToken, phoneId } = matchedConfig;

    if (!accessToken || !phoneId) {
      return NextResponse.json(
        { error: "Incomplete Meta configuration in database" },
        { status: 400 }
      );
    }

    // 6. Meta (WhatsApp) के लिए Variables तैयार करना
    let components = [];
    if (variables && Array.isArray(variables) && variables.length > 0) {
      components.push({
        type: "body",
        parameters: variables.map((val: string) => ({
          type: "text",
          text: String(val),
        })),
      });
    }

    // 7. Meta Cloud API को रिक्वेस्ट भेजना
    const metaRes = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: template,
          language: { code: language || "en_US" },
          ...(components.length > 0 && { components }),
        },
      }),
    });

    const metaData = await metaRes.json();

    if (metaData.error) {
      return NextResponse.json(
        { error: "Meta API Error", details: metaData.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "WhatsApp template message triggered successfully!", 
        meta_response: metaData 
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Trigger API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
