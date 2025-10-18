import * as React from "react";
import { format, isAfter, isBefore, isEqual, startOfDay, subDays } from "date-fns";
import { ar } from "date-fns/locale";
import { FilterState, Project, Section, Tracker } from "@/domain/types";
import { parseAppDate, toAppDateString } from "@/lib/date";
import { useAppStore } from "@/store/app-store";

type DateRange = {
  from: Date | null;
  to: Date | null;
};

type DataBounds = {
  earliest: Date | null;
  latest: Date | null;
};

type StatusSummary = {
  done: number;
  partial: number;
  missed: number;
  total: number;
  completionRate: number | null;
  activeTrackerCount: number;
  topPerformers: Array<{
    trackerId: string;
    title: string;
    rate: number;
    done: number;
    total: number;
    items: Array<{ itemId: string; label: string; done: number; total: number }>;
  }>;
  needsAttention: Array<{
    trackerId: string;
    title: string;
    missed: number;
    total: number;
    items: Array<{ itemId: string; label: string; missed: number; total: number }>;
  }>;
  dailySeries: Array<{ date: string; done: number; partial: number; missed: number }>;
};

type NotesSummary = {
  totalEntries: number;
  recent: Array<{ trackerId: string; trackerTitle: string; itemLabel: string; note: string; date: string }>;
};

export type ProjectMetrics = {
  projectId: string;
  timeframe: {
    label: string;
    from: string | null;
    to: string | null;
  };
  sectionsCount: number;
  trackersCount: number;
  status: StatusSummary;
  notes: NotesSummary;
};

type SectionFilter = Set<string> | null;

const MAX_DAILY_POINTS = 30;
const MAX_RECENT_NOTES = 5;
const MAX_LIST_ITEMS = 3;

const normalizeWithinBounds = (date: Date | null, bounds: DataBounds | null, pickLatest = false) => {
  if (!bounds || !date) return date;
  if (pickLatest && bounds.latest && isAfter(bounds.latest, date)) {
    return bounds.latest;
  }
  if (!pickLatest && bounds.earliest && isBefore(date, bounds.earliest)) {
    return bounds.earliest;
  }
  return date;
};

export function resolveDateRange(
  filters: FilterState,
  bounds: DataBounds | null,
): { range: DateRange; label: string } {
  const today = startOfDay(new Date());
  const referenceBase = bounds?.latest && isAfter(bounds.latest, today) ? bounds.latest : today;
  let from: Date | null = null;
  let to: Date | null = referenceBase;
  let label = "الكل";

  switch (filters.timeframe) {
    case "week":
      from = subDays(referenceBase, 6);
      label = "آخر 7 أيام";
      break;
    case "two-weeks":
      from = subDays(referenceBase, 13);
      label = "آخر 14 يوماً";
      break;
    case "month":
      from = subDays(referenceBase, 29);
      label = "آخر 30 يوماً";
      break;
    case "custom":
      if (filters.customRange?.from) {
        const parsedFrom = parseAppDate(filters.customRange.from);
        if (parsedFrom) {
          from = parsedFrom;
          label = `من ${format(parsedFrom, "d MMM yyyy", { locale: ar })}`;
        }
      }
      if (filters.customRange?.to) {
        const parsedTo = parseAppDate(filters.customRange.to);
        if (parsedTo) {
          to = parsedTo;
          label = from
            ? `${label} إلى ${format(parsedTo, "d MMM yyyy", { locale: ar })}`
            : `حتى ${format(parsedTo, "d MMM yyyy", { locale: ar })}`;
        }
      }
      break;
    case "all":
    default:
      from = null;
      to = bounds?.latest ?? null;
      label = "كل الوقت";
      break;
  }

  if (from) {
    from = normalizeWithinBounds(from, bounds, false);
  }
  if (to) {
    to = normalizeWithinBounds(to, bounds, true);
  }

  return {
    range: { from, to },
    label,
  };
}

const isWithinRange = (isoDate: string, range: DateRange): boolean => {
  const parsed = parseAppDate(isoDate);
  if (!parsed) return false;
  if (range.from && isBefore(parsed, range.from) && !isEqual(parsed, range.from)) {
    return false;
  }
  if (range.to && isAfter(parsed, range.to) && !isEqual(parsed, range.to)) {
    return false;
  }
  return true;
};

const pickSections = (project: Project, filters: FilterState): SectionFilter => {
  const sectionFilters = filters.sectionIds ?? [];
  if (!sectionFilters.length) return null;
  const relevant = sectionFilters.filter((entry) => entry.projectId === project.id);
  if (!relevant.length) return null;
  return new Set(relevant.map((entry) => entry.sectionId));
};

const shouldIncludeSection = (section: Section, filter: SectionFilter): boolean => {
  if (!filter) return true;
  return filter.has(section.id);
};

const shouldIncludeTracker = (filters: FilterState, tracker: Tracker): boolean => {
  if (!filters.includeOpenEnded && !tracker.endDate) {
    return false;
  }
  return true;
};

const summarizeStatusTrackers = (
  project: Project,
  range: DateRange,
  filters: FilterState,
  sectionFilter: SectionFilter,
): StatusSummary => {
  const totals = { done: 0, partial: 0, missed: 0 };
  const daily = new Map<string, { done: number; partial: number; missed: number }>();
  const trackerDone = new Map<
    string,
    {
      title: string;
      done: number;
      missed: number;
      total: number;
      items: Map<string, { label: string; done: number; missed: number; total: number }>;
    }
  >();

  project.sections.forEach((section) => {
    if (!shouldIncludeSection(section, sectionFilter)) return;
    section.trackers.forEach((tracker) => {
      if (tracker.type !== "status") return;
      if (!shouldIncludeTracker(filters, tracker)) return;
      let summary = trackerDone.get(tracker.id);
      if (!summary) {
        summary = {
          title: tracker.title,
          done: 0,
          missed: 0,
          total: 0,
          items: new Map(),
        };
        trackerDone.set(tracker.id, summary);
      }

      Object.entries(tracker.cells ?? {}).forEach(([itemId, dayMap]) => {
        if (!dayMap) return;
        const itemInfo = tracker.items.find((entry) => entry.id === itemId);
        let itemSummary = summary!.items.get(itemId);
        if (!itemSummary) {
          itemSummary = {
            label: itemInfo?.label ?? 'عنصر',
            done: 0,
            missed: 0,
            total: 0,
          };
          summary!.items.set(itemId, itemSummary);
        }
        Object.entries(dayMap).forEach(([dateKey, cell]) => {
          if (!cell) return;
          if (!isWithinRange(dateKey, range)) return;
          totals[cell.status] += 1;
          summary!.total += 1;
          itemSummary!.total += 1;
          if (cell.status === "done") {
            summary!.done += 1;
            itemSummary!.done += 1;
          }
          if (cell.status === "missed") {
            summary!.missed += 1;
            itemSummary!.missed += 1;
          }

          if (!daily.has(dateKey)) {
            daily.set(dateKey, { done: 0, partial: 0, missed: 0 });
          }
          const bucket = daily.get(dateKey)!;
          bucket[cell.status] += 1;
        });
      });
    });
  });

  const totalCells = totals.done + totals.partial + totals.missed;
  const completionRate = totalCells > 0 ? totals.done / totalCells : null;
  const activeTrackerCount = trackerDone.size;

  const topPerformers = Array.from(trackerDone.entries())
    .filter(([, info]) => info.total > 0)
    .map(([trackerId, info]) => ({
      trackerId,
      title: info.title,
      done: info.done,
      total: info.total,
      rate: info.done / info.total,
      items: Array.from(info.items.entries())
        .filter(([, item]) => item.total > 0)
        .map(([itemId, item]) => ({
          itemId,
          label: item.label,
          done: item.done,
          total: item.total,
        }))
        .sort((a, b) => b.done / (b.total || 1) - a.done / (a.total || 1)),
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, MAX_LIST_ITEMS);

  const needsAttention = Array.from(trackerDone.entries())
    .filter(([, info]) => info.missed > 0)
    .map(([trackerId, info]) => ({
      trackerId,
      title: info.title,
      missed: info.missed,
      total: info.total,
      items: Array.from(info.items.entries())
        .filter(([, item]) => item.missed > 0)
        .map(([itemId, item]) => ({
          itemId,
          label: item.label,
          missed: item.missed,
          total: item.total,
        }))
        .sort((a, b) => b.missed - a.missed),
    }))
    .sort((a, b) => b.missed - a.missed)
    .slice(0, MAX_LIST_ITEMS);

  const dailySeries = Array.from(daily.entries())
    .map(([date, counts]) => ({
      date,
      ...counts,
    }))
    .sort((a, b) => {
      const dateA = parseAppDate(a.date)!;
      const dateB = parseAppDate(b.date)!;
      return dateA.getTime() - dateB.getTime();
    });

  const trimmedSeries =
    dailySeries.length > MAX_DAILY_POINTS
      ? dailySeries.slice(dailySeries.length - MAX_DAILY_POINTS)
      : dailySeries;

  return {
    done: totals.done,
    partial: totals.partial,
    missed: totals.missed,
    total: totalCells,
    completionRate,
    activeTrackerCount,
    topPerformers,
    needsAttention,
    dailySeries: trimmedSeries,
  };
};

const summarizeNotes = (
  project: Project,
  range: DateRange,
  filters: FilterState,
  sectionFilter: SectionFilter,
): NotesSummary => {
  const notes: NotesSummary["recent"] = [];
  let totalEntries = 0;

  project.sections.forEach((section) => {
    if (!shouldIncludeSection(section, sectionFilter)) return;
    section.trackers.forEach((tracker) => {
      if (tracker.type !== "notes") return;
      if (!shouldIncludeTracker(filters, tracker)) return;
      Object.entries(tracker.cells ?? {}).forEach(([itemId, dayMap]) => {
        if (!dayMap) return;
        const item = tracker.items.find((entry) => entry.id === itemId);
        Object.entries(dayMap).forEach(([dateKey, cell]) => {
          if (!cell || !cell.note) return;
          if (!isWithinRange(dateKey, range)) return;
          totalEntries += 1;
          notes.push({
            trackerId: tracker.id,
            trackerTitle: tracker.title,
            itemLabel: item?.label ?? "عنصر",
            note: cell.note,
            date: dateKey,
          });
        });
      });
    });
  });

  const recent = notes
    .sort((a, b) => {
      const dateA = parseAppDate(a.date)!;
      const dateB = parseAppDate(b.date)!;
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, MAX_RECENT_NOTES);

  return {
    totalEntries,
    recent,
  };
};

const collectDataBounds = (project: Project): DataBounds => {
  let earliest: Date | null = null;
  let latest: Date | null = null;

  const consider = (value: string | null | undefined) => {
    const parsed = parseAppDate(value ?? undefined);
    if (!parsed) return;
    if (!earliest || isBefore(parsed, earliest)) {
      earliest = parsed;
    }
    if (!latest || isAfter(parsed, latest)) {
      latest = parsed;
    }
  };

  consider(project.startDate);
  consider(project.endDate ?? null);

  project.sections.forEach((section) => {
    consider(section.startDate);
    consider(section.endDate ?? null);
    section.trackers.forEach((tracker) => {
      consider(tracker.startDate);
      consider(tracker.endDate ?? null);
      if (tracker.type === "status" || tracker.type === "notes") {
        Object.values(tracker.cells ?? {}).forEach((dayMap) => {
          Object.keys(dayMap ?? {}).forEach((dateKey) => consider(dateKey));
        });
      }
    });
  });

  return { earliest, latest };
};

export function computeProjectMetrics(project: Project | undefined, filters: FilterState): ProjectMetrics | null {
  if (!project) return null;
  const bounds = collectDataBounds(project);
  const { range, label } = resolveDateRange(filters, bounds);
  const sectionFilter = pickSections(project, filters);
  const status = summarizeStatusTrackers(project, range, filters, sectionFilter);
  const notes = summarizeNotes(project, range, filters, sectionFilter);

  return {
    projectId: project.id,
    timeframe: {
      label,
      from: range.from ? toAppDateString(range.from) : null,
      to: range.to ? toAppDateString(range.to) : null,
    },
    sectionsCount: project.sections.length,
    trackersCount: project.sections.reduce((acc, section) => acc + section.trackers.length, 0),
    status,
    notes,
  };
}

export const useProjectMetrics = (projectId: string): ProjectMetrics | null => {
  return useAppStore(
    React.useCallback((state) => {
      const project = state.projects.find((entry) => entry.id === projectId);
      return computeProjectMetrics(project, state.filters);
    }, [projectId]),
  );
};
