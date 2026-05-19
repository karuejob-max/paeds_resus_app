# PaedsResus Mobile App

React Native + Expo scaffold for the Paeds Resus Platform.

## Architecture

```
mobile/
├── app/
│   ├── _layout.tsx          # Root layout: tRPC, React Query, push notifications
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Bottom tab navigator
│   │   ├── index.tsx        # Home / Provider Dashboard
│   │   ├── resus.tsx        # ResusGPS idle screen
│   │   ├── protocols.tsx    # Condition protocols browser
│   │   └── profile.tsx      # Account, certificates, Care Signal
│   └── resus/
│       ├── active.tsx       # Active ResusGPS case screen
│       └── protocol.tsx     # Full-screen protocol viewer (TODO: Phase 8)
├── components/              # Shared mobile components
├── lib/                     # Shared utilities (offline storage, drug calcs)
├── assets/                  # Icons, splash, notification sounds
├── app.json                 # Expo config
└── package.json
```

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Expo Router (file-based routing) | Zero-config navigation, deep linking, typed routes |
| Wall-clock `requestAnimationFrame` timer | Immune to JS thread throttling during long codes |
| `expo-keep-awake` during active case | Screen never sleeps during a resuscitation |
| `expo-haptics` on CPR/shock actions | Tactile confirmation under pressure |
| AsyncStorage session persistence | Case survives app backgrounding |
| Gesture disabled on active case screen | Prevents accidental swipe-back during a code |
| AHA shock formula: 2→4→≥4 J/kg (max 10) | Clinically correct, matches web app Phase 1 fix |

## Setup

```bash
cd mobile
npm install

# iOS (requires macOS + Xcode)
npm run ios

# Android
npm run android

# Web preview
npm run web
```

## Environment Variables

Create `mobile/.env`:
```
EXPO_PUBLIC_API_URL=https://your-api.paedsresus.com
```

## Build (EAS)

```bash
npm install -g eas-cli
eas login
eas build --platform android   # APK for low-resource hospital distribution
eas build --platform ios       # IPA for App Store
```

## Phase 8 Roadmap (Mobile-specific)

| ID | Task |
|---|---|
| 8.1 | Full ABCDE engine port to mobile (shared `conditionProtocols.ts`) |
| 8.2 | CPR Clock with 2-minute cycle timer and haptic pulse |
| 8.3 | Offline-first drug calculator with weight-based doses |
| 8.4 | Voice command support ("Next step", "Shock delivered") |
| 8.5 | Bluetooth pulse oximeter integration |
| 8.6 | EAS OTA updates for instant clinical guideline patches |
