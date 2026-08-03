import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // 1. Auth Check (Bearer Token)
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const clientApiKey = authHeader.replace("Bearer ", "").trim();

    // 2. Body Validation
    const body = await req.json();
    const { template, phone, variables, language } = body;

    if (!template || !phone) {
      return NextResponse.json({ error: "Missing template or phone" }, { status: 400 });
    }

    // 3. API Key Lookup & Security Checks (Neon DB)
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { token: clientApiKey }
    });

    if (!apiKeyRecord) {
      return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
    }

    if (apiKeyRecord.isRevoked) {
      return NextResponse.json({ error: "This API Key has been revoked by the admin" }, { status: 403 });
    }

    if (apiKeyRecord.expiresAt && new Date() > apiKeyRecord.expiresAt) {
      return NextResponse.json({ error: "This API Key has expired" }, { status: 403 });
    }

    if (apiKeyRecord.name !== template) {
      return NextResponse.json({ error: `This API Key is strictly locked to the template: ${apiKeyRecord.name}` }, { status: 403 });
    }

    // 4. System Settings Fetch (WhatsApp Tokens)
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "main_settings" }
    });

    if (!settings || !settings.accessToken || !settings.phoneNumberId) {
      return NextResponse.json({ error: "WhatsApp Configuration not found" }, { status: 404 });
    }

    // 5. WhatsApp Request with Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds limit

    try {
      const components = variables && Array.isArray(variables) 
        ? [{ type: "body", parameters: variables.map((val: string) => ({ type: "text", text: String(val) })) }]
        : [];

      const metaRes = await fetch(`https://graph.facebook.com/v21.0/${settings.phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${settings.accessToken}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
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
      clearTimeout(timeoutId);

      if (metaData.error) {
        return NextResponse.json({ error: "Meta API Error", details: metaData.error.message }, { status: 400 });
      }

      // 6. 🔥 ANALYTICS KE LIYE DB MEIN SAVE KARNA (No Error Guarantee)
      // Contact agar nahi hai toh bana do, hai toh update kar do
      const contact = await prisma.contact.upsert({
        where: { phoneNumber: phone },
        update: { lastMessageAt: new Date() },
        create: { phoneNumber: phone, name: "API User", source: "api" }
      });

      // API se gaya message save karo (Type: TEMPLATE, Source: API)
      await prisma.message.create({
        data: {
          id: metaData.messages?.[0]?.id || `api_local_${Date.now()}`,
          contactId: contact.id,
          body: `Sent Template: ${template}`,
          type: "TEMPLATE",
          direction: "OUTBOUND",
          status: "SENT",
          source: "API", // <--- Analytics yahan se PDF ke liye data uthayega!
          timestamp: new Date()
        }
      });

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
