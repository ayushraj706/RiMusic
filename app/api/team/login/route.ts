import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and Password are required" }, { status: 400 });
    }

    // Database mein check karo ki is email ka agent hai ya nahi
    const agent = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (!agent) {
      return NextResponse.json({ error: "No agent found with this email" }, { status: 404 });
    }

    // Password check karo (Abhi direct match kar rahe hain)
    if (agent.passwordHash !== password) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    // Agar sab sahi hai, toh Agent ka data bhej do
    return NextResponse.json({ 
      success: true, 
      agent: { id: agent.id, name: agent.name, role: agent.role } 
    });

  } catch (error) {
    console.error("Agent Login Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
