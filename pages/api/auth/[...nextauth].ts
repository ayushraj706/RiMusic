import NextAuth, { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import GithubProvider from "next-auth/providers/github";
import TwitterProvider from "next-auth/providers/twitter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs"; // Dhyan rahe: Vercel ke liye 'bcryptjs' install karna, 'bcrypt' nahi
import prisma from "@/lib/prisma"; // Tumhara prisma client ka path

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt", // Credentials use karne ke liye JWT zaroori hai
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login", // Jo custom login page humne banaya tha
    error: "/login",
  },
  providers: [
    // --- 1. SOCIAL PROVIDERS ---
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Taki Social aur Custom Email ek sath jud jayein
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0", // Twitter OAuth 2.0 ke liye
      allowDangerousEmailAccountLinking: true,
    }),

    // --- 2. CREDENTIALS PROVIDER (Email+Password & Email+OTP) ---
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
        loginType: { label: "Login Type", type: "text" }, // "password" ya "otp"
      },
      async authorize(credentials) {
        if (!credentials?.email) throw new Error("Email is required");

        const email = credentials.email.toLowerCase();
        const { password, otp, loginType } = credentials;

        // User ko database me dhundho
        let user = await prisma.user.findUnique({
          where: { email },
        });

        // 🟢 LOGIC A: Agar user ne "OTP" se login kiya hai
        if (loginType === "otp") {
          if (!otp) throw new Error("OTP is required");

          // OTP check karo jo neon DB me save kiya tha
          const validOtp = await prisma.otpCode.findUnique({
            where: {
              email_code: { email, code: otp },
            },
          });

          if (!validOtp) throw new Error("Invalid OTP");

          // Expiry check karo
          if (validOtp.expiresAt < new Date()) {
            await prisma.otpCode.delete({ where: { id: validOtp.id } }); // Delete expired OTP
            throw new Error("OTP has expired. Please request a new one.");
          }

          // OTP verify ho gaya, usko delete kar do taaki dobara use na ho
          await prisma.otpCode.delete({ where: { id: validOtp.id } });

          // Agar OTP sahi hai par user pehli baar aaya hai (Signup)
          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                emailVerified: new Date(),
                role: "AGENT", // Default role
              },
            });
          } else if (!user.emailVerified) {
            // Agar user hai par email verify nahi thi, toh ab kar do
            user = await prisma.user.update({
              where: { email },
              data: { emailVerified: new Date() },
            });
          }

          return user; 
        }

        // 🔵 LOGIC B: Agar user ne "PASSWORD" se login kiya hai
        if (loginType === "password") {
          if (!password) throw new Error("Password is required");

          // Agar user nahi mila ya usne sirf social se login kiya tha (password nahi banaya)
          if (!user) throw new Error("No account found with this email");
          if (!user.passwordHash) throw new Error("Please login with Social Media or OTP to set a password.");

          // Password Check (bcryptjs ka use karke)
          const isValidPassword = await bcrypt.compare(password, user.passwordHash);
          if (!isValidPassword) throw new Error("Incorrect password");

          return user;
        }

        throw new Error("Invalid login type");
      },
    }),
  ],
  callbacks: {
    // JWT me database se user ka role aur id daalna
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        // Typescript error bachane ke liye (as any) ya proper types define kar sakte ho
        token.role = (user as any).role || "AGENT"; 
      }
      return token;
    },
    // Session me un details ko frontend ke liye bhejna
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET, // Ye .env me zaroor hona chahiye
};

export default NextAuth(authOptions);
