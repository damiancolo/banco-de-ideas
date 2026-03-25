"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function GoogleSignInButton() {
    const [status, setStatus] = useState<string | null>(null);

    async function handleClick() {
        setStatus("Redirigiendo a Google...");
        try {
            await signIn("google", { callbackUrl: "/privado" });
        } catch (err) {
            setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
        }
    }

    return (
        <>
            <button
                onClick={handleClick}
                type="button"
                disabled={status === "Redirigiendo a Google..."}
                className="w-full px-6 py-3.5 bg-[#C5A47E] text-white rounded-xl font-medium hover:bg-[#b08e68] transition-colors shadow-lg shadow-[#C5A47E]/20 disabled:opacity-60"
            >
                {status === "Redirigiendo a Google..." ? "Redirigiendo..." : "Continuar con Google"}
            </button>
            {status && status.startsWith("Error") && (
                <p className="mt-3 text-sm text-red-500">{status}</p>
            )}
        </>
    );
}
