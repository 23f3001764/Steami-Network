import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { fadeInUp, cardVariants, cardHover, cardTap, staggerContainer } from '@/lib/motion';

interface MotionWrapperProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
}

export function MotionWrapper({ children, delay = 0, className, ...props }: MotionWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedSectionProps extends HTMLMotionProps<"section"> {
  children: React.ReactNode;
}

export function AnimatedSection({ children, className, ...props }: AnimatedSectionProps) {
  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className={className}
      {...props}
    >
      {children}
    </motion.section>
  );
}

interface AnimatedCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  index?: number;
}

export function AnimatedCard({ children, index = 0, className, ...props }: AnimatedCardProps) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      whileHover={cardHover}
      whileTap={cardTap}
      className={`glass-card ${className || ''}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
