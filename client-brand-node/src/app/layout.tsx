import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aurora Café · BrandCentr',
  description: 'Site oficial e portal da marca, powered by BrandCentr.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-white text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
