"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  APP_DATA_VERSION,
  AppData,
  FilterState,
  Project,
  Section,
  Tracker,
  appDataSchema,
  createInitialAppData,
  filterStateSchema,
  projectSchema,
  sectionSchema,
  trackerSchema,
  userProfileSchema,
} from "@/domain/types";
import { createPersistStorage, STORAGE_KEY } from "@/lib/storage";

const now = () => new Date().toISOString();

type AppActions = {
  hydrate: (payload: AppData) => void;
  reset: () => void;
  setProfile: (input: Partial<AppData["profile"]>) => void;
  markOnboardingComplete: () => void;
  setFilters: (payload: Partial<FilterState>) => void;
  resetFilters: () => void;
  setLastBackupAt: (isoString: string | null) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, payload: Partial<Project>) => void;
  removeProject: (projectId: string) => void;
  addSection: (projectId: string, section: Section) => void;
  updateSection: (projectId: string, sectionId: string, payload: Partial<Section>) => void;
  removeSection: (projectId: string, sectionId: string) => void;
  addTracker: (projectId: string, sectionId: string, tracker: Tracker) => void;
  updateTracker: (
    projectId: string,
    sectionId: string,
    trackerId: string,
    payload: Partial<Tracker>,
  ) => void;
  removeTracker: (projectId: string, sectionId: string, trackerId: string) => void;
};

export type AppStore = AppData & { actions: AppActions };

const initialState = createInitialAppData();

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      actions: {
        hydrate: (payload) => {
          const parsed = appDataSchema.safeParse(payload);
          if (!parsed.success) {
            console.error("فشل استيراد البيانات:", parsed.error);
            return;
          }
          set((state) => ({
            ...parsed.data,
            actions: state.actions,
          }));
        },
        reset: () =>
          set((state) => ({
            ...createInitialAppData(),
            actions: state.actions,
          })),
        setProfile: (input) =>
          set((state) => ({
            profile: {
              ...state.profile,
              ...userProfileSchema.partial().parse(input),
              updatedAt: now(),
            },
          })),
        markOnboardingComplete: () =>
          set(() => ({
            onboardingCompleted: true,
          })),
        setFilters: (payload) =>
          set((state) => ({
            filters: {
              ...state.filters,
              ...filterStateSchema
                .partial()
                .parse(payload),
            },
          })),
        resetFilters: () =>
          set((state) => ({
            filters: {
              searchTerm: "",
              timeframe: "month",
              includeOpenEnded: true,
            },
          })),
        setLastBackupAt: (isoString) => set(() => ({ lastBackupAt: isoString })),
        addProject: (project) =>
          set((state) => {
            const timestamp = now();
            const next: Project = projectSchema.parse({
              ...project,
              sections: project.sections ?? [],
              createdAt: project.createdAt ?? timestamp,
              updatedAt: timestamp,
            });
            return {
              projects: [...state.projects, next],
            };
          }),
        updateProject: (projectId, payload) =>
          set((state) => ({
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              return projectSchema.parse({
                ...project,
                ...payload,
                updatedAt: now(),
              });
            }),
          })),
        removeProject: (projectId) =>
          set((state) => ({
            projects: state.projects.filter((project) => project.id !== projectId),
          })),
        addSection: (projectId, section) =>
          set((state) => ({
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              const timestamp = now();
              const nextSection = sectionSchema.parse({
                ...section,
                trackers: section.trackers ?? [],
                createdAt: section.createdAt ?? timestamp,
                updatedAt: timestamp,
              });
              return {
                ...project,
                sections: [...project.sections, nextSection],
                updatedAt: timestamp,
              };
            }),
          })),
        updateSection: (projectId, sectionId, payload) =>
          set((state) => ({
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              return {
                ...project,
                sections: project.sections.map((section) => {
                  if (section.id !== sectionId) return section;
                  return sectionSchema.parse({
                    ...section,
                    ...payload,
                    updatedAt: now(),
                  });
                }),
                updatedAt: now(),
              };
            }),
          })),
        removeSection: (projectId, sectionId) =>
          set((state) => ({
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              return {
                ...project,
                sections: project.sections.filter((section) => section.id !== sectionId),
                updatedAt: now(),
              };
            }),
          })),
        addTracker: (projectId, sectionId, tracker) =>
          set((state) => ({
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              return {
                ...project,
                sections: project.sections.map((section) => {
                  if (section.id !== sectionId) return section;
                  const timestamp = now();
                  const nextTracker = trackerSchema.parse({
                    ...tracker,
                    createdAt: tracker.createdAt ?? timestamp,
                    updatedAt: timestamp,
                  });
                  return {
                    ...section,
                    trackers: [...section.trackers, nextTracker],
                    updatedAt: timestamp,
                  };
                }),
                updatedAt: now(),
              };
            }),
          })),
        updateTracker: (projectId, sectionId, trackerId, payload) =>
          set((state) => ({
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              return {
                ...project,
                sections: project.sections.map((section) => {
                  if (section.id !== sectionId) return section;
                  return {
                    ...section,
                    trackers: section.trackers.map((tracker) => {
                      if (tracker.id !== trackerId) return tracker;
                      return trackerSchema.parse({
                        ...tracker,
                        ...payload,
                        updatedAt: now(),
                      }) as Tracker;
                    }),
                    updatedAt: now(),
                  };
                }),
                updatedAt: now(),
              };
            }),
          })),
        removeTracker: (projectId, sectionId, trackerId) =>
          set((state) => ({
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              return {
                ...project,
                sections: project.sections.map((section) => {
                  if (section.id !== sectionId) return section;
                  return {
                    ...section,
                    trackers: section.trackers.filter((tracker) => tracker.id !== trackerId),
                    updatedAt: now(),
                  };
                }),
                updatedAt: now(),
              };
            }),
          })),
      },
    }),
    {
      name: STORAGE_KEY,
      version: APP_DATA_VERSION,
      storage: createPersistStorage(),
      partialize: (state) => ({
        version: state.version,
        profile: state.profile,
        projects: state.projects,
        filters: state.filters,
        onboardingCompleted: state.onboardingCompleted,
        lastBackupAt: state.lastBackupAt,
      }),
      migrate: (persistedState) => {
        const baseState = (persistedState ?? {}) as Partial<AppData>;
        const parsed = appDataSchema.safeParse({
          ...baseState,
          version: APP_DATA_VERSION,
        });
        if (parsed.success) {
          return parsed.data;
        }
        console.warn("فشل في ترحيل نسخة البيانات، سيتم استخدام الإعدادات المبدئية.");
        return initialState;
      },
    },
  ),
);

export const useAppActions = () => useAppStore((state) => state.actions);
