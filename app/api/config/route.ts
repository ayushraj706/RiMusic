import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { accessToken, phoneNumberId, businessAccountId, verifyToken } = body;

    if (!accessToken || !phoneNumberId || !businessAccountId || !verifyToken) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Prisma: Update the main settings row (upsert ensures it creates it if it doesn't exist)
    const settings = await prisma.systemSettings.upsert({
      where: { id: "main_settings" },
      update: {
        accessToken,
        phoneNumberId,
        businessAccountId,
        verifyToken,
      },
      create: {
        id: "main_settings",
        accessToken,
        phoneNumberId,
        businessAccountId,
        verifyToken,
      },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Error saving config:", error);
    return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 });
  }
}
