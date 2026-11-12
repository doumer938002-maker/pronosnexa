#!/usr/bin/env python3
"""Mise a jour LEGERE sans le PC : cotes, non-partants et arrivees (aujourd'hui + demain) -> data/live.json.
Lance toutes les ~5 min par GitHub Actions. Ne recalcule PAS les probabilites NEXA (ca reste sur le PC)."""
import json, sys, time, datetime as dt, urllib.request
from concurrent.futures import ThreadPoolExecutor
BASE = "https://online.turfinfo.api.pmu.fr/rest/client/1/programme"
H = {"User-Agent": "Mozilla/5.0 PronoNexa-live (information)", "Accept": "application/json"}

def get(url):
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=25) as r:
                return json.loads(r.read())
        except Exception:
            time.sleep(1 + i)
    return None

def arrivee(c):
    out = []
    for g in c.get("ordreArrivee") or []:
        out += g if isinstance(g, list) else [g]
    return out

def jour(d):
    prog = get(f"{BASE}/{d:%d%m%Y}")
    if not prog or "programme" not in prog:
        return {}
    items = []
    for reu in prog["programme"].get("reunions", []):
        for c in reu.get("courses", []):
            items.append((f"{d.isoformat()}-R{reu.get('numOfficiel')}C{c.get('numOrdre')}", reu.get("numOfficiel"), c.get("numOrdre"), c))
    def one(it):
        cid, R, C, c = it
        pa = get(f"{BASE}/{d:%d%m%Y}/R{R}/C{C}/participants") or {}
        parts = {}
        for p in pa.get("participants", []):
            if p.get("numPmu") is None:
                continue
            cote = ((p.get("dernierRapportDirect") or {}).get("rapport")) or ((p.get("dernierRapportReference") or {}).get("rapport"))
            parts[str(p["numPmu"])] = {"cote": cote, "np": p.get("statut") == "NON_PARTANT"}
        arr = arrivee(c)
        return cid, {"statut": c.get("statut"), "arrivee": arr, "partants": parts, "fini": bool(arr)}
    with ThreadPoolExecutor(max_workers=6) as ex:
        return dict(ex.map(one, items))

if __name__ == "__main__":
    t = dt.date.today()
    courses = {}
    for d in (t, t + dt.timedelta(days=1)):
        courses.update(jour(d))
    if not courses:
        print("PMU injoignable : live.json inchange"); sys.exit(0)
    with open("data/live.json", "w", encoding="utf-8") as f:
        json.dump({"maj": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"), "courses": courses}, f, separators=(",", ":"))
    print(len(courses), "courses")
