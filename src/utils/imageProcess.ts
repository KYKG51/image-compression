import { WidthMode, FormatMode, CompressMode, ResizeMode } from '../types';

/**
 * Loads a File object into an HTMLImageElement
 */
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Calculates correct output dimensions based on resizing mode and constraints
 */
export function calculateDimensions(
  origWidth: number,
  origHeight: number,
  mode: WidthMode,
  targetWidth?: number,
  targetHeight?: number,
  keepAspectRatio: boolean = true
): { width: number; height: number } {
  let width = origWidth;
  let height = origHeight;

  const tWidth = targetWidth || origWidth;
  const tHeight = targetHeight || origHeight;

  switch (mode) {
    case 'original':
      width = origWidth;
      height = origHeight;
      break;

    case 'ratio_16_9': {
      width = 1920;
      height = 1080;
      break;
    }

    case 'ratio_9_16': {
      width = 1080;
      height = 1920;
      break;
    }

    case 'exact':
      if (keepAspectRatio) {
        const ratio = Math.min(tWidth / origWidth, tHeight / origHeight);
        width = Math.round(origWidth * ratio);
        height = Math.round(origHeight * ratio);
      } else {
        width = tWidth;
        height = tHeight;
      }
      break;
  }

  // Ensure dimensions are at least 1px
  return {
    width: Math.max(1, width),
    height: Math.max(1, height),
  };
}

/**
 * Converts a canvas to Blob with a specific quality
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas conversion failed'));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Performs compression and resizing on an image.
 * Uses an iterative binary search on quality values to stay under target file size if requested.
 */
export async function compressAndResizeImage(
  file: File,
  config: {
    widthMode: WidthMode;
    targetWidth?: number;
    targetHeight?: number;
    keepAspectRatio: boolean;
    resizeMode?: ResizeMode;
    formatMode: FormatMode;
    enableCompress: boolean;
    compressMode: CompressMode;
    quality: number;
    targetSizeKB?: number;
  },
  onProgress?: (progress: number) => void
): Promise<{
  blob: Blob;
  width: number;
  height: number;
  format: string;
  qualityUsed: number;
  convertedFormat?: boolean;
}> {
  onProgress?.(10);

  // Fast bypass for completely unmodified file when compression is disabled
  const isSameFormat = 
    config.formatMode === 'original' || 
    (config.formatMode === 'jpeg' && (file.type === 'image/jpeg' || file.type === 'image/jpg')) ||
    (config.formatMode === 'png' && file.type === 'image/png');

  const isSameSize = config.widthMode === 'original';

  if (!config.enableCompress && isSameSize && isSameFormat) {
    onProgress?.(50);
    const img = await loadImage(file);
    onProgress?.(100);
    return {
      blob: file,
      width: img.naturalWidth,
      height: img.naturalHeight,
      format: file.type,
      qualityUsed: 1.0,
      convertedFormat: false,
    };
  }
  
  if (config.compressMode === 'original_size' && isSameSize && isSameFormat) {
    onProgress?.(50);
    const img = await loadImage(file);
    onProgress?.(100);
    return {
      blob: file,
      width: img.naturalWidth,
      height: img.naturalHeight,
      format: file.type,
      qualityUsed: 1.0,
      convertedFormat: false,
    };
  }
  
  // 1. Load the image
  const img = await loadImage(file);
  onProgress?.(30);

  // 2. Calculate output dimensions
  let { width, height } = calculateDimensions(
    img.naturalWidth,
    img.naturalHeight,
    config.widthMode,
    config.targetWidth,
    config.targetHeight,
    config.keepAspectRatio
  );

  // 3. Map format mode to MIME type (do this early to know if we need a white background)
  let mimeType = file.type;
  if (config.formatMode === 'jpeg') mimeType = 'image/jpeg';
  else if (config.formatMode === 'png') mimeType = 'image/png';
  // If original format option is chosen, mimeType strictly matches file.type, 100% untouched!

  // 4. Setup canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas 2D context');
  }

  // Draw white background for JPEG output format to gracefully handle transparent images (no black box)
  if (mimeType === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  // Draw image on canvas (high-quality scaling defaults)
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const modeToUse = config.resizeMode || 'crop';
  const isRatioMode = config.widthMode === 'ratio_16_9' || config.widthMode === 'ratio_9_16';

  if (isRatioMode || (!config.keepAspectRatio && modeToUse === 'crop')) {
    // cover crop (center crop directly to desired ratio without distortion or stretching)
    const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
    const drawWidth = img.naturalWidth * scale;
    const drawHeight = img.naturalHeight * scale;
    const x = (width - drawWidth) / 2;
    const y = (height - drawHeight) / 2;
    ctx.drawImage(img, x, y, drawWidth, drawHeight);
  } else {
    // stretch to exactly fit bounds (or keepAspectRatio keeps scale)
    ctx.drawImage(img, 0, 0, width, height);
  }
  onProgress?.(50);
  onProgress?.(60);

  let finalBlob: Blob;
  let qualityUsed = config.quality / 100;
  let convertedFormat = false;

  // 5. Compress
  if (!config.enableCompress) {
    // If not enabled, return lossless or use default encoding (without compression quality limit)
    finalBlob = await canvasToBlob(canvas, mimeType, mimeType === 'image/png' ? undefined : 0.98);
    qualityUsed = 1.0;
  } else if (config.compressMode === 'original_size') {
    finalBlob = await canvasToBlob(canvas, mimeType, mimeType === 'image/png' ? undefined : 1.0);
    qualityUsed = 1.0;
  } else if (config.compressMode === 'lossless') {
    // For PNG it's standard lossless. For others, quality = 1.0
    finalBlob = await canvasToBlob(canvas, mimeType, mimeType === 'image/png' ? undefined : 1.0);
    qualityUsed = 1.0;
  } else if (config.compressMode === 'quality') {
    const q = config.quality / 100;
    finalBlob = await canvasToBlob(canvas, mimeType, mimeType === 'image/png' ? undefined : q);
    qualityUsed = q;
  } else {
    // Target size compression: strictly below target minus 10KB (ensure at least 10KB safety margin)
    const rawTargetKB = config.targetSizeKB || 400;
    const targetSizeLimitBytes = Math.max(10, rawTargetKB - 10) * 1024;
    
    // Check if we need to convert PNG to JPEG when it exceeds size (for compression support)
    if (mimeType === 'image/png') {
      const pngBlob = await canvasToBlob(canvas, 'image/png');
      if (pngBlob.size <= targetSizeLimitBytes) {
        finalBlob = pngBlob;
        qualityUsed = 1.0;
      } else {
        // PNG exceeds target, convert to JPEG for compressed output fallback
        mimeType = 'image/jpeg';
        convertedFormat = true;

        // Re-draw canvas content onto a solid white background so transparency is cleanly formatted as white
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        if (isRatioMode || (!config.keepAspectRatio && modeToUse === 'crop')) {
          const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
          const drawWidth = img.naturalWidth * scale;
          const drawHeight = img.naturalHeight * scale;
          const x = (width - drawWidth) / 2;
          const y = (height - drawHeight) / 2;
          ctx.drawImage(img, x, y, drawWidth, drawHeight);
        } else {
          ctx.drawImage(img, 0, 0, width, height);
        }
      }
    }

    if (!finalBlob!) {
      let bestBlob: Blob | null = null;
      let bestQ = 0.8;
      
      let smallestBlobEncountered: Blob | null = null;
      let smallestBlobSize = Infinity;
      let smallestBlobQ = 0.05;
      let smallestBlobWidth = width;
      let smallestBlobHeight = height;

      const trackBlob = (blob: Blob, q: number, w: number, h: number) => {
        if (blob.size < smallestBlobSize) {
          smallestBlobSize = blob.size;
          smallestBlobEncountered = blob;
          smallestBlobQ = q;
          smallestBlobWidth = w;
          smallestBlobHeight = h;
        }
      };

      // 1. Binary search on quality to fit specified size on original resolution
      let minQ = 0.05;
      let maxQ = 0.98;
      for (let i = 0; i < 7; i++) {
        const midQ = (minQ + maxQ) / 2;
        const testBlob = await canvasToBlob(canvas, mimeType, midQ);
        trackBlob(testBlob, midQ, width, height);

        if (testBlob.size <= targetSizeLimitBytes) {
          bestBlob = testBlob;
          bestQ = midQ;
          minQ = midQ; // Try higher quality
        } else {
          maxQ = midQ; // Reduce quality
        }
      }

      // 2. If it is still too big even at the lowest quality (or conversion), 
      // we must iteratively scale down the dimension resolution to strictly enforce the limit!
      if (!bestBlob || bestBlob.size > targetSizeLimitBytes) {
        let scale = 0.9;
        const maxScaleSteps = 15;
        let step = 0;

        while (step < maxScaleSteps && scale >= 0.05) {
          const sWidth = Math.max(1, Math.round(width * scale));
          const sHeight = Math.max(1, Math.round(height * scale));
          
          const scaleCanvas = document.createElement('canvas');
          scaleCanvas.width = sWidth;
          scaleCanvas.height = sHeight;
          const sCtx = scaleCanvas.getContext('2d');
          
          if (sCtx) {
            if (mimeType === 'image/jpeg') {
              sCtx.fillStyle = '#FFFFFF';
              sCtx.fillRect(0, 0, sWidth, sHeight);
            }
            sCtx.imageSmoothingEnabled = true;
            sCtx.imageSmoothingQuality = 'high';
            sCtx.drawImage(img, 0, 0, sWidth, sHeight);
            
            // Try different qualities at this scaled resolution
            let minQ2 = 0.05;
            let maxQ2 = 0.95;
            let currentBestBlob: Blob | null = null;
            let currentBestQ = 0.5;

            for (let j = 0; j < 5; j++) {
              const midQ2 = (minQ2 + maxQ2) / 2;
              const testBlob = await canvasToBlob(scaleCanvas, mimeType, midQ2);
              trackBlob(testBlob, midQ2, sWidth, sHeight);

              if (testBlob.size <= targetSizeLimitBytes) {
                currentBestBlob = testBlob;
                currentBestQ = midQ2;
                minQ2 = midQ2;
              } else {
                maxQ2 = midQ2;
              }
            }

            if (currentBestBlob && currentBestBlob.size <= targetSizeLimitBytes) {
              bestBlob = currentBestBlob;
              bestQ = currentBestQ;
              width = sWidth;
              height = sHeight;
              break; // Fits strictly now!
            } else {
              // Try the lowest quality fallback on this scale
              const lowQBlob = await canvasToBlob(scaleCanvas, mimeType, 0.03);
              trackBlob(lowQBlob, 0.03, sWidth, sHeight);
              if (lowQBlob.size <= targetSizeLimitBytes) {
                bestBlob = lowQBlob;
                bestQ = 0.03;
                width = sWidth;
                height = sHeight;
                break;
              }
            }
          }
          scale -= 0.08;
          step++;
        }
      }

      // 3. Absolute fallback: if even at lowest resolution/quality it exceeds limit,
      // use the overall smallest candidate we encountered during the entire process!
      if (!bestBlob || bestBlob.size > targetSizeLimitBytes) {
        if (smallestBlobEncountered && smallestBlobEncountered.size <= targetSizeLimitBytes) {
          bestBlob = smallestBlobEncountered;
          bestQ = smallestBlobQ;
          width = smallestBlobWidth;
          height = smallestBlobHeight;
        } else if (smallestBlobEncountered) {
          bestBlob = smallestBlobEncountered;
          bestQ = smallestBlobQ;
          width = smallestBlobWidth;
          height = smallestBlobHeight;
        }
      }

      finalBlob = bestBlob || (await canvasToBlob(canvas, mimeType, 0.05));
      qualityUsed = bestQ;
    }
  }

  // 6. Absolute Safeguard: Prevent processed size from exceeding original size in any compression mode.
  // We guarantee that the final size is smaller or equal to original, unless a massive format translation (like JPG to PNG) makes it impossible.
  if (finalBlob.size > file.size) {
    const formatUnchanged = config.formatMode === 'original' || mimeType === file.type;
    const sizeUnchanged = config.widthMode === 'original';

    if (formatUnchanged && sizeUnchanged) {
      // If we didn't perform any resizing and kept the format, fallback to the original untouched file object!
      finalBlob = file;
      mimeType = file.type;
      qualityUsed = 1.0;
    } else if (mimeType !== 'image/png' && config.enableCompress) {
      // Resized image or formatted to different lossy format.
      // Perform dynamic quality reduction loop to enforce processedSize <= originalSize constraint
      let testQ = Math.min(qualityUsed, 0.9);
      while (testQ >= 0.45 && finalBlob.size > file.size) {
        const testBlob = await canvasToBlob(canvas, mimeType, testQ);
        if (testBlob.size < finalBlob.size) {
          finalBlob = testBlob;
          qualityUsed = testQ;
        }
        if (testBlob.size <= file.size) {
          break;
        }
        testQ -= 0.08;
      }
    }
  }

  onProgress?.(100);

  return {
    blob: finalBlob,
    width,
    height,
    format: mimeType,
    qualityUsed,
    convertedFormat,
  };
}
