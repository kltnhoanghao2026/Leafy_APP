import { useEffect, useState } from "react";

type HasId = { id: string };

type UsePaginatedListOptions<T extends HasId> = {
  data: T[] | undefined;
  page: number;
};

export function usePaginatedList<T extends HasId>({
  data,
  page,
}: UsePaginatedListOptions<T>) {
  const [cache, setCache] = useState<T[]>([]);

  useEffect(() => {
    const incomingItems = data ?? [];

    if (page === 0) {
      setCache(incomingItems);
      return;
    }

    setCache((previous) => {
      const mapById = new Map(previous.map((item) => [item.id, item]));
      for (const item of incomingItems) {
        mapById.set(item.id, item);
      }
      return Array.from(mapById.values());
    });
  }, [data, page]);

  const resetCache = () => setCache([]);

  return { items: cache, setCache, resetCache };
}
