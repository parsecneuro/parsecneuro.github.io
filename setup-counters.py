#!/usr/bin/env python3
"""Install only counter files and small HTML additions into an existing site."""
import argparse
from html import escape
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import urlsplit

APPS = {"nestapp": "page visits", "eeg-cap-viewer": "opens", "paper-review": "opens"}
HEAD_START = "<!-- tool-counter:head -->"
HEAD_END = "<!-- /tool-counter:head -->"
INFO_START = "<!-- tool-counter:info -->"
INFO_END = "<!-- /tool-counter:info -->"
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}


def origin(value):
    parsed = urlsplit(value)
    try:
        port = parsed.port
    except ValueError as error:
        raise ValueError("The HTTPS origin has an invalid port.") from error
    if (parsed.scheme != "https" or not parsed.hostname or parsed.username or
            parsed.password or parsed.path not in ("", "/") or parsed.query or parsed.fragment or
            parsed.netloc.endswith(":") or port == 0 or
            not re.fullmatch(r"[A-Za-z0-9.:\-]+", parsed.netloc)):
        raise ValueError("Use an HTTPS origin only, for example https://counter.example.workers.dev")
    authority = parsed.hostname.lower() + (f":{port}" if port and port != 443 else "")
    return f"https://{authority}"


class Positions(HTMLParser):
    """Read card boundaries without reserializing or replacing existing page content."""
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.source = source
        self.lines = source.splitlines(keepends=True)
        self.offsets = [0]
        for line in self.lines:
            self.offsets.append(self.offsets[-1] + len(line))
        self.stack = []
        self.cards = []
        self.csp = []
        self.head_end = self.body_end = None
        self.footers = []
        self.catalog_end = None
        self.feed(source)

    def absolute_position(self):
        line, column = self.getpos()
        return self.offsets[line - 1] + column

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        pos = self.absolute_position()
        if tag == "meta" and attrs.get("http-equiv", "").lower() == "content-security-policy":
            self.csp.append((pos, pos + len(self.get_starttag_text()), attrs.get("content", "")))
        card = next((n.get("card") for n in reversed(self.stack) if n.get("card")), None)
        if tag == "a" and "tool-card" in attrs.get("class", "").split():
            target = urlsplit(attrs.get("href", "")).path
            app = next((key for key in APPS if re.search(r"(?:^|/)" + re.escape(key) + r"/(?:index\.html|about\.html)?$", target)), None)
            if app:
                card = {"app": app, "insert": None, "counted": False}
                self.cards.append(card)
        if card and "data-tool-count" in attrs:
            card["counted"] = True
        if tag not in VOID:
            self.stack.append({"tag": tag, "attrs": attrs, "card": card})

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        pos = self.absolute_position()
        if tag == "head": self.head_end = pos
        if tag == "body": self.body_end = pos
        if tag == "footer": self.footers.append(pos)
        index = next((i for i in range(len(self.stack) - 1, -1, -1) if self.stack[i]["tag"] == tag), None)
        if index is None:
            return
        node = self.stack[index]
        if "tool-catalog" in node["attrs"].get("class", "").split():
            self.catalog_end = self.source.find(">", pos) + 1
        card = node.get("card")
        if card and ("tool-card-body" in node["attrs"].get("class", "").split() or
                     (tag == "a" and card["insert"] is None)):
            card["insert"] = pos
        del self.stack[index:]


def remove_block(source, start, end):
    return re.sub(re.escape(start) + r".*?" + re.escape(end) + r"\n?", "", source, flags=re.S)


def connect_policy(policy, endpoint, old_endpoint):
    directives = [part.strip().split() for part in policy.split(";") if part.strip()]
    connect = next((part for part in directives if part[0].lower() == "connect-src"), None)
    if connect is None:
        default = next((part[1:] for part in directives if part[0].lower() == "default-src"), None)
        if default is None:
            return policy  # Already unrestricted for connections; do not constrain unrelated apps.
        connect = ["connect-src", *default]
        directives.append(connect)
    if old_endpoint and old_endpoint in connect[1:]:
        connect.remove(old_endpoint)
    if endpoint and endpoint not in connect[1:]:
        if "'none'" in connect: connect.remove("'none'")
        connect.append(endpoint)
    return "; ".join(" ".join(part) for part in directives)


def patch_html(source, relative, endpoint="", old_endpoint=""):
    source = remove_block(source, HEAD_START, HEAD_END)
    source = remove_block(source, INFO_START, INFO_END)
    is_catalog = relative == "tools/index.html"
    is_paper = relative == "tools/paper-review/index.html"
    is_admin = relative == "tools/counter-admin/index.html"
    prefix = "../" if is_catalog else "../../"
    if is_paper:
        source = source.replace("There are no analytics, AI review services, or automatic reference searches.",
                                "There are no AI review services or automatic reference searches.")
    parser = Positions(source)
    if parser.head_end is None or parser.body_end is None:
        raise ValueError(f"{relative}: expected closing head and body tags; no files were written.")
    edits = []
    if not is_admin:
        block = (f'{HEAD_START}\n<link rel="stylesheet" href="{prefix}assets/css/tool-counter.css">\n'
                 f'<script defer src="{prefix}assets/js/tool-counter-config.js"></script>\n'
                 f'<script defer src="{prefix}assets/js/tool-counter.js"></script>\n{HEAD_END}\n')
        edits.append((parser.head_end, parser.head_end, block))
    for begin, end, policy in parser.csp:
        updated = connect_policy(policy, endpoint, old_endpoint)
        original = source[begin:end]
        rewritten = re.sub(r'''\bcontent\s*=\s*(["'])(.*?)\1''',
                           lambda _: 'content="' + escape(updated, quote=True) + '"', original,
                           count=1, flags=re.I | re.S)
        edits.append((begin, end, rewritten))
    if is_catalog:
        found = {card["app"] for card in parser.cards}
        missing = set(APPS) - found
        if missing:
            raise ValueError("Tools cards not found for: " + ", ".join(sorted(missing)) + ". Add these app cards before installing counters.")
        for card in parser.cards:
            if card["counted"]: continue
            if card["insert"] is None: raise ValueError("A Tools card has no closing element.")
            app = card["app"]
            label = APPS[app]
            title = "Page openings since the latest reset. Reloads count again."
            pill = (f'<span class="tool-count" data-tool-count="{app}" title="{title}">'
                    f'<span data-count-value>—</span> {label}</span>\n            ')
            edits.append((card["insert"], card["insert"], pill))
        info = (f'{INFO_START}<div class="tool-counter-info"><p>Counts show page openings since the latest reset. '
                'Reloads count again; NESTApp shows visits to its website page. '
                '<a href="./counter-admin/index.html">Manage counters</a></p></div>' + INFO_END + '\n')
        pos = parser.catalog_end or parser.body_end
        edits.append((pos, pos, info))
    elif is_paper:
        # Keep privacy guidance in the existing help dialog.
        marker = '<h3>Local saving</h3>'
        pos = source.find(marker)
        if pos == -1:
            raise ValueError("Paper Review help section not found; no files were written.")
        disclosure = (f'{INFO_START}<h3>App opening counter</h3><p>When the site counter is enabled, '
                      'opening this page sends the app identifier and a random request ID to the counter service. '
                      'Your PDF, filename, notes, annotations, and references are not sent. '
                      'Local previews do not send counter requests.</p>' + INFO_END + '\n')
        edits.append((pos, pos, disclosure))
    elif not is_admin:
        pos = parser.footers[0] if parser.footers else parser.body_end
        if relative == "tools/nestapp/index.html":
            pos = source.rfind("</main>")
            if pos == -1: pos = parser.body_end
        info = (f'{INFO_START}<p class="tool-counter-disclosure">When enabled, the site counter records '
                'page openings using an app identifier and a random request ID. Files and their contents are not sent.</p>'
                + INFO_END + '\n')
        edits.append((pos, pos, info))
    for begin, end, replacement in sorted(edits, reverse=True):
        source = source[:begin] + replacement + source[end:]
    return source


def install(site_root, assets_root, endpoint, site_origin):
    site_root, assets_root = Path(site_root).resolve(), Path(assets_root).resolve()
    endpoint = origin(endpoint) if endpoint else ""
    site_origin = origin(site_origin)
    config_path = site_root / "assets/js/tool-counter-config.js"
    old_endpoint = ""
    if config_path.exists():
        match = re.search(r'''["']?endpoint["']?\s*:\s*["']([^"']*)["']''', config_path.read_text())
        if match and match[1]: old_endpoint = origin(match[1])
    pending = {}
    for name in ["assets/css/tool-counter.css", "assets/js/tool-counter.js",
                 "tools/counter-admin/index.html", "tools/counter-admin/admin.js", "tools/counter-admin/admin.css"]:
        pending[name] = (assets_root / name).read_text(encoding="utf-8")
    pending["assets/js/tool-counter-config.js"] = (
        "// Public settings only. Keep ADMIN_TOKEN in the Worker secret, never in this file.\n"
        "window.TOOL_COUNTER_CONFIG = Object.freeze(" +
        json.dumps({"endpoint": endpoint, "siteOrigin": site_origin}, indent=2) + ");\n")
    for name in ["tools/index.html", *[f"tools/{app}/index.html" for app in APPS], "tools/counter-admin/index.html"]:
        path = site_root / name
        if name in pending: source = pending[name]
        elif path.is_file(): source = path.read_text(encoding="utf-8")
        else: raise ValueError(f"Missing {name}. Select your website root containing all three tools. No files were written.")
        pending[name] = patch_html(source, name, endpoint, old_endpoint)
    guide = "tools/paper-review/START-HERE.txt"
    if (site_root / guide).is_file():
        pending[guide] = (site_root / guide).read_text(encoding="utf-8").replace(
            "has no AI review service, analytics, manuscript upload, or automatic search.",
            "has no AI review service, manuscript upload, or automatic search.\n"
            "When the website counter is enabled, app openings send only the app ID\n"
            "and a random request ID to the counter service. PDFs, filenames, notes,\n"
            "annotations, and references stay local. Local previews do not count.")
    # Validate every input and prepare every edit before writing anything.
    changed = []
    for name, content in pending.items():
        path = site_root / name
        if path.is_file() and path.read_text(encoding="utf-8") == content: continue
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        changed.append(name)
    return changed


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("site_root", type=Path, help="Your existing website repository folder")
    parser.add_argument("--endpoint", default="", help="Deployed counter Worker HTTPS origin; omit to leave counters disconnected")
    parser.add_argument("--site-origin", default="https://parsecneuro.github.io", help="Production website origin, with no path")
    args = parser.parse_args()
    try:
        changed = install(args.site_root, Path(__file__).resolve().parent, args.endpoint, args.site_origin)
    except (ValueError, OSError) as error:
        parser.exit(1, str(error) + "\n")
    print("Updated " + str(len(changed)) + " files:")
    for name in changed: print("  " + name)
    print("Review and publish these website changes using your normal GitHub Pages workflow.")
    if not args.endpoint: print("Counter service is not configured; totals display — until an endpoint is supplied.")


if __name__ == "__main__":
    main()
