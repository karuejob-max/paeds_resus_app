#!/usr/bin/env python3
"""
Replace 4 problematic ACLS final exam questions:
- Q1 (id=1503): BLS question with wrong options → ACLS: VF/pVT first shock energy
- Q2 (id=1504): BLS question with wrong options → ACLS: Adrenaline timing in VF/pVT
- Q3 (id=1505): BLS question with wrong options → ACLS: Amiodarone dose in refractory VF
- Q5 (id=1507): Correct question but option B says "0.5 mg" → fix to "1 mg IV"
"""
import pymysql, json
from urllib.parse import urlparse

DATABASE_URL = 'mysql://avnadmin:AVNS_zT5Qgys_XpDSOXdSbGr@public-karuejob-dbmysql-karuejob-paeds-resus.a.aivencloud.com:10359/defaultdb?ssl-mode=REQUIRED'
parsed = urlparse(DATABASE_URL)
conn = pymysql.connect(
    host=parsed.hostname, port=parsed.port or 3306,
    user=parsed.username, password=parsed.password,
    database=parsed.path.lstrip('/').split('?')[0],
    ssl={'ssl': True}, charset='utf8mb4'
)
cur = conn.cursor()

replacements = [
    {
        "id": 1503,
        "question": "A patient is in ventricular fibrillation (VF). What is the correct initial defibrillation energy for a biphasic defibrillator?",
        "options": json.dumps([
            "100 J",
            "150–200 J (or manufacturer recommendation)",
            "360 J",
            "50 J"
        ]),
        "correctAnswer": "150–200 J (or manufacturer recommendation)",
        "explanation": "Initial defibrillation energy for VF/pVT: 150–200 J biphasic (or follow the manufacturer's recommendation). If the manufacturer's recommendation is unknown, use the maximum available energy. Subsequent shocks should use the same or higher energy. Monophasic defibrillators: 360 J for all shocks. Deliver the shock as rapidly as possible to minimise hands-off time."
    },
    {
        "id": 1504,
        "question": "During resuscitation for VF/pVT, when should adrenaline (epinephrine) 1 mg IV be given?",
        "options": json.dumps([
            "Immediately after the first shock",
            "After the second shock, then every 3–5 minutes",
            "Only after ROSC is achieved",
            "Before the first shock"
        ]),
        "correctAnswer": "After the second shock, then every 3–5 minutes",
        "explanation": "AHA 2025: In VF/pVT, adrenaline 1 mg IV/IO is given after the second shock (i.e., after the second defibrillation attempt), then repeated every 3–5 minutes. For non-shockable rhythms (PEA/asystole), adrenaline is given as soon as IV/IO access is available. Adrenaline increases coronary perfusion pressure during CPR. Do not give adrenaline before the first shock in shockable rhythms — early defibrillation takes priority."
    },
    {
        "id": 1505,
        "question": "VF/pVT persists after 3 shocks and adrenaline. What is the correct first-line antiarrhythmic dose?",
        "options": json.dumps([
            "Lignocaine 1.5 mg/kg IV",
            "Amiodarone 300 mg IV/IO bolus",
            "Magnesium sulphate 2 g IV",
            "Sotalol 1.5 mg/kg IV"
        ]),
        "correctAnswer": "Amiodarone 300 mg IV/IO bolus",
        "explanation": "Refractory VF/pVT (persisting after ≥3 shocks and adrenaline): amiodarone 300 mg IV/IO bolus is the first-line antiarrhythmic (AHA 2025). A second dose of 150 mg IV can be given for recurrent VF/pVT. Lignocaine (lidocaine) 1–1.5 mg/kg IV is an acceptable alternative if amiodarone is unavailable. Magnesium sulphate is indicated for torsades de pointes, not standard VF."
    },
    {
        "id": 1507,
        "question": "What is the correct first-line treatment for symptomatic bradycardia with haemodynamic compromise?",
        "options": json.dumps([
            "Amiodarone 300 mg IV",
            "Atropine 1 mg IV (repeat every 3–5 min, max 3 mg)",
            "Adenosine 6 mg rapid IV push",
            "Synchronised cardioversion 50 J"
        ]),
        "correctAnswer": "Atropine 1 mg IV (repeat every 3–5 min, max 3 mg)",
        "explanation": "Symptomatic bradycardia with haemodynamic compromise: atropine 1 mg IV is first-line (AHA 2025). Repeat every 3–5 minutes to a maximum of 3 mg (3 doses). If atropine is ineffective: transcutaneous pacing (TCP) is the next step — it is faster and more reliable than waiting for dopamine/adrenaline infusions to take effect. Dopamine 5–20 mcg/kg/min or adrenaline 2–10 mcg/min infusion are alternatives if TCP is unavailable."
    }
]

updated = 0
for r in replacements:
    cur.execute("""
        UPDATE quizQuestions
        SET question = %s,
            options = %s,
            correctAnswer = %s,
            explanation = %s
        WHERE id = %s
    """, (r["question"], r["options"], r["correctAnswer"], r["explanation"], r["id"]))
    print(f"  ✓ Updated Q id={r['id']}: {r['question'][:70]}...")
    updated += 1

conn.commit()
conn.close()
print(f"\n✅ {updated} ACLS final exam questions replaced successfully")
