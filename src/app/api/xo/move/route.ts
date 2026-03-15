import { spawn } from 'node:child_process'
import path from 'node:path'

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
  const actions: number[] = []
  for (let i = 0; i < board.length; i++) {
    if (board[i] === 0) actions.push(i)
  }
  return actions
}

function runDqn(board: Cell[]) {
  return new Promise<{ action: number | null; qValues?: number[] }>((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'src', 'server', 'xo_dqn_infer.py')
    const modelPath = path.join(process.cwd(), 'public', 'models', 'xo_dqn.tflite')

    const child = spawn('python', [scriptPath, modelPath], { stdio: ['pipe', 'pipe', 'pipe'] })

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk)
    })
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk)
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `python exited with code ${code}`))
        return
      }
      try {
        const result = JSON.parse(stdout) as { action: number | null; qValues?: number[] }
        resolve(result)
      } catch (e) {
        reject(e)
      }
    })

    child.stdin.write(JSON.stringify({ board }))
    child.stdin.end()
  })
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const boardRaw = (body as any)?.board
  if (!Array.isArray(boardRaw) || boardRaw.length !== 9) {
    return Response.json({ error: 'Invalid board' }, { status: 400 })
  }

  const board: Cell[] = []
  for (const v of boardRaw) {
    if (v !== -1 && v !== 0 && v !== 1) {
      return Response.json({ error: 'Invalid board value' }, { status: 400 })
    }
    board.push(v)
  }

  const winner = checkWinner(board)
  if (winner) {
    return Response.json({ action: null, winner }, { headers: { 'Cache-Control': 'no-store' } })
  }

  const validActions = getValidActions(board)
  if (!validActions.length) {
    return Response.json({ action: null, winner: 'DRAW' }, { headers: { 'Cache-Control': 'no-store' } })
  }

  try {
    const { action } = await runDqn(board)
    if (typeof action === 'number' && validActions.includes(action)) {
      return Response.json({ action, winner: null }, { headers: { 'Cache-Control': 'no-store' } })
    }
    return Response.json({ action: validActions[0], winner: null }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
