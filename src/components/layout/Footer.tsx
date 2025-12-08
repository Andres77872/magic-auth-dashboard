/**
 * Footer Component
 * 
 * Page footer with copyright and links.
 * Can be used standalone or within layouts.
 * 
 * @see docs/DESIGN_SYSTEM/DASHBOARD_PATTERNS.md
 */
import React from 'react';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps): React.JSX.Element {
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      className={cn(
        '[grid-area:footer] border-t border-border bg-card px-4 lg:px-6 flex items-center',
        className
      )} 
      role="contentinfo"
    >
      <div className="w-full max-w-[1400px] mx-auto flex items-center justify-between max-sm:flex-col max-sm:gap-2">
        <span className="text-xs text-muted-foreground">
          © {currentYear} Magic Auth Dashboard. All rights reserved.
        </span>
        <div className="flex gap-4">
          <a 
            href="/docs" 
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
          <a 
            href="/support" 
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Support
          </a>
          <a 
            href="mailto:admin@magicauth.com" 
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 