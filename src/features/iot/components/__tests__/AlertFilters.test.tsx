import { fireEvent, render, screen } from "@testing-library/react-native";

import { initializeI18n } from "@/src/i18n";
import { AlertFilters } from "../AlertFilters";

describe("AlertFilters", () => {
  beforeAll(async () => {
    await initializeI18n();
  });

  const baseProps = {
    timeRange: "D7" as const,
    devices: [
      {
        id: "device-db-id-123",
        deviceUid: "leafy-prototype-001",
        deviceCode: "ESP32-001",
        name: "Greenhouse 1",
      },
    ],
    farms: [
      { id: "farm-db-id-123", name: "North Farm", addressLine: "Da Lat" },
    ],
    zones: [
      { id: "zone-db-id-123", zoneName: "Tomato zone", cropType: "Tomato" },
    ],
  };

  it("uses picker labels and keeps raw IDs out of the main filter UI", () => {
    render(<AlertFilters {...baseProps} onChange={jest.fn()} />);

    expect(screen.getByText("Choose or search a device")).toBeTruthy();
    expect(screen.getByText("Choose or search a farm")).toBeTruthy();
    expect(screen.getByText("Choose or search a zone")).toBeTruthy();
    expect(screen.queryByText("device-db-id-123")).toBeNull();
    expect(screen.queryByText("zone-db-id-123")).toBeNull();
    expect(screen.queryByText("farm-db-id-123")).toBeNull();
    expect(
      screen.queryByPlaceholderText("Enter device identifier manually"),
    ).toBeNull();
  });

  it("submits raw IDs through filter state when picker options are selected", () => {
    const onChange = jest.fn();
    render(<AlertFilters {...baseProps} onChange={onChange} />);

    fireEvent.press(screen.getByText("Choose or search a device"));
    fireEvent.press(screen.getByText("Greenhouse 1"));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ deviceId: "device-db-id-123" }),
    );

    fireEvent.press(screen.getByText("Choose or search a zone"));
    fireEvent.press(screen.getByText("Tomato zone"));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ zoneId: "zone-db-id-123" }),
    );

    fireEvent.press(screen.getByText("Choose or search a farm"));
    fireEvent.press(screen.getByText("North Farm"));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ farmPlotId: "farm-db-id-123", zoneId: "" }),
    );
  });

  it("keeps manual technical inputs behind advanced filters", () => {
    render(<AlertFilters {...baseProps} onChange={jest.fn()} />);

    fireEvent.press(screen.getByText("Advanced filters"));

    expect(
      screen.getByPlaceholderText("Enter device identifier manually"),
    ).toBeTruthy();
    expect(
      screen.getByPlaceholderText("Enter zone identifier manually"),
    ).toBeTruthy();
  });
});
