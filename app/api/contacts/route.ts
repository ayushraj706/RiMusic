import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1. Data dikhane ke liye (GET)
export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}

// 2. Data delete karne ke liye (DELETE)
export async function DELETE(req: Request) {
  try {
    const { ids } = await req.json();
    if (!ids || ids.length === 0) return NextResponse.json({ error: "No IDs provided" }, { status: 400 });

    await prisma.contact.deleteMany({
      where: { id: { in: ids } }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete contacts" }, { status: 500 });
  }
}

