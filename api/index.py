import os
import sys
import traceback

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
    err_msg = str(e)
    err_trace = traceback.format_exc()
    print("FATAL IMPORT ERROR:", err_trace)

    from fastapi import FastAPI
    from fastapi.responses import PlainTextResponse

    _err_app = FastAPI(title="Error Diagnostic")

    @_err_app.get("/api/v1/debug-error")
    @_err_app.get("/debug-error")
    @_err_app.get("/")
    def debug_error():
        info = f"EXCEPTION: {err_msg}\n\nTRACEBACK:\n{err_trace}\n\nSYS_PATH:\n{sys.path}\n\nFILES IN CURRENT DIR ({current_dir}):\n{os.listdir(current_dir) if os.path.exists(current_dir) else 'None'}"
        return PlainTextResponse(content=info, status_code=200)

    app = _err_app
    application = app
    handler = app
