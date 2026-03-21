import { auth } from "@/auth";
import Link from "next/link";
import PrivadoChat from "./PrivadoChat";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default async function PrivadoPage() {
    const session = await auth();

    if (!session?.user) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-[#F8F5F0]">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
                    {/* Lock Icon */}
                    <div className="mx-auto w-16 h-16 rounded-full bg-[#F8F5F0] flex items-center justify-center mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C5A47E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Tu espacio privado de ideas
                    </h1>
                    <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                        Un banco de ideas personal donde solo vos podes ver y gestionar tus ideas.
                    </p>

                    <GoogleSignInButton />

                    <Link
                        href="/"
                        className="block mt-6 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        Volver al inicio
                    </Link>
                </div>
            </main>
        );
    }

    return <PrivadoChat userId={session.user.id!} />;
}
