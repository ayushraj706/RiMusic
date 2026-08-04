import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import FacebookProvider from "next-auth/providers/facebook";
import TwitterProvider from "next-auth/providers/twitter";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

// Database connect karne ke liye single instance
const prisma = new PrismaClient();

const handler = NextAuth({
  // 🔥 sabse zaroori: NextAuth ka official Prisma Adapter taaki Account, Session tables automatic sync rahein
  adapter: PrismaAdapter(prisma),
  
  providers: [
    // 1. Google Setup
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true, // 🔥 NAYA: Same email wale accounts ko jodne dega
    }),
    
    // 2. GitHub Setup
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
      allowDangerousEmailAccountLinking: true, // 🔥 NAYA
    }),
    
    // 3. Facebook Setup
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID as string,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true, // 🔥 NAYA
    }),
    
    // 4. X (Twitter) Setup
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID as string,
      clientSecret: process.env.TWITTER_CLIENT_SECRET as string,
      version: "2.0",
      allowDangerousEmailAccountLinking: true, // 🔥 NAYA
    }),
  ],
  
  callbacks: {
    // Jab user login karega tab yeh check karega
    async signIn({ user, account, profile }) {
      if (!user.email) return true;

      // Check karo kya user pehle se database mein hai?
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!existingUser) {
        // Agar naya user hai toh usko ADMIN bana kar insert kar do
        await prisma.user.create({
          data: {
            name: user.name || "Business Owner",
            email: user.email,
            image: user.image,
            passwordHash: "SOCIAL_LOGIN",
            role: "ADMIN",
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
      } else {
        // Agar purana user hai toh uska status update kar do
        await prisma.user.update({
          where: { email: user.email },
          data: {
            status: "ONLINE",
            currentActivity: "Active via " + account?.provider,
          },
        });
      }
      return true;
    },
    
    // Token mein user ID aur role inject karna
    async jwt({ token, user }) {
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.primaryPage = dbUser.primaryPage;
        }
      }
      return token;
    },
    
    // Session mein data frontend ke liye bhejna
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.primaryPage = token.primaryPage as string;
      }
      return session;
    },
  },
  
  pages: {
    signIn: '/login', 
    error: '/login',  
  },
  
  session: {
    strategy: "jwt", 
  },
  
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
