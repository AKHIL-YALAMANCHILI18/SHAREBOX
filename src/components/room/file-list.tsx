'use client';

import React, { useState } from 'react';
import { DownloadCloud, FolderOpen, ArrowUpDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileItem } from './file-item';
import { formatFileSize } from '@/lib/utils';
import type { FileRecord } from '@/types';

export interface FileListProps {
  files: FileRecord[];
  currentParticipantId?: string;
  onDownloadFile: (fileId: string, fileName: string) => Promise<void>;
  onDeleteFile?: (fileId: string) => Promise<void>;
  onDownloadAll: () => Promise<void>;
}

export function FileList({
  files,
  currentParticipantId,
  onDownloadFile,
  onDeleteFile,
  onDownloadAll,
}: FileListProps) {
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const completedFiles = files.filter((f) => f.status === 'completed' || !f.status);

  const filteredFiles = completedFiles.filter((f) =>
    f.original_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBytes = completedFiles.reduce((acc, f) => acc + Number(f.size || 0), 0);

  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    try {
      await onDownloadAll();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar: Count, total size, Download All button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-primary-text">
            Shared Files
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-secondary-text font-mono font-medium">
            {completedFiles.length}
          </span>
          {completedFiles.length > 0 && (
            <span className="text-xs text-secondary-text font-medium">
              ({formatFileSize(totalBytes)})
            </span>
          )}
        </div>

        {completedFiles.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadAll}
              isLoading={isDownloadingAll}
              leftIcon={<DownloadCloud className="w-4 h-4 text-accent" />}
            >
              Download All
            </Button>
          </div>
        )}
      </div>

      {/* Search filter if there are more than 4 files */}
      {completedFiles.length > 4 && (
        <div className="max-w-xs">
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-3.5 h-3.5" />}
            className="h-8 text-xs bg-surface"
          />
        </div>
      )}

      {/* File list items */}
      {completedFiles.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-sb-border bg-surface/50 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-sb-border flex items-center justify-center text-secondary-text mx-auto">
            <FolderOpen className="w-6 h-6 text-zinc-400" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-primary-text">
              No files shared yet
            </h4>
            <p className="text-xs text-secondary-text max-w-sm mx-auto">
              Drag and drop files into the upload zone above or invite a peer with your room code.
            </p>
          </div>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="p-8 text-center text-xs text-secondary-text">
          No files match &quot;{searchQuery}&quot;
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFiles.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              currentParticipantId={currentParticipantId}
              onDownload={onDownloadFile}
              onDelete={onDeleteFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}
