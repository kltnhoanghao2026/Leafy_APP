import { addDays, format, isValid, parseISO } from "date-fns";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const toNonNegativeInt = (value: string): number | undefined => {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return undefined;
  return parsed;
};

export const parseDateOnly = (value: string): Date | undefined => {
  const trimmed = value?.trim();
  if (!trimmed || !DATE_ONLY_PATTERN.test(trimmed)) {
    return undefined;
  }
  const parsed = parseISO(trimmed);
  return isValid(parsed) ? parsed : undefined;
};

export type ScheduleDateRange = {
  startDate?: string;
  endDate?: string;
};

export const resolveScheduleDateRange = (
  event: {
    calculatedStartDate: string;
    calculatedEndDate: string;
    daysFromNow: string;
    durationDays: string;
  },
  baseDate: Date,
): ScheduleDateRange => {
  const explicitStart = parseDateOnly(event.calculatedStartDate);
  const explicitEnd = parseDateOnly(event.calculatedEndDate);
  const daysFromNow = toNonNegativeInt(event.daysFromNow);
  const durationDays = toNonNegativeInt(event.durationDays);

  const start =
    explicitStart ??
    (daysFromNow !== undefined ? addDays(baseDate, daysFromNow) : undefined);

  if (!start) {
    return {};
  }

  const computedEnd =
    explicitEnd ??
    (durationDays && durationDays > 0
      ? addDays(start, durationDays - 1)
      : start);

  const safeEnd = computedEnd < start ? start : computedEnd;

  return {
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(safeEnd, "yyyy-MM-dd"),
  };
};

export const dateInRange = (date: string, startDate: string, endDate: string) =>
  date >= startDate && date <= endDate;
