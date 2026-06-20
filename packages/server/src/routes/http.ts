// CONTRACT:P1-API-PROTOCOL.1.0
// Shared HTTP helpers for Nostimos route modules: a uniform validation +
// error-response shape so every endpoint speaks the same protocol.
import type { FastifyReply } from 'fastify';
import type { ZodTypeAny, z } from 'zod';

/** Uniform error envelope returned by every endpoint on failure. */
export interface ApiError {
  error: string;
  issues?: unknown;
}

/**
 * Validate `data` against `schema`. On success returns the parsed value; on
 * failure sends a 400 with the zod issues and returns undefined so the caller
 * can early-return.
 */
export function parseBody<S extends ZodTypeAny>(
  schema: S,
  data: unknown,
  reply: FastifyReply,
): z.infer<S> | undefined {
  const result = schema.safeParse(data);
  if (!result.success) {
    reply.code(400).send({ error: 'validation failed', issues: result.error.issues } satisfies ApiError);
    return undefined;
  }
  return result.data;
}

/** Send a 404 with the uniform envelope. */
export function notFound(reply: FastifyReply, what = 'resource'): ApiError {
  reply.code(404);
  return { error: `${what} not found` };
}
