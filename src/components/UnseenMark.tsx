import React, { useId } from 'react';
import { motion } from 'motion/react';

interface UnseenSymbolProps {
  size?: number;
  className?: string;
}

/**
 * Animated UNSEEN eye emblem:
 * A crisp almond eye with a scanning Neon Cyan & Electric Purple iris
 * that periodically blinks shut with a dark eyelid and opens wide to see again.
 */
export const UnseenSymbol: React.FC<UnseenSymbolProps> = ({ size = 28, className = '' }) => {
  const rawId = useId();
  const clipId = `unseen-eye-clip-${rawId.replace(/:/g, '')}`;

  const width = Math.round(size * 1.32);
  const height = size;

  // Classic almond eye path in 40x30 viewBox
  const eyePath = 'M3 15 C10 4, 30 4, 37 15 C30 26, 10 26, 3 15 Z';

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 40 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={eyePath} />
        </clipPath>
      </defs>

      {/* Playful Electric Purple geometric lashes / crown ticks */}
      <line x1="20" y1="1.5" x2="20" y2="5" stroke="#00FF99" strokeWidth="2" strokeLinecap="square" />
      <line x1="11.5" y1="3.2" x2="13.2" y2="6.3" stroke="#FFE600" strokeWidth="1.8" strokeLinecap="square" />
      <line x1="28.5" y1="3.2" x2="26.8" y2="6.3" stroke="#FF3DAE" strokeWidth="1.8" strokeLinecap="square" />

      {/* Clipped Eye Interior */}
      <g clipPath={`url(#${clipId})`}>
        {/* Sclera */}
        <rect x="0" y="0" width="40" height="30" fill="#FFFFFF" />

        {/* Scanning Iris & Pupil (looking / seeing) */}
        <motion.g
          animate={{
            x: [0, -3.5, 3.5, 0, 0],
            y: [0, -0.8, 0.5, 0, 0],
          }}
          transition={{
            duration: 4.2,
            repeat: Infinity,
            ease: 'easeInOut',
            times: [0, 0.25, 0.55, 0.72, 1],
          }}
        >
          <circle cx="20" cy="15" r="7.2" fill="#9933FF" />
          <circle cx="20" cy="15" r="5.2" fill="#00D4FF" />
          <circle cx="20" cy="15" r="2.6" fill="#000000" />
          <circle cx="22.1" cy="12.9" r="1.4" fill="#FFE600" />
        </motion.g>

        {/* Upper Eyelid (sweeps down to close, then opens to see again) */}
        <motion.g
          animate={{
            y: [-16, -16, 0, 0, -16, -16],
          }}
          transition={{
            duration: 3.8,
            repeat: Infinity,
            ease: [0.22, 1, 0.36, 1],
            times: [0, 0.7, 0.76, 0.81, 0.87, 1],
          }}
        >
          <rect x="0" y="0" width="40" height="15.5" fill="#1A1A1A" />
          <line x1="0" y1="15.2" x2="40" y2="15.2" stroke="#FFFFFF" strokeWidth="1.8" />
        </motion.g>

        {/* Lower Eyelid (rises to meet upper lid on blink, then opens) */}
        <motion.g
          animate={{
            y: [16, 16, 0, 0, 16, 16],
          }}
          transition={{
            duration: 3.8,
            repeat: Infinity,
            ease: [0.22, 1, 0.36, 1],
            times: [0, 0.7, 0.76, 0.81, 0.87, 1],
          }}
        >
          <rect x="0" y="14.5" width="40" height="15.5" fill="#1A1A1A" />
          <line x1="0" y1="14.8" x2="40" y2="14.8" stroke="#00D4FF" strokeWidth="1.4" />
        </motion.g>
      </g>

      {/* Crisp Outer Eye Frame */}
      <path d={eyePath} stroke="#FFFFFF" strokeWidth="2.1" strokeLinejoin="round" />
    </svg>
  );
};

export const UnseenWordmark: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 select-none group">
    <UnseenSymbol size={compact ? 24 : 28} />
    <span className="font-display font-extrabold tracking-[-0.04em] text-[#FFFFFF] text-xl leading-none flex items-baseline">
      <span>UNSEEN</span>
      <span
        aria-hidden="true"
        className="inline-block w-1.5 h-1.5 bg-[#00FF99] ml-0.5 transition-transform duration-150 group-hover:scale-150"
      />
    </span>
  </span>
);
