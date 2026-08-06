# Online R2 photo admin

## Goal

The owner can maintain the public photo page from a password-protected Vercel admin
without depending on TinaCMS.

## Content model

The photo library has two sources of truth:

- **Cloudflare R2** stores image objects.
- **Markdown** in `content/photos/` stores editorial metadata and detail pages.

The online tool changes both together. Existing images committed under
`public/images/gallery/` remain visible but read-only in the tool.

## Admin flows

### Upload

1. Open `/admin` on the deployed site.
2. Sign in with the admin password.
3. Select an image and add the desired metadata.
4. Choose **上传并发布**.
5. The server uploads the image to R2 and commits the Markdown file through the
   GitHub Contents API. GitHub then triggers the normal Vercel deployment.

### Delete

1. Select **删除** on an R2-managed photo.
2. Confirm the irreversible action.
3. The server deletes the R2 object, then removes the Markdown record through GitHub.
4. Vercel deploys the updated public site.

## Storage and deployment

- New images live under `photos/YYYY/MM/` in the configured R2 bucket.
- Metadata lives in `content/photos/` and is committed to GitHub.
- The online API uses R2's S3-compatible API and a bucket-scoped Object Read & Write token.
- The online API uses a GitHub token with repository Contents read/write permission.
- The online API is protected by an HttpOnly, signed session cookie.
- R2 and GitHub credentials live only in Vercel environment variables.
- Public delivery uses `CLOUDFLARE_R2_PUBLIC_URL`; a custom domain is preferred.

## Constraints

- Public pages remain pre-rendered, but the admin and API run as Node.js server functions.
- Uploads are limited to supported image MIME types and 30 MB.
- R2 deletion is irreversible and always requires an explicit browser confirm.
- The online API never returns credentials to the browser.
- The local `npm run photo-admin` tool remains available as a fallback.
