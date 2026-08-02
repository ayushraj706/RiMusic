import { NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import admin from "firebase-admin";

// 1. Firebase Admin SDK Initialization (Server-side के लिए)
if (!getApps().length) {
  // ध्यान रहे: Vercel के Environment Variables में ये तीन keys डालनी होंगी
  initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // प्राइवेट की में \n का इश्यू आता है इसलिए replace करते हैं
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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
    const { template, phone, variables } = body;

    if (!template || !phone) {
      return NextResponse.json(
        { error: "Bad Request: 'template' and 'phone' fields are required" },
        { status: 400 }
      );
    }

    // 4. Firebase से ढूँढना कि यह API Key किस यूज़र की है
    const usersRef = db.ref("users");
    const snapshot = await usersRef.once("value");

    let matchedUserId: string | null = null;
    let matchedConfig: any = null;

    if (snapshot.exists()) {
      const usersData = snapshot.val();
      for (const uid of Object.keys(usersData)) {
        const apiKeysObj = usersData[uid]?.apiKeys;
        if (apiKeysObj) {
          // चेक कर रहे हैं कि क्या किसी भी key की वैल्यू clientApiKey से मैच होती है
          const foundKeyEntry = Object.values(apiKeysObj).find(
            (item: any) => item.apiKey === clientApiKey
          );
          if (foundKeyEntry) {
            matchedUserId = uid;
            matchedConfig = usersData[uid]?.config;
            break;
          }
        }
      }
    }

    if (!matchedUserId || !matchedConfig || !matchedConfig.accessToken || !matchedConfig.phoneId) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or revoked API Key" },
        { status: 401 }
      );
    }

    const { accessToken, phoneId } = matchedConfig;

    // 5. Meta (WhatsApp) के लिए Variables (Components) तैयार करना
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

    // 6. Meta Cloud API को असली रिक्वेस्ट भेजना
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
          language: { code: "en_US" }, // अगर तुम्हारा टेम्प्लेट किसी और भाषा में है तो यहाँ बदल सकते हो
          ...(components.length > 0 && { components }),
        },
      }),
    });

    const metaData = await metaRes.json();

    // अगर Meta ने कोई एरर दिया
    if (metaData.error) {
      return NextResponse.json(
        { error: "Meta API Error", details: metaData.error.message },
        { status: 400 }
      );
    }

    // 7. सब कुछ सही रहने पर Success रिस्पॉन्स भेजना
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
