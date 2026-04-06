import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Lyrup — Calcula cuanto cobrar tus impresiones 3D",
  description:
    "Subi tu G-code y en segundos tenes el costo real: filamento, electricidad, depreciacion y mano de obra. Presupuesto profesional en PDF listo para enviar por WhatsApp.",
  openGraph: {
    title: "Lyrup — Calcula cuanto cobrar tus impresiones 3D",
    description:
      "El cotizador inteligente para emprendedores de impresion 3D. Subi tu G-code, calcula el costo real, genera un presupuesto profesional.",
    images: ["/og-image.png"],
    url: "https://lyrup.com",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={cn("h-full", "antialiased", inter.variable, spaceGrotesk.variable, jetbrainsMono.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col bg-lyrup-bg text-lyrup-text font-sans">
        {children}
      </body>
    </html>
  );
}
