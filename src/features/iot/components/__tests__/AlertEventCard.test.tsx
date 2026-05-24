import { fireEvent, render, screen } from "@testing-library/react-native";

import { initializeI18n } from "@/src/i18n";
import { AlertEventCard } from "../AlertEventCard";

describe("AlertEventCard", () => {
  beforeAll(async () => {
    await initializeI18n();
  });

  it("renders display labels instead of raw alert/device/zone identifiers", () => {
    const alert = {
      id: "alert-id-123",
      deviceId: "device-db-id-123",
      zoneId: "zone-db-id-123",
      farmPlotId: "farm-db-id-123",
      severity: "CRITICAL",
      status: "OPEN",
      display: {
        title: "Temperature alert",
        sensorLabel: "Air temperature",
        valueLabel: "42 °C",
        deviceLabel: "Greenhouse 1",
        zoneLabel: "Tomato zone",
        openedAtLabel: "08:30 - just now",
      },
    } as any;
    const onPress = jest.fn();

    render(<AlertEventCard alert={alert} onPress={onPress} />);

    expect(screen.getByText("Temperature alert")).toBeTruthy();
    expect(screen.getByText(/Greenhouse 1/)).toBeTruthy();
    expect(screen.getByText(/Tomato zone/)).toBeTruthy();
    expect(screen.queryByText("alert-id-123")).toBeNull();
    expect(screen.queryByText("device-db-id-123")).toBeNull();
    expect(screen.queryByText("zone-db-id-123")).toBeNull();

    fireEvent.press(screen.getByText("Temperature alert"));
    expect(onPress).toHaveBeenCalledWith(alert);
  });
});
