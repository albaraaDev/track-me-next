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
  trackerStatusSchema,
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

const moveItem = <T,>(input: T[], fromIndex: number, toIndex: number): T[] => {
  if (fromIndex === toIndex) return [...input];
  const next = [...input];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
};

const sanitizeLegacyStatusCells = (input: Partial<AppData>): Partial<AppData> => {
  if (!input.projects) return input;
  const projects = input.projects.map((project) => {
    if (!project || !Array.isArray(project.sections)) return project;
    return {
      ...project,
      sections: project.sections.map((section) => {
        if (!section || !Array.isArray(section.trackers)) return section;
        return {
          ...section,
          trackers: section.trackers.map((tracker) => {
            if (!tracker || tracker.type !== "status" || !tracker.cells) return tracker;
            const cells = tracker.cells as Record<
              string,
              Record<string, { status: string; note?: string; updatedAt: string }>
            >;
            const nextCells: typeof cells = {};
            Object.entries(cells).forEach(([itemId, dayMap]) => {
              if (!dayMap) return;
              const nextDayMap: typeof dayMap = {};
              Object.entries(dayMap).forEach(([dateKey, cell]) => {
                if (!cell) return;
                if (cell.status === "reset") {
                  return;
                }
                nextDayMap[dateKey] = cell;
              });
              if (Object.keys(nextDayMap).length > 0) {
                nextCells[itemId] = nextDayMap;
              }
            });
            return trackerStatusSchema.parse({
              ...tracker,
              cells: nextCells,
            });
          }),
        };
      }),
    };
  });

  return {
    ...input,
    projects,
  };
};

type AppActions = {
  hydrate: (payload: AppData) => void;
  reset: () => void;
  setProfile: (input: Partial<AppData["profile"]>) => void;
  markOnboardingComplete: () => void;
  setFilters: (payload: Partial<FilterState>) => void;
  resetFilters: () => void;
  toggleFilterProject: (projectId: string) => void;
  toggleFilterSection: (projectId: string, sectionId: string) => void;
  setFilterRange: (from: string | null, to?: string | null) => void;
  setTimeframe: (timeframe: FilterState["timeframe"]) => void;
  setIncludeOpenEnded: (value: boolean) => void;
  setLastBackupAt: (isoString: string | null) => void;
  addProject: (project: Project) => void;
  reorderProjects: (projectId: string, targetIndex: number) => void;
  updateProject: (projectId: string, payload: Partial<Project>) => void;
  removeProject: (projectId: string) => void;
  addSection: (projectId: string, section: Section) => void;
  reorderSections: (projectId: string, sectionId: string, targetIndex: number) => void;
  updateSection: (projectId: string, sectionId: string, payload: Partial<Section>) => void;
  removeSection: (projectId: string, sectionId: string) => void;
  addTracker: (projectId: string, sectionId: string, tracker: Tracker) => void;
  reorderTrackers: (
    projectId: string,
    sectionId: string,
    trackerId: string,
    targetIndex: number,
  ) => void;
  updateTracker: (
    projectId: string,
    sectionId: string,
    trackerId: string,
    payload: Partial<Tracker>,
  ) => void;
  removeTracker: (projectId: string, sectionId: string, trackerId: string) => void;
  markHydrated: () => void;
};

export type AppStore = AppData & { actions: AppActions; hasHydrated: boolean };

const initialState = createInitialAppData();

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      hasHydrated: false,
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
            hasHydrated: true,
          }));
        },
        reset: () =>
          set((state) => ({
            ...createInitialAppData(),
            actions: state.actions,
            hasHydrated: true,
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
        setTimeframe: (timeframe) =>
          set((state) => ({
            filters: {
              ...state.filters,
              timeframe,
              customRange: timeframe !== "custom" ? undefined : state.filters.customRange,
            },
          })),
        setIncludeOpenEnded: (value) =>
          set((state) => ({
            filters: {
              ...state.filters,
              includeOpenEnded: value,
            },
          })),
        toggleFilterProject: (projectId) =>
          set((state) => {
            const current = new Set(state.filters.projectIds ?? []);
            if (current.has(projectId)) {
              current.delete(projectId);
            } else {
              current.add(projectId);
            }
            return {
              filters: {
                ...state.filters,
                projectIds: Array.from(current),
              },
            };
          }),
        toggleFilterSection: (projectId, sectionId) =>
          set((state) => {
            const current = new Set(
              (state.filters.sectionIds ?? []).map(
                (entry) => `${entry.projectId}::${entry.sectionId}`,
              ),
            );
            const key = `${projectId}::${sectionId}`;
            if (current.has(key)) {
              current.delete(key);
            } else {
              current.add(key);
            }
            return {
              filters: {
                ...state.filters,
                sectionIds: Array.from(current).map((entry) => {
                  const [projId, sectId] = entry.split('::');
                  return { projectId: projId, sectionId: sectId };
                }),
              },
            };
          }),
        setFilterRange: (from, to) =>
          set((state) => ({
            filters: {
              ...state.filters,
              customRange:
                from && from.trim()
                  ? {
                      from,
                      to: to?.trim() || null,
                    }
                  : undefined,
            },
          })),
        resetFilters: () =>
          set((state) => ({
            filters: {
              searchTerm: "",
              timeframe: "month",
              includeOpenEnded: true,
              projectIds: [],
              sectionIds: [],
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
        reorderProjects: (projectId, targetIndex) =>
          set((state) => {
            const currentIndex = state.projects.findIndex((project) => project.id === projectId);
            if (currentIndex === -1 || targetIndex < 0 || targetIndex >= state.projects.length) {
              return {};
            }
            const timestamp = now();
            const nextProjects = moveItem(state.projects, currentIndex, targetIndex);
            const movedProject = nextProjects[targetIndex];
            nextProjects[targetIndex] = {
              ...movedProject,
              updatedAt: timestamp,
            };
            return {
              projects: nextProjects,
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
        reorderSections: (projectId, sectionId, targetIndex) =>
          set((state) => ({
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              const currentIndex = project.sections.findIndex(
                (section) => section.id === sectionId,
              );
              if (
                currentIndex === -1 ||
                targetIndex < 0 ||
                targetIndex >= project.sections.length
              ) {
                return project;
              }
              const timestamp = now();
              const nextSections = moveItem(project.sections, currentIndex, targetIndex);
              nextSections[targetIndex] = {
                ...nextSections[targetIndex],
                updatedAt: timestamp,
              };
              return {
                ...project,
                sections: nextSections,
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
        reorderTrackers: (projectId, sectionId, trackerId, targetIndex) =>
          set((state) => ({
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              return {
                ...project,
                sections: project.sections.map((section) => {
                  if (section.id !== sectionId) return section;
                  const currentIndex = section.trackers.findIndex(
                    (tracker) => tracker.id === trackerId,
                  );
                  if (
                    currentIndex === -1 ||
                    targetIndex < 0 ||
                    targetIndex >= section.trackers.length
                  ) {
                    return section;
                  }
                  const timestamp = now();
                  const nextTrackers = moveItem(section.trackers, currentIndex, targetIndex);
                  nextTrackers[targetIndex] = {
                    ...nextTrackers[targetIndex],
                    updatedAt: timestamp,
                  } as Tracker;
                  return {
                    ...section,
                    trackers: nextTrackers,
                    updatedAt: timestamp,
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
        markHydrated: () => set(() => ({ hasHydrated: true })),
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
        const upgraded = sanitizeLegacyStatusCells(baseState);
        const parsed = appDataSchema.safeParse({
          ...upgraded,
          version: APP_DATA_VERSION,
        });
        if (parsed.success) {
          return parsed.data;
        }
        console.warn("فشل في ترحيل نسخة البيانات، سيتم استخدام الإعدادات المبدئية.");
        return initialState;
      },
      skipHydration: true,
    },
  ),
);

export const useAppActions = () => useAppStore((state) => state.actions);
