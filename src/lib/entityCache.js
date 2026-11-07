const TTL_MS = 12000;

// key -> { time, promise }
const store = new Map();

/**
 * Devuelve el resultado cacheado de una lectura durante unos segundos.
 * Si hay una petición idéntica en curso, se comparte en lugar de duplicarla.
 */
export function cachedRead(key, run) {
  const hit = store.get(key);
  if (hit && Date.now() - hit.time < TTL_MS) return hit.promise;

  const promise = Promise.resolve().then(run);
  store.set(key, { time: Date.now(), promise });
  promise.catch(() => store.delete(key));
  return promise;
}

export function invalidateEntity(entityName) {
  const prefix = `${entityName}|`;
  for (const key of [...store.keys()]) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export function invalidateAll() {
  store.clear();
}