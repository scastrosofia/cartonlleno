import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const helveticaNow = localFont({
  src: "./fonts/HelveticaNowDisplay-Regular.ttf",
  variable: "--font-sans",
  display: "swap",
});

const superclarendon = localFont({
  src: "./fonts/Superclarendon-Regular.ttf",
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
    <html lang="es" className={`${helveticaNow.variable} ${superclarendon.variable} h-full antialiased`}>
      <body className="min-h-full bg-neutral-100 text-neutral-900 font-sans selection:bg-[#E52320] selection:text-white">
        {children}
      </body>
    </html>
  );
}
