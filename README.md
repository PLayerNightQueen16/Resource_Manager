# 🌌 Noetica — Personal Learning Resource Manager

**Noetica** is a **cyber-themed personal learning resource manager** built as a front-end application to organize, track, and curate study materials in one centralized, visually stunning interface. It focuses on **resource organization, real-time tagging, and intuitive categorization**, presented through a sleek, deep dark terminal UI with dynamic glowing background animations.

---

## 🎯 Project Objectives

- Catalog and manage learning resources across multiple media types
- Easily categorize content via automated tagging and collections
- Enable customized aesthetics, starring mechanisms, and seamless file uploads
- Deliver a polished, immersive **cyber / tech UI experience**

---

## 🧩 Features

- 📚 **Resource Library** — Add articles, videos, codes, PDFs, Note files, and websites with dynamic metadata and file attachments.
- 🗂️ **Collections** — Group your learning contexts by bespoke categories spanning anything from "Frontend Guide" to "System Design".
- 🏷️ **Dynamic Tagging** — A robust tagging system that automatically sorts resources allowing instant client-side filtering.
- 📌 **Pin System** — Pin your most important resources for rapid access at the top of your layout.
- 💾 **Local-first Architecture** — All data is securely stored in your browser's `localStorage`, requiring no backend setup or build server.
- 🌌 **Animated Glass UI** — Custom particle blob background engineered with pure CSS keyframes running behind premium glassmorphism layouts.

---

## 🗂 Folder Structure

```pgsql
Ethereal-Vault/
│
├── index.html                   # App entry point
├── package.json                 # Project dependencies
├── vite.config.js               # Dev environment configuration
│
├── public/
│   └── logo.jpg                 # Noetica Application Logo
│
└── src/
    ├── App.jsx                  # Root component & state architecture
    ├── main.jsx                 # React DOM entry
    ├── index.css                # Global styles, variables & CSS keyframes
    │
    └── components/
        ├── Sidebar.jsx          # Collapsible contextual navigation and tagging side panel
        ├── ResourceCard.jsx     # Actionable resource cards (pin, edit, delete, external link)
        ├── ResourceModal.jsx    # Complete CRUD creation and edit form handling blobs
        └── AnimatedBackground.jsx # Pure CSS dynamic glassmorphism floating blob backer
```

---

## ⚙️ Technologies Used

- **React 18/19** — Component architecture & state management
- **Vite** — Lightning-fast development server and build mechanism
- **Tailwind CSS** — Utility-first styling with custom theme tokens
- **TanStack Query** — Advanced mock-server state management & cache invalidation
- **Lucide React** — Crisp, beautiful scalable vector icons
- **Radix UI Primitive** — Accessible, unstyled UI roots for customized dialogs and elements

No external backend or remote API keys required!

---

## 🚀 How to Run the Project

1. Clone the repository
2. Install dependencies (Using pnpm or npm)
```bash
   pnpm install
```
3. Start the development server
```bash
   pnpm run dev
```
4. Open `http://localhost:5173` in your browser

---

## 🧠 Design Decisions

- **Server-less Native Execution** — All logic and data fetch protocols are securely intercepted and run right inside your browser via local storage, preserving your privacy entirely.
- **Pure CSS Keyframes** — Background animations were explicitly refactored from heavy JS polling to native CSS to absolutely eliminate frame-flickering and guarantee 144hz smoothness.
- **Query Invalidation Architecture** — TanStack Query is used even against our mock `localStorage` interface to maintain reactive, robust front-end behavior that scales identically to how a real backend would operate.
- **Forced Dark Theme** — CSS variables locked to a specialized midnight hue for the intended immersive visual experience.

---

## 📌 Future Enhancements

- Integration with cloud storage and backend infrastructure for persistent, cross-device data management
- Dedicated read-view modes for internal notes parsed securely via markdown handlers
- Browser extension enabling one-click resource capture directly from any webpage
- Collaborative shared libraries allowing teams or study groups to curate and access resources collectively
- Spaced repetition algorithm to surface neglected resources at optimal review intervals
- Dedicated mobile application for on-the-go access and resource management
- Integrated Pomodoro-style focus timer within the workspace dashboard to support structured study sessions
- Daily and weekly learning streak tracking to encourage consistent study habits

## 👩‍💻 Author

**Srishti Mehta**

Personal Project

---

## 📜 License

This project is for **personal and educational use**.
