import { motion } from 'framer-motion';
import { LucideIcon, BookOpen, FlaskConical, Newspaper, Bell, Zap, Brain, Rocket, Search, Globe, TrendingUp, BarChart, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface Category {
  title: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

const categories: Category[] = [
  { title: "Explainers", icon: BookOpen, color: "steami-cyan", description: "Interactive deep-dives into complex STEM topics." },
  { title: "Research Articles", icon: FlaskConical, color: "steami-gold", description: "Peer-reviewed scientific breakthroughs and papers." },
  { title: "Blogs", icon: Newspaper, color: "steami-violet", description: "Latest industry thoughts and innovation stories." },
  { title: "Intelligence Briefs", icon: Bell, color: "steami-red", description: "Daily curated signals from the tech frontier." },
  { title: "STEM Signals", icon: Zap, color: "steami-green", description: "Real-time alerts on emerging scientific trends." },
  { title: "AI Syntheses", icon: Brain, color: "steami-cyan", description: "AI-powered summaries of massive research sets." },
  { title: "Emerging Tech", icon: Rocket, color: "steami-orange", description: "Early-stage technology assessment reports." },
  { title: "Scientific Breakdowns", icon: Search, color: "steami-gold", description: "Complex science explained for strategic use." },
  { title: "Strategic Research", icon: ShieldCheck, color: "steami-cyan", description: "Long-form intelligence for decision makers." },
  { title: "Future Trends", icon: TrendingUp, color: "steami-violet", description: "5-10 year outlooks on critical technologies." },
  { title: "Innovation Reports", icon: BarChart, color: "steami-green", description: "Data-driven analysis of global R&D landscape." },
  { title: "Domain Intelligence", icon: Globe, color: "steami-red", description: "Deep mapping of specific scientific domains." },
];

const PremiumCard = ({ category, index }: { category: Category; index: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = category.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative h-[220px] glass-card overflow-hidden cursor-pointer"
    >
      {/* Background Glow */}
      <div 
        className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-${category.color}`}
      />
      
      {/* Animated Border */}
      <div className="absolute inset-0 border border-white/5 group-hover:border-steami-cyan/30 transition-colors duration-500" />
      
      {/* Content */}
      <div className="relative z-10 p-6 flex flex-col h-full">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 bg-${category.color}/10 border border-${category.color}/20 text-${category.color} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
        
        <h3 className="font-serif text-lg font-bold mb-2 text-white/90 group-hover:text-steami-cyan transition-colors">
          {category.title}
        </h3>
        
        <p className="text-xs text-muted-foreground leading-relaxed">
          {category.description}
        </p>

        {/* Hover Reveal Metadata */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
          className="mt-auto pt-4 flex items-center justify-between border-t border-white/5"
        >
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60">Explore Content</span>
          <div className="w-5 h-5 rounded-full bg-steami-cyan/20 flex items-center justify-center">
            <Icon className="w-3 h-3 text-steami-cyan" />
          </div>
        </motion.div>
      </div>

      {/* Decorative Scanline */}
      <motion.div 
        animate={{ y: ["0%", "200%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
      />
    </motion.div>
  );
};

export const ContentEcosystem = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="steami-section-label mb-4"
          >
            ◆ THE INTELLIGENCE ECOSYSTEM
          </motion.div>
          <h2 className="steami-heading text-3xl md:text-5xl mb-6">
            A Multi-Dimensional Knowledge Universe
          </h2>
          <p className="text-muted-foreground max-w-2xl text-lg">
            Our platform bridges the gap between raw data and structured intelligence across every scientific and technological frontier.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <PremiumCard key={cat.title} category={cat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};
