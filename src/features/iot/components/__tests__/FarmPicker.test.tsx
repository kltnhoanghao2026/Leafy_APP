import { fireEvent, render, screen } from "@testing-library/react-native";

import { initializeI18n } from "@/src/i18n";
import { FarmPicker } from "../FarmPicker";

describe("FarmPicker", () => {
  beforeAll(async () => {
    await initializeI18n();
  });

  it("renders farm metadata and submits the raw farm ID internally", () => {
    const onChange = jest.fn();
    render(
      <FarmPicker
        farms={[
          { id: "farm-db-id-123", name: "North Farm", addressLine: "Da Lat" },
        ]}
        value={null}
        onChange={onChange}
      />,
    );

    fireEvent.press(screen.getByText("Search farm"));

    expect(screen.getByText("North Farm")).toBeTruthy();
    expect(screen.getByText("Da Lat")).toBeTruthy();
    expect(screen.queryByText("farm-db-id-123")).toBeNull();

    fireEvent.press(screen.getByText("North Farm"));
    expect(onChange).toHaveBeenCalledWith({
      id: "farm-db-id-123",
      label: "North Farm",
    });
  });

  it("uses a friendly fallback when farm metadata is missing", () => {
    render(
      <FarmPicker
        farms={[{ id: "farm-db-id-123" }]}
        value={null}
        onChange={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByText("Search farm"));

    expect(screen.getByText("Unknown farm")).toBeTruthy();
    expect(screen.getByText("No farm metadata")).toBeTruthy();
    expect(screen.queryByText("farm-db-id-123")).toBeNull();
  });
});
