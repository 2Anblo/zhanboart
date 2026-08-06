# zhanbo.art

Personal site for private writing, notes, photos, light, night, music, and memory.

The site uses Next.js App Router with static export and Markdown content from `content/`.

## Stack

- Next.js 16 App Router
- React 19 + TypeScript
- Tailwind CSS
- Markdown content with `gray-matter`
- Local R2 photo admin

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

Local photo admin:

```text
npm run photo-admin
http://127.0.0.1:4173
```

### Photo workflow

- The admin binds to `127.0.0.1` and is never deployed with the public site.
- Uploads are sent from the local server to Cloudflare R2 using S3 credentials.
- Each upload creates a matching Markdown file in `content/photos/`.
- Deleting an R2-managed photo removes both the object and its Markdown file.
- Existing repository images are shown as read-only and are not deleted by the
  R2 admin.
- Commit and push the generated Markdown after editing to publish the change.

## Build

```bash
npm run lint
npm run build
```

`npm run build` produces the static site in `out/`.

## Local R2 photo admin

Copy `.env.example` to `.env.local` and configure:

```dotenv
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_PUBLIC_URL=https://media.example.com
PHOTO_ADMIN_PORT=4173
```

The R2 token needs **Object Read & Write** access scoped to the selected bucket.
`CLOUDFLARE_R2_PUBLIC_URL` should be a custom domain connected to the bucket for
production. An `r2.dev` URL can be used temporarily for testing.

Start the tool with `npm run photo-admin`. Credentials stay server-side and are
never returned by its status endpoint.

## Deployment

The project is configured for static export in `next.config.ts`:

```ts
output: "export"
```

Vercel can deploy it with the default build command:

```bash
npm run build
```
