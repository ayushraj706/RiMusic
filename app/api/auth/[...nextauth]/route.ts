import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import FacebookProvider from "next-auth/providers/facebook";
import TwitterProvider from "next-auth/providers/twitter";
import { PrismaClient } from "@prisma/client";

// Database connect karne ke liye
const prisma = new PrismaClient();

const handler = NextAuth({
  providers: [
    // 1. Google Setup
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    
    // 2. GitHub Setup
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    
    // 3. Facebook Setup
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID as string,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
    }),
    
    // 4. X (Twitter) Setup
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID as string,
      clientSecret: process.env.TWITTER_CLIENT_SECRET as string,
      version: "2.0", // Twitter OAuth 2.0 version use karta hai
    }),
  ],
  
  callbacks: {
    // Jab user kisi bhi social button par click karke login karega
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      // Check karo ki kya yeh user hamare Prisma database mein pehle se hai?
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      // Agar user naya hai, toh usko Database mein SAVE kar lo as an ADMIN
      if (!existingUser) {
        await prisma.user.create({
          data: {
            name: user.name || "Unknown",
            email: user.email,
            passwordHash: "SOCIAL_LOGIN", // Social login mein password nahi hota
            role: "ADMIN", // Business Owner tab se login ho raha hai, isliye ADMIN
            allowedPages: [
              "/dashboard", 
              "/chat", 
              "/contacts", 
              "/campaigns", 
              "/chatbot-builder", 
              "/template", 
              "/settings"
            ],
            primaryPage: "/dashboard",
            status: "ONLINE",
            currentActivity: "Logged in via " + account?.provider,
          },
        });
      }
      return true;
    },
    
    // Token mein user ka data set karna
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.primaryPage = dbUser.primaryPage;
        }
      }
      return token;
    },
    
    // Session mein data bhejta hai taaki frontend par access kar sakein
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.primaryPage = token.primaryPage;
      }
      return session;
    },
  },
  
  pages: {
    signIn: '/login', // Custom login page ka rasta
    error: '/login',  // Error aaye toh wapas login par bhej do
  },
  
  session: {
    strategy: "jwt", // Token based secure session
  },
  
  secret: process.env.NEXTAUTH_SECRET,
});

// Next.js App Router ke liye GET aur POST export karna zaroori hai
export { handler as GET, handler as POST };
