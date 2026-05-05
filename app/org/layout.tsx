import AuthProvider from "@/components/AuthProvider";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
}
