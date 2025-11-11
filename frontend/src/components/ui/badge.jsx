import * as React from 'react';
import { cn } from '@/lib/cn';

export function Badge({ className, variant='default', ...props }) {
  const v = variant==='secondary' ? 'bg-slate-100 text-slate-800'
    : variant==='outline' ? 'border border-slate-300 text-slate-700'
    : 'bg-slate-900 text-white';
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs', v, className)} {...props} />;
}



