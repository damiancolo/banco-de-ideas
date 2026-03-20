import AuthProvider from "@/components/AuthProvider";

export const metadata = {
    title: "Espacio Privado - Banco de Ideas",
    robots: { index: false, follow: false },
};

export default function PrivadoLayout({ children }: { children: React.ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
}
