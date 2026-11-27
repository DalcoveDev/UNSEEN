import React from 'react';
import { motion } from 'motion/react';

/**
 * 1. MorphingEyeCreature — Expressive animated mascot / character combining
 * an organic morphing Electric Purple blob, Hot Pink cutout ear/crown,
 * and a scanning Neon Cyan digital eye. Great for onboarding, studio & empty states.
 */
export const MorphingEyeCreature: React.FC<{ size?: number; className?: string }> = ({
  size = 96,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={className}
  >
    {/* Offset Hard Cutout Shadow */}
    <motion.path
      fill="#00FF99"
      d="M28 62C24 36 42 20 64 22C88 24 102 42 98 66C94 90 74 102 52 98C32 94 32 82 28 62Z"
      transform="translate(5 5)"
      animate={{
        d: [
          'M28 62C24 36 42 20 64 22C88 24 102 42 98 66C94 90 74 102 52 98C32 94 32 82 28 62Z',
          'M24 58C26 32 48 18 70 24C94 30 100 50 94 72C88 94 66 102 46 94C26 86 22 76 24 58Z',
          'M28 62C24 36 42 20 64 22C88 24 102 42 98 66C94 90 74 102 52 98C32 94 32 82 28 62Z',
        ],
      }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    />

    {/* Morphing Organic Blob Body */}
    <motion.path
      fill="#9933FF"
      stroke="#FFFFFF"
      strokeWidth="2.5"
      d="M28 62C24 36 42 20 64 22C88 24 102 42 98 66C94 90 74 102 52 98C32 94 32 82 28 62Z"
      animate={{
        d: [
          'M28 62C24 36 42 20 64 22C88 24 102 42 98 66C94 90 74 102 52 98C32 94 32 82 28 62Z',
          'M24 58C26 32 48 18 70 24C94 30 100 50 94 72C88 94 66 102 46 94C26 86 22 76 24 58Z',
          'M28 62C24 36 42 20 64 22C88 24 102 42 98 66C94 90 74 102 52 98C32 94 32 82 28 62Z',
        ],
      }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    />

    {/* Hot Pink Rotating Star Crest */}
    <motion.path
      d="M88 14L91.5 22.5L100 26L91.5 29.5L88 38L84.5 29.5L76 26L84.5 22.5L88 14Z"
      fill="#FF3DAE"
      stroke="#000000"
      strokeWidth="1.5"
      animate={{ rotate: [0, 180, 360] }}
      transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      style={{ transformOrigin: '88px 26px' }}
    />

    {/* White Sclera */}
    <motion.ellipse
      cx="62"
      cy="58"
      rx="20"
      ry="15"
      fill="#FFFFFF"
      stroke="#000000"
      strokeWidth="2.5"
      animate={{ scaleY: [1, 1, 0.12, 1, 1] }}
      transition={{ duration: 4.2, repeat: Infinity, times: [0, 0.45, 0.49, 0.53, 1] }}
      style={{ transformOrigin: '62px 58px' }}
    />

    {/* Tracking Pupil */}
    <motion.g
      animate={{ x: [-4, 5, -2, -4], y: [0, -2, 2, 0] }}
      transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <circle cx="62" cy="58" r="8" fill="#00D4FF" />
      <circle cx="62" cy="58" r="4.2" fill="#000000" />
      <circle cx="65" cy="55" r="1.8" fill="#FFFFFF" />
    </motion.g>

    {/* Expressive Smile / Bracket */}
    <motion.path
      d="M50 78C55 83 69 83 74 78"
      stroke="#FFE600"
      strokeWidth="3"
      strokeLinecap="square"
      animate={{ scaleX: [1, 1.12, 0.94, 1] }}
      transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: '62px 80px' }}
    />

    {/* Floating Pixel Cube */}
    <motion.rect
      x="14"
      y="82"
      width="12"
      height="12"
      fill="#FFE600"
      stroke="#000000"
      strokeWidth="2"
      animate={{ rotate: [0, 90, 90, 180, 180] }}
      transition={{ duration: 6, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformOrigin: '20px 88px' }}
    />
  </svg>
);

/**
 * 2. OrbitingSphereCluster — Bold 2D + 3D geometric composition:
 * oversized shaded 3D sphere, orbiting tilted torus ring, isometric cube, and pixel cross.
 */
export const OrbitingSphereCluster: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 240 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={className}
  >
    <defs>
      <radialGradient id="sphere3d-cyan" cx="35%" cy="30%" r="68%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="28%" stopColor="#00D4FF" />
        <stop offset="78%" stopColor="#9933FF" />
        <stop offset="100%" stopColor="#000000" />
      </radialGradient>
      <radialGradient id="sphere3d-pink" cx="32%" cy="28%" r="65%">
        <stop offset="0%" stopColor="#FFE600" />
        <stop offset="45%" stopColor="#FF3DAE" />
        <stop offset="100%" stopColor="#1A1A1A" />
      </radialGradient>
    </defs>

    {/* Subtle geometric grid crosshairs */}
    <line x1="12" y1="80" x2="228" y2="80" stroke="#FFFFFF" strokeOpacity="0.18" strokeDasharray="4 4" />
    <line x1="120" y1="10" x2="120" y2="150" stroke="#FFFFFF" strokeOpacity="0.18" strokeDasharray="4 4" />

    {/* Back Half of Ring */}
    <motion.ellipse
      cx="120"
      cy="82"
      rx="88"
      ry="26"
      stroke="#00FF99"
      strokeWidth="3"
      transform="rotate(-14 120 82)"
      animate={{ strokeDashoffset: [0, -40] }}
      strokeDasharray="16 8"
      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
    />

    {/* Oversized 3D Shaded Sphere */}
    <motion.circle
      cx="120"
      cy="80"
      r="44"
      fill="url(#sphere3d-cyan)"
      stroke="#FFFFFF"
      strokeWidth="2"
      animate={{ scale: [1, 1.035, 1] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: '120px 80px' }}
    />

    {/* Secondary 3D Mini Sphere */}
    <motion.circle
      cx="192"
      cy="46"
      r="16"
      fill="url(#sphere3d-pink)"
      stroke="#FFFFFF"
      strokeWidth="1.5"
      animate={{ x: [0, -10, 0], y: [0, 8, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    />

    {/* Isometric Cube (Left) */}
    <motion.g
      animate={{ rotate: [-6, 8, -6] }}
      transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: '44px 108px' }}
    >
      <polygon points="44,86 64,97 44,108 24,97" fill="#FFE600" stroke="#000000" strokeWidth="1.8" />
      <polygon points="24,97 44,108 44,130 24,119" fill="#FF3DAE" stroke="#000000" strokeWidth="1.8" />
      <polygon points="64,97 44,108 44,130 64,119" fill="#00FF99" stroke="#000000" strokeWidth="1.8" />
    </motion.g>

    {/* Pixel Star Spark */}
    <motion.path
      d="M46 32H52V38H58V44H52V50H46V44H40V38H46V32Z"
      fill="#FFE600"
      animate={{ rotate: [0, 90, 90, 180, 180] }}
      transition={{ duration: 4, repeat: Infinity, times: [0, 0.2, 0.5, 0.7, 1] }}
      style={{ transformOrigin: '49px 41px' }}
    />
  </svg>
);

/**
 * 3. KineticRibbonDivider — Playful checkerboard + sliding graphic ribbon
 * separating sections in Explore without becoming generic card clutter.
 */
export const KineticRibbonDivider: React.FC<{
  label?: string;
  accent?: 'yellow' | 'cyan' | 'green' | 'pink';
}> = ({ label = 'UNRANKED ROTATION · ALL DISCIPLINES', accent = 'yellow' }) => {
  const accentColors = {
    yellow: 'bg-[#FFE600] text-[#000000]',
    cyan: 'bg-[#00D4FF] text-[#000000]',
    green: 'bg-[#00FF99] text-[#000000]',
    pink: 'bg-[#FF3DAE] text-[#000000]',
  } as const;

  return (
    <div className="my-10 border-y-2 border-[#FFFFFF] bg-[#1A1A1A] overflow-hidden select-none">
      <div className="flex items-stretch">
        <div className="w-12 sm:w-16 shrink-0 bg-checker-strip border-r-2 border-[#FFFFFF]" aria-hidden="true" />
        <div className="flex-1 overflow-hidden py-2.5">
          <div className="flex items-center gap-8 whitespace-nowrap w-max animate-marquee-ribbon">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="inline-flex items-center gap-5">
                <span className="font-display text-xs sm:text-sm font-bold tracking-wider text-[#FFFFFF]">
                  {label}
                </span>
                <span
                  aria-hidden="true"
                  className={`inline-block w-3 h-3 rotate-45 ${accentColors[accent]}`}
                />
                <span className="font-mono-tabular text-xs font-bold text-[#00D4FF]">
                  EVERY CREATOR DESERVES TO BE SEEN
                </span>
                <span
                  aria-hidden="true"
                  className="inline-block w-3 h-3 rounded-full bg-[#FF3DAE]"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="w-12 sm:w-16 shrink-0 bg-checker-yellow border-l-2 border-[#FFFFFF]" aria-hidden="true" />
      </div>
    </div>
  );
};

/**
 * 4. FrameStepSpinner — Frame-by-frame morphing geometric loading emblem.
 */
export const FrameStepSpinner: React.FC<{ size?: number; label?: string }> = ({
  size = 28,
  label = 'Loading',
}) => (
  <div className="inline-flex items-center gap-2.5" role="status" aria-label={label}>
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <motion.rect
        x="6"
        y="6"
        width="20"
        height="20"
        fill="#00FF99"
        stroke="#FFFFFF"
        strokeWidth="2"
        animate={{
          rotate: [0, 45, 90, 135, 180],
          borderRadius: ['0%', '50%', '0%', '50%', '0%'],
          fill: ['#00FF99', '#00D4FF', '#FF3DAE', '#FFE600', '#00FF99'],
        }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '16px 16px' }}
      />
    </svg>
  </div>
);

/**
 * 5. PixelStickerBurst — Expressive celebratory starburst used on publish success
 * and interactive exhibition highlights.
 */
export const PixelStickerBurst: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 96 96"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={className}
  >
    <motion.path
      d="M48 6L56 30L82 20L66 42L90 54L64 60L74 84L48 68L22 84L32 60L6 54L30 42L14 20L40 30L48 6Z"
      fill="#FFE600"
      stroke="#000000"
      strokeWidth="3"
      initial={{ scale: 0.4, rotate: -25 }}
      animate={{ scale: [0.95, 1.06, 0.95], rotate: [0, 6, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: '48px 48px' }}
    />
    <motion.circle
      cx="48"
      cy="48"
      r="16"
      fill="#00FF99"
      stroke="#000000"
      strokeWidth="3"
      animate={{ scale: [1, 0.9, 1] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: '48px 48px' }}
    />
    <path
      d="M41 48L46 53L56 42"
      stroke="#000000"
      strokeWidth="3.5"
      strokeLinecap="square"
    />
  </svg>
);

/**
 * 6. StudioPlaygroundSticker — Animated geometric badge / interlude for Explore & Studio.
 */
export const StudioPlaygroundSticker: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 110 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={className}
  >
    <motion.rect
      x="6"
      y="14"
      width="36"
      height="36"
      fill="#FF3DAE"
      stroke="#FFFFFF"
      strokeWidth="2"
      animate={{ rotate: [0, -8, 0, 8, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: '24px 32px' }}
    />
    <motion.circle
      cx="58"
      cy="32"
      r="19"
      fill="#00D4FF"
      stroke="#000000"
      strokeWidth="2"
      animate={{ x: [0, 5, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.polygon
      points="88,10 104,32 88,54 72,32"
      fill="#FFE600"
      stroke="#000000"
      strokeWidth="2"
      animate={{ scale: [1, 1.08, 1] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: '88px 32px' }}
    />
  </svg>
);
