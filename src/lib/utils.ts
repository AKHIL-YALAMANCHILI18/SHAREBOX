import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatTimeRemaining(expiresAt: string): string {
  const remaining = new Date(expiresAt).getTime() - Date.now();
  if (remaining <= 0) return 'Expired';

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filename.length - 1) return '';
  return filename.substring(lastDot + 1).toLowerCase();
}

export function getFileTypeCategory(filename: string): string {
  const ext = getFileExtension(filename);

  const categories: Record<string, string[]> = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico', 'tiff', 'avif'],
    video: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v'],
    audio: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'],
    document: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages'],
    spreadsheet: ['xls', 'xlsx', 'csv', 'ods', 'numbers'],
    presentation: ['ppt', 'pptx', 'key', 'odp'],
    archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
    code: [
      'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'cs', 'go',
      'rs', 'rb', 'php', 'swift', 'kt', 'html', 'css', 'json', 'xml', 'yaml',
      'yml', 'md', 'sql', 'sh', 'bat', 'ps1', 'r', 'scala', 'lua',
    ],
    executable: ['exe', 'msi', 'dmg', 'app', 'apk', 'deb', 'rpm'],
    disk: ['iso', 'img', 'vmdk', 'vdi'],
  };

  for (const [category, extensions] of Object.entries(categories)) {
    if (extensions.includes(ext)) return category;
  }

  return 'file';
}

export function formatRoomCode(code: string): string {
  if (code.length !== 8) return code;
  return `${code.slice(0, 4)} ${code.slice(4)}`;
}
