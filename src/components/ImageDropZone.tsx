"use client";

import { useState, type ReactNode } from "react";

export default function ImageDropZone({ disabled, onFiles, children }: {
  disabled: boolean;
  onFiles: (files: File[]) => void;
  children: ReactNode;
}) {
  const [dragging, setDragging] = useState(false);
  return <div className={`image-drop-zone${dragging && !disabled ? " is-dragging" : ""}${disabled ? " is-disabled" : ""}`}
    onDragOver={(event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = disabled ? "none" : "copy";
      if (!disabled) setDragging(true);
    }}
    onDragLeave={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
    }}
    onDrop={(event) => {
      event.preventDefault();
      setDragging(false);
      if (!disabled) onFiles(Array.from(event.dataTransfer.files));
    }}>
    <span className="image-drop-hint">{dragging && !disabled ? "松开即可添加图片" : "将图片拖到这里，或点击选择"}</span>
    {children}
  </div>;
}
