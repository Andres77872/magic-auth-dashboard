import React, { useId, useState } from 'react';
import { AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  /**
   * For irreversible actions: the operator must type this exact text (e.g. the
   * username) before the confirm button enables.
   */
  confirmationPhrase?: string;
  /** Extra fields shown under the message (e.g. an optional reason). */
  children?: React.ReactNode;
}

const variantConfig = {
  danger: {
    icon: AlertCircle,
    iconClass: 'text-destructive',
    tile: 'bg-destructive/10',
    buttonVariant: 'destructive' as const,
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-warning',
    tile: 'bg-warning/10',
    buttonVariant: 'primary' as const,
  },
  info: {
    icon: Info,
    iconClass: 'text-info',
    tile: 'bg-info/10',
    buttonVariant: 'primary' as const,
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  confirmationPhrase,
  children,
}: ConfirmDialogProps): React.JSX.Element {
  const config = variantConfig[variant];
  const Icon = config.icon;
  const inputId = useId();
  const [typed, setTyped] = useState('');
  // Clear the typed phrase whenever the dialog closes, however it was closed.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (!isOpen) setTyped('');
  }
  const phraseMatches =
    !confirmationPhrase || typed.trim() === confirmationPhrase;

  const close = (): void => {
    setTyped('');
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isLoading && close()}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                config.tile,
                config.iconClass
              )}
              aria-hidden="true"
            >
              <Icon className="h-5 w-5" />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription asChild>
          <div className="text-[13px] leading-relaxed text-muted-foreground">
            {message}
          </div>
        </DialogDescription>
        {children}
        {confirmationPhrase && (
          <div className="space-y-1.5">
            <label htmlFor={inputId} className="text-xs text-muted-foreground">
              Type{' '}
              <span className="font-mono font-medium text-foreground">
                {confirmationPhrase}
              </span>{' '}
              to confirm
            </label>
            <Input
              id={inputId}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              disabled={isLoading}
            />
          </div>
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={close} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={onConfirm}
            disabled={isLoading || !phraseMatches}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmDialog;
