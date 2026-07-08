import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Miga Azul — Galletas artesanales horneadas en casa",
  description:
    "Galletas suaves y artesanales con ingredientes de verdad. Pide hoy y recibe tus galletas recién horneadas en la puerta de tu casa. Bogotá, Colombia.",
  keywords: [
    "galletas",
    "galletas artesanales",
    "cookies",
    "Bogotá",
    "repostería",
    "Miga Azul",
  ],
  authors: [{ name: "Miga Azul" }],
  openGraph: {
    title: "Miga Azul — Galletas artesanales",
    description:
      "Recetas artesanales con ingredientes de verdad, recién horneadas. Envío a domicilio en Bogotá.",
    type: "website",
    locale: "es_CO",
    siteName: "Miga Azul",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F7FAFD",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={outfit.variable}>
      <body>{children}</body>
    </html>
  );
}
