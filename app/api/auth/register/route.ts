import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, otp, password } = await req.json();

    if (!email || !otp || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1. Verify OTP (Database me check karo)
    const validOtp = await prisma.otpCode.findUnique({
      where: { email_code: { email, code: otp } },
    });

    if (!validOtp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    if (validOtp.expiresAt < new Date()) {
      await prisma.otpCode.delete({ where: { id: validOtp.id } });
      return NextResponse.json({ error: "OTP has expired" }, { status: 400 });
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered. Please login." }, { status: 400 });
    }

    // 3. Password ko hash (encrypt) karo
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Database me Naya User Create karo
    await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name: "Business Owner", 
        role: "ADMIN",
        emailVerified: new Date(),
        allowedPages: [
          "/dashboard", "/chat", "/contacts", "/campaigns", "/chatbot-builder", "/template", "/settings"
        ],
        primaryPage: "/dashboard",
        status: "ONLINE",
        currentActivity: "Registered via BaseKey Auth",
      }
    });

    // 5. Use hone ke baad OTP delete kar do
    await prisma.otpCode.delete({ where: { id: validOtp.id } });

    return NextResponse.json({ success: true, message: "Registration successful" }, { status: 200 });

  } catch (error) {
    console.error("Register API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
