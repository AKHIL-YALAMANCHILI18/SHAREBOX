'use client';

import { useState, useRef, useCallback } from 'react';
import type { FileRecord, UploadInitResponse } from '@/types';

export interface UploadQueueItem {
  id: string; // client temporary ID
  file: File;
  name: string;
  size: number;
  progress: number;
  status: 'queued' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
  retryCount: number;
  fileRecord?: FileRecord;
}

export interface UseFileUploadOptions {
  roomCode: string;
  onUploadSuccess?: (fileRecord: FileRecord) => void;
  onUploadError?: (error: Error, file: File) => void;
  maxConcurrent?: number;
}

export function useFileUpload({
  roomCode,
  onUploadSuccess,
  onUploadError,
  maxConcurrent = 3,
}: UseFileUploadOptions) {
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const activeUploadsCount = useRef(0);
  const xhrMap = useRef<Map<string, XMLHttpRequest>>(new Map());

  // Upload an individual file via XHR to signed URL
  const uploadSingleItem = async (item: UploadQueueItem) => {
    activeUploadsCount.current++;
    setQueue((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading', progress: 5 } : i))
    );

    try {
      // Step 1: Initiate upload with backend
      const initRes = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          fileName: item.file.name,
          fileSize: item.file.size,
          mimeType: item.file.type || 'application/octet-stream',
        }),
      });

      if (!initRes.ok) {
        const errorData = await initRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status ${initRes.status}`);
      }

      const { file, signedUrl }: UploadInitResponse = await initRes.json();

      setQueue((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, fileRecord: file, progress: 15 } : i))
      );

      // Step 2: Upload direct to signed URL with XMLHttpRequest for fine-grained progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrMap.current.set(item.id, xhr);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            // Scale progress from 15% to 90% during upload
            const percent = 15 + Math.round((e.loaded / e.total) * 75);
            setQueue((prev) =>
              prev.map((i) => (i.id === item.id ? { ...i, progress: percent } : i))
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Storage rejected upload (HTTP ${xhr.status})`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.onabort = () => reject(new Error('Upload canceled'));

        xhr.open('PUT', signedUrl);
        xhr.setRequestHeader('Content-Type', item.file.type || 'application/octet-stream');
        xhr.send(item.file);
      });

      // Step 3: Confirm upload complete with backend
      setQueue((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, progress: 95 } : i))
      );

      const confirmRes = await fetch(`/api/files/${file.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode }),
      });

      if (!confirmRes.ok) {
        throw new Error('Failed to confirm upload with server');
      }

      const confirmedData = await confirmRes.json();
      const finalFile = confirmedData.file || file;

      setQueue((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: 'completed', progress: 100, fileRecord: finalFile }
            : i
        )
      );

      onUploadSuccess?.(finalFile);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      if (item.retryCount < 2) {
        // Retry automatically
        setQueue((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, retryCount: i.retryCount + 1, progress: 0, status: 'queued' }
              : i
          )
        );
      } else {
        setQueue((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: 'error', errorMessage: error.message }
              : i
          )
        );
        onUploadError?.(error, item.file);
      }
    } finally {
      activeUploadsCount.current--;
      xhrMap.current.delete(item.id);
      processNext();
    }
  };

  // Process next items from queue
  const processNext = useCallback(() => {
    setQueue((currentQueue) => {
      const active = activeUploadsCount.current;
      const slots = maxConcurrent - active;

      if (slots <= 0) return currentQueue;

      const pendingItems = currentQueue.filter((item) => item.status === 'queued');
      const itemsToStart = pendingItems.slice(0, slots);

      itemsToStart.forEach((item) => {
        uploadSingleItem(item);
      });

      return currentQueue;
    });
  }, [maxConcurrent, roomCode]);

  // Add files to queue
  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const newItems: UploadQueueItem[] = Array.from(files).map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'queued',
        retryCount: 0,
      }));

      setQueue((prev) => [...prev, ...newItems]);

      // Trigger processing in next microtask
      setTimeout(() => processNext(), 0);
    },
    [processNext]
  );

  // Retry an error item
  const retryUpload = useCallback(
    (id: string) => {
      setQueue((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, status: 'queued', progress: 0, errorMessage: undefined } : i
        )
      );
      setTimeout(() => processNext(), 0);
    },
    [processNext]
  );

  // Cancel an upload
  const cancelUpload = useCallback((id: string) => {
    const xhr = xhrMap.current.get(id);
    if (xhr) {
      xhr.abort();
      xhrMap.current.delete(id);
    }
    setQueue((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // Clear completed items
  const clearCompleted = useCallback(() => {
    setQueue((prev) => prev.filter((i) => i.status !== 'completed'));
  }, []);

  return {
    queue,
    addFiles,
    retryUpload,
    cancelUpload,
    clearCompleted,
    isUploading: queue.some((i) => i.status === 'uploading' || i.status === 'queued'),
  };
}
