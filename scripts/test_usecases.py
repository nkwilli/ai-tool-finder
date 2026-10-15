import sys
from playwright.sync_api import sync_playwright
B=sys.argv[1] if len(sys.argv)>1 else "http://localhost:8766/";ok=True
with sync_playwright() as p:
    for eng in ("chromium","webkit"):
        b=getattr(p,eng).launch();pg=b.new_page(**(p.devices["iPhone 13"] if eng=="webkit" else {}));errs=[]
        pg.on("pageerror",lambda e:errs.append(str(e)))
        pg.goto(B+"use-cases/");pg.wait_for_selector("#uc-work .card")
        opts=pg.eval_on_selector_all("#ucfield option","os=>os.map(o=>[o.value,o.textContent])");res=[];seen=set()
        for v,t in opts:
            pg.select_option("#ucfield",v);pg.wait_for_timeout(150)
            ids=pg.eval_on_selector_all("#uc-personal .card:not([hidden]), #uc-work .card","es=>es.filter(e=>e.offsetParent).map(e=>e.id)")
            exp=int(t.rsplit("(",1)[1].rstrip(")"));res.append(f"{t}: {len(ids)}");seen|=set(ids) if v else set()
            ok&=len(ids)==exp
        pg.goto(B+"use-cases/?show=other");pg.wait_for_timeout(700)
        url_ok=pg.input_value("#ucfield")=="other" and pg.locator("#uc-work .card").count()==3
        pg.screenshot(path=f"screenshots/usecases-other-{eng}.png",full_page=True)
        print(eng,res,"all-covered:",len(seen),"url:",url_ok,"errors:",errs);ok&=url_ok and not errs;b.close()
sys.exit(0 if ok else 1)
