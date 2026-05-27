import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";

import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Voto Informado e Instruido · FAIN-UPAO",
    template: "%s · Voto Informado e Instruido · FAIN-UPAO",
  },
  description:
    "Plataforma académica de la FAIN-UPAO para la Segunda Vuelta Electoral 2026. Toma decisiones objetivas y críticas: analiza los planes oficiales del JNE e identifica la información falsa que circula en otros canales.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Voto Informado e Instruido · FAIN-UPAO",
    description:
      "Analiza los planes oficiales del JNE y aprende a detectar información falsa antes de decidir.",
    locale: "es_PE",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#FAFAFC",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-PE" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable}`}
        style={{ fontFamily: "var(--font-geist-sans)" }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
