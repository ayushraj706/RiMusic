import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1. Verify OTP
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

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Hash New Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Update User Password in DB
    await prisma.user.update({
      where: { email },
      data: { passwordHash: hashedPassword }
    });

    // 4. Delete used OTP
    await prisma.otpCode.delete({ where: { id: validOtp.id } });

    return NextResponse.json({ success: true, message: "Password updated successfully" }, { status: 200 });

  } catch (error) {
    console.error("Reset Password API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
