"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  APP_DATA_VERSION,
  AppData,
  FilterState,
  Group,
  Project,
  Section,
  SectionView,
  Tracker,
  trackerStatusSchema,
  appDataSchema,
  createInitialAppData,
  filterStateSchema,
  groupSchema,
  projectSchema,
  sectionSchema,
  sectionViewSchema,
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

const detachTrackerFromGroups = (section: Section, trackerId: string) => {
  let changed = false;
  const groups = (section.groups ?? []).map((group) => {
    if (!group.trackerIds.includes(trackerId)) {
      return group;
    }
    changed = true;
    return {
      ...group,
      trackerIds: group.trackerIds.filter((id) => id !== trackerId),
      updatedAt: now(),
    };
  });
  return { groups, changed };
};

const attachTrackerToGroup = (section: Section, trackerId: string, groupId: string | null | undefined) => {
  if (!groupId) {
    return section.groups ?? [];
  }
  return (section.groups ?? []).map((group) => {
    if (group.id !== groupId) {
      return group;
    }
    if (group.trackerIds.includes(trackerId)) {
      return group;
    }
    return {
      ...group,
      trackerIds: [...group.trackerIds, trackerId],
      updatedAt: now(),
    };
  });
};

const sanitizeLegacyStatusCells = (input: Partial<AppData>): Partial<AppData> => {
  if (!input.projects) return input;
  const projects = input.projects.map((project) => {
    if (!project || !Array.isArray(project.sections)) return project;
    return {
      ...project,
      sections: project.sections.map((section) => {
        if (!section || !Array.isArray(section.trackers)) {
          return sectionSchema.parse({
            ...section,
            groups: section?.groups ?? [],
            defaultView: section?.defaultView ?? "trackers",
          });
        }
        const nextTrackers = section.trackers.map((tracker) => {
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
          });
        return sectionSchema.parse({
          ...section,
          trackers: nextTrackers,
          groups: section?.groups ?? [],
          defaultView: section?.defaultView ?? "trackers",
        });
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
  setSectionDefaultView: (projectId: string, sectionId: string, view: SectionView) => void;
  addGroup: (projectId: string, sectionId: string, group: Group) => void;
  updateGroup: (
    projectId: string,
    sectionId: string,
    groupId: string,
    payload: Partial<Group>,
  ) => void;
  removeGroup: (projectId: string, sectionId: string, groupId: string) => void;
  addTracker: (projectId: string, sectionId: string, tracker: Tracker) => void;
  reorderTrackers: (
    projectId: string,
    sectionId: string,
    trackerId: string,
    targetIndex: number,
    context?: { groupId?: string | null },
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
                groups: section.groups ?? [],
                defaultView: section.defaultView ?? "trackers",
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
        setSectionDefaultView: (projectId, sectionId, view) =>
          set((state) => ({
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              const timestamp = now();
              return {
                ...project,
                sections: project.sections.map((section) => {
                  if (section.id !== sectionId) return section;
                  return sectionSchema.parse({
                    ...section,
                    defaultView: sectionViewSchema.parse(view),
                    updatedAt: timestamp,
                  });
                }),
                updatedAt: timestamp,
              };
            }),
          })),
        addGroup: (projectId, sectionId, group) =>
          set((state) => ({
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              return {
                ...project,
                sections: project.sections.map((section) => {
                  if (section.id !== sectionId) return section;
                  const timestamp = now();
                  const nextGroup = groupSchema.parse({
                    ...group,
                    trackerIds: group.trackerIds ?? [],
                    createdAt: group.createdAt ?? timestamp,
                    updatedAt: timestamp,
                  });
                  return sectionSchema.parse({
                    ...section,
                    groups: [...(section.groups ?? []), nextGroup],
                    updatedAt: timestamp,
                  });
                }),
                updatedAt: now(),
              };
            }),
          })),
        updateGroup: (projectId, sectionId, groupId, payload) =>
          set((state) => ({
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              return {
                ...project,
                sections: project.sections.map((section) => {
                  if (section.id !== sectionId) return section;
                  const existingGroups = section.groups ?? [];
                  const targetGroup = existingGroups.find((group) => group.id === groupId);
                  if (!targetGroup) return section;
                  const timestamp = now();
                  const nextTrackerIds = payload.trackerIds
                    ? Array.from(new Set(payload.trackerIds.filter(Boolean)))
                    : targetGroup.trackerIds;
                  const assignedSet = new Set(nextTrackerIds);
                  const groupsWithoutDuplicates = existingGroups.map((group) => {
                    if (group.id === groupId) {
                      return group;
                    }
                    const filtered = group.trackerIds.filter((id) => !assignedSet.has(id));
                    if (filtered.length === group.trackerIds.length) {
                      return group;
                    }
                    return {
                      ...group,
                      trackerIds: filtered,
                      updatedAt: timestamp,
                    };
                  });
                  const nextGroups = groupsWithoutDuplicates.map((group) => {
                    if (group.id !== groupId) return group;
                    return groupSchema.parse({
                      ...group,
                      ...payload,
                      trackerIds: nextTrackerIds,
                      updatedAt: timestamp,
                    });
                  });
                  const nextTrackers = section.trackers.map((tracker) => {
                    if (assignedSet.has(tracker.id)) {
                      return {
                        ...tracker,
                        groupId,
                        updatedAt: timestamp,
                      } as Tracker;
                    }
                    if (tracker.groupId === groupId && !assignedSet.has(tracker.id)) {
                      return {
                        ...tracker,
                        groupId: null,
                        updatedAt: timestamp,
                      } as Tracker;
                    }
                    return tracker;
                  });
                  return sectionSchema.parse({
                    ...section,
                    groups: nextGroups,
                    trackers: nextTrackers,
                    updatedAt: timestamp,
                  });
                }),
                updatedAt: now(),
              };
            }),
          })),
        removeGroup: (projectId, sectionId, groupId) =>
          set((state) => ({
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              return {
                ...project,
                sections: project.sections.map((section) => {
                  if (section.id !== sectionId) return section;
                  const existingGroups = section.groups ?? [];
                  const targetGroup = existingGroups.find((group) => group.id === groupId);
                  if (!targetGroup) return section;
                  const trackerIdSet = new Set(targetGroup.trackerIds);
                  const timestamp = now();
                  return sectionSchema.parse({
                    ...section,
                    groups: existingGroups.filter((group) => group.id !== groupId),
                    trackers: section.trackers.filter((tracker) => tracker.groupId !== groupId && !trackerIdSet.has(tracker.id)),
                    updatedAt: timestamp,
                  });
                }),
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
                  const hasGroup = tracker.groupId
                    ? (section.groups ?? []).some((group) => group.id === tracker.groupId)
                    : false;
                  const targetGroupId = hasGroup ? tracker.groupId : null;
                  const nextTracker = trackerSchema.parse({
                    ...tracker,
                    groupId: targetGroupId,
                    createdAt: tracker.createdAt ?? timestamp,
                    updatedAt: timestamp,
                  });
                  let nextGroups = section.groups ?? [];
                  if (targetGroupId) {
                    nextGroups = attachTrackerToGroup(
                      { ...section, groups: nextGroups },
                      nextTracker.id,
                      targetGroupId,
                    );
                  }
                  return sectionSchema.parse({
                    ...section,
                    trackers: [...section.trackers, nextTracker],
                    groups: nextGroups,
                    updatedAt: timestamp,
                  });
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
                  const timestamp = now();
                  let nextGroups = section.groups ?? [];
                  const nextTrackers = section.trackers.map((tracker) => {
                    if (tracker.id !== trackerId) return tracker;
                    let desiredGroupId: string | null =
                      payload.groupId !== undefined ? payload.groupId ?? null : tracker.groupId ?? null;
                    if (desiredGroupId) {
                      const exists = nextGroups.some((group) => group.id === desiredGroupId);
                      if (!exists) {
                        desiredGroupId = null;
                      }
                    }
                    if ((tracker.groupId ?? null) !== desiredGroupId) {
                      const detach = detachTrackerFromGroups(
                        { ...section, groups: nextGroups } as Section,
                        tracker.id,
                      );
                      nextGroups = detach.groups;
                      if (desiredGroupId) {
                        nextGroups = attachTrackerToGroup(
                          { ...section, groups: nextGroups } as Section,
                          tracker.id,
                          desiredGroupId,
                        );
                      }
                    }
                    return trackerSchema.parse({
                      ...tracker,
                      ...payload,
                      groupId: desiredGroupId,
                      updatedAt: timestamp,
                    }) as Tracker;
                  });
                  return sectionSchema.parse({
                    ...section,
                    trackers: nextTrackers,
                    groups: nextGroups,
                    updatedAt: timestamp,
                  });
                }),
                updatedAt: now(),
              };
            }),
          })),
        reorderTrackers: (projectId, sectionId, trackerId, targetIndex, context) =>
          set((state) => ({
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              return {
                ...project,
                sections: project.sections.map((section) => {
                  if (section.id !== sectionId) return section;
                  const timestamp = now();
                  const groupId = context?.groupId ?? null;
                  if (groupId) {
                    const group = (section.groups ?? []).find((item) => item.id === groupId);
                    if (!group) return section;
                    const currentIndex = group.trackerIds.findIndex((id) => id === trackerId);
                    if (
                      currentIndex === -1 ||
                      targetIndex < 0 ||
                      targetIndex >= group.trackerIds.length
                    ) {
                      return section;
                    }
                    const nextTrackerIds = moveItem(group.trackerIds, currentIndex, targetIndex);
                    const nextGroups = (section.groups ?? []).map((item) => {
                      if (item.id !== groupId) return item;
                      return {
                        ...item,
                        trackerIds: nextTrackerIds,
                        updatedAt: timestamp,
                      };
                    });
                    const nextTrackers = section.trackers.map((tracker) => {
                      if (tracker.id !== trackerId) return tracker;
                      return {
                        ...tracker,
                        updatedAt: timestamp,
                      } as Tracker;
                    });
                    return sectionSchema.parse({
                      ...section,
                      groups: nextGroups,
                      trackers: nextTrackers,
                      updatedAt: timestamp,
                    });
                  }
                  const ungrouped = section.trackers.filter((tracker) => !tracker.groupId);
                  const currentIndex = ungrouped.findIndex((tracker) => tracker.id === trackerId);
                  if (currentIndex === -1 || targetIndex < 0 || targetIndex >= ungrouped.length) {
                    return section;
                  }
                  const nextUngrouped = moveItem(ungrouped, currentIndex, targetIndex).map(
                    (tracker) =>
                      tracker.id === trackerId
                        ? ({
                            ...tracker,
                            updatedAt: timestamp,
                          } as Tracker)
                        : tracker,
                  );
                  let cursor = 0;
                  const nextTrackers = section.trackers.map((tracker) => {
                    if (tracker.groupId) return tracker;
                    const nextTracker = nextUngrouped[cursor];
                    cursor += 1;
                    return nextTracker;
                  });
                  return sectionSchema.parse({
                    ...section,
                    trackers: nextTrackers,
                    updatedAt: timestamp,
                  });
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
                  const timestamp = now();
                  const { groups } = detachTrackerFromGroups(section, trackerId);
                  return sectionSchema.parse({
                    ...section,
                    groups,
                    trackers: section.trackers.filter((tracker) => tracker.id !== trackerId),
                    updatedAt: timestamp,
                  });
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
