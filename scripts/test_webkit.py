import sys
from playwright.sync_api import sync_playwright
B=sys.argv[1] if len(sys.argv)>1 else "https://nkwilli.github.io/ai-tool-finder/"
ok=True
with sync_playwright() as p:
    b=p.webkit.launch();pg=b.new_page(**p.devices["iPhone 13"]);errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)));pg.on("console",lambda m:m.type=="error" and errs.append(m.text))
    pg.goto(B+"tools/");pg.wait_for_timeout(1500)
    print("initial:",pg.inner_text("#count"))
    pg.locator("input[name=q]").tap();pg.keyboard.type("manager");pg.wait_for_timeout(600)
    n=pg.locator("#results .card").count();print("manager:",pg.inner_text("#count"),n);ok&=n>0
    pg.fill("input[name=q]","");pg.select_option("select[name=field]","education");pg.select_option("select[name=price]","freemium");pg.wait_for_timeout(400)
    n2=pg.locator("#results .card").count();print("education+freemium:",n2,pg.url);ok&=n2>0
    pg.screenshot(path="screenshots/webkit-iphone13.png")
    print("errors:",errs);ok&=not errs;b.close()
sys.exit(0 if ok else 1)
