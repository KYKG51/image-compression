import React, { useState, useRef } from 'react';
import { UploadCloud, Image, ArrowUpFromLine } from 'lucide-react';

interface ImageDropzoneProps {
  onFilesAdded: (files: File[]) => void;
}

export default function ImageDropzone({ onFilesAdded }: ImageDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const processFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const array = Array.from(fileList);
    // Filter to only image files representing typical formats (JPEG, PNG, WebP, GIF, SVG, etc.)
    const images = array.filter(file => file.type.startsWith('image/'));
    if (images.length > 0) {
      onFilesAdded(images);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    processFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    processFiles(e.target.files);
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      id="drag-and-drop-zone-container"
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={onButtonClick}
      className={`group relative flex flex-col items-center justify-center h-[200px] w-full border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 ${
        isDragActive
          ? 'border-indigo-600 bg-indigo-50/50 scale-[0.99] ring-4 ring-indigo-50'
          : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/80 bg-white'
      }`}
    >
      <input
        id="image-file-hidden-input"
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      <div className="relative mb-3 flex items-center justify-center">
        {/* Animated Background Pulse decoration */}
        <div className="absolute inset-0 rounded-full bg-indigo-100/60 scale-125 blur-md opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500" />
        
        <div className="relative p-3 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
          <UploadCloud className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" />
        </div>
      </div>

      <div className="text-center max-w-sm">
        <h4 className="text-sm sm:text-base font-semibold text-slate-800 mb-0.5 group-hover:text-indigo-600 transition-colors">
          拖拽图片到这里，或<span className="text-indigo-600 group-hover:underline">点击浏览文件</span>
        </h4>
        <p className="text-[11px] sm:text-xs text-slate-400 mb-3 font-normal leading-relaxed">
          支持批量上传，无张数限制。支持 PNG、JPG、JPEG、WebP 等格式图片
        </p>
      </div>

      <div className="flex items-center gap-4 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-4 py-1.5 rounded-2xl">
        <span className="flex items-center gap-1">
          <Image className="w-3.5 h-3.5 text-slate-400" />
          不限张数
        </span>
        <div className="w-px h-3 bg-slate-250 bg-slate-300" />
        <span className="flex items-center gap-1">
          <ArrowUpFromLine className="w-3.5 h-3.5 text-slate-400" />
          保持原图比例或一键裁剪
        </span>
      </div>
    </div>
  );
}
