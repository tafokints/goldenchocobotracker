'use client';

import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

interface CardLightboxProps {
  open: boolean;
  index: number;
  slides: Array<{ src: string; alt?: string }>;
  onClose: () => void;
}

export default function CardLightbox({ open, index, slides, onClose }: CardLightboxProps) {
  return <Lightbox open={open} close={onClose} slides={slides} index={index} />;
}
