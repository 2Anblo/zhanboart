"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useTheme } from "@/components/ThemeProvider";

interface MusicPlayerProps {
  src: string;
  title?: string;
  artist?: string;
  albumArt?: string;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function MusicPlayer({ src, title, artist, albumArt }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const { theme } = useTheme();
  const isLight = theme === "light";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!isDragging) setCurrentTime(audio.currentTime);
    };
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setIsPlaying(false);
      setDuration(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [isDragging]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleSeek = useCallback(
    (clientX: number) => {
      const progress = progressRef.current;
      const audio = audioRef.current;
      if (!progress || !audio || !duration) return;

      const rect = progress.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newTime = ratio * duration;
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [duration]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      handleSeek(e.clientX);
    },
    [handleSeek]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) handleSeek(e.clientX);
    },
    [isDragging, handleSeek]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [isDragging, handleMouseUp]);

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  const cardBg = isLight ? "rgba(255,253,246,0.6)" : "rgba(17,18,23,0.5)";
  const cardBorder = isLight ? "rgba(42,41,38,0.12)" : "rgba(255,255,255,0.08)";
  const textColor = isLight ? "var(--day-text)" : "var(--night-text)";
  const mutedColor = isLight ? "var(--day-muted)" : "var(--night-muted)";
  const progressBg = isLight ? "rgba(42,41,38,0.15)" : "rgba(255,255,255,0.12)";

  return (
    <div
      className="music-player"
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: "16px",
        padding: "1.25rem",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        color: textColor,
        transition: "background-color 0.5s ease, border-color 0.5s ease, color 0.5s ease",
        maxWidth: "400px",
        width: "100%",
      }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center gap-4">
        {/* Album Art */}
        {albumArt ? (
          <div
            className="shrink-0"
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "10px",
              overflow: "hidden",
              background: isLight ? "var(--day-surface)" : "var(--night-surface)",
            }}
          >
            <img
              src={albumArt}
              alt={title || "Album art"}
              className="w-full h-full object-cover"
              style={{ opacity: isPlaying ? 1 : 0.85, transition: "opacity 0.4s ease" }}
            />
          </div>
        ) : null}

        {/* Info */}
        <div className="min-w-0 flex-1">
          {title ? (
            <div
              className="truncate"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.1rem",
                lineHeight: 1.3,
                color: textColor,
              }}
            >
              {title}
            </div>
          ) : null}
          {artist ? (
            <div
              className="truncate"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.8rem",
                fontWeight: 400,
                color: mutedColor,
                marginTop: "0.2rem",
              }}
            >
              {artist}
            </div>
          ) : null}
        </div>

        {/* Play Button */}
        <button
          onClick={togglePlay}
          className="shrink-0 cursor-pointer flex items-center justify-center"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            border: "none",
            background: isPlaying ? "var(--color-amber)" : "transparent",
            color: isPlaying ? "#fff" : textColor,
            borderColor: isPlaying ? "var(--color-amber)" : cardBorder,
            borderStyle: "solid",
            borderWidth: isPlaying ? "0" : "1px",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            if (!isPlaying) {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-amber)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--color-amber)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isPlaying) {
              (e.currentTarget as HTMLButtonElement).style.borderColor = cardBorder;
              (e.currentTarget as HTMLButtonElement).style.color = textColor;
            }
          }}
          aria-label={isPlaying ? "暂停" : "播放"}
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="2" width="4" height="12" rx="1" />
              <rect x="9" y="2" width="4" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 2.5l10 5.5-10 5.5V2.5z" />
            </svg>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div
          ref={progressRef}
          className="cursor-pointer"
          style={{
            height: "3px",
            borderRadius: "2px",
            background: progressBg,
            position: "relative",
            transition: "background-color 0.5s ease",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPercent}%`,
              borderRadius: "2px",
              background: "var(--color-amber)",
              transition: isDragging ? "none" : "width 0.1s linear",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: `${progressPercent}%`,
              transform: "translate(-50%, -50%)",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "var(--color-amber)",
              opacity: isDragging ? 1 : 0,
              transition: "opacity 0.2s ease",
              pointerEvents: "none",
            }}
          />
        </div>

        <div
          className="flex justify-between mt-2"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            letterSpacing: "0.06em",
            color: mutedColor,
          }}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
