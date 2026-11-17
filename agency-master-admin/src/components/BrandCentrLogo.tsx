import React from 'react';

/**
 * BrandCentr — Símbolo Oficial "Orbital Core"
 * Um arco orbital em forma de "C" (270° abertos = Centr / gravidade da marca)
 * envolvendo o núcleo imutável da identidade.
 */
export function BrandCentrMark({
  size = 24,
  tone = 'light',
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
      {/* Órbita aberta em C (270 graus) */}
      <path
        d="M22.2 10.6 A8.5 8.5 0 1 0 22.2 21.4"
        fill="none"
        stroke={arc}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Ponto de órbita secundário (ecossistema vivo) */}
      <circle cx="24.2" cy="16" r="1.7" fill={spark} />
      {/* Núcleo central da marca */}
      <circle cx="15.5" cy="16" r="3.4" fill={core} />
    </svg>
  );
}

export function BrandCentrLogo({
  size = 24,
  tone = 'light',
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
