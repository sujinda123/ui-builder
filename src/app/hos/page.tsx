'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Player = 1 | -1
type Piece = 0 | 1 | 2 | -1 | -2
type Pos = [number, number]

type Move = {
  path: Pos[]
  captures: Pos[]
}

type Winner = 1 | -1 | 0 | null

const BOARD_SIZE = 8

const EMPTY = 0 as const
const P1_MAN = 1 as const
const P1_KING = 2 as const
const P2_MAN = -1 as const
const P2_KING = -2 as const

const HUMAN: Player = 1
const AI: Player = -1

type Board = Piece[][]

function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]) as Board
}

function inBounds(r: number, c: number) {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE
}

function isDarkSquare(r: number, c: number) {
  return (r + c) % 2 === 1
}

function owner(piece: Piece): 1 | -1 | 0 {
  if (piece > 0) return 1
  if (piece < 0) return -1
  return 0
}

function isKing(piece: Piece) {
  return Math.abs(piece) === 2
}

function shouldPromote(piece: Piece, r: number) {
  return (piece === P1_MAN && r === 0) || (piece === P2_MAN && r === 7)
}

function promotePiece(piece: Piece): Piece {
  if (piece === P1_MAN) return P1_KING
  if (piece === P2_MAN) return P2_KING
  return piece
}

function createInitialBoard(): Board {
  const board = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => EMPTY),
  ) as Board

  const p2Positions: Pos[] = [
    [0, 1], [0, 3], [0, 5], [0, 7],
    [1, 0], [1, 2], [1, 4], [1, 6],
  ]

  const p1Positions: Pos[] = [
    [6, 1], [6, 3], [6, 5], [6, 7],
    [7, 0], [7, 2], [7, 4], [7, 6],
  ]

  for (const [r, c] of p2Positions) board[r][c] = P2_MAN
  for (const [r, c] of p1Positions) board[r][c] = P1_MAN

  return board
}

function countPieces(board: Board, player: Player) {
  let total = 0
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (owner(board[r][c]) === player) total++
    }
  }
  return total
}

function boardToKey(board: Board, player: Player) {
  const flat: number[] = []
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      flat.push(board[r][c] * player)
    }
  }
  return flat.join(',')
}

function getManSimpleMoves(board: Board, r: number, c: number): Move[] {
  const piece = board[r][c]
  if (Math.abs(piece) !== 1) return []

  const dr = piece > 0 ? -1 : 1
  const moves: Move[] = []

  for (const dc of [-1, 1]) {
    const nr = r + dr
    const nc = c + dc
    if (inBounds(nr, nc) && isDarkSquare(nr, nc) && board[nr][nc] === EMPTY) {
      moves.push({ path: [[r, c], [nr, nc]], captures: [] })
    }
  }

  return moves
}

function getManCaptureSequences(board: Board, r: number, c: number): Move[] {
  const piece = board[r][c]
  const side = owner(piece)
  const results: Move[] = []
  const directions =
    side === HUMAN
      ? ([[-1, -1], [-1, 1]] as const)
      : ([[1, -1], [1, 1]] as const)

  function dfs(curBoard: Board, cr: number, cc: number, path: Pos[], captures: Pos[]) {
    let foundNext = false

    for (const [dr, dc] of directions) {
      const mr = cr + dr
      const mc = cc + dc
      const nr = cr + dr * 2
      const nc = cc + dc * 2

      if (!inBounds(mr, mc) || !inBounds(nr, nc)) continue
      if (curBoard[nr][nc] !== EMPTY) continue
      if (owner(curBoard[mr][mc]) !== -side) continue

      foundNext = true
      const nextBoard = cloneBoard(curBoard)
      const movingPiece = nextBoard[cr][cc]

      nextBoard[cr][cc] = EMPTY
      nextBoard[mr][mc] = EMPTY
      nextBoard[nr][nc] = movingPiece

      if (shouldPromote(movingPiece, nr)) {
        results.push({
          path: [...path, [nr, nc]],
          captures: [...captures, [mr, mc]],
        })
      } else {
        dfs(
          nextBoard,
          nr,
          nc,
          [...path, [nr, nc]],
          [...captures, [mr, mc]],
        )
      }
    }

    if (!foundNext && captures.length > 0) {
      results.push({ path, captures })
    }
  }

  dfs(board, r, c, [[r, c]], [])
  return results
}

function getKingSimpleMoves(board: Board, r: number, c: number): Move[] {
  const piece = board[r][c]
  if (!isKing(piece)) return []

  const moves: Move[] = []

  for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]] as const) {
    let nr = r + dr
    let nc = c + dc
    while (inBounds(nr, nc) && isDarkSquare(nr, nc) && board[nr][nc] === EMPTY) {
      moves.push({ path: [[r, c], [nr, nc]], captures: [] })
      nr += dr
      nc += dc
    }
  }

  return moves
}

function getKingCaptureSequences(board: Board, r: number, c: number): Move[] {
  const piece = board[r][c]
  const side = owner(piece)
  const results: Move[] = []

  function dfs(curBoard: Board, cr: number, cc: number, path: Pos[], captures: Pos[]) {
    let foundNext = false

    for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]] as const) {
      let nr = cr + dr
      let nc = cc + dc

      while (inBounds(nr, nc) && curBoard[nr][nc] === EMPTY) {
        nr += dr
        nc += dc
      }

      if (!inBounds(nr, nc)) continue
      if (owner(curBoard[nr][nc]) !== -side) continue

      const enemyR = nr
      const enemyC = nc
      let landR = enemyR + dr
      let landC = enemyC + dc
      
      
      // สำคัญ: ลงได้เฉพาะหลังตัวที่กินเท่านั้น
      if (!inBounds(landR, landC)) continue
      if (curBoard[landR][landC] !== EMPTY) continue

      foundNext = true

      const nextBoard = cloneBoard(curBoard)
      const movingPiece = nextBoard[cr][cc]

      nextBoard[cr][cc] = EMPTY
      nextBoard[enemyR][enemyC] = EMPTY
      nextBoard[landR][landC] = movingPiece

      dfs(
        nextBoard,
        landR,
        landC,
        [...path, [landR, landC]],
        [...captures, [enemyR, enemyC]],
      )
    }

    if (!foundNext && captures.length > 0) {
      results.push({ path, captures })
    }
  }

  dfs(board, r, c, [[r, c]], [])
  return results
}

function getLegalMoves(board: Board, player: Player): Move[] {
  const captureMoves: Move[] = []
  const simpleMoves: Move[] = []

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c]
      if (owner(piece) !== player) continue

      if (Math.abs(piece) === 1) {
        const caps = getManCaptureSequences(board, r, c)
        if (caps.length) captureMoves.push(...caps)
        else simpleMoves.push(...getManSimpleMoves(board, r, c))
      } else {
        const caps = getKingCaptureSequences(board, r, c)
        if (caps.length) captureMoves.push(...caps)
        else simpleMoves.push(...getKingSimpleMoves(board, r, c))
      }
    }
  }

  return captureMoves.length ? captureMoves : simpleMoves
}

function applyMove(board: Board, move: Move): Board {
  const next = cloneBoard(board)
  const [sr, sc] = move.path[0]
  const [er, ec] = move.path[move.path.length - 1]

  let piece = next[sr][sc]
  next[sr][sc] = EMPTY

  for (const [cr, cc] of move.captures) {
    next[cr][cc] = EMPTY
  }

  if (shouldPromote(piece, er)) {
    piece = promotePiece(piece)
  }

  next[er][ec] = piece
  return next
}

function getWinner(board: Board, currentPlayer: Player): Winner {
  const p1Count = countPieces(board, HUMAN)
  const p2Count = countPieces(board, AI)

  if (p1Count === 0) return AI
  if (p2Count === 0) return HUMAN

  const legal = getLegalMoves(board, currentPlayer)
  if (!legal.length) return (currentPlayer * -1) as Winner

  return null
}

function pieceText(piece: Piece) {
  switch (piece) {
    case P1_MAN: return 'm'
    case P1_KING: return 'M'
    case P2_MAN: return 'o'
    case P2_KING: return 'O'
    default: return ''
  }
}

export default function ThaiCheckersPage() {
  const [board, setBoard] = useState<Board>(createInitialBoard())
  const [currentPlayer, setCurrentPlayer] = useState<Player>(HUMAN)
  const [status, setStatus] = useState('ตาคุณ')
  const [winner, setWinner] = useState<Winner>(null)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Pos | null>(null)
  const [candidateMoves, setCandidateMoves] = useState<Move[]>([])
  const [humanStarts, setHumanStarts] = useState(true)
  const [searchDepth, setSearchDepth] = useState(2)
  const repeatedStateRef = useRef<Record<string, number>>({})

  const legalMoves = useMemo(() => getLegalMoves(board, currentPlayer), [board, currentPlayer])

  function clearSelection() {
    setSelected(null)
    setCandidateMoves([])
  }

  function resetRepetition() {
    repeatedStateRef.current = {}
  }

  async function resetGame(humanFirst = true) {
    const fresh = createInitialBoard()
    setBoard(fresh)
    setWinner(null)
    clearSelection()
    resetRepetition()
    setLoading(false)

    if (humanFirst) {
      setHumanStarts(true)
      setCurrentPlayer(HUMAN)
      setStatus('ตาคุณ')
      return
    }

    setHumanStarts(false)
    setCurrentPlayer(AI)
    setStatus('AI กำลังคิด...')
    await aiTurn(fresh)
  }

  function updateRepetition(nextBoard: Board, nextPlayer: Player): boolean {
    const key = boardToKey(nextBoard, nextPlayer)
    const count = (repeatedStateRef.current[key] ?? 0) + 1
    repeatedStateRef.current[key] = count
    return count >= 3
  }

  async function aiTurn(startBoard = board) {
    const maybeWinner = getWinner(startBoard, AI)
    if (maybeWinner !== null) {
      setWinner(maybeWinner)
      setStatus(
        maybeWinner === HUMAN ? 'คุณชนะ'
          : maybeWinner === AI ? 'AI ชนะ'
          : 'เสมอ',
      )
      return
    }

    setLoading(true)
    setStatus('AI กำลังคิด...')

    try {
      const res = await fetch('/api/hos/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board: startBoard, player: AI, depth: searchDepth }),
      })

      if (!res.ok) {
        throw new Error('API request failed')
      }

      const data = await res.json()
      const move = data.move as Move | null

      if (!move) {
        // AI has no moves or something went wrong
        const winner = getWinner(startBoard, AI)
        setWinner(winner)
        setStatus(winner === HUMAN ? 'คุณชนะ' : winner === AI ? 'AI ชนะ' : 'เสมอ')
        return
      }

      const nextBoard = applyMove(startBoard, move)
      const nextWinner = getWinner(nextBoard, HUMAN)
      const isRepeated = nextWinner === null && updateRepetition(nextBoard, HUMAN)

      setBoard(nextBoard)
      setCurrentPlayer(HUMAN)
      clearSelection()

      if (nextWinner !== null) {
        setWinner(nextWinner)
        setStatus(
          nextWinner === HUMAN ? 'คุณชนะ'
            : nextWinner === AI ? 'AI ชนะ'
            : 'เสมอ',
        )
      } else {
        if (isRepeated) {
          setWinner(0)
          setStatus('เสมอ (สถานะซ้ำ 3 ครั้ง)')
        } else {
          setStatus(`AI เดิน: ${formatMove(move)} | ตาคุณ`)
        }
      }
    } catch (error) {
      console.error(error)
      setStatus('เกิดข้อผิดพลาดในการคำนวณของ AI')
    } finally {
      setLoading(false)
    }
  }

  function formatMove(move: Move) {
    const path = move.path.map(([r, c]) => `(${r},${c})`).join(' → ')
    if (!move.captures.length) return path
    return `${path} | กิน ${move.captures.length} ตัว`
  }

  async function handleCellClick(r: number, c: number) {
    if (loading || winner !== null) return
    if (currentPlayer !== HUMAN) return

    const allMoves = getLegalMoves(board, HUMAN)

    if (!selected) {
      const fromMoves = allMoves.filter((m) => m.path[0][0] === r && m.path[0][1] === c)
      if (!fromMoves.length) return
      setSelected([r, c])
      setCandidateMoves(fromMoves)
      setStatus('เลือกปลายทาง')
      return
    }

    const move = candidateMoves.find((m) => {
      const [er, ec] = m.path[m.path.length - 1]
      return er === r && ec === c
    })

    if (!move) {
      const fromMoves = allMoves.filter((m) => m.path[0][0] === r && m.path[0][1] === c)
      if (fromMoves.length) {
        setSelected([r, c])
        setCandidateMoves(fromMoves)
        setStatus('เลือกปลายทาง')
      } else {
        clearSelection()
        setStatus('ตาคุณ')
      }
      return
    }

    const nextBoard = applyMove(board, move)
    const nextWinner = getWinner(nextBoard, AI)
    const isRepeated = nextWinner === null && updateRepetition(nextBoard, AI)

    setBoard(nextBoard)
    clearSelection()

    if (nextWinner !== null) {
      setCurrentPlayer(AI)
      setWinner(nextWinner)
      setStatus(
        nextWinner === HUMAN ? 'คุณชนะ'
          : nextWinner === AI ? 'AI ชนะ'
          : 'เสมอ',
      )
      return
    }

    if (isRepeated) {
      setCurrentPlayer(AI)
      setWinner(0)
      setStatus('เสมอ (สถานะซ้ำ 3 ครั้ง)')
      return
    }

    setCurrentPlayer(AI)
    setStatus(`คุณเดิน: ${formatMove(move)} | AI กำลังคิด...`)

    setTimeout(() => {
      aiTurn(nextBoard)
    }, 50)
  }

  function isCandidateDestination(r: number, c: number) {
    return candidateMoves.some((m) => {
      const [er, ec] = m.path[m.path.length - 1]
      return er === r && ec === c
    })
  }

  function isSelected(r: number, c: number) {
    return selected?.[0] === r && selected?.[1] === c
  }

  const displayedMoves = useMemo(() => {
    if (!selected) return []
    return candidateMoves
  }, [selected, candidateMoves])

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        Thai Checkers 8 AI (.tflite API)
      </h1>

      <p style={{ marginBottom: 12 }}>{status}</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button disabled={loading} onClick={() => resetGame(true)}>
          ให้คนเริ่ม
        </button>
        <button disabled={loading} onClick={() => resetGame(false)}>
          ให้ AI เริ่ม
        </button>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Search depth
          <select
            value={searchDepth}
            onChange={(e) => setSearchDepth(Number(e.target.value))}
            disabled={loading}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 48px)',
            gridTemplateRows: 'repeat(8, 48px)',
            border: '2px solid #444',
            width: 'fit-content',
          }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => {
              const dark = isDarkSquare(r, c)
              const selectedCell = isSelected(r, c)
              const candidate = isCandidateDestination(r, c)

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  disabled={loading || winner !== null || !dark}
                  style={{
                    width: 48,
                    height: 48,
                    border: '1px solid #555',
                    background: selectedCell
                      ? '#facc15'
                      : candidate
                        ? '#86efac'
                        : dark
                          ? '#6b4f3a'
                          : '#e5d3b3',
                    color: dark ? '#fff' : '#000',
                    fontSize: 24,
                    fontWeight: 700,
                    cursor: dark ? 'pointer' : 'default',
                  }}
                  title={`${r},${c}`}
                >
                  {pieceText(cell)}
                </button>
              )
            }),
          )}
        </div>

        <div>
          <div style={{ marginBottom: 12 }}>
            <strong>กติกาที่ใช้</strong>
            <div>มีกินต้องกิน / กินต่อจนจบ / เลือกสายกินได้ 1 สาย</div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <strong>สัญลักษณ์</strong>
            <div>คุณ = m / M</div>
            <div>AI = o / O</div>
            <div>m,o = เบี้ย / M,O = ฮอส</div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <strong>ผู้เล่นปัจจุบัน</strong>
            <div>{currentPlayer === HUMAN ? 'คุณ' : 'AI'}</div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <strong>ตาเดินที่เลือกได้ตอนนี้</strong>
            {displayedMoves.length === 0 ? (
              <div>ยังไม่ได้เลือกตัวหมาก</div>
            ) : (
              <ol>
                {displayedMoves.map((m, i) => (
                  <li key={i}>{formatMove(m)}</li>
                ))}
              </ol>
            )}
          </div>

          <div>
            <strong>วิธีเล่น</strong>
            <div>1. คลิกตัวหมากของคุณ</div>
            <div>2. คลิกช่องปลายทางที่ไฮไลต์</div>
          </div>
        </div>
      </div>
    </div>
  )
}
