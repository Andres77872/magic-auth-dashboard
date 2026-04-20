/**
 * API Key Reveal Modal
 *
 * One-time reveal modal for displaying the full API key token after creation.
 * CRITICAL: Token is displayed exactly once and must be copied before closing.
 * 
 * Features:
 * - Token display in monospace, copyable field
 * - Copy-to-clipboard button with success indicator
 * - Forced confirmation checkbox requirement
 * - Prevents dismissal without confirmation
 * - Clear token from memory on close
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Key, Copy, Check, AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { CreateApiKeyResponse } from '@/types/api-key.types';

interface ApiKeyRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  keyData: CreateApiKeyResponse;
}

export function ApiKeyRevealModal({
  isOpen,
  onClose,
  keyData,
}: ApiKeyRevealModalProps): React.JSX.Element {
  // State
  const [hasCopied, setHasCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [showConfirmWarning, setShowConfirmWarning] = useState(false);

  // Ref to hold token (cleared on close)
  const tokenRef = useRef<string | null>(null);

  // Store token from response
  useEffect(() => {
    if (isOpen && keyData?.data?.api_key) {
      tokenRef.current = keyData.data.api_key;
    }
  }, [isOpen, keyData]);

  // Clear token on close
  useEffect(() => {
    if (!isOpen) {
      tokenRef.current = null;
      setHasCopied(false);
      setHasConfirmed(false);
      setShowConfirmWarning(false);
    }
  }, [isOpen]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!tokenRef.current) return;

    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(tokenRef.current);
      setHasCopied(true);
      
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      const tokenField = document.getElementById('api-key-token');
      if (tokenField instanceof HTMLInputElement) {
        tokenField.select();
        try {
          document.execCommand('copy');
          setHasCopied(true);
          setTimeout(() => setHasCopied(false), 2000);
        } catch {
          console.error('Copy failed: fallback execCommand also failed');
        }
      }
    } finally {
      setIsCopying(false);
    }
  }, []);

  // Confirm handler - allows proceeding even without copying
  const handleConfirm = useCallback(() => {
    if (!hasCopied && !hasConfirmed) {
      setShowConfirmWarning(true);
      return;
    }
    
    onClose();
  }, [hasCopied, hasConfirmed, onClose]);

  // Prevent escape key dismissal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (isOpen && e.key === 'Escape' && !hasConfirmed) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return (): void => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasConfirmed]);

  // Get key details
  const key = keyData?.data;
  const token = key?.api_key || '';

  if (!key) return <></>;

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // Prevent closing without confirmation
        if (!open && !hasConfirmed) {
          return;
        }
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent 
        className="sm:max-w-[600px]"
        // Hide close button by overlaying style
        onPointerDownOutside={(e) => {
          // Prevent backdrop click closing
          if (!hasConfirmed) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-success" />
            API Key Created
          </DialogTitle>
          <DialogDescription>
            Your new API key has been created. Save this token now — it will not be shown again.
          </DialogDescription>
        </DialogHeader>

        {/* Critical warning */}
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground mb-1">Save This Token Now</h4>
              <p className="text-sm text-muted-foreground">
                This is the only time you will see the full API key token. 
                After closing this dialog, the token cannot be retrieved again.
              </p>
            </div>
          </div>
        </div>

        {/* Key identification */}
        <div className="flex items-center gap-3 py-2">
          <Badge variant="subtlePrimary" size="md">
            Fingerprint: {key.fingerprint}
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">
            Key ending in ...{key.secret_last4}
          </span>
        </div>

        {/* Token display */}
        <div className="space-y-2">
          <label className="text-sm font-medium">API Key Token</label>
          <div className="relative">
            <input
              id="api-key-token"
              type="text"
              value={token}
              readOnly
              className="flex w-full rounded-md border border-input bg-muted px-3 py-2 pr-10 font-mono text-sm shadow-sm"
              onClick={(e) => e.currentTarget.select()}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7"
              onClick={() => void handleCopy()}
              disabled={isCopying}
            >
              {isCopying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : hasCopied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          {hasCopied && (
            <p className="text-sm text-success">Copied to clipboard!</p>
          )}
        </div>

        {/* Confirmation checkbox */}
        <div className="flex items-start gap-3 py-4">
          <Checkbox
            id="confirm-saved"
            checked={hasConfirmed}
            onCheckedChange={(checked) => {
              setHasConfirmed(checked === true);
              if (checked) {
                setShowConfirmWarning(false);
              }
            }}
            label="I have saved this token securely"
          />
        </div>

        {/* Confirm warning */}
        {showConfirmWarning && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
            <p className="text-sm text-warning mb-3">
              You haven't copied the token yet. Are you sure? You won't be able to see this token again.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowConfirmWarning(false)}
              >
                Go Back to Copy
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-warning text-warning hover:bg-warning/10"
                onClick={onClose}
              >
                Confirm Without Copy
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={handleConfirm}
            disabled={showConfirmWarning}
            variant={hasCopied ? 'primary' : 'outline'}
          >
            {hasCopied ? 'Confirm' : 'Confirm Without Copying'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ApiKeyRevealModal;