import {
  getIotAlertIdFromPayload,
  getIotAlertRoute,
  isIotAlertNotification,
} from "../alertNotification";

describe("alertNotification", () => {
  it("uses referenceId before other alert ids", () => {
    expect(
      getIotAlertIdFromPayload({
        referenceId: "ref-alert",
        alertEventId: "event-alert",
        alertId: "legacy-alert",
      }),
    ).toBe("ref-alert");
  });

  it("uses alertEventId when referenceId is missing", () => {
    expect(
      getIotAlertIdFromPayload({
        alertEventId: "event-alert",
        alertId: "legacy-alert",
      }),
    ).toBe("event-alert");
  });

  it("uses alertId when referenceId and alertEventId are missing", () => {
    expect(getIotAlertIdFromPayload({ alertId: "legacy-alert" })).toBe(
      "legacy-alert",
    );
  });

  it("returns null for empty payload or blank ids", () => {
    expect(getIotAlertIdFromPayload(null)).toBeNull();
    expect(getIotAlertIdFromPayload({ referenceId: " ", alertEventId: "" })).toBeNull();
  });

  it("recognizes IOT_ALERT payloads", () => {
    expect(
      isIotAlertNotification({
        type: "IOT_ALERT",
        alertEventId: "event-alert",
      }),
    ).toBe(true);
  });

  it("builds the alert detail route", () => {
    expect(getIotAlertRoute({ alertEventId: "event-alert" })).toBe(
      "/(main)/iot/alerts/event-alert",
    );
  });
});
