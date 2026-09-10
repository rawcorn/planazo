import { z } from 'zod';

const schema = z.object({
  url: z.string().url()
});

const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const res = schema.safeParse({ url: dataUri });
console.log(res.success ? 'SUCCESS' : 'FAILED: ' + res.error.issues[0].message);
