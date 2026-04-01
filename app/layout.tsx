import type { Metadata } from 'next';
import { Cinzel, Crimson_Pro } from 'next/font/google';
import './globals.css';

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-display',
});

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'POLARIS AI — Consultoria Política de Elite',
  description: 'Super Agente de Consultoria e Marketing Político. Inteligência coletiva formada pelos maiores especialistas em estratégia eleitoral do Brasil e do mundo.',
  keywords: 'consultoria política, marketing político, estratégia eleitoral, campanha política, Brasil',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${cinzel.variable} ${crimsonPro.variable}`}>
      <body className="bg-polaris-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
