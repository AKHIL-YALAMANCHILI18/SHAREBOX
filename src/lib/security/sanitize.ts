import path from 'path';

/**
 * Sanitize a user-provided filename to prevent path traversal
 * and other filesystem attacks.
 */
export function sanitizeFilename(filename: string): string {
  // Remove null bytes
  let sanitized = filename.replace(/\0/g, '');

  // Extract basename to prevent path traversal
  sanitized = path.basename(sanitized);

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Replace filesystem-dangerous characters
  sanitized = sanitized.replace(/[<>:"/\\|?*]/g, '_');

  // Collapse multiple underscores/dots
  sanitized = sanitized.replace(/_{2,}/g, '_');
  sanitized = sanitized.replace(/\.{2,}/g, '.');

  // Limit total length while preserving extension
  if (sanitized.length > 255) {
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    sanitized = name.substring(0, 255 - ext.length) + ext;
  }

  // Fallback for empty result
  if (!sanitized || sanitized === '.' || sanitized === '..') {
    sanitized = 'unnamed_file';
  }

  return sanitized;
}

/** Validate file size is within allowed limit. */
export function validateFileSize(size: number, maxSizeBytes: number): boolean {
  return Number.isFinite(size) && size > 0 && size <= maxSizeBytes;
}

/** Normalize and validate a MIME type string. */
export function validateMimeType(mimeType: string): string {
  const normalized = mimeType.toLowerCase().trim();
  if (/^[a-z]+\/[a-z0-9][a-z0-9!#$&\-^_.+]*$/.test(normalized)) {
    return normalized;
  }
  return 'application/octet-stream';
}
