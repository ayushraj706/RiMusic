import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1. GET: Saare team members (Admin + Agents) ki list laane ke liye
export async function GET() {
  try {
    // Yahan se 'where' condition hata di gayi hai taaki Admin aur Agent dono load ho sakein
    const team = await prisma.user.findMany({
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(team);
  } catch (error) {
    console.error("GET Team Error:", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

// 2. POST: Naya Team Member (Admin ya Agent) add karne ke liye
export async function POST(req: Request) {
  try {
    // Frontend se naye fields receive karna (Role, Access, etc.)
    const { name, email, password, role, allowedPages, primaryPage } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required!" }, { status: 400 });
    }

    // Check agar email pehle se database mein exist karti hai
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "This email is already in use!" }, { status: 400 });
    }

    // Database mein naya user save karna advanced settings ke sath
    const newMember = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: password, 
        role: role || "AGENT", // Default to Agent
        allowedPages: allowedPages && allowedPages.length > 0 ? allowedPages : ["/chat", "/contacts"],
        primaryPage: primaryPage || "/chat",
        status: "OFFLINE",
        currentActivity: "Account Created" // Live tracking system ke liye default tag
      }
    });

    return NextResponse.json(newMember);
  } catch (error) {
    console.error("POST Team Error:", error);
    return NextResponse.json({ error: "Failed to create team member" }, { status: 500 });
  }
}

// 3. DELETE: Kisi bhi user (Admin/Agent) ko system se hatane ke liye
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    
    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Team Error:", error);
    return NextResponse.json({ error: "Failed to delete member" }, { status: 500 });
  }
}
