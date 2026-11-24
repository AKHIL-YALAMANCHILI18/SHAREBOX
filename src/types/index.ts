/* ─── Domain types ─── */

export interface Room {
  id: string;
  code: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface Participant {
  id: string;
  room_id: string;
  display_name: string;
  session_token_hash: string;
  joined_at: string;
  is_active: boolean;
}

export interface FileRecord {
  id: string;
  room_id: string;
  participant_id: string;
  original_name: string;
  sanitized_name: string;
  storage_path: string;
  mime_type: string;
  size: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  uploaded_at: string;
  uploader_name?: string;
}

export interface UploadSession {
  id: string;
  file_id: string;
  room_id: string;
  participant_id: string;
  upload_token: string;
  expires_at: string;
  created_at: string;
}

/* ─── API request / response types ─── */

export interface CreateRoomRequest {
  displayName?: string;
  codeType?: 'random' | 'custom';
  customCode?: string;
}

export interface CreateRoomResponse {
  room: Room;
  sessionToken: string;
  participant: { id: string; display_name: string };
}

export interface PresenceParticipant {
  id: string;
  display_name: string;
  online: boolean;
}

export interface JoinRoomRequest {
  code: string;
  displayName?: string;
}

export interface JoinRoomResponse {
  room: Room;
  sessionToken: string;
  participant: { id: string; display_name: string };
  files: FileRecord[];
  participants?: PresenceParticipant[];
}

export interface UploadInitRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface UploadInitResponse {
  file: FileRecord;
  signedUrl: string;
  token: string;
}

export interface UploadConfirmRequest {
  fileId: string;
}

export interface ApiError {
  error: string;
  code?: string;
}

/* ─── Realtime event types ─── */

export interface RealtimeFileEvent {
  type: 'file_added' | 'file_removed' | 'file_completed';
  file: FileRecord;
}

export interface RealtimeParticipantEvent {
  type: 'participant_joined' | 'participant_left';
  participant: { id: string; display_name: string };
}

/* ─── Component props ─── */

export interface RoomContextValue {
  room: Room;
  participant: Participant;
  files: FileRecord[];
  participants: { id: string; display_name: string; online: boolean }[];
  isExpired: boolean;
  uploadFile: (file: File) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  downloadFile: (fileId: string, fileName: string) => Promise<void>;
  downloadAll: () => Promise<void>;
}
