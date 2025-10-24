# 🎮 The Labyrinth Navigator  
*A 2D Classic Maze Game for Focused Play and Visual Impact*

Navigate intricate mazes, beat the clock, and showcase your reflexes in this single-player puzzle adventure—designed for clarity, responsiveness, and presentation-grade visuals.

---

## ✨ Game Highlights

- **Consistent Resolution**  
  Fixed aspect ratio ensures crisp visuals across projectors and large screens.

- **Minimalist UI with Depth**  
  Subtle grid/dot overlays add texture without distracting from gameplay.

- **Modular Game States**  
  Seamless transitions between Home, Level Select, Gameplay, and Results screens.

- **Real-Time Controls**  
  Smooth, responsive movement for immersive maze navigation.

---

## 🕹️ Controls & Gameplay

### 🎯 Objective  
Guide your player icon from the start to the exit—without touching maze walls.

### ⌨️ Keyboard Controls  
| Action           | Keys              |
|------------------|-------------------|
| Move Up          | `W` or `↑`        |
| Move Down        | `S` or `↓`        |
| Move Left        | `A` or `←`        |
| Move Right       | `D` or `→`        |
| Restart Level    | `R`               |
| Return to Menu   | `ESC`             |

---

## 🌐 Live Access & Sharing

- **GitHub Repository**: [Insert GitHub Link Here]  
- **Live Demo (Web Assembly)**: [Insert Demo Link Here]

---

## 🛠️ Tech Stack

- **Language**: C / C++  
- **Game Library**: [Insert your library, e.g., Raylib]  
- **Design Focus**: Clean rendering, modular architecture, and responsive input

### 🧩 Architecture Overview  
The game uses a state-machine system (`currentScreen`) to manage transitions. All rendering logic is centralized in the main loop for performance and clarity.

---

## ⚙️ Setup & Compilation

### 🔧 Requirements  
- C++ Compiler (GCC, Clang, etc.)  
- Game library installed and linked (e.g., Raylib)

### 🧪 Build Instructions  
```bash
# Example using GCC and Raylib:
g++ main.cpp -o maze_game -lraylib -lGLESv2
```

### ▶️ Run the Game  
```bash
./maze_game
```

---

## 🧠 Creator Notes  
This project is part of a modular game dashboard initiative. Built for clarity, engagement, and scalability—whether you're presenting, learning, or just playing.

---
