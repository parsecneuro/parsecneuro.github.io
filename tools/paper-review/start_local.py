#!/usr/bin/env python3
"""Start Paper Review on this computer using Python's standard library."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser


class LocalHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".mjs": "text/javascript",
        ".js": "text/javascript",
        ".wasm": "application/wasm",
        ".pdf": "application/pdf",
    }

    def log_message(self, format, *args):
        pass


def main():
    root = Path(__file__).resolve().parent
    handler = partial(LocalHandler, directory=str(root))
    # A stable origin allows the browser to restore locally saved comments.
    try:
        server = ThreadingHTTPServer(("127.0.0.1", 8765), handler)
    except OSError:
        print("Port 8765 is already in use. Close any previous Paper Review server")
        print("and run this file again. If Paper Review is already open, use that window.")
        return 1
    url = "http://127.0.0.1:8765/index.html"
    print("Paper Review is ready: " + url)
    print("Keep this window open while reviewing. Press Ctrl+C to stop.")
    print("Documents are opened by your browser; this server does not accept uploads.")
    webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nPaper Review stopped.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
