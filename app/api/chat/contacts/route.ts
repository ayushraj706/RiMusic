import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Prisma se contacts aur unka aakhri message ek sath fetch karo
    const contacts = await prisma.contact.findMany({
      orderBy: {
        lastMessageAt: "desc", // Naye message wale contacts sabse upar
      },
      include: {
        messages: {
          orderBy: { timestamp: "desc" },
          take: 1, // Sirf aakhri message uthao
          select: { body: true } // Sirf message ka text (body) chahiye
        }
      }
    });

    // 2. 🔥 FIX: Frontend ke liye format theek kiya taaki "No messages yet" na aaye
    const formattedContacts = contacts.map(c => ({
      id: c.id,
      name: c.name || c.phoneNumber,
      phoneNumber: c.phoneNumber,
      unread: c.unreadCount,
      lastMessageAt: c.lastMessageAt,
      // Agar purana message hai toh wo dikhao, warna "Start a conversation" dikhao
      lastMessage: c.messages.length > 0 ? c.messages[0].body : "Start a conversation",
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.id}`
    }));

    return NextResponse.json(formattedContacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}
