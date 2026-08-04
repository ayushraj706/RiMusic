import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";

const prisma = new PrismaClient();

// GET: Saare Campaigns load karne ke liye
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ campaigns });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

// POST: Naya Campaign banakar WhatsApp par bhejne ke liye
export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, audienceType, template, status } = await req.json();

    // 1. Audience Count calculate karo (For now counting all contacts)
    const contactsCount = await prisma.contact.count();

    // 2. Database me naya Campaign Save karo
    const newCampaign = await prisma.campaign.create({
      data: {
        name,
        template,
        status: status || "running",
        audience: contactsCount,
        // (Asli production me yahan se WhatsApp API ko trigger jayega)
      }
    });

    return NextResponse.json({ success: true, campaign: newCampaign });
  } catch (error) {
    console.error("Campaign creation error:", error);
    return NextResponse.json({ error: "Creation failed" }, { status: 500 });
  }
}
