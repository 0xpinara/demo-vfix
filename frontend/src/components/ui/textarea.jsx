import * as React from 'react';
import { cn } from '@/lib/cn';

export const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn('w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-slate-400', className)} {...props} />
));

Textarea.displayName = 'Textarea';



