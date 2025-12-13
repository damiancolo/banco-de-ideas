import { getIdeas } from '@/lib/db';
import Link from 'next/link';
import BancoView from '@/components/BancoView';

export const dynamic = 'force-dynamic';

export default function BancoPage() {
    const ideas = getIdeas();

    return (
        <main className="min-h-screen bg-[#F8F5F0] p-6 md:p-12 relative">
            <div className="max-w-4xl mx-auto flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Banco de Ideas</h1>
                    <p className="text-gray-500 mt-2">Tu colección personal de conceptos.</p>
                </div>
                <Link
                    href="/"
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-gray-800 hover:border-gray-400 transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </Link>
            </div>

            <BancoView initialIdeas={ideas} />
        </main>
    );
}
