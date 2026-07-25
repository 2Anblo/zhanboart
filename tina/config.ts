import { defineConfig } from "tinacms";

const branch =
  process.env.NEXT_PUBLIC_TINA_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "master";

const visibilityOptions = [
  { label: "公开", value: "public" },
  { label: "不列出", value: "unlisted" },
  { label: "草稿", value: "draft" },
];

const commonFields = [
  {
    type: "string",
    name: "title",
    label: "标题",
    isTitle: true,
    required: true,
  },
  {
    type: "string",
    name: "date",
    label: "日期",
    description: "YYYY-MM-DD",
    required: true,
  },
  {
    type: "string",
    name: "excerpt",
    label: "摘要",
    ui: {
      component: "textarea",
    },
  },
  {
    type: "string",
    name: "mood",
    label: "心情",
  },
  {
    type: "string",
    name: "location",
    label: "地点",
  },
  {
    type: "string",
    name: "tags",
    label: "标签",
    list: true,
  },
  {
    type: "string",
    name: "visibility",
    label: "可见性",
    options: visibilityOptions,
    required: true,
  },
] as const;

const bodyField = {
  type: "rich-text",
  name: "body",
  label: "正文",
  isBody: true,
} as const;

export default defineConfig({
  branch,
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,
  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "uploads",
      publicFolder: "public",
    },
  },
  schema: {
    collections: [
      {
        name: "journal",
        label: "日志",
        path: "content/journal",
        format: "md",
        fields: [...commonFields, bodyField],
      },
      {
        name: "notes",
        label: "笔记",
        path: "content/notes",
        format: "md",
        fields: [...commonFields, bodyField],
      },
      {
        name: "photos",
        label: "照片",
        path: "content/photos",
        format: "md",
        fields: [
          ...commonFields,
          {
            type: "image",
            name: "image",
            label: "图片",
          },
          {
            type: "string",
            name: "caption",
            label: "图片说明",
          },
          bodyField,
        ],
      },
      {
        name: "music",
        label: "音乐",
        path: "content/music",
        format: "md",
        fields: [
          ...commonFields,
          {
            type: "string",
            name: "artist",
            label: "艺术家",
          },
          {
            type: "string",
            name: "audio",
            label: "音频路径",
            description: "例如 /music/self-control.mp3",
          },
          {
            type: "image",
            name: "albumArt",
            label: "封面",
          },
          {
            type: "image",
            name: "image",
            label: "图片",
          },
          bodyField,
        ],
      },
      {
        name: "thoughts",
        label: "想法",
        path: "content/thoughts",
        format: "md",
        fields: [...commonFields, bodyField],
      },
    ],
  },
});
