# Aidevix Mobile App

The official mobile application for the Aidevix education platform, built with **React Native** and **Expo**. It provides an optimized, engaging mobile experience for learning programming on the go.

## 📱 Features
- **Seamless Authentication:** Integrates with the main Aidevix Backend API.
- **Home Dashboard:** Quick actions for Forum, Code Battle, Top Prompts, and Playgrounds.
- **Engaging UI/UX:** Built with React Native Reanimated for smooth transitions and modern design aesthetics.
- **Gamification:** Track XP, levels, and daily streaks right from the mobile home screen.
- **Hybrid Approach:** Complex screens (e.g., Q&A Forum, Real-time Battle) are seamlessly integrated using `react-native-webview` for synchronized content with the web platform.

## 🛠️ Tech Stack
- **React Native (Expo)**
- **TypeScript**
- **React Navigation** (Stack & Tabs)
- **Redux Toolkit** (State Management)
- **Axios** (API Client with Interceptors)
- **React Native WebView**

## 📦 Installation & Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Ensure you have configured the backend URL. Create a `.env` file or configure it in `src/api/apiClient.ts` during development.
   ```env
   EXPO_PUBLIC_API_URL=https://aidevix-backend-production.up.railway.app/api
   ```

3. **Run the App:**
   ```bash
   npx expo start
   ```
   - Press `a` to open in Android Emulator.
   - Press `i` to open in iOS Simulator.
   - Scan the QR code with the **Expo Go** app to test on a physical device.

## 🗂️ Project Structure
- `src/screens/` - Contains all application screens (Home, Profile, Auth, Forum, etc.)
- `src/navigation/` - React Navigation configurations
- `src/store/` - Redux Toolkit slices and store configuration
- `src/api/` - Axios client and API utilities
- `src/components/` - Reusable UI components

---
*Maintained by the Aidevix Mobile Team.*
