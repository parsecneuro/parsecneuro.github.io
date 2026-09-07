#!/usr/bin/env python3
"""Serve the static EEG Cap Viewer from its own folder."""

from __future__ import annotations

import argparse
import contextlib
import http.server
import os
from pathlib import Path
import socketserver
import threading
import webbrowser


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run a local server for the EEG Cap Viewer.")
    parser.add_argument("--port", type=int, default=8000, help="Local TCP port; default: 8000")
    parser.add_argument("--no-browser", action="store_true", help="Do not open the default web browser")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    root = Path(__file__).resolve().parent
    os.chdir(root)

    class ReusableTCPServer(socketserver.TCPServer):
        allow_reuse_address = True

    url = f"http://127.0.0.1:{args.port}/"
    handler = http.server.SimpleHTTPRequestHandler

    with ReusableTCPServer(("127.0.0.1", args.port), handler) as server:
        print(f"Serving EEG Cap Viewer from: {root}")
        print(f"Open: {url}")
        print("Press Ctrl+C to stop the server.")
        if not args.no_browser:
            threading.Timer(0.7, lambda: webbrowser.open(url)).start()
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
        finally:
            with contextlib.suppress(Exception):
                server.server_close()


if __name__ == "__main__":
    main()
