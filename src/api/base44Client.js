import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { cachedRead, invalidateAll, invalidateEntity } from '@/lib/entityCache';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

const client = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  appBaseUrl
});

const READ_METHODS = new Set(['list', 'filter', 'get', 'count', 'aggregate']);
const WRITE_METHODS = new Set([
  'create',
  'bulkCreate',
  'update',
  'updateMany',
  'bulkUpdate',
  'delete',
  'deleteMany',
]);

// Un fallo puntual de conexión no debe romper la pantalla: se reintenta una vez.
const isNetworkError = (error) => /network error|failed to fetch|networkerror/i.test(error?.message || '');

const withRetry = async (run) => {
  try {
    return await run();
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 700));
    return run();
  }
};

const wrapEntity = (entityName, entity) =>
  new Proxy(entity, {
    get(target, prop) {
      const value = target[prop];
      if (typeof value !== 'function') return value;
      const method = String(prop);

      if (READ_METHODS.has(method)) {
        return (...args) => {
          let key;
          try {
            key = `${entityName}|${method}|${JSON.stringify(args)}`;
          } catch {
            return value.apply(target, args);
          }
          return cachedRead(key, () => withRetry(() => value.apply(target, args)));
        };
      }

      if (WRITE_METHODS.has(method)) {
        return (...args) => {
          invalidateEntity(entityName);
          return value.apply(target, args);
        };
      }

      return value.bind(target);
    },
  });

const wrappedEntities = new Map();
const entitiesProxy = new Proxy(client.entities, {
  get(target, prop) {
    const entity = target[prop];
    if (!entity || typeof entity !== 'object' || typeof prop !== 'string') return entity;
    if (!wrappedEntities.has(prop)) wrappedEntities.set(prop, wrapEntity(prop, entity));
    return wrappedEntities.get(prop);
  },
});

// Las funciones de backend pueden modificar cualquier entidad: se invalida todo.
const functionsProxy = new Proxy(client.functions, {
  get(target, prop) {
    const value = target[prop];
    if (typeof value !== 'function') return value;
    if (prop !== 'invoke') return value.bind(target);
    return async (...args) => {
      invalidateAll();
      const result = await value.apply(target, args);
      invalidateAll();
      return result;
    };
  },
});

export const base44 = new Proxy(client, {
  get(target, prop) {
    if (prop === 'entities') return entitiesProxy;
    if (prop === 'functions') return functionsProxy;
    return target[prop];
  },
});