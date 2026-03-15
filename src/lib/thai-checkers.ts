
export const BOARD_SIZE = 8;

export const EMPTY = 0;
export const P1_MAN = 1;
export const P1_KING = 2;
export const P2_MAN = -1;
export const P2_KING = -2;

export const PLAYER_1 = 1;
export const PLAYER_2 = -1;

export type Pos = [number, number];

export type Move = {
  path: Pos[];
  captures: Pos[];
};

export class ThaiCheckers8 {
  createInitialBoard(): number[][] {
    const board = Array.from({ length: BOARD_SIZE }, () =>
      Array(BOARD_SIZE).fill(EMPTY)
    );

    const p2Positions: Pos[] = [
      [0, 1], [0, 3], [0, 5], [0, 7],
      [1, 0], [1, 2], [1, 4], [1, 6],
    ];

    const p1Positions: Pos[] = [
      [6, 1], [6, 3], [6, 5], [6, 7],
      [7, 0], [7, 2], [7, 4], [7, 6],
    ];

    for (const [r, c] of p2Positions) board[r][c] = P2_MAN;
    for (const [r, c] of p1Positions) board[r][c] = P1_MAN;

    return board;
  }

  cloneBoard(board: number[][]): number[][] {
    return board.map((row) => [...row]);
  }

  inBounds(r: number, c: number): boolean {
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
  }

  isDarkSquare(r: number, c: number): boolean {
    return (r + c) % 2 === 1;
  }

  owner(piece: number): number {
    if (piece > 0) return 1;
    if (piece < 0) return -1;
    return 0;
  }

  isKing(piece: number): boolean {
    return Math.abs(piece) === 2;
  }

  shouldPromote(piece: number, r: number): boolean {
    return (piece === P1_MAN && r === 0) || (piece === P2_MAN && r === 7);
  }

  promotePiece(piece: number): number {
    if (piece === P1_MAN) return P1_KING;
    if (piece === P2_MAN) return P2_KING;
    return piece;
  }

  countPieces(board: number[][], player: number): number {
    let total = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (this.owner(board[r][c]) === player) total++;
      }
    }
    return total;
  }

  countKings(board: number[][], player: number): number {
    let total = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = board[r][c];
        if (this.owner(piece) === player && this.isKing(piece)) total++;
      }
    }
    return total;
  }

  boardToKey(board: number[][], player: number): string {
    const flat: string[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        flat.push(String(board[r][c] * player));
      }
    }
    return flat.join(",");
  }

  encodeCanonical(board: number[][], player: number): Float32Array {
    // shape = [8,8,5]
    const x = new Float32Array(BOARD_SIZE * BOARD_SIZE * 5);

    const set = (r: number, c: number, ch: number, value: number) => {
      const idx = (r * BOARD_SIZE + c) * 5 + ch;
      x[idx] = value;
    };

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = board[r][c] * player;

        if (piece === P1_MAN) set(r, c, 0, 1);
        else if (piece === P1_KING) set(r, c, 1, 1);
        else if (piece === P2_MAN) set(r, c, 2, 1);
        else if (piece === P2_KING) set(r, c, 3, 1);

        if (this.isDarkSquare(r, c)) set(r, c, 4, 1);
      }
    }

    return x;
  }

  getLegalMoves(board: number[][], player: number): Move[] {
    const captureMoves: Move[] = [];
    const simpleMoves: Move[] = [];

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = board[r][c];
        if (this.owner(piece) !== player) continue;

        if (Math.abs(piece) === 1) {
          const caps = this.getManCaptureSequences(board, r, c);
          if (caps.length > 0) captureMoves.push(...caps);
          else simpleMoves.push(...this.getManSimpleMoves(board, r, c));
        } else {
          const caps = this.getKingCaptureSequences(board, r, c);
          if (caps.length > 0) captureMoves.push(...caps);
          else simpleMoves.push(...this.getKingSimpleMoves(board, r, c));
        }
      }
    }

    return captureMoves.length > 0 ? captureMoves : simpleMoves;
  }

  getManSimpleMoves(board: number[][], r: number, c: number): Move[] {
    const piece = board[r][c];
    if (Math.abs(piece) !== 1) return [];

    const dr = piece > 0 ? -1 : 1;
    const moves: Move[] = [];

    for (const dc of [-1, 1]) {
      const nr = r + dr;
      const nc = c + dc;
      if (
        this.inBounds(nr, nc) &&
        this.isDarkSquare(nr, nc) &&
        board[nr][nc] === EMPTY
      ) {
        moves.push({ path: [[r, c], [nr, nc]], captures: [] });
      }
    }

    return moves;
  }

  getManCaptureSequences(board: number[][], r: number, c: number): Move[] {
    const piece = board[r][c];
    const side = this.owner(piece);
    const results: Move[] = [];

    const dfs = (
      curBoard: number[][],
      cr: number,
      cc: number,
      path: Pos[],
      captures: Pos[]
    ) => {
      let foundNext = false;

      const dirs =
        side === 1
          ? [[-1, -1], [-1, 1]]
          : [[1, -1], [1, 1]];

      for (const [dr, dc] of dirs) {
        const mr = cr + dr;
        const mc = cc + dc;
        const nr = cr + 2 * dr;
        const nc = cc + 2 * dc;

        if (!this.inBounds(mr, mc) || !this.inBounds(nr, nc)) continue;
        if (curBoard[nr][nc] !== EMPTY) continue;

        const middlePiece = curBoard[mr][mc];
        if (this.owner(middlePiece) !== -side) continue;

        foundNext = true;
        const nextBoard = this.cloneBoard(curBoard);
        const movingPiece = nextBoard[cr][cc];

        nextBoard[cr][cc] = EMPTY;
        nextBoard[mr][mc] = EMPTY;
        nextBoard[nr][nc] = movingPiece;

        if (this.shouldPromote(movingPiece, nr)) {
          results.push({
            path: [...path, [nr, nc]],
            captures: [...captures, [mr, mc]],
          });
        } else {
          dfs(
            nextBoard,
            nr,
            nc,
            [...path, [nr, nc]],
            [...captures, [mr, mc]]
          );
        }
      }

      if (!foundNext && captures.length > 0) {
        results.push({ path, captures });
      }
    };

    dfs(board, r, c, [[r, c]], []);
    return results;
  }

  getKingSimpleMoves(board: number[][], r: number, c: number): Move[] {
    const piece = board[r][c];
    if (!this.isKing(piece)) return [];

    const moves: Move[] = [];

    for (const [dr, dc] of [
      [-1, -1], [-1, 1], [1, -1], [1, 1],
    ]) {
      let nr = r + dr;
      let nc = c + dc;

      while (
        this.inBounds(nr, nc) &&
        this.isDarkSquare(nr, nc) &&
        board[nr][nc] === EMPTY
      ) {
        moves.push({ path: [[r, c], [nr, nc]], captures: [] });
        nr += dr;
        nc += dc;
      }
    }

    return moves;
  }

  getKingCaptureSequences(board: number[][], r: number, c: number): Move[] {
    const piece = board[r][c];
    const side = this.owner(piece);
    const results: Move[] = [];

    const dfs = (
      curBoard: number[][],
      cr: number,
      cc: number,
      path: Pos[],
      captures: Pos[]
    ) => {
      let foundNext = false;

      for (const [dr, dc] of [
        [-1, -1], [-1, 1], [1, -1], [1, 1],
      ]) {
        let nr = cr + dr;
        let nc = cc + dc;

        while (this.inBounds(nr, nc) && curBoard[nr][nc] === EMPTY) {
          nr += dr;
          nc += dc;
        }

        if (!this.inBounds(nr, nc)) continue;
        if (this.owner(curBoard[nr][nc]) !== -side) continue;

        const enemyR = nr;
        const enemyC = nc;
        const landR = enemyR + dr;
        const landC = enemyC + dc;

        if (!this.inBounds(landR, landC)) continue;
        if (curBoard[landR][landC] !== EMPTY) continue;

        foundNext = true;

        const nextBoard = this.cloneBoard(curBoard);
        const movingPiece = nextBoard[cr][cc];

        nextBoard[cr][cc] = EMPTY;
        nextBoard[enemyR][enemyC] = EMPTY;
        nextBoard[landR][landC] = movingPiece;

        dfs(
          nextBoard,
          landR,
          landC,
          [...path, [landR, landC]],
          [...captures, [enemyR, enemyC]]
        );
      }

      if (!foundNext && captures.length > 0) {
        results.push({ path, captures });
      }
    };

    dfs(board, r, c, [[r, c]], []);
    return results;
  }

  applyMove(board: number[][], move: Move): number[][] {
    const newBoard = this.cloneBoard(board);

    const [sr, sc] = move.path[0];
    const [er, ec] = move.path[move.path.length - 1];

    let piece = newBoard[sr][sc];
    newBoard[sr][sc] = EMPTY;

    for (const [cr, cc] of move.captures) {
      newBoard[cr][cc] = EMPTY;
    }

    if (this.shouldPromote(piece, er)) {
      piece = this.promotePiece(piece);
    }

    newBoard[er][ec] = piece;
    return newBoard;
  }

  getWinner(board: number[][], currentPlayer: number): number | null {
    const p1Count = this.countPieces(board, PLAYER_1);
    const p2Count = this.countPieces(board, PLAYER_2);

    if (p1Count === 0) return PLAYER_2;
    if (p2Count === 0) return PLAYER_1;

    const legal = this.getLegalMoves(board, currentPlayer);
    if (legal.length === 0) return -currentPlayer;

    return null;
  }
}

export function moveToString(move: Move): string {
  const p = move.path.map(([r, c]) => `(${r},${c})`).join(" -> ");
  if (move.captures.length > 0) {
    const caps = move.captures.map(([r, c]) => `(${r},${c})`).join(", ");
    return `${p} captures=[${caps}]`;
  }
  return p;
}
