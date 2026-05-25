# Mobile IoT Alert Push Audit

Audit date: 2026-05-25

Scope:
- Backend: `D:/KLTN/Leafy/Leafy_BE`
- Mobile app: `D:/KLTN/Leafy/Leafy_APP`
- Flow: `IoT AlertEvent -> Kafka -> notification-service -> UserNotification -> FCM -> mobile app`

## 1. Executive Summary

Current feasibility: **Partial**.

The backend notification pipeline is broadly compatible with mobile push for IoT alerts. It publishes alert events when `notifyWeb || notifyMobile`, persists `UserNotification type=IOT_ALERT`, and sends FCM through Firebase Admin SDK to platform-filtered tokens. For `notifyMobile=true`, notification-service targets `ANDROID` and `IOS` tokens.

The mobile app also has a native FCM-token strategy, not Expo Push Token strategy. It requests notification permission after login, calls `Notifications.getDevicePushTokenAsync()`, registers the token to `/push-tokens` with platform `ANDROID` or `IOS`, invalidates alert/notification caches on receipt, and routes tapped IoT alert notifications to `/(main)/iot/alerts/{alertId}`.

Main blockers and risks:
- The current workspace does **not** contain `Leafy_APP/google-services.json`, while `app.json` references it via `android.googleServicesFile`. Android native FCM token acquisition/build needs this file or equivalent Firebase app configuration.
- No `Notifications.setNotificationChannelAsync(...)` Android channel was found. Android delivery/display should be verified on a physical device.
- No logout token deactivation flow was found, although `pushApi.deactivateToken()` exists.
- iOS native device token behavior needs verification. `getDevicePushTokenAsync()` returns APNs token on iOS in Expo unless configured through FCM-compatible native Firebase messaging. Backend sends through Firebase Admin FCM, so iOS requires verified FCM-compatible configuration, not just an APNs token.
- Foreground notification behavior logs and optionally schedules a local notification only for payloads with `titleKey/bodyKey`; current backend payload does not send those keys. Normal foreground banner behavior relies on `setNotificationHandler`.

Verdict: **mobile IoT alert push can work on Android only if the app is built as a dev/production native build with valid Firebase config and an FCM registration token is successfully registered. It will not work in Expo Go, and it cannot be considered fully working from code alone because the required Firebase config file is absent in this workspace and device QA is still needed.**

## 2. Backend IoT Alert Notification Flow

### 2.1 IoT alert creation and publish

| Item | Status | File/class | Notes |
| --- | ---: | --- | --- |
| Alert created from telemetry threshold violation | Yes | `iot-metrics-collector-service/src/main/java/com/leafy/iotmetricscollectorservice/service/impl/AlertEvaluationServiceImpl.java` | `evaluateReading()` finds enabled rules by sensor type, saves `AlertEvent`, then publishes if `shouldNotify(rule)`. |
| Publish when `notifyMobile=true` | Yes | `AlertEvaluationServiceImpl.shouldNotify()` | `Boolean.TRUE.equals(rule.getNotifyWeb()) || Boolean.TRUE.equals(rule.getNotifyMobile())`. |
| Publish when `notifyWeb=true` | Yes | Same | Same condition. |
| Rule has `notifyMobile` | Yes | `iot-metrics-collector-service/src/main/java/com/leafy/iotmetricscollectorservice/model/AlertRule.java` | `notifyMobile` defaults to `true`. DTOs also expose it. |
| Rule has `notifyWeb` | Yes | Same | `notifyWeb` defaults to `true`. |
| Payload has `alertEventId` | Yes | `KafkaAlertNotificationPublisher.toEvent()` | Uses saved `AlertEvent.id`. |
| Payload has `notifyMobile` | Yes | Same | Reads `alertEvent.alertRule.notifyMobile`. |
| Payload has `notifyWeb` | Yes | Same | Reads `alertEvent.alertRule.notifyWeb`. |
| Payload has `url` | Yes | Same | Uses web URL prefix `/dashboard/alerts?alertId=`. |
| Payload has severity/message | Yes | Same | Includes `severity`, `title`, `message`. |

Relevant event model:
- `common/src/main/java/com/leafy/common/event/notification/AlertTriggeredEvent.java`
- Fields include `alertEventId`, `ownerUserId`, `deviceId`, `deviceUid`, `zoneId`, `farmPlotId`, `sensorTypeCode`, `alertType`, `severity`, `triggerValue`, `thresholdMin`, `thresholdMax`, `title`, `message`, `notifyWeb`, `notifyMobile`, `referenceType`, `referenceId`, `url`.

Mobile push dependency:
- IoT service publishes when the alert rule has `notifyMobile=true`.
- Notification-service then maps this to FCM platforms `ANDROID` and `IOS`.

Mobile/web rule UI:
- Mobile `Leafy_APP/src/features/iot/screens/AlertRulesScreen.tsx` currently sends `notifyMobile: true` and `notifyWeb: true` in `buildPayload()`, but does not expose user-facing toggles.
- Web `Leafy_FE/src/features/alert-rules/pages/AlertRulesPage.tsx` exposes `notifyWeb` and `notifyMobile` toggles. Its defaults are `notifyWeb: true`, `notifyMobile: false`.

## 3. Notification-Service Token Model

### 3.1 Pipeline

| Stage | Status | File/class | Notes |
| --- | ---: | --- | --- |
| Consume `iot.alert.triggered` | Yes | `notification-service/src/main/java/com/leafy/notificationservice/consumer/AlertTriggeredConsumer.java` | Validates raw alert, forwards to ready topic. |
| Publish `iot.alert.ready` | Yes | `notification-service/src/main/java/com/leafy/notificationservice/publisher/AlertReadyPublisher.java` | Found through consumer references. |
| Consume `iot.alert.ready` | Yes | `notification-service/src/main/java/com/leafy/notificationservice/consumer/AlertReadyConsumer.java` | Delegates to `PushNotificationService`. |
| Create `UserNotification type=IOT_ALERT` | Yes | `PushNotificationServiceImpl`, `NotificationDeliveryServiceImpl`, `NotificationPersistenceServiceImpl` | Delivered through durable notification pipeline. |
| `notifyWeb=true -> IN_APP + FCM WEB` | Yes | `PushNotificationServiceImpl.resolveChannels()` and `resolveFcmPlatforms()` | Adds `IN_APP`, `FCM`, platform `WEB`. |
| `notifyMobile=true -> FCM ANDROID/IOS` | Yes | Same | Adds `FCM`, platforms `ANDROID`, `IOS`. |
| FCM data payload | Yes | `NotificationDeliveryServiceImpl.buildFcmData()` | Includes `type`, `referenceId`, `alertEventId`, `url`, `referenceType`, `severity`, `deviceId`, `deviceUid`, `zoneId`, `farmPlotId`, `sensorTypeCode`. |

### 3.2 Token model

| Feature | Status | File/class | Notes |
| --- | ---: | --- | --- |
| Token registration API | Yes | `notification-service/src/main/java/com/leafy/notificationservice/controller/PushTokenController.java` | `POST /push-tokens`. |
| Token deactivate API | Yes | Same | `POST /push-tokens/deactivate`. |
| Token platform field | Yes | `RegisterPushTokenRequest.platform`, `TokenDevice.platform` | Enum-backed. |
| Platform `ANDROID` support | Yes | `notification-service/src/main/java/com/leafy/notificationservice/enums/Platform.java` | Supported. |
| Platform `IOS` support | Yes | Same | Supported. |
| Platform `WEB` support | Yes | Same | Supported. |
| Platform `MOBILE` support | No | Same | Not present. A token registered as `MOBILE` would fail enum binding. |
| Platform `EXPO` support | No | Same | Not present. |
| Expo Push Token support | No | FCM strategy only | Backend does not call Expo Push API. |
| Native FCM token support | Yes | `FcmDeliveryStrategy` | Sends via Firebase Admin SDK `FirebaseMessaging.send(Message)`. |
| Invalid token deactivation | Yes | `FcmDeliveryStrategy` | Deactivates on `UNREGISTERED` and `INVALID_ARGUMENT`. |
| UserNotification history | Yes | `NotificationPersistenceServiceImpl`, `NotificationController` | History/state APIs exist and mobile uses them. |

Token fields:

| Field | Meaning | Mobile compatibility |
| --- | --- | --- |
| `userId` | Auth user id used by notification-service to find active tokens | Mobile sends `user.userId`; FCM delivery looks up `findByUserIdAndActiveTrue(userId)`. Compatible if `user.userId` matches alert `ownerUserId`. |
| `platform` | One of `ANDROID`, `IOS`, `WEB` | Mobile sends `ANDROID` or `IOS`. Compatible. |
| `deviceIdentifier` | Client-supplied device identifier | Mobile sends `${Platform.OS}-${uid}`. Works, but not stable per physical device if same user logs into multiple devices on same OS. |
| `fcmToken` | Native FCM registration token expected by Firebase Admin SDK | Mobile uses `getDevicePushTokenAsync()`. Compatible on Android native builds with Firebase config; iOS needs verification. |
| `active` | Delivery only sends active tokens | Registration sets active true; stale FCM errors deactivate. |

Important conclusion:
- notification-service sends by Firebase Admin SDK directly.
- It does **not** support Expo Push Tokens.
- If mobile were to send an Expo push token from `getExpoPushTokenAsync`, push would not work. Current mobile code does not do that; it uses `getDevicePushTokenAsync()`.

## 4. Backend Config

| Config | Status | Value/example | Notes |
| --- | ---: | --- | --- |
| Firebase enabled | Yes | `firebase.enabled: ${FIREBASE_ENABLED:true}` | `config-server/src/main/resources/config/notification-service.yaml`. |
| Firebase service account path | Yes | `firebase.configPath: ${FIREBASE_CONFIG_PATH:}` | Required for `FirebaseApp` bean. |
| Firebase disabled fallback | Yes | `NoOpFcmDeliveryStrategy` | `PushDeliveryConfig` uses no-op when `FirebaseMessaging` bean is absent. |
| Kafka topic `iot.alert.triggered` | Yes | `notification.kafka.topics.alertTriggered: iot.alert.triggered`; IoT `app.kafka.topics.alert-triggered` | Both configured. |
| Kafka topic `iot.alert.ready` | Yes | `notification.kafka.topics.alertReady: iot.alert.ready` | Internal ready topic. |
| Push enabled flag | Yes | `notification.push.enabled: ${NOTIFICATION_PUSH_ENABLED:true}` | If false, FCM channel removed. |
| Token registration gateway route | Yes | `/api/push-tokens/**` | `config-server/src/main/resources/config/api-gateway.yaml` routes to notification-service with `StripPrefix=1`. |
| Token registration protection | Protected | `SecurityConfig` | `/push-tokens/**` is not permitAll; mobile `apiClient` attaches JWT. |

Environment dependencies:
- `FIREBASE_ENABLED`
- `FIREBASE_CONFIG_PATH`
- `KAFKA_BOOTSTRAP_SERVERS`
- `SPRING_DATA_REDIS_HOST`
- `SPRING_DATA_REDIS_PORT`
- `SPRING_DATA_REDIS_PASSWORD`
- MongoDB notification DB envs

## 5. Mobile Push Implementation

### 5.1 Dependencies

| Library | Status | Notes |
| --- | ---: | --- |
| `expo-notifications` | Yes | Used for permission, native device token, notification handlers. |
| `expo-device` | Yes | Used to require physical devices. |
| `firebase` JS SDK | No | Not present. |
| `@react-native-firebase/messaging` | No | Not present. |
| `notifee` | No | Not present. |
| Custom push service | Yes | `src/features/notifications/services/expoPushService.ts`, `components/ExpoPushBootstrap.tsx`. |

Token strategy:
- App uses **native device push token** via `Notifications.getDevicePushTokenAsync()`.
- It does **not** use Expo Push Token via `getExpoPushTokenAsync()`.
- On Android this should be an FCM token in a native/dev build with Firebase config.
- On iOS this requires verification because Expo device token can be APNs depending on setup; backend expects an FCM registration token.

### 5.2 Permission and token registration

| Step | Status | File | Notes |
| --- | ---: | --- | --- |
| Configure foreground handler | Yes | `app/_layout.tsx`, `expoPushService.configurePushNotifications()` | Called before render. |
| Request notification permission | Yes | `requestPushPermission()` | Uses `Notifications.getPermissionsAsync()` then `requestPermissionsAsync()`. |
| Android notification channel | No | Search found no `setNotificationChannelAsync` | Needs Android physical-device verification. |
| Get push token | Yes | `getDevicePushToken()` | Uses `Notifications.getDevicePushTokenAsync()`. Skips simulator/emulator and Expo Go. |
| Register token to backend | Yes | `ExpoPushBootstrap.syncToken()` -> `pushApi.registerToken()` | Sends `userId`, platform, deviceIdentifier, `fcmToken`. |
| Include platform | Yes | `getPlatform()` | `IOS` or `ANDROID`. |
| Include device metadata | Partial | `deviceIdentifier: ${Platform.OS}-${uid}` | Basic, not unique per device model/install. |
| Run after login | Yes | `app/_layout.tsx` mounts `<ExpoPushBootstrap />` only when authenticated. |
| Token refresh/update | Partial | Re-registers if token differs from persisted `lastSyncedToken`; no explicit token refresh listener found. |
| Logout unregister/deactivate | No | `pushApi.deactivateToken()` exists, but no caller found from logout flow. |
| JWT/user header | Yes | `src/lib/axios.ts` attaches `Authorization: Bearer ...` for non-auth endpoints. |

Current workspace config:
- `app.json` has `android.googleServicesFile: "./google-services.json"`.
- `Test-Path google-services.json` returned false in this workspace.
- No `GoogleService-Info.plist` was found.

Implication:
- Android native FCM token setup is incomplete in this checkout unless the file is supplied outside source control during build.
- iOS FCM setup is not evident.

### 5.3 Foreground/background/killed behavior

| State | Handler | File | Behavior |
| --- | ---: | --- | --- |
| Foreground received | Yes | `ExpoPushBootstrap.tsx`, `addNotificationReceivedListener` | Invalidates alert and notification queries. Logs alert title/body. If payload has `titleKey/bodyKey`, schedules a local notification with resolved text. |
| Foreground display policy | Yes | `expoPushService.configurePushNotifications()` | `shouldShowBanner` and `shouldShowList` true except IoT payloads with translation keys. Current backend does not send translation keys, so banner/list should be shown by Expo handler. Needs physical-device verification. |
| User taps notification | Yes | `addNotificationResponseReceivedListener` | Calls `handleIotAlertPayload(..., true)`. |
| Background opened | Yes | Same response listener | Navigates if IoT alert payload recognized. |
| Cold start opened | Yes | `getLastNotificationResponseAsync()` | Navigates if IoT alert payload recognized. |
| Local notification display | Partial | `scheduleNotificationAsync()` only when translation keys are present | Backend currently sends `title/body`, not `titleKey/bodyKey`; local notification re-display path likely unused. |
| Toast/banner custom UI | No | No toast component found here | Relies on native notification UI/logging. |

Cache behavior:
- `handleIotAlertPayload()` invalidates `iotKeys.alerts()`, `notificationKeys.state()`, notification history, and alert detail query if alert id exists.

### 5.4 Mobile alert routes

| Screen/Route | Path/name | Params | Notes |
| --- | --- | ---: | --- |
| Alert list | `/(main)/iot/alerts` | filters via query params in screen | Implemented by `app/(main)/iot/alerts.tsx` -> `AlertEventsScreen`. |
| Alert detail | `/(main)/iot/alerts/[alertId]` | `alertId` | Implemented by `app/(main)/iot/alerts/[alertId].tsx` -> `AlertEventDetailScreen`. |
| IoT dashboard | `/(main)/iot/dashboard` | none | Existing IoT entry screen. |

Deep-link utility:
- `src/features/iot/utils/alertNotification.ts`
- Recognizes `type` values: `IOT_ALERT`, `IOT_ALERT_EVENT`, `ALERT_EVENT`, `ALERT_TRIGGERED`, `DEVICE_ALERT`.
- It currently extracts id from `referenceId` or `alertId`, not directly from `alertEventId`.

Compatibility note:
- Backend sends both `referenceId` and `alertEventId`, so current mobile extraction works because `referenceId` is present.
- If a future backend payload omitted `referenceId` and only sent `alertEventId`, mobile tap routing would fail unless `getIotAlertIdFromPayload()` is extended.

## 6. Payload Compatibility

Backend FCM data is built in `NotificationDeliveryServiceImpl.buildFcmData()`.

| Payload field | Backend sends | Mobile uses | Gap |
| --- | ---: | ---: | --- |
| `type=IOT_ALERT` | Yes | Yes | Good. |
| `referenceId=<alertEventId>` | Yes | Yes | Primary field used by mobile route utility. |
| `alertEventId` | Yes | No direct extraction | Safe because `referenceId` exists; could be added as fallback. |
| `referenceType=ALERT_EVENT` | Yes | Not needed | Good for future filtering. |
| `url=/dashboard/alerts?alertId=...` | Yes | No | URL is web-specific. Mobile ignores it, which is correct. |
| `severity` | Yes | No route use | Available for UI if needed. |
| `deviceId` | Yes | No route use | Available for UI/cache if needed. |
| `deviceUid` | Yes | Used only as fallback signal in `isIotAlertNotification()` | Good. |
| `zoneId` | Yes | No route use | Available. |
| `farmPlotId` | Yes | No route use | Available. |
| `sensorTypeCode` | Yes | No route use | Available. |
| `title` | FCM notification title comes from persisted title, not data | Data payload currently does not copy `title` | Mobile foreground text fallback may use generic title if only data is inspected. Native notification title still exists in `notification.request.content.title`. |
| `body` | FCM notification body comes from persisted body, not data | Data payload currently does not copy `body` | Mobile foreground text fallback may use generic body if only data is inspected. Native notification body still exists. |
| `titleKey/bodyKey` | No | Optional support exists | No issue; local re-display path unused. |
| `mobileRoute`/`screen` | No | No | Not required because `referenceId` is enough. |

Conclusion:
- Payload is sufficient for mobile navigation because `type` and `referenceId` are present.
- The web `url` is not mobile-compatible but mobile does not depend on it.
- Adding `mobileRoute` is optional. A lower-friction improvement is to let mobile parse `alertEventId` as fallback.

## 7. Current Feasibility

Can work now: **Partial**.

Reason:
- Backend path is present and platform targeting is correct for native FCM mobile tokens.
- Mobile app registers native device token after login with platform `ANDROID`/`IOS`, and notification tap routing to alert detail exists.
- But this checkout lacks `google-services.json`; app explicitly skips token acquisition in Expo Go; iOS FCM compatibility is not proven; Android channel is not configured; logout cleanup is missing.

Case assessment:

| Case | Applies? | Verdict |
| --- | ---: | --- |
| App uses Expo token, backend uses Firebase Admin FCM | No | App uses `getDevicePushTokenAsync()`, not `getExpoPushTokenAsync()`. |
| App uses FCM token and backend sends FCM | Yes for Android native build, Needs verification for iOS | Compatible if Firebase config exists and token registration succeeds. |
| App has not registered push token | Not generally; code exists | In Expo Go/simulator/missing Firebase config, token registration will not happen. |
| Rule `notifyMobile` disabled | Possible from web-created rules | Web defaults `notifyMobile=false`; mobile-created rules currently force true. |
| App receives notification but does not navigate | Unlikely for current backend payload | Backend sends `type=IOT_ALERT` and `referenceId`; mobile routes to detail. |

Blocker classification:
- **Token/config blocker:** Firebase mobile config absent in workspace; Expo Go unsupported by design.
- **Backend targeting:** Looks correct for `ANDROID/IOS`.
- **Payload:** Sufficient for route; web URL is ignored.
- **Permission:** Implemented, but prompt timing is immediate after login and needs UX acceptance.
- **Handler/navigation:** Implemented for foreground cache invalidation, background tap, and killed-app tap.
- **Cleanup:** Missing logout unregister/deactivate.

## 8. Recommended Implementation Plan

### Phase M1 - Align token strategy

Recommended path: **Native FCM**, because backend already uses Firebase Admin SDK.

Actions:
- Confirm project uses native/dev builds, not Expo Go, for push QA.
- Add/provide Android `google-services.json` during build.
- Decide iOS approach:
  - configure Firebase iOS app and ensure an FCM registration token is obtained, or
  - if staying with APNs token only, backend must not assume Firebase Admin can send to it directly.
- Keep avoiding Expo Push Token unless backend adds an Expo Push API delivery strategy.

### Phase M2 - Token registration

Actions:
- Keep registering after login with `platform: ANDROID/IOS`.
- Add a stable install/device identifier instead of `${Platform.OS}-${uid}`.
- Add logout token deactivation using existing `pushApi.deactivateToken(fcmToken)`.
- Add retry/backoff or a user-visible diagnostics state for token sync failures.
- Verify `user.userId` equals alert `ownerUserId`, because FCM lookup uses auth user id.

### Phase M3 - Mobile notification handlers

Actions:
- Add Android notification channel setup with `Notifications.setNotificationChannelAsync`.
- Consider a foreground in-app banner/toast instead of logs only.
- Keep invalidating alert and notification queries.
- Add `alertEventId` fallback in `getIotAlertIdFromPayload()`.
- Decide whether foreground local re-display is necessary when native banner is already enabled.

### Phase M4 - Backend payload compatibility

Actions:
- No contract change is required for routing.
- Optional: add `mobileRoute: "/(main)/iot/alerts/{alertEventId}"` or `screen: "IOT_ALERT_DETAIL"`.
- Optional: include `title` and `body` in FCM data as strings if mobile foreground text resolution should not rely on notification content.
- Keep all FCM data values strings; current `buildFcmData()` does this.

### Phase M5 - E2E QA

Actions:
- Android physical device with development/production build.
- iOS physical device if iOS support is required.
- Verify `FIREBASE_ENABLED=true` and valid `FIREBASE_CONFIG_PATH` on notification-service.
- Trigger telemetry threshold alert with `notifyMobile=true`.
- Trigger disease detection alert if camera alerts use the same pipeline.
- Test foreground, background, and killed-app tap routing.
- Verify stale token deactivation by invalidating/removing app token.

## 9. Tests Needed

Backend:
- `notifyMobile=true` targets `ANDROID` and `IOS` platforms.
- `notifyWeb=true` targets `WEB` and `IN_APP`.
- FCM data contains `type`, `referenceId`, `alertEventId`, `referenceType`, `severity`, `deviceId`, `zoneId`, `farmPlotId`, `sensorTypeCode`.
- Unknown platform overrides are ignored safely.
- Invalid FCM token deactivates `TokenDevice`.
- Missing Firebase bean uses no-op strategy and does not crash delivery.

Mobile:
- Token registration is called after login with JWT and payload `{ userId, platform, deviceIdentifier, fcmToken }`.
- Expo Go/simulator returns graceful token sync error.
- Foreground IoT alert invalidates alert list, alert detail, notification state, and notification history.
- Background tap routes to `/(main)/iot/alerts/{referenceId}`.
- Killed-app tap routes to `/(main)/iot/alerts/{referenceId}`.
- Payload with only `alertEventId` still routes after adding fallback.
- Permission denied does not crash app.
- Logout deactivates token after implementation.

## 10. Manual QA Checklist

- Provide `Leafy_APP/google-services.json` for Android or confirm build-time injection.
- Confirm Firebase Android package name matches `app.json` package `com.leafy`.
- Confirm notification-service has `FIREBASE_ENABLED=true`.
- Confirm notification-service has valid `FIREBASE_CONFIG_PATH`.
- Confirm API gateway routes `/api/push-tokens/**`.
- Login on Android physical device using native build, not Expo Go.
- Confirm `POST /api/push-tokens` succeeds and Mongo `push_tokens` has active platform `ANDROID`.
- Create/enable alert rule with `notifyMobile=true`.
- Trigger telemetry alert by crossing threshold.
- Verify FCM sent in notification-service logs.
- With app foregrounded, verify native banner/list behavior and cache refresh.
- With app backgrounded, tap notification and verify alert detail screen opens.
- With app killed, tap notification and verify alert detail screen opens.
- Repeat for disease detection alert event.
- Logout and verify token remains active currently; after fix, verify deactivation.

## 11. Open Decisions

- Native FCM vs Expo Push API: current backend and mobile code are aligned around native FCM; confirm this is the intended long-term strategy.
- iOS support level: Android-only first, or configure iOS Firebase/APNs/FCM now.
- Target screen: current mobile routes to alert detail. Confirm whether product wants detail or list with highlight.
- Payload routing contract: use `referenceId`, add `alertEventId` fallback, or introduce `mobileRoute/screen`.
- Permission prompt timing: immediate after login vs a settings/onboarding moment.
- Logout token cleanup: deactivate current token on logout, and decide behavior for logout-all-devices.
- Foreground UX: rely on native banner or add in-app toast/banner.
