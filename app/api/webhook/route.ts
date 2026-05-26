import { NextResponse } from "next/server";
import { database } from "../../../lib/firebase"; // Dhyan de, path sahi hona chahiye
import { ref, push, set } from "firebase/database";

// 1. GET Request: Meta Webhook Verification (Ye ekdam perfect hai)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token && token.startsWith("BASEKEY_")) {
      console.log("Webhook verified via Meta!");
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
    return new Response("Forbidden", { status: 403 });
  } catch (error) {
    return new Response("Error", { status: 500 });
  }
}

// 2. POST Request: Asli Messages aur Ticks yahan aayenge!
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check karo ki payload WhatsApp Business API se hi aaya hai
    if (body.object === "whatsapp_business_account") {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0]?.value;

      if (!changes) return new NextResponse("EVENT_RECEIVED", { status: 200 });

      const phoneId = changes.metadata?.phone_number_id; // Aapki Meta Phone ID

      // ==========================================
      // A. AGAR KOI NAYA MESSAGE AAYA HAI (Receive)
      // ==========================================
      if (changes.messages && changes.messages.length > 0) {
        const message = changes.messages[0];
        const contact = changes.contacts?.[0];
        
        const senderPhone = message.from; // Customer ka number
        const messageText = message.text?.body || "[Media/Unsupported Message]"; 
        const senderName = contact?.profile?.name || senderPhone; // Customer ka WhatsApp naam

        // 1. Message ko Firebase me save karo
        const chatRef = ref(database, `chats/${phoneId}/${senderPhone}/messages`);
        const newMessageRef = push(chatRef);
        await set(newMessageRef, {
          id: message.id,
          text: messageText,
          sender: "them", // 'them' yani customer ne bheja hai
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now()
        });

        // 2. Sidebar me dikhane ke liye Last Message update karo
        const infoRef = ref(database, `chats/${phoneId}/${senderPhone}/info`);
        await set(infoRef, {
          name: senderName,
          phoneNumber: senderPhone,
          lastMessage: messageText,
          updatedAt: Date.now(),
          unread: 1 // Naya message aaya hai toh unread count 1 kar do
        });

        console.log(`✅ New Message Saved from ${senderName}: ${messageText}`);
      }

      // ==========================================
      // B. AGAR MESSAGE KA STATUS AAYA HAI (Ticks ✓✓)
      // ==========================================
      if (changes.statuses && changes.statuses.length > 0) {
        const statusObj = changes.statuses[0];
        const recipientPhone = statusObj.recipient_id; 
        const messageId = statusObj.id;
        const messageStatus = statusObj.status; // 'sent', 'delivered', ya 'read' (Blue Tick)

        console.log(`👀 Message status for ${recipientPhone} updated to: ${messageStatus}`);
        
        // TODO: Aage chalkar hum is status ko Firebase me update karenge 
        // taaki Dashboard me turant grey tick se Blue Tick ban jaye!
      }
    }

    // Meta ko hamesha '200 OK' bhejna bohot zaruri hai, warna wo error samajh kar baar-baar bhejega
    return new NextResponse("EVENT_RECEIVED", { status: 200 });
  } catch (error) {
    console.error("Webhook POST Error:", error);
    return new NextResponse("Error", { status: 500 });
  }
}
