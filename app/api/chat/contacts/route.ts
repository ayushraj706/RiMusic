// App/api/chat/contacts/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Prisma se saare contacts fetch karo, latest message ke hisaab se sort karke
    const contacts = await prisma.contact.findMany({
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}

