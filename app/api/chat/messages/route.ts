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

    // 🔥 FIX: Prisma database ke format ko Frontend UI ke format me map kar rahe hain
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      text: msg.body, // 'body' ko 'text' bana diya taaki blank bubble na aaye
      sender: msg.direction === "OUTBOUND" ? "me" : "them", // 'direction' ko 'me/them' banaya taaki Right/Left alignment sahi ho
      time: new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: msg.status.toLowerCase(), // 'SENT' ko 'sent' kar diya ticks ke liye
      type: msg.type.toLowerCase(),
      mediaUrl: msg.mediaUrl,
    }));

    return NextResponse.json(formattedMessages);
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
        id: metaMessageId, 
        contactId: contactId,
        body: msgBody,
        type: "TEXT",
        direction: "OUTBOUND",
        status: "SENT", 
        timestamp: new Date(),
      },
    });

    // Contact ki lastMessage update kardo sidebar ke liye
    await prisma.contact.update({
      where: { id: contactId },
      data: { lastMessageAt: new Date() },
    });

    // 🔥 FIX: Jo naya message save hua hai, usko bhi frontend format me convert karke bhejo
    const formattedNewMsg = {
      id: newMsg.id,
      text: newMsg.body,
      sender: "me", // Humne bheja hai isliye "me"
      time: new Date(newMsg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
      type: "text",
      mediaUrl: null,
    };

    return NextResponse.json({ success: true, message: formattedNewMsg });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
