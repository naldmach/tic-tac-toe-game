import TicTacToe from "./TicTacToe";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8">
      <h1 className="text-3xl font-bold mb-4">Tic-Tac-Toe</h1>
      <TicTacToe />
    </div>
  );
}
