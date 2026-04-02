import { StyleSheet } from "react-native";

export const homeStyles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 32,
  },
  // Weather
  weatherCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  weatherLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  weatherLocation: {
    fontSize: 12,
    marginBottom: 2,
  },
  weatherTemp: {
    fontSize: 17,
    fontWeight: "700" as const,
  },
  weatherRight: {
    alignItems: "flex-end" as const,
  },
  weatherUpdatedLabel: {
    fontSize: 11,
  },
  weatherUpdatedValue: {
    fontSize: 11,
    fontWeight: "600" as const,
    marginTop: 2,
  },
  // Stats grid
  statsGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    paddingHorizontal: 12,
  },
  statCard: {
    width: "47%",
    margin: "1.5%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
    marginBottom: 8,
  },
  statIcon: {
    padding: 8,
    borderRadius: 10,
  },
  statBadge: {
    fontSize: 11,
    fontWeight: "700" as const,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
  // Section
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: "600" as const,
    marginBottom: 12,
  },
  // Map
  mapContainer: {
    borderRadius: 16,
    overflow: "hidden" as const,
    borderWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  mapImage: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  mapBadge: {
    position: "absolute" as const,
    bottom: 12,
    left: 12,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  mapBadgeText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  // Alerts
  alertCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    padding: 14,
    backgroundColor: "rgba(254,242,242,0.9)",
    borderWidth: 1,
    borderColor: "rgba(252,165,165,0.4)",
    borderRadius: 16,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EF4444",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#991B1B",
  },
  alertDesc: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 2,
  },
});
