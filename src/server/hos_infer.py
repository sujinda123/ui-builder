import json
import sys
import os
import copy

# Add local lib to path for ai_edge_litert and numpy
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(script_dir, "pylib"))

import numpy as np

# Constants
BOARD_SIZE = 8
EMPTY = 0
P1_MAN = 1
P1_KING = 2
P2_MAN = -1
P2_KING = -2

HUMAN = 1
AI = -1

def get_interpreter(model_path):
    try:
        from ai_edge_litert.interpreter import Interpreter
    except ImportError:
        try:
            from tflite_runtime.interpreter import Interpreter
        except ImportError:
            try:
                from tensorflow.lite.python.interpreter import Interpreter
            except ImportError:
                sys.stderr.write("Error: Could not import tflite interpreter\n")
                sys.exit(1)
                
    interpreter = Interpreter(model_path=model_path)
    interpreter.allocate_tensors()
    return interpreter

def in_bounds(r, c):
    return 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE

def is_dark_square(r, c):
    return (r + c) % 2 == 1

def owner(piece):
    if piece > 0: return 1
    if piece < 0: return -1
    return 0

def is_king(piece):
    return abs(piece) == 2

def should_promote(piece, r):
    return (piece == P1_MAN and r == 0) or (piece == P2_MAN and r == 7)

def promote_piece(piece):
    if piece == P1_MAN: return P1_KING
    if piece == P2_MAN: return P2_KING
    return piece

def clone_board(board):
    return [row[:] for row in board]

def get_man_simple_moves(board, r, c):
    piece = board[r][c]
    if abs(piece) != 1: return []
    
    dr = -1 if piece > 0 else 1
    moves = []
    
    for dc in [-1, 1]:
        nr, nc = r + dr, c + dc
        if in_bounds(nr, nc) and is_dark_square(nr, nc) and board[nr][nc] == EMPTY:
            moves.append({"path": [[r, c], [nr, nc]], "captures": []})
            
    return moves

def get_man_capture_sequences(board, r, c):
    piece = board[r][c]
    side = owner(piece)
    results = []
    
    directions = [[-1, -1], [-1, 1]] if side == HUMAN else [[1, -1], [1, 1]]
    
    def dfs(cur_board, cr, cc, path, captures):
        found_next = False
        
        for dr, dc in directions:
            mr, mc = cr + dr, cc + dc
            nr, nc = cr + dr * 2, cc + dc * 2
            
            if not in_bounds(mr, mc) or not in_bounds(nr, nc): continue
            if cur_board[nr][nc] != EMPTY: continue
            if owner(cur_board[mr][mc]) != -side: continue
            
            found_next = True
            next_board = clone_board(cur_board)
            moving_piece = next_board[cr][cc]
            
            next_board[cr][cc] = EMPTY
            next_board[mr][mc] = EMPTY
            next_board[nr][nc] = moving_piece
            
            if should_promote(moving_piece, nr):
                results.append({
                    "path": path + [[nr, nc]],
                    "captures": captures + [[mr, mc]]
                })
            else:
                dfs(
                    next_board,
                    nr, nc,
                    path + [[nr, nc]],
                    captures + [[mr, mc]]
                )
                
        if not found_next and captures:
            results.append({"path": path, "captures": captures})
            
    dfs(board, r, c, [[r, c]], [])
    return results

def get_king_simple_moves(board, r, c):
    piece = board[r][c]
    if not is_king(piece): return []
    
    moves = []
    
    for dr, dc in [[-1, -1], [-1, 1], [1, -1], [1, 1]]:
        nr, nc = r + dr, c + dc
        while in_bounds(nr, nc) and is_dark_square(nr, nc) and board[nr][nc] == EMPTY:
            moves.append({"path": [[r, c], [nr, nc]], "captures": []})
            nr += dr
            nc += dc
            
    return moves

def get_king_capture_sequences(board, r, c):
    piece = board[r][c]
    side = owner(piece)
    results = []
    
    def dfs(cur_board, cr, cc, path, captures):
        found_next = False
        
        for dr, dc in [[-1, -1], [-1, 1], [1, -1], [1, 1]]:
            nr, nc = cr + dr, cc + dc
            
            while in_bounds(nr, nc) and cur_board[nr][nc] == EMPTY:
                nr += dr
                nc += dc
                
            if not in_bounds(nr, nc): continue
            if owner(cur_board[nr][nc]) != -side: continue
            
            enemy_r, enemy_c = nr, nc
            land_r, land_c = enemy_r + dr, enemy_c + dc
            
            if not in_bounds(land_r, land_c): continue
            if cur_board[land_r][land_c] != EMPTY: continue
            
            found_next = True
            
            next_board = clone_board(cur_board)
            moving_piece = next_board[cr][cc]
            
            next_board[cr][cc] = EMPTY
            next_board[enemy_r][enemy_c] = EMPTY
            next_board[land_r][land_c] = moving_piece
            
            dfs(
                next_board,
                land_r, land_c,
                path + [[land_r, land_c]],
                captures + [[enemy_r, enemy_c]]
            )
            
        if not found_next and captures:
            results.append({"path": path, "captures": captures})
        
    # Python DFS needs a wrapper to match TS logic structure (though recursive call is same)
    # Actually, the TS version had a loop inside DFS for kings? No, it recurses.
    # Wait, the TS logic for King captures had a `while` loop commented out?
    # Yes: // while (inBounds(landR, landC) && curBoard[landR][landC] === EMPTY) { ... }
    # So it only allows landing immediately after the captured piece.
    # My python implementation above follows the active code in TS.
    
    dfs(board, r, c, [[r, c]], [])
    return results

def get_legal_moves(board, player):
    capture_moves = []
    simple_moves = []
    
    for r in range(BOARD_SIZE):
        for c in range(BOARD_SIZE):
            piece = board[r][c]
            if owner(piece) != player: continue
            
            if abs(piece) == 1:
                caps = get_man_capture_sequences(board, r, c)
                if caps: capture_moves.extend(caps)
                else: simple_moves.extend(get_man_simple_moves(board, r, c))
            else:
                caps = get_king_capture_sequences(board, r, c)
                if caps: capture_moves.extend(caps)
                else: simple_moves.extend(get_king_simple_moves(board, r, c))
                
    return capture_moves if capture_moves else simple_moves

def apply_move(board, move):
    next_board = clone_board(board)
    sr, sc = move["path"][0]
    er, ec = move["path"][-1]
    
    piece = next_board[sr][sc]
    next_board[sr][sc] = EMPTY
    
    for cr, cc in move["captures"]:
        next_board[cr][cc] = EMPTY
        
    if should_promote(piece, er):
        piece = promote_piece(piece)
        
    next_board[er][ec] = piece
    return next_board

def count_pieces(board, player):
    total = 0
    for r in range(BOARD_SIZE):
        for c in range(BOARD_SIZE):
            if owner(board[r][c]) == player: total += 1
    return total

def get_winner(board, current_player):
    p1_count = count_pieces(board, HUMAN)
    p2_count = count_pieces(board, AI)
    
    if p1_count == 0: return AI
    if p2_count == 0: return HUMAN
    
    legal = get_legal_moves(board, current_player)
    if not legal: return current_player * -1
    
    return None

def encode_canonical(board, player):
    out = np.zeros((1, 64), dtype=np.float32)
    idx = 0
    for r in range(BOARD_SIZE):
        for c in range(BOARD_SIZE):
            out[0][idx] = (board[r][c] * player) / 2.0
            idx += 1
    return out

def main():
    try:
        model_path = sys.argv[1]
        raw = sys.stdin.read()
        payload = json.loads(raw)
        
        board = payload["board"]
        player = payload.get("player", AI) # Default to AI
        depth = payload.get("depth", 2)
        
        # Ensure board is int (JSON might be float?)
        board = [[int(c) for c in row] for row in board]
        
        interpreter = get_interpreter(model_path)
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()
        
        def value_fn(state):
            interpreter.set_tensor(input_details[0]["index"], state)
            interpreter.invoke()
            output = interpreter.get_tensor(output_details[0]["index"])
            return float(output[0])
            
        memo = {}

        def negamax(cur_board, cur_player, cur_depth, alpha, beta):
            winner = get_winner(cur_board, cur_player)
            if winner == cur_player: return 1.0
            if winner == -cur_player: return -1.0
            if winner is not None: return 0.0 # Draw (should not happen in get_winner logic but for safety)
            
            if cur_depth == 0:
                return value_fn(encode_canonical(cur_board, cur_player))
                
            moves = get_legal_moves(cur_board, cur_player)
            # Sort moves
            moves.sort(key=lambda m: (len(m["captures"]), len(m["path"])), reverse=True)
            
            if not moves: return -1.0
            
            best = -1e9
            
            for mv in moves:
                next_board = apply_move(cur_board, mv)
                score = -negamax(next_board, cur_player * -1, cur_depth - 1, -beta, -alpha)
                if score > best: best = score
                if score > alpha: alpha = score
                if alpha >= beta: break
                
            return best

        legal_moves = get_legal_moves(board, player)
        if not legal_moves:
            sys.stdout.write(json.dumps({"move": None, "score": None}))
            return

        legal_moves.sort(key=lambda m: (len(m["captures"]), len(m["path"])), reverse=True)
        
        best_move = legal_moves[0]
        best_score = -1e9
        
        for mv in legal_moves:
            next_board = apply_move(board, mv)
            score = -negamax(next_board, player * -1, depth - 1, -1e9, 1e9)
            if score > best_score:
                best_score = score
                best_move = mv
                
        sys.stdout.write(json.dumps({"move": best_move, "score": best_score}))
        
    except Exception as e:
        sys.stderr.write(str(e))
        sys.exit(1)

if __name__ == "__main__":
    main()
