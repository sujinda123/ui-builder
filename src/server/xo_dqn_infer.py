import json
import sys
import os

# Add local lib to path for ai_edge_litert and numpy
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(script_dir, "pylib"))

import numpy as np


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
                # Fallback or error message
                sys.stderr.write("Error: Could not import tflite interpreter (ai_edge_litert, tflite_runtime, or tensorflow)\n")
                sys.exit(1)
                
    interpreter = Interpreter(model_path=model_path)
    interpreter.allocate_tensors()
    return interpreter


def main():
    try:
        model_path = sys.argv[1]
        raw = sys.stdin.read()
        payload = json.loads(raw)
        board = payload["board"]

        interpreter = get_interpreter(model_path)
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()

        x = np.array(board, dtype=np.float32).reshape(1, 9)
        interpreter.set_tensor(input_details[0]["index"], x)
        interpreter.invoke()
        q = interpreter.get_tensor(output_details[0]["index"]).reshape(-1).tolist()

        valid = [i for i, v in enumerate(board) if v == 0]
        if not valid:
            out = {"action": None, "qValues": q}
            sys.stdout.write(json.dumps(out))
            return

        best = max(valid, key=lambda i: q[i])
        out = {"action": int(best), "qValues": q}
        sys.stdout.write(json.dumps(out))
    except Exception as e:
        sys.stderr.write(str(e))
        sys.exit(1)



if __name__ == "__main__":
    main()

