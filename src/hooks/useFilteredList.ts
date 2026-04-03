import { useMemo } from "react";

type UseFilteredListOptions<T> = {
  items: T[];
  searchQuery: string;
  fields: ((item: T) => string | number | null | undefined)[];
};

export function useFilteredList<T>({
  items,
  searchQuery,
  fields,
}: UseFilteredListOptions<T>): T[] {
  return useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    if (!normalizedSearch) return items;

    return items.filter((item) =>
      fields.some((getter) => {
        const value = getter(item);
        if (value == null) return false;
        return String(value).toLowerCase().includes(normalizedSearch);
      }),
    );
  }, [items, searchQuery, fields]);
}
