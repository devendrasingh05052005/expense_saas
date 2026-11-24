import os
import sys

# Top-level declarations for Vercel's AST static scanner
app = None
application = None
handler = None

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

root_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(root_dir, "backend")
if os.path.exists(backend_dir) and backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from app.main import app as _real_app
    app = _real_app
    application = app
    handler = app
except Exception as e:
    import traceback
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    _err_app = FastAPI(title="Error Diagnostic")
    err_str = traceback.format_exc()

    @_err_app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"])
    def error_handler(full_path: str):
        return JSONResponse(
            status_code=500,
            content={
                "error": "FastAPI App Initialization Failed",
                "exception": str(e),
                "traceback": err_str.split("\n"),
                "sys_path": sys.path,
                "current_dir": current_dir,
                "files_in_current_dir": os.listdir(current_dir) if os.path.exists(current_dir) else []
            }
        )
    app = _err_app
    application = app
    handler = app
