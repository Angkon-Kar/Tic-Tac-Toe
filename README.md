# Tic-Tac-Toe: Multi-Mode Game

A classic Tic-Tac-Toe game built with HTML, CSS, and JavaScript, featuring three exciting game modes: Local 2-Player, Online 2-Player, and Player vs. Computer (AI).

## ✨ Features

* **Local 2-Player Mode:** Play against a friend on the same device.
* **Online 2-Player Mode:** Challenge friends remotely using unique game IDs, powered by Firebase Firestore for real-time synchronization.
* **Player vs. Computer (AI) Mode:** Test your skills against a simple AI opponent.
* **Responsive Design:** Enjoy the game seamlessly on various screen sizes (desktop, tablet, mobile).
* **Modern UI:** Clean and intuitive interface styled with Tailwind CSS.

## 🚀 Live Demos

You can play the game live at:

* **GitHub Pages:** [GitHub Live Link](https://angkon-kar.github.io/Tic-Tac-Toe/)
* **Netlify:** [Netlify Live Link](https://aktictactoegame.netlify.app/)

## 🎮 How to Play

1.  **Choose Your Mode:** Upon launching the game, you'll be presented with three options:
    * `Local 2-Player`
    * `Online 2-Player`
    * `Player vs. Computer`

2.  **Local 2-Player Mode:**
    * Select "Local 2-Player".
    * Players take turns clicking on empty cells to place their 'X' or 'O'.
    * The first player to get three of their marks in a row (horizontally, vertically, or diagonally) wins!
    * If all cells are filled and no one wins, it's a draw.
    * Click "Reset Game" to start a new round.

3.  **Online 2-Player Mode:**
    * Select "Online 2-Player".
    * **To Create a Game:** Click "Create New Game". A unique Game ID will be generated and displayed. Copy this ID and share it with your friend.
    * **To Join a Game:** Enter the Game ID provided by your friend into the "Enter Game ID" field and click "Join Game".
    * Once both players are connected, the game will begin. Moves will synchronize in real-time.
    * Player X (the creator) can reset the game. Player O can leave the game by clicking reset.

4.  **Player vs. Computer Mode:**
    * Select "Player vs. Computer".
    * You will play as 'X', and the computer will play as 'O'.
    * Take your turn, and the AI will make its move shortly after.
    * Click "Reset Game" to start a new round.

## 🛠️ Technologies Used

* **HTML5:** For the game's structure.
* **CSS3:** For styling, with the help of **Tailwind CSS** for utility-first design.
* **JavaScript (ES6+):** For game logic, UI interactions, and AI.
* **Firebase Firestore:** A NoSQL cloud database used for real-time data synchronization in the Online 2-Player mode.

## ⚙️ Local Development Setup

To set up the project locally:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/angkon-kar/Tic-Tac-Toe.git](https://github.com/angkon-kar/Tic-Tac-Toe.git)
    cd Tic-Tac-Toe
    ```
2.  **Open `index.html`:** Simply open the `index.html` file in your web browser.
    * Note: For the online multiplayer mode to function correctly, you would typically need to set up a Firebase project and configure it. However, this project is designed to run within an environment that provides Firebase credentials (like the Canvas environment where it was developed). If deploying to your own hosting, you might need to manually configure Firebase in `js/script.js` (by replacing `__firebase_config` and `__initial_auth_token` with your actual project's config and an authentication method).

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---
