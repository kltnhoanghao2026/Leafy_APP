import { parseDeviceQrPayload } from "../qrPayload";

const t = (key: string) => {
  const messages: Record<string, string> = {
    "iot.devices.onboarding.qrEmpty": "invalid",
    "iot.devices.onboarding.qrInvalid": "invalid",
    "iot.devices.onboarding.qrInvalidJson": "invalid json",
    "iot.devices.onboarding.qrNotLeafyDevice": "not leafy",
    "iot.devices.onboarding.qrUnsupportedVersion": "unsupported version",
    "iot.devices.onboarding.qrMissingIdentity": "missing identity",
  };
  return messages[key] ?? key;
};

describe("parseDeviceQrPayload", () => {
  it("accepts legacy payloads", () => {
    const result = parseDeviceQrPayload(
      JSON.stringify({
        deviceUid: " leafy-prototype-001 ",
        deviceCode: " LEAFY-PROTO-001 ",
        deviceType: " ESP32_CAM_SENSOR ",
      }),
      t,
    );

    expect(result).toEqual({
      ok: true,
      payload: {
        deviceUid: "leafy-prototype-001",
        deviceCode: "LEAFY-PROTO-001",
        deviceType: "ESP32_CAM_SENSOR",
      },
    });
  });

  it("accepts Leafy QR v1 payloads and strips unexpected fields", () => {
    const result = parseDeviceQrPayload(
      JSON.stringify({
        type: "LEAFY_IOT_DEVICE",
        version: 1,
        deviceUid: "leafy-prototype-001",
        deviceCode: "LEAFY-PROTO-001",
        deviceType: "ESP32_CAM_SENSOR",
        model: "Leafy IoT Module V1",
        firmwareVersion: "leafy-esp32-0.1.0",
        setupApSsid: "Leafy-Setup-YPE001",
        setupPortalUrl: "http://192.168.4.1",
        wifiPass: "secret",
        mqttPass: "secret",
      }),
      t,
    );

    expect(result).toEqual({
      ok: true,
      payload: {
        deviceUid: "leafy-prototype-001",
        deviceCode: "LEAFY-PROTO-001",
        deviceType: "ESP32_CAM_SENSOR",
        model: "Leafy IoT Module V1",
        firmwareVersion: "leafy-esp32-0.1.0",
        setupApSsid: "Leafy-Setup-YPE001",
        setupPortalUrl: "http://192.168.4.1",
      },
    });

    if (result.ok) {
      expect(result.payload).not.toHaveProperty("wifiPass");
      expect(result.payload).not.toHaveProperty("mqttPass");
    }
  });

  it("rejects unsupported type and version", () => {
    expect(
      parseDeviceQrPayload(
        JSON.stringify({
          type: "OTHER",
          version: 1,
          deviceUid: "uid",
          deviceCode: "code",
          deviceType: "type",
        }),
        t,
      ),
    ).toEqual({ ok: false, error: "not leafy" });

    expect(
      parseDeviceQrPayload(
        JSON.stringify({
          type: "LEAFY_IOT_DEVICE",
          version: 2,
          deviceUid: "uid",
          deviceCode: "code",
          deviceType: "type",
        }),
        t,
      ),
    ).toEqual({ ok: false, error: "unsupported version" });
  });

  it("rejects missing identity fields", () => {
    expect(parseDeviceQrPayload(JSON.stringify({ deviceUid: "uid" }), t)).toEqual({
      ok: false,
      error: "missing identity",
    });
  });
});
