import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { BrandCentrLogo } from '@/components/BrandCentrLogo';
import { SuspendedScreen } from '@/components/SuspendedScreen';
import { readNodeDb } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default function PublicBrandWebsitePage() {
  const db = readNodeDb();
  const site = db.public_site_content;

  if (db.settings.status === 'suspended') {
    return (
      <SuspendedScreen
        brandName={site.brand_name}
        contactEmail={site.contact_email}
      />
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col justify-between selection:bg-black selection:text-white"
      style={{
        backgroundColor: site.background_color || '#FBF8F3',
        color: site.dark_color || '#1C1917',
      }}
    >
      {/* Minimal Header */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-3">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: site.primary_color || '#9A4D26' }}
          />
          <span className="text-sm font-semibold tracking-tight">
            {site.brand_name}
          </span>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <a
            href="#essencia"
            className="hidden opacity-60 transition hover:opacity-100 sm:inline"
          >
            Essência
          </a>
          <a
            href="#solucoes"
            className="hidden opacity-60 transition hover:opacity-100 sm:inline"
          >
            Soluções
          </a>
          <Link
            href="/portal"
            className="rounded-full border border-current/15 px-3.5 py-1.5 font-medium opacity-80 transition hover:opacity-100"
          >
            BrandCentr Hub
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-5xl space-y-28 px-6 py-16 sm:py-24">
        {/* Hero */}
        <section className="max-w-3xl space-y-8">
          <p className="text-xs uppercase tracking-[0.2em] opacity-50">
            {site.city_label}
          </p>

          <h1 className="font-serif text-4xl font-normal leading-[1.12] tracking-tight sm:text-6xl">
            {site.hero_title}
          </h1>

          <p className="max-w-xl text-base leading-relaxed opacity-70 sm:text-lg">
            {site.hero_subtitle}
          </p>

          <div className="pt-2">
            <a
              href={`https://wa.me/${site.whatsapp_number}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium text-white transition hover:opacity-90"
              style={{ backgroundColor: site.primary_color || '#9A4D26' }}
            >
              {site.hero_cta_label}
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </section>

        {/* Essência */}
        <section
          id="essencia"
          className="grid gap-8 border-t border-current/10 pt-16 md:grid-cols-12"
        >
          <div className="md:col-span-4">
            <span className="text-xs uppercase tracking-[0.18em] opacity-45">
              Essência
            </span>
          </div>
          <div className="space-y-4 md:col-span-8">
            <h2 className="font-serif text-2xl font-normal sm:text-3xl">
              {site.about_title}
            </h2>
            <p className="text-sm leading-relaxed opacity-75 sm:text-base">
              {site.about_text}
            </p>
          </div>
        </section>

        {/* Soluções */}
        <section
          id="solucoes"
          className="grid gap-8 border-t border-current/10 pt-16 md:grid-cols-12"
        >
          <div className="md:col-span-4">
            <span className="text-xs uppercase tracking-[0.18em] opacity-45">
              Linhas &amp; Serviços
            </span>
          </div>
          <div className="grid gap-8 sm:grid-cols-3 md:col-span-8">
            {site.offerings.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <span className="font-mono text-xs opacity-40">
                  0{idx + 1}
                </span>
                <h3 className="text-base font-medium">{item.title}</h3>
                <p className="text-xs leading-relaxed opacity-65">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Minimal Footer with BrandCentr signature */}
      <footer className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 border-t border-current/10 px-6 py-8 text-xs">
        <div className="flex flex-wrap items-center gap-4 opacity-65">
          <span>{site.brand_name}</span>
          <span>·</span>
          <a href={`mailto:${site.contact_email}`} className="hover:underline">
            {site.contact_email}
          </a>
        </div>

        <Link
          href="/portal"
          className="inline-flex items-center gap-2 opacity-60 transition hover:opacity-100"
        >
          <span className="text-[11px]">Ecossistema gerido por</span>
          <BrandCentrLogo size={16} tone="dark" />
        </Link>
      </footer>
    </div>
  );
}
