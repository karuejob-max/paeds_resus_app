# Database snapshot (before reset)

Generated locally (no credentials stored here).

Database name: `defaultdb`

## Tables (117)

- `__drizzle_migrations`
- `__drizzle_migrations__`
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
    "hash": "b6ab6fba0518a9f65065683e8165012b7e15b9594fc5866bbe374ca20d8b11ee",
    "created_at": 1772836612759
  },
  {
    "id": 25,
    "hash": "26698192de67ce372f044b45db886b5e3bc6eb2374198f29be58fae43dbf49e2",
    "created_at": 1772845191677
  },
  {
    "id": 26,
    "hash": "32eef79b375bcd6cb75ce261d39f337695357466922bef1c2b388b82f4711fcd",
    "created_at": 1773577752290
  },
  {
    "id": 27,
    "hash": "b4c2fa686d1cd19727e6077936fc4be0de2945d4abffa88ebcebebaf1146682e",
    "created_at": 1775000000000
  },
  {
    "id": 28,
    "hash": "c1e9f6b0c41657ab3c7965e82f7de21eea3a3d537e0169198aed74af8c21c01d",
    "created_at": 1775188687422
  },
  {
    "id": 29,
    "hash": "45e4bbb104c88158f2e9d4905ec8818311e6339974c97be2e8b27ba31f0bceb0",
    "created_at": 1775455956764
  },
  {
    "id": 30,
    "hash": "4adaa24e6b1da59acab8d57b6d8517d4b6e484b94e9d06f273dfbb8c60237ffd",
    "created_at": 1775470457518
  },
  {
    "id": 31,
    "hash": "113de550a1ed30720ac8f84eff8d52faee99edc143375cb8d49915eb878c8fcc",
    "created_at": 1775483721728
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
| paymentMethod | enum('m-pesa','admin-free','promo-code') | YES |  |  |  |
| promoCodeId | int | YES |  |  |  |
| amountPaid | int | YES |  |  |  |
| transactionId | varchar(255) | YES |  |  |  |
| paymentId | int | YES |  |  |  |
| progressPercentage | int | YES |  | 0 |  |
| quizScore | int | YES |  |  |  |
| certificateUrl | text | YES |  |  |  |
| certificateIssuedAt | timestamp | YES |  |  |  |
| completedAt | timestamp | YES |  |  |  |
| createdAt | timestamp | NO |  | now() | DEFAULT_GENERATED |
| updatedAt | timestamp | NO |  | now() | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |

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



---

# Database snapshot (after migrate)

Generated locally (no credentials stored here).

Database name: `defaultdb`

## Tables (121)

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
    "hash": "b2ba62d710cdddf493918b34e3027d8daafcd82800723f5e9164371bc1740b6b",
    "created_at": 1768919923457
  },
  {
    "id": 2,
    "hash": "a26f51c3c0d3fe8be2b784e29bf350617d19aec11d6a078d40772cccec93d245",
    "created_at": 1768920277057
  },
  {
    "id": 3,
    "hash": "eafb98b783754ec1d169bbcb092f99ea86556328c1aeef7182b0cb227f19c237",
    "created_at": 1768948777069
  },
  {
    "id": 4,
    "hash": "a32342a28173d36f5bcb8d55766014443895b57693a2096026031ee6198fc5bb",
    "created_at": 1768986478850
  },
  {
    "id": 5,
    "hash": "f3d82b472632bfa318604da7192f354e78ca6a7e286e006af0421b8cbaa52e26",
    "created_at": 1769001113765
  },
  {
    "id": 6,
    "hash": "b80a0f1e4323b85ae1a9169a8e0e6728f2d68b216984b598c51e0830bc7efe09",
    "created_at": 1769001194883
  },
  {
    "id": 7,
    "hash": "85ac24cab7a4efd135982725de0447d41cd796ffee5497c74e67f1ddeb165d87",
    "created_at": 1769108859054
  },
  {
    "id": 8,
    "hash": "87788891d56622383433791491c693a780679ea943af5d9fa72e06ebd78374b8",
    "created_at": 1769110078827
  },
  {
    "id": 9,
    "hash": "3101f4b9fce0fbe0e380433607882bc055d6adbb2105a65e5831e2661991547d",
    "created_at": 1769234988118
  },
  {
    "id": 10,
    "hash": "9223661ccdf20759ff8b4c4cd7403b82c47b1e203e4ed3fe3734c8757f5d9e52",
    "created_at": 1769242008250
  },
  {
    "id": 11,
    "hash": "d39375dad8899330336cab768776e15ff9e6a5a9ee75457daebe05b3deb62b6a",
    "created_at": 1769245661081
  },
  {
    "id": 12,
    "hash": "8f37d5cb4dadd0f7535d77ecb035a7935e120414c579b0cfd04f2dedc82c3344",
    "created_at": 1769246105334
  },
  {
    "id": 13,
    "hash": "72db4fd61628a1ed4f76cd428515d52435fc9c3dcd1804e32f0a093d65d45578",
    "created_at": 1769246831138
  },
  {
    "id": 14,
    "hash": "8db7d224cab58905af41c9450a814fbc3da66586d82e6c35e68aa43e3704281c",
    "created_at": 1769247255456
  },
  {
    "id": 15,
    "hash": "c73f5aec2a6f28cc2376c26ba754e0b534cc9831afa186a97df3239e77c598c6",
    "created_at": 1769247661835
  },
  {
    "id": 16,
    "hash": "6723bc5af6df5103dcca62e9df16c6c00c9429e7e67e37b5da88b46a786e7bae",
    "created_at": 1769247837096
  },
  {
    "id": 17,
    "hash": "94b2b7b9e186d2fe2b9574fcbde00f9ddb4f057c8048604f266b38f824ff7feb",
    "created_at": 1769250267563
  },
  {
    "id": 18,
    "hash": "f9938f65993a4e08955e24e98424ea24e238e9f77cbf0e855028f2701c3ce2f3",
    "created_at": 1769253586446
  },
  {
    "id": 19,
    "hash": "7a6bf882d6d179bd0385ef14a6c52c1c5dba2abaf8c131098461f2db400596c0",
    "created_at": 1769379207899
  },
  {
    "id": 20,
    "hash": "7b96563a587cf449153cbec5311b50552b264700423f8f0002315df0f29c0f36",
    "created_at": 1769379309685
  },
  {
    "id": 21,
    "hash": "8ce545502b5dfab8fa3318802de411fa7f20ee6f71b711611a7a143be4097321",
    "created_at": 1770135778663
  },
  {
    "id": 22,
    "hash": "1fac3bd14d8c3a5e2468429249f1b7f00fe898ee8db9c78fe0c6af8deab32a62",
    "created_at": 1770136034921
  },
  {
    "id": 23,
    "hash": "10317356a451f86cd5c01ea6eada351c1cb5ac11444ac3599bed1a03ffc69793",
    "created_at": 1770466490275
  },
  {
    "id": 24,
    "hash": "26698192de67ce372f044b45db886b5e3bc6eb2374198f29be58fae43dbf49e2",
    "created_at": 1772845191677
  },
  {
    "id": 25,
    "hash": "a541adb5eb2e06cd8b9e4c7bd92709532292246455e8f7a799c339905e447efc",
    "created_at": 1773577752290
  },
  {
    "id": 26,
    "hash": "93f474ff5c2a2887a5357870051f02b43b83990391028c4190daad9d69542b5f",
    "created_at": 1775000000000
  },
  {
    "id": 27,
    "hash": "35b123a93d96fc9875baae873e3ad7ca32c33200b6056d972c47b7642f569dd2",
    "created_at": 1774941925398
  },
  {
    "id": 28,
    "hash": "ff985d79a1b0c856d59a1491151c60fbca13e75dba3c44c8c7aa98b34fe18875",
    "created_at": 1775188687422
  },
  {
    "id": 29,
    "hash": "ec11b405fb68dedc5d030474d883c5759b359ee9ccd684f2d098e8b6f30683e6",
    "created_at": 1775455956764
  },
  {
    "id": 30,
    "hash": "8f44002ee8ef8af9feea25b8ec27df38310498818440a359b6b086d5af6cfb28",
    "created_at": 1775470457518
  },
  {
    "id": 31,
    "hash": "6f74697964d13691c549c306cf66294aac2488ed983f63906d54a2a4b56d73d5",
    "created_at": 1775483721728
  },
  {
    "id": 32,
    "hash": "685b5763d6811ed4cc332161c037c1eb425a55a74249e159df2703c6b74bc221",
    "created_at": 1775544161926
  },
  {
    "id": 33,
    "hash": "4e0f946337fb196001c6a94da2e9f94cbc921bcc0eb7fea79dafe311a7a480f5",
    "created_at": 1775617263839
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

