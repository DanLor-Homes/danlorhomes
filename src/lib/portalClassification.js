import { base44 } from '@/api/base44Client';
import { classifyPublisher } from './publisherClassifier';

/**
 * Clasifica los anuncios sin señales asignadas y guarda el resultado.
 * Devuelve la lista actualizada y cuántos anuncios se clasificaron.
 */
export async function classifyPendingListings(items) {
  const pending = items.filter((item) => !item.publisher_type || item.publisher_type === 'desconocido');
  const results = pending
    .map((item) => ({ id: item.id, ...classifyPublisher(item) }))
    .filter((item) => item.publisher_type !== 'desconocido');

  if (results.length) {
    await base44.entities.PortalListing.bulkUpdate(
      results.map(({ id, publisher_type }) => ({ id, publisher_type }))
    );
  }

  const assigned = new Map(results.map((item) => [item.id, item.publisher_type]));

  return {
    listings: items.map((item) =>
      assigned.has(item.id) ? { ...item, publisher_type: assigned.get(item.id) } : item
    ),
    count: results.length,
  };
}