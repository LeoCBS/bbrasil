import type { Metadata } from "next";
import { QuoteCart } from "@/components/site/quote-cart";
import "./globals.css";

export const metadata: Metadata = {
  title: "B.Brasil Higiene Profissional",
  description: "Solucoes profissionais em higiene e limpeza para empresas, instituicoes e profissionais exigentes."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <QuoteCart />
      </body>
    </html>
  );
}
