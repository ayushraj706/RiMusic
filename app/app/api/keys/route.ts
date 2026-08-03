import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1. Saari API Keys Fetch Karne Ke Liye
export async function GET() {
  try {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(keys);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch keys" }, { status: 500 });
  }
}

// 2. Nayi API Key Banane Ke Liye (With Expiry)
export async function POST(req: Request) {
  try {
    const { templateName, expiryDays } = await req.json();

    // Secure token generate karna (UUID format mix karke)
    const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const token = `bk_live_${randomString}`;

    // Expiry Date calculate karna
    let expiresAt = null;
    if (expiryDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(expiryDays)); // Aaj ki date mein din jod do
    }

    const newKey = await prisma.apiKey.create({
      data: {
        name: templateName,
        token: token,
        expiresAt: expiresAt,
      },
    });

    return NextResponse.json(newKey);
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate key" }, { status: 500 });
  }
}

// 3. API Key Delete / Revoke Karne Ke Liye
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.apiKey.delete({
      where: { id: id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete key" }, { status: 500 });
  }
}
