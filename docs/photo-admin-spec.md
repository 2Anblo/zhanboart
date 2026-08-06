# Local R2 photo admin

## Goal

The owner can maintain the public photo page from a localhost-only tool without
running an online CMS.

## Content model

The photo library has two sources of truth:

- **Cloudflare R2** stores image objects.
- **Markdown** in `content/photos/` stores editorial metadata and detail pages.

The local tool changes both together. Existing images committed under
`public/images/gallery/` remain visible but read-only in the tool.

## Admin flows

### Upload

1. Run `npm run photo-admin`.
2. Open `http://127.0.0.1:4173`.
3. Select an image and add the desired metadata.
4. Choose **上传并保存**.
5. Commit and push the generated Markdown file.

### Delete

1. Select **删除** on an R2-managed photo.
2. Confirm the irreversible action.
3. The tool stages the Markdown record, deletes the R2 object, then removes the
   staged record. If R2 deletion fails, the Markdown is restored.
4. Commit and push the deletion.

## Storage and deployment

- New images live under `photos/YYYY/MM/` in the configured R2 bucket.
- Metadata lives in `content/photos/` and is committed to Git.
- The tool uses R2's S3-compatible API and an Object Read & Write token scoped
  to one bucket.
- The tool binds only to `127.0.0.1` and validates the request host.
- R2 credentials live in `.env.local`, which is ignored by Git.
- Public delivery uses `CLOUDFLARE_R2_PUBLIC_URL`; a custom domain is preferred.

## Constraints

- The site remains a static export; changes become public after Git deployment.
- Uploads are limited to supported image MIME types and 30 MB.
- R2 deletion is irreversible and always requires an explicit browser confirm.
- The local tool never exposes credentials through its API.
