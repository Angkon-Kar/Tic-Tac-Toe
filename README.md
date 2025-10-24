# ❌🅾️ Tic Tac Toe: Multi-Mode Arena  
*A modular, Firebase-powered game built for challenge, connection, and clarity.*

This isn’t just Tic Tac Toe—it’s a full-featured, multi-mode experience designed for both casual play and technical exploration. Built with **HTML**, **Tailwind CSS**, and **ES6 modular JavaScript**, it supports local matches, AI battles, and real-time online duels with chat and theming.

---

## 🎮 Game Modes Overview

| Mode                | Description                                                                 |
|---------------------|------------------------------------------------------------------------------|
| 👥 Local PvP         | Two players compete on the same device with persistent score tracking.       |
| 🤖 Player vs Computer| AI opponent with Easy, Medium, and Hard (Minimax) difficulty levels.         |
| 🌐 Online PvP        | Real-time multiplayer via Firebase with public, private, and spectator modes.|
| 💬 In-Game Chat      | Live messaging between players and spectators during online matches.         |
| 🌓 Theme Toggle      | Switch between Light and Dark Mode for visual comfort.                       |

---

## 🧠 Architecture Overview

| Module         | Purpose                                      |
|----------------|----------------------------------------------|
| `main.js`      | App entry point and event routing            |
| `ui.js`        | DOM control and section toggling             |
| `gameLogic.js` | Core gameplay logic and scoring              |
| `ai.js`        | Minimax-based AI engine                      |
| `onlineGame.js`| Multiplayer sync and chat via Firestore      |
| `auth.js`      | Firebase Authentication setup                |

---

## 🛠️ Tech Stack

| Technology        | Role                                      |
|-------------------|-------------------------------------------|
| HTML5             | Structure                                 |
| Tailwind CSS (CDN)| Styling and responsive layout             |
| JavaScript (ES6)  | Modular logic and interactivity           |
| Firebase Firestore| Real-time game state and chat sync        |
| Firebase Auth     | Anonymous user identification             |
| Tone.js (minified)| Game sound effects                        |

---

## 🚀 Setup & Deployment

### 🔧 Prerequisites
- Firebase project with Firestore and Anonymous Auth enabled
- Live server for ES6 module support

### 🛠️ Installation
```bash
git clone [YOUR_REPO_URL]
cd tic-tac-toe-game
```

### 🔥 Firebase Configuration
Replace the placeholder in `js/auth.js`:
```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

### 🧪 Run Locally
```bash
npm install -g live-server
live-server
```
Opens at `http://127.0.0.1:8080`

---

## 📁 Project Structure

| Folder/File       | Description                                |
|-------------------|--------------------------------------------|
| `css/base.css`    | Global styles and utility overrides         |
| `css/chat.css`    | Chat UI styling                             |
| `css/game.css`    | Game board and status styling               |
| `css/lobby.css`   | Mode selection and lobby styling            |
| `js/ai.js`        | AI logic using Minimax                     |
| `js/auth.js`      | Firebase setup and authentication          |
| `js/gameLogic.js` | Game state and move handling               |
| `js/main.js`      | App entry and event listeners              |
| `js/onlineGame.js`| Multiplayer and chat logic                 |
| `js/ui.js`        | DOM getters and UI rendering               |
| `index.html`      | Main HTML structure                        |

---

## 🧩 Developer Notes

This project is part of a modular game dashboard initiative. It’s designed to be:
- **Copy-friendly** for reuse and remixing
- **Scalable** for adding new modes or features
- **Presentation-ready** for demos, portfolios, and workshops

---

Want a Bengali summary version for your community or a cinematic caption for Argon.BD? Just say the word—I’ll tailor it to your audience and brand tone.
