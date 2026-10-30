import React from 'react';
import { Link } from 'react-router-dom';

export default function Logo({ size = 'md', isDark = false, to = '/' }) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const iconSize = isSm ? 'w-7 h-7' : isLg ? 'w-10 h-10' : 'w-8 h-8';
  const pepsoText = isSm ? 'text-xl' : isLg ? 'text-3xl' : 'text-2xl';
  const partsText = isSm ? 'text-[9px] tracking-[0.25em]' : isLg ? 'text-xs tracking-[0.35em]' : 'text-[10px] tracking-[0.3em]';
  const textColor = isDark ? 'text-white' : 'text-ink';

  const content = (
    <div className="flex items-center gap-2.5 select-none group">
      {/* Icon Rhombus/Slanted Square */}
      <div className={`relative ${iconSize} flex-shrink-0 transition-transform group-hover:scale-105 duration-150`}>
        <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-sm">
          {/* Slanted polygon */}
          <polygon points="10,4 38,4 30,36 2,36" fill="#F05A22" />
          {/* Bold White P */}
          <text
            x="19"
            y="27"
            fill="#FFFFFF"
            fontFamily="'Inter', sans-serif"
            fontWeight="900"
            fontSize="22"
            textAnchor="middle"
          >
            P
          </text>
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col leading-none">
        <span className={`font-display font-extrabold uppercase ${pepsoText} ${textColor} tracking-tight`}>
          PEPSO
        </span>
        <span className={`font-sans font-bold uppercase ${partsText} text-brand -mt-0.5`}>
          PARTS
        </span>
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-block focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}

