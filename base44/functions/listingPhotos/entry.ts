import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { resolveListingPhotos } from '../../shared/listingImage.ts';

const BATCH_SIZE = 8;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => (error.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const page = await base44.entities.PortalListing.filter(
      { photo_checked: { $ne: true } },
      { sort: '-first_seen', limit: BATCH_SIZE }
    );
    const items = (page?.items || []).filter((item) => !item.image_url);
    if (!items.length) return Response.json({ checked: 0, photos: [], remaining: false });

    const resolved = await resolveListingPhotos(base44, items);
    const byId = new Map(resolved.map((entry) => [entry.id, entry]));
    const photos = resolved
      .filter((entry) => entry.image_url)
      .map((entry) => ({ id: entry.id, image_url: entry.image_url, generated: Boolean(entry.generated) }));

    const updates = items.map((item) => {
      const hit = byId.get(item.id);
      return hit?.image_url
        ? { id: item.id, image_url: hit.image_url, photo_generated: Boolean(hit.generated), photo_checked: true }
        : { id: item.id, photo_checked: true };
    });
    await base44.entities.PortalListing.bulkUpdate(updates);

    const remaining = Boolean(page?.has_more) || items.length === BATCH_SIZE;
    return Response.json({ checked: items.length, photos, remaining });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}