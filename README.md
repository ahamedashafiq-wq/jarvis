# JARVIS — ZORO EDITION

> **TAGLINE:** THREE BLADES. ONE INTELLIGENCE.

A tactical, full-stack AI personal command center powered by Google Gemini and backed by persistent storage and authentication.

---

## ⚔️ Dual-Platform Support (Web & Android)

This repository includes both the **Web Application** and the **Android Application**:

### 1. Web Application (`/web`)
* **Technology:** React 18, TypeScript, Tailwind CSS, Vite, Google Gemini AI SDK (`@google/generative-ai`), Supabase Client (`@supabase/supabase-js`), Browser SpeechRecognition & SpeechSynthesis.
* **Dev Server:** Listening on `http://0.0.0.0:3000` (live at your App URL).
* **Running Locally:**
  ```bash
  cd web
  npm install
  npm run dev
  ```
* **Routes:**
  * `/login`, `/signup`, `/forgot-password`
  * `/dashboard` — Tactical command center & focus matrix
  * `/chat` — Streaming Gemini AI conversation interface
  * `/voice` — Voice command HUD with real-time waveform visualizer
  * `/tasks` — Blade 02: Action Queue
  * `/memory` — Blade 03: Persistent Memory Bank
  * `/commands` — Tactical CLI Terminal (`/help`, `/status`, `/tasks`, `/memory`, `/focus`, `/analytics`, `/profile`, `/settings`, `/clear`)
  * `/analytics` — Combat discipline telemetry & productivity curves
  * `/settings` — Speech synthesis calibration & system parameters
  * `/profile` — Operator dossier, security matrix & credentials

### 2. Android Application (`/app`)
* **Technology:** Kotlin, Jetpack Compose, Material 3, Room SQLite, OkHttp3 Streaming, Native TextToSpeech & SpeechRecognizer.
* **Build System:** Gradle Kotlin DSL (`./gradlew assembleDebug`), verified by `compile_applet`.

---

## 🛡️ Three Blades Philosophy
* **Blade 01 (Knowledge):** Gemini intelligence, multi-turn conversational context, and tactical reasoning.
* **Blade 02 (Action):** Directives, task queues, focus sessions, and safe CLI command execution.
* **Blade 03 (Memory):** Zero-loss persistent knowledge nodes with user-level isolation.
