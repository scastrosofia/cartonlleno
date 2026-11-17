import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cartón lleno, corazón contento",
  description: "Armá el bingo de las cosas que pasan siempre en tus juntadas de fin de año.",
  authors: [{ name: "Human Friendly" }],
  openGraph: {
    title: "Cartón lleno, corazón contento",
    description: "Armá el bingo de las cosas que pasan siempre en tus juntadas de fin de año.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full bg-neutral-100 text-neutral-900 font-sans selection:bg-[#E52320] selection:text-white">
        {children}
      </body>
    </html>
  );
}
