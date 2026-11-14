import { base44 } from '@/api/base44Client';

// Campos que nunca se copian de una ficha a otra
const SKIP_FIELDS = new Set(['id', 'created_date', 'updated_date', 'created_by_id', 'notes', 'attachments']);

const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return !value.trim();
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

// Registros que apuntan a un cliente y deben pasar a la ficha conservada
const RELATIONS = {
  Client: [
    { entity: 'Opportunity', field: 'client_id' },
    { entity: 'Interaction', field: 'client_id' },
    { entity: 'CommercialTask', field: 'client_id' },
    { entity: 'Invoice', field: 'client_id' },
    { entity: 'Property', field: 'owner_client_id' },
  ],
  WebLead: [],
};

export function buildMergedPatch(master, duplicates) {
  const patch = {};

  duplicates.forEach((duplicate) => {
    Object.entries(duplicate).forEach(([field, value]) => {
      if (SKIP_FIELDS.has(field) || isEmpty(value)) return;
      if (isEmpty(master[field])) patch[field] = value;
    });
  });

  const notes = [master.notes, ...duplicates.map((duplicate) => duplicate.notes)]
    .map((value) => (value || '').trim())
    .filter(Boolean);
  const mergedNotes = notes.filter((note, index) => notes.indexOf(note) === index).join('\n\n');
  if (mergedNotes && mergedNotes !== (master.notes || '').trim()) patch.notes = mergedNotes;

  const attachments = [master, ...duplicates]
    .flatMap((record) => record.attachments || [])
    .filter((file, index, list) => file?.file_uri && list.findIndex((item) => item.file_uri === file.file_uri) === index);
  if (attachments.length > (master.attachments || []).length) patch.attachments = attachments;

  return patch;
}

/**
 * Conserva la ficha `master`: completa sus datos vacíos con los de las fichas
 * repetidas, reasigna los registros vinculados y elimina las repetidas.
 */
export async function mergeDuplicates(entityName, master, duplicates) {
  const ids = duplicates.map((record) => record.id);
  if (!master?.id || ids.length === 0) return { moved: 0 };

  const patch = buildMergedPatch(master, duplicates);
  if (Object.keys(patch).length) {
    await base44.entities[entityName].update(master.id, patch);
  }

  for (const relation of RELATIONS[entityName] || []) {
    await base44.entities[relation.entity].updateMany(
      { [relation.field]: { $in: ids } },
      { $set: { [relation.field]: master.id } }
    );
  }

  await base44.entities[entityName].deleteMany({ id: { $in: ids } });

  return { deleted: ids.length };
}