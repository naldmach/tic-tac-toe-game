"use client";
import React, { useState, useRef } from "react";

const emptyBoard = Array(9).fill(null);

type GameMode = "AI" | "2P";

type Score = {
  X: number;
  O: number;
  Draws: number;
};

function calculateWinner(squares: (string | null)[]) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (
      squares[a] &&
      squares[a] === squares[b] &&
      squares[a] === squares[c]
    ) {
      return squares[a];
    }
  }
  return null;
}

function getAvailableMoves(board: (string | null)[]) {
  return board.map((v, i) => (v === null ? i : null)).filter((v) => v !== null) as number[];
}

function getRandomMove(board: (string | null)[]) {
  const moves = getAvailableMoves(board);
  if (moves.length === 0) return null;
  const idx = Math.floor(Math.random() * moves.length);
  return moves[idx];
}

function findBlockingMove(board: (string | null)[], ai: string, opponent: string) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const line of lines) {
    const [a, b, c] = line;
    const values = [board[a], board[b], board[c]];
    // If opponent has two and the third is empty, block it
    if (
      values.filter((v) => v === opponent).length === 2 &&
      values.includes(null)
    ) {
      const emptyIndex = line[values.indexOf(null)];
      return emptyIndex;
    }
  }
  return null;
}

// Minimax algorithm for perfect AI
function minimax(board: (string | null)[], depth: number, isMaximizing: boolean, ai: string, human: string): { score: number, move: number | null } {
  const winner = calculateWinner(board);
  if (winner === ai) return { score: 10 - depth, move: null };
  if (winner === human) return { score: depth - 10, move: null };
  if (board.every(Boolean)) return { score: 0, move: null }; // Draw

  let bestMove: number | null = null;

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < board.length; i++) {
      if (!board[i]) {
        board[i] = ai;
        const { score } = minimax(board, depth + 1, false, ai, human);
        board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return { score: bestScore, move: bestMove };
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < board.length; i++) {
      if (!board[i]) {
        board[i] = human;
        const { score } = minimax(board, depth + 1, true, ai, human);
        board[i] = null;
        if (score < bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return { score: bestScore, move: bestMove };
  }
}

export default function TicTacToe() {
  const [gameStarted, setGameStarted] = useState(false);
  const [mode, setMode] = useState<GameMode | null>(null);
  const [board, setBoard] = useState<(string | null)[]>(emptyBoard);
  const [xIsNext, setXIsNext] = useState(true);
  const [score, setScore] = useState<Score>({ X: 0, O: 0, Draws: 0 });
  const [scoreAnim, setScoreAnim] = useState<{X: boolean, O: boolean, Draws: boolean}>({X: false, O: false, Draws: false});
  const [darkMode, setDarkMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const winner = calculateWinner(board);
  const prevScore = useRef(score);

  // AI move effect
  React.useEffect(() => {
    if (gameStarted && mode === "AI" && !winner && !xIsNext) {
      // AI is always O, player is X
      const ai = "O";
      const human = "X";
      // Count how many O's and X's are on the board
      const xCount = board.filter((v) => v === "X").length;
      const oCount = board.filter((v) => v === "O").length;
      let aiMove: number | null = null;
      // If it's the AI's first move (second move of the game)
      if (xCount === 1 && oCount === 0) {
        // Pick center if available
        if (!board[4]) {
          aiMove = 4;
        } else {
          // Pick a random corner
          const corners = [0, 2, 6, 8].filter((i) => !board[i]);
          if (corners.length > 0) {
            aiMove = corners[Math.floor(Math.random() * corners.length)];
          }
        }
      } else {
        // Use minimax for all other moves
        const { move: bestMove } = minimax(board.slice(), 0, true, ai, human);
        if (bestMove !== null && !board[bestMove]) {
          aiMove = bestMove;
        }
      }
      if (aiMove !== null && !board[aiMove]) {
        setTimeout(() => {
          handleClick(aiMove!);
        }, 500);
      }
    }
  }, [board, xIsNext, winner, gameStarted, mode]);

  React.useEffect(() => {
    if (winner) {
      setLastResult(`Winner: ${winner}`);
      setShowModal(true);
      setScore((prev) => {
        const newScore = { ...prev, [winner]: prev[winner as "X" | "O"] + 1 };
        setScoreAnim((a) => ({ ...a, [winner]: true }));
        setTimeout(() => setScoreAnim((a) => ({ ...a, [winner]: false })), 800);
        prevScore.current = newScore;
        return newScore;
      });
    } else if (gameStarted && board.every(Boolean)) {
      setLastResult("Draw!");
      setShowModal(true);
      setScore((prev) => {
        const newScore = { ...prev, Draws: prev.Draws + 1 };
        setScoreAnim((a) => ({ ...a, Draws: true }));
        setTimeout(() => setScoreAnim((a) => ({ ...a, Draws: false })), 800);
        prevScore.current = newScore;
        return newScore;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner, board, gameStarted]);

  function handleStart(selectedMode: GameMode) {
    setMode(selectedMode);
    setGameStarted(true);
    setBoard(emptyBoard);
    setXIsNext(true);
  }

  function handleClick(index: number) {
    if (board[index] || winner) return;
    const newBoard = board.slice();
    newBoard[index] = xIsNext ? "X" : "O";
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  }

  function handleReset() {
    setBoard(emptyBoard);
    setXIsNext(true);
  }

  function handleNextRound() {
    setBoard(emptyBoard);
    setXIsNext(true);
    setShowModal(false);
    setLastResult(null);
  }

  function handleNewGame() {
    setGameStarted(false);
    setMode(null);
    setBoard(emptyBoard);
    setXIsNext(true);
    setScore({ X: 0, O: 0, Draws: 0 });
    setShowModal(false);
    setLastResult(null);
  }

  function handleRestartGame() {
    setGameStarted(false);
    setMode(null);
    setBoard(emptyBoard);
    setXIsNext(true);
  }

  function renderSquare(index: number) {
    const value = board[index];
    return (
      <button
        key={index}
        className="w-20 h-20 text-3xl font-bold border-2 border-gray-400 bg-white hover:bg-blue-100 transition disabled:opacity-50 rounded shadow flex items-center justify-center animate-fadeIn"
        style={{animationDelay: `${index * 0.05 + 0.1}s`}}
        onClick={() => handleClick(index)}
        disabled={!!value || !!winner || (mode === "AI" && !xIsNext)}
      >
        <span
          className={
            value === "X"
              ? "scale-in text-blue-600"
              : value === "O"
              ? "scale-in text-green-600"
              : ""
          }
        >
          {value}
        </span>
      </button>
    );
  }

  let status;
  if (winner) {
    status = `Winner: ${winner}`;
  } else if (board.every(Boolean)) {
    status = "Draw!";
  } else {
    status = `Next player: ${xIsNext ? "X" : "O"}`;
  }

  if (!gameStarted) {
    return (
      <div className={`flex flex-col items-center gap-6 p-8 rounded-lg shadow-lg animate-fadeIn transition-colors duration-500 ${darkMode ? "bg-gray-900" : "bg-white/80"}`}>
        <button
          className="self-end mb-2 p-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
          aria-label="Toggle dark mode"
          onClick={() => setDarkMode((d) => !d)}
        >
          {darkMode ? (
            <span role="img" aria-label="Light mode">☀️</span>
          ) : (
            <span role="img" aria-label="Dark mode">🌙</span>
          )}
        </button>
        <h2 className={`text-2xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>Start Tic-Tac-Toe</h2>
        <div className="flex gap-4">
          <button
            className="px-6 py-3 bg-blue-500 text-white rounded-lg text-lg font-semibold shadow hover:bg-blue-600 transition transform hover:scale-105 duration-200"
            onClick={() => handleStart("AI")}
          >
            Play vs AI
          </button>
          <button
            className="px-6 py-3 bg-green-500 text-white rounded-lg text-lg font-semibold shadow hover:bg-green-600 transition transform hover:scale-105 duration-200"
            onClick={() => handleStart("2P")}
          >
            2 Players
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-6 p-8 rounded-lg shadow-lg w-full max-w-md animate-fadeIn transition-colors duration-500 ${darkMode ? "bg-gray-900" : "bg-white/80"}`}>
      <button
        className="self-end mb-2 p-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
        aria-label="Toggle dark mode"
        onClick={() => setDarkMode((d) => !d)}
      >
        {darkMode ? (
          <span role="img" aria-label="Light mode">☀️</span>
        ) : (
          <span role="img" aria-label="Dark mode">🌙</span>
        )}
      </button>
      <div className="flex justify-between w-full mb-2">
        <div className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>Mode: {mode === "AI" ? "Player vs AI" : "2 Players"}</div>
        <button
          className="text-blue-400 underline hover:text-blue-200 text-sm"
          onClick={handleRestartGame}
        >
          Change Mode
        </button>
      </div>
      <div className="flex flex-col items-center w-full">
        <div className={`font-bold text-xl mb-2 transition-all duration-500 ${darkMode ? "text-white" : "text-gray-900"}`}>{status}</div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {Array.from({ length: 9 }, (_, i) => renderSquare(i))}
        </div>
      </div>
      <div className="flex flex-col items-center w-full">
        <div className={`mb-2 font-semibold text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>Scoreboard</div>
        <div className="flex justify-around w-full text-base">
          <div className={`flex flex-col items-center transition-all duration-500 ${scoreAnim.X ? "animate-scorePop" : ""}`}>
            <span className="font-bold text-blue-400">X</span>
            <span className={darkMode ? "text-white" : "text-gray-900"}>{score.X}</span>
          </div>
          <div className={`flex flex-col items-center transition-all duration-500 ${scoreAnim.O ? "animate-scorePop" : ""}`}>
            <span className="font-bold text-green-400">O</span>
            <span className={darkMode ? "text-white" : "text-gray-900"}>{score.O}</span>
          </div>
          <div className={`flex flex-col items-center transition-all duration-500 ${scoreAnim.Draws ? "animate-scorePop" : ""}`}>
            <span className="font-bold text-gray-400">Draws</span>
            <span className={darkMode ? "text-white" : "text-gray-900"}>{score.Draws}</span>
          </div>
        </div>
      </div>
      <button
        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold shadow transform hover:scale-105 duration-200"
        onClick={handleReset}
        disabled={!board.some(Boolean) || !!winner}
      >
        Reset Board
      </button>
      {/* Modal for winner/draw */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 flex flex-col items-center gap-4 animate-fadeIn`}> 
            <div className="text-2xl font-bold mb-2 text-center">
              {lastResult}
            </div>
            <div className="flex gap-4 mt-2">
              <button
                className="px-5 py-2 bg-blue-500 text-white rounded-lg font-semibold shadow hover:bg-blue-600 transition"
                onClick={handleNextRound}
              >
                Next Round
              </button>
              <button
                className="px-5 py-2 bg-gray-300 text-gray-900 rounded-lg font-semibold shadow hover:bg-gray-400 transition dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                onClick={handleNewGame}
              >
                New Game
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.7s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes scaleIn {
          from { transform: scale(0.7); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .scale-in {
          animation: scaleIn 0.3s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes bounceIn {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
        }
        .animate-bounceIn {
          animation: bounceIn 0.7s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes scorePop {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); color: #f59e42; }
          100% { transform: scale(1); }
        }
        .animate-scorePop {
          animation: scorePop 0.7s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
    </div>
  );
}