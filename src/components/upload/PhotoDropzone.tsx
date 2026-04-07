'use client';
import { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

interface PhotoDropzoneProps {
  imagePreview: string | null;
  onImageSelect: (file: File) => void;
  onClear: () => void;
}

export function PhotoDropzone({ imagePreview, onImageSelect, onClear }: PhotoDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (file && file.type.startsWith('image/')) {
      onImageSelect(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
    // Reset value so the same file can be uploaded again if cleared
    e.target.value = '';
  };

  // Drag and Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div 
      onClick={() => !imagePreview && fileInputRef.current?.click()}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`
        relative aspect-video w-full rounded-3xl overflow-hidden cursor-pointer flex items-center justify-center group transition-all
        ${imagePreview 
          ? 'bg-background' 
          : 'bg-foreground/[0.03] border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/[0.02]'
        }
        ${isDragging ? 'border-primary bg-primary/[0.05] scale-[0.99]' : ''}
      `}
      role="button"
      aria-label="Upload cover photo"
    >
      {imagePreview ? (
        <>
          <img 
            src={imagePreview} 
            className="w-full h-full object-cover" 
            alt="Preview" 
          />
          <button 
            type="button"
            onClick={(e) => { 
              e.stopPropagation(); 
              onClear(); 
            }}
            className="absolute top-4 right-4 p-2 bg-foreground/80 backdrop-blur-md rounded-full text-background hover:bg-red-500 transition-colors shadow-lg"
            aria-label="Remove image"
          >
            <X size={16} />
          </button>
        </>
      ) : (
        <div className="text-center pointer-events-none">
          <Camera 
            className={`mx-auto transition-colors ${isDragging ? 'text-primary' : 'text-foreground/20 group-hover:text-primary'}`} 
            size={32} 
          />
          <p className="text-[10px] text-foreground/40 uppercase tracking-widest mt-3 font-black">
            {isDragging ? 'Drop to Upload' : 'Upload Cover Photo'}
          </p>
        </div>
      )}
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleChange} 
        className="hidden" 
        accept="image/*" 
      />
    </div>
  );
}