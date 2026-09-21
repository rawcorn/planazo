import { z } from 'zod'; const schema = z.object({ instagram: z.string().optional().or(z.literal('')) }); console.log(schema.safeParse({ instagram: 'testig' }));
