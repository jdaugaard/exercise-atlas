import { z } from 'zod';

const text = z.string().trim().min(1);
const strings = z.array(text).min(1);
const digest = z.string().regex(/^[a-f0-9]{64}$/);

export const ExerciseSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  revision: z.number().int().positive(),
  reviewStatus: z.enum(['draft', 'reviewed', 'retired']),
  reviewedAt: z.iso.datetime().nullable(),
  name: text,
  nameDa: text,
  aliases: strings,
  category: z.literal('Strength'),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  bodyParts: strings,
  movementPattern: text,
  laterality: text,
  equipmentItems: strings,
  grip: text,
  primaryMuscles: strings,
  secondaryMuscles: strings,
  stabilizers: strings,
  description: text,
  setup: strings,
  instructions: strings,
  cues: strings,
  commonMistakes: strings,
  logging: z.strictObject({ basis: text, example: text, note: text }),
  alternatives: strings,
  variantNote: text,
  reviewNotes: strings,
  sources: z.array(z.strictObject({ title: text, url: z.url(), scope: text })).min(1),
  illustration: z.strictObject({
    styleId: z.literal('line-art-v1'),
    mediaId: digest,
    url: z.string().regex(/^\/media\/[a-f0-9]{64}\.png$/),
    left: text,
    right: text,
    alt: text,
    generation: z.strictObject({
      method: z.literal('built-in-image-gen'),
      createdDate: z.iso.date(),
      promptId: text,
      model: z.string().nullable(),
    }),
  }),
}).refine((e) => e.reviewStatus !== 'reviewed' || e.reviewedAt !== null, {
  message: 'Reviewed entries need an explicit review timestamp', path: ['reviewedAt'],
});

export const ManifestSchema = z.strictObject({
  schemaVersion: z.literal('0.1.0'),
  catalogVersion: text,
  title: text,
  description: text,
  createdDate: z.iso.date(),
  styleId: z.literal('line-art-v1'),
  license: z.literal('UNLICENSED'),
  contentNote: text,
  loggingNote: text,
});

export type Exercise = z.infer<typeof ExerciseSchema>;
export type CatalogManifest = z.infer<typeof ManifestSchema>;
export const exerciseJsonSchema = z.toJSONSchema(ExerciseSchema, { unrepresentable: 'throw' });
