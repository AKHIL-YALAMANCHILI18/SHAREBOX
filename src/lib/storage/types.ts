export interface UploadUrlResult {
  signedUrl: string;
  token: string;
  path: string;
}

export interface StorageAdapter {
  /** Create a signed URL for direct-to-storage upload. */
  createSignedUploadUrl(path: string): Promise<UploadUrlResult>;

  /** Create a short-lived signed download URL. */
  createSignedDownloadUrl(path: string, expiresInSeconds?: number): Promise<string>;

  /** Delete a single file from storage. */
  deleteFile(path: string): Promise<void>;

  /** Batch-delete files from storage. */
  deleteFiles(paths: string[]): Promise<void>;
}
