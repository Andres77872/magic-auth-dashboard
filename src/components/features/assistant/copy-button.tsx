import { useState, type JSX } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
export function CopyButton({
  value,
  label = 'Copy',
  className,
  showLabel = true,
}: {
  value: string;
  label?: string;
  className?: string;
  showLabel?: boolean;
}): JSX.Element {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <Button
      type="button"
      size="xs"
      variant="ghost"
      className={className}
      aria-label={failed ? 'Copy failed; select the text manually' : label}
      onClick={() => {
        void (async () => {
          try {
            if (!navigator.clipboard) throw new Error('Clipboard unavailable');
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setFailed(false);
          } catch {
            setFailed(true);
          }
        })();
      }}
    >
      {copied ? <Check /> : <Copy />}
      {showLabel && (failed ? 'Select to copy' : copied ? 'Copied' : label)}
    </Button>
  );
}
