# 19 — Storage Configuration

## Purpose

Document the object-storage buckets, path conventions, access rules and the upload helper.

## Buckets

| Bucket | Public? | Holds | Writers |
| --- | --- | --- | --- |
| `product-images` | No | Product photography and gallery images | Owning seller, admin |
| `seller-media` | No | Store logos, covers, harvest photos | Owning seller, admin |
| `avatars` | No | User profile pictures | The user, admin |
| `review-images` | No | Photos attached to reviews | The review author, admin |

All buckets are **private**. Media is served through signed URLs, so a leaked path is not
a permanent leak.

## Path convention

The first path segment is the owning identifier. Storage policies match on it, so the
convention *is* the security model.

```text
product-images/<seller_id>/<product_id>/<uuid>.webp
seller-media/<seller_id>/logo.webp
seller-media/<seller_id>/harvests/<uuid>.webp
avatars/<user_id>/avatar.webp
review-images/<user_id>/<review_id>/<uuid>.webp
```

⚠️ Writing outside your own folder is rejected by policy. If an upload fails with a
permission error, check the first segment before anything else.

## Policy shape

```sql
create policy "sellers write their own product images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'product-images'
  and public.owns_seller(auth.uid(), ((storage.foldername(name))[1])::uuid)
);
```

Reads use signed URLs generated server-side or by the owner, so there is no blanket public
`select` policy.

## Using `src/lib/storage.ts`

```ts
import { uploadImage, getSignedUrl, removeImage } from "@/lib/storage";

const path = await uploadImage({
  bucket: "product-images",
  path: `${sellerId}/${productId}/${crypto.randomUUID()}.webp`,
  file,
});

const url = await getSignedUrl("product-images", path, 3600); // 1 hour
await removeImage("product-images", path);
```

The helper handles content type, cache control and error mapping. Store the **path** in
the database (`products.images[]`, `product_images.url`, `sellers.logo_url`, …) and mint a
signed URL at render time — never persist an expiring URL.

## Client-side rules

| Rule | Why |
| --- | --- |
| Max ~5 MB per image | Mobile upload reliability |
| Accept `image/jpeg`, `image/png`, `image/webp` | Predictable rendering |
| Resize/compress before upload (canvas in the browser) | The Worker runtime has no `sharp` |
| Always set `alt` text | Accessibility and SEO |
| Show progress and a retry affordance | Uploads fail on flaky mobile networks |

## Image rendering

```tsx
<img src={signedUrl} alt={product.name} loading="lazy" width={600} height={600}
     className="aspect-square w-full rounded-xl object-cover" />
```

Explicit dimensions or an `AspectRatio` wrapper prevent layout shift (a Core Web Vitals
penalty).

## Cleanup

Deleting a row does not delete its objects. When a product or review is hard-deleted,
remove its files in the same operation. Soft-deleted products keep their media so the
action can be reversed.

## Common mistakes

- ⚠️ Making a bucket public "temporarily" to debug a signed-URL problem.
- ⚠️ Storing signed URLs in the database — they expire and break the page later.
- ⚠️ Uploading straight from a phone camera (8–12 MB) with no compression.
- ⚠️ Using a random path prefix and then wondering why the policy denies the write.
