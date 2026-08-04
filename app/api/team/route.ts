import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1. GET: Saare agents ki list laane ke liye
export async function GET() {
  try {
    const agents = await prisma.user.findMany({
      where: { role: "AGENT" }, // Sirf agents ko fetch karenge
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(agents);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

// 2. POST: Naya Agent add karne ke liye
export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required!" }, { status: 400 });
    }

    // Check agar email pehle se exist karti hai
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "This email is already in use!" }, { status: 400 });
    }

    // Database mein Agent save karna
    const newAgent = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: password, // Note: Future mein hum isko Bcrypt se secure (hash) karenge
        role: "AGENT",
        status: "OFFLINE"
      }
    });

    return NextResponse.json(newAgent);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
  }
}

// 3. DELETE: Agent ko system se hatane ke liye
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete agent" }, { status: 500 });
  }
}
