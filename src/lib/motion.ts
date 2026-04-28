/**
 * Centralized Framer Motion variants for the STEAMI design system.
 * GPU-accelerated (transform + opacity only). Consistent timing & easing.
 */
import type { Variants, Transition } from 'framer-motion';

/* ── Shared easing & timing ─────────────────────────────────── */
export const ease = {
  smooth: [0.25, 0.1, 0.25, 1] as const,
  snappy: [0.4, 0, 0.2, 1] as const,
  spring: { type: 'spring', stiffness: 260, damping: 24 } as Transition,
  gentle: { type: 'spring', stiffness: 140, damping: 20 } as Transition,
};

/* ── Page-level transitions ─────────────────────────────────── */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: ease.smooth } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.25, ease: ease.smooth } },
};

/* ── Card hover + entry ─────────────────────────────────────── */
export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.97 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.06, duration: 0.4, ease: ease.smooth },
  }),
};

export const cardHover = {
  y: -4,
  scale: 1.015,
  transition: { duration: 0.22, ease: ease.snappy },
};

export const cardTap = {
  scale: 0.985,
  transition: { duration: 0.1 },
};

/* ── Stagger container ──────────────────────────────────────── */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

/* ── Fade in from direction ─────────────────────────────────── */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: ease.smooth } },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: ease.smooth } },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -18 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: ease.smooth } },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 18 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: ease.smooth } },
};

/* ── Scale reveal (modals, tooltips, popovers) ──────────────── */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: ease.snappy } },
  exit: { opacity: 0, scale: 0.92, transition: { duration: 0.2 } },
};

/* ── Modal overlay ──────────────────────────────────────────── */
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.35, ease: ease.snappy },
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    y: 24,
    transition: { duration: 0.22 },
  },
};

/* ── Sidebar / panel slide ──────────────────────────────────── */
export const slideInRight: Variants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.35, ease: ease.smooth } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.25 } },
};

/* ── Pulse glow (for live indicators, data dots) ────────────── */
export const pulseGlow: Variants = {
  initial: { scale: 1, opacity: 0.8 },
  animate: {
    scale: [1, 1.3, 1],
    opacity: [0.8, 1, 0.8],
    transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
  },
};

/* ── Badge / chip pop-in ────────────────────────────────────── */
export const chipPop: Variants = {
  hidden: { opacity: 0, scale: 0.7, y: 6 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: i * 0.04, ...ease.spring },
  }),
};

/* ── Number counter helper ──────────────────────────────────── */
export const counterSpring = { ...ease.spring, mass: 0.8 };

/* ── Nav link underline ─────────────────────────────────────── */
export const navUnderline: Variants = {
  rest: { scaleX: 0, originX: 0 },
  hover: { scaleX: 1, transition: { duration: 0.25, ease: ease.snappy } },
  active: { scaleX: 1 },
};
