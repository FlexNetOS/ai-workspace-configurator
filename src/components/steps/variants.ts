import type { Variants } from 'framer-motion';

export const stepVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -20 },
};

export const containerVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.05 } },
  exit:    { opacity: 0 },
};

export const cardVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};

export const easeEnter: [number, number, number, number] = [0, 0, 0.2, 1];
export const easeSmooth: [number, number, number, number] = [0.4, 0, 0.2, 1];
