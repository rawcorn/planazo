import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const miFuente = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  weight: ['400', '500', '700', '800'],
  variable: '--font-principal',
});

export const metadata: Metadata = {
  title: "Planazo",
  description: "Conectá y salí.",
  manifest: "/manifest.json",
  icons: {
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Planazo",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={miFuente.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}