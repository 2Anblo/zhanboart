"use client";

import { useRef, useState } from "react";
import { quickJournalConfig as copy } from "@/config";

import ActivityImages, { appendActivityImages, type ActivityImage } from "@/components/ActivityImages";

export default function QuickJournal({ canPublish, mediaConnected, busy, onPublish }: {
  canPublish: boolean;
  mediaConnected: boolean;
  busy: boolean;
  onPublish: (data: FormData) => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [images, setImages] = useState<ActivityImage[]>([]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const submitting = useRef(false);

  const locked = busy || sending;

  async function publish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || locked || !canPublish || (!body.trim() && !images.length)) return;
    submitting.current = true;
    setSending(true);
    setError("");
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const text = body.trim();
    const data = new FormData();
    data.set("type", "notes");
    data.set("body", text);
    data.set("excerpt", Array.from(text.replace(/\s+/g, " ")).slice(0, 120).join(""));
    data.set("date", date);
    data.set("slug", `activity-${date}-${crypto.randomUUID()}`);
    data.set("visibility", "public");
    appendActivityImages(data, images);
    try {
      await onPublish(data);
      setBody("");
      setImages([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.failed);
    } finally {
      submitting.current = false;
      setSending(false);
    }
  }

  return (
    <form className="quick-journal" onSubmit={publish} aria-label={copy.heading} aria-busy={sending}>
      <label htmlFor="quick-journal-body">{copy.heading}</label>
      <ActivityImages images={images} onChange={setImages} disabled={locked} canUpload={mediaConnected}>
      <textarea id="quick-journal-body" value={body} onChange={(event) => setBody(event.target.value)}
        placeholder={copy.placeholder} rows={4} maxLength={20000} disabled={locked}
        />
      </ActivityImages>
      <div className="quick-journal-actions">
        <span>{copy.publicNote}{!mediaConnected ? ` · ${copy.noMedia}` : ""}</span>
        <button className="quick-journal-publish" type="submit" disabled={locked || !canPublish || (!body.trim() && !images.length)}>
          {sending ? copy.sending : copy.publish}
        </button>
      </div>
      {error ? <p className="admin-alert is-error" role="alert">{error}</p> : null}
    </form>
  );
}
