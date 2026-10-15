"""Search regression test. Usage: test_search.py BASE_URL [chromium|webkit]"""
import sys, json, urllib.parse
from playwright.sync_api import sync_playwright
B = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8766/"
ENG = sys.argv[2] if len(sys.argv) > 2 else "chromium"
A = {"ChatGPT","Claude","Google Gemini","Grok","Microsoft Copilot (Microsoft 365)","Perplexity"}  # general assistants
# query -> acceptable tools; at least one must be in the top 3
Q = {
"manager":A|{"Notion","Otter.ai"},"teacher":{"MagicSchool","Khanmigo"},"nurse":{"Heidi Health","Freed","Abridge"},"doctor":{"Heidi Health","Freed","Abridge"},
"recruiter":A|{"HubSpot (Breeze AI)","Grammarly"},"developer":{"GitHub Copilot","Cursor"},"accountant":{"Julius AI","Microsoft Copilot (Microsoft 365)"},
"lawyer":{"Harvey","Spellbook","CoCounsel (Thomson Reuters)"},"student":{"Khanmigo","NotebookLM","Elicit","Consensus"},"parent":{"Khanmigo"},
"marketer":{"Jasper","Canva","HubSpot (Breeze AI)"},"salesperson":{"HubSpot (Breeze AI)"},"writer":{"Grammarly","QuillBot","Jasper"}|A,
"designer":{"Canva","Midjourney"},"small business owner":{"Zapier","Notion","HubSpot (Breeze AI)","Make","Julius AI","Lovable"}|A,
"email":{"Grammarly"}|A,"meetings":{"Otter.ai","Fireflies.ai","Fathom","Reclaim.ai"},"meeting notes":{"Otter.ai","Fireflies.ai","Fathom"},
"notes":{"Notion","NotebookLM","Otter.ai","Fireflies.ai","Fathom"},"slides":{"Gamma","Canva"},"make a presentation":{"Gamma","Canva"},
"presentaion":{"Gamma","Canva"},"spreadsheet":{"Microsoft Copilot (Microsoft 365)","Julius AI"},"scheduling":{"Reclaim.ai","Motion"},
"research":{"Perplexity","Elicit","Consensus","NotebookLM"},"images":{"Midjourney","Canva","Runway"},"make a logo":{"Canva","Midjourney"},
"video":{"Runway","HeyGen","Synthesia","Descript"},"coding":{"GitHub Copilot","Cursor"},"write code":{"GitHub Copilot","Cursor","Claude"},
"customer support":{"HubSpot (Breeze AI)"},"customer emails":{"HubSpot (Breeze AI)","Grammarly"}|A,"translate":{"DeepL"},"translation":{"DeepL"},
"help me write a resume":A|{"Grammarly","QuillBot"},"cover letter":A|{"Grammarly","QuillBot"},"plan a trip":A,"grocery list":A,"meal plan":A,
"summarize pdf":A|{"NotebookLM"},"study for exam":{"NotebookLM","Khanmigo","Quizlet"}|A,"homework help":{"Khanmigo"},"budget":{"Julius AI","Cleo","Monarch Money"},
"chatgtp":{"ChatGPT"},"chatgpt":{"ChatGPT"},"cluade":{"Claude"},"gemni":{"Google Gemini"},"grammer":{"Grammarly","QuillBot"},
"transcribe an interview":{"Otter.ai","Descript","Fireflies.ai","Fathom"},"podcast":{"Descript","ElevenLabs"},"voiceover":{"ElevenLabs"},
"make music":{"Suno"},"automate tasks":{"Zapier","Make","n8n"},"automation":{"Zapier","Make","n8n"},"build a website":{"Lovable"},
"contract review":{"Spellbook","Harvey","CoCounsel (Thomson Reuters)"},"clinical notes":{"Heidi Health","Freed","Abridge"},
"lesson plan":{"MagicSchool"},"social media posts":{"Canva","Jasper"},"proofread":{"Grammarly","QuillBot"},"dictation":{"Wispr Flow"},
"focus time":{"Reclaim.ai","Motion"},"analyze data":{"Julius AI"},"brainstorm ideas":A,"xyzzy":set(),
}
bad=[];rows=[]
with sync_playwright() as p:
    br=getattr(p,ENG).launch()
    pg=br.new_page(**(p.devices["iPhone 13"] if ENG=="webkit" else {}))
    errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(B+"tools/");pg.wait_for_selector("#results .card")
    for q,ok in Q.items():
        pg.fill("input[name=q]",q);pg.wait_for_timeout(120)
        names=pg.locator("#results .card h3 a").all_inner_texts();c=pg.inner_text("#count")
        top=names[:3];good=len(names)>0 and (not ok or any(n in ok for n in top)) and "0 tools" not in c
        rows.append((q,c,top,good))
        if not good: bad.append(q)
    # filters that exclude everything
    pg.goto(B+"tools/?field=legal&task=video&q=coding");pg.wait_for_timeout(600)
    fx=pg.locator("#results .card").count();rows.append(("[filters exclude all]",pg.inner_text("#count"),pg.locator("#results .card h3 a").all_inner_texts()[:3],fx>0))
    if fx==0: bad.append("filters")
    br.close()
for q,c,top,g in rows: print(f"{'OK ' if g else 'BAD'} | {q} | {c} | {', '.join(top)}")
print(ENG,"queries:",len(rows),"bad:",bad,"errors:",errs)
sys.exit(1 if bad or errs else 0)
