import NextAuth, { type Session } from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { NextResponse } from 'next/server';
import { isAllowlistedAdmin } from '@/lib/admin-allowlist';

export { isAllowlistedAdmin };

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      githubId?: string;
      githubLogin?: string;
      isAdmin: boolean;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        const ghProfile = profile as { id?: number | string; login?: string };
        if (ghProfile.id !== undefined) {
          token.githubId = String(ghProfile.id);
        }
        if (typeof ghProfile.login === 'string') {
          token.githubLogin = ghProfile.login;
        }
      }
      return token;
    },
    async session({ session, token }) {
      const githubId = typeof token.githubId === 'string' ? token.githubId : undefined;
      const githubLogin = typeof token.githubLogin === 'string' ? token.githubLogin : undefined;
      session.user.githubId = githubId;
      session.user.githubLogin = githubLogin;
      session.user.isAdmin = isAllowlistedAdmin({ githubId, githubLogin });
      return session;
    },
  },
});

export type AdminAuthResult =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse };

export async function requireAdmin(): Promise<AdminAuthResult> {
  const session = await auth();
  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }

  if (!session.user.isAdmin) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 }),
    };
  }

  return { ok: true, session };
}
