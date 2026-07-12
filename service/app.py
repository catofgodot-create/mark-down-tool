import os
import tempfile
from pathlib import Path
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from markitdown import MarkItDown

MAX_BYTES = 100 * 1024 * 1024
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "https://mark-down-tool.catofgodot.chatgpt.site")
app = FastAPI(title="Mark / Down conversion service", docs_url=None, redoc_url=None)
app.add_middleware(CORSMiddleware, allow_origins=[ALLOWED_ORIGIN], allow_methods=["POST", "GET"], allow_headers=["*"])
converter = MarkItDown(enable_plugins=False)

@app.get("/health")
def health():
    return {"status": "ok", "engine": "Microsoft MarkItDown", "version": "0.1.6"}

@app.post("/convert")
async def convert(file: UploadFile = File(...)):
    suffix = Path(file.filename or "document").suffix
    data = await file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "File exceeds the 100 MB limit.")
    path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(data)
            path = tmp.name
        result = converter.convert(path)
        markdown = getattr(result, "markdown", None) or getattr(result, "text_content", "")
        name = f'{Path(file.filename or "document").stem}.md'
        return Response(markdown, media_type="text/markdown; charset=utf-8", headers={"Content-Disposition": f'attachment; filename="{name}"', "Cache-Control": "no-store"})
    except Exception as exc:
        raise HTTPException(422, f"MarkItDown could not convert this file: {exc}") from exc
    finally:
        if path:
            Path(path).unlink(missing_ok=True)
