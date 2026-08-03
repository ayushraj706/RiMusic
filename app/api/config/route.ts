import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1. GET: Frontend ko config bhejne ke liye (Templates fetch karne ke liye bahut zaroori hai)
export async function GET() {
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "main_settings" },
    });

    if (!settings) {
      return NextResponse.json({ error: "Settings not found" }, { status: 404 });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching config:", error);
    return NextResponse.json({ error: "Failed to fetch configuration" }, { status: 500 });
  }
}

// 2. POST: Naya config database mein save karne ke liye
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { accessToken, phoneNumberId, businessAccountId, verifyToken } = body;

    if (!accessToken || !phoneNumberId || !businessAccountId || !verifyToken) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const settings = await prisma.systemSettings.upsert({
      where: { id: "main_settings" },
      update: { 
        accessToken, 
        phoneNumberId, 
        businessAccountId, 
        verifyToken 
      },
      create: { 
        id: "main_settings", 
        accessToken, 
        phoneNumberId, 
        businessAccountId, 
        verifyToken 
      },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Error saving config:", error);
    return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 });
  }
}
