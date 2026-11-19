import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { STORAGE_BUCKET } from '@/lib/constants';
import type { StorageAdapter, UploadUrlResult } from './types';

export class SupabaseStorageAdapter implements StorageAdapter {
  private bucket: string;

  constructor(bucket: string = STORAGE_BUCKET) {
    this.bucket = bucket;
  }

  async createSignedUploadUrl(path: string): Promise<UploadUrlResult> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .createSignedUploadUrl(path);

    if (error || !data) {
      throw new Error(`Failed to create upload URL: ${error?.message ?? 'unknown error'}`);
    }

    return {
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
    };
  }

  async createSignedDownloadUrl(path: string, expiresInSeconds = 300): Promise<string> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresInSeconds);

    if (error || !data) {
      throw new Error(`Failed to create download URL: ${error?.message ?? 'unknown error'}`);
    }

    return data.signedUrl;
  }

  async deleteFile(path: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage
      .from(this.bucket)
      .remove([path]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async deleteFiles(paths: string[]): Promise<void> {
    if (paths.length === 0) return;

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage
      .from(this.bucket)
      .remove(paths);

    if (error) {
      throw new Error(`Failed to delete files: ${error.message}`);
    }
  }
}

let adapter: SupabaseStorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (!adapter) {
    adapter = new SupabaseStorageAdapter();
  }
  return adapter;
}
