import * as React from 'react';
import { cn } from '@/lib/cn';

export function Button({ className, variant='default', size='md', ...props }) {
  const base = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none';
  const style = variant === 'outline'
    ? 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50'
    : 'bg-slate-900 text-white hover:bg-slate-800';
  const sz = size === 'sm' ? 'h-9 px-3 rounded-xl text-sm' : 'h-10 px-4 rounded-xl';
  return <button className={cn(base, style, sz, className)} {...props} />;
}



