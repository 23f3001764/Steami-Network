import { useThemeStore } from '@/stores/theme-store';

interface AuthorCardProps {
  name: string;
  role: string;
  avatar: string;
  bio: string;
}

export function AuthorCard({ name, role, avatar, bio }: AuthorCardProps) {
  const isLight = useThemeStore((s) => s.theme === 'light');

  return (
    <div
      className="p-5 rounded-xl mb-6 flex flex-col items-center text-center group transition-all duration-300"
      style={{
        background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(10,20,40,0.5)',
        border: isLight ? '1px solid rgba(147,197,253,0.3)' : '1px solid rgba(99,179,237,0.1)',
      }}
    >
      <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-steami-cyan/20 group-hover:border-steami-cyan/50 transition-colors">
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      </div>
      <h3 className="font-serif text-lg font-extrabold text-foreground mb-1">{name}</h3>
      <p className="font-mono text-[11px] text-steami-gold uppercase tracking-wider mb-3">{role}</p>
      <p className="text-[14px] font-medium text-muted-foreground leading-relaxed">
        {bio}
      </p>
    </div>
  );
}
