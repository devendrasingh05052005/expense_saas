import os
import sys

# Ensure api directory is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

root_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(root_dir, "backend")
if os.path.exists(backend_dir) and backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app as _fastapi_app

# Top-level exports expected by Vercel's Python runtime AST scanner
app = _fastapi_app
application = app
handler = app
