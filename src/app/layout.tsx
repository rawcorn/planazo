import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const miFuente = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  weight: ['400', '500', '700', '800'],
  variable: '--font-principal',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  title: "Planazo",
  description: "Conectá y salí.",
  other: {
    "thumbnail": "/icon.png",
    "image_src": "/icon.png",
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={miFuente.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}