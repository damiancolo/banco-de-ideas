"use client";

import { signIn } from "next-auth/react";

export default function GoogleSignInButton() {
    return (
        <button
            onClick={() => signIn("google", { callbackUrl: "/privado" })}
            type="button"
            className="w-full px-6 py-3.5 bg-[#C5A47E] text-white rounded-xl font-medium hover:bg-[#b08e68] transition-colors shadow-lg shadow-[#C5A47E]/20"
        >
            Continuar con Google
        </button>
    );
}
