<div align="center">

# Aidevix Mobile

**The Aidevix learning platform in your pocket — iOS and Android**

Courses, an AI coach, daily streaks and real-time code battles, built with React Native and Expo.

![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Redux Toolkit](https://img.shields.io/badge/Redux%20Toolkit-2-764ABC?logo=redux&logoColor=white)
![New Architecture](https://img.shields.io/badge/RN%20New%20Architecture-enabled-success)

**[aidevix.uz](https://aidevix.uz)** · Web platform & API: [aidevixBackend](https://github.com/SunnatbekYusupovTech/aidevixBackend)

</div>

---

## Overview

Aidevix Mobile is the native client of [Aidevix](https://aidevix.uz), an AI-first programming education platform for Uzbek-speaking developers. It shares the platform's API and accounts with the web app, so progress, XP and certificates stay in sync across devices.

## Features

- **Authentication**: sign-up, login, email verification, password reset and Google Sign-In. Sessions persist and tokens refresh automatically.
- **Courses**: catalog, course details, video lessons with bookmarks, "My courses" and certificates.
- **AI Coach**: an in-app chat assistant for programming questions.
- **Code battles**: lobby → matchmaking → arena → results, with 1v1, 2v2 and 4v4 modes. If no opponent is available, you are matched against a bot.
- **Playground**: a code playground with an AI helper and AI code review.
- **Gamification**: XP toasts, daily check-in, streak tracking, daily challenges and a leaderboard.
- **Learning extras**: shorts, roadmaps, the founders page and a community forum.
- **Profile**: edit profile, followers and following, referrals, personal analytics and settings.
- **Notifications**: local reminders to keep your streak alive.
- **Theming**: light and dark themes via a central theme provider.

## Tech stack

| Concern | Library |
|---|---|
| Runtime | Expo SDK 54, React Native 0.81 (New Architecture), React 19 |
| Language | TypeScript 5.9 |
| Navigation | React Navigation 7 (native stack + bottom tabs) |
| State | Redux Toolkit 2 + React Redux (12 feature slices) |
| Networking | Axios with auth interceptor and single-flight token refresh |
| Forms | React Hook Form |
| Animation | Reanimated 4, Lottie |
| Platform | expo-notifications, expo-updates (OTA), AsyncStorage, react-native-webview, Google Sign-In |
| Build & release | EAS Build (development / preview APK / production), EAS Update channels |

## Architecture

```
AidevixApp/
├── App.tsx                 # Providers: Redux store, theme, root navigator
├── src/
│   ├── api/                # axios instance + endpoint modules
│   ├── navigation/         # Root, Auth, Main tabs and nested stacks
│   ├── screens/            # feature screens (auth, courses, battle, coach, profile, …)
│   ├── components/         # shared UI
│   ├── store/              # Redux Toolkit slices
│   ├── hooks/              # daily check-in, Google auth, …
│   ├── services/           # notifications
│   ├── theme/              # design tokens, light/dark
│   └── utils/              # storage, constants (API base URL resolution)
├── app.json                # Expo config (bundle id com.aidevix.app, EAS Updates)
└── eas.json                # build profiles and update channels
```

**Auth flow:** on launch, `RootNavigator` restores the session and switches between the Auth stack and the main tabs. The HTTP client sends a bearer token and the `X-Client-Type: mobile` header. On a `401` it refreshes the token once and retries the request.

**API base URL:** built from `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_API_PREFIX`. If the URL is empty or set to `auto`, the app detects the Metro host so a physical device can reach a local backend, and falls back to the production API.

## Getting started

**Prerequisites:** Node.js 20+ and the Expo Go app, or an Android/iOS simulator.

```bash
git clone https://github.com/SunnatbekYusupovTech/AidevixApp.git
cd AidevixApp
npm install
cp .env.example .env
npx expo start
```

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | API host (without `/api`); `auto` = detect the dev machine |
| `EXPO_PUBLIC_API_PORT` | Local API port (default `5000`) |
| `EXPO_PUBLIC_API_PREFIX` | API path prefix (e.g. `/api`) |
| `EXPO_PUBLIC_MOBILE_API_SECRET` | Mobile client secret expected by the API |
| `EXPO_PUBLIC_TELEGRAM_CHANNEL`, `EXPO_PUBLIC_TELEGRAM_BOT`, `EXPO_PUBLIC_INSTAGRAM_URL` | Social links |

### Scripts

```bash
npm start          # Expo dev server
npm run android    # native Android build
npm run ios        # native iOS build
npm run lint       # ESLint (eslint-config-expo)
```

### Builds

```bash
eas build --profile preview --platform android     # installable APK
eas build --profile production --platform all      # store builds
```

## Author

**Sunnatbek Yusupov**, Founder & CEO of Aidevix — [LinkedIn](https://www.linkedin.com/in/sunnatbee/) · [sunnatbekyusupov.uz](https://sunnatbekyusupov.uz)
