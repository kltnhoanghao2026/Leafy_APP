import { fireEvent, render, screen } from "@testing-library/react-native";

import { initializeI18n } from "@/src/i18n";
import { ReleaseDeviceConfirmDialog } from "../ReleaseDeviceConfirmDialog";

describe("ReleaseDeviceConfirmDialog", () => {
  beforeAll(async () => {
    await initializeI18n();
  });

  it("renders warning copy without exposing raw deviceUid", () => {
    render(
      <ReleaseDeviceConfirmDialog
        deviceLabel="Greenhouse camera"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
        visible
      />,
    );

    expect(screen.getByText("Release device?")).toBeTruthy();
    expect(screen.getByText(/Historical data will not be deleted/)).toBeTruthy();
    expect(screen.getByText("Greenhouse camera")).toBeTruthy();
    expect(screen.queryByText("leafy-prototype-001")).toBeNull();
  });

  it("calls confirm when pressing release", () => {
    const onConfirm = jest.fn();

    render(
      <ReleaseDeviceConfirmDialog
        deviceLabel="Greenhouse camera"
        onCancel={jest.fn()}
        onConfirm={onConfirm}
        visible
      />,
    );

    fireEvent.press(screen.getByText("Release device"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("disables buttons while submitting", () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    render(
      <ReleaseDeviceConfirmDialog
        deviceLabel="Greenhouse camera"
        isSubmitting
        onCancel={onCancel}
        onConfirm={onConfirm}
        visible
      />,
    );

    fireEvent.press(screen.getByText("Cancel"));
    fireEvent.press(screen.getByText("Releasing..."));

    expect(onCancel).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
