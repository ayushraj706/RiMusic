import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    const validOtp = await prisma.otpCode.findUnique({
      where: { email_code: { email, code: otp } },
    });

    if (!validOtp) {
      return NextResponse.json({ error: "Invalid OTP. Please check the code." }, { status: 400 });
    }

    if (validOtp.expiresAt < new Date()) {
      return NextResponse.json({ error: "OTP has expired. Request a new one." }, { status: 400 });
    }

    // OTP sahi hai, par abhi delete mat karo kyunki final registration me bhi verify karna hai
    return NextResponse.json({ success: true, message: "OTP Verified!" }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
