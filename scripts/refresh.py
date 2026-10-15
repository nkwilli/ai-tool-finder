"""Daily refresh: link-check every tool URL (no price scraping), update last_checked,
flag dead links, keep last good data on failure, then rebuild the site."""
import json, pathlib, datetime, urllib.request, urllib.error, concurrent.futures as cf, sys
R = pathlib.Path(__file__).resolve().parent.parent
P = R/"data/tools.json"
UA = "PlainAI-linkcheck/1.0 (+link availability check only)"
FAILS_BEFORE_DEAD = 2   # avoid flagging a site over one blip

def alive(url):
    for method in ("HEAD", "GET"):
        try:
            req = urllib.request.Request(url, method=method, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=20) as r:
                return r.status < 400
        except urllib.error.HTTPError as e:
            # 401/403/405/429 = site is up but blocks bots/HEAD; treat as alive
            if e.code in (401, 403, 405, 429): return True
            if method == "GET": return False
        except Exception:
            if method == "GET": return None   # network error: unknown, keep last state
    return None

def main():
    try:
        tools = json.loads(P.read_text())
    except Exception as e:
        print("cannot read data, keeping last good:", e); return build()
    today = datetime.date.today().isoformat()
    with cf.ThreadPoolExecutor(8) as ex:
        results = list(ex.map(lambda t: alive(t["url"]), tools))
    unknown = sum(r is None for r in results)
    if unknown > len(tools) // 2:
        print(f"{unknown} checks failed at network level; keeping last good data"); return build()
    for t, ok in zip(tools, results):
        if ok is None: continue
        t["last_checked"] = today
        if ok: t["status"], t["fail_count"] = "ok", 0
        else:
            t["fail_count"] = t.get("fail_count", 0) + 1
            if t["fail_count"] >= FAILS_BEFORE_DEAD: t["status"] = "dead"
    tmp = P.with_suffix(".tmp"); tmp.write_text(json.dumps(tools, indent=1)); tmp.replace(P)
    dead = [t["name"] for t in tools if t["status"] == "dead"]
    print(f"checked {len(tools)}; dead: {dead or 'none'}")
    build()

def build():
    sys.path.insert(0, str(R/"scripts")); import build as b; b.build()

if __name__ == "__main__": main()
