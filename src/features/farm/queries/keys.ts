export const farmKeys = {
  all: () => ["farms"] as const,

  plots: () => [...farmKeys.all(), "plots"] as const,
  plotsByOwner: (ownerProfileId: string) =>
    [...farmKeys.plots(), "owner", ownerProfileId] as const,
  plot: (id: string) => [...farmKeys.plots(), id] as const,

  zones: () => [...farmKeys.all(), "zones"] as const,
  zonesByPlot: (plotId: string) =>
    [...farmKeys.zones(), "plot", plotId] as const,
  zone: (id: string) => [...farmKeys.zones(), id] as const,
};
