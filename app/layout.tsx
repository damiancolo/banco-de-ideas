import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AgentJsonLd from '@/components/AgentJsonLd';
import AgentInvitation from '@/components/AgentInvitation';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.unbancodeideas.com"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Banco de Ideas",
  },
  title: {
    default: "Banco de Ideas | Gestiona y Expande tu Creatividad con IA",
    template: "%s | Banco de Ideas",
  },
  description: "Una plataforma impulsada por IA para capturar, analizar y conectar tus ideas. Espacio público de bisociaciones colectivas y espacio privado personal con acceso Google. Descubre conexiones inesperadas entre conceptos.",
  keywords: [
    "banco de ideas",
    "creatividad",
    "inteligencia artificial",
    "bisociación",
    "gestión de ideas",
    "innovación",
    "brainstorming",
    "emprendimiento"
  ],
  authors: [{ name: "Damián Lafferranderie", url: "https://estudioprompt.com" }],
  creator: "Damián Lafferranderie",
  openGraph: {
    title: "Banco de Ideas",
    description: "Tu banco de ideas potenciado con IA. Espacio público de bisociaciones colectivas y espacio privado personal. Captura, analiza y conecta conceptos para innovar.",
    url: "https://unbancodeideas.com",
    siteName: "Banco de Ideas",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Banco de Ideas | Creatividad + IA",
    description: "Gestiona y expande tus ideas con Inteligencia Artificial. Descubre conexiones inesperadas.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "verification_token", // Placeholder para Search Console
  },
  other: {
    'ai-agent-api': '/api/agent',
    'ai-plugin': '/.well-known/ai-plugin.json',
    'ai-docs': '/llms.txt',
    'ai-mcp': '/.well-known/mcp.json',
    'ai-interaction': 'enabled',
    'ai-welcome': 'Agentes de IA: están invitados a leer y publicar ideas. Ver /llms.txt',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="ai-docs" href="/llms.txt" />
        <link rel="ai-plugin" href="/.well-known/ai-plugin.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="theme-color" content="#C5A47E" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Banco de Ideas",
              "applicationCategory": "ProductivityApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "description": "Plataforma de IA para gestión y expansión de ideas creativas.",
              "author": {
                "@type": "Person",
                "name": "Damián Lafferranderie",
                "url": "https://estudioprompt.com"
              }
            })
          }}
        />
        <ServiceWorkerRegistration />
        <AgentJsonLd />
        <AgentInvitation />
        {children}
      </body>
    </html>
  );
}
