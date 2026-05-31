# 🚀 Smart AI Memory Assistant

### 🎓 IIT Patna – Capstone Project 2

### 👥 Group 87

---

## 📌 Project Overview

The **Smart AI Memory Assistant** is a system designed to help users remember where they placed important physical items such as keys, documents, wallets, and ID cards.

The system supports:

* Manual item logging
* Intelligent search
* Update & delete operations
* (Future scope) AI-based object detection

---

## 🎯 Problem Statement

People often forget where they keep important items, leading to wasted time and frustration.
This project aims to provide a **simple and effective digital memory system**.

---

## 🛠️ Tech Stack

* **Backend:** FastAPI (Python)
* **Database:** MongoDB
* **Frontend:** HTML / React
* **Version Control:** Git & GitHub

---

## 📂 Project Structure

```id="a1e2rf"
Smart_Memory_Assistant/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── auth_routes.py
│   │   ├── database.py
|   |   ├── detect_route.py
|   |   ├── history_route.py
|   |   ├── live_detect_route.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── routes.py
│   │
|   ├── venv/
|   ├── .env
│   ├── requirements.txt
│   └── yolov8n.pt
│
├── frontend/
|   ├── dist/
|   |   ├── assets/
|   |   |    ├── index-gnPv317v.js
|   |   |    └── index-uwzIEaTH.css
|   |   |
|   |   └── index.html
|   |   
|   ├── node_modules/
|   |  
|   ├── src/
|   |   ├── api/
|   |   |   └── index.js
|   |   |
|   |   ├── components/
|   |   |   ├── Footer.jsx
|   |   |   ├── ItemIcon.jsx
|   |   |   ├── Navbar.jsx
|   |   |   ├── OfflineBanner.jsx
|   |   |   └── Toast.jsx
|   |   |
|   |   ├── hooks/
|   |   |   └── useMediaQuery.js
|   |   |
|   |   ├── pages/
|   |   |   ├── AddItem.jsx
|   |   |   ├── Camera.jsx
|   |   |   ├── Dashboard.jsx
|   |   |   ├── ItemHistory.jsx
|   |   |   ├── LiveCamera.jsx
|   |   |   ├── Login.jsx
|   |   |   ├── MyItems.jsx
|   |   |   ├── Register.jsx
|   |   |   └── Search.jsx
|   |   |
|   |   ├── Services/
|   |   |   ├── localDB.js
|   |   |   └── syncService.js
|   |   ├── {pages,components,api}
|   |   ├── App.jsx
|   |   ├── index.css
|   |   └── main.jsx
|   | 
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   └── vite.config.js
├── docs/
├── LICENSE
├── .gitignore
└── README.md
```

---

## ⚙️ Setup Instructions (Local Machine)

### 🔹 1. Clone Repository

```id="c7j3kd"
git clone https://github.com/subhash2312res664/SmritiVault---Smart-AI-Memory-Assistant
cd project-name
```

---

### 🔹 2. Setup Backend

```id="9mv2lt"
cd backend
python -m venv memory_env
```

Activate environment:

**Windows:**

```id="2wz1p4"
memory_env\Scripts\activate
```

**Linux/Mac:**

```id="y8c3lo"
source memory_env/bin/activate
```

---

### 🔹 3. Install Dependencies

```id="u9e7nf"
pip install -r requirements.txt
```

---

### 🔹 4. Setup Environment Variables

Create file:

```id="h8k2rm"
backend/.env
```

Add:

```id="k3m9zq"
MONGO_URI=mongodb://localhost:27017
```

---

### 🔹 5. Run Backend Server

```id="n4t8xp"
uvicorn app.main:app --reload
```

Open:

```id="m5k2re"
http://127.0.0.1:8000/docs
```

---

## 🌐 API Endpoints

| Method | Endpoint                   | Description   |
| ------ | -------------------------- | ------------- |
| GET    | `/`                        | Server status |
| POST   | `/log_item`                | Save item     |
| GET    | `/search_item/{item_name}` | Search item   |
| PUT    | `/update_item/{item_name}` | Update item   |
| DELETE | `/delete_item/{item_name}` | Delete item   |

---

## 💻 Frontend Setup

```id="p9l2xt"
cd frontend
npm install
npm run dev
```

---

## 🔄 Git Workflow (Team Rules)

```id="v8k1rs"
git checkout main
git pull origin main
git checkout -b feature-name
```

After work:

```id="z7d2mn"
git add .
git commit -m "your message"
git push origin feature-name
```

👉 Always create Pull Request before merging.

---

## ⚠️ Important Notes

* Do NOT upload `.env` file
* Always pull latest code before working
* Use separate branches for each feature

---

## 🚀 Future Scope

* AI object detection (YOLO + OpenCV)
* Voice-based search
* Mobile application
* Cloud deployment

---

## 👥 Team – Group 87

* Subhash Kumar Rana
* Aryan Kumar Sah
* Goutam Kumar Sah
* Kumod Kumar Sah
* Mukesh Kumawat

---

## 🎓 Institute

**Indian Institute of Technology Patna (IITP)**

---
