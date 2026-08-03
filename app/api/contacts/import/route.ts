import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { contacts } = await req.json();
    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ error: "No contacts provided" }, { status: 400 });
    }

    // Upsert loop taaki duplicate numbers over-write ho jayein (error na aaye)
    for (const c of contacts) {
      await prisma.contact.upsert({
        where: { phoneNumber: c.phoneNumber },
        update: {
          name: c.name,
          email: c.email || null,
          source: c.source
        },
        create: {
          phoneNumber: c.phoneNumber,
          name: c.name,
          email: c.email || null,
          source: c.source
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Import Error:", error);
    return NextResponse.json({ error: "Failed to import contacts" }, { status: 500 });
  }
}
