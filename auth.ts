import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { getMongoClient } from '@/lib/auth-client';

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: MongoDBAdapter(getMongoClient()),
    providers: [Google({
        client: { token_endpoint_auth_method: "client_secret_post" },
    })],
    session: { strategy: 'jwt' },
    trustHost: true,
    debug: true,
    logger: {
        error(error) {
            // Serialize cause deeply
            function serializeCause(c: unknown, depth = 0): unknown {
                if (!c || depth > 3) return null;
                if (c instanceof Error) {
                    return { name: c.name, message: c.message, cause: serializeCause(c.cause, depth + 1) };
                }
                try {
                    return JSON.parse(JSON.stringify(c, (_k, v) =>
                        v instanceof Error ? { name: v.name, message: v.message, stack: v.stack?.substring(0, 300) } : v
                    ));
                } catch { return String(c); }
            }
            getMongoClient().then(client => {
                const db = client.db();
                db.collection('auth_errors').insertOne({
                    ts: new Date(),
                    type: 'auth_error',
                    error: {
                        name: error.name,
                        message: error.message,
                        stack: error.stack?.substring(0, 800),
                        cause: serializeCause(error.cause),
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
