import sys
from playwright.sync_api import sync_playwright
B=sys.argv[1] if len(sys.argv)>1 else "http://localhost:8766/"
Q=["manager","teacher","meeting notes","email","make a presentation","nurse","coding","budget","zzqx"]
errs=[];fail=False
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page();pg.on("pageerror",lambda e:errs.append(str(e)))
    for q in Q:
        pg.goto(B+"tools/?q="+q.replace(" ","+"));pg.wait_for_timeout(700)
        names=pg.locator("#results .card h3 a").all_inner_texts();c=pg.inner_text("#count")
        print(f"{q!r}: {c} -> {names[:6]}")
        if not names: fail=True
    b.close()
print("errors:",errs); sys.exit(1 if fail or errs else 0)
