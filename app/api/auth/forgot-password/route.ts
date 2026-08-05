import { NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto"; // Secure token generate karne ke liye inbuilt Node.js module
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient(); // Apna Prisma client path check kar lena

const resend = new Resend(process.env.RESEND_API_KEY);

// 🎨 PREMIUM FORGOT PASSWORD EMAIL TEMPLATE
const getResetEmailTemplate = (resetLink: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 500px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #f3f4f6; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background-color: #111827; padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px; }
    .content { padding: 32px 24px; text-align: center; color: #111827; }
    .content p { font-size: 16px; line-height: 1.5; color: #4b5563; margin-top: 0; margin-bottom: 24px; }
    .btn { display: inline-block; background-color: #00A884; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 16px; transition: background-color 0.2s; }
    .btn:hover { background-color: #009172; }
    .footer { padding: 24px; text-align: center; font-size: 13px; color: #9ca3af; border-top: 1px solid #f3f4f6; background-color: #f9fafb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BaseKey</h1>
    </div>
    <div class="content">
      <h2 style="margin-top: 0; font-size: 20px;">Reset Your Password</h2>
      <p>We received a request to reset your password for your BaseKey account. Click the button below to set a new password.</p>
      
      <a href="${resetLink}" class="btn">Reset Password</a>
      
      <p style="font-size: 14px; margin-top: 24px; margin-bottom: 0;">This link is valid for <strong>15 minutes</strong>. If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      Secured by BaseKey Infrastructure<br>
      © ${new Date().getFullYear()} BaseKey. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Check karo ki user database mein hai ya nahi
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Security practice: Agar user nahi hai, tab bhi success message do
    // Taki hackers ko pata na chale ki ye email registered hai ya nahi
    if (!user) {
      return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent." }, { status: 200 });
    }

    // 2. 64-character ka ek secure random token generate karo
    const token = crypto.randomBytes(32).toString("hex");
    
    // 3. Expiry time set karo (Current time + 15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // 4. Purane tokens delete karke naya save karo (Database cleanup)
    await prisma.passwordResetToken.deleteMany({
      where: { email }
    });

    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt
      }
    });

    // 5. Dynamic Reset Link Banao (Production vs Localhost)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://basekey.in"; // Apni actual domain check kar lena
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    // 6. Resend se Email bhejo
    const { data, error } = await resend.emails.send({
      from: 'BaseKey Support <support@basekey.in>', // Custom domain email
      to: [email],
      subject: 'Reset your BaseKey Password',
      html: getResetEmailTemplate(resetLink),
    });

    if (error) {
      console.error("Resend Error:", error);
      return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent." }, { status: 200 });

  } catch (error) {
    console.error("Forgot Password API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
