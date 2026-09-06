import type { Metadata } from "next";
import { Archivo, Archivo_Narrow } from "next/font/google";
import "./globals.css";

// Technische Grotesk für Fließtext …
const grotesk = Archivo({
  variable: "--font-grotesk",
  subsets: ["latin"],
  display: "swap",
});

// … und eine schmale Kondensierte für Zahlen und Beschriftungen.
const condensed = Archivo_Narrow({
  variable: "--font-condensed",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dream Garage — Nico Klein & Lion Kalaba",
  description:
    "Die gemeinsame Traum-Garage von Nico Klein und Lion Kalaba als begehbarer Raum.",
  // Privates Projekt ohne eigene Domain: bewusst nicht indexieren.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${grotesk.variable} ${condensed.variable} h-full antialiased`}
    >
      <body className="min-h-full text-paper">{children}</body>
    </html>
  );
}
