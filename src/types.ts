export interface ImagePreset {
  id: string;
  name: string;
  width?: number;
  height?: number;
  widthMode?: WidthMode;
  maxSizeKB?: number; // target file size in KB
  isCustom?: boolean;
}

export type WidthMode = 'original' | 'ratio_16_9' | 'ratio_9_16' | 'exact';
export type FormatMode = 'original' | 'jpeg' | 'png';
export type CompressMode = 'quality' | 'target_size' | 'lossless' | 'original_size';
export type ResizeMode = 'crop' | 'stretch';

export interface GlobalSettings {
  widthMode: WidthMode;
  targetWidth: number; // custom or current
  targetHeight: number;
  keepAspectRatio: boolean;
  resizeMode: ResizeMode; // crop or stretch when keepAspectRatio is false
  formatMode: FormatMode;
  enableCompress: boolean;
  compressMode: CompressMode;
  quality: number; // 1-100
  targetSizeKB: number; // e.g. 400
}

export interface ImageItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  originalFormat: string; // e.g. "image/jpeg"
  previewUrl: string;
  
  // Processing configuration (copied from global or overridden)
  widthMode: WidthMode;
  targetWidth?: number;
  targetHeight?: number;
  keepAspectRatio: boolean;
  resizeMode: ResizeMode;
  formatMode: FormatMode;
  enableCompress: boolean;
  compressMode: CompressMode;
  quality: number;
  targetSizeKB?: number;
  
  // Processing status
  status: 'pending' | 'processing' | 'success' | 'failed';
  progress: number; // 0 to 100
  error?: string;
  
  // Output result
  processedBlob?: Blob;
  processedUrl?: string;
  processedSize?: number;
  processedWidth?: number;
  processedHeight?: number;
}
