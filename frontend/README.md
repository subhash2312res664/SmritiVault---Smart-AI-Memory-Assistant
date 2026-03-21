# SmritiVault — Frontend

> Smart AI Memory Assistant · IIT Patna · Group 87

React + Tailwind CSS + Bootstrap + Axios + Context API

---

## 🚀 Quick Start

```bash
# 1. Navigate to this folder
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm start
```

App runs at: http://localhost:3000  
Backend must be running at: http://127.0.0.1:8000

---

## 📁 Folder Structure

```
src/
├── components/
│   ├── AddItem.jsx        ← Log new item form
│   ├── SearchItem.jsx     ← Search by name
│   ├── ItemCard.jsx       ← Item row with inline edit/delete
│   ├── CameraCapture.jsx  ← 🔥 Camera + file upload + AI detect
│   └── Navbar.jsx         ← Top navigation with API status
│
├── pages/
│   ├── Dashboard.jsx      ← Main CRUD dashboard
│   └── DetectItem.jsx     ← AI detection page (Phase 2→3)
│
├── services/
│   └── api.js             ← All Axios API calls
│
├── store/
│   └── AppContext.jsx     ← Global state (Context + useReducer)
│
├── utils.js               ← Helpers: emoji map, date formatter
├── App.jsx                ← Router + providers
├── index.css              ← Global styles + design tokens
└── index.js               ← Entry point
```

---

## 🔧 Environment Variables

Edit `.env` to change the backend URL:

```
REACT_APP_API_URL=http://127.0.0.1:8000
```

---

## 🤖 AI Phases

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Manual CRUD | ✅ Done |
| 2 | Image Upload (`/upload_image`) | 🔄 Frontend ready, add backend route |
| 3 | YOLO Detection (`/detect`) | 📌 Planned — YOLOv8 + OpenCV |

---

## 📦 Tech Stack

- **React 18** — UI framework
- **Tailwind CSS** — Utility-first styling
- **Bootstrap 5** — Components + grid utilities
- **Axios** — HTTP client with interceptors
- **Context API + useReducer** — State management (no extra library needed)
- **React Router v6** — Navigation
- **React Hot Toast** — Notifications
- **Framer Motion** — Animations (available to extend)

---

*IIT Patna · Group 87 · Subhash Kumar Rana, Aryan Kumar Sah, Goutam Kumar Sah, Kumod Kumar Sah, Mukesh Kumawat*
