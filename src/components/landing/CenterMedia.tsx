import React from 'react';

interface CenterMediaProps {
  src?: string;
  videoSrc?: string;
  alt?: string;
  className?: string;
}

const CenterMedia: React.FC<CenterMediaProps> = ({ 
  src = 'https://picsum.photos/400/600?random=1', 
  videoSrc, 
  alt = 'Story scene',
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-center h-full w-full ${className}`}>
      <div className="aspect-[9/16] w-full max-w-[400px] max-h-[78vh] rounded-2xl overflow-hidden shadow-lg border bg-gray-100">
        {videoSrc ? (
          <video
            src={videoSrc}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            aria-label={alt}
          />
        ) : (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
          />
        )}
      </div>
    </div>
  );
};

export default CenterMedia;
