'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Camera } from 'lucide-react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  loading?: 'lazy' | 'eager';
  unoptimized?: boolean;
  onError?: () => void;
}

export default function ImageWithFallback({
  src,
  alt,
  fill = false,
  className = '',
  loading = 'lazy',
  unoptimized = false,
  onError,
}: ImageWithFallbackProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setImageError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // If there's an error or it's a data URL that failed, show fallback
  if (imageError) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 text-gray-500 ${className}`}>
        <div className="text-center">
          <Camera className="h-6 w-6 mx-auto mb-1" />
          <span className="text-xs">Failed to load</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 ${className}`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-1"></div>
            <span className="text-xs text-gray-500">Loading...</span>
          </div>
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        className={className}
        loading={loading}
        unoptimized={unoptimized || src.startsWith('data:')}
        onError={handleError}
        onLoad={handleLoad}
        style={{
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
        }}
      />
    </>
  );
}
