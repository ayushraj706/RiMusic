import { NextResponse } from "next/server";
import * as admin from "firebase-admin";

// ─── Initialize Firebase Admin ───
if (!admin.apps.length) {
  try {
    // .env से सर्विस अकाउंट JSON को पार्स कर रहे हैं
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  } catch (error) {
    console.error("Firebase Admin Initialization Error. Check your FIREBASE_SERVICE_ACCOUNT_KEY:", error);
  }
}

const db = admin.database();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === "BASEKEY_YOUR_SECRET_TOKEN") {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.object === "whatsapp_business_account") {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0]?.value;
      if (!changes) return new NextResponse("EVENT_RECEIVED", { status: 200 });

      const phoneId = changes.metadata?.phone_number_id;

      // ─── A. RECEIVED MESSAGE LOGIC ───
      if (changes.messages) {
        const message = changes.messages[0];
        const senderPhone = message.from;
        const senderName = changes.contacts?.[0]?.profile?.name || senderPhone;
        const messageText = message.text?.body || "[Media]";

        // Save Message (Admin SDK syntax)
        const chatRef = db.ref(`chats/${phoneId}/${senderPhone}/messages`);
        await chatRef.push({
          metaId: message.id, // Important: Meta ka ID yahan store karo
          text: messageText,
          sender: "them",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
          status: "received"
        });

        // Update Info (Unread Count increment) (Admin SDK syntax)
        const infoRef = db.ref(`chats/${phoneId}/${senderPhone}/info`);
        const infoSnap = await infoRef.once("value");
        const currentUnread = infoSnap.exists() ? (infoSnap.val().unread || 0) : 0;

        await infoRef.set({
          name: senderName,
          phoneNumber: senderPhone,
          lastMessage: messageText,
          updatedAt: Date.now(),
          unread: currentUnread + 1
        });
      }

      // ─── B. STATUS UPDATE LOGIC (Ticks) ───
      if (changes.statuses) {
        const statusObj = changes.statuses[0];
        const recipientPhone = statusObj.recipient_id;
        const metaId = statusObj.id;
        const newStatus = statusObj.status; // 'sent', 'delivered', 'read'

        // Firebase mein us message ko dhoondo jiska metaId match kare (Admin SDK syntax)
        const messagesRef = db.ref(`chats/${phoneId}/${recipientPhone}/messages`);
        const snapshot = await messagesRef.orderByChild("metaId").equalTo(metaId).once("value");

        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            childSnapshot.ref.update({ status: newStatus });
          });
          console.log(`✅ Status updated to ${newStatus} for message ${metaId}`);
        }
      }
    }

    return new NextResponse("EVENT_RECEIVED", { status: 200 });
  } catch (error) {
    console.error("Webhook Error:", error);
    return new NextResponse("Error", { status: 500 });
  }
}
