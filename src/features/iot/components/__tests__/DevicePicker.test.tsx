import { fireEvent, render, screen } from "@testing-library/react-native";

import { initializeI18n } from "@/src/i18n";
import { DevicePicker } from "../DevicePicker";

describe("DevicePicker", () => {
  const devices = [
    {
      id: "device-db-id-123",
      deviceUid: "leafy-prototype-001",
      deviceCode: "ESP32-001",
      name: "Greenhouse 1",
    },
  ];

  beforeAll(async () => {
    await initializeI18n();
  });

  it("shows friendly device labels without exposing raw IDs as primary text", () => {
    render(<DevicePicker devices={devices} value={null} onChange={jest.fn()} />);

    expect(screen.getByText("Greenhouse 1")).toBeTruthy();
    expect(screen.getByText("ESP32-001")).toBeTruthy();
    expect(screen.queryByText("device-db-id-123")).toBeNull();
    expect(screen.queryByText("leafy-prototype-001")).toBeNull();
  });

  it("submits deviceUid in deviceUid mode", () => {
    const onChange = jest.fn();
    render(
      <DevicePicker
        devices={devices}
        mode="deviceUid"
        value={null}
        onChange={onChange}
      />,
    );

    fireEvent.press(screen.getByText("Greenhouse 1"));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceUid: "leafy-prototype-001",
        label: "Greenhouse 1",
      }),
    );
  });

  it("submits deviceId in deviceId mode", () => {
    const onChange = jest.fn();
    render(
      <DevicePicker
        devices={devices}
        mode="deviceId"
        value={null}
        onChange={onChange}
      />,
    );

    fireEvent.press(screen.getByText("Greenhouse 1"));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: "device-db-id-123",
      }),
    );
  });
});
