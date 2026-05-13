import { useQuery } from "@tanstack/react-query";
import { homeApi } from "../api/home.api";

export const homeKeys = {
  all: ["home"] as const,
  agricultureStats: () => [...homeKeys.all, "agricultureStats"] as const,
};

export const useAgricultureStats = () =>
  useQuery({
    queryKey: homeKeys.agricultureStats(),
    queryFn: homeApi.getAgricultureStats,
  });
