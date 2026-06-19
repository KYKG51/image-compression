import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { 
  ImagePreset, ImageItem, GlobalSettings, WidthMode, FormatMode, CompressMode
} from './types';
import { compressAndResizeImage } from './utils/imageProcess';
import PresetSelector from './components/PresetSelector';
import ImageDropzone from './components/ImageDropzone';
import BatchSettings from './components/BatchSettings';
import ImageItemRow from './components/ImageItemRow';

import { 
  Image as ImageIcon, Download, Trash2, Plus, RefreshCw, 
  Sparkles, CheckCircle2, Files, Info, HelpCircle, HardDrive, 
  TrendingDown, Check, Zap, X
} from 'lucide-react';

const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  widthMode: 'original',
  targetWidth: 1920,
  targetHeight: 1085, // just matching line size
  keepAspectRatio: true,
  resizeMode: 'crop',
  formatMode: 'original',
  enableCompress: true,
  compressMode: 'lossless',
  quality: 80,
  targetSizeKB: 400,
};

export default function App() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(DEFAULT_GLOBAL_SETTINGS);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [zipProgress, setZipProgress] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warn' | 'error' } | null>(null);
  const [lightboxItem, setLightboxItem] = useState<ImageItem | null>(null);
  
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  // Auto-fading toast helper
  const showToast = (message: string, type: 'success' | 'info' | 'warn' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Read metadata width/height of a typical File image
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ width: 0, height: 0 });
      };
      img.src = url;
    });
  };

  // Multiple files landing processor
  const handleFilesAdded = async (newFiles: File[]) => {
    const loadedItems: ImageItem[] = [];
    
    showToast(`正在加载 ${newFiles.length} 张图片...`, 'info');

    for (const file of newFiles) {
      const dimensions = await getImageDimensions(file);
      
      loadedItems.push({
        id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        originalSize: file.size,
        originalWidth: dimensions.width,
        originalHeight: dimensions.height,
        originalFormat: file.type,
        previewUrl: URL.createObjectURL(file),
        
        // Copy current global configurations as initial specific ones
        widthMode: globalSettings.widthMode,
        targetWidth: globalSettings.targetWidth,
        targetHeight: globalSettings.targetHeight,
        keepAspectRatio: globalSettings.keepAspectRatio,
        resizeMode: globalSettings.resizeMode,
        formatMode: globalSettings.formatMode,
        enableCompress: globalSettings.enableCompress,
        compressMode: globalSettings.compressMode,
        quality: globalSettings.quality,
        targetSizeKB: globalSettings.targetSizeKB,
        
        status: 'pending',
        progress: 0,
      });
    }

    setItems((prev) => [...prev, ...loadedItems]);
    showToast(`成功导入 ${newFiles.length} 张图片！`, 'success');
  };

  // Apply quick preset configs to the current global sliders and queue
  const handleApplyPreset = (preset: ImagePreset) => {
    const updatedSettings: GlobalSettings = {
      ...globalSettings,
      widthMode: preset.widthMode || (preset.width && preset.height ? 'exact' : 'original'),
      targetWidth: preset.width || globalSettings.targetWidth,
      targetHeight: preset.height || globalSettings.targetHeight,
      keepAspectRatio: preset.width && preset.height ? false : true, // Set to false if specific exact dimensions are defined, ensuring exact output dimensions
      resizeMode: 'crop',
      enableCompress: true,
      compressMode: preset.maxSizeKB ? 'target_size' : 'lossless',
      targetSizeKB: preset.maxSizeKB || globalSettings.targetSizeKB,
    };
    
    setGlobalSettings(updatedSettings);

    // Apply directly to any existing items
    if (items.length > 0) {
      setItems((prev) =>
        prev.map((item) => {
          // If the image is already successfully processed, keep it as-is!
          if (item.status === 'success') {
            return item;
          }
          // Clean old processed URL to avoid memory leaks
          if (item.processedUrl) {
            URL.revokeObjectURL(item.processedUrl);
          }
          return {
            ...item,
            widthMode: updatedSettings.widthMode,
            targetWidth: updatedSettings.targetWidth,
            targetHeight: updatedSettings.targetHeight,
            keepAspectRatio: updatedSettings.keepAspectRatio,
            resizeMode: updatedSettings.resizeMode,
            enableCompress: updatedSettings.enableCompress,
            compressMode: updatedSettings.compressMode,
            targetSizeKB: updatedSettings.targetSizeKB,
            // Reset state so non-success images get ready to be built
            status: 'pending',
            progress: 0,
            error: undefined,
            processedBlob: undefined,
            processedUrl: undefined,
            processedSize: undefined,
            processedWidth: undefined,
            processedHeight: undefined,
          };
        })
      );
      showToast(`预设「${preset.name}」已应用至所有待处理图像!`, 'success');
    } else {
      showToast(`已应用「${preset.name}」预设，上传图片时生效！`, 'info');
    }
  };

  // Sync settings button click
  const handleSyncSettingsToAll = () => {
    if (items.length === 0) return;
    setItems((prev) =>
      prev.map((item) => {
        // If already successfully processed, keep it as-is!
        if (item.status === 'success') {
          return item;
        }
        // Clean old processed URL to avoid memory leaks
        if (item.processedUrl) {
          URL.revokeObjectURL(item.processedUrl);
        }
        return {
          ...item,
          widthMode: globalSettings.widthMode,
          targetWidth: globalSettings.targetWidth,
          targetHeight: globalSettings.targetHeight,
          keepAspectRatio: globalSettings.keepAspectRatio,
          resizeMode: globalSettings.resizeMode,
          formatMode: globalSettings.formatMode,
          enableCompress: globalSettings.enableCompress,
          compressMode: globalSettings.compressMode,
          quality: globalSettings.quality,
          targetSizeKB: globalSettings.targetSizeKB,
          // Reset state to pending so pending/failed ones are processed using synced config
          status: 'pending',
          progress: 0,
          error: undefined,
          processedBlob: undefined,
          processedUrl: undefined,
          processedSize: undefined,
          processedWidth: undefined,
          processedHeight: undefined,
        };
      })
    );
    showToast('已成功同步当前全局配置并重置待处理图片状态！', 'success');
  };

  // Sync single item override
  const handleUpdateItemConfig = (id: string, config: Partial<ImageItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            ...config,
            // Re-mark as pending to allow rebuilding if they override settings of completed image
            status: 'pending',
            progress: 0,
          };
        }
        return item;
      })
    );
  };

  // Delete single file from queue
  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      if (target?.processedUrl) {
        URL.revokeObjectURL(target.processedUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  // Empty entire queue
  const handleClearAll = () => {
    items.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      if (item.processedUrl) URL.revokeObjectURL(item.processedUrl);
    });
    setItems([]);
    showToast('图片处理队列已排空。', 'info');
  };

  // Process a single image from state
  const processSingleItem = async (itemId: string): Promise<boolean> => {
    const targetItem = items.find((it) => it.id === itemId);
    if (!targetItem) return false;

    // Set processing
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, status: 'processing', progress: 10 } : it))
    );

    try {
      const result = await compressAndResizeImage(
        targetItem.file,
        {
          widthMode: targetItem.widthMode,
          targetWidth: targetItem.targetWidth,
          targetHeight: targetItem.targetHeight,
          keepAspectRatio: targetItem.keepAspectRatio,
          resizeMode: targetItem.resizeMode,
          formatMode: targetItem.formatMode,
          enableCompress: targetItem.enableCompress,
          compressMode: targetItem.compressMode,
          quality: targetItem.quality,
          targetSizeKB: targetItem.targetSizeKB,
        },
        (prog) => {
          setItems((prev) =>
            prev.map((it) => (it.id === itemId ? { ...it, progress: prog } : it))
          );
        }
      );

      const resUrl = URL.createObjectURL(result.blob);

      setItems((prev) =>
        prev.map((it) => {
          if (it.id === itemId) {
            // Clean old processedUrl if exists
            if (it.processedUrl) {
              URL.revokeObjectURL(it.processedUrl);
            }
            return {
              ...it,
              status: 'success',
              progress: 100,
              processedBlob: result.blob,
              processedUrl: resUrl,
              processedSize: result.blob.size,
              processedWidth: result.width,
              processedHeight: result.height,
            };
          }
          return it;
        })
      );
      return true;
    } catch (err: any) {
      console.error(err);
      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? { ...it, status: 'failed', progress: 0, error: err.message || '渲染与压缩异常' }
            : it
        )
      );
      return false;
    }
  };

  // Batch process execution sequence with a concurrency constraint (concurrency level = 2)
  const handleStartProcessAll = async () => {
    const pendingItems = items.filter((it) => it.status !== 'success');
    if (pendingItems.length === 0) {
      // Recheck - if there are none pending, allow reprocessing all
      if (items.length > 0) {
        setItems(prev => prev.map(it => ({ ...it, status: 'pending', progress: 0 })));
        // Wait a render tick
        setTimeout(() => handleStartProcessAll(), 50);
        return;
      }
      return;
    }

    setIsProcessingAll(true);
    showToast('开始批量处理队列...', 'info');

    // Sequential/chunked loop queue
    for (let i = 0; i < items.length; i++) {
      if (items[i].status !== 'success') {
        await processSingleItem(items[i].id);
      }
    }

    setIsProcessingAll(false);
    showToast('恭喜！所有可处理的图片已缩放并压缩完成。', 'success');
  };

  // Perform single image download
  const handleDownloadSingle = (item: ImageItem) => {
    if (item.status !== 'success' || !item.processedUrl || !item.processedBlob) {
      showToast('请先处理完成该图片再行下载！', 'error');
      return;
    }

    // Determine download file tag name
    let filename = item.name;
    const lastDotIdx = filename.lastIndexOf('.');
    let base = lastDotIdx !== -1 ? filename.substring(0, lastDotIdx) : filename;
    
    // Choose ext based on actual formatted output blob
    let ext = 'png';
    if (item.processedBlob.type === 'image/jpeg') ext = 'jpg';
    else if (item.processedBlob.type === 'image/webp') ext = 'webp';
    else if (item.processedBlob.type === 'image/png') ext = 'png';
    else {
      // Fallback
      ext = lastDotIdx !== -1 ? filename.substring(lastDotIdx + 1) : 'png';
    }

    const outputName = `${base}_optimized.${ext}`;

    const link = document.createElement('a');
    link.href = item.processedUrl;
    link.download = outputName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`文件「${outputName}」下载成功！`, 'success');
  };

  // Batch compile all processed files into a single zip and download with real-time UI zipProgress
  const handleDownloadZipAll = async () => {
    const successItems = items.filter((it) => it.status === 'success' && it.processedBlob);
    if (successItems.length === 0) {
      showToast('目前没有已经处理成功的图片，请先点击「开始处理」！', 'warn');
      return;
    }

    setZipProgress(0);
    showToast('正在为您打包压缩包，请稍候...', 'info');

    try {
      const zip = new JSZip();
      const usedNames = new Set<string>();

      successItems.forEach((item) => {
        let filename = item.name;
        const lastDotIdx = filename.lastIndexOf('.');
        let base = lastDotIdx !== -1 ? filename.substring(0, lastDotIdx) : filename;
        
        let ext = 'png';
        if (item.processedBlob!.type === 'image/jpeg') ext = 'jpg';
        else if (item.processedBlob!.type === 'image/webp') ext = 'webp';
        else if (item.processedBlob!.type === 'image/png') ext = 'png';

        let itemOutputName = `${base}_optimized.${ext}`;
        
        // Handle deduplication of filenames within same zip
        let i = 1;
        while (usedNames.has(itemOutputName)) {
          itemOutputName = `${base}_optimized_${i}.${ext}`;
          i++;
        }
        usedNames.add(itemOutputName);

        zip.file(itemOutputName, item.processedBlob!);
      });

      // Generate the package ZIP file with live updates
      const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        setZipProgress(Math.round(metadata.percent));
      });

      // Trigger user browser download file
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `optimized_images_batch_${Date.now().toString().substring(8)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      showToast('打包下载完成，ZIP 已成功保存至您的本地电脑。', 'success');
    } catch (e: any) {
      console.error(e);
      showToast('ZIP 打包生成失败: ' + e.message, 'error');
    } finally {
      setZipProgress(null);
    }
  };

  // Auxiliary button to add more images
  const handleAddMoreTrigger = () => {
    fileInputRef2.current?.click();
  };

  // Queue visual total metrics
  const totalFiles = items.length;
  const processedCount = items.filter((it) => it.status === 'success').length;
  const pendingCount = items.filter((it) => it.status === 'pending').length;
  const processingCount = items.filter((it) => it.status === 'processing').length;
  const estimatedTimeSeconds = (pendingCount > 0 || processingCount > 0)
    ? Math.max(0.1, parseFloat(((pendingCount * 0.3) + (processingCount * 0.15)).toFixed(1)))
    : 0;
  
  // Storage spaces calculations
  const totalOriginalBytes = items.reduce((acc, it) => acc + it.originalSize, 0);
  const totalProcessedBytes = items.reduce((acc, it) => acc + (it.processedSize || it.originalSize), 0);
  const totalSavedBytes = items.reduce((acc, it) => {
    if (it.status === 'success' && it.processedSize) {
      return acc + Math.max(0, it.originalSize - it.processedSize);
    }
    return acc;
  }, 0);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div id="application-parent-wrapper" className="h-[100vh] bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* Dynamic Fading Floating Toast Notifications */}
      {toast && (
        <div
          id="toast-floating-messenger"
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl border animate-fade-in text-xs font-semibold ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : toast.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : toast.type === 'warn'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          {toast.type === 'error' && <X className="w-4 h-4 text-rose-600" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="p-0.5 rounded text-slate-400 hover:text-slate-600 ml-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ZIP Generation Progression Modal Alert Overlay */}
      {zipProgress !== null && (
        <div id="zip-rendering-loader-backdrop" className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl text-center space-y-4 animate-scale-up">
            <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Download className="w-6 h-6 animate-bounce" />
            </div>
            
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800 text-center">正在打包导出 ZIP 压缩包</h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                正在将无损压缩后的全部照片打包到压缩文件中，这需要一点时间...
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>生成进度</span>
                <span className="font-mono text-indigo-600">{zipProgress}%</span>
              </div>
              
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${zipProgress}%` }}
                />
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic">
              * 生成完成后将自动开始浏览器自启下载，请勿关闭本浏览器页面。
            </p>
          </div>
        </div>
      )}

      {/* Hero Header Area */}
      <header id="primary-app-header-container" className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-md sm:text-lg font-bold tracking-tight text-slate-800 flex items-center gap-2">
            图片智能压缩与缩放
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-1.5 whitespace-nowrap">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            100% 浏览器本地安全处理
          </span>
        </div>
      </header>

      {/* Main Content Split layout of Sleek Interface */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* LEFT: Sidebar with Presets & Configs (Overscroll Auto) */}
        <aside id="column-parameters-side" className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-5 flex flex-col gap-5 overflow-y-auto flex-shrink-0">
          {/* Presets choice */}
          <div className="space-y-4">
            <PresetSelector 
              currentSettings={globalSettings}
              onApplyPreset={handleApplyPreset}
              onApplyCustomSettings={(updated) => setGlobalSettings(prev => ({ ...prev, ...updated }))}
            />
          </div>

          {/* General parameters sliders form */}
          <BatchSettings 
            settings={globalSettings}
            onChangeSettings={setGlobalSettings}
            onApplyToAll={handleSyncSettingsToAll}
            onStartProcessAll={handleStartProcessAll}
            hasFiles={totalFiles > 0}
            isProcessing={isProcessingAll || processingCount > 0}
            totalPendingCount={pendingCount}
          />
        </aside>

        {/* RIGHT: Main Workspace content area (Overscroll Auto) */}
        <section id="column-workspace-side" className="flex-1 p-6 md:p-8 flex flex-col gap-6 overflow-y-auto min-h-0">
          
          {/* Dragger is always visible and retains its layout/size */}
          <div className="max-w-5xl w-full mx-auto flex-shrink-0">
            <ImageDropzone onFilesAdded={handleFilesAdded} />
          </div>

          {/* 1. If empty queue logic, render placeholders */}
          {totalFiles === 0 ? (
            <div className="space-y-6 max-w-5xl mx-auto w-full">
              {/* Visual Placeholder Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 text-slate-500 shadow-xs">
                  <Zap className="w-5 h-5 mx-auto text-amber-500 mb-1" />
                  <span className="text-xs font-bold text-slate-700 block">极速 Canvas 硬件转码</span>
                  <span className="text-[10px] text-slate-400">利用本机显卡并行处理、无延迟</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 text-slate-500 shadow-xs">
                  <HardDrive className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
                  <span className="text-xs font-bold text-slate-700 block">不限制单批文件数量</span>
                  <span className="text-[10px] text-slate-400">单次批量几百张亦可正常流畅吞吐</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 text-slate-500 shadow-xs">
                  <TrendingDown className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                  <span className="text-xs font-bold text-slate-700 block">体积优化率高达 95%</span>
                  <span className="text-[10px] text-slate-400">智能保留质量，无感智能裁剪</span>
                </div>
              </div>
            </div>
          ) : (
            // 2. Active Queue Panel List
            <div className="space-y-6 max-w-5xl w-full mx-auto flex-1 flex flex-col min-h-0">
              
              {/* Bento Statistics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
                    <Files className="w-3.5 h-3.5 text-slate-400" />
                    文件总张数
                  </span>
                  <div className="text-lg font-bold text-slate-800 font-mono">
                    {totalFiles} <span className="text-xs text-slate-400 font-normal">张</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                    转换队列状态
                  </span>
                  <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
                    {processingCount > 0 ? (
                      <span className="text-indigo-600 animate-pulse bg-indigo-50 px-2 py-0.5 rounded-md">
                        处理中 ({processedCount}/{totalFiles})
                      </span>
                    ) : pendingCount > 0 ? (
                      <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                        {pendingCount} 张待压缩
                      </span>
                    ) : (
                      <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                        ✓ 全部完成
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                    原图总体积
                  </span>
                  <div className="text-[13px] font-bold text-slate-700 truncate font-mono" title={formatBytes(totalOriginalBytes)}>
                    {formatBytes(totalOriginalBytes)}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs space-y-1 bg-emerald-50/10">
                  <span className="text-[10px] uppercase font-semibold text-emerald-700 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                    已累计节约
                  </span>
                  <div className="text-[13px] font-bold text-emerald-700 truncate font-mono">
                    {formatBytes(totalSavedBytes)}
                  </div>
                </div>
              </div>

              {/* Queue Actions Control Rail */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex-shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    id="btn-add-more-input"
                    type="button"
                    onClick={handleAddMoreTrigger}
                    className="text-xs bg-slate-100 hover:bg-slate-250 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl transition-all font-semibold flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 text-slate-500" />
                    添加更多图片
                  </button>
                  
                  <input
                    id="input-hidden-add-more-files"
                    ref={fileInputRef2}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleFilesAdded(Array.from(e.target.files));
                      }
                    }}
                    className="hidden"
                  />

                  <button
                    id="btn-clear-out-entire-queue"
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs hover:bg-rose-50 text-slate-500 hover:text-rose-600 px-3 py-2 rounded-xl border border-slate-200 hover:border-rose-100 transition-colors font-medium"
                  >
                    清空列表
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {processedCount > 0 && (
                    <button
                      id="btn-zip-download-bulk"
                      type="button"
                      onClick={handleDownloadZipAll}
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold shadow-md transition-all w-full sm:w-auto flex items-center justify-center gap-1.5 hover:shadow-indigo-100"
                    >
                      <Download className="w-4 h-4" />
                      打包下载全部图片 (ZIP)
                    </button>
                  )}
                </div>
              </div>

              {/* Rows Queue List */}
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between w-full h-fit">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>队列图片明细 ({totalFiles})</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2 py-0.5 normal-case font-sans">
                    <span>预计图片完成时间：</span>
                    <span className="font-mono text-xs font-bold text-slate-700">{estimatedTimeSeconds}</span>
                    <span>s</span>
                  </div>
                </div>
                <div id="image-files-list-wrapper" className="space-y-3 overflow-y-auto pr-1 flex-1 pb-4">
                  {items.map((item) => (
                    <ImageItemRow
                      key={item.id}
                      item={item}
                      onRemove={handleRemoveItem}
                      onDownload={handleDownloadSingle}
                      onUpdateItemConfig={handleUpdateItemConfig}
                      onPreview={setLightboxItem}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* FOOTER statistics rail - sticky to bottom */}
      {totalFiles > 0 && (
        <footer className="h-16 bg-white border-t border-slate-200 px-8 flex items-center justify-between flex-shrink-0 z-15">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-slate-600">处理转码引擎就绪</span>
            </div>
            <div className="hidden md:inline-block text-xs font-medium text-slate-400">
              已选定: <span className="text-slate-700 font-semibold">{totalFiles} 张图片</span> · 
              已优化: <span className="text-slate-700 font-semibold">{processedCount} 张</span> · 
              预计节省: <span className="text-emerald-550 font-bold text-emerald-600 font-mono">
                {totalOriginalBytes > 0 ? (100 - (totalProcessedBytes / totalOriginalBytes) * 100).toFixed(0) : '0'}%
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            {processedCount > 0 && (
              <button
                id="btn-footer-zip"
                onClick={handleDownloadZipAll}
                className="px-6 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                打包下载全体图片 ({processedCount}张 ZIP)
              </button>
            )}
          </div>
        </footer>
      )}

      {/* 3. Image Comparison & Enlarge Lightbox Modal */}
      {lightboxItem && (
        <div 
          id="image-compare-lightbox"
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-6 transition-all duration-300 animate-fade-in"
          onClick={() => setLightboxItem(null)}
        >
          <div 
            className="bg-white rounded-3xl overflow-hidden max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-scale-up border border-slate-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-indigo-600 tracking-wider uppercase mb-0.5">
                  图像尺寸与画质对比预览
                </h4>
                <p className="text-sm font-bold text-slate-800 truncate" title={lightboxItem.name}>
                  {lightboxItem.name}
                </p>
              </div>
              <button
                id="btn-close-compare-lightbox"
                type="button"
                onClick={() => setLightboxItem(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all"
                title="关闭预览"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Comparative Images Panel */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Original View */}
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase px-1">
                    <span>原图效果</span>
                    <span className="font-mono bg-slate-100 border text-slate-600 px-2 py-0.5 rounded-md font-medium">
                      原始比例
                    </span>
                  </div>
                  
                  <div className="flex-1 min-h-[250px] max-h-[46vh] bg-slate-100/50 rounded-2xl border border-slate-200/50 flex items-center justify-center overflow-hidden p-2 shadow-inner group relative">
                    <img
                      src={lightboxItem.previewUrl}
                      alt="原图"
                      className="max-w-full max-h-[44vh] object-contain rounded-lg shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Original Specs */}
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div className="text-[10px] text-slate-450 text-slate-400 font-semibold mb-0.5 uppercase">物理尺寸</div>
                      <div className="font-mono font-bold text-slate-700">{lightboxItem.originalWidth} × {lightboxItem.originalHeight}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-450 text-slate-400 font-semibold mb-0.5 uppercase">文件大小</div>
                      <div className="font-mono font-bold text-slate-700">
                        {lightboxItem.originalSize >= 1024 * 1024 
                          ? `${(lightboxItem.originalSize / (1024 * 1024)).toFixed(2)} MB` 
                          : `${(lightboxItem.originalSize / 1024).toFixed(1)} KB`
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-450 text-slate-400 font-semibold mb-0.5 uppercase">格式类型</div>
                      <div className="font-mono font-bold text-slate-705 text-slate-700">
                        {lightboxItem.originalFormat.split('/')[1]?.toUpperCase() || 'RAW'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Processed View */}
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 uppercase px-1">
                    <span>压缩与尺寸优化效果</span>
                    {lightboxItem.processedSize && (
                      <span className="font-mono bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-md font-bold text-[11px]">
                        体积极致减少 {((1 - lightboxItem.processedSize / lightboxItem.originalSize) * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-h-[250px] max-h-[46vh] bg-slate-100/50 rounded-2xl border border-slate-200/50 flex items-center justify-center overflow-hidden p-2 shadow-inner group relative">
                    <img
                      src={lightboxItem.processedUrl}
                      alt="优化后"
                      className="max-w-full max-h-[44vh] object-contain rounded-lg shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Processed Specs */}
                  <div className="p-3 bg-emerald-50/30 border border-emerald-100/60 rounded-xl grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div className="text-[10px] text-emerald-600/80 font-bold mb-0.5 uppercase">输出尺寸</div>
                      <div className="font-mono font-bold text-slate-800">{lightboxItem.processedWidth} × {lightboxItem.processedHeight}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-emerald-600/80 font-bold mb-0.5 uppercase">输出文件</div>
                      <div className="font-mono font-bold text-emerald-800">
                        {lightboxItem.processedSize && lightboxItem.processedSize >= 1024 * 1024 
                          ? `${(lightboxItem.processedSize / (1024 * 1024)).toFixed(2)} MB` 
                          : lightboxItem.processedSize 
                          ? `${(lightboxItem.processedSize / 1024).toFixed(1)} KB`
                          : '-'
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-emerald-600/80 font-bold mb-0.5 uppercase">最终格式</div>
                      <div className="font-mono font-bold text-emerald-800">
                        {lightboxItem.processedBlob?.type.split('/')[1]?.toUpperCase() || 'RAW'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3.5">
              <button
                id="btn-cancel-compare"
                type="button"
                onClick={() => setLightboxItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
              >
                关闭窗口
              </button>
              <button
                id="btn-download-from-lightbox"
                type="button"
                onClick={() => {
                  handleDownloadSingle(lightboxItem);
                  setLightboxItem(null);
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shadow-indigo-100 hover:shadow-indigo-200 hover:-translate-y-0.5"
              >
                <Download className="w-4 h-4" />
                立即下载此图片
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
