import type { Metadata } from "next";
import { Baloo_Paaji_2 } from "next/font/google";
import "./globals.css";

const baloo = Baloo_Paaji_2({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Resumer | Resumos inteligentes",
  description:
    "O Resumer é uma ferramenta que utiliza IA para gerar resumos concisos de matérias jornalísticas a partir de URLs. Simplifique sua leitura com resumos rápidos, precisos e fáceis de entender.",
    
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className={` ${baloo.className} bg-gradient-hero text-zinc-50`}>
        {children}
      </body>
    </html>
  );
}
