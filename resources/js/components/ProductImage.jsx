import React, { useState } from 'react';
import { Gallery } from 'iconsax-react';

// Product photo with a quiet fallback tile when there is no image or it fails to load.
// The wrapper takes the sizing and radius; the image always covers it.
const ProductImage = ({ src, alt = '', className = '', iconSize = 24, fit = 'cover', eager = false }) => {
  const [failed, setFailed] = useState(false);

  return (
    <span className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-gray-100 text-gray-300 ${className}`}>
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
          className={`size-full ${fit === 'contain' ? 'object-contain' : 'object-cover'}`}
        />
      ) : (
        <Gallery size={iconSize} color="currentColor" variant="Linear" />
      )}
    </span>
  );
};

export default ProductImage;
