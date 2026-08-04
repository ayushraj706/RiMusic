import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // 1. Check karein ki kya user logged in hai (Sirf Admin hi save kar sake)
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized! Sirf admin data save kar sakta hai." },
        { status: 401 }
      );
    }

    // 2. Frontend se bheja gaya data (JSON) receive karein
    const body = await req.json();
    const { name, isActive, nodes, edges } = body;

    // Basic validation check
    if (!nodes || !edges) {
      return NextResponse.json(
        { error: "Nodes aur Edges bhejna zaroori hai!" },
        { status: 400 }
      );
    }

    // 3. Prisma ke zariye database mein SAVE karein
    // Hum "upsert" use kar rahe hain: 
    // Agar "main_flow" pehle se hai toh UPDATE karega, warna NAYA create karega.
    // Isse aapke database mein hazaron faltu rows nahi banengi.
    const flow = await prisma.chatFlow.upsert({
      where: { 
        id: "main_flow" // Ek single main chatbot flow maintain karne ke liye
      },
      update: {
        name: name || "Main Chatbot Flow",
        isActive: isActive ?? true,
        nodes: nodes,
        edges: edges,
      },
      create: {
        id: "main_flow",
        name: name || "Main Chatbot Flow",
        isActive: isActive ?? true,
        nodes: nodes,
        edges: edges,
      },
    });

    // 4. Success message wapas frontend par bhej dein
    return NextResponse.json({ 
      success: true, 
      message: "Flow successfully Neon DB mein save ho gaya!",
      flow 
    });

  } catch (error) {
    console.error("FLOW SAVE API ERROR:", error);
    return NextResponse.json(
      { error: "Database mein save karte waqt koi error aayi." },
      { status: 500 }
    );
  }
}
