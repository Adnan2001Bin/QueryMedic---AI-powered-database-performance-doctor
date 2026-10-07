import { z } from 'zod';

export const CreateOrgSchema = z.object({
  name: z.string().min(2),
});

export type CreateOrgInput = z.infer<typeof CreateOrgSchema>;

export const AddMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'ENGINEER', 'VIEWER']).default('VIEWER'),
});

export type AddMemberInput = z.infer<typeof AddMemberSchema>;
