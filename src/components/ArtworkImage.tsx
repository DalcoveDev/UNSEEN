import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface ArtworkImageProps {
  src?: string;
  alt: string;
  titleFallback?: string;
  className?: string;
}

export const ArtworkImage: React.FC<ArtworkImageProps> = ({
  src,
  alt,
  titleFallback,
  className = '',
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#1A1A1A] text-[#A0A0A0] p-6 text-center select-none border border-white/10 ${className}`}
        role="img"
        aria-label={alt}
      >
        <ImageIcon className="w-7 h-7 mb-2 text-[#00D4FF]" strokeWidth={1.6} />
        {titleFallback && (
          <span className="font-display text-sm font-bold text-[#FFFFFF] line-clamp-2 max-w-[20ch]">
            {titleFallback}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`block w-full h-full object-cover ${className}`}
      loading="lazy"
    />
  );
};
