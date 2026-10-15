from playwright.sync_api import sync_playwright
B="http://localhost:8766/"; errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={"width":1300,"height":900})
    pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("console",lambda m:m.type=="error" and errs.append(m.text))
    for path,name in [("","home"),("tools/","finder"),("use-cases/","usecases"),("news/","news"),("about/","about"),("tools/claude/","tool-claude")]:
        pg.goto(B+path); pg.wait_for_timeout(600); pg.screenshot(path=f"screenshots/{name}.png",full_page=True)
    pg.goto(B+"tools/"); pg.wait_for_timeout(500); total=pg.locator("#results .card").count()
    pg.select_option("select[name=field]","education"); pg.select_option("select[name=price]","freemium"); pg.wait_for_timeout(200)
    n=pg.locator("#results .card").count(); url=pg.url
    pg.goto(url); pg.wait_for_timeout(500); n2=pg.locator("#results .card").count()
    pg.fill("input[name=q]","meeting"); pg.wait_for_timeout(200); nq=pg.locator("#results .card").count()
    pg.screenshot(path="screenshots/finder-filtered.png",full_page=True)
    pg.goto(B+"use-cases/?field=healthcare-admin"); pg.wait_for_timeout(500); uw=pg.locator("#uc-work .card").count()
    m=b.new_page(viewport={"width":390,"height":844}); m.goto(B+"tools/?use=Work&field=it"); m.wait_for_timeout(500); m.screenshot(path="screenshots/finder-mobile.png",full_page=True)
    b.close()
print(dict(total=total,edu_freemium=n,url=url,reload_same=n==n2,edu_freemium_meeting=nq,health_work_usecases=uw,errors=errs))
assert not errs and total==38 and n==n2 and 0<n<total
