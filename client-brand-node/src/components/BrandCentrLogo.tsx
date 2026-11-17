import React from 'react';

/**
 * BrandCentr — Símbolo Oficial "Orbital Core"
 * Um arco orbital em forma de "C" (270° abertos = Centr / gravidade da marca)
 * envolvendo o núcleo imutável da identidade.
 */
export function BrandCentrMark({
  size = 24,
  tone = 'dark',
}: {
  size?: number;
  tone?: 'dark' | 'light';
}) {
  const bg = tone === 'dark' ? '#09090B' : '#FFFFFF';
  const arc = tone === 'dark' ? '#FAF9F6' : '#09090B';
  const core = '#7C5CFF';
  const spark = '#E5A952';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="32" height="32" rx="9" fill={bg} />
      <path
        d="M22.2 10.6 A8.5 8.5 0 1 0 22.2 21.4"
        fill="none"
        stroke={arc}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="24.2" cy="16" r="1.7" fill={spark} />
      <circle cx="15.5" cy="16" r="3.4" fill={core} />
    </svg>
  );
}

export function BrandCentrLogo({
  size = 24,
  tone = 'dark',
  showWord = true,
}: {
  size?: number;
  tone?: 'dark' | 'light';
  showWord?: boolean;
}) {
  const color = tone === 'dark' ? '#09090B' : '#FFFFFF';
  return (
    <span className="inline-flex items-center gap-2.5" style={{ color }}>
      <BrandCentrMark size={size} tone={tone} />
      {showWord && (
        <span
          className="tracking-[-0.03em]"
          style={{ fontSize: Math.round(size * 0.72) }}
        >
          <span className="font-normal opacity-90">Brand</span>
          <span className="font-semibold">Centr</span>
        </span>
      )}
    </span>
  );
}

/**
 * Assinatura Collab no Topo: [BrandCentr] | × | [Marca do Cliente]
 */
export function BrandCentrCollabHeader({
  brandName,
  brandColor = '#9A4D26',
  tone = 'dark',
  size = 24,
}: {
  brandName: string;
  brandColor?: string;
  tone?: 'dark' | 'light';
  size?: number;
}) {
  const textColor = tone === 'dark' ? '#09090B' : '#FFFFFF';
  const dividerColor =
    tone === 'dark' ? 'rgba(9,9,11,0.18)' : 'rgba(255,255,255,0.22)';

  return (
    <div
      className="inline-flex select-none items-center gap-3"
      style={{ color: textColor }}
    >
      <BrandCentrLogo size={size} tone={tone} showWord={true} />

      <span
        className="flex items-center gap-2 font-mono text-xs font-light"
        style={{ color: dividerColor }}
        aria-hidden="true"
      >
        <span className="h-4 w-px bg-current" />
        <span className="text-[11px] font-medium text-stone-400">×</span>
        <span className="h-4 w-px bg-current" />
      </span>

      <div className="inline-flex items-center gap-2">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white shadow-sm"
          style={{ backgroundColor: brandColor }}
        >
          {brandName.trim().charAt(0).toUpperCase()}
        </span>
        <span
          className="font-semibold tracking-tight"
          style={{ fontSize: Math.round(size * 0.64) }}
        >
          {brandName}
        </span>
      </div>
    </div>
  );
}

export function PoweredByBrandCentr({
  tone = 'dark',
}: {
  tone?: 'dark' | 'light';
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] ${
        tone === 'dark' ? 'text-stone-400' : 'text-white/45'
      }`}
    >
      Powered by
      <BrandCentrLogo size={15} tone={tone} />
    </span>
  );
}
