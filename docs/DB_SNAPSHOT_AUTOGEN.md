# Database snapshot (before reset)

Generated locally (no credentials stored here).

Database name: `paeds_resus`

## Tables (122)

- `__drizzle_migrations`
- `accreditationApplications`
- `accreditedFacilities`
- `achievements`
- `adminAuditLog`
- `alertConfigurations`
- `alertDeliveryLog`
- `alertHistory`
- `alertStatistics`
- `alertSubscriptions`
- `alerts`
- `analyticsEvents`
- `assessments`
- `auditLogs`
- `cannedResponses`
- `capstoneSubmissions`
- `careSignalEvents`
- `certificateDownloadFeedback`
- `certificates`
- `certificationExams`
- `chainOfSurvivalCheckpoints`
- `chatAnalytics`
- `chatConversations`
- `chatMessages`
- `clinicalReferrals`
- `conditionSymptomMapping`
- `contracts`
- `conversionFunnelEvents`
- `courses`
- `cprEvents`
- `cprProtocols`
- `cprSessions`
- `cprTeamMembers`
- `defibrillatorEvents`
- `diagnosisAccuracy`
- `diagnosisHistory`
- `differentialDiagnosisScores`
- `emergencyMedications`
- `emergencyProtocols`
- `enrollments`
- `errorTracking`
- `eventOutcomes`
- `experimentAssignments`
- `experiments`
- `facilityScores`
- `featureFlags`
- `fellowshipGraceUsage`
- `fellowshipProgress`
- `fellowshipStreakResets`
- `guidelineChanges`
- `guidelines`
- `hospitalImprovementMetrics`
- `impactMetrics`
- `incidents`
- `institutionalAccounts`
- `institutionalAnalytics`
- `institutionalInquiries`
- `institutionalStaffMembers`
- `interventionLog`
- `interventions`
- `investigationAnalysis`
- `investigationHistory`
- `investigationResults`
- `investigationTrends`
- `investigations`
- `leaderboardRankings`
- `learnerProgress`
- `medicalConditions`
- `medicationLog`
- `microCourseEnrollments`
- `microCourses`
- `modules`
- `npsSurveyResponses`
- `outcomes`
- `parentSafeTruthEvents`
- `parentSafeTruthSubmissions`
- `passwordResetTokens`
- `patientVitals`
- `patients`
- `payments`
- `performanceEvents`
- `performanceHistory`
- `performanceMetrics`
- `platformSettings`
- `promoCodes`
- `protocolAdherenceLog`
- `protocolDecisionPoints`
- `protocolGuidelines`
- `protocolRecommendations`
- `protocolStatus`
- `protocolSteps`
- `providerPerformanceMetrics`
- `providerProfiles`
- `providerStats`
- `quizQuestions`
- `quizzes`
- `quotations`
- `referenceRanges`
- `referrals`
- `resusGPSCases`
- `resusGPSSessions`
- `riskScoreHistory`
- `safetruthEvents`
- `smsReminders`
- `supportAgents`
- `supportTicketMessages`
- `supportTickets`
- `symptoms`
- `systemDelayAnalysis`
- `systemGaps`
- `teamPerformance`
- `trainingAttendance`
- `trainingSchedules`
- `userCohortMembers`
- `userCohorts`
- `userFeedback`
- `userInsights`
- `userProfiles`
- `userProgress`
- `users`
- `vitalSignsHistory`
- `webhookRetryQueue`

## __drizzle_migrations

```json
[
  {
    "id": 1,
    "hash": "814a08e40d7fc2bcfd458759d18319198ca8ae394f2fa15617a78678e9c9c93b",
    "created_at": 1768919923457
  },
  {
    "id": 2,
    "hash": "88294b9dba80beb2bf847915f9275976b79fd65550a7df4388e91113869b205f",
    "created_at": 1768920277057
  },
  {
    "id": 3,
    "hash": "ddab09804b210ba5bc62918979f9e65f05b300885f35596c67b5369eb9e6c6b7",
    "created_at": 1768948777069
  },
  {
    "id": 4,
    "hash": "040ccd5bae19cc6b099c6314208b1750ba870f5454d475f000fe9e0ec759dbca",
    "created_at": 1768986478850
  },
  {
    "id": 5,
    "hash": "602d2ea34c45ca28bc974e318c5ac7e06cff2a76545dff08da7ecd9f0924e34c",
    "created_at": 1769001113765
  },
  {
    "id": 6,
    "hash": "b56cffcea9253ed6b6ec972694aa9ceccc1ce28cd3dd05f323f594224f669967",
    "created_at": 1769001194883
  },
  {
    "id": 7,
    "hash": "ecf812e0bf46aa8d032e7f22c0f191ce0ada8cdca6bcf7db72fc68d9c2ac3ede",
    "created_at": 1769108859054
  },
  {
    "id": 8,
    "hash": "4e14db71d36392c59f8ace8bde93a7c7c9891d9f9f437e1cda1c5ce0e6661e1d",
    "created_at": 1769110078827
  },
  {
    "id": 9,
    "hash": "665e2bcf1a102397ea0658c39f7cad0ceed54fb81e448945e78c144cdf09637b",
    "created_at": 1769234988118
  },
  {
    "id": 10,
    "hash": "31b852542614f9b4e4e1dc3aa7260b8735081e5ecabfb57817d4af025b167363",
    "created_at": 1769242008250
  },
  {
    "id": 11,
    "hash": "80343719dc75efba755f561c7185492831056d5588e10fd36275364af3ea1b8a",
    "created_at": 1769245661081
  },
  {
    "id": 12,
    "hash": "6dd92baa57085990f9c8a4c51188383d4a901ecd86741b12325996a4fc9b9469",
    "created_at": 1769246105334
  },
  {
    "id": 13,
    "hash": "b98d01b7bab67e838505f3fd8a88c6ce3e0cbe428780823ca3bdee2a3474f699",
    "created_at": 1769246831138
  },
  {
    "id": 14,
    "hash": "4905143080c5b068afbe86ee851a8725f30a87d74d31bfd520c12e316804697e",
    "created_at": 1769247255456
  },
  {
    "id": 15,
    "hash": "78caeb6ea940666bf643cddc1367dc58580754043701488117cb4d84d2c1740c",
    "created_at": 1769247661835
  },
  {
    "id": 16,
    "hash": "e86bc2fb10967fcdbd9e5dd339f3c8b1e8fb54579a9b7030433c8dbc9fe26175",
    "created_at": 1769247837096
  },
  {
    "id": 17,
    "hash": "ece82cae234dc11f830bfa832348d757817847368318a0faa7170c05ad413a69",
    "created_at": 1769250267563
  },
  {
    "id": 18,
    "hash": "9de377da7c093b031f20a39c6b53c659fd17978a73929134e6193f3216925089",
    "created_at": 1769253586446
  },
  {
    "id": 19,
    "hash": "677c7bbc0beaf7978151d910c91592cb75d48ea11d62c4716e61011c428a400e",
    "created_at": 1769379207899
  },
  {
    "id": 20,
    "hash": "9803ce71815dc4d0a792e0c72e59879db524a1e93022887d6cd117e7d81e03af",
    "created_at": 1769379309685
  },
  {
    "id": 21,
    "hash": "6e06768eaabe4ddece77b533434c938ccc8313cc52a33f8b109711183617ac43",
    "created_at": 1770135778663
  },
  {
    "id": 22,
    "hash": "336c151c396d66199b06a4235748e5dc4192866366d7d8a8d4eedb27249c5df2",
    "created_at": 1770136034921
  },
  {
    "id": 23,
    "hash": "db745393065d816b6406eb407da9caa68fb0ddf3526dbc5c6daf02bceb957a39",
    "created_at": 1770466490275
  },
  {
    "id": 24,
    "hash": "26698192de67ce372f044b45db886b5e3bc6eb2374198f29be58fae43dbf49e2",
    "created_at": 1772845191677
  },
  {
    "id": 25,
    "hash": "32eef79b375bcd6cb75ce261d39f337695357466922bef1c2b388b82f4711fcd",
    "created_at": 1773577752290
  },
  {
    "id": 26,
    "hash": "8ebbd6db1464307cb9cd7fbb43bbf9e6df937276ee867b543dc272d7e506c937",
    "created_at": 1775000000000
  },
  {
    "id": 27,
    "hash": "7c1040ebdcd2c921e701df9c4e4a33bc4f810bf5697a3c2ed643d9c81d33483a",
    "created_at": 1774941925398
  },
  {
    "id": 28,
    "hash": "ec8a5349e56305a1e08d570f38f286a88f2355f5c2aa88d9ba38bc67fc4e6f63",
    "created_at": 1775188687422
  },
  {
    "id": 29,
    "hash": "97058692561255f82efbbb98ceb898e9411f1f043285332f5b19b5e05fa5b183",
    "created_at": 1775455956764
  },
  {
    "id": 30,
    "hash": "4adaa24e6b1da59acab8d57b6d8517d4b6e484b94e9d06f273dfbb8c60237ffd",
    "created_at": 1775470457518
  },
  {
    "id": 31,
    "hash": "32821ab1ad86ea3f79b5ffce4ab4bcc44a610888bc6f4bb398c91fa27fc4a03d",
    "created_at": 1775483721728
  },
  {
    "id": 32,
    "hash": "3c922500ec111f59a0338f03a8d2abfef44d29833df465ad58cedce4f562ba1e",
    "created_at": 1775544161926
  },
  {
    "id": 33,
    "hash": "88c62165601048d4198f85d3f1b2a104e04d89c9f6b8a18924bb7012cb2b0273",
    "created_at": 1775617263839
  },
  {
    "id": 34,
    "hash": "c4233ab3166fdab2b2038fc99764244990ddf3ba2a5c59c9724db8007e127ee4",
    "created_at": 1775700000000
  },
  {
    "id": 35,
    "hash": "22706f1785b228f2007344c592ec7cf4dcac0eb9feb5278e8672252bf7d0b42e",
    "created_at": 1776408757379
  },
  {
    "id": 36,
    "hash": "a2b685124369e5451d1acaf18af56f73c4ab02d8f6af2753920a4f4c84c0186b",
    "created_at": 1776872061837
  },
  {
    "id": 37,
    "hash": "3e09983f37e2b595c59f0663733e95d50e784ee6940391d17a857042fc87eb41",
    "created_at": 1776872368057
  },
  {
    "id": 38,
    "hash": "6016d847049d0f8307c1d1a7f0a9be5804be533e5afc9980e2e389212a7caac2",
    "created_at": 1776964795174
  }
]
```

## microCourseEnrollments

| Field | Type | Null | Key | Default | Extra |
| --- | --- | --- | --- | --- | --- |
| id | int | NO | PRI |  | auto_increment |
| userId | int | NO |  |  |  |
| microCourseId | int | NO |  |  |  |
| enrollmentStatus | enum('pending','active','completed','expired') | YES |  | pending |  |
| paymentStatus | enum('pending','completed','free') | YES |  | pending |  |
| paymentId | int | YES |  |  |  |
| progressPercentage | int | YES |  | 0 |  |
| quizScore | int | YES |  |  |  |
| certificateUrl | text | YES |  |  |  |
| certificateIssuedAt | timestamp | YES |  |  |  |
| completedAt | timestamp | YES |  |  |  |
| createdAt | timestamp | NO |  | now() | DEFAULT_GENERATED |
| updatedAt | timestamp | NO |  | now() | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| paymentMethod | enum('m-pesa','admin-free','promo-code') | YES |  |  |  |
| promoCodeId | int | YES |  |  |  |
| amountPaid | int | YES |  |  |  |
| transactionId | varchar(255) | YES |  |  |  |

## certificates

| Field | Type | Null | Key | Default | Extra |
| --- | --- | --- | --- | --- | --- |
| id | int | NO | PRI |  | auto_increment |
| enrollmentId | int | NO |  |  |  |
| userId | int | NO |  |  |  |
| certificateNumber | varchar(255) | YES | UNI |  |  |
| programType | enum('bls','acls','pals','fellowship','instructor') | NO |  |  |  |
| issueDate | timestamp | NO |  |  |  |
| expiryDate | timestamp | YES |  |  |  |
| certificateUrl | text | YES |  |  |  |
| verificationCode | varchar(255) | YES | UNI |  |  |
| createdAt | timestamp | NO |  | now() | DEFAULT_GENERATED |
| renewalReminderSentAt | timestamp | YES |  |  |  |

## enrollments

| Field | Type | Null | Key | Default | Extra |
| --- | --- | --- | --- | --- | --- |
| id | int | NO | PRI |  | auto_increment |
| userId | int | NO |  |  |  |
| programType | enum('bls','acls','pals','fellowship','instructor') | NO |  |  |  |
| trainingDate | timestamp | NO |  |  |  |
| paymentStatus | enum('pending','partial','completed') | YES |  | pending |  |
| amountPaid | int | YES |  | 0 |  |
| ahaPrecourseCompleted | tinyint(1) | YES |  | 0 |  |
| ahaCertificateUrl | text | YES |  |  |  |
| certificateVerified | tinyint(1) | YES |  | 0 |  |
| reminderSent | tinyint(1) | YES |  | 0 |  |
| reminderSentAt | timestamp | YES |  |  |  |
| createdAt | timestamp | NO |  | now() | DEFAULT_GENERATED |
| updatedAt | timestamp | NO |  | now() | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| courseId | int | YES |  |  |  |
| cognitiveModulesComplete | tinyint(1) | NO |  | 0 |  |
| practicalSkillsSignedOff | tinyint(1) | NO |  | 0 |  |
| practicalSignedOffAt | timestamp | YES |  |  |  |
| practicalSignedOffByUserId | int | YES |  |  |  |
| practicalSignedOffByName | varchar(255) | YES |  |  |  |

