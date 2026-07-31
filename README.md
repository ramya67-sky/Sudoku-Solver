# 🧩 Sudoku Solver & Puzzle Generator

A full-stack Sudoku Solver and Puzzle Generator built using **Node.js**, **Express.js**, and **React**. The application can generate Sudoku puzzles of different difficulty levels, validate user input, solve puzzles using the **Backtracking Algorithm**, and visualize the solving process step-by-step.

---

## 📌 Features

- ✅ Solve any valid Sudoku puzzle
- 🎯 Step-by-step solving animation
- 🔄 Backtracking visualization
- 🎲 Generate Sudoku puzzles
- 📊 Three difficulty levels
  - Easy
  - Medium
  - Hard
- ✅ Input validation
- ❌ Detect invalid Sudoku boards
- 🚀 REST API backend
- 🎨 Interactive React frontend

---

# 📷 Project Preview

> Add screenshots here after uploading them.

```
Home Screen
Sudoku Generator
Sudoku Solver Animation
Solved Puzzle
```

---

# 🏗️ Project Structure

```
Sudoku-Solver/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   └── node_modules/
│
├── frontend/
│   ├── src/
│   │   ├── SudokuSolver.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── README.md
└── .gitignore
```

---

# ⚙️ Technologies Used

### Backend

- Node.js
- Express.js
- CORS

### Frontend

- React.js
- JavaScript (ES6)
- CSS

### Algorithm

- Recursive Backtracking

---

# 🧠 Algorithm

The Sudoku solver uses the **Backtracking Algorithm**.

### Steps

1. Find an empty cell.
2. Try placing numbers 1–9.
3. Check whether the number is valid.
4. If valid, continue recursively.
5. If no number works, backtrack.
6. Repeat until the board is solved.

Time Complexity (Worst Case)

```
O(9^(81))
```

Space Complexity

```
O(81)
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/sudoku-solver.git
```

```bash
cd sudoku-solver
```

---

# Backend Setup

Navigate to backend folder

```bash
cd backend
```

Install dependencies

```bash
npm install
```

Run server

```bash
node server.js
```

Server starts on

```
http://localhost:3001
```

---

# Frontend Setup

Navigate to frontend

```bash
cd frontend
```

Install dependencies

```bash
npm install
```

Run application

```bash
npm run dev
```

Frontend runs on

```
http://localhost:5173
```

---

# 🔌 API Endpoints

## 1. Solve Sudoku

**POST**

```
/solve-sudoku
```

### Request

```json
{
  "board": [
    [5,3,0,0,7,0,0,0,0],
    [6,0,0,1,9,5,0,0,0],
    [0,9,8,0,0,0,0,6,0],
    [8,0,0,0,6,0,0,0,3],
    [4,0,0,8,0,3,0,0,1],
    [7,0,0,0,2,0,0,0,6],
    [0,6,0,0,0,0,2,8,0],
    [0,0,0,4,1,9,0,0,5],
    [0,0,0,0,8,0,0,7,9]
  ],
  "withSteps": true
}
```

### Response

```json
{
  "board": [...],
  "steps": [...]
}
```

---

## 2. Generate Puzzle

**GET**

```
/generate?difficulty=easy
```

### Difficulty Levels

```
easy
medium
hard
```

### Response

```json
{
  "puzzle": [...],
  "solution": [...]
}
```

---

## 3. Health Check

**GET**

```
/health
```

Response

```json
{
  "status":"ok"
}
```

---

# 🧩 Validation

The backend validates:

- Board must be 9×9.
- Values must be between 0–9.
- No duplicate numbers in any row.
- No duplicate numbers in any column.
- No duplicate numbers in any 3×3 box.
- Detects unsolvable puzzles.

---

# 🎲 Puzzle Generation

The generator:

- Creates a fully solved Sudoku board.
- Removes cells based on difficulty.
- Checks that the puzzle remains solvable.
- Returns both puzzle and solution.

Difficulty Levels

| Difficulty | Empty Cells |
|------------|------------:|
| Easy | 36 |
| Medium | 46 |
| Hard | 54 |

---

# 🎥 Animation

The frontend records every solving action.

Each move is stored as

```javascript
{
    row,
    col,
    val,
    type: "place"
}
```

Backtracking is stored as

```javascript
{
    row,
    col,
    val:0,
    type:"backtrack"
}
```

This allows smooth visualization of:

- Number placements
- Wrong guesses
- Recursive backtracking
- Final solved board

---

# 📁 Core Functions

### Validation

```javascript
isValid(board,row,col,num)
```

Checks whether a number can be placed.

---

### Solver

```javascript
solveSudoku(board)
```

Solves Sudoku using recursion.

---

### Solver with Animation

```javascript
solveWithSteps(board)
```

Returns:

- solved board
- animation steps

---

### Board Validation

```javascript
validateBoard(board)
```

Detects invalid Sudoku boards.

---

### Puzzle Generator

```javascript
generatePuzzle(difficulty)
```

Generates Sudoku puzzles for different difficulty levels.

---

# 💡 Future Improvements

- Hint System
- Multiple solving algorithms
- Timer
- Leaderboard
- Dark/Light Theme
- Save progress
- Mobile optimization
- Sudoku difficulty rating
- AI-assisted solving explanation

---

# 👨‍💻 Author

**Ramya Ruba**

GitHub:
https://github.com/ramya67-sky

---

# ⭐ If you like this project

Give this repository a ⭐ on GitHub!

---

## License

This project is licensed under the MIT License.
