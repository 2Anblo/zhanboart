# zhanbo.art

Personal site for private writing, notes, photos, light, night, music, and memory.

The site uses Next.js App Router with Markdown content from `content/`. The public
site runs on Vercel, and the private content index is available online at `/admin`.

## Stack

- Next.js 16 App Router
- React 19 + TypeScript
- Tailwind CSS
- Markdown content with `gray-matter`
- Vercel online content admin
- Local R2 photo admin fallback

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
image: "/images/hero/night-window.jpg"
caption: "Image caption"
audio: "/music/example.mp3"
albumArt: "/images/rooms/room2-left.jpg"
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

Online photo admin:

```text
https://your-domain.example/admin
```

### Content workflow

- The online admin is protected by a password stored only in Vercel environment variables.
- Journal, notes, photos, music, and thoughts share create, edit, delete, search, and visibility controls.
- Archive is a chronological view of those five collections rather than a separate content source.
- Images and common audio formats are sent server-side to Cloudflare R2 using S3 credentials.
- Each save commits the matching Markdown file to GitHub, which triggers a Vercel deployment.
- Deleting R2-managed content removes both its owned media and Markdown file.
- The admin also lists and manages image resources under `public/images` (gallery, hero, rooms, and uploads).
- Site resource uploads are committed to GitHub and become public after the Vercel deployment completes.
- Existing repository media referenced by URL is never deleted with a content item.
- The local photo tool remains available as a fallback for the photo-only workflow.

The `/admin` session protects every content module without introducing another
login system or a separate database.

## Build

```bash
npm run lint
npm run build
```

Vercel runs the Next.js server build. Public pages remain pre-rendered where possible,
while `/admin` and `/api/admin/*` run as Node.js server functions.

## Local R2 photo admin

Copy `.env.example` to `.env.local` and configure:

```dotenv
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_PUBLIC_URL=https://media.example.com
ADMIN_PORT=4173
```

The R2 token needs **Object Read & Write** access scoped to the selected bucket.
`CLOUDFLARE_R2_PUBLIC_URL` should be a custom domain connected to the bucket for
production. An `r2.dev` URL can be used temporarily for testing.

Start the local fallback with `npm run photo-admin`. Credentials stay server-side and
are never returned by its status endpoint.

## Deployment

Connect the repository to Vercel and add these environment variables for Production
and Preview as needed:

```dotenv
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_PUBLIC_URL=https://media.example.com
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
GITHUB_OWNER=2Anblo
GITHUB_REPO=zhanboart
GITHUB_TOKEN=
GITHUB_BRANCH=master
GITHUB_CONTENT_ROOT=content
```

`ADMIN_SESSION_SECRET` should be a long random value. The GitHub token needs
permission to read and write contents in this repository. `GITHUB_CONTENT_ROOT`
defaults to `content`. The R2 token needs **Object Read & Write** access scoped to
the selected bucket.

In Vercel, enter the variable name and value in separate fields. After changing an
environment variable, redeploy the project before testing `/admin`.

Vercel can deploy it with the default build command:

```bash
npm run build
```

The full local verification command is:

```bash
npm run lint
npm run test:photo-admin
npm run build
```
