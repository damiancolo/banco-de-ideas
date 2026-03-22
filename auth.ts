import NextAuth from 'next-auth';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { getMongoClient } from '@/lib/auth-client';

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: MongoDBAdapter(getMongoClient()),
    providers: [
        {
            id: "google",
            name: "Google",
            type: "oauth",
            authorization: {
                url: "https://accounts.google.com/o/oauth2/v2/auth",
                params: { scope: "email profile" },
            },
            token: "https://oauth2.googleapis.com/token",
            userinfo: "https://www.googleapis.com/oauth2/v2/userinfo",
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            checks: ["pkce", "state"],
            profile(profile) {
                return {
                    id: profile.id,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                };
            },
        },
    ],
    session: { strategy: 'jwt' },
    trustHost: true,
    pages: {
        signIn: '/privado',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        session({ session, token }) {
            if (session.user && token.id) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
});
