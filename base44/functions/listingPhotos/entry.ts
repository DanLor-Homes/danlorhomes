import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { resolveListingPhotos } from '../../shared/listingImage.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => (error.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const page = await base44.entities.PortalListing.filter(
      { photo_checked: { $ne: true } },
      { sort: '-first_seen', limit: 12 }
    );
    const items = page?.items || [];
    if (!items.length) return Response.json({ checked: 0, photos: [] });

    const pending = items.filter((item) => item.url && !item.image_url);
    const resolved = await resolveListingPhotos(base44, pending);
    const byId = new Map(resolved.map((entry) => [entry.id, entry.image_url]));
    const photos = resolved.filter((entry) => entry.image_url);

    const updates = items.map((item) => {
      const image = byId.get(item.id);
      return image ? { id: item.id, image_url: image, photo_checked: true } : { id: item.id, photo_checked: true };
    });
    await base44.entities.PortalListing.bulkUpdate(updates);

    return Response.json({ checked: items.length, photos });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}