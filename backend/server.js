const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ─── Sudoku Logic ────────────────────────────────────────────────────────────

function isValid(board, row, col, num) {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === num) return false;
  }
  // Check column
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) return false;
  }
  // Check 3×3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[boxRow + r][boxCol + c] === num) return false;
    }
  }
  return true;
}

function solveSudoku(board) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudoku(board)) return true;
            board[row][col] = 0;
          }
        }
        return false; // no valid number found → backtrack
      }
    }
  }
  return true; // all cells filled
}

// Solve with step recording for animation
function solveWithSteps(board) {
  const steps = [];

  function solve(board) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(board, row, col, num)) {
              board[row][col] = num;
              steps.push({ row, col, val: num, type: "place" });
              if (solve(board)) return true;
              board[row][col] = 0;
              steps.push({ row, col, val: 0, type: "backtrack" });
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  const result = solve(board);
  return { solved: result, steps };
}

function validateBoard(board) {
  if (!Array.isArray(board) || board.length !== 9) {
    return { valid: false, error: "Board must be a 9×9 grid." };
  }
  for (let r = 0; r < 9; r++) {
    if (!Array.isArray(board[r]) || board[r].length !== 9) {
      return { valid: false, error: `Row ${r + 1} is not valid.` };
    }
    for (let c = 0; c < 9; c++) {
      const v = board[r][c];
      if (!Number.isInteger(v) || v < 0 || v > 9) {
        return { valid: false, error: `Cell (${r + 1},${c + 1}) has invalid value.` };
      }
    }
  }

  // Check for conflicts in given numbers
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = board[r][c];
      if (v !== 0) {
        board[r][c] = 0;
        if (!isValid(board, r, c, v)) {
          board[r][c] = v;
          return { valid: false, error: `Conflict at cell (${r + 1},${c + 1}) with value ${v}.` };
        }
        board[r][c] = v;
      }
    }
  }
  return { valid: true };
}

// ─── Puzzle Generator ────────────────────────────────────────────────────────

function generateSolved() {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function fill(board) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
          for (const num of nums) {
            if (isValid(board, row, col, num)) {
              board[row][col] = num;
              if (fill(board)) return true;
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  fill(board);
  return board;
}

function generatePuzzle(difficulty = "medium") {
  const solved = generateSolved();
  const puzzle = solved.map(row => [...row]);

  const removeCounts = { easy: 36, medium: 46, hard: 54 };
  const toRemove = removeCounts[difficulty] || 46;

  const positions = [];
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      positions.push([r, c]);

  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  let removed = 0;
  for (const [r, c] of positions) {
    if (removed >= toRemove) break;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;

    // Verify still has unique solution (quick check by solving)
    const testBoard = puzzle.map(row => [...row]);
    if (solveSudoku(testBoard)) {
      removed++;
    } else {
      puzzle[r][c] = backup;
    }
  }

  return { puzzle, solution: solved };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

app.post("/solve-sudoku", (req, res) => {
  const { board, withSteps } = req.body;

  const boardCopy = board.map(row => [...row]);
  const validation = validateBoard(boardCopy);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const workBoard = board.map(row => [...row]);

  if (withSteps) {
    const { solved, steps } = solveWithSteps(workBoard);
    if (!solved) {
      return res.status(400).json({ error: "This puzzle has no solution." });
    }
    return res.json({ board: workBoard, steps });
  } else {
    const solved = solveSudoku(workBoard);
    if (!solved) {
      return res.status(400).json({ error: "This puzzle has no solution." });
    }
    return res.json({ board: workBoard });
  }
});

app.get("/generate", (req, res) => {
  const difficulty = req.query.difficulty || "medium";
  const result = generatePuzzle(difficulty);
  res.json(result);
});

app.get("/health", (_, res) => res.json({ status: "ok" }));

// ─── Start ───────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Sudoku backend running on port ${PORT}`));
