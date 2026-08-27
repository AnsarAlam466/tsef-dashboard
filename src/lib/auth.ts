import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import User from "@/models/User";

const failedAttempts = new Map<string, { count: number; firstAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(email: string) {
  const entry = failedAttempts.get(email);
  if (!entry || Date.now() - entry.firstAt > WINDOW_MS) return false;
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(email: string) {
  const entry = failedAttempts.get(email);
  if (!entry || Date.now() - entry.firstAt > WINDOW_MS) {
    failedAttempts.set(email, { count: 1, firstAt: Date.now() });
  } else {
    entry.count++;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "").toLowerCase().trim();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;
        if (isRateLimited(email)) return null;

        await connectDB();
        const user = await User.findOne({ email });
        if (!user) {
          recordFailure(email);
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          recordFailure(email);
          return null;
        }

        failedAttempts.delete(email);
        logAudit(
          { user: { id: user._id.toString(), name: user.name } },
          "login",
          "user",
          user._id.toString(),
          `${user.name} logged in`
        );

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          avatarColor: user.avatarColor,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.department = (user as { department?: string }).department;
        token.avatarColor = (user as { avatarColor?: string }).avatarColor;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.department = token.department as string;
        session.user.avatarColor = token.avatarColor as string;
      }
      return session;
    },
  },
});
