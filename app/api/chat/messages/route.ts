// App/api/chat/messages/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── 1. FETCH MESSAGES (Jab kisi contact par click karein) ───
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const contactId = url.searchParams.get("contactId");

    if (!contactId) {
      return NextResponse.json([]);
    }

    // Us contact ke saare messages time ke hisaab se seedhe kram (asc) mein nikal lo
    const messages = await prisma.message.findMany({
      where: { contactId: contactId },
      orderBy: { timestamp: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// ─── 2. SEND MESSAGE (Jab aap chat box se message bhejein) ───
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { contactId, phoneNumber, type, body: msgBody, replyTo } = body;

    // 1. WhatsApp API Details System Settings se nikalo
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "main_settings" },
    });

    if (!settings || !settings.accessToken || !settings.phoneNumberId) {
      return NextResponse.json({ error: "WhatsApp API settings missing in DB" }, { status: 400 });
    }

    // 2. Meta (WhatsApp) ki Graph API ko message bhejne ki request karo
    const metaResponse = await fetch(`https://graph.facebook.com/v19.0/${settings.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${settings.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: phoneNumber,
        type: "text",
        text: { preview_url: false, body: msgBody },
      }),
    });

    const metaData = await metaResponse.json();

    if (metaData.error) {
      console.error("Meta API Error:", metaData.error);
      return NextResponse.json({ error: "Failed to send to WhatsApp" }, { status: 500 });
    }

    // 3. Meta API successful hone ke baad, message ko Prisma database me save kar lo
    const metaMessageId = metaData.messages?.[0]?.id || `local_id_${Date.now()}`;

    const newMsg = await prisma.message.create({
      data: {
        id: metaMessageId, // Meta se aaya asli ID (wamid) save karo ticks ke liye
        contactId: contactId,
        body: msgBody,
        type: "TEXT",
        direction: "OUTBOUND",
        status: "SENT", // Abhi sent hua hai, Webhook isko Delivered/Read me badlega
        timestamp: new Date(),
      },
    });

    // Contact ki lastMessage update kardo sidebar ke liye
    await prisma.contact.update({
      where: { id: contactId },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json({ success: true, message: newMsg });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
