import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

// 1. Firebase Admin SDK Initialization
if (!getApps().length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
  };

  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}

const db = getDatabase();

export async function POST(req: Request) {
  try {
    // 2. Auth Check
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const clientApiKey = authHeader.replace("Bearer ", "").trim();

    // 3. Body Validation
    const body = await req.json();
    const { template, phone, variables, language } = body;

    if (!template || !phone) {
      return NextResponse.json({ error: "Missing template or phone" }, { status: 400 });
    }

    // 4. API Key Lookup
    const mapSnap = await db.ref(`apiKeysMap/${clientApiKey}`).once("value");
    if (!mapSnap.exists()) {
      return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
    }

    const matchedUserId = mapSnap.val().uid;

    // 5. User Config Fetch
    const configSnap = await db.ref(`users/${matchedUserId}/config`).once("value");
    const matchedConfig = configSnap.val();

    if (!matchedConfig?.accessToken || !matchedConfig?.phoneId) {
      return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
    }

    // 6. WhatsApp Request with Timeout (Fixes the hanging issue)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds limit

    try {
      const components = variables && Array.isArray(variables) 
        ? [{ type: "body", parameters: variables.map((val: string) => ({ type: "text", text: String(val) })) }]
        : [];

      const metaRes = await fetch(`https://graph.facebook.com/v21.0/${matchedConfig.phoneId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${matchedConfig.accessToken}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal, // Timeout lagaya
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
      clearTimeout(timeoutId); // Request khatam hote hi timer off

      if (metaData.error) {
        return NextResponse.json({ error: "Meta API Error", details: metaData.error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, meta_response: metaData }, { status: 200 });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({ error: "Meta API Timeout: Server took too long to respond" }, { status: 504 });
      }
      throw fetchError;
    }

  } catch (error: any) {
    console.error("Trigger API Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
