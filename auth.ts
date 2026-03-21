import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { getMongoClient } from '@/lib/auth-client';

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: MongoDBAdapter(getMongoClient()),
    providers: [Google],
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
