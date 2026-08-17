# Project: Frontend Consolidation (CleanCity EcoGridAI)

## Architecture
- **Framework**: Next.js 14 App Router + React 18 + TypeScript.
- **Routing Structure**:
  - `/`: Root conditional redirector (Edge Middleware / Root Page).
  - `/login`, `/register`: Shared public authentication entry points.
  - `/offline`: PWA offline fallback page.
  - `/admin/**`: Administrative dashboard (EcoGridAI Control Center). Protected for `role === 'ADMIN'`.
  - `/app/**`: Citizen Progressive Web App. Protected for authenticated citizen users.
- **Security & RBAC**:
  - Edge Runtime Middleware (`middleware.ts`) using `jose` (`jwtVerify`) reading `httpOnly` `access_token` cookie and `user_role` cookie.
  - Dual-layer verification: Edge route gating + Client-side `AuthContext` validation via `GET /api/v1/auth/me`.
- **CSS Isolation**:
  - `src/app/admin/layout.tsx` imports `src/app/admin/admin.css` (Dark theme, glassmorphism, laser scan lines, status rings).
  - `src/app/app/layout.tsx` imports `src/app/app/pwa.css` (Mobile viewport wrapper max-width 480px, citizen UI cards).
  - `src/app/globals.css` contains neutral base resets and shared typography.
- **Code-Splitting & Performance**:
  - Heavy visualization libraries (`chart.js`, `react-chartjs-2`) dynamically imported via `next/dynamic` (`ssr: false`) in `/admin/**` only.
  - Citizen bundle `/app/**` has zero imports of `chart.js`.
  - Hardware camera scanner (`html5-qrcode`) dynamically imported in client.
- **PWA Service Worker Isolation**:
  - `@ducanh2912/next-pwa` configured with `scope: "/app"`, `start_url: "/app"`, `fallbacks: { document: "/offline" }`.
  - Navigation route fallbacks bypass `/admin/**`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Consolidated Monorepo Configuration | Dependencies, path aliases, Next.js build scripts in `apps/pwa` | M1 | Survey Infra |
| 2 | Edge JWT Verification (`jose`) | Cryptographic signature & expiry check on `access_token` in Edge runtime | M2 | Survey Infra |
| 3 | Route Protection `/admin/**` | Restrict `/admin/**` to authenticated users with role `ADMIN` | M2 | Survey Dashboard & Infra |
| 4 | Route Protection `/app/**` | Restrict `/app/**` to authenticated users, redirect to `/login` if unauth | M2 | Survey PWA & Infra |
| 5 | Root Conditional Redirector `/` | Dispatches `/` to `/admin`, `/app`, or `/login` based on auth & role | M2 | Survey Infra |
| 6 | Unified Auth Flow & Session Check | Login/register forms and `AuthContext` interacting with `/api/v1/auth/*` | M2 | Survey Dashboard & PWA |
| 7 | Admin Overview View (`/admin`) | KPI stat cards, dynamic charts, zone heatmaps, live telemetry feed | M3 | Survey Dashboard |
| 8 | Station Inventory & Filtering (`/admin/estaciones`) | Station cards, status filters (ACTIVE, WARNING, OFFLINE, PENDING) | M3 | Survey Dashboard |
| 9 | Zero-Touch Station Creation Modal | Create IoT station, generate access & provisioning tokens | M3 | Survey Dashboard |
| 10 | Station Edit & Deletion Modals | Update metadata, capacity, MAC address, delete confirmation | M3 | Survey Dashboard |
| 11 | Station Detail & Telemetry View | Ultrasonic fill levels, ETA, token revocation (`/revoke-token`) | M3 | Survey Dashboard |
| 12 | Zone Detail View (`/admin/zonas/[id]`) | Detailed analytics and station list per zone | M3 | Survey Dashboard |
| 13 | AI Diagnostics Feed (`/admin/diagnostico-ia`) | Classification events stream, confidence threshold slider, search | M3 | Survey Dashboard |
| 14 | Zones Administration (`/admin/zonas-admin`) | Admin CRUD table for network zones | M3 | Survey Dashboard |
| 15 | Admin Responsive Shell | Desktop sidebar (220px) and collapsible mobile drawer with profile modal | M3 | Survey Dashboard |
| 16 | Citizen PWA Main View (`/app`) | Header, BalanceCard, QrScanner, ClaimModal, TransactionHistory | M4 | Survey PWA |
| 17 | Camera QR Scanner (`html5-qrcode`) | Rear camera stream, device selector, fallback for denied permissions | M4 | Survey PWA |
| 18 | QR Scanner File Upload & Demo Modes | Image file decoder and 4 instant demo preset buttons (+10, +15, +5, +8) | M4 | Survey PWA |
| 19 | Cryptographic QR Claim Flow | Verification modal (`/qr/verificar`) and atomic point claim (`/qr/reclamar`) | M4 | Survey PWA |
| 20 | Web3 Custodial Balance & Transactions | Live RECI ERC-20 token balance and transaction history with Etherscan links | M4 | Survey PWA |
| 21 | PWA Manifest & Service Worker Scope | `manifest.json` (`start_url: "/app"`) & `@ducanh2912/next-pwa` (`scope: "/app"`) | M4 | Survey PWA |
| 22 | Offline Support & Fallback Banner | Precached `/offline` document and real-time sticky `OfflineBanner` | M4 | Survey PWA |
| 23 | Layout CSS Scoping | `admin.css` in admin layout; `pwa.css` in app layout; zero style bleed | M5 | Survey Dashboard & PWA |
| 24 | Strict Dynamic Code-Splitting | `chart.js` loaded via `next/dynamic` (`ssr: false`); 0 chart code in `/app` bundle | M5 | Survey Dashboard & PWA |
| 25 | Comprehensive Verification & E2E Tests | 100% E2E test suite pass across Tiers 1-4 + Tier 5 adversarial hardening | M6 | Survey Infra & E2E |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Setup & Configuration | Package dependencies, Next.js config, PWA config, TypeScript aliases | None | PLANNED |
| M2 | Edge RBAC & Authentication | `middleware.ts` with `jose`, AuthContext, Login/Register pages, Root redirect | M1 | PLANNED |
| M3 | Admin Dashboard & Routes | Port all admin views to `/admin/**`, sidebar/drawer, station & zone CRUD | M2 | PLANNED |
| M4 | Citizen PWA & QR Scanner | Port citizen views to `/app/**`, camera/upload/demo QR scanner, claims, wallet | M2 | PLANNED |
| M5 | CSS Scoping & Code-Splitting | Layout-level CSS isolation (`admin.css`, `pwa.css`), dynamic imports for charts | M3, M4 | PLANNED |
| M6 | E2E Verification & Hardening | Pass 100% E2E test suite (Tiers 1-4) + Tier 5 adversarial coverage hardening | M5 | PLANNED |

## Interface Contracts

### Backend API ↔ Next.js Frontend
- **Auth**: `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`.
  - Credentials passed via `httpOnly` cookie `access_token` (`credentials: 'include'`).
  - Response format: `{ user: { id, email, name, role, walletAddress? }, message? }`.
- **Dashboard & Metrics**: `GET /api/v1/dashboard/metrics`, `GET /api/v1/clasificacion?page=1&limit=20`.
- **Stations CRUD**: `GET /api/v1/estaciones`, `POST /api/v1/estaciones`, `PUT /api/v1/estaciones/:id`, `DELETE /api/v1/estaciones/:id`, `POST /api/v1/estaciones/:id/revoke-token`.
- **Zones CRUD**: `GET /api/v1/zonas?includeInactive=true`, `POST /api/v1/zonas`, `PATCH /api/v1/zonas/:id`.
- **QR & Rewards**: `GET /api/v1/qr/verificar/:token`, `POST /api/v1/qr/reclamar` (Body: `{ qrToken: string }`).
- **Blockchain**: `GET /api/v1/blockchain/balance/:address`, `GET /api/v1/blockchain/transactions/:address`.

### Layout ↔ Route Isolation
- `src/app/admin/layout.tsx`: Renders `<AdminShell />` + loads `admin.css`.
- `src/app/app/layout.tsx`: Renders `<PwaShell />` + loads `pwa.css`.
- `src/app/layout.tsx`: Renders `<RootLayout />` with universal `<AuthProvider>` and baseline `globals.css`.

## Code Layout
```
apps/pwa/
├── next.config.js              # Next.js config with @ducanh2912/next-pwa (scope: '/app')
├── package.json                # Unified frontend dependencies
├── tsconfig.json               # Path aliases (@/* -> ./src/*)
├── public/
│   ├── manifest.json           # PWA Manifest (start_url: '/app', scope: '/app')
│   ├── icon-192.png
│   └── icon-512.png
├── src/
│   ├── middleware.ts           # Edge RBAC middleware with jose
│   ├── context/
│   │   └── AuthContext.tsx     # Unified auth state and cookie session hook
│   ├── lib/
│   │   ├── api.ts              # Typed API client
│   │   └── rbac.ts             # Role helper functions
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Root dispatcher
│   │   ├── globals.css         # Base resets
│   │   ├── login/
│   │   │   └── page.tsx        # Login page
│   │   ├── register/
│   │   │   └── page.tsx        # Register page
│   │   ├── offline/
│   │   │   └── page.tsx        # Offline fallback page
│   │   ├── admin/
│   │   │   ├── layout.tsx      # Admin layout (imports admin.css)
│   │   │   ├── admin.css       # Scoped admin styles
│   │   │   ├── page.tsx        # /admin overview
│   │   │   ├── estaciones/
│   │   │   │   └── page.tsx    # /admin/estaciones
│   │   │   ├── zonas/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx# /admin/zonas/[id]
│   │   │   ├── diagnostico-ia/
│   │   │   │   └── page.tsx    # /admin/diagnostico-ia
│   │   │   └── zonas-admin/
│   │   │       └── page.tsx    # /admin/zonas-admin
│   │   └── app/
│   │       ├── layout.tsx      # App layout (imports pwa.css)
│   │       ├── pwa.css         # Scoped citizen styles
│   │       └── page.tsx        # /app citizen hub
│   └── components/
│       ├── admin/              # Admin components (DashboardMetrics, LiveFeed, HeatMap, etc.)
│       │   ├── PeakHoursChart.tsx # Code-split dynamic chart
│       │   ├── stations/       # Station modals and cards
│       │   └── zones/          # Zone admin table
│       └── pwa/                # Citizen components (QrScanner, ClaimModal, BalanceCard, etc.)
```
