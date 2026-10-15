"""Build the static site into site/ from config.json + data/*.json. Stdlib only."""
import json, shutil, html, pathlib, datetime
R = pathlib.Path(__file__).resolve().parent.parent
C = json.loads((R/"config.json").read_text())
TOOLS = json.loads((R/"data/tools.json").read_text())
UC = json.loads((R/"data/usecases.json").read_text())
OUT = R/"site"; NAME = C["site_name"]; BASE = C["base_url"].rstrip("/"); F = C["fields"]
e = html.escape
TASKS = sorted({t for x in TOOLS for t in x["tasks"]})
BY = {t["slug"]: t for t in TOOLS}
NAV = [("", "Home"), ("tools/", "Tool finder"), ("use-cases/", "Agent use cases"), ("news/", "AI news"), ("about/", "About")]

def page(path, title, desc, body, scripts=""):
    depth = path.count("/")
    rel = "../" * depth
    nav = "".join(f'<a href="{rel}{h}"{" aria-current=page" if h==path.rsplit("index.html",1)[0] else ""}>{n}</a>' for h, n in NAV)
    canon = f"{BASE}/{path.replace('index.html','')}"
    doc = f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)}</title><meta name="description" content="{e(desc)}">
<link rel="canonical" href="{canon}"><meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}">
<link rel="stylesheet" href="{rel}assets/style.css"></head><body>
<a class="skip" href="#main">Skip to content</a>
<header><div class="wrap bar"><a class="brand" href="{rel}">{e(NAME)}</a><nav aria-label="Main">{nav}</nav></div></header>
<main id="main" class="wrap">{body}</main>
<footer><div class="wrap"><p>&copy; {datetime.date.today().year} {e(NAME)} &middot; <a href="{rel}privacy/">Privacy</a> &middot; <a href="{rel}disclosure/">Affiliate &amp; ad disclosure</a> &middot; <a href="{rel}about/">About</a></p>
<p class="muted">Prices change often. Always confirm on the tool's own site.</p></div></footer>
{scripts}</body></html>"""
    p = OUT/path; p.parent.mkdir(parents=True, exist_ok=True); p.write_text(doc)

AD = lambda slot: f'<div class="ad-slot" data-ad-slot="{slot}" aria-hidden="true"></div>'
PRICE = {"free": "Free", "freemium": "Free tier + paid", "paid": "Paid", "check": "Check site"}

def card(t, rel):
    dead = ' <span class="badge warn">link may be down</span>' if t.get("status") == "dead" else ""
    return f"""<article class="card"><h3><a href="{rel}tools/{t['slug']}/">{e(t['name'])}</a>{dead}</h3>
<p class="muted">{e(t['category'])} &middot; {' / '.join(t['use'])}</p>
<p><span class="badge">{PRICE[t['pricing']]}</span> Free tier: {e(t['free_tier'])}</p></article>"""

def build():
    if OUT.exists(): shutil.rmtree(OUT)
    shutil.copytree(R/"static", OUT/"assets")
    (OUT/"data").mkdir(parents=True)
    idx = [{k: t[k] for k in ("slug","name","category","fields","tasks","use","pricing","free_tier","pricing_summary","data_note","status","last_checked")} for t in TOOLS]
    (OUT/"data/tools.json").write_text(json.dumps(idx, separators=(",",":")))
    (OUT/"data/usecases.json").write_text(json.dumps(UC, separators=(",",":")))
    (OUT/"data/meta.json").write_text(json.dumps({"fields": F, "tasks": TASKS, "price": PRICE}))
    featured = [BY[s] for s in ("chatgpt","claude","grok","otter-ai","zapier","canva","magicschool") if s in BY]
    page("index.html", f"{NAME}: get comfortable with AI and agents",
      "Plain-language help for everyday people: find the right AI tool for your life or your job, with honest pricing and privacy notes.",
      f"""<section class="hero"><h1>{e(C['tagline'])}</h1>
<p>{e(NAME)} helps everyday people use AI tools and agents with confidence: what they do, what they cost, and what not to paste in.</p>
<p><a class="btn" href="tools/">Find a tool</a> <a class="btn alt" href="use-cases/">See agent use cases</a></p></section>
{AD('home-top')}
<h2>Start with your field</h2><ul class="chips">{''.join(f'<li><a href="tools/?field={k}">{v}</a></li>' for k,v in F.items())}</ul>
<h2>Popular starting points</h2><div class="grid">{''.join(card(t,'') for t in featured)}</div>
<p class="muted">Directory of {len(TOOLS)} tools. Links are checked automatically every day.</p>""")
    page("tools/index.html", f"AI tool finder: {len(TOOLS)} tools by job and task | {NAME}",
      "Search and filter AI tools and agents by personal or work use, field, task, pricing and free tier.",
      f"""<h1>AI tool finder</h1><p>Filter by what you need. Your filters are saved in the address bar, so you can share the link.</p>
<form id="filters" class="filters" role="search" onsubmit="return false">
<label>Search<input type="search" name="q" placeholder="e.g. meeting notes"></label>
<label>Use<select name="use"><option value="">Any</option><option>Personal</option><option>Work</option></select></label>
<label>Field<select name="field"><option value="">Any field</option>{''.join(f'<option value="{k}">{v}</option>' for k,v in F.items())}</select></label>
<label>Task<select name="task"><option value="">Any task</option>{''.join(f'<option value="{t}">{t.title()}</option>' for t in TASKS)}</select></label>
<label>Pricing<select name="price"><option value="">Any</option>{''.join(f'<option value="{k}">{v}</option>' for k,v in PRICE.items())}</select></label>
<button type="button" id="reset">Reset</button></form>
<p id="count" aria-live="polite"></p>{AD('finder-top')}<div id="results" class="grid"></div>
<noscript><ul>{''.join(f'<li><a href="{t["slug"]}/">{e(t["name"])}</a></li>' for t in TOOLS)}</ul></noscript>""",
      '<script src="../assets/finder.js" defer></script>')
    for t in TOOLS:
        uses = [u for u in UC if t["slug"] in u["tools"]]
        page(f"tools/{t['slug']}/index.html", f"{t['name']}: pricing, free tier and privacy notes | {NAME}",
          f"{t['name']} ({t['category']}): what it's for, free tier ({t['free_tier']}), pricing summary and what to keep private.",
          f"""<p><a href="../">&larr; All tools</a></p><h1>{e(t['name'])}</h1>
<p class="muted">{e(t['category'])} &middot; Good for: {', '.join(e(F[f]) for f in t['fields'])}</p>
{'<p class="badge warn">Our last automatic check could not reach this site.</p>' if t.get('status')=='dead' else ''}
<dl class="facts"><dt>Website</dt><dd><a href="{e(t['url'])}" rel="noopener">{e(t['url'])}</a></dd>
<dt>Use</dt><dd>{' / '.join(t['use'])}</dd><dt>Tasks</dt><dd>{', '.join(t['tasks'])}</dd>
<dt>Pricing</dt><dd>{PRICE[t['pricing']]}: {e(t['pricing_summary'])}</dd><dt>Free tier</dt><dd>{e(t['free_tier'])}</dd>
<dt>Data sensitivity</dt><dd>{e(t['data_note'])}</dd>
<dt>Source</dt><dd><a href="{e(t['source_url'])}" rel="noopener">Official pricing page</a> (pricing verified {t['pricing_verified'] or 'not yet: check site'})</dd>
<dt>Link last checked</dt><dd>{t['last_checked']}</dd></dl>{AD('tool-page')}
{('<h2>Use cases with '+e(t['name'])+'</h2><ul>'+''.join(f'<li><a href="../../use-cases/#{u["id"]}">{e(u["title"])}</a></li>' for u in uses)+'</ul>') if uses else ''}""")
    page("use-cases/index.html", f"Agent and AI use cases for home and work | {NAME}",
      "Practical ways to use AI assistants and simple agents in your personal life and at work, filterable by field.",
      f"""<h1>Agent use cases</h1><p class="draft">Draft, needs human review. These are starting points, not tested guarantees.</p>
<form class="filters" onsubmit="return false"><label>Field<select id="ucfield"><option value="">All fields</option>{''.join(f'<option value="{k}">{v}</option>' for k,v in F.items())}</select></label></form>
<h2 id="personal">Personal</h2><div id="uc-personal" class="stack"></div>{AD('usecases-mid')}<h2 id="work">Work</h2><div id="uc-work" class="stack"></div>""",
      '<script src="../assets/usecases.js" defer></script>')
    page("news/index.html", f"AI news headlines | {NAME}", "AI news headlines with links to the original sources.",
      """<h1>AI news</h1><p>Coming soon: headlines and links only, from sources whose terms allow it.</p>
<!-- TODO: wire feeds only after each source's terms are verified and recorded in data/sources.yml (approved: true). Show headline, source, date, link. No excerpts or images. -->
<p class="muted">No feeds are connected yet.</p>""")
    page("about/index.html", f"About {NAME}", f"What {NAME} is and how the tool directory is kept up to date.",
      f"""<h1>About {e(NAME)}</h1><p>{e(NAME)} exists to help everyday people get comfortable using AI and agents, safely and without hype.</p>
<h2>How the directory works</h2><ul><li>Pricing facts come from each tool's own pricing page, with the source linked and the date we checked.</li>
<li>Where we couldn't confirm a fact, we say "check site" instead of guessing.</li><li>An automated job checks every tool link daily and flags ones that look down.</li></ul>
<p>[TODO: owner bio and contact]</p>""")
    page("privacy/index.html", f"Privacy policy | {NAME}", f"{NAME} privacy policy.",
      """<h1>Privacy policy</h1><p class="draft">Placeholder. Must be completed (and reviewed) before applying to ad networks.</p>
<p>[TODO: what data is collected (server logs, analytics), cookies and third-party ad partners (e.g., Google AdSense cookie disclosure), opt-out links, contact email, effective date.]</p>""")
    page("disclosure/index.html", f"Affiliate and advertising disclosure | {NAME}", f"How {NAME} makes money.",
      """<h1>Affiliate &amp; advertising disclosure</h1><p class="draft">Placeholder.</p>
<p>[TODO: This site may display ads and may earn commissions from some links. Listings are not paid placements unless marked. Fill in before monetizing.]</p>""")
    page("404.html", f"Not found | {NAME}", "Page not found.", f'<h1>Page not found</h1><p><a href="{BASE}/">Go home</a></p>')
    urls = ["", "tools/", "use-cases/", "news/", "about/", "privacy/", "disclosure/"] + [f"tools/{t['slug']}/" for t in TOOLS]
    (OUT/"sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + "".join(f"<url><loc>{BASE}/{u}</loc></url>" for u in urls) + "</urlset>\n")
    (OUT/"robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {BASE}/sitemap.xml\n")
    print(f"built {len(urls)} pages into {OUT}")

if __name__ == "__main__": build()
