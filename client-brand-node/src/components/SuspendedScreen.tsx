import React from 'react';
import { BrandCentrLogo } from './BrandCentrLogo';

export function SuspendedScreen({
  brandName,
  contactEmail,
}: {
  brandName: string;
  contactEmail?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-white px-6 py-12 text-stone-900">
      <div />
      <div className="max-w-sm text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
          {brandName}
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Temporariamente indisponível
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-500">
          Este ambiente está pausado. Para reativar, fale com a agência
          responsável.
        </p>
        {contactEmail && (
          <p className="mt-6 text-sm text-stone-700">{contactEmail}</p>
        )}
      </div>
      <BrandCentrLogo size={18} />
    </div>
  );
}
