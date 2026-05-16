import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { api } from '@/lib/api';

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const navigation = {
  explore: [
    { name: 'Home', href: '/' },
    { name: 'Blog', href: '/blog' },
    { name: 'Articles', href: '/research' },
    { name: 'Simulations', href: '/simulations' },
  ],
  resources: [
    { name: 'Docs / Guides', href: '#' },
    { name: 'Tutorials', href: '#' },
    { name: 'Knowledge Graph', href: '#' },
  ],
  company: [
    { name: 'About', href: 'https://stemonef.world/', external: true },
    { name: 'Contact', href: 'https://stemonef.world/', external: true },
    { name: 'Careers', href: 'https://stemonef.world/', external: true },
  ],
};

const socialIcons = [
  {
    name: 'Twitter',
    href: '#',
    icon: (props: any) => (
      <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
      </svg>
    ),
  },
  {
    name: 'GitHub',
    href: 'https://Github.com',
    icon: (props: any) => (
      <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/company/steami-stemonef-2025/',
    icon: (props: any) => (
      <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    ),
  },
];

function FooterColumn({ title, links }: { title: string; links: { name: string; href: string; external?: boolean }[] }) {
  const location = useLocation();
  return (
    <motion.div variants={fadeUp} className="flex flex-col gap-4">
      <h3 className="font-mono text-[13px] font-semibold tracking-wider text-foreground uppercase">{title}</h3>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.name}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center text-[14px] text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <span className="relative z-10">{link.name}</span>
                <span className="absolute left-0 -bottom-0.5 w-0 h-[1px] bg-gradient-to-r from-steami-cyan to-steami-magenta group-hover:w-full transition-all duration-300 ease-out" />
              </a>
            ) : (
              <Link
                to={link.href}
                onClick={(e) => { if (location.pathname === link.href) e.preventDefault(); }}
                className="group relative inline-flex items-center text-[14px] text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <span className="relative z-10">{link.name}</span>
                <span className="absolute left-0 -bottom-0.5 w-0 h-[1px] bg-gradient-to-r from-steami-cyan to-steami-magenta group-hover:w-full transition-all duration-300 ease-out" />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email.');
      return;
    }

    setStatus('loading');
    try {
      await api.newsletter.subscribe(email);
      setStatus('success');
      setMessage('Thanks for subscribing!');
      setEmail('');
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    } catch (err) {
      setStatus('error');
      setMessage('Something went wrong. Try again.');
    }
  };

  return (
    <motion.div variants={fadeUp} className="lg:col-span-2 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h3 className="font-mono text-[13px] font-semibold tracking-wider text-foreground uppercase">Stay Updated</h3>
        <p className="text-[14px] text-muted-foreground leading-relaxed">
          Subscribe to our newsletter for the latest updates in AI and science.
        </p>
      </div>

      <form onSubmit={handleSubscribe} className="relative group">
        <div className="relative flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-[14px] outline-none transition-all duration-300 focus:border-steami-cyan/50 focus:ring-2 focus:ring-steami-cyan/20 focus:bg-white/10"
              disabled={status === 'loading'}
            />
            {/* Subtle animated underline glow */}
            <motion.div 
              className="absolute -bottom-[1px] left-0 h-[1px] bg-gradient-to-r from-steami-cyan via-steami-magenta to-steami-cyan"
              initial={{ width: 0, opacity: 0 }}
              whileInView={{ width: "100%", opacity: 0.3 }}
              transition={{ duration: 1.5, ease: "easeInOut" as const }}
            />
            <motion.div 
              className="absolute -bottom-[1px] left-0 h-[1px] bg-steami-cyan shadow-[0_0_8px_rgba(0,255,255,0.5)]"
              initial={{ width: 0 }}
              animate={{ width: email ? "100%" : 0 }}
              transition={{ duration: 0.5 }}
            />
          </div>
          
          <motion.button
            type="submit"
            disabled={status === 'loading'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2.5 bg-foreground text-background font-mono text-[13px] font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center min-w-[120px]"
          >
            {status === 'loading' ? (
              <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            ) : (
              'SUBSCRIBE'
            )}
          </motion.button>
        </div>

        {/* Feedback Message */}
        <AnimatePresence>
          {message && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`absolute top-full mt-2 text-[12px] font-mono ${status === 'success' ? 'text-steami-cyan' : 'text-red-400'}`}
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
}

export function Footer() {
  const location = useLocation();
  return (
    <footer className="relative w-full border-t border-white/5 bg-background/40 backdrop-blur-xl mt-20 overflow-hidden">
      {/* Decorative gradient background similar to stemonef.world */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-steami-cyan/50 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[100px] bg-steami-cyan/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Decorative SVG grid pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="max-w-[1200px] mx-auto px-5 pt-16 pb-8 relative z-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          {/* Brand Section */}
          <motion.div variants={fadeUp} className="lg:col-span-2 flex flex-col gap-6">
            <div>
              <Link 
                to="/" 
                onClick={(e) => { if (location.pathname === '/') e.preventDefault(); }}
                className="font-mono text-[20px] font-bold tracking-wider group shrink-0 inline-block"
              >
                <motion.span
                  className="text-steami-gold inline-block drop-shadow-sm group-hover:drop-shadow-[0_0_8px_rgba(232,184,75,0.4)] transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" as const }}
                >
                  STEAMI
                </motion.span>
              </Link>
              <p className="mt-4 text-[14px] text-muted-foreground leading-relaxed max-w-xs">
                A STEAM playground for discovery, research, and interactive exploration.
              </p>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-4 mt-2">
              {socialIcons.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-steami-cyan/50 hover:bg-steami-cyan/5 transition-all duration-300 hover:scale-110 hover:shadow-[0_0_15px_rgba(0,255,255,0.15)] group"
                  aria-label={social.name}
                >
                  <social.icon className="w-4 h-4 group-hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.5)] transition-all" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Newsletter Section */}
          <NewsletterSection />
          
          <FooterColumn title="Company" links={navigation.company} />
        </div>

        {/* Legal & Copyright Section */}
        <motion.div
          variants={fadeUp}
          className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <div className="flex gap-6 text-[12px] text-muted-foreground">
            <Link to="#" className="hover:text-steami-cyan transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-steami-cyan transition-colors">Terms of Service</Link>
            <Link to="#" className="hover:text-steami-cyan transition-colors">Cookie Policy</Link>
          </div>
          <p className="text-[12px] text-muted-foreground/70 font-mono">
            &copy; {new Date().getFullYear()} STEAMI Nexus. All rights reserved.
          </p>
        </motion.div>
      </motion.div>
    </footer>
  );
}
