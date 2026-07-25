# zhanbo.art

Personal site for private writing, notes, photos, light, night, music, and memory.

The site uses Next.js App Router with static export and Markdown content from `content/`.

## Stack

- Next.js 16 App Router
- React 19 + TypeScript
- Tailwind CSS
- Markdown content with `gray-matter`
- TinaCMS lightweight content admin

## Content

Markdown content lives in:

- `content/journal`
- `content/notes`
- `content/photos`
- `content/music`
- `content/thoughts`

Supported frontmatter includes:

```yaml
---
title: "Title"
date: "2026-07-25"
excerpt: "Short description"
mood: "quiet"
location: "Shanghai"
tags: ["life", "memory"]
image: "/images/gallery/item1.jpg"
caption: "Image caption"
audio: "/music/example.mp3"
albumArt: "/images/gallery/item5.jpg"
artist: "Artist"
visibility: "public"
---
```

`visibility` can be `public`, `unlisted`, or `draft`.

## Development

```bash
npm install
npm run dev
```

Local site:

```text
http://localhost:3000
```

TinaCMS admin:

```text
http://localhost:3000/admin
```

## Build

```bash
npm run lint
npm run build
```

`npm run build` builds the Tina admin first, then runs `next build`.

## TinaCMS

Tina schema is defined in `tina/config.ts`.

Generated Tina files are intentionally ignored:

- `public/admin/`
- `tina/__generated__/`
- `tina/tina-lock.json`

For Vercel production editing, configure these environment variables:

```env
NEXT_PUBLIC_TINA_CLIENT_ID=
TINA_TOKEN=
NEXT_PUBLIC_TINA_BRANCH=master
```

Use `.env.example` as the local template. The Tina Cloud values come from the Tina project dashboard.

## Deployment

The project is configured for static export in `next.config.ts`:

```ts
output: "export"
```

Vercel can deploy it with the default build command:

```bash
npm run build
```
