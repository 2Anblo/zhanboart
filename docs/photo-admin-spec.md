# Photo admin

## Goal

The owner can maintain the public photo page without editing source files.

## Content model

The photo library has two layers:

- **Media** is the source of truth for which images appear in the gallery.
- **Photos** adds optional editorial metadata and a detail page to an image.

This keeps the common upload/delete flow short while preserving richer photo
stories when they are wanted.

## Admin flows

### Upload

1. Open `/admin` and sign in.
2. Open **Media**.
3. Upload an image to the gallery root.
4. The image appears on `/photos` after the content commit is deployed.

### Delete

1. Open **Media**.
2. Select the image and delete it.
3. The image disappears from `/photos` after the content commit is deployed.
4. If the image has a matching **Photos** item, delete that item as well so its
   detail page is removed.

### Add details

1. Create a **Photos** item.
2. Select an existing image from the media library.
3. Add title, date, caption, location, mood, tags, visibility, and body as
   needed.
4. Save. The gallery card now uses those details and links to its detail page.

## Storage and deployment

- Images live in `public/images/gallery/` and are committed to Git.
- Metadata lives in `content/photos/` as Markdown and is committed to Git.
- Local editing uses Tina's local server through `npm run dev`.
- Production editing uses TinaCloud authentication and the repository
  integration configured by `NEXT_PUBLIC_TINA_CLIENT_ID`, `TINA_TOKEN`, and
  `NEXT_PUBLIC_TINA_BRANCH`.

## Constraints

- The site remains a static export; admin changes become public after a build.
- Media deletion and metadata deletion are intentionally separate operations.
- Images without metadata still appear, using a readable version of the file
  name as their gallery title and no detail-page link.
