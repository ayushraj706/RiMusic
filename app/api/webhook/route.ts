export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    // Meta Webhook Verification Condition
    if (mode === "subscribe" && token && token.startsWith("BASEKEY_")) {
      console.log("Webhook verified via Meta!");
      
      // Meta ka sabse bada nakhra: Use sirf raw text mein challenge number chahiye
      return new Response(challenge, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    // Agar token match nahi hua toh Meta ko reject kar do
    return new Response("Forbidden", { status: 403 });
  } catch (error) {
    return new Response("Error", { status: 500 });
  }
}

// Ye aage chalkar messages receive karne ke kaam aayega
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("New Message:", body);
    return new Response("EVENT_RECEIVED", { status: 200 });
  } catch (error) {
    return new Response("Error", { status: 500 });
  }
}
