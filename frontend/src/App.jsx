import { useState, useEffect, useRef, useCallback } from "react";

const empty = () => Array.from({ length: 9 }, () => Array(9).fill(0));
const DIFF_LABELS = ["easy", "medium", "hard"];

export default function App() {
  const [board, setBoard] = useState(empty());
  const [given, setGiven] = useState(empty());
  const [highlight, setHighlight] = useState(null);
  const [cellState, setCellState] = useState(empty());
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle");
  const [difficulty, setDifficulty] = useState("medium");
  const [speed, setSpeed] = useState(12);
  const [selected, setSelected] = useState(null);
  const animRef = useRef(null);

  const stopAnimation = useCallback(() => {
    if (animRef.current) clearTimeout(animRef.current);
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
    }
  }

  async function handleGenerate() {
    stopAnimation();
    setError("");
    setStatus("idle");
    try {
      const res = await fetch(`/generate?difficulty=${difficulty}`);
      const { puzzle } = await res.json();
      setBoard(puzzle.map(r => [...r]));
      setGiven(puzzle.map(r => [...r]));
      setCellState(empty());
      setHighlight(null);
    } catch {
      setError("Failed to generate puzzle. Is the backend running?");
    }
  }

  async function handleSolve() {
    if (status === "animating") { stopAnimation(); setStatus("idle"); return; }
    setError("");
    try {
      const res = await fetch("/solve-sudoku", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board, withSteps: true }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setStatus("error"); return; }

      const { steps, board: solvedBoard } = data;
      const workBoard = board.map(r => [...r]);
      const workState = empty();
      let idx = 0;
      setStatus("animating");

      function runStep() {
        if (idx >= steps.length) {
          setBoard(solvedBoard.map(r => [...r]));
          setStatus("solved");
          setCellState(empty());
          setHighlight(null);
          return;
        }
        const { row, col, val, type } = steps[idx++];
        workBoard[row][col] = val;
        workState[row][col] = type === "place" ? "place" : "backtrack";
        setBoard(workBoard.map(r => [...r]));
        setCellState(workState.map(r => [...r]));
        setHighlight({ row, col });
        animRef.current = setTimeout(runStep, speed);
      }
      runStep();
    } catch {
      setError("Backend not reachable. Start with: node backend/server.js");
      setStatus("error");
    }
  }

  useEffect(() => () => stopAnimation(), [stopAnimation]);

  const speedLabel = speed <= 2 ? "Blazing" : speed <= 8 ? "Fast" : speed <= 20 ? "Normal" : "Slow";

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 16px", fontFamily: "'Courier New', monospace", color: "#e2e8f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; }
        .sudoku-grid { display: grid; grid-template-columns: repeat(9,1fr); background: #0f172a; border: 2px solid #38bdf8; border-radius: 12px; overflow: hidden; }
        .cell { width: clamp(36px,6vw,56px); height: clamp(36px,6vw,56px); display: flex; align-items: center; justify-content: center; font-size: clamp(14px,2.2vw,20px); font-weight: 700; font-family: 'Syne', monospace; border: 1px solid #1e293b; cursor: pointer; }
        .cell input { width:100%;height:100%;background:transparent;border:none;color:inherit;font-size:inherit;font-weight:inherit;font-family:inherit;text-align:center;outline:none; }
        .cell.given { color:#e2e8f0;background:#111827; }
        .cell.user  { color:#38bdf8; }
        .cell.place { background:rgba(56,189,248,0.15)!important;color:#38bdf8!important;animation:pp .2s ease; }
        .cell.backtrack { background:rgba(239,68,68,0.12)!important;color:#f87171!important; }
        .cell.solved-glow { background:rgba(52,211,153,0.12)!important;color:#34d399!important; }
        .cell.box-right  { border-right:2px solid #334155; }
        .cell.box-bottom { border-bottom:2px solid #334155; }
        @keyframes pp { from{transform:scale(0.85);opacity:0.5} to{transform:scale(1);opacity:1} }
        .btn { display:inline-flex;align-items:center;gap:6px;padding:10px 22px;border-radius:8px;border:none;font-family:'Syne',monospace;font-weight:700;font-size:13px;letter-spacing:1px;cursor:pointer;transition:all 0.15s;text-transform:uppercase; }
        .btn:active { transform:scale(0.96); }
        .btn-primary { background:linear-gradient(135deg,#38bdf8,#818cf8);color:#0a0a0f; }
        .btn-ghost   { background:#1e293b;color:#94a3b8;border:1px solid #334155; }
        .btn-warn    { background:linear-gradient(135deg,#fbbf24,#f97316);color:#0a0a0f; }
        .diff-btn { padding:6px 14px;border-radius:6px;font-size:12px;font-family:monospace;font-weight:700;text-transform:uppercase;letter-spacing:1px;cursor:pointer;border:1px solid #334155;background:#1e293b;color:#94a3b8;transition:all 0.15s; }
        .diff-btn.active-easy   { background:rgba(52,211,153,0.15);border-color:#34d399;color:#34d399; }
        .diff-btn.active-medium { background:rgba(251,191,36,0.12);border-color:#fbbf24;color:#fbbf24; }
        .diff-btn.active-hard   { background:rgba(239,68,68,0.12);border-color:#f87171;color:#f87171; }
        .error-box   { background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:10px 16px;color:#f87171;font-size:13px;text-align:center;margin-top:12px; }
        .success-box { background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.3);border-radius:8px;padding:10px 16px;color:#34d399;font-size:13px;text-align:center;margin-top:12px; }
      `}</style>

      <h1 style={{ fontFamily:"'Syne',monospace", fontSize:"clamp(28px,5vw,52px)", fontWeight:800, letterSpacing:-2, background:"linear-gradient(135deg,#38bdf8 0%,#818cf8 50%,#e879f9 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", margin:"0 0 4px", textAlign:"center" }}>SUDOKU SOLVER</h1>
      <p style={{ fontSize:12, letterSpacing:4, textTransform:"uppercase", color:"#475569", marginBottom:28 }}>Backtracking Algorithm · Full-Stack</p>

      <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:16, flexWrap:"wrap", justifyContent:"center" }}>
        <span style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:99, fontSize:11, letterSpacing:2, textTransform:"uppercase", fontWeight:700, background: status==="solved"?"rgba(52,211,153,0.15)":status==="animating"?"rgba(56,189,248,0.15)":status==="error"?"rgba(239,68,68,0.15)":"#1e293b", color: status==="solved"?"#34d399":status==="animating"?"#38bdf8":status==="error"?"#f87171":"#475569" }}>
          {status === "animating" ? "Solving..." : status === "solved" ? "✓ Solved!" : status === "error" ? "Error" : "Ready"}
        </span>
        <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:12, color:"#475569" }}>
          <span>Speed:</span>
          <input type="range" min={1} max={80} value={81 - speed} onChange={e => setSpeed(81 - parseInt(e.target.value))} style={{ width:100, accentColor:"#38bdf8" }} />
          <span style={{ color:"#94a3b8", fontWeight:700, minWidth:52 }}>{speedLabel}</span>
        </div>
      </div>

      <div style={{ border:"2px solid #38bdf8", borderRadius:12, overflow:"hidden" }}>
        <div className="sudoku-grid">
          {Array.from({ length: 9 }, (_, r) =>
            Array.from({ length: 9 }, (_, c) => {
              const val = board[r][c];
              const isGiven = given[r][c] !== 0;
              const cs = cellState[r][c];
              const isSolved = status === "solved" && !isGiven && val !== 0;
              let cls = "cell";
              if (isGiven) cls += " given"; else if (val !== 0) cls += " user";
              if (cs === "place") cls += " place"; else if (cs === "backtrack") cls += " backtrack";
              if (isSolved && !cs) cls += " solved-glow";
              if (c === 2 || c === 5) cls += " box-right";
              if (r === 2 || r === 5) cls += " box-bottom";
              return (
                <div key={`${r}-${c}`} className={cls}>
                  {isGiven || status === "animating" ? <span>{val || ""}</span> : (
                    <input type="text" maxLength={1} value={val || ""} onChange={e => handleInput(r, c, e.target.value.replace(/[^1-9]/g,""))} id={`cell-${r}-${c}`}
                      onKeyDown={e => {
                        if (e.key==="Backspace") handleInput(r,c,"");
                        if (e.key==="ArrowRight"&&c<8) document.getElementById(`cell-${r}-${c+1}`)?.focus();
                        if (e.key==="ArrowLeft"&&c>0)  document.getElementById(`cell-${r}-${c-1}`)?.focus();
                        if (e.key==="ArrowDown"&&r<8)  document.getElementById(`cell-${r+1}-${c}`)?.focus();
                        if (e.key==="ArrowUp"&&r>0)    document.getElementById(`cell-${r-1}-${c}`)?.focus();
                      }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {error && <div className="error-box">⚠ {error}</div>}
      {status === "solved" && !error && <div className="success-box">✓ Puzzle solved using backtracking algorithm!</div>}

      <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center", marginTop:18 }}>
        <button className="btn btn-primary" onClick={handleSolve}>{status === "animating" ? "⏹ Stop" : "▶ Solve"}</button>
        <button className="btn btn-ghost" onClick={reset}>↺ Clear</button>
      </div>

      <div style={{ marginTop:18, textAlign:"center" }}>
        <div style={{ fontSize:11, color:"#475569", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Generate Puzzle</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center" }}>
          {DIFF_LABELS.map(d => <button key={d} className={`diff-btn ${difficulty===d?`active-${d}`:""}`} onClick={() => setDifficulty(d)}>{d}</button>)}
          <button className="btn btn-warn" onClick={handleGenerate}>✦ Generate</button>
        </div>
      </div>
    </div>
  );
}