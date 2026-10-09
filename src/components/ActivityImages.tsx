"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import ImageDropZone from "./ImageDropZone";

export type ActivityImage = { url: string; file?: File };
export const ACTIVITY_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export default function ActivityImages({ images, onChange, disabled, canUpload, children }: {
  children?: ReactNode;
  images: ActivityImage[];
  onChange: (images: ActivityImage[]) => void;
  disabled: boolean;
  canUpload: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const urls = useRef(new Set<string>());
  const [error, setError] = useState("");
  useEffect(() => {
    const live = new Set(images.map((image) => image.url));
    for (const url of urls.current) if (!live.has(url)) { URL.revokeObjectURL(url); urls.current.delete(url); }
  }, [images]);
  useEffect(() => {
    const owned = urls.current;
    return () => { owned.forEach((url) => URL.revokeObjectURL(url)); owned.clear(); };
  }, []);

  function add(files: File[]) {
    if (disabled || !canUpload || !files.length) return;
    if (files.length + images.length > 9) { setError("每条动态最多 9 张图片。"); return; }
    if (files.some((file) => !ACTIVITY_IMAGE_TYPES.includes(file.type))) { setError("请选择 JPG、PNG、WebP、GIF 或 AVIF 图片。"); return; }
    if ([...files, ...images.flatMap((image) => image.file ? [image.file] : [])].reduce((sum, file) => sum + file.size, 0) > 4 * 1024 * 1024) {
      setError("本次上传的图片合计不能超过 4 MB，请缩小图片后重试。"); return;
    }
    setError("");
    onChange([...images, ...files.map((file) => {
      const url = URL.createObjectURL(file); urls.current.add(url); return { url, file };
    })]);
  }

  return <div className="activity-image-picker" onPaste={(event) => {
    const files = Array.from(event.clipboardData.files).filter((file) => file.type.startsWith("image/"));
    if (files.length && canUpload && !disabled) { event.preventDefault(); add(files); }
  }}>
    {children}
    <div className="activity-image-previews">
      {images.map((image, index) => <div key={image.url}>
        <img src={image.url} alt={`待发布图片 ${index + 1}`} width={160} height={160} />
        <button type="button" disabled={disabled} aria-label={`移除图片 ${index + 1}`}
          onClick={() => { setError(""); onChange(images.filter((_, i) => i !== index)); }}>移除</button>
      </div>)}
    </div>
    <ImageDropZone disabled={disabled || !canUpload || images.length >= 9} onFiles={add}>
    <input ref={input} type="file" accept={ACTIVITY_IMAGE_TYPES.join(",")} multiple hidden disabled={disabled || !canUpload}
      onChange={(event) => { add(Array.from(event.target.files || [])); event.target.value = ""; }} />
    <button type="button" disabled={disabled || !canUpload || images.length >= 9} onClick={() => input.current?.click()}>＋ 添加图片</button>
    <span className="activity-image-limit">{images.length}/9 · 上传图片合计最多 4 MB</span>
    </ImageDropZone>
    {error ? <p className="admin-alert is-error" role="alert">{error}</p> : null}
  </div>;
}

export function appendActivityImages(data: FormData, images: ActivityImage[]) {
  data.set("retainedImages", JSON.stringify(images.filter((image) => !image.file).map((image) => image.url)));
  images.forEach((image) => { if (image.file) data.append("imageFiles", image.file); });
}
