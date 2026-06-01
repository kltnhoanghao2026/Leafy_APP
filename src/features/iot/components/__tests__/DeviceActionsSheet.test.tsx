import { fireEvent, render, screen } from "@testing-library/react-native";

import { initializeI18n } from "@/src/i18n";
import { DeviceActionsSheet } from "../DeviceActionsSheet";

describe("DeviceActionsSheet", () => {
  beforeAll(async () => {
    await initializeI18n();
  });

  it("shows friendly actions and calls callbacks", () => {
    const onEdit = jest.fn();
    const onRelease = jest.fn();

    render(
      <DeviceActionsSheet
        deviceLabel="Greenhouse camera"
        onClose={jest.fn()}
        onEdit={onEdit}
        onRelease={onRelease}
        visible
      />,
    );

    expect(screen.getByText("Greenhouse camera")).toBeTruthy();
    expect(screen.getByText("Edit device")).toBeTruthy();
    expect(screen.getByText("Release device")).toBeTruthy();

    fireEvent.press(screen.getByText("Edit device"));
    fireEvent.press(screen.getByText("Release device"));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onRelease).toHaveBeenCalledTimes(1);
  });
});
