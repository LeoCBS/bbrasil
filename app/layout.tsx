import type { Metadata } from "next";
import { QuoteCart } from "@/components/site/quote-cart";
import { getUnits } from "@/lib/units";
import "./globals.css";

export const metadata: Metadata = {
  title: "B.Brasil Higiene Profissional",
  description: "Solucoes profissionais em higiene e limpeza para empresas, instituicoes e profissionais exigentes."
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const units = await getUnits();
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <QuoteCart units={units} />
      </body>
    </html>
  );
}
