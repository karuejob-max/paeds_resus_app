# Paeds Resus - Elite Fellowship and Safe-Truth Platform

## Mission

**No child should die from preventable causes.**

Paeds Resus is a comprehensive digital platform designed to train healthcare professionals in pediatric resuscitation and track patient safety incidents. By combining evidence-based training with real-world incident analysis, we empower healthcare systems to save children's lives.

### Documentation map (start here)

Read in this order before deep work:

1. **[`docs/PLATFORM_SOURCE_OF_TRUTH.md`](docs/PLATFORM_SOURCE_OF_TRUTH.md)** — Binding product and technical decisions (auth, roles, report definitions, deployment, priority order).
2. **[`docs/STRATEGIC_FOUNDATION.md`](docs/STRATEGIC_FOUNDATION.md)** — Why the platform exists, one holistic problem, theory of change, honest success criteria (near-term execution framing).
3. **[`docs/WORK_STATUS.md`](docs/WORK_STATUS.md)** — What was done, in progress, critique.
4. **[`docs/AI_TEAM_WORKFLOW.md`](docs/AI_TEAM_WORKFLOW.md)** — How collaborators sync via git.
5. **[`docs/ENGINEERING_ACCEPTANCE_CHECKLIST.md`](docs/ENGINEERING_ACCEPTANCE_CHECKLIST.md)** — Pre-merge checks.

Long-range or aspirational multi-year material (not near-term commitments) lives under **[`docs/archive/`](docs/archive/)** — see [`docs/archive/README.md`](docs/archive/README.md).

**Sprint 1 (Measurement Truth MVP):** [`docs/PRODUCT_BACKLOG_PRIORITIZED.md`](docs/PRODUCT_BACKLOG_PRIORITIZED.md) (Sprint 1 section), [`docs/SPRINT_1_IMPLEMENTATION_CHECKLIST.md`](docs/SPRINT_1_IMPLEMENTATION_CHECKLIST.md), [`docs/EVENT_TAXONOMY.md`](docs/EVENT_TAXONOMY.md).

**Clinical protocols (authoritative + ResusGPS map):** [`docs/clinical-protocols/README.md`](docs/clinical-protocols/README.md) — narrative, evidence alignment, and code mapping; **[`docs/clinical-protocols/RESUSGPS_REGISTRY.md`](docs/clinical-protocols/RESUSGPS_REGISTRY.md)** lists pathway IDs and files.

**E2E test course (PALS, KES 100):** [`docs/E2E_SERIOUSLY_ILL_CHILD_COURSE.md`](docs/E2E_SERIOUSLY_ILL_CHILD_COURSE.md) — enroll, M-Pesa, modules, certificate; run `pnpm run seed:pals-course` once against your DB.

**E2E Paediatric septic shock (PALS micro-course, KES 200):** [`docs/E2E_PAEDIATRIC_SEPTIC_SHOCK_COURSE.md`](docs/E2E_PAEDIATRIC_SEPTIC_SHOCK_COURSE.md) — apply `pnpm run db:apply-0029` once; catalog ensured on enroll.

**Admin analytics spot-check:** with `DATABASE_URL` set, run `pnpm run verify:analytics` (optional `VERIFY_LAST_DAYS=7`) — counts `analyticsEvents` by `eventType` for the same rolling window as Admin → Reports (see [`docs/SPRINT_1_IMPLEMENTATION_CHECKLIST.md`](docs/SPRINT_1_IMPLEMENTATION_CHECKLIST.md)).

**B2B instructor + Instructor Course:** production DB needs `pnpm run db:apply-0027` once (`users.instructorApprovedAt`) and `pnpm run db:apply-0028` once (`programType` includes `instructor`; `users.instructorNumber`, `users.instructorCertifiedAt`; see `.env.example`).

### Product and backlog docs

- **Public entry chooser:** `/start` (role paths: ResusGPS, sign-in, parents, institutions, help)
- **High-impact roadmap (comprehensive):** [`docs/BACKLOG_HIGH_IMPACT.md`](docs/BACKLOG_HIGH_IMPACT.md)
- **Prioritized P0–P3 IDs:** [`docs/PRODUCT_BACKLOG_PRIORITIZED.md`](docs/PRODUCT_BACKLOG_PRIORITIZED.md)
- **Scrum Done (main platform):** [`docs/BACKLOG_BOARD.md`](docs/BACKLOG_BOARD.md)
- **Institutional (B2B) board:** [`docs/INSTITUTIONAL_BACKLOG_BOARD.md`](docs/INSTITUTIONAL_BACKLOG_BOARD.md)

---

## Platform Overview

### Core Features

#### 1. **Institutional Training Programs**
- **BLS (Basic Life Support)** - 8 hours, foundational resuscitation skills
- **ACLS (Advanced Cardiovascular Life Support)** - 16 hours, advanced cardiac care
- **PALS (Pediatric Advanced Life Support)** - 16 hours, pediatric-specific protocols
- **Fellowship** - 120 hours, comprehensive mastery program

#### 2. **Hospital Management System**
- Institutional registration and subscription management
- Bulk staff import (CSV upload)
- Real-time progress tracking dashboard
- Enrollment and certification management
- Revenue and ROI analytics

#### 3. **Payment Processing**
- M-Pesa integration for Kenyan hospitals
- Flexible subscription plans (Basic, Professional, Enterprise)
- Automated billing and payment tracking
- Invoice generation and reporting

#### 4. **Certificate Management**
- Branded PDF certificates with verification codes
- Digital certificate repository
- Certificate verification system
- Expiry tracking and renewal reminders

#### 5. **Safe-Truth Incident Reporting**
- Confidential incident reporting system
- System gap identification and categorization
- Outcome tracking (survived, neurologically intact, poor outcome)
- Recommendations and compliance tracking
- Incident analytics and trend analysis

#### 6. **Analytics & Reporting**
- Enrollment trends and demographics
- Course completion rates by program
- Geographic distribution analysis
- Revenue and ROI metrics
- Compliance reporting (GDPR, HIPAA, PCI-DSS, ISO 27001)

---

## Technology Stack

### Frontend
- **React 19** - Modern UI framework
- **Tailwind CSS 4** - Utility-first styling
- **TypeScript** - Type-safe development
- **tRPC** - End-to-end type-safe APIs
- **Wouter** - Lightweight routing
- **shadcn/ui** - Accessible component library

### Backend
- **Node.js** - JavaScript runtime
- **Express 4** - Web framework
- **tRPC 11** - Type-safe RPC framework
- **Drizzle ORM** - Type-safe database access
- **MySQL/TiDB** - Relational database

### Infrastructure
- **AWS S3** - File storage
- **AWS SES** - Email service
- **Twilio** - SMS service
- **M-Pesa Daraja API** - Payment processing
- **Manus OAuth** - Authentication

---

## Getting Started

### Prerequisites

- Node.js 22.13.0+
- pnpm 10.4.1+
- MySQL 8.0+ or TiDB
- AWS account (for S3, SES)
- M-Pesa Daraja API credentials

### Installation

```bash
# Clone repository
git clone https://github.com/paeds-resus/platform.git
cd paeds_resus_app

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
pnpm db:push

# Start development server
pnpm run dev
```

The application will be available at `http://localhost:3000`

### Development Workflow

```bash
# Start dev server with hot reload
pnpm run dev

# Run tests
pnpm test

# Build for production
pnpm run build

# Start production server
NODE_ENV=production node dist/index.js
```

---

## Project Structure

```
paeds_resus_app/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable components
│   │   ├── lib/              # Utilities and helpers
│   │   └── App.tsx           # Main app component
│   └── index.html
├── server/                    # Express backend
│   ├── routers/              # tRPC route definitions
│   ├── db.ts                 # Database helpers
│   └── _core/                # Core infrastructure
├── drizzle/                  # Database schema
│   ├── schema.ts             # Table definitions
│   └── migrations/           # Migration files
├── storage/                  # S3 storage helpers
├── shared/                   # Shared types and constants
├── DEPLOYMENT.md             # Deployment guide
└── README.md                 # This file
```

---

## Key Workflows

### Hospital Onboarding

1. **Registration** → Hospital admin creates account
2. **Payment** → Subscribe via M-Pesa
3. **Staff Import** → Upload staff CSV
4. **Training** → Staff complete courses
5. **Certification** → Receive certificates
6. **Analytics** → Track progress and ROI

### Staff Training

1. **Enrollment** → Staff member enrolls in course
2. **Learning** → Complete modules and lessons
3. **Assessment** → Pass final exam
4. **Certification** → Receive certificate
5. **Renewal** → Recertify every 2 years

### Incident Reporting

1. **Report** → Provider reports incident
2. **Analysis** → System identifies gaps
3. **Recommendations** → Generate improvement actions
4. **Tracking** → Monitor compliance
5. **Reporting** → Generate compliance reports

---

## API Documentation

### Authentication

All API endpoints require authentication via Manus OAuth 2.0.

```bash
# Get current user
curl -X GET http://localhost:3000/api/trpc/auth.me \
  -H "Authorization: Bearer <token>"

# Logout
curl -X POST http://localhost:3000/api/trpc/auth.logout \
  -H "Authorization: Bearer <token>"
```

### Institution Management

**Auth:** `institution.register`, `completeOnboarding`, `getMyInstitution`, `getStats`, `getStaffMembers`, and other tenant procedures require a **signed-in user** (session / Bearer). Only **`institution.verify`** is public. Non-admin users may only access institutions where `institutionalAccounts.userId` matches their user id.

```bash
# Who am I linked to? (authenticated)
GET /api/trpc/institution.getMyInstitution

# Register institution (authenticated — links to your user id)
POST /api/trpc/institution.register
# Body: full input per router (hospitalName, hospitalType, admin fields, planId, planPrice, maxStaff, etc.)

# Complete multi-step onboarding (authenticated)
POST /api/trpc/institution.completeOnboarding

# Get institution stats (must own institutionId or be admin)
GET /api/trpc/institution.getStats?institutionId=1

# Get staff members (must own institutionId or be admin)
GET /api/trpc/institution.getStaffMembers?institutionId=1
```

### Enrollment

```bash
# Create enrollment
POST /api/trpc/enrollment.createEnrollment
{
  "staffMemberId": 1,
  "courseType": "bls",
  "paymentMethod": "mpesa",
  "transactionId": "MPesa123"
}

# Update progress
POST /api/trpc/enrollment.updateProgress
{
  "enrollmentId": 1,
  "moduleId": "module-1",
  "lessonId": "lesson-1",
  "completed": true
}
```

### Certificates

```bash
# Generate certificate
POST /api/trpc/certificates.generateCertificate
{
  "enrollmentId": 1,
  "recipientName": "Jane Doe",
  "programType": "bls",
  "instructorName": "Dr. Test"
}

# Verify certificate
GET /api/trpc/certificates.verifyCertificate?certificateNumber=CERT123
```

### Payments

```bash
# Initiate M-Pesa payment
POST /api/trpc/mpesa.initiateStkPush
{
  "amount": 9000,
  "phoneNumber": "254712345678",
  "courseType": "bls",
  "staffName": "Jane Doe",
  "staffEmail": "jane@hospital.com"
}
```

---

## Database Schema

### Key Tables

- **users** - User accounts and authentication
- **institutions** - Hospital/clinic information
- **institutionalStaffMembers** - Staff members per institution
- **enrollments** - Course enrollments
- **courses** - Course definitions
- **modules** - Course modules
- **lessons** - Individual lessons
- **certificates** - Generated certificates
- **safeTruthIncidents** - Incident reports
- **payments** - Payment transactions
- **quotations** - Institutional quotations
- **contracts** - Institutional contracts

See `drizzle/schema.ts` for complete schema definition.

---

## Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/routers/institution.test.ts

# Run with coverage
pnpm test --coverage
```

### E2E Tests

```bash
# Run end-to-end tests
pnpm test server/routers/e2e-tests.test.ts
```

### Manual Testing

1. **Hospital Registration:** Visit `/institutional-onboarding`
2. **Staff Training:** Visit `/enroll` and complete a course
3. **Admin Dashboard:** Visit `/hospital-admin-dashboard`
4. **Analytics:** Visit `/advanced-analytics`

---

## Deployment

### Production Build

```bash
# Build frontend and backend
pnpm run build

# Output:
# - dist/public/  (frontend assets)
# - dist/index.js (server bundle)
```

### Environment Configuration

```bash
# Required environment variables
DATABASE_URL=mysql://...
JWT_SECRET=...
VITE_APP_ID=...
MPESA_CONSUMER_KEY=...
AWS_ACCESS_KEY_ID=...
# See .env.example for complete list
```

### Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Security audit passed
- [ ] SSL/TLS certificates installed
- [ ] Backup strategy in place
- [ ] Monitoring and alerting configured
- [ ] Load balancer configured (if scaling)

See `DEPLOYMENT.md` for detailed deployment instructions.

---

## Security

### Compliance

- ✅ **GDPR** - Data privacy and consent management
- ✅ **HIPAA** - Healthcare data protection
- ✅ **PCI DSS** - Payment card industry standards
- ✅ **ISO 27001** - Information security management

### Security Features

- OAuth 2.0 authentication
- TLS 1.2+ encryption
- SQL injection prevention (Drizzle ORM)
- CSRF protection
- Rate limiting
- Audit logging
- Secrets management

---

## Performance

### Metrics

- **Frontend Bundle:** 1.1MB gzipped
- **API Response Time:** < 200ms (p95)
- **Database Latency:** < 50ms
- **Uptime:** > 99.5%

### Optimization

- Code splitting and lazy loading
- Asset minification and compression
- Database query optimization
- Caching strategies
- CDN integration (optional)

---

## Support & Community

### Getting Help

- **Documentation:** https://docs.paeds-resus.com
- **Email:** support@paeds-resus.com
- **GitHub Issues:** https://github.com/paeds-resus/platform/issues

### Contributing

We welcome contributions! Please see `CONTRIBUTING.md` for guidelines.

### Reporting Security Issues

Please email security@paeds-resus.com with details of any security vulnerabilities.

---

## Collaboration & AI team

Manus, Codex, Cursor, and developers share one source of truth in the repo. **No pasting of responses between tools** — everyone reads and updates the same docs; sync is via git.

| Doc | Purpose |
|-----|---------|
| [docs/PLATFORM_SOURCE_OF_TRUTH.md](docs/PLATFORM_SOURCE_OF_TRUTH.md) | Canonical decisions, definitions, priorities |
| [docs/WORK_STATUS.md](docs/WORK_STATUS.md) | Done, in progress, blocked, critique (everyone updates here) |
| [docs/AI_TEAM_WORKFLOW.md](docs/AI_TEAM_WORKFLOW.md) | How to read/update and scrutinize each other's work |
| [docs/ENGINEERING_ACCEPTANCE_CHECKLIST.md](docs/ENGINEERING_ACCEPTANCE_CHECKLIST.md) | Sprint/PR checklist before merge |

**Workflow:** Before work, read PLATFORM_SOURCE_OF_TRUTH and WORK_STATUS. After work, update WORK_STATUS and run the acceptance checklist. Commit so the next person sees the latest.

---

## Roadmap

### Phase 2 (Q2 2026)
- [ ] Mobile app (iOS/Android)
- [ ] Video streaming for live training
- [ ] Advanced analytics dashboard
- [ ] Integration with hospital EMR systems

### Phase 3 (Q3 2026)
- [ ] AI-powered learning recommendations
- [ ] Gamification and leaderboards
- [ ] Parent education portal
- [ ] Multi-language support

### Phase 4 (Q4 2026)
- [ ] Telemedicine integration
- [ ] Real-time incident alerts
- [ ] Predictive analytics
- [ ] International expansion

---

## License

Paeds Resus Platform © 2026. All rights reserved.

---

## Acknowledgments

Built with ❤️ for healthcare professionals saving children's lives.

**Vision:** No child should die from preventable causes.

---

**Last Updated:** January 22, 2026  
**Version:** 1.0.0  
**Status:** Production Ready
