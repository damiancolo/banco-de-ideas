import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { getMongoClient } from '@/lib/auth-client';

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: MongoDBAdapter(getMongoClient()),
    providers: [Google],
    session: { strategy: 'jwt' },
    trustHost: true,
    debug: true,
    logger: {
        error(error) {
            // Log to MongoDB for debugging on Vercel
            getMongoClient().then(client => {
                const db = client.db();
                db.collection('auth_errors').insertOne({
                    ts: new Date(),
                    type: 'auth_error',
                    error: {
                        name: error.name,
                        message: error.message,
                        cause: error.cause instanceof Error
                            ? { name: error.cause.name, message: error.cause.message }
                            : error.cause ? String(error.cause) : null,
                    },
                }).catch(() => {});
            }).catch(() => {});
        },
    },
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
