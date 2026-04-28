import { LogIn } from 'lucide-react';
import { AuthModal } from '@/components/AuthModal';
import { useState } from 'react';

export function RequireLogin({ message = 'Please login first to use this feature.' }: { message?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="glass-card p-8 text-center">
      <LogIn className="w-8 h-8 text-steami-gold mx-auto mb-3" />
      <h1 className="steami-heading text-2xl mb-2">Login First</h1>
      <p className="text-[14px] text-muted-foreground mb-5">{message}</p>
      <button className="steami-btn text-[11px]" onClick={() => setOpen(true)}>Login</button>
      <AuthModal open={open} onClose={() => setOpen(false)} onSuccess={() => setOpen(false)} />
    </div>
  );
}
