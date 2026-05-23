import { fireEvent, render, screen } from "@testing-library/react-native";

import { initializeI18n } from "@/src/i18n";
import { ZonePicker } from "../ZonePicker";

describe("ZonePicker", () => {
  beforeAll(async () => {
    await initializeI18n();
  });

  it("renders zone metadata and submits the raw zone ID internally", () => {
    const onChange = jest.fn();
    render(
      <ZonePicker
        zones={[{ id: "zone-db-id-123", zoneName: "Tomato zone", cropType: "Tomato" }]}
        value={null}
        onChange={onChange}
      />,
    );

    expect(screen.getByText("Tomato zone")).toBeTruthy();
    expect(screen.getByText("Tomato")).toBeTruthy();
    expect(screen.queryByText("zone-db-id-123")).toBeNull();

    fireEvent.press(screen.getByText("Tomato zone"));
    expect(onChange).toHaveBeenCalledWith({ id: "zone-db-id-123", label: "Tomato zone" });
  });
});
