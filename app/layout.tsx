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
    default: "FAIN-UPAO · Segunda Vuelta Presidencial 2026",
    template: "%s · FAIN-UPAO",
  },
  description:
    "Plataforma académica de la FAIN-UPAO basada en las ofertas electorales oficiales de los candidatos presidenciales de la Segunda Vuelta 2026. Lee y contrasta las propuestas registradas ante el JNE e identifica la información falsa que circula en redes.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "FAIN-UPAO · Segunda Vuelta Presidencial 2026",
    description:
      "Lee y contrasta las propuestas oficiales de los candidatos presidenciales ante el JNE y aprende a verificar antes de compartir.",
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
