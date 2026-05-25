# Mobile Native FCM Setup

## Strategy

- Backend `notification-service` uses Firebase Admin SDK for push delivery.
- Mobile app must register native FCM registration tokens with notification-service.
- Expo Push Tokens are not supported unless backend adds an Expo Push API delivery strategy.
- Expo Go is not supported for this push flow.
- Current mobile token strategy is `expo-notifications.getDevicePushTokenAsync()`, not `getExpoPushTokenAsync()`.

## Current Project Status

| Item | Status | Notes |
| --- | ---: | --- |
| Native device token API | Yes | `src/features/notifications/services/expoPushService.ts` uses `Notifications.getDevicePushTokenAsync()`. |
| Expo push token API | No | No `getExpoPushTokenAsync()` usage was found. |
| Android package | `com.leafy` | Configured in `app.json` under `expo.android.package`. |
| Android Firebase file path | `./google-services.json` | Configured in `app.json` under `expo.android.googleServicesFile`. |
| `google-services.json` present | No | Must be supplied locally or by build/CI secrets before native build. |
| iOS bundle identifier | Not configured | `app.json` currently has no `expo.ios.bundleIdentifier`. |
| `GoogleService-Info.plist` present | No | Required if iOS FCM push is needed. |
| EAS config | Not present | No `eas.json` was found in this workspace. |
| Firebase files in git | Ignored | `.gitignore` already ignores `google-services.json` and `GoogleService-Info.plist`. |

## Android Setup

1. Create an Android app in the Firebase project used by `notification-service`.
2. Set the Firebase Android package name to match Expo:

```text
com.leafy
```

3. Download `google-services.json`.
4. Place it at the Leafy mobile project root:

```text
D:/KLTN/Leafy/Leafy_APP/google-services.json
```

5. Confirm `app.json` points to that file:

```json
{
  "expo": {
    "android": {
      "package": "com.leafy",
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

6. Build and run a native development or production build, not Expo Go:

```bash
npm run android
```

or an EAS build if the team adds `eas.json`.

7. If building through CI/EAS, provide `google-services.json` by secure file injection before build. Do not hardcode or commit the Firebase config file unless the team explicitly decides to version Firebase client config.

## iOS Setup

iOS is not configured in this workspace yet.

If iOS push is required:

1. Choose an iOS bundle identifier and add it to `app.json`:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.leafy"
    }
  }
}
```

Use the actual Apple/Firebase bundle identifier chosen by the team.

2. Create an iOS app in Firebase using the same bundle identifier.
3. Configure APNs in Firebase.
4. Download `GoogleService-Info.plist`.
5. Place it at project root or configure secure build-time injection.
6. Add `expo.ios.googleServicesFile` only after the file strategy is decided.
7. Verify `Notifications.getDevicePushTokenAsync()` returns an FCM-compatible token. If the app only obtains an APNs token, backend Firebase Admin FCM delivery will not work.

Important:

```text
iOS support requires verified FCM-compatible native configuration. If app only obtains APNs token, backend Firebase Admin FCM delivery will not work.
```

## Backend Setup

Backend is already aligned with native FCM delivery.

Required runtime configuration:

```text
FIREBASE_ENABLED=true
FIREBASE_CONFIG_PATH=<path-to-firebase-service-account-json>
NOTIFICATION_PUSH_ENABLED=true
KAFKA_BOOTSTRAP_SERVERS=<kafka-bootstrap>
```

Relevant backend behavior:

- `notification-service` sends through Firebase Admin SDK.
- `Platform` enum supports `ANDROID`, `IOS`, and `WEB`.
- There is no `EXPO` or `MOBILE` platform.
- `notifyMobile=true` targets `ANDROID` and `IOS` tokens.
- API gateway routes `/api/push-tokens/**` to notification-service.

## Verification Checklist

1. Put a valid `google-services.json` in `Leafy_APP`.
2. Build a development/production native Android build.
3. Install on an Android physical device.
4. Login.
5. Allow notification permission.
6. Confirm `Notifications.getDevicePushTokenAsync()` returns a token.
7. Confirm `POST /api/push-tokens` succeeds.
8. Confirm Mongo `push_tokens` stores the token with platform `ANDROID`.
9. Trigger an IoT alert with `notifyMobile=true`.
10. Confirm notification-service sends FCM.
11. Confirm the device receives the notification.
12. Tap the notification and confirm alert detail opens.

## Common Failures

| Symptom | Likely cause |
| --- | --- |
| No token | Expo Go, simulator/emulator, missing `google-services.json`, or invalid native Firebase config. |
| Native build fails | `app.json` references `./google-services.json` but the file is missing at build time. |
| Token registration 401 | JWT not attached or session expired. |
| Backend sends but device receives nothing | Wrong Firebase project, invalid token, permission denied, stale token, or FCM disabled. |
| No notification for alert | Alert rule has `notifyMobile=false`, or notification-service has `NOTIFICATION_PUSH_ENABLED=false`. |
| iOS receives nothing | iOS Firebase/APNs/FCM setup is missing or app registered APNs token instead of FCM-compatible token. |
| Expo token rejected or never receives push | Backend does not support Expo Push API. Use native FCM token only. |

## Manual QA Notes

- Push cannot be validated fully from code only.
- Expo Go is intentionally skipped by the app.
- Use a physical device and a native build.
- Keep Firebase client config files out of git unless the team explicitly changes that policy.
- Phase M2 should add stable device identifiers and logout token deactivation.
- Phase M3 should add Android notification channel setup and refine foreground notification UX.
