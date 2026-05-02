#!/usr/bin/env python3
"""
Fix 2 broken questions in the ACLS Final Exam (Quiz 151):

Q6 [id=1508] MATCH=False:
  Question: "During a resuscitation attempt, the Team Leader asks you to perform chest compressions.
             You notice the patient is on a soft mattress. What should you do?"
  correctAnswer: "Place a CPR board under the patient to provide a firm surface"
  BUT options are: cardioversion 100J, adenosine, amiodarone, atropine 0.5mg
  → Wrong options pasted from another question. Fix: update options to match the correct answer.

Q7 [id=1509] MATCH=False:
  Question: "When is it appropriate to place a victim in the recovery position?"
  correctAnswer: "When the victim is unresponsive but breathing normally"
  BUT options are: 50-100J, 200J, 360J, 2J/kg (defibrillation energies!)
  → Wrong options pasted from another question. Fix: update options to match the correct answer.
  NOTE: This is also a BLS-scope question. Replace with a proper ACLS team dynamics question.
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

# Fix Q6 [id=1508]: Team dynamics / CPR board question
# Keep the question (it's a valid ACLS team dynamics question), fix the options
new_q6_options = json.dumps([
    "Continue compressions — the mattress is adequate",
    "Place a CPR board under the patient to provide a firm surface",
    "Stop CPR and move the patient to the floor",
    "Increase compression rate to compensate for the soft surface"
])
new_q6_correct = "Place a CPR board under the patient to provide a firm surface"

cur.execute("""
    UPDATE quizQuestions
    SET options = %s, correctAnswer = %s
    WHERE id = 1508
""", (new_q6_options, new_q6_correct))
print("  ✓ Fixed Q6 [id=1508]: CPR board / team dynamics — options corrected")

# Fix Q7 [id=1509]: Replace recovery position (BLS scope) with a proper ACLS question
# Replace with: ACLS team roles — who calls time of death / leads resuscitation
new_q7_question = "During a resuscitation attempt, a team member disagrees with the Team Leader's drug order. What is the correct response according to ACLS team dynamics?"
new_q7_options = json.dumps([
    "Administer the drug without comment to avoid conflict",
    "Refuse to administer the drug and leave the room",
    "Clearly state the concern using closed-loop communication, then follow the Team Leader's confirmed decision",
    "Escalate immediately to the hospital administrator"
])
new_q7_correct = "Clearly state the concern using closed-loop communication, then follow the Team Leader's confirmed decision"
new_q7_explanation = ("ACLS team dynamics: closed-loop communication means the team member states their concern clearly "
    "('I want to confirm — the order is amiodarone 300 mg?'), the Team Leader confirms or corrects, and the team member "
    "acknowledges. A team member should never silently comply with a potentially wrong order, but also should not "
    "unilaterally override the Team Leader. The Team Leader has final authority unless a clear patient safety error is identified.")

cur.execute("""
    UPDATE quizQuestions
    SET question = %s, options = %s, correctAnswer = %s, explanation = %s
    WHERE id = 1509
""", (new_q7_question, new_q7_options, new_q7_correct, new_q7_explanation))
print("  ✓ Fixed Q7 [id=1509]: Replaced BLS recovery position question with ACLS team dynamics / closed-loop communication")

conn.commit()

# Verify both fixes
print("\n  Verification:")
for qid, label in [(1508, "Q6"), (1509, "Q7")]:
    cur.execute("SELECT options, correctAnswer FROM quizQuestions WHERE id = %s", (qid,))
    row = cur.fetchone()
    opts = json.loads(row[0])
    correct = row[1]
    match = correct in opts
    status = "✓ PASS" if match else "✗ FAIL"
    print(f"    {status} {label} [id={qid}]: correctAnswer in options = {match}")

conn.close()
print("\n✅ ACLS Final Exam Q6 and Q7 fixed — all 20 questions now have correct options")
