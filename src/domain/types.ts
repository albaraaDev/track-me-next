import { z } from "zod";

export const trackerStatusValueSchema = z.enum(["done", "partial", "missed"]);
export type TrackerStatus = z.infer<typeof trackerStatusValueSchema>;

export const cadencePresetSchema = z.enum(["week", "two-weeks", "month", "custom"]);
export type CadencePreset = z.infer<typeof cadencePresetSchema>;

export const trackerBaseSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional().default(""),
  icon: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
  cadence: cadencePresetSchema,
  activeWeekdays: z.array(z.number().int().min(0).max(6)).min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const trackerStatusCellSchema = z.object({
  status: trackerStatusValueSchema,
  note: z.string().optional(),
  updatedAt: z.string(),
});

export const trackerStatusSchema = trackerBaseSchema.extend({
  type: z.literal("status"),
  items: z.array(
    z.object({
      id: z.string(),
      label: z.string().min(1),
      createdAt: z.string(),
    }),
  ),
  cells: z.record(z.string(), z.record(z.string(), trackerStatusCellSchema)).default({}),
});

export const trackerNoteCellSchema = z.object({
  note: z.string().optional(),
  updatedAt: z.string(),
});

export const trackerNotesSchema = trackerBaseSchema.extend({
  type: z.literal("notes"),
  items: z.array(
    z.object({
      id: z.string(),
      label: z.string().min(1),
      createdAt: z.string(),
    }),
  ),
  cells: z.record(z.string(), z.record(z.string(), trackerNoteCellSchema)).default({}),
});

export const trackerSchema = z.discriminatedUnion("type", [trackerStatusSchema, trackerNotesSchema]);
export type Tracker = z.infer<typeof trackerSchema>;

export const sectionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional().default(""),
  icon: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
  trackers: z.array(trackerSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Section = z.infer<typeof sectionSchema>;

export const projectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional().default(""),
  icon: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
  sections: z.array(sectionSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Project = z.infer<typeof projectSchema>;

export const userProfileSchema = z.object({
  displayName: z.string().min(1),
  avatarId: z.string().default("avatar-01"),
  avatarColor: z.string().default("#38bdf8"),
  backgroundId: z.string().default("glass-01"),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

export const timeframeFilterSchema = z.enum(["week", "two-weeks", "month", "custom", "all"]);
export type TimeframeFilter = z.infer<typeof timeframeFilterSchema>;

export const filterStateSchema = z.object({
  searchTerm: z.string().default(""),
  timeframe: timeframeFilterSchema.default("month"),
  includeOpenEnded: z.boolean().default(true),
  customRange: z
    .object({
      from: z.string(),
      to: z.string().nullable().optional(),
    })
    .optional()
    .nullable(),
  projectIds: z.array(z.string()).default([]),
  sectionIds: z
    .array(
      z.object({
        projectId: z.string(),
        sectionId: z.string(),
      }),
    )
    .default([]),
});
export type FilterState = z.infer<typeof filterStateSchema>;

export const appDataSchema = z.object({
  version: z.number().int(),
  profile: userProfileSchema,
  projects: z.array(projectSchema),
  filters: filterStateSchema,
  onboardingCompleted: z.boolean(),
  lastBackupAt: z.string().nullable(),
});
export type AppData = z.infer<typeof appDataSchema>;

export const APP_DATA_VERSION = 2;

export function createInitialProfile(): UserProfile {
  const now = new Date().toISOString();
  return {
    displayName: "صديقي",
    avatarId: "avatar-01",
    avatarColor: "#38bdf8",
    backgroundId: "glass-01",
    createdAt: now,
    updatedAt: now,
  };
}

export function createInitialAppData(): AppData {
  return {
    version: APP_DATA_VERSION,
    profile: createInitialProfile(),
    projects: [],
    filters: {
      searchTerm: "",
      timeframe: "month",
      includeOpenEnded: true,
      projectIds: [],
      sectionIds: [],
    },
    onboardingCompleted: false,
    lastBackupAt: null,
  };
}
