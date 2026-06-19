import React, { useState } from 'react';
import { ImageItem, WidthMode, FormatMode, CompressMode } from '../types';
import { 
  Trash2, Download, AlertCircle, CheckCircle, 
  Settings, ArrowRight, CornerDownRight, FileText,
  Percent, FileImage, Layers
} from 'lucide-react';

interface ImageItemRowProps {
  key?: string;
  item: ImageItem;
  onRemove: (id: string) => void;
  onDownload: (item: ImageItem) => void;
  onUpdateItemConfig: (id: string, config: Partial<ImageItem>) => void;
  onPreview?: (item: ImageItem) => void;
}

export default function ImageItemRow({
  item,
  onRemove,
  onDownload,
  onUpdateItemConfig,
  onPreview,
}: ImageItemRowProps) {
  const [showSingleSettings, setShowSingleSettings] = useState(false);

  // Format bytes to human readable form
  const formatBytes = (bytes?: number) => {
    if (bytes === undefined || bytes === null || isNaN(bytes)) return '-';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFormatLabel = (mimeType: string) => {
    if (!mimeType) return 'Unk';
    const parts = mimeType.split('/');
    return parts[parts.length - 1].toUpperCase();
  };

  // Safe division for size reduction percentage
  const getReductionPct = () => {
    if (!item.processedSize || !item.originalSize) return null;
    const ratio = (item.processedSize / item.originalSize) * 100;
    const diff = 100 - ratio;
    return diff;
  };

  const reduction = getReductionPct();

  return (
    <div
      id={`image-item-row-${item.id}`}
      className={`p-4 rounded-2xl border transition-all duration-300 bg-white ${
        item.status === 'processing'
          ? 'border-indigo-400 bg-indigo-50/20 shadow-sm'
          : item.status === 'success'
          ? 'border-emerald-100 hover:border-emerald-200'
          : item.status === 'failed'
          ? 'border-rose-200 bg-rose-50/10'
          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Thumbnail and Names */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div
            onClick={() => {
              if (item.status === 'success' && onPreview) {
                onPreview(item);
              }
            }}
            className={`relative flex-shrink-0 w-16 h-16 rounded-xl bg-slate-100 overflow-hidden border border-slate-200/60 shadow-inner group transition-all duration-200 ${
              item.status === 'success' ? 'cursor-pointer hover:ring-2 hover:ring-indigo-500' : ''
            }`}
            title={item.status === 'success' ? '点击放大并对比查看效果' : undefined}
          >
            <img
              src={item.previewUrl}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            {item.status === 'success' && (
              <div className="absolute inset-0 bg-indigo-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                <span className="text-[10px] text-white bg-indigo-650 opacity-90 px-2 py-0.5 rounded-full font-bold shadow-md transform translate-y-1 group-hover:translate-y-0 transition-transform">
                  🔍 预览
                </span>
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white text-center py-0.5 font-mono">
              {getFormatLabel(item.originalFormat)}
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-800 truncate block" title={item.name}>
                {item.name}
              </span>
              
              {/* Overridden settings badge indicator */}
              {(item.widthMode !== 'original' || item.formatMode !== 'original' || item.compressMode !== 'quality' || item.quality !== 80) && (
                <span className="text-[9px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100 flex-shrink-0">
                  个性化配置
                </span>
              )}
            </div>

            {/* Sizes & Dimension Info Grid */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 font-medium">
              <span className="text-[11px] font-mono whitespace-nowrap">
                {item.originalWidth} × {item.originalHeight}
              </span>
              <span className="text-slate-350 text-slate-300 text-[10px]">•</span>
              <span className="text-[11px] font-mono whitespace-nowrap">
                {formatBytes(item.originalSize)}
              </span>
            </div>

            {/* Comparison Arrow for success state */}
            {item.status === 'success' && item.processedSize && (
              <div
                onClick={() => onPreview && onPreview(item)}
                className="flex items-center gap-2 text-xs text-slate-500 font-semibold bg-emerald-50/45 border border-emerald-100 hover:border-indigo-200 hover:bg-slate-50 p-1.5 rounded-xl w-fit cursor-pointer transition-all duration-200"
                title="点击对比放大查看"
              >
                <span className="text-slate-400 text-[10px] flex items-center gap-0.5">
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  处理后:
                </span>
                <span className="font-mono font-bold text-slate-700">
                  {item.processedWidth} × {item.processedHeight}
                </span>
                <span className="text-slate-300 text-[10px]">•</span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatBytes(item.processedSize)}
                </span>
                <span className="text-slate-300 text-[10px]">•</span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/50 border border-emerald-200 px-1.5 py-0.5 rounded-md uppercase">
                  {item.processedBlob ? getFormatLabel(item.processedBlob.type) : 'RAW'}
                </span>

                {reduction !== null && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg border flex items-center gap-0.5 ${
                      reduction > 0
                        ? 'bg-emerald-100 border-emerald-200 text-emerald-800'
                        : reduction < 0
                        ? 'bg-rose-100 border-rose-200 text-rose-800'
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    {reduction > 0 ? `-${reduction.toFixed(1)}%` : `+${Math.abs(reduction).toFixed(1)}%`}
                  </span>
                )}
              </div>
            )}

            {/* Error Message */}
            {item.status === 'failed' && item.error && (
              <p className="text-[10px] font-semibold text-rose-600 flex items-center gap-1 bg-rose-50 border border-rose-100 p-1.5 rounded-lg w-fit">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                {item.error}
              </p>
            )}
          </div>
        </div>

        {/* Right: Status and action triggers */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end border-t sm:border-t-0 border-slate-100 pt-3.5 sm:pt-0">
          {/* Status Indicators */}
          {item.status === 'pending' && (
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap">
              等待处理
            </span>
          )}
          {item.status === 'processing' && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-indigo-600 animate-pulse whitespace-nowrap">
                处理中 ({item.progress}%)
              </span>
              <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-150" 
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          )}
          {item.status === 'success' && (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              已完成
            </span>
          )}

          {/* Action Tools */}
          <div className="flex items-center gap-1.5">
            {/* Customize Single File Gear Button */}
            <button
              id={`btn-toggle-row-settings-${item.id}`}
              type="button"
              onClick={() => setShowSingleSettings(!showSingleSettings)}
              className={`p-2 rounded-xl border transition-all ${
                showSingleSettings
                  ? 'bg-amber-50 text-amber-600 border-amber-300 ring-2 ring-amber-100'
                  : 'bg-white text-slate-500 hover:text-slate-800 border-slate-200/80 hover:bg-slate-50'
              }`}
              title="单独修改此张图片的压缩和大小设置"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Individual Download Button */}
            <button
              id={`btn-download-row-${item.id}`}
              type="button"
              disabled={item.status !== 'success'}
              onClick={() => onDownload(item)}
              className={`p-2 rounded-xl transition-all border ${
                item.status === 'success'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-250 hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                  : 'bg-slate-50 text-slate-300 border-slate-150 border-slate-100 cursor-not-allowed'
              }`}
              title="下载该张图片"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Delete button */}
            <button
              id={`btn-remove-row-${item.id}`}
              type="button"
              onClick={() => onRemove(item.id)}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-100 transition-colors"
              title="移除图片"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Individual Custom Configuration Form Drawer */}
      {showSingleSettings && (
        <div className="mt-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-150 border-slate-200 animate-slide-down space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <CornerDownRight className="w-3.5 h-3.5 text-indigo-500" />
              自定义此图的处理参数
            </span>
            <button
              id={`btn-close-row-settings-${item.id}`}
              type="button"
              onClick={() => setShowSingleSettings(false)}
              className="text-[10px] text-slate-400 hover:text-slate-600 hover:underline"
            >
              关闭
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Dimensions config */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">尺寸选项</label>
              <select
                id={`select-row-setting-width-mode-${item.id}`}
                value={item.widthMode}
                onChange={(e) => onUpdateItemConfig(item.id, { widthMode: e.target.value as WidthMode })}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-500"
              >
                <option value="original">保持原图尺寸 (不改变大小)</option>
                <option value="ratio_16_9">16:9 尺寸 (最佳原图适配)</option>
                <option value="ratio_9_16">9:16 尺寸 (最佳原图适配)</option>
                <option value="exact">完全自定义长宽</option>
              </select>

              {item.widthMode === 'exact' && (
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <div>
                    <input
                      id={`input-row-setting-target-width-${item.id}`}
                      type="number"
                      placeholder="宽 px"
                      value={item.targetWidth || ''}
                      onChange={(e) => onUpdateItemConfig(item.id, { targetWidth: Number(e.target.value) })}
                      className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <input
                      id={`input-row-setting-target-height-${item.id}`}
                      type="number"
                      placeholder="高 px"
                      value={item.targetHeight || ''}
                      onChange={(e) => onUpdateItemConfig(item.id, { targetHeight: Number(e.target.value) })}
                      className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>
              )}

               {item.widthMode === 'exact' && (
                <div className="space-y-1 mt-1.5 pt-1.5 border-t border-slate-100 flex items-center gap-1.5">
                  <input
                    id={`checkbox-row-setting-keep-aspect-ratio-${item.id}`}
                    type="checkbox"
                    checked={item.keepAspectRatio}
                    onChange={(e) => onUpdateItemConfig(item.id, { keepAspectRatio: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] text-slate-600">锁定长宽比例 (比例自适应)</span>
                </div>
              )}
            </div>

            {/* Format choice */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">格式选择</label>
              <select
                id={`select-row-setting-format-mode-${item.id}`}
                value={item.formatMode}
                onChange={(e) => onUpdateItemConfig(item.id, { formatMode: e.target.value as FormatMode })}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-500"
              >
                <option value="original">保持原格式</option>
                <option value="jpeg">JPG / JPEG</option>
                <option value="png">PNG</option>
              </select>
            </div>

            {/* Compression method */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">保真度与体积</label>
              <select
                id={`select-row-setting-compress-mode-${item.id}`}
                value={item.enableCompress ? item.compressMode : 'no_compress'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'no_compress') {
                    onUpdateItemConfig(item.id, { enableCompress: false });
                  } else {
                    onUpdateItemConfig(item.id, { enableCompress: true, compressMode: val as CompressMode });
                  }
                }}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-500"
              >
                <option value="no_compress">未启用任何压缩处理</option>
                <option value="lossless">无损压缩保真</option>
                <option value="quality">固定百分比质量</option>
                <option value="target_size">精确控制限制体积以下</option>
              </select>

              {item.enableCompress && item.compressMode === 'quality' && (
                <div className="flex items-center gap-2 mt-1.5">
                  <input
                    id={`input-row-setting-quality-${item.id}`}
                    type="range"
                    min="10"
                    max="100"
                    value={item.quality}
                    onChange={(e) => onUpdateItemConfig(item.id, { quality: Number(e.target.value) })}
                    className="flex-1 h-1 bg-slate-300 rounded appearance-none accent-amber-500"
                  />
                  <span className="font-mono text-slate-600 font-semibold">{item.quality}%</span>
                </div>
              )}

              {item.enableCompress && item.compressMode === 'target_size' && (
                <div className="relative mt-1.5">
                  <input
                    id={`input-row-setting-target-size-${item.id}`}
                    type="number"
                    min="10"
                    placeholder="最大大小KB, 如 400"
                    value={item.targetSizeKB || ''}
                    onChange={(e) => onUpdateItemConfig(item.id, { targetSizeKB: Number(e.target.value) })}
                    className="w-full text-xs pl-2 pr-8 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none"
                  />
                  <span className="absolute right-2 top-1.5 text-[9px] text-slate-400 font-mono">KB</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
