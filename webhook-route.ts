import { type NextRequest, NextResponse } from "next/server";
import { ref, set, push } from "firebase/database";
import { database } from "@/lib/firebase";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "basekey_verify_token";

// GET — Webhook verification (Meta calls this when registering webhook)
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified successfully");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// POST — Receive incoming messages & status updates
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Process each entry
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        const phoneId = value.metadata?.phone_number_id;

        if (!phoneId) continue;

        // Handle incoming messages
        if (value.messages) {
          for (const message of value.messages) {
            await handleIncomingMessage(phoneId, message);
          }
        }

        // Handle status updates (sent, delivered, read)
        if (value.statuses) {
          for (const status of value.statuses) {
            await handleStatusUpdate(phoneId, status);
          }
        }
      }
    }

    // Always return 200 quickly — Meta retries on failure
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ status: "error" }, { status: 200 }); // Still return 200 to prevent retries
  }
}

async function handleIncomingMessage(phoneId: string, message: any) {
  const from = message.from; // Sender phone number (without +)
  const messageId = message.id;
  const timestamp = parseInt(message.timestamp) * 1000; // Convert to ms
  const messageType = message.type;

  let text = "";
  let mediaUrl = null;

  // Extract message content based on type
  switch (messageType) {
    case "text":
      text = message.text?.body || "";
      break;
    case "image":
      text = message.image?.caption || "📷 Image";
      mediaUrl = message.image?.id;
      break;
    case "video":
      text = message.video?.caption || "🎥 Video";
      mediaUrl = message.video?.id;
      break;
    case "audio":
      text = "🎵 Audio message";
      mediaUrl = message.audio?.id;
      break;
    case "document":
      text = message.document?.caption || `📄 ${message.document?.filename || "Document"}`;
      mediaUrl = message.document?.id;
      break;
    case "location":
      const loc = message.location;
      text = `📍 Location: ${loc?.latitude}, ${loc?.longitude}`;
      break;
    case "button":
      text = message.button?.text || "Button clicked";
      break;
    case "interactive":
      text = message.interactive?.button_reply?.title || "Interactive response";
      break;
    default:
      text = `📎 ${messageType} message`;
  }

  // Save message to Firebase
  const msgRef = ref(database, `chats/${phoneId}/${from}/messages`);
  const newMsgRef = push(msgRef);

  await set(newMsgRef, {
    text,
    sender: "them",
    time: new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    timestamp,
    status: "delivered",
    metaId: messageId,
    type: messageType,
    mediaUrl,
  });

  // Update contact info
  const infoRef = ref(database, `chats/${phoneId}/${from}/info`);
  await set(infoRef, {
    name: from,
    phoneNumber: from,
    lastMessage: text,
    updatedAt: timestamp,
    unread: 1, // Will be cleared when user opens chat
  });

  console.log(`📩 Received message from ${from}: ${text.substring(0, 50)}...`);
}

async function handleStatusUpdate(phoneId: string, status: any) {
  const messageId = status.id;
  const statusValue = status.status; // sent, delivered, read, failed
  const recipientId = status.recipient_id;

  // Find and update message status in Firebase
  // This requires storing messageId -> Firebase key mapping
  // For now, we'll log it
  console.log(`📊 Status update: ${messageId} -> ${statusValue} for ${recipientId}`);
}
