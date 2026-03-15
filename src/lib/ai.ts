
import {
  ThaiCheckers8,
  Move,
} from "./thai-checkers";
import { TFLiteValueModel } from "./tflite-value";

export async function negamaxWithValue(
  game: ThaiCheckers8,
  board: number[][],
  player: number,
  depth: number,
  alpha: number,
  beta: number,
  valueModel: TFLiteValueModel
): Promise<number> {
  const winner = game.getWinner(board, player);
  if (winner === player) return 1.0;
  if (winner === -player) return -1.0;

  if (depth === 0) {
    const state = game.encodeCanonical(board, player);
    return await valueModel.predictValue(state);
  }

  const legalMoves = game.getLegalMoves(board, player);
  if (legalMoves.length === 0) return -1.0;

  legalMoves.sort(
    (a, b) =>
      (b.captures.length - a.captures.length) ||
      (b.path.length - a.path.length)
  );

  let value = -1e9;

  for (const mv of legalMoves) {
    const nextBoard = game.applyMove(board, mv);
    const score = -(
      await negamaxWithValue(
        game,
        nextBoard,
        -player,
        depth - 1,
        -beta,
        -alpha,
        valueModel
      )
    );

    if (score > value) value = score;
    if (value > alpha) alpha = value;
    if (alpha >= beta) break;
  }

  return value;
}

export async function chooseMoveSearch(
  game: ThaiCheckers8,
  board: number[][],
  player: number,
  depth: number,
  valueModel: TFLiteValueModel
): Promise<Move> {
  const legalMoves = game.getLegalMoves(board, player);
  if (legalMoves.length === 0) {
    throw new Error("ไม่มีตาเดิน");
  }

  legalMoves.sort(
    (a, b) =>
      (b.captures.length - a.captures.length) ||
      (b.path.length - a.path.length)
  );

  let bestMove = legalMoves[0];
  let bestScore = -1e9;

  for (const mv of legalMoves) {
    const nextBoard = game.applyMove(board, mv);
    const score = -(
      await negamaxWithValue(
        game,
        nextBoard,
        -player,
        depth - 1,
        -1e9,
        1e9,
        valueModel
      )
    );

    if (score > bestScore) {
      bestScore = score;
      bestMove = mv;
    }
  }

  return bestMove;
}
