# JARVIS — ZORO EDITION

> **THREE BLADES. ONE INTELLIGENCE.**

Tactical personal AI command center powered by Google Gemini, React, TypeScript, and Tailwind CSS.

---

## ⚔️ Architecture & Tech Stack

* **Framework:** React 18 SPA (Vite)
* **Language:** TypeScript 5
* **Styling:** Tailwind CSS with custom Santoryu Zoro tactical theme
* **Intelligence (Blade 01):** Google Gemini modern SDK (`@google/genai` / `gemini-3.8-flash`), streaming response generator, intent classification matrix (Tasks, Memories, Focus protocol)
* **Action (Blade 02):** Priority queue, progress clearance rates, due dates, and completion status
* **Memory (Blade 03):** Persistent memory bank with categorization (Profile, Preference, Project, Academic, Dates), importance weighting, and contextual injection into AI prompts
* **Focus Protocol:** Santoryu Pomodoro immersion timer with preset & custom durations, progress rings, completion announcements, and session logs
* **Voice HUD:** Web Speech API integration with interactive orbital visualizer, speech recognition, and synthesis
* **Tactical CLI Terminal:** Directives pipeline supporting `/help`, `/status`, `/tasks`, `/memory`, `/focus`, `/analytics`, `/profile`, `/settings`, `/clear`, `/logout`
* **Telemetry & Logs:** System audit trails and notification management
* **Authentication:** Supabase Auth with seamless local sandbox fallback

---

## 🚀 Running the Application

* **Development Server:**
  ```bash
  npm run dev
  ```
  Listens on `http://0.0.0.0:3000`.

* **Production Build:**
  ```bash
  npm run build
  ```
