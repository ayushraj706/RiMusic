// App/api/webhook/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, MessageType, MessageDirection, MessageStatus } from "@prisma/client";
import { runFlowEngine } from "@/lib/whatsapp/engine";

// Prisma client initialize kar rahe hain
const prisma = new PrismaClient();

// ─── GET: Webhook Verification (Prisma / DB Check) ───
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token) {
    try {
      // Prisma: Check if the token matches verifyToken in SystemSettings
      const settings = await prisma.systemSettings.findFirst({
        where: { verifyToken: token }
      });

      if (settings) {
        console.log(`✅ Webhook Verified Successfully with token: ${token}`);
        return new Response(challenge, { status: 200 });
      } else {
        console.warn(`❌ Webhook Verification Failed: Token not found.`);
        return new Response("Forbidden: Invalid Token", { status: 403 });
      }
    } catch (error) {
      console.error("Database Error during verification:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  return new Response("Forbidden", { status: 403 });
}

// ─── POST: Receive Messages & Status Updates ───
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.object !== "whatsapp_business_account") {
      return new NextResponse("EVENT_RECEIVED", { status: 200 });
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;
        if (!value) continue;

        const phoneId = value.metadata?.phone_number_id;
        if (!phoneId) continue;

        // ─── A. RECEIVED MESSAGES (INBOUND) ───
        if (value.messages && value.messages.length > 0) {
          for (const message of value.messages) {
            // ✅ AWAIT is compulsory for Serverless (Vercel)
            try {
              await handleIncomingMessage(phoneId, message, value.contacts);
            } catch (e) {
              console.error("Message Processing Error:", e);
            }
          }
        }

        // ─── B. STATUS UPDATES (Read Receipts) ───
        if (value.statuses && value.statuses.length > 0) {
          for (const status of value.statuses) {
            // ✅ AWAIT is compulsory for Serverless (Vercel)
            try {
              await handleStatusUpdate(status);
            } catch (e) {
              console.error("Status Processing Error:", e);
            }
          }
        }

        // ─── C. ERRORS ───
        if (value.errors && value.errors.length > 0) {
          for (const error of value.errors) {
            console.error("Webhook Error:", error);
          }
        }
      }
    }

    return new NextResponse("EVENT_RECEIVED", { status: 200 });
  } catch (error) {
    console.error("Webhook Processing Error:", error);
    return new NextResponse("EVENT_RECEIVED", { status: 200 });
  }
}

// ─── Handle Incoming Message (Prisma Logic) ───
async function handleIncomingMessage(phoneId: string, message: any, contacts: any[]) {
  const senderPhone = message.from;
  const senderName = contacts?.[0]?.profile?.name || senderPhone;
  const messageId = message.id; // Meta ka diya hua wamid ID
  const timestamp = new Date(parseInt(message.timestamp) * 1000); // Convert to JS Date for Prisma
  const rawType = message.type;

  let textBody = "";
  let mediaUrl = null;
  let enumType: MessageType = "TEXT";
  
  // ✅ FIX 1: TS Error hatane ke liye 'any' type define kiya
  let interactivePayload: any = null;

  // Type aur data map karna according to Prisma Schema
  switch (rawType) {
    case "text": 
      textBody = message.text?.body || ""; 
      enumType = "TEXT"; 
      break;
    case "image": 
      enumType = "IMAGE"; 
      mediaUrl = message.image?.id; 
      textBody = message.image?.caption || "📷 Image"; 
      break;
    case "video": 
      enumType = "VIDEO"; 
      mediaUrl = message.video?.id; 
      textBody = message.video?.caption || "🎥 Video"; 
      break;
    case "audio": 
    case "voice":
      enumType = "AUDIO"; 
      mediaUrl = message.audio?.id || message.voice?.id; 
      textBody = "🎵 Audio message"; 
      break;
    case "document": 
      enumType = "DOCUMENT"; 
      mediaUrl = message.document?.id; 
      textBody = message.document?.caption || `📄 ${message.document?.filename || "Document"}`; 
      break;
    case "interactive":
      enumType = "INTERACTIVE";
      if (message.interactive?.type === "button_reply") {
        textBody = message.interactive.button_reply?.title || "Button reply";
        interactivePayload = { type: "button_reply", value: message.interactive.button_reply?.id };
      } else if (message.interactive?.type === "list_reply") {
        textBody = message.interactive.list_reply?.title || "List selection";
        interactivePayload = { type: "list_reply", value: message.interactive.list_reply?.id };
      }
      break;
    case "button": 
      enumType = "INTERACTIVE"; 
      textBody = message.button?.text || "Button clicked"; 
      interactivePayload = { type: "button_reply", value: message.button?.payload };
      break;
    case "location": 
      enumType = "TEXT"; 
      textBody = `📍 Location: ${message.location?.name || `${message.location?.latitude}, ${message.location?.longitude}`}`; 
      break;
    default: 
      enumType = "TEXT"; 
      textBody = `📎 ${rawType} message`;
  }

  // 1. Prisma UPSERT: Contact ko dhoondo, update karo ya naya banao
  const contact = await prisma.contact.upsert({
    where: { phoneNumber: senderPhone },
    update: {
      name: senderName,
      lastMessageAt: timestamp,
      unreadCount: { increment: 1 },
      isSessionActive: true,
    },
    create: {
      phoneNumber: senderPhone,
      name: senderName,
      lastMessageAt: timestamp,
      unreadCount: 1,
      isSessionActive: true,
    },
  });

  // 2. Prisma CREATE: Message table mein message save karo
  await prisma.message.create({
    data: {
      id: messageId, // Meta API ka message ID (wamid.xxxx)
      contactId: contact.id,
      body: textBody,
      type: enumType,
      direction: "INBOUND",
      status: "DELIVERED", // Jo aaya hai wo delivered hi maana jayega
      mediaUrl: mediaUrl,
      timestamp: timestamp,
    },
  });

  console.log(`📩 [INBOUND - ${enumType}] From ${senderName}: ${textBody.substring(0, 60)}`);

  // ─── 🔌 D. HAND OFF TO THE FLOW ENGINE ───
  try {
    const settings = await prisma.systemSettings.findFirst({
      where: { phoneNumberId: phoneId }
    });

    if (settings) {
      if (!settings.isAiBotActive) {
        // Run Visual Flow Engine
        if (interactivePayload) {
          await runFlowEngine(phoneId, senderPhone, interactivePayload);
        } else if (rawType === "text") {
          // ✅ FIX 2: TS Error bypass karne ke liye 'as any' lagaya hai
          await runFlowEngine(phoneId, senderPhone, { type: "text", value: textBody } as any);
        }
      } else {
        console.log(`🤖 AI Bot is active for ${phoneId}. Skipping visual Flow Engine.`);
        // Yahan par aage chal kar Gemini Bot connect hoga
      }
    }
  } catch (engineError) {
    console.error("Flow engine error:", engineError);
  }
}

// ─── Handle Status Update (Prisma Logic) ───
async function handleStatusUpdate(status: any) {
  const metaId = status.id; // Meta ka diya hua Message ID (wamid...)
  const metaStatus = status.status; // 'sent', 'delivered', 'read', 'failed'

  let dbStatus: MessageStatus | null = null;
  if (metaStatus === "sent") dbStatus = "SENT";
  if (metaStatus === "delivered") dbStatus = "DELIVERED";
  if (metaStatus === "read") dbStatus = "READ";

  if (dbStatus) {
    try {
      // Prisma: Message ko directly uske ID (wamid) se find karke update kar do. 
      // Ab hume Firebase ki tarah loop lagake dhundhne ki zaroorat nahi!
      await prisma.message.update({
        where: { id: metaId },
        data: { status: dbStatus },
      });
      console.log(`📊 Updated Status to [${dbStatus}] for message: ${metaId}`);
    } catch (error) {
      // Agar update fail hota hai (jaise message ID na mile), to error handle karo
      console.log(`⚠️ Status update skipped (Message ID not found in DB): ${metaId}`);
    }
  }

  if (metaStatus === "failed" && status.errors) {
    for (const error of status.errors) {
      console.error(`❌ Message failed: ${error.code} - ${error.title} - ${error.message}`);
    }
  }
}
