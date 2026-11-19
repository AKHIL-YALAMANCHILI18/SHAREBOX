'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button, type ButtonProps } from './button';

export interface CopyButtonProps extends Omit<ButtonProps, 'onClick'> {
  value: string;
  label?: string;
  copiedLabel?: string;
  onCopySuccess?: () => void;
}

export function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied!',
  variant = 'secondary',
  size = 'sm',
  onCopySuccess,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = value;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      onCopySuccess?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      leftIcon={
        copied ? (
          <Check className="w-3.5 h-3.5 text-success" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )
      }
      {...props}
    >
      {copied ? copiedLabel : label}
    </Button>
  );
}
