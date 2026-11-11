import { useState } from 'react';

export default function ImageCover({ src, alt, fallback, className }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const showImage = Boolean(src) && failedUrl !== src;

  return (
    <div className={`${className} image-cover`}>
      {showImage
        ? <img src={src} alt={alt} loading="lazy" onError={() => setFailedUrl(src)} />
        : <span aria-hidden="true">{fallback}</span>}
    </div>
  );
}
