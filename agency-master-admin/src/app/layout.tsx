import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BrandCentr — O Futuro das Marcas',
  description:
    'Infraestrutura viva de marca, manual interativo, cofre de ativos e inteligência artificial guardiã dedicada no domínio da sua empresa.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#070709] text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
