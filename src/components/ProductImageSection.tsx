import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import { Camera, Upload, Trash2 } from 'lucide-react';

interface ProductImageSectionProps {
  image: string;
  defaultImage: string;
  onChange: (image: string) => void;
}

export const ProductImageSection = memo(function ProductImageSection({
  image,
  defaultImage,
  onChange,
}: ProductImageSectionProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Direct mediaDevices error, falling back to camera file input', err);
      setIsCameraActive(false);
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const maxWidth = 800;
      const maxHeight = 600;
      let w = video.videoWidth || 640;
      let h = video.videoHeight || 480;
      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w);
        w = maxWidth;
      }
      if (h > maxHeight) {
        w = Math.round((w * maxHeight) / h);
        h = maxHeight;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        onChange(dataUrl);
      }
    }
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onChange(result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
        Mahsulot rasmi:
      </label>

      {/* Hidden native inputs for maximum mobile & laptop compatibility */}
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={handleFileUpload} 
      />
      <input 
        ref={cameraInputRef}
        type="file" 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
        onChange={handleFileUpload} 
      />

      {/* Live Camera View if Active */}
      {isCameraActive ? (
        <div className="bg-slate-900 rounded-2xl p-3 flex flex-col items-center gap-3 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-slate-700">
            <video 
              ref={videoRef} 
              playsInline 
              autoPlay 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="flex gap-2.5 w-full max-w-sm">
            <button
              type="button"
              onClick={capturePhoto}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl active:scale-95 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md min-h-[44px]"
            >
              <Camera className="w-4 h-4 stroke-[2.5]" />
              <span>Suratga olish</span>
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl active:scale-95 transition-all text-sm cursor-pointer min-h-[44px]"
            >
              Bekor
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
          {/* Image Preview */}
          <div className="relative group shrink-0">
            <img 
              src={image || defaultImage} 
              alt="Tovar rasmi" 
              width={96}
              height={96}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-xs bg-white dark:bg-slate-800"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultImage;
              }}
            />
            {image && image !== defaultImage && (
              <button
                type="button"
                onClick={() => onChange(defaultImage)}
                className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 transition-colors cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center"
                title="Rasmni olib tashlash"
                aria-label="Rasmni olib tashlash"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Upload & Camera Buttons */}
          <div className="flex-1 flex flex-col gap-2 w-full">
            <div className="grid grid-cols-2 gap-2">
              {/* Method 1: Upload (Mobile gallery or PC files) */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[46px] px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-200 font-bold rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                title="Qurilmadan fayl yuklash"
              >
                <Upload className="w-4 h-4 text-brand-light shrink-0" />
                <span>Fayldan yuklash</span>
              </button>

              {/* Method 2: Camera (Live camera or native mobile camera) */}
              <button
                type="button"
                onClick={startCamera}
                className="min-h-[46px] px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-200 font-bold rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                title="Kamera orqali suratga olish"
              >
                <Camera className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Kameradan olish</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-tight">
              Telefonda bo'lsa galereya yoki kameradan, kompyuterda bo'lsa fayllardan yoki veb-kameradan rasm yuklashingiz mumkin.
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
