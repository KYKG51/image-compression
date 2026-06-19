import React, { useState, useEffect } from 'react';
import { ImagePreset, GlobalSettings } from '../types';
import { 
  LayoutGrid, 
  AppWindow, 
  Square, 
  Image, 
  FileText, 
  Plus, 
  Trash2, 
  Sliders, 
  Smartphone, 
  Sparkles, 
  Layers, 
  RotateCcw 
} from 'lucide-react';

interface PresetSelectorProps {
  currentSettings: GlobalSettings;
  onApplyPreset: (preset: ImagePreset) => void;
  onApplyCustomSettings: (settings: Partial<GlobalSettings>) => void;
}

const DEFAULT_PRESETS: ImagePreset[] = [
  {
    id: 'nine_grid',
    name: '九图',
    width: 2400,
    height: 2400,
    maxSizeKB: 10240, // 10MB
    isCustom: false,
  },
  {
    id: 'icon',
    name: 'Icon 图标',
    width: 512,
    height: 512,
    maxSizeKB: 400, // 400KB
    isCustom: false,
  },
  {
    id: 'component',
    name: '组件图',
    width: 800,
    height: 800,
    maxSizeKB: 400, // 400KB
    isCustom: false,
  },
  {
    id: 'landscape',
    name: '横图、结束页',
    width: 1280,
    height: 720,
    maxSizeKB: 400, // 400KB
    isCustom: false,
  },
  {
    id: 'graphic',
    name: '图文',
    width: 1280,
    height: 1706,
    maxSizeKB: 500, // 500KB
    isCustom: false,
  },
  {
    id: 'landing_page',
    name: '落地页',
    widthMode: 'ratio_9_16',
    maxSizeKB: 500, // 500KB
    isCustom: false,
  },
  {
    id: 'top_image',
    name: '顶图',
    width: 1280,
    height: 640,
    maxSizeKB: 500, // 500KB
    isCustom: false,
  },
  {
    id: 'collage_image',
    name: '套图',
    width: 1242,
    height: 2070,
    maxSizeKB: 500, // 500KB
    isCustom: false,
  },
];

export default function PresetSelector({
  currentSettings,
  onApplyPreset,
  onApplyCustomSettings,
}: PresetSelectorProps) {
  const [presets, setPresets] = useState<ImagePreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // New custom preset form state
  const [isAdding, setIsAdding] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetWidth, setNewPresetWidth] = useState<number | ''>('');
  const [newPresetHeight, setNewPresetHeight] = useState<number | ''>('');
  const [newPresetSize, setNewPresetSize] = useState<number | ''>('');
  const [newPresetRatio, setNewPresetRatio] = useState<'ratio_16_9' | 'ratio_9_16' | null>(null);

  // Load presets from localStorage + defaults
  useEffect(() => {
    const saved = localStorage.getItem('image_compress_presets_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ImagePreset[];
        setPresets(parsed);
      } catch (e) {
        setPresets(DEFAULT_PRESETS);
      }
    } else {
      // First time loading: try to migrate custom ones if possible, otherwise write new defaults
      const oldKeys = ['image_compress_presets_v2', 'image_compress_presets'];
      let migratedCustoms: ImagePreset[] = [];
      for (const oldKey of oldKeys) {
        const oldSaved = localStorage.getItem(oldKey);
        if (oldSaved) {
          try {
            const parsedOld = JSON.parse(oldSaved) as ImagePreset[];
            migratedCustoms = parsedOld.filter((p) => p.isCustom);
            if (migratedCustoms.length > 0) break;
          } catch (e) {}
        }
      }
      const initial = [...DEFAULT_PRESETS, ...migratedCustoms];
      setPresets(initial);
      localStorage.setItem('image_compress_presets_v3', JSON.stringify(initial));
    }
  }, []);

  const savePresets = (updatedPresets: ImagePreset[]) => {
    setPresets(updatedPresets);
    localStorage.setItem('image_compress_presets_v3', JSON.stringify(updatedPresets));
  };

  const handleApply = (preset: ImagePreset) => {
    setActivePresetId(preset.id);
    onApplyPreset(preset);
  };

  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const width = newPresetRatio ? undefined : (newPresetWidth === '' ? undefined : Number(newPresetWidth));
    const height = newPresetRatio ? undefined : (newPresetHeight === '' ? undefined : Number(newPresetHeight));
    const maxSizeKB = newPresetSize === '' ? undefined : Number(newPresetSize);

    const newPreset: ImagePreset = {
      id: 'preset_' + Date.now(),
      name: newPresetName,
      width,
      height,
      widthMode: newPresetRatio || undefined,
      maxSizeKB,
      isCustom: true,
    };

    const updated = [...presets, newPreset];
    savePresets(updated);
    handleApply(newPreset);

    // Reset form
    setNewPresetName('');
    setNewPresetWidth('');
    setNewPresetHeight('');
    setNewPresetSize('');
    setNewPresetRatio(null);
    setIsAdding(false);
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = presets.filter((p) => p.id !== id);
    savePresets(updated);
    if (activePresetId === id) {
      setActivePresetId(null);
    }
  };

  const handleRestoreDefaults = () => {
    const customs = presets.filter((p) => p.isCustom);
    const updated = [...DEFAULT_PRESETS, ...customs];
    savePresets(updated);
  };

  // Preset icons mapping
  const getPresetIcon = (id: string) => {
    switch (id) {
      case 'nine_grid':
        return <LayoutGrid className="w-4 h-4 text-emerald-500" />;
      case 'icon':
        return <AppWindow className="w-4 h-4 text-blue-500" />;
      case 'component':
        return <Square className="w-4 h-4 text-purple-500" />;
      case 'landscape':
        return <Image className="w-4 h-4 text-orange-500" />;
      case 'graphic':
        return <FileText className="w-4 h-4 text-pink-500" />;
      case 'landing_page':
        return <Smartphone className="w-4 h-4 text-teal-500" />;
      case 'top_image':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'collage_image':
        return <Layers className="w-4 h-4 text-violet-500" />;
      default:
        return <Sliders className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div id="preset-selector-container" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-500" />
          一键预设配置
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            id="btn-restore-default-presets"
            type="button"
            onClick={handleRestoreDefaults}
            className="text-[10px] text-slate-500 hover:text-indigo-650 hover:bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded transition-all flex items-center gap-0.5"
            title="恢复默认的 8 个常用预设"
          >
            <RotateCcw className="w-3 h-3" />
            恢复默认
          </button>
          {!isAdding && (
            <button
              id="btn-trigger-add-preset"
              type="button"
              onClick={() => setIsAdding(true)}
              className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors font-medium px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100"
            >
              <Plus className="w-3.5 h-3.5" />
              新建预设
            </button>
          )}
        </div>
      </div>

      {/* Preset List Grid Wrap for Scrollability */}
      <div id="presets-list-scroll-wrapper" className="max-h-[280px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
        <div className="grid grid-cols-2 gap-2 pb-1">
          {presets.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <div
                id={`preset-card-${preset.id}`}
                key={preset.id}
                onClick={() => handleApply(preset)}
                className={`relative group flex flex-col justify-between p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-100'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full mb-1">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 truncate" title={preset.name}>
                    {getPresetIcon(preset.id)}
                    {preset.name}
                  </span>

                  <button
                    id={`btn-delete-preset-${preset.id}`}
                    onClick={(e) => handleDeletePreset(preset.id, e)}
                    className="p-1 rounded text-slate-350 hover:text-rose-500 hover:bg-rose-50 transition-all flex-shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 lg:opacity-100"
                    title="删除预设"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-0.5 text-[11px] text-slate-500">
                  <div>
                    {preset.widthMode === 'ratio_16_9'
                      ? '16:9 智能裁剪'
                      : preset.widthMode === 'ratio_9_16'
                      ? '9:16 智能裁剪'
                      : preset.width && preset.height
                      ? `${preset.width} × ${preset.height}`
                      : '保持原始尺寸'}
                  </div>
                  <div>
                    {preset.maxSizeKB
                      ? preset.maxSizeKB >= 1024
                        ? `${(preset.maxSizeKB / 1024).toFixed(0)}MB 以下`
                        : `${preset.maxSizeKB}KB 以下`
                      : '无损压缩 / 仅缩放'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Custom Preset Modal/Form */}
      {isAdding && (
        <form
          id="form-add-preset"
          onSubmit={handleAddPreset}
          className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-fade-in"
        >
          <div className="text-xs font-semibold text-slate-700">添加自定义预设</div>
          
          <div className="space-y-2">
            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-1">预设名称*</label>
              <input
                id="input-new-preset-name"
                type="text"
                required
                placeholder="例如: 微信头像、高清缩略图"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-slate-500 mb-1">宽度 (px)</label>
                <input
                  id="input-new-preset-width"
                  type="number"
                  min="1"
                  disabled={!!newPresetRatio}
                  placeholder={newPresetRatio ? "无需填" : "保持宽"}
                  value={newPresetRatio ? "" : newPresetWidth}
                  onChange={(e) => {
                    setNewPresetWidth(e.target.value === '' ? '' : Number(e.target.value));
                    setNewPresetRatio(null);
                  }}
                  className={`w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:border-indigo-500 focus:outline-none ${newPresetRatio ? 'bg-slate-100 placeholder-slate-400 cursor-not-allowed text-slate-400' : ''}`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-500 mb-1">高度 (px)</label>
                <input
                  id="input-new-preset-height"
                  type="number"
                  min="1"
                  disabled={!!newPresetRatio}
                  placeholder={newPresetRatio ? "无需填" : "保持高"}
                  value={newPresetRatio ? "" : newPresetHeight}
                  onChange={(e) => {
                    setNewPresetHeight(e.target.value === '' ? '' : Number(e.target.value));
                    setNewPresetRatio(null);
                  }}
                  className={`w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:border-indigo-500 focus:outline-none ${newPresetRatio ? 'bg-slate-100 placeholder-slate-400 cursor-not-allowed text-slate-400' : ''}`}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 py-0.5">
              <span className="text-[10px] text-slate-400 font-medium">推荐比例:</span>
              <button
                type="button"
                onClick={() => {
                  if (newPresetRatio === 'ratio_16_9') {
                    setNewPresetRatio(null);
                  } else {
                    setNewPresetRatio('ratio_16_9');
                    setNewPresetWidth('');
                    setNewPresetHeight('');
                  }
                }}
                className={`text-[10px] px-2.5 py-1 rounded-lg transition-all font-semibold border ${
                  newPresetRatio === 'ratio_16_9'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-100'
                }`}
              >
                16:9
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newPresetRatio === 'ratio_9_16') {
                    setNewPresetRatio(null);
                  } else {
                    setNewPresetRatio('ratio_9_16');
                    setNewPresetWidth('');
                    setNewPresetHeight('');
                  }
                }}
                className={`text-[10px] px-2.5 py-1 rounded-lg transition-all font-semibold border ${
                  newPresetRatio === 'ratio_9_16'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-100'
                }`}
              >
                9:16
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-1">目标限制大小 (KB)</label>
              <input
                id="input-new-preset-size"
                type="number"
                min="10"
                placeholder="不设则为默认无损, 例如 400"
                value={newPresetSize}
                onChange={(e) => setNewPresetSize(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 text-xs pt-1">
            <button
              id="btn-cancel-add-preset"
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
            >
              取消
            </button>
            <button
              id="btn-save-new-preset"
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
            >
              确保存储
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
