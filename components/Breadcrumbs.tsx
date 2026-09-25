'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { BreadcrumbItem } from '@/lib/types';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center flex-wrap gap-1.5 text-[13px] text-slate-500 font-medium" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={index} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 stroke-[2] flex-shrink-0" />
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-slate-400 hover:text-slate-600 transition-colors duration-150"
              >
                {item.title}
              </Link>
            ) : (
              <span className="text-primary font-normal">
                {item.title}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
