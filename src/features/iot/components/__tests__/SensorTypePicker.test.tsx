import { fireEvent, render, screen } from "@testing-library/react-native";

import { initializeI18n } from "@/src/i18n";
import { SensorTypePicker } from "../SensorTypePicker";

describe("SensorTypePicker", () => {
  beforeAll(async () => {
    await initializeI18n();
  });

  it("shows localized sensor labels and submits raw sensor codes", () => {
    const onChange = jest.fn();
    render(<SensorTypePicker value={null} onChange={onChange} />);

    expect(screen.getByText("Air temperature")).toBeTruthy();
    expect(screen.getByText("Air humidity")).toBeTruthy();
    expect(screen.getByText("Soil moisture")).toBeTruthy();
    expect(screen.getByText("Light intensity")).toBeTruthy();
    expect(screen.queryByText("AIR_TEMP")).toBeNull();

    fireEvent.press(screen.getByText("Air temperature"));
    expect(onChange).toHaveBeenCalledWith("AIR_TEMP");
  });
});
