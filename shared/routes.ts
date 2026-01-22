import { z } from 'zod';
import { 
  estimateRequestSchema, 
  estimateResponseSchema, 
  cities, 
  transportModes 
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  estimate: {
    calculate: {
      method: 'POST' as const,
      path: '/api/v1/estimate',
      input: estimateRequestSchema,
      responses: {
        200: estimateResponseSchema,
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
  config: {
    getCities: {
      method: 'GET' as const,
      path: '/api/v1/cities',
      responses: {
        200: z.array(z.custom<typeof cities.$inferSelect>()),
      },
    },
    getModes: {
      method: 'GET' as const,
      path: '/api/v1/transport-modes',
      responses: {
        200: z.array(z.custom<typeof transportModes.$inferSelect>()),
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
