import { useState, useEffect, useRef, useCallback } from "react";

// ─── Sudoku Engine (mirrors the backend logic) ────────────────────────────────

function isValid(board, row, col, num) {
  for (let c = 0; c < 9; c++) if (board[row][c] === num) return false;
  for (let r = 0; r < 9; r++) if (board[r][col] === num) return false;
  const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      if (board[br + r][bc + c] === num) return false;
  return true;
}

function solveWithSteps(initBoard) {
  const board = initBoard.map(r => [...r]);
  const steps = [];
  function solve() {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(board, row, col, num)) {
              board[row][col] = num;
              steps.push({ row, col, val: num, type: "place" });
              if (solve()) return true;
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
  const solved = solve();
  return { solved, steps, board };
}

function validateBoard(board) {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) {
      const v = board[r][c];
      if (v !== 0) {
        board[r][c] = 0;
        if (!isValid(board, r, c, v)) {
          board[r][c] = v;
          return { valid: false, error: `Conflict at row ${r + 1}, col ${c + 1} (value ${v})` };
        }
        board[r][c] = v;
      }
    }
  return { valid: true };
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateSolved() {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));
  function fill() {
    for (let row = 0; row < 9; row++)
      for (let col = 0; col < 9; col++)
        if (board[row][col] === 0) {
          for (const num of shuffle([1,2,3,4,5,6,7,8,9])) {
            if (isValid(board, row, col, num)) {
              board[row][col] = num;
              if (fill()) return true;
              board[row][col] = 0;
            }
          }
          return false;
        }
    return true;
  }
  fill();
  return board;
}

function generatePuzzle(difficulty = "medium") {
  const solution = generateSolved();
  const puzzle = solution.map(r => [...r]);
  const counts = { easy: 32, medium: 45, hard: 54 };
  const toRemove = counts[difficulty] || 45;
  const positions = shuffle([...Array(81)].map((_, i) => [Math.floor(i / 9), i % 9]));
  let removed = 0;
  for (const [r, c] of positions) {
    if (removed >= toRemove) break;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;
    const test = puzzle.map(row => [...row]);
    let count = 0;
    function countSolutions(b) {
      if (count > 1) return;
      for (let row = 0; row < 9; row++)
        for (let col = 0; col < 9; col++)
          if (b[row][col] === 0) {
            for (let n = 1; n <= 9; n++)
              if (isValid(b, row, col, n)) {
                b[row][col] = n;
                countSolutions(b);
                b[row][col] = 0;
              }
            return;
          }
      count++;
    }
    countSolutions(test);
    if (count === 1) removed++;
    else puzzle[r][c] = backup;
  }
  return { puzzle, solution };
}

const empty = () => Array.from({ length: 9 }, () => Array(9).fill(0));

// ─── Component ────────────────────────────────────────────────────────────────

const DIFF_LABELS = ["easy", "medium", "hard"];

export default function SudokuSolver() {
  const [board, setBoard] = useState(empty());
  const [given, setGiven] = useState(empty());       // cells from puzzle gen
  const [highlight, setHighlight] = useState(null);  // {row,col}
  const [cellState, setCellState] = useState(empty()); // "solve"|"backtrack"|""
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle");      // idle|animating|solved|error
  const [difficulty, setDifficulty] = useState("medium");
  const [speed, setSpeed] = useState(12);            // ms per step (lower = faster)
  const [selected, setSelected] = useState(null);
  const animRef = useRef(null);
  const stepsRef = useRef([]);
  const stepIdxRef = useRef(0);

  const stopAnimation = useCallback(() => {
    if (animRef.current) clearTimeout(animRef.current);
    animRef.current = null;
  }, []);

  function reset() {
    stopAnimation();
    setBoard(empty());
    setGiven(empty());
    setCellState(empty());
    setHighlight(null);
    setError("");
    setStatus("idle");
    setSelected(null);
  }

  function handleInput(r, c, val) {
    if (status === "animating") return;
    const num = parseInt(val);
    if (val === "" || (num >= 1 && num <= 9)) {
      const nb = board.map(row => [...row]);
      nb[r][c] = val === "" ? 0 : num;
      setBoard(nb);
      setError("");
      setStatus("idle");
      // clear cell highlight
      const ns = cellState.map(row => [...row]);
      ns[r][c] = "";
      setCellState(ns);
    }
  }

  function handleGenerate() {
    stopAnimation();
    setError("");
    setStatus("idle");
    const { puzzle, solution: _ } = generatePuzzle(difficulty);
    setBoard(puzzle.map(r => [...r]));
    setGiven(puzzle.map(r => [...r]));
    setCellState(empty());
    setHighlight(null);
    setSelected(null);
  }

  function handleSolve() {
    if (status === "animating") { stopAnimation(); setStatus("idle"); return; }
    setError("");
    const copy = board.map(r => [...r]);
    const validation = validateBoard(copy.map(r => [...r]));
    if (!validation.valid) { setError(validation.error); setStatus("error"); return; }
    const { solved, steps, board: solvedBoard } = solveWithSteps(copy);
    if (!solved) { setError("This puzzle has no solution."); setStatus("error"); return; }

    stepsRef.current = steps;
    stepIdxRef.current = 0;
    setStatus("animating");

    const workBoard = board.map(r => [...r]);
    const workState = empty();

    function runStep() {
      if (stepIdxRef.current >= stepsRef.current.length) {
        setStatus("solved");
        setCellState(empty());
        setHighlight(null);
        return;
      }
      const { row, col, val, type } = stepsRef.current[stepIdxRef.current++];
      workBoard[row][col] = val;
      workState[row][col] = type === "place" ? "place" : "backtrack";
      setBoard(workBoard.map(r => [...r]));
      setCellState(workState.map(r => [...r]));
      setHighlight({ row, col });
      animRef.current = setTimeout(runStep, speed);
    }
    runStep();
  }

  function handleCellClick(r, c) {
    if (status !== "animating") setSelected({ r, c });
  }

  useEffect(() => () => stopAnimation(), [stopAnimation]);

  // Speed label
  const speedLabel = speed <= 2 ? "Blazing" : speed <= 8 ? "Fast" : speed <= 20 ? "Normal" : "Slow";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 16px",
      fontFamily: "'Courier New', 'Lucida Console', monospace",
      color: "#e2e8f0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');

        * { box-sizing: border-box; }

        .sudoku-title {
          font-family: 'Syne', monospace;
          font-size: clamp(28px, 5vw, 52px);
          font-weight: 800;
          letter-spacing: -2px;
          background: linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #e879f9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0 0 4px;
          text-align: center;
        }

        .sudoku-sub {
          font-size: 12px;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: #475569;
          margin-bottom: 28px;
          text-align: center;
        }

        .grid-wrapper {
          position: relative;
          display: inline-block;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 0 60px rgba(56,189,248,0.08), 0 0 0 1px #1e293b;
        }

        .sudoku-grid {
          display: grid;
          grid-template-columns: repeat(9, 1fr);
          gap: 0;
          background: #0f172a;
          border: 2px solid #38bdf8;
          border-radius: 12px;
          overflow: hidden;
        }

        .cell {
          width: clamp(36px, 6vw, 56px);
          height: clamp(36px, 6vw, 56px);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: clamp(14px, 2.2vw, 20px);
          font-weight: 700;
          font-family: 'Syne', monospace;
          border: 1px solid #1e293b;
          cursor: pointer;
          transition: background 0.08s, color 0.08s, transform 0.08s;
          user-select: none;
          position: relative;
          outline: none;
        }

        .cell input {
          width: 100%; height: 100%;
          background: transparent;
          border: none;
          color: inherit;
          font-size: inherit;
          font-weight: inherit;
          font-family: inherit;
          text-align: center;
          outline: none;
          caret-color: #38bdf8;
          padding: 0;
        }

        /* thick borders for 3x3 boxes */
        .cell.box-right  { border-right: 2px solid #334155; }
        .cell.box-bottom { border-bottom: 2px solid #334155; }

        .cell.given { color: #e2e8f0; background: #111827; }
        .cell.user  { color: #38bdf8; background: #0f172a; }

        .cell.place {
          background: rgba(56,189,248,0.15) !important;
          color: #38bdf8 !important;
          animation: pulse-place 0.2s ease;
        }
        .cell.backtrack {
          background: rgba(239,68,68,0.12) !important;
          color: #f87171 !important;
          animation: pulse-bt 0.15s ease;
        }
        .cell.solved-glow {
          background: rgba(52,211,153,0.12) !important;
          color: #34d399 !important;
        }

        .cell.selected { box-shadow: inset 0 0 0 2px #818cf8; z-index: 2; }

        @keyframes pulse-place {
          0%  { transform: scale(0.85); opacity: 0.5; }
          100%{ transform: scale(1);    opacity: 1; }
        }
        @keyframes pulse-bt {
          0%  { transform: scale(1.1); }
          100%{ transform: scale(1); }
        }
        @keyframes success-wave {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.06); }
          100% { transform: scale(1); }
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 22px;
          border-radius: 8px;
          border: none;
          font-family: 'Syne', monospace;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.15s;
          text-transform: uppercase;
        }
        .btn:active { transform: scale(0.96); }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .btn-primary {
          background: linear-gradient(135deg, #38bdf8, #818cf8);
          color: #0a0a0f;
          box-shadow: 0 4px 20px rgba(56,189,248,0.25);
        }
        .btn-primary:hover:not(:disabled) { box-shadow: 0 4px 28px rgba(56,189,248,0.5); }

        .btn-danger {
          background: linear-gradient(135deg, #f87171, #e879f9);
          color: #0a0a0f;
        }

        .btn-ghost {
          background: #1e293b;
          color: #94a3b8;
          border: 1px solid #334155;
        }
        .btn-ghost:hover:not(:disabled) { background: #263248; color: #e2e8f0; }

        .btn-warn {
          background: linear-gradient(135deg, #fbbf24, #f97316);
          color: #0a0a0f;
        }

        .error-box {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 8px;
          padding: 10px 16px;
          color: #f87171;
          font-size: 13px;
          text-align: center;
          margin-top: 12px;
          animation: fadein 0.2s ease;
        }

        .success-box {
          background: rgba(52,211,153,0.1);
          border: 1px solid rgba(52,211,153,0.3);
          border-radius: 8px;
          padding: 10px 16px;
          color: #34d399;
          font-size: 13px;
          text-align: center;
          margin-top: 12px;
          animation: fadein 0.3s ease;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 99px;
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          font-weight: 700;
        }
        .pill-idle     { background: #1e293b; color: #475569; }
        .pill-animating{ background: rgba(56,189,248,0.15); color: #38bdf8; }
        .pill-solved   { background: rgba(52,211,153,0.15); color: #34d399; }
        .pill-error    { background: rgba(239,68,68,0.15);  color: #f87171; }

        .dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          display: inline-block;
        }
        .dot-animating { background: #38bdf8; animation: blink 0.8s infinite; }
        .dot-solved    { background: #34d399; }
        .dot-error     { background: #f87171; }
        .dot-idle      { background: #475569; }

        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes fadein { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }

        .controls-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          align-items: center;
        }

        .diff-btn {
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-family: monospace;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          border: 1px solid #334155;
          background: #1e293b;
          color: #94a3b8;
          transition: all 0.15s;
        }
        .diff-btn.active-easy   { background: rgba(52,211,153,0.15); border-color: #34d399; color: #34d399; }
        .diff-btn.active-medium { background: rgba(251,191,36,0.12);  border-color: #fbbf24; color: #fbbf24; }
        .diff-btn.active-hard   { background: rgba(239,68,68,0.12);   border-color: #f87171; color: #f87171; }

        .speed-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: #475569;
        }
        .speed-row input[type=range] {
          -webkit-appearance: none;
          width: 100px;
          height: 4px;
          border-radius: 4px;
          background: #1e293b;
          outline: none;
          border: 1px solid #334155;
        }
        .speed-row input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: #38bdf8;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(56,189,248,0.5);
        }

        .legend {
          display: flex;
          gap: 16px;
          font-size: 11px;
          color: #475569;
          flex-wrap: wrap;
          justify-content: center;
        }
        .legend-item { display: flex; align-items: center; gap: 5px; }
        .legend-dot  { width: 8px; height: 8px; border-radius: 2px; }
      `}</style>

      <h1 className="sudoku-title">SUDOKU SOLVER</h1>
      <p className="sudoku-sub">Backtracking Algorithm · Step-by-step Animation</p>

      {/* Status + Speed */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap", justifyContent: "center" }}>
        <span className={`status-pill pill-${status}`}>
          <span className={`dot dot-${status}`} />
          {status === "animating" ? "Solving..." : status === "solved" ? "Solved!" : status === "error" ? "Error" : "Ready"}
        </span>
        <div className="speed-row">
          <span>Speed:</span>
          <input type="range" min={1} max={80} value={81 - speed}
            onChange={e => setSpeed(81 - parseInt(e.target.value))} />
          <span style={{ color: "#94a3b8", fontWeight: 700, minWidth: 52 }}>{speedLabel}</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid-wrapper">
        <div className="sudoku-grid">
          {Array.from({ length: 9 }, (_, r) =>
            Array.from({ length: 9 }, (_, c) => {
              const val = board[r][c];
              const isGiven = given[r][c] !== 0;
              const cs = cellState[r][c];
              const isHL = highlight && highlight.row === r && highlight.col === c;
              const isSel = selected && selected.r === r && selected.c === c;
              const isSolved = status === "solved" && !isGiven && val !== 0;

              let cls = "cell";
              if (isGiven) cls += " given";
              else if (val !== 0) cls += " user";
              if (cs === "place") cls += " place";
              else if (cs === "backtrack") cls += " backtrack";
              if (isSolved && !cs) cls += " solved-glow";
              if (isSel) cls += " selected";

              // thick box borders
              if (c === 2 || c === 5) cls += " box-right";
              if (r === 2 || r === 5) cls += " box-bottom";

              return (
                <div key={`${r}-${c}`} className={cls}
                  onClick={() => handleCellClick(r, c)}
                  style={{
                    transition: isHL ? "none" : "background 0.3s, color 0.3s",
                  }}>
                  {isGiven || status === "animating" ? (
                    <span>{val !== 0 ? val : ""}</span>
                  ) : (
                    <input
                      type="text"
                      maxLength={1}
                      value={val !== 0 ? val : ""}
                      onChange={e => handleInput(r, c, e.target.value.replace(/[^1-9]/g, ""))}
                      onFocus={() => setSelected({ r, c })}
                      onKeyDown={e => {
                        if (e.key === "Backspace" || e.key === "Delete") handleInput(r, c, "");
                        if (e.key === "ArrowRight" && c < 8) document.getElementById(`cell-${r}-${c+1}`)?.focus();
                        if (e.key === "ArrowLeft"  && c > 0) document.getElementById(`cell-${r}-${c-1}`)?.focus();
                        if (e.key === "ArrowDown"  && r < 8) document.getElementById(`cell-${r+1}-${c}`)?.focus();
                        if (e.key === "ArrowUp"    && r > 0) document.getElementById(`cell-${r-1}-${c}`)?.focus();
                      }}
                      id={`cell-${r}-${c}`}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Error / Success */}
      {error && <div className="error-box">⚠ {error}</div>}
      {status === "solved" && !error && <div className="success-box">✓ Puzzle solved using backtracking!</div>}

      {/* Action Buttons */}
      <div className="controls-row" style={{ marginTop: 18 }}>
        <button className="btn btn-primary" onClick={handleSolve}
          disabled={status === "animating" && false}>
          {status === "animating" ? "⏹ Stop" : "▶ Solve"}
        </button>
        <button className="btn btn-ghost" onClick={reset}>↺ Clear</button>
      </div>

      {/* Generate Section */}
      <div style={{ marginTop: 18, textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
          Generate Puzzle
        </div>
        <div className="controls-row">
          {DIFF_LABELS.map(d => (
            <button key={d} className={`diff-btn ${difficulty === d ? `active-${d}` : ""}`}
              onClick={() => setDifficulty(d)}>{d}</button>
          ))}
          <button className="btn btn-warn" onClick={handleGenerate}>✦ Generate</button>
        </div>
      </div>

      {/* Legend */}
      <div className="legend" style={{ marginTop: 20 }}>
        <div className="legend-item"><div className="legend-dot" style={{ background: "#1e293b", border: "1px solid #334155" }} /><span>Given</span></div>
        <div className="legend-item"><div className="legend-dot" style={{ background: "rgba(56,189,248,0.3)" }} /><span>Placing</span></div>
        <div className="legend-item"><div className="legend-dot" style={{ background: "rgba(239,68,68,0.25)" }} /><span>Backtracking</span></div>
        <div className="legend-item"><div className="legend-dot" style={{ background: "rgba(52,211,153,0.25)" }} /><span>Solved</span></div>
      </div>
    </div>
  );
}