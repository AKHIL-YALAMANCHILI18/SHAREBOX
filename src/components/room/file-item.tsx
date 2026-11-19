'use client';

import React, { useState } from 'react';
import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  File,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { formatFileSize, getFileTypeCategory } from '@/lib/utils';
import type { FileRecord } from '@/types';

export interface FileItemProps {
  file: FileRecord;
  currentParticipantId?: string;
  onDownload: (fileId: string, fileName: string) => Promise<void>;
  onDelete?: (fileId: string) => Promise<void>;
}

export function FileItem({
  file,
  currentParticipantId,
  onDownload,
  onDelete,
}: FileItemProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = currentParticipantId === file.participant_id;
  const category = getFileTypeCategory(file.original_name);

  // Dynamic icon based on category
  const renderIcon = () => {
    const iconClass = 'w-5 h-5';
    switch (category) {
      case 'image':
        return <FileImage className={`${iconClass} text-emerald-600`} />;
      case 'video':
        return <FileVideo className={`${iconClass} text-purple-600`} />;
      case 'audio':
        return <FileAudio className={`${iconClass} text-pink-600`} />;
      case 'document':
        return <FileText className={`${iconClass} text-blue-600`} />;
      case 'spreadsheet':
        return <FileSpreadsheet className={`${iconClass} text-teal-600`} />;
      case 'archive':
        return <FileArchive className={`${iconClass} text-amber-600`} />;
      case 'code':
        return <FileCode className={`${iconClass} text-indigo-600`} />;
      default:
        return <File className={`${iconClass} text-zinc-500`} />;
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownload(file.id, file.original_name);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(file.id);
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
    }
  };

  const formattedTime = new Date(file.uploaded_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-sb-border bg-surface hover:border-zinc-300 transition-all duration-150 gap-3 group">
      {/* Left: Icon & File Info */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-sb-border flex items-center justify-center flex-shrink-0 group-hover:bg-zinc-100 transition-colors">
          {renderIcon()}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-primary-text truncate" title={file.original_name}>
            {file.original_name}
          </p>

          <div className="flex items-center gap-2 mt-0.5 text-xs text-secondary-text flex-wrap">
            <span>{formatFileSize(Number(file.size))}</span>
            <span>•</span>
            <span className="truncate max-w-[120px]">
              {file.uploader_name ? file.uploader_name : isOwner ? 'You' : 'Peer'}
            </span>
            <span>•</span>
            <span>{formattedTime}</span>

            {file.status === 'uploading' && (
              <span className="inline-flex items-center gap-1 text-[11px] text-accent">
                <Spinner size="sm" className="w-3 h-3" /> Uploading...
              </span>
            )}
            {file.status === 'failed' && (
              <span className="inline-flex items-center gap-1 text-[11px] text-error">
                <AlertCircle className="w-3 h-3" /> Failed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Download & Delete Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleDownload}
          isLoading={isDownloading}
          leftIcon={<Download className="w-3.5 h-3.5 text-primary-text" />}
          className="h-8 text-xs font-medium"
        >
          <span className="hidden sm:inline">Download</span>
        </Button>

        {onDelete && isOwner && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            isLoading={isDeleting}
            className="h-8 w-8 p-0 text-secondary-text hover:text-error hover:bg-red-50"
            title="Delete file"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
