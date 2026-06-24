import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { loginSchema } from "./validation";

const config: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/auth" },
  trustHost: true,
  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
      authorization: { params: { prompt: "select_account" } },
    }),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await db.user.findUnique({
          where: { email },
          include: { authIdentities: { where: { provider: "EMAIL" } } },
        });
        const identity = user?.authIdentities[0];
        if (!user || user.deletedAt || !identity?.passwordHash) return null;
        if (!user.emailVerified) return null;

        const ok = await bcrypt.compare(password, identity.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Credentials sign-in: `user.id` is already our DB id.
      if (account?.provider === "credentials" && user?.id) {
        token.uid = user.id;
      }
      // Google sign-in: `user.id` is Google's id, so resolve/upsert our user.
      else if (account?.provider === "google" && profile?.sub) {
        token.uid = await resolveGoogleUser({
          sub: profile.sub,
          email: String(profile.email),
          emailVerified: Boolean(profile.email_verified),
          name: (profile.name as string | undefined) ?? "Người chơi",
          picture: profile.picture as string | undefined,
        });
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid && session.user) session.user.id = token.uid as string;
      return session;
    },
  },
};

async function resolveGoogleUser(p: {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
}): Promise<string> {
  const existing = await db.authIdentity.findUnique({
    where: { provider_providerSubject: { provider: "GOOGLE", providerSubject: p.sub } },
  });
  if (existing) return existing.userId;

  // Link to a verified email account if one exists (FR-AUTH-05).
  const byEmail = await db.user.findUnique({ where: { email: p.email } });
  const user =
    byEmail ??
    (await db.user.create({
      data: {
        email: p.email,
        emailVerified: p.emailVerified ? new Date() : null,
        displayName: p.name,
        avatarUrl: p.picture ?? null,
      },
    }));

  await db.authIdentity.create({
    data: {
      userId: user.id,
      provider: "GOOGLE",
      providerSubject: p.sub,
      verifiedAt: p.emailVerified ? new Date() : null,
    },
  });
  return user.id;
}

export const { handlers, auth, signIn, signOut } = NextAuth(config);
