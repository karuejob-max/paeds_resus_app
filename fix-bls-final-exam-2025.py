#!/usr/bin/env python3
"""
Fix 2 issues in the BLS Final Exam (Quiz 150):

Issue 1 — Q9 (id=1496): Correct answer mismatch
  correctAnswer field = "Call emergency services and get an AED, then begin CPR"
  But none of the 4 options match this string exactly.
  Option A = "Call emergency services first" (close but not matching)
  Fix: update correctAnswer to match option A exactly, OR update option A to match.
  Best fix: update option A to exactly match the correctAnswer string.

Issue 2 — Q3 (id=1490): Minor — the explanation says "Two-rescuer child CPR uses a 15:2 ratio"
  but option D says "3:1" which is the neonatal ratio. This is fine as a distractor.
  No fix needed.

Q1 (id=1488): 100-120/min ✅
Q2 (id=1489): At least 5 cm, no more than 6 cm ✅
Q3 (id=1490): 15:2 ✅
Q4-Q8, Q10-Q15: All correct ✅
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

# Fix Q9 (id=1496): Update options so option A matches the correctAnswer string exactly
# Current options: ["Call emergency services first", "Do 2 minutes of CPR, then call",
#                   "Begin CPR and do not call", "Place in recovery position"]
# correctAnswer: "Call emergency services and get an AED, then begin CPR"
# Fix: update option A to match the correctAnswer exactly

new_options_q9 = json.dumps([
    "Call emergency services and get an AED, then begin CPR",
    "Do 2 minutes of CPR, then call emergency services",
    "Begin CPR and do not call — stay with the child",
    "Place in recovery position and monitor breathing"
])

cur.execute("""
    UPDATE quizQuestions
    SET options = %s
    WHERE id = 1496
""", (new_options_q9,))
print(f"  ✓ Fixed Q9 (id=1496): option A now matches correctAnswer exactly")
print(f"    correctAnswer: 'Call emergency services and get an AED, then begin CPR'")

conn.commit()

# Verify the fix
cur.execute("SELECT options, correctAnswer FROM quizQuestions WHERE id = 1496")
row = cur.fetchone()
opts = json.loads(row[0])
correct = row[1]
match = correct in opts
print(f"  ✓ Verification: correctAnswer in options = {match}")
if not match:
    print(f"  ✗ MISMATCH — correctAnswer: [{correct}]")
    for o in opts:
        print(f"    Option: [{o}]")

conn.close()
print(f"\n✅ BLS Final Exam fix complete — 1 question corrected")
