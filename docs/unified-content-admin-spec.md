# Unified content admin

## Goal

The owner can manage every editorial section of `zhanbo.art` from the existing
password-protected `/admin` workspace:

- journal
- notes
- photos
- music
- thoughts
- archive

The archive is a derived view across the five content collections. It is not a
sixth content source and never creates duplicate Markdown.

## Source of truth

- Markdown under `content/<type>/` remains the editorial source of truth.
- GitHub's Contents API creates, updates, and deletes Markdown on the configured
  deployment branch.
- Cloudflare R2 stores uploaded photos, editorial images, album art, and audio.
- A successful GitHub commit triggers the normal Vercel deployment.

The public site keeps reading the same Markdown files it reads today. The admin
does not introduce a database or a second content model.

## Admin flows

### Create

1. Choose a collection.
2. Add the shared metadata and body.
3. Add collection-specific media when needed.
4. Save as public, unlisted, or draft.
5. The server uploads new media first, then commits the Markdown file.
6. If the commit fails, newly uploaded R2 objects are removed.

### Edit

1. Open an existing record from its collection or the archive.
2. Change metadata, body, visibility, or media.
3. Save to update the existing Markdown file in one GitHub commit.
4. A replaced managed R2 object is removed after the commit succeeds.

Slugs are stable after creation so public URLs do not change accidentally.

### Delete

1. Confirm the destructive action.
2. The server removes the Markdown record first.
3. R2 objects owned by that record are removed after the GitHub deletion.

Repository images referenced only by URL are never deleted with a content item.

## Collection fields

All collections support title, date, slug, excerpt, tags, mood, location, body,
and visibility.

- Photos add image and caption.
- Music adds artist, audio, and album art.
- Journal, notes, and thoughts can add an optional editorial image.

## Workspace design

The admin is a private archive desk rather than a generic dashboard. A persistent
index rail switches collections, while the main surface holds a searchable ledger
and an editor. The visual language extends the existing darkroom treatment with
paper, graphite, muted red, and one archive-spine accent.

## Security and deployment

- The existing signed, HTTP-only admin session protects all admin routes.
- GitHub and R2 credentials remain server-only.
- Admin responses use `Cache-Control: no-store`.
- Public content pages remain pre-rendered where possible.
- `/admin` and `/api/admin/*` run as Node.js server functions.

## Acceptance criteria

- Create, edit, list, search, filter, and delete all five content types.
- Upload and replace photos, editorial images, album art, and common audio files.
- View all content chronologically in the archive, grouped by year.
- Keep draft and unlisted content out of the public archive and sitemap.
- Preserve the existing photo records and the site asset library.
- Work on desktop and mobile, with keyboard focus and reduced-motion support.
- Pass lint, the existing photo-admin tests, and a production build.
