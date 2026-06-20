import { GlobalSettings, WidthMode, FormatMode, CompressMode } from '../types';
import { Sliders, RefreshCw, FileImage, Download, Layers, ShieldCheck, HelpCircle } from 'lucide-react';

interface BatchSettingsProps {
  settings: GlobalSettings;
  onChangeSettings: (settings: GlobalSettings) => void;
  onApplyToAll: () => void;
  onStartProcessAll: () => void;
  hasFiles: boolean;
  isProcessing: boolean;
  totalPendingCount: number;
}

export default function BatchSettings({
  settings,
  onChangeSettings,
  onApplyToAll,
  onStartProcessAll,
  hasFiles,
  isProcessing,
  totalPendingCount,
}: BatchSettingsProps) {

  const handleWidthModeChange = (mode: WidthMode) => {
    onChangeSettings({
      ...settings,
      widthMode: mode,
    });
  };

  const updateSetting = (key: keyof GlobalSettings, value: any) => {
    onChangeSettings({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div id="batch-settings-container" className="bg-white rounded-2xl border border-slate-200 p-5 space-y-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-indigo-50 pb-3">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          全局处理配置
        </h3>
        {hasFiles && (
          <button
            id="btn-apply-to-all-images"
            type="button"
            onClick={onApplyToAll}
            className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors font-semibold flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded"
            title="将当前配置同步应用给列表中所有等待处理的图片"
          >
            同步配置至所有图片
          </button>
        )}
      </div>

      {/* 1. Dimensions Scaling Config */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-700">1. 修改图像尺寸</label>
        
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-50 border border-slate-100 rounded-xl">
          <button
            id="btn-width-mode-original"
            type="button"
            onClick={() => handleWidthModeChange('original')}
            className={`text-xs py-1.5 px-2 rounded-lg font-medium transition-colors ${
              settings.widthMode === 'original'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-150 border-slate-200'
                : 'text-slate-500 hover:text-slate-850 hover:bg-slate-100'
            }`}
          >
            保持原尺寸
          </button>
          <button
            id="btn-width-mode-ratio-16-9"
            type="button"
            onClick={() => handleWidthModeChange('ratio_16_9')}
            className={`text-xs py-1.5 px-2 rounded-lg font-medium transition-colors ${
              settings.widthMode === 'ratio_16_9'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200 ring-2 ring-indigo-505 ring-indigo-600/20'
                : 'text-slate-500 hover:text-slate-850 hover:bg-slate-100'
            }`}
          >
            16:9 尺寸
          </button>
          <button
            id="btn-width-mode-ratio-9-16"
            type="button"
            onClick={() => handleWidthModeChange('ratio_9_16')}
            className={`text-xs py-1.5 px-2 rounded-lg font-medium transition-colors ${
              settings.widthMode === 'ratio_9_16'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200 ring-2 ring-indigo-505 ring-indigo-600/20'
                : 'text-slate-500 hover:text-slate-850 hover:bg-slate-100'
            }`}
          >
            9:16 尺寸
          </button>
          <button
            id="btn-width-mode-exact"
            type="button"
            onClick={() => handleWidthModeChange('exact')}
            className={`text-xs py-1.5 px-2 rounded-lg font-medium transition-colors ${
              settings.widthMode === 'exact'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-850 hover:bg-slate-100'
            }`}
          >
            完全自定义宽高
          </button>
        </div>

        {/* Info label for 16:9 / 9:16 Smart Ratio Resizing */}
        {(settings.widthMode === 'ratio_16_9' || settings.widthMode === 'ratio_9_16') && (
          <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-1 animate-slide-down">
            <p className="text-[11px] text-indigo-700 font-bold flex items-center gap-1">
              <span>🌟</span>
              智能比例裁剪与保真运算
            </p>
            <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
              将直接 center-crop (中心裁剪) 为标准的 {settings.widthMode === 'ratio_16_9' ? '16:9' : '9:16'} 比例，智能根据原图大小进行裁剪（保留最大可能分辨率，避免拉伸与非必要缩放）。
            </p>
          </div>
        )}

        {/* Input sliders/controls based on selected width mode */}
        {settings.widthMode === 'exact' && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/50 border border-slate-100 rounded-xl animate-slide-down">
            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-1">目标宽度 (px)</label>
              <div className="relative">
                <input
                  id="input-settings-target-width"
                  type="number"
                  min="1"
                  max="12000"
                  placeholder="2400"
                  value={settings.targetWidth || ''}
                  onChange={(e) => updateSetting('targetWidth', Number(e.target.value))}
                  className="w-full text-xs pl-3 pr-8 py-2 rounded-lg border border-slate-200 bg-white focus:border-indigo-500 focus:outline-none"
                />
                <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-mono">px</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-1">目标高度 (px)</label>
              <div className="relative">
                <input
                  id="input-settings-target-height"
                  type="number"
                  min="1"
                  max="12000"
                  placeholder="2400"
                  value={settings.targetHeight || ''}
                  onChange={(e) => updateSetting('targetHeight', Number(e.target.value))}
                  className="w-full text-xs pl-3 pr-8 py-2 rounded-lg border border-slate-200 bg-white focus:border-indigo-500 focus:outline-none"
                />
                <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-mono">px</span>
              </div>
            </div>

            <div className="col-span-2 space-y-2 mt-1">
              <div className="flex items-center gap-2">
                <input
                  id="checkbox-settings-keep-aspect-ratio"
                  type="checkbox"
                  checked={settings.keepAspectRatio}
                  onChange={(e) => updateSetting('keepAspectRatio', e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-600">锁定长宽比例 (比例自适应)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Format Conversions */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-700">2. 转化图片格式</label>
        
        <div className="grid grid-cols-3 gap-1.5">
          {(['original', 'jpeg', 'png'] as FormatMode[]).map((mode) => (
            <button
              id={`btn-format-mode-${mode}`}
              key={mode}
              type="button"
              onClick={() => updateSetting('formatMode', mode)}
              className={`text-xs py-2 px-1 text-center font-semibold rounded-xl border transition-all ${
                settings.formatMode === mode
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {mode === 'original' && '原格式'}
              {mode === 'jpeg' && 'JPEG'}
              {mode === 'png' && 'PNG'}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Compression settings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              id="checkbox-enable-compress"
              type="checkbox"
              checked={settings.enableCompress}
              onChange={(e) => updateSetting('enableCompress', e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
            />
            <label htmlFor="checkbox-enable-compress" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
              3. 启用压缩与保真
            </label>
          </div>
          <span className="text-[10px] flex items-center gap-1 text-slate-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            支持无损
          </span>
        </div>

        {settings.enableCompress ? (
          <div className="space-y-2.5">
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-50 border border-slate-100 rounded-xl">
              <button
                id="btn-compress-mode-lossless"
                type="button"
                onClick={() => updateSetting('compressMode', 'lossless')}
                className={`text-[10px] py-1.5 px-0.5 rounded-lg font-medium transition-colors text-center ${
                  settings.compressMode === 'lossless'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200 font-bold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title="采用极高清晰度无损压缩（PNG不改变像素, JPEG 100%保真输出）"
              >
                无损保真
              </button>
              <button
                id="btn-compress-mode-quality"
                type="button"
                onClick={() => updateSetting('compressMode', 'quality')}
                className={`text-[10px] py-1.5 px-0.5 rounded-lg font-medium transition-colors text-center ${
                  settings.compressMode === 'quality'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-205 font-bold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                质量比例
              </button>
              <button
                id="btn-compress-mode-target"
                type="button"
                onClick={() => updateSetting('compressMode', 'target_size')}
                className={`text-[10px] py-1.5 px-0.5 rounded-lg font-medium transition-colors text-center ${
                  settings.compressMode === 'target_size'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-205 font-bold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                限制体积
              </button>
            </div>

            {/* Conditional Controls */}
            {settings.compressMode === 'quality' && (
              <div className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-2 animate-slide-down">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                  <span>压缩输出质量</span>
                  <span className="text-indigo-600 font-mono">{settings.quality}%</span>
                </div>
                <input
                  id="range-quality-slider"
                  type="range"
                  min="10"
                  max="100"
                  step="1"
                  value={settings.quality}
                  onChange={(e) => updateSetting('quality', Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>最小 (极强压缩)</span>
                  <span>推荐 (80%)</span>
                  <span>最大 (极清)</span>
                </div>
              </div>
            )}

            {settings.compressMode === 'target_size' && (
              <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl animate-slide-down">
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  限制最大文件大小 (KB)
                </label>
                
                <div className="relative">
                  <input
                    id="input-settings-target-size-kb"
                    type="number"
                    min="1"
                    placeholder="如: 400"
                    value={settings.targetSizeKB || ''}
                    onChange={(e) => updateSetting('targetSizeKB', Number(e.target.value))}
                    className="w-full text-xs pl-3 pr-10 py-2 rounded-lg border border-slate-200 bg-white focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold font-mono">KB</span>
                </div>

                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                  * 智能优化：程序在此限制以内，最高保留图像质量与细节。体积超限时，PNG等格式可转JPEG格式压缩。
                </p>
              </div>
            )}

            {settings.compressMode === 'lossless' && (
              <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-2xl animate-slide-down">
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium flex items-start gap-1">
                  <span>ℹ️</span>
                  高级保真模式：PNG完全无像素质量损失输出；JPEG将使用纯净编码，最大限度缩减冗余元数据，不降低核心画质。
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-200 border-dashed rounded-2xl animate-slide-down">
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium flex items-start gap-1">
              <span>🛡️</span>
              已关闭压缩保真处理：将直接输出原装图片，不改变图像质量与文件体积，100%保留最原始数据。
            </p>
          </div>
        )}
      </div>

      {/* Main Buttons */}
      <div className="space-y-2 pt-2">
        <button
          id="btn-trigger-process-all"
          type="button"
          disabled={!hasFiles || isProcessing}
          onClick={onStartProcessAll}
          className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 ${
            !hasFiles
              ? 'bg-slate-150 text-slate-400 border border-slate-200 cursor-not-allowed bg-slate-100'
              : isProcessing
              ? 'bg-indigo-450 text-white cursor-wait bg-indigo-500'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.98]'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
          {isProcessing
            ? '图像处理中，请稍候...'
            : totalPendingCount > 0
            ? `开始处理 (${totalPendingCount}张未处理)`
            : '重新处理所有图片'}
        </button>
      </div>
    </div>
  );
}
