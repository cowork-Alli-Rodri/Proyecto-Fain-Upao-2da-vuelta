import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voto Informado UPAO",
  description:
    "Plataforma académica para estudiantes UPAO — Segunda Vuelta Electoral 2026. Comparador oficial JNE de los planes de gobierno.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Voto Informado UPAO",
    description: "Compara propuestas oficiales del JNE. Sin sesgos, sin recomendaciones.",
    locale: "es_PE",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-PE" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
