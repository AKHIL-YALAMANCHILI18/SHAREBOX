'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  File,
  X,
  RotateCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatFileSize } from '@/lib/utils';
import { useFileUpload } from '@/hooks/use-file-upload';
import type { FileRecord } from '@/types';

export interface FileUploadZoneProps {
  roomCode: string;
  onUploadCompleted: (file: FileRecord) => void;
  disabled?: boolean;
}

export function FileUploadZone({
  roomCode,
  onUploadCompleted,
  disabled = false,
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    queue,
    addFiles,
    retryUpload,
    cancelUpload,
    clearCompleted,
    isUploading,
  } = useFileUpload({
    roomCode,
    onUploadSuccess: onUploadCompleted,
    maxConcurrent: 3,
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled || !e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    addFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      // Reset input value so same files can be re-selected if desired
      e.target.value = '';
    }
  };

  const openBrowse = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openBrowse}
        className={`relative p-8 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center space-y-3 ${
          isDragOver
            ? 'border-accent bg-accent-light/40 shadow-card'
            : 'border-sb-border bg-surface hover:border-zinc-300 hover:bg-zinc-50/50'
        } ${disabled ? 'opacity-50 pointer-events-none cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform ${
            isDragOver
              ? 'scale-110 bg-accent text-white'
              : 'bg-zinc-100 border border-sb-border text-secondary-text'
          }`}
        >
          <UploadCloud className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-primary-text">
            Drop files here to upload, or{' '}
            <span className="text-accent underline underline-offset-2">browse</span>
          </p>
          <p className="text-xs text-secondary-text">
            Supports any file format (up to 500 MB per file). Original filename and bytes preserved.
          </p>
        </div>
      </div>

      {/* Active Upload Queue Display */}
      {queue.length > 0 && (
        <div className="p-4 rounded-xl border border-sb-border bg-surface space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-primary-text">
              Upload Progress ({queue.filter((q) => q.status === 'completed').length}/
              {queue.length})
            </span>
            {queue.some((q) => q.status === 'completed') && (
              <button
                onClick={clearCompleted}
                className="text-accent hover:underline font-medium text-[11px]"
              >
                Clear completed
              </button>
            )}
          </div>

          <div className="space-y-2">
            {queue.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-lg border border-sb-border bg-background space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <File className="w-3.5 h-3.5 text-secondary-text flex-shrink-0" />
                    <span className="font-medium text-primary-text truncate" title={item.name}>
                      {item.name}
                    </span>
                    <span className="text-[11px] text-secondary-text flex-shrink-0">
                      ({formatFileSize(item.size)})
                    </span>
                  </div>

                  {/* Actions / Status Indicators */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {item.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-success font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Done
                      </span>
                    )}

                    {item.status === 'error' && (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[11px] text-error font-medium truncate max-w-[120px]"
                          title={item.errorMessage}
                        >
                          {item.errorMessage || 'Failed'}
                        </span>
                        <button
                          onClick={() => retryUpload(item.id)}
                          className="p-1 rounded text-secondary-text hover:text-primary-text"
                          title="Retry"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {item.status !== 'completed' && (
                      <button
                        onClick={() => cancelUpload(item.id)}
                        className="p-1 rounded text-secondary-text hover:text-error"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {item.status !== 'completed' && item.status !== 'error' && (
                  <Progress value={item.progress} size="sm" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
