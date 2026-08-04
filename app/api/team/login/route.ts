import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and Password are required" }, { status: 400 });
    }

    // Database mein check karo ki is email ka user (Admin ya Agent) hai ya nahi
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (!user) {
      return NextResponse.json({ error: "No user found with this email" }, { status: 404 });
    }

    // Password check karo (Abhi direct match kar rahe hain)
    if (user.passwordHash !== password) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    // 🔥 NAYA: Agar sab sahi hai, toh User ka data (primaryPage aur allowedPages ke sath) bhej do
    return NextResponse.json({ 
      success: true, 
      agent: { 
        id: user.id, 
        name: user.name, 
        role: user.role,
        primaryPage: user.primaryPage || "/chat",
        allowedPages: user.allowedPages || [] 
      } 
    });

  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
