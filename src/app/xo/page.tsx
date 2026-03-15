'use client'

import { useState } from 'react'

type Cell = -1 | 0 | 1
type Winner = 'X' | 'O' | 'DRAW' | null

function checkWinner(board: Cell[]): Winner {
  for (let r = 0; r < 3; r++) {
    const a = board[r * 3]
    if (a !== 0 && a === board[r * 3 + 1] && a === board[r * 3 + 2]) return a === 1 ? 'X' : 'O'
  }
  for (let c = 0; c < 3; c++) {
    const a = board[c]
    if (a !== 0 && a === board[c + 3] && a === board[c + 6]) return a === 1 ? 'X' : 'O'
  }
  const d0 = board[0]
  if (d0 !== 0 && d0 === board[4] && d0 === board[8]) return d0 === 1 ? 'X' : 'O'
  const d1 = board[2]
  if (d1 !== 0 && d1 === board[4] && d1 === board[6]) return d1 === 1 ? 'X' : 'O'

  if (board.every((x) => x !== 0)) return 'DRAW'
  return null
}

function getValidActions(board: Cell[]) {
  return board.flatMap((v, i) => (v === 0 ? [i] : []))
}

export default function Page() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(0))
  const [status, setStatus] = useState('เลือกคนเริ่ม')
  const [winner, setWinner] = useState<Winner>(null)
  const [thinking, setThinking] = useState(false)
  const [humanStarts, setHumanStarts] = useState(false)

  async function aiMove(nextBoard: Cell[]) {
    const validActions = getValidActions(nextBoard)
    if (!validActions.length) return nextBoard

    const res = await fetch('/api/xo/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ board: nextBoard }),
    })
    if (!res.ok) return nextBoard
    const data = (await res.json()) as { action: number | null }

    const action = data.action
    if (action === null || !validActions.includes(action)) return nextBoard
    const updated = [...nextBoard]
    updated[action] = 1 // AI = X
    return updated
  }

  async function resetGame(humanFirst = humanStarts) {
    const empty = Array(9).fill(0) as Cell[]
    setWinner(null)
    setBoard(empty)

    if (humanFirst) {
      setStatus('ตาคุณ')
      return
    }

    setThinking(true)
    setStatus('AI กำลังคิด...')
    try {
      const afterAI = await aiMove(empty)
      const result = checkWinner(afterAI)
      setBoard(afterAI)

      if (result) {
        setWinner(result)
        setStatus(result === 'X' ? 'AI ชนะ' : result === 'O' ? 'คุณชนะ' : 'เสมอ')
      } else {
        setStatus('ตาคุณ')
      }
    } finally {
      setThinking(false)
    }
  }

  async function handleHumanMove(index: number) {
    if (winner) return
    if (thinking) return
    if (board[index] !== 0) return

    const afterHuman = [...board]
    afterHuman[index] = -1 // Human = O

    const humanResult = checkWinner(afterHuman)
    setBoard(afterHuman)
    if (humanResult) {
      setWinner(humanResult)
      setStatus(
        humanResult === 'O'
          ? 'คุณชนะ'
          : humanResult === 'X'
          ? 'AI ชนะ'
          : 'เสมอ'
      )
      return
    }

    setThinking(true)
    setStatus('AI กำลังคิด...')
    try {
      const afterAI = await aiMove(afterHuman)
      const aiResult = checkWinner(afterAI)

      setBoard(afterAI)
      if (aiResult) {
        setWinner(aiResult)
        setStatus(
          aiResult === 'O'
            ? 'คุณชนะ'
            : aiResult === 'X'
            ? 'AI ชนะ'
            : 'เสมอ'
        )
      } else {
        setStatus('ตาคุณ')
      }
    } finally {
      setThinking(false)
    }
  }

  const cellText = (v: Cell) => (v === 1 ? 'X' : v === -1 ? 'O' : '')

  return (
    <div style={{ padding: 24, maxWidth: 420, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>XO AI</h1>
      <p style={{ marginBottom: 16 }}>{status}</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => {
            setHumanStarts(false)
            resetGame(false)
          }}
          disabled={thinking}
        >
          ให้ AI เริ่ม
        </button>
        <button
          onClick={() => {
            setHumanStarts(true)
            resetGame(true)
          }}
          disabled={thinking}
        >
          ให้คนเริ่ม
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 96px)',
          gap: 8,
        }}
      >
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleHumanMove(i)}
            disabled={thinking || !!winner || cell !== 0}
            style={{
              width: 96,
              height: 96,
              fontSize: 36,
              fontWeight: 700,
              borderRadius: 12,
              border: '1px solid #555',
              cursor: 'pointer',
            }}
          >
            {cellText(cell)}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16, fontSize: 14, opacity: 0.8 }}>
        คุณ = O, AI = X
      </div>
    </div>
  )
}
