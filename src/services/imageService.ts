// src/services/imageService.ts
// Cloudflare R2 orqali tovar rasmlarini siqish va xavfsiz yuklash

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import imageCompression from 'browser-image-compression';

const accountId = import.meta.env.VITE_R2_ACCOUNT_ID as string | undefined;
const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID as string | undefined;
const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY as string | undefined;
const bucketName = (import.meta.env.VITE_R2_BUCKET_NAME as string | undefined) || 'santexpro-images';
const publicUrl = (import.meta.env.VITE_R2_PUBLIC_URL as string | undefined)?.replace(/\/$/, '') || 'https://pub-ad09aebd8864427182c1d3803b159c00.r2.dev';

export const isR2Configured = Boolean(accountId && accessKeyId && secretAccessKey);

let s3Client: S3Client | null = null;
if (isR2Configured) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
  });
}

/**
 * DataURL (base64) satrini File obyektiga o'girish
 */
function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export const imageService = {
  /**
   * Rasmni siqish (WebP/JPEG, ~100-250KB) va Cloudflare R2 ga yuklash
   */
  uploadImage: async (
    fileOrDataUrl: File | Blob | string,
    fileName?: string
  ): Promise<{ url: string; key: string }> => {
    let fileToUpload: File;

    const cleanBaseName = (fileName || 'product')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 30);

    if (typeof fileOrDataUrl === 'string') {
      if (fileOrDataUrl.startsWith('http://') || fileOrDataUrl.startsWith('https://')) {
        // Allaqachon yuklangan URL bo'lsa qaytaramiz
        return { url: fileOrDataUrl, key: '' };
      }
      fileToUpload = dataURLtoFile(fileOrDataUrl, `${cleanBaseName}.jpg`);
    } else if (fileOrDataUrl instanceof File) {
      fileToUpload = fileOrDataUrl;
    } else {
      fileToUpload = new File([fileOrDataUrl], `${cleanBaseName}.jpg`, { type: fileOrDataUrl.type || 'image/jpeg' });
    }

    // 1. Rasmni brauzerda siqish (Telefon kameralarining 5-10MB hajmini ~200KB ga tushiradi)
    try {
      const options = {
        maxSizeMB: 0.35, // maksimal 350KB
        maxWidthOrHeight: 1200, // sifatli 1200px
        useWebWorker: true,
        fileType: 'image/webp' as const,
      };
      const compressed = await imageCompression(fileToUpload, options);
      fileToUpload = compressed;
    } catch (compressErr) {
      console.warn('[ImageService] Rasm siqishda ogohlantirish, asl fayl ishlatiladi:', compressErr);
    }

    // 2. Cloudflare R2 sozlanmagan bo'lsa fallback
    if (!s3Client || !isR2Configured) {
      console.warn('[ImageService] Cloudflare R2 kalitlari topilmadi, vaqtincha maʼlumot ishlatiladi.');
      if (typeof fileOrDataUrl === 'string') {
        return { url: fileOrDataUrl, key: '' };
      }
      const base64Fallback = await imageCompression.getDataUrlFromFile(fileToUpload);
      return { url: base64Fallback, key: '' };
    }

    // 3. Cloudflare R2 ga yuklash
    try {
      const extension = fileToUpload.type.includes('webp') ? 'webp' : 'jpg';
      const key = `products/${Date.now()}_${cleanBaseName}.${extension}`;

      const arrayBuffer = await fileToUpload.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: uint8Array,
        ContentType: fileToUpload.type || 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      });

      await s3Client.send(command);

      const fullUrl = `${publicUrl}/${key}`;
      return { url: fullUrl, key };
    } catch (uploadErr) {
      console.error('[ImageService] Cloudflare R2 ga yuklashda xatolik:', uploadErr);
      // Agar R2 xato bersa, tovar saqlanishi to'xtab qolmasligi uchun base64/faylni qaytaramiz
      if (typeof fileOrDataUrl === 'string') {
        return { url: fileOrDataUrl, key: '' };
      }
      try {
        const base64Fallback = await imageCompression.getDataUrlFromFile(fileToUpload);
        return { url: base64Fallback, key: '' };
      } catch {
        return { url: '', key: '' };
      }
    }
  },
};
