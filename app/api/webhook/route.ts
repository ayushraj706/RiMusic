import { NextResponse } from "next/server";
import * as admin from "firebase-admin";

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

const db = admin.database();

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "BASEKEY_YOUR_SECRET_TOKEN";

// ─── GET: Webhook Verification ───
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified successfully");
    return new Response(challenge, { status: 200 });
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

  // Save message to Firebase
  const chatRef = db.ref(`chats/${phoneId}/${senderPhone}/messages`);
  const newMsgRef = await chatRef.push({
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

  // Update contact info
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
}

// ─── Handle Status Update ───
async function handleStatusUpdate(phoneId: string, status: any) {
  const recipientPhone = status.recipient_id;
  const metaId = status.id;
  const newStatus = status.status; // 'sent', 'delivered', 'read', 'failed'
  const timestamp = parseInt(status.timestamp) * 1000;

  // Find message by metaId and update status
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
    // If metaId not found, try to find by timestamp range (fallback)
    console.log(`⚠️ Message with metaId ${metaId} not found, may need sync`);
  }

  // If failed, log error details
  if (newStatus === "failed" && status.errors) {
    for (const error of status.errors) {
      console.error(`❌ Message failed: ${error.code} - ${error.title} - ${error.message}`);
    }
  }
}
