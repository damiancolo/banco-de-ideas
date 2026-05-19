import { getIdeas } from '@/lib/db';
import { isDBConnected } from '@/lib/mongodb';
import { auth } from '@/auth';
import Link from 'next/link';
import BancoView from '@/components/BancoView';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'damianlafferranderie@gmail.com';

export default async function BancoPage() {
    const [ideas, session] = await Promise.all([getIdeas(), auth()]);
    const connected = isDBConnected();
    const isAdmin = session?.user?.email === ADMIN_EMAIL;

    return (
        <main className="min-h-screen bg-[#F8F5F0] p-6 md:p-12 relative">
            <div className="max-w-4xl mx-auto flex items-center justify-between mb-12">
                <div />
                <div className="flex items-center gap-3">
                    <Link
                        href="/banco/semantic"
                        className="px-4 py-2 flex items-center gap-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:text-[#C5A47E] hover:border-[#C5A47E] transition-all text-sm font-medium"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        Búsqueda por esencia
                    </Link>
                    <Link
                        href="/"
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-800 hover:border-gray-400 transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </Link>
                </div>
            </div>

            <BancoView initialIdeas={ideas} isConnected={connected} allowDelete={isAdmin} />
        </main>
    );
}
