import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { initializeI18n } from "@/src/i18n";
import type { DeviceResponse } from "../../types";
import { EditDeviceSheet } from "../EditDeviceSheet";

jest.mock("../FarmZonePicker", () => ({
  FarmZonePicker: ({
    onChange,
  }: {
    onChange: (value: { farmPlotId?: string; zoneId?: string }) => void;
  }) => {
    const { Pressable, Text, View } = jest.requireActual("react-native");
    return (
      <View>
        <Pressable onPress={() => onChange({ farmPlotId: "farm-2", zoneId: undefined })}>
          <Text>Set farm</Text>
        </Pressable>
        <Pressable onPress={() => onChange({ farmPlotId: "farm-2", zoneId: "zone-2" })}>
          <Text>Set zone</Text>
        </Pressable>
      </View>
    );
  },
}));

const device: DeviceResponse = {
  id: "device-db-id-123",
  deviceUid: "leafy-prototype-001",
  deviceCode: "ESP32-001",
  deviceName: "Leafy camera",
  deviceType: "ESP32_CAM_SENSOR",
  firmwareVersion: "1.0.0",
  isActive: true,
  status: "ONLINE",
  provisioningStatus: "CLAIMED",
  ownerUserId: "user-1",
  farmPlotId: "farm-1",
  zoneId: "zone-1",
  lastSeenAt: "2026-05-19T08:00:00Z",
};

describe("EditDeviceSheet", () => {
  beforeAll(async () => {
    await initializeI18n();
  });

  it("renders current device name", () => {
    render(
      <EditDeviceSheet
        device={device}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        visible
      />,
    );

    expect(screen.getByDisplayValue("Leafy camera")).toBeTruthy();
  });

  it("validates blank name", () => {
    const onSubmit = jest.fn();
    render(
      <EditDeviceSheet
        device={device}
        onClose={jest.fn()}
        onSubmit={onSubmit}
        visible
      />,
    );

    fireEvent.changeText(screen.getByDisplayValue("Leafy camera"), " ");
    fireEvent.press(screen.getByText("Save changes"));

    expect(screen.getByText("Device name is required.")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits changed metadata without immutable identity fields", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(
      <EditDeviceSheet
        device={device}
        onClose={jest.fn()}
        onSubmit={onSubmit}
        visible
      />,
    );

    fireEvent.changeText(screen.getByDisplayValue("Leafy camera"), "Greenhouse camera");
    fireEvent.press(screen.getByText("Set zone"));
    fireEvent.press(screen.getByText("Save changes"));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        deviceName: "Greenhouse camera",
        farmPlotId: "farm-2",
        zoneId: "zone-2",
      }),
    );

    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("deviceUid");
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("deviceCode");
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("deviceType");
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("ownerUserId");
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("status");
  });
});
