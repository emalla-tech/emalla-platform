import React from 'react';

interface BrandLogoProps {
  className?: string;
  inverse?: boolean;
  revealCountry?: boolean;
  showTagline?: boolean;
}

const BrandLogo = ({
  className = '',
  inverse = false,
  revealCountry = false,
  showTagline = false
}: BrandLogoProps) => (
  <span
    role="img"
    aria-label="E-Malla Rwanda"
    className={`inline-flex min-w-0 items-center gap-2.5 ${className}`}
  >
    <img
      src={inverse ? '/brand/emalla-cart-mark-inverse.svg' : '/brand/emalla-cart-mark.svg'}
      alt=""
      aria-hidden="true"
      width="44"
      height="44"
      className="h-11 w-11 shrink-0 object-contain transition-transform duration-300 group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5"
    />
    <span aria-hidden="true" className="min-w-0">
      <span className="flex items-baseline whitespace-nowrap">
        <span className={`text-[1.35rem] font-black tracking-[-0.045em] sm:text-2xl ${inverse ? 'text-white' : 'text-[#0B1020]'}`}>
          E-Malla
        </span>
        <span
          className={`overflow-hidden whitespace-nowrap text-base font-semibold transition-[max-width,opacity,transform,margin] duration-300 sm:text-lg ${
            inverse ? 'text-orange-400' : 'text-orange-600'
          } ${
            revealCountry
              ? 'ml-1 max-w-20 translate-x-0 opacity-100 md:ml-0 md:max-w-0 md:translate-x-1.5 md:opacity-0 md:group-hover:ml-1.5 md:group-hover:max-w-20 md:group-hover:translate-x-0 md:group-hover:opacity-100 md:group-focus-visible:ml-1.5 md:group-focus-visible:max-w-20 md:group-focus-visible:translate-x-0 md:group-focus-visible:opacity-100'
              : 'ml-1.5 max-w-20 opacity-100'
          }`}
        >
          Rwanda
        </span>
      </span>
      {showTagline && (
        <span className={`mt-0.5 block whitespace-nowrap text-[8px] font-black uppercase tracking-[0.2em] ${inverse ? 'text-white/55' : 'text-gray-400'}`}>
          Buy <span className="text-orange-500">•</span> Sell <span className="text-orange-500">•</span> Deliver
        </span>
      )}
    </span>
  </span>
);

export default BrandLogo;
