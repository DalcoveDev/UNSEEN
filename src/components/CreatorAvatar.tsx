import React, { useState } from 'react';

interface CreatorAvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<CreatorAvatarProps['size']>, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-20 h-20 text-xl',
};

export const CreatorAvatar: React.FC<CreatorAvatarProps> = ({
  src,
  name,
  size = 'sm',
  className = '',
}) => {
  const [failed, setFailed] = useState(false);

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'U';

  if (!src || failed) {
    return (
      <div
        aria-hidden="true"
        className={`rounded-full bg-[#2A2A2A] border border-white/25 text-[#FFFFFF] font-display font-bold flex items-center justify-center shrink-0 select-none ${SIZE_CLASSES[size]} ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`rounded-full object-cover border border-white/25 shrink-0 ${SIZE_CLASSES[size]} ${className}`}
    />
  );
};
