import * as React from 'react';
import { cn } from '@/lib/cn';

export const Input = React.forwardRef(({ className, ...props }, ref) => (
  <input ref={ref} className={cn('h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none ring-0 focus:border-slate-400 text-slate-900', className)} {...props} />
));

Input.displayName = 'Input';

