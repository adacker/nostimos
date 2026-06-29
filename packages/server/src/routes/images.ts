// CONTRACT:S1-API.1.0
// Cover-image upload endpoints, shared by recipes and dishes. The client sends an
// already-compressed image as multipart/form-data; the server validates the type
// and size, writes it under the uploads directory, and stores a served
// "/api/uploads/<file>" path on the entity. (Browser-local mode never calls these
// — it stores images inline as `data:` URLs.)
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, basename } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { notFound, type ApiError } from './http.js';

/** Served URL prefix for uploaded images (under /api so the dev proxy covers it). */
export const UPLOADS_PREFIX = '/api/uploads/';

/** Accepted image content types → file extension. */
const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

interface ImageEntity {
  image: string | null;
}

interface ImageRouteConfig<T extends ImageEntity> {
  /** Collection base path, e.g. '/api/recipes'. */
  basePath: string;
  /** Singular name for 404 messages, e.g. 'recipe'. */
  name: string;
  get: (id: string) => T | undefined;
  setImage: (id: string, image: string | null) => T | undefined;
}

/** Delete the file backing a served "/api/uploads/<file>" url, if it is one. */
export function removeImageFile(uploadsDir: string, image: string | null): void {
  if (!image || !image.startsWith(UPLOADS_PREFIX)) return;
  rmSync(join(uploadsDir, basename(image)), { force: true });
}

/**
 * Register `POST/DELETE {basePath}/:id/image` for one entity type. Replacing a
 * cover removes the previous file; clearing or deleting the entity does too
 * (the latter handled by the owning route module on delete).
 */
export function registerImageRoutes<T extends ImageEntity>(
  app: FastifyInstance,
  uploadsDir: string,
  cfg: ImageRouteConfig<T>,
): void {
  app.post(`${cfg.basePath}/:id/image`, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = cfg.get(id);
    if (!existing) return notFound(reply, cfg.name);

    const data = await req.file();
    if (!data) {
      reply.code(400);
      return { error: 'no image file in request' } satisfies ApiError;
    }
    const ext = EXT[data.mimetype];
    if (!ext) {
      reply.code(415);
      return { error: `unsupported image type: ${data.mimetype}` } satisfies ApiError;
    }
    const buf = await data.toBuffer();
    if (data.file.truncated) {
      reply.code(413);
      return { error: 'image exceeds the size limit' } satisfies ApiError;
    }

    mkdirSync(uploadsDir, { recursive: true });
    const file = `${id}-${randomUUID()}.${ext}`;
    writeFileSync(join(uploadsDir, file), buf);

    removeImageFile(uploadsDir, existing.image); // drop the previous cover, if any
    return cfg.setImage(id, `${UPLOADS_PREFIX}${file}`);
  });

  app.delete(`${cfg.basePath}/:id/image`, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = cfg.get(id);
    if (!existing) return notFound(reply, cfg.name);
    removeImageFile(uploadsDir, existing.image);
    return cfg.setImage(id, null);
  });
}
