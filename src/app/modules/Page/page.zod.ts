import { z } from 'zod';
import { CONTENT, TContent } from './page.constant';

const createOrUpdatePageSchema = z.object({
  body: z.object({
    type: z.enum(Object.values(CONTENT) as [TContent, ...TContent[]], {
      required_error: 'type is required',
    }),
    title: z.string().min(3, 'Title must be at least 3 characters long'),
    content: z.string().min(10, 'Content must be at least 10 characters long'),
  }),
});

export const contentZodValidation = {
  createOrUpdatePageSchema,
};
