export const CONTENT_TYPES = ["journal", "notes", "photos", "music", "thoughts"] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export const VISIBILITIES = ["public", "unlisted", "draft"] as const;

export type Visibility = (typeof VISIBILITIES)[number];

export const CONTENT_TYPE_META: Record<
  ContentType,
  { label: string; singular: string; description: string }
> = {
  journal: { label: "日志", singular: "一篇日志", description: "较长的记录与叙事" },
  notes: { label: "笔记", singular: "一则笔记", description: "片段、摘录和短记录" },
  photos: { label: "照片", singular: "一张照片", description: "光线、地点与记忆" },
  music: { label: "音乐", singular: "一段音乐", description: "声音与文字之间" },
  thoughts: { label: "想法", singular: "一个想法", description: "尚未归类的念头" },
};

export function isContentType(value: unknown): value is ContentType {
  return typeof value === "string" && CONTENT_TYPES.includes(value as ContentType);
}

export function isVisibility(value: unknown): value is Visibility {
  return typeof value === "string" && VISIBILITIES.includes(value as Visibility);
}
