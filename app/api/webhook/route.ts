import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { runFlowEngine } from "@/lib/whatsapp/engine";
// 👇 NAYA CODE: Prisma ko import kiya aur uska nick-name 'prisma' rakh diya
import { db as prisma } from "@/prisma/lib/db"; 

// ─── Initialize Firebase Admin ───
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  } catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
  }
}

// Firebase yahan 'db' naam se use hoga
const db = admin.database();

// ─── GET: Webhook Verification (Dynamic Database Check) ───
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token) {
    try {
      // Firebase डेटाबेस में चेक करो कि क्या यह टोकन किसी यूज़र के config में है?
      const usersRef = db.ref("users");
      const snapshot = await usersRef.orderByChild("config/webhookVerifyToken").equalTo(token).once("value");

      if (snapshot.exists()) {
        // टोकन मिल गया! मतलब यह हमारा ही कोई क्लाइंट है।
        snapshot.forEach((childSnapshot) => {
          childSnapshot.ref.child("config").update({
            isWebhookVerified: true
          });
        });

        console.log(`✅ Webhook Verified for a user with token: ${token}`);
        return new Response(challenge, { status: 200 });
      } else {
        // टोकन डेटाबेस में नहीं मिला
        console.warn(`❌ Webhook Verification Failed: Token not found in database.`);
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

        // ─── A. RECEIVED MESSAGES ───
        if (value.messages && value.messages.length > 0) {
          for (const message of value.messages) {
            await handleIncomingMessage(phoneId, message, value.contacts);
          }
        }

        // ─── B. STATUS UPDATES (Read Receipts) ───
        if (value.statuses && value.statuses.length > 0) {
          for (const status of value.statuses) {
            await handleStatusUpdate(phoneId, status);
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

// ─── Handle Incoming Message ───
async function handleIncomingMessage(phoneId: string, message: any, contacts: any[]) {
  const senderPhone = message.from;
  const senderName = contacts?.[0]?.profile?.name || senderPhone;
  const messageId = message.id;
  const timestamp = parseInt(message.timestamp) * 1000;
  const messageType = message.type;

  let text = "";
  let mediaUrl = null;
  let mediaType = null;
  let caption = null;
  let location = null;
  let interactive = null;
  let button = null;

  switch (messageType) {
    case "text":
      text = message.text?.body || "";
      break;

    case "image":
      mediaType = "image";
      mediaUrl = message.image?.id;
      caption = message.image?.caption;
      text = caption || "📷 Image";
      break;

    case "video":
      mediaType = "video";
      mediaUrl = message.video?.id;
      caption = message.video?.caption;
      text = caption || "🎥 Video";
      break;

    case "audio":
      mediaType = "audio";
      mediaUrl = message.audio?.id;
      text = "🎵 Audio message";
      break;

    case "voice":
      mediaType = "voice";
      mediaUrl = message.voice?.id;
      text = "🎤 Voice message";
      break;

    case "document":
      mediaType = "document";
      mediaUrl = message.document?.id;
      caption = message.document?.caption;
      text = caption || `📄 ${message.document?.filename || "Document"}`;
      break;

    case "sticker":
      mediaType = "sticker";
      mediaUrl = message.sticker?.id;
      text = "😀 Sticker";
      break;

    case "location":
      location = {
        latitude: message.location?.latitude,
        longitude: message.location?.longitude,
        name: message.location?.name,
        address: message.location?.address,
      };
      text = `📍 Location: ${location.name || `${location.latitude}, ${location.longitude}`}`;
      break;

    case "contacts":
      text = "👤 Shared contact";
      break;

    case "button":
      button = {
        payload: message.button?.payload,
        text: message.button?.text,
      };
      text = `▶️ ${button.text || "Button clicked"}`;
      break;

    case "interactive":
      if (message.interactive?.type === "button_reply") {
        interactive = {
          type: "button_reply",
          id: message.interactive.button_reply?.id,
          title: message.interactive.button_reply?.title,
        };
        text = `🔘 ${interactive.title || "Button reply"}`;
      } else if (message.interactive?.type === "list_reply") {
        interactive = {
          type: "list_reply",
          id: message.interactive.list_reply?.id,
          title: message.interactive.list_reply?.title,
          description: message.interactive.list_reply?.description,
        };
        text = `📋 ${interactive.title || "List selection"}`;
      }
      break;

    case "order":
      text = "🛒 Order received";
      break;

    case "system":
      text = "⚙️ System message";
      break;

    case "reaction":
      text = `👍 Reacted: ${message.reaction?.emoji || ""}`;
      break;

    default:
      text = `📎 ${messageType} message`;
  }

  // Save message to Firebase (using 'db')
  const chatRef = db.ref(`chats/${phoneId}/${senderPhone}/messages`);
  await chatRef.push({
    metaId: messageId,
    text,
    sender: "them",
    time: new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    timestamp,
    status: "received",
    messageType,
    mediaUrl,
    mediaType,
    caption,
    location,
    interactive,
    button,
  });

  // Update contact info in Firebase
  const infoRef = db.ref(`chats/${phoneId}/${senderPhone}/info`);
  const infoSnap = await infoRef.once("value");
  const currentUnread = infoSnap.exists() ? (infoSnap.val().unread || 0) : 0;

  await infoRef.set({
    name: senderName,
    phoneNumber: senderPhone,
    lastMessage: text,
    updatedAt: timestamp,
    unread: currentUnread + 1,
  });

  console.log(`📩 [${messageType}] From ${senderName} (${senderPhone}): ${text.substring(0, 60)}`);

  // ─── 🔌 D. HAND OFF TO THE FLOW ENGINE ───
  try {
    // 👇 NAYA CODE: Check if AI Bot is active using Prisma
    const settings = await prisma.systemSettings.findUnique({ where: { id: "main_settings" } });

    // Agar AI bot ON nahi hai, tabhi flow engine chalega
    if (!settings?.isAiBotActive) {
      if (interactive?.type === "button_reply") {
        await runFlowEngine(phoneId, senderPhone, { type: "button_reply", value: interactive.id });
      } else if (interactive?.type === "list_reply") {
        await runFlowEngine(phoneId, senderPhone, { type: "list_reply", value: interactive.id });
      } else if (button?.payload) {
        // Older template quick-reply buttons come through as message.button, not message.interactive
        await runFlowEngine(phoneId, senderPhone, { type: "button_reply", value: button.payload });
      } else if (messageType === "text") {
        await runFlowEngine(phoneId, senderPhone, { type: "text", value: text });
      }
    } else {
      console.log(`🤖 AI Bot is active. Skipping visual Flow Engine for ${senderPhone}.`);
      // Future me Gemini AI ka code yahan aayega
    }
  } catch (engineError) {
    // Flow engine failing should NEVER break webhook ack — Meta doesn't care about your bot logic,
    // it just wants 200 back. Log it and move on.
    console.error("Flow engine error:", engineError);
  }
}

// ─── Handle Status Update ───
async function handleStatusUpdate(phoneId: string, status: any) {
  const recipientPhone = status.recipient_id;
  const metaId = status.id;
  const newStatus = status.status; // 'sent', 'delivered', 'read', 'failed'
  const timestamp = parseInt(status.timestamp) * 1000;

  // Find message by metaId and update status in Firebase
  const messagesRef = db.ref(`chats/${phoneId}/${recipientPhone}/messages`);
  const snapshot = await messagesRef.orderByChild("metaId").equalTo(metaId).once("value");

  if (snapshot.exists()) {
    snapshot.forEach((childSnapshot) => {
      childSnapshot.ref.update({
        status: newStatus,
        statusTimestamp: timestamp,
      });
    });
    console.log(`📊 Status: ${newStatus} for msg ${metaId}`);
  } else {
    console.log(`⚠️ Message with metaId ${metaId} not found, may need sync`);
  }

  // If failed, log error details
  if (newStatus === "failed" && status.errors) {
    for (const error of status.errors) {
      console.error(`❌ Message failed: ${error.code} - ${error.title} - ${error.message}`);
    }
  }
}
