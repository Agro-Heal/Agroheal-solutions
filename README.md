# Agroheal | LEAP

A full-featured agriculture education and farm management platform built with React, TypeScript, and Supabase. Agroheal LEAP provides users access to organic farming courses, a farm slot marketplace with recurring billing, and a subscription-gated member dashboard.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
- [Available Scripts](#available-scripts)
- [Features & Routes](#features--routes)
- [Backend & Database](#backend--database)
  - [Supabase Tables](#supabase-tables)
  - [Edge Functions](#edge-functions)
- [Payments Integration](#payments-integration)
- [Third-Party Integrations](#third-party-integrations)
- [Deployment](#deployment)

---

## Overview

Agroheal LEAP is a subscription-based agriculture education platform. Users sign up, purchase a yearly platform membership, and gain access to:

- A library of organic farming courses with video lessons (YouTube)
- A farm slots marketplace where users can checkout and subscribe to farmland slots
- A member dashboard with profile management, notifications, and Telegram community access
- A referral system that rewards existing members for bringing in new subscribers

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| [React](https://react.dev/) | 19.x | UI framework |
| [TypeScript](https://www.typescriptlang.org/) | ~5.9 | Type safety |
| [Vite](https://vitejs.dev/) | 7.x | Build tool & dev server (SWC plugin) |
| [React Router DOM](https://reactrouter.com/) | 7.x | Client-side routing |
| [Tailwind CSS](https://tailwindcss.com/) | 3.4 | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com/) | — | Component library (Radix UI primitives) |
| [Radix UI](https://www.radix-ui.com/) | Various | Accessible headless UI primitives |
| [Chakra UI](https://chakra-ui.com/) | 2.x | Additional UI components |
| [Framer Motion](https://www.framer.com/motion/) | 12.x | Animations & transitions |
| [Lottie React](https://github.com/LottieFiles/lottie-react) | 2.x | Lottie animation playback |
| [Embla Carousel](https://www.embla-carousel.com/) | 8.x | Carousel / slider |
| [Lucide React](https://lucide.dev/) | 0.575 | Icon set |
| [react-hot-toast](https://react-hot-toast.com/) | 2.x | Toast notifications |
| [react-youtube](https://github.com/tjallingt/react-youtube) | 10.x | YouTube player embed |
| [clsx](https://github.com/lukeed/clsx) + [tailwind-merge](https://github.com/nicolo-ribaudo/tailwind-merge) | Latest | Conditional class merging |
| [class-variance-authority](https://cva.style/docs) | 0.7 | Component variant management |
| [Axios](https://axios-http.com/) | 1.14 | HTTP client (reserved, not yet wired) |

### Backend (BaaS)

| Technology | Purpose |
|------------|---------|
| [Supabase](https://supabase.com/) | Postgres database, Auth, Storage, Edge Functions |
| Supabase Auth | Email/password authentication & session management |
| Supabase PostgREST | Auto-generated REST API over Postgres |
| Supabase Edge Functions | Serverless Deno functions for payment verification & webhooks |

### Tooling & Quality

| Tool | Purpose |
|------|---------|
| ESLint 9 (Flat Config) | Linting (TypeScript + React Hooks + React Refresh) |
| PostCSS + Autoprefixer | CSS processing |
| TypeScript Project References | Separate TS configs for app and node |

---

## Project Structure

```
agroheal-mvp/
├── index.html                  # Entry HTML — Paystack & Flutterwave script tags loaded here
├── vite.config.ts              # Vite config — port 5174, @ alias → ./src
├── tailwind.config.ts          # Tailwind — dark mode, shadcn CSS variables, animate plugin
├── postcss.config.js
├── eslint.config.js
├── tsconfig.json               # Project references root
├── tsconfig.app.json           # App source TS config
├── tsconfig.node.json          # Vite config TS config
├── components.json             # shadcn/ui config (new-york style)
├── vercel.json                 # Vercel static build + SPA fallback
├── .env                        # Local env vars (gitignored — see Environment Variables)
│
├── supabase/
│   └── functions/
│       ├── verify-payment/         # Verifies Paystack/Flutterwave platform subscription payments
│       ├── verify-slot-payment/    # Verifies Paystack/Flutterwave farm slot payments
│       ├── paystack-webhook/       # HMAC-validated Paystack event handler
│       ├── monthly-slot-payment/   # Webhook handler for recurring SLOT_ references
│       └── process-monthly-payments/ # Cron-style function to suspend overdue slot subscriptions
│
└── src/
    ├── main.tsx                    # App entry — router, Sentry init, Vercel Analytics
    ├── index.css                   # Tailwind base styles + CSS variables
    │
    ├── config/
    │   └── Index.ts                # Re-exports all VITE_ env variables
    │
    ├── lib/
    │   ├── supabaseClient.ts       # Supabase browser client (createClient)
    │   └── utils.ts                # cn() helper (clsx + tailwind-merge)
    │
    ├── hooks/
    │   ├── useAuth.ts              # Supabase session state (getSession + onAuthStateChange)
    │   ├── use-toast.ts            # Toast hook
    │   └── use-mobile.tsx          # Responsive breakpoint hook
    │
    ├── routes/
    │   └── ProtectedRoutes.tsx     # Auth guard — redirects unauthenticated users to /login
    │
    ├── helpers/
    │   ├── courses.ts              # Static course catalogue data
    │   ├── coursesDetails.ts       # Per-course lesson/module data
    │   ├── dashboard.helpers.ts    # Dashboard UI data helpers
    │   └── web.helpers.ts          # Marketing page data helpers
    │
    ├── constant/
    │   └── Image.ts                # Centralised image imports
    │
    ├── assets/                     # Images, video (agroheal.webm), Lottie JSON
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Layout.tsx          # Public page wrapper (Header + Footer)
    │   │   ├── DashboardLayout.tsx # Authenticated layout — sidebar, logout
    │   │   ├── Header.tsx
    │   │   └── Footer.tsx
    │   ├── webComponents/          # Marketing sections (Hero, FAQ, Testimonials, CTA, etc.)
    │   └── ui/                     # shadcn primitives (Button, Card, Toast, Sidebar, Tabs, …)
    │
    └── page/
        ├── ForgotPassword.tsx
        ├── UpdatePassword.tsx
        ├── error/
        │   ├── Error.tsx
        │   └── DashboardError.tsx
        └── website/
            ├── Home.tsx
            ├── About.tsx
            ├── Login.tsx
            ├── Signup.tsx
            ├── Legal.tsx
            ├── dashboard/
            │   ├── Dashboard.tsx
            │   ├── Subscribe.tsx           # Platform subscription paywall
            │   ├── RequireSubscription.tsx # Subscription guard (checks subscriptions table)
            │   ├── Profile.tsx
            │   ├── Notifications.tsx
            │   ├── TelegramPopup.tsx
            │   └── PhoneModal.tsx
            ├── Slots/
            │   ├── Slots.tsx
            │   ├── Checkout.tsx            # Farm slot checkout (Paystack/Flutterwave)
            │   └── MonthlyPayment.tsx
            └── Courses/
                ├── Courses.tsx
                └── CoursesDetails.tsx      # Lesson detail with YouTube player
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x (or pnpm / yarn)
- A **Supabase** project with the required tables and Edge Functions deployed
- **Paystack** and/or **Flutterwave** merchant accounts

### Installation

```bash
git clone https://github.com/your-org/agroheal-mvp.git
cd agroheal-mvp
npm install
```

### Environment Variables

Create a `.env` file in the project root (never commit this file):

```env
# Supabase
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Payment Gateways
VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxxxxxxxxxxxxxxxxxxx-X
VITE_PAYSTACK_KEYS=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional
VITE_WHATSAPP_REDIRECT=https://chat.whatsapp.com/your-group-link
```

> **Note:** The Edge Functions deployed on Supabase require additional **server-side** secrets (set in the Supabase Dashboard under Project Settings → Edge Functions):
> - `SUPABASE_SERVICE_ROLE_KEY`
> - `PAYSTACK_SECRET_KEY`
> - `FLUTTERWAVE_SECRET_KEY`

### Running the App

```bash
# Start the development server (runs on http://localhost:5174)
npm run dev
```

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start the local dev server on port **5174** with HMR |
| `build` | `tsc -b && vite build` | Type-check then produce an optimised production build in `dist/` |
| `preview` | `vite preview` | Locally preview the production build |
| `lint` | `eslint .` | Run ESLint across the entire project |

---

## Features & Routes

### Public Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | Home | Marketing landing page (Hero, How It Works, Benefits, Testimonials, FAQ, CTA) |
| `/about` | About | About the Agroheal platform |
| `/login` | Login | Email/password sign-in |
| `/signup` | Sign Up | New account registration with optional referral code |
| `/legal` | Legal | Terms of service / privacy policy |
| `/forgot-password` | Forgot Password | Send password reset email via Supabase |
| `/reset-password` | Update Password | Set a new password from the reset email link |

### Authenticated Routes (require active session)

| Path | Page | Description |
|------|------|-------------|
| `/subscribe` | Subscribe | Purchase a yearly platform subscription via Flutterwave or Paystack |

### Subscription-Gated Routes (require active session + active subscription)

| Path | Page | Description |
|------|------|-------------|
| `/dashboard` | Dashboard | Main member dashboard |
| `/dashboard/slots` | Slots | Browse available farm slots |
| `/dashboard/checkout` | Checkout | Purchase / reserve a farm slot |
| `/dashboard/slots-subscription` | Monthly Payment | Manage recurring slot payments |
| `/dashboard/courses` | Courses | Browse the organic farming course catalogue |
| `/dashboard/courses/:slug` | Course Detail | Watch lessons (YouTube) for a specific course |
| `/dashboard/profile` | Profile | View and edit member profile, referral code |
| `/dashboard/legal` | Legal (Dashboard) | In-app legal documents |

### Route Guards

- **`ProtectedRoute`** — wraps all authenticated routes; redirects unauthenticated users to `/login`.
- **`RequireSubscription`** — wraps subscription-gated routes; queries the `subscriptions` table for a row with `status === "active"` and a future `expires_at`. Redirects to `/subscribe` if none is found.

---

## Backend & Database

The application uses **Supabase** as its entire backend — no custom server is needed for the React SPA. All business logic that requires elevated privileges runs in **Supabase Edge Functions** (Deno runtime).

### Supabase Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profile data, `referral_code`, `referred_by` |
| `subscriptions` | Platform membership records — `status`, `expires_at` |
| `checkout` | Farm slot orders created before payment confirmation |
| `slot_subscriptions` | Active slot plans with renewal tracking |
| `payment_logs` | Audit log for all payment events |
| `transactions` | Flutterwave idempotency records |
| `subscription_payments` | Slot renewal payment records |
| `withdrawals` | Paystack transfer / withdrawal events |

### Database RPCs (Postgres Functions)

| RPC | Purpose |
|-----|---------|
| `increment_referral_earnings` | Credits the referrer when a referred user subscribes |
| `try_acquire_lock` | Concurrency lock before processing a Flutterwave verify |
| `release_lock` | Releases the lock after processing |

### Edge Functions

All Edge Functions live in `supabase/functions/` and are deployed to the Supabase project.

| Function | Trigger | Description |
|----------|---------|-------------|
| `verify-payment` | Client invocation (from `Subscribe.tsx`) | Verifies a Paystack or Flutterwave **platform subscription** payment. On success: upserts `subscriptions` (1-year expiry), ensures `profiles` row exists, calls `increment_referral_earnings`, logs to `payment_logs`. |
| `verify-slot-payment` | Client invocation (from `Checkout.tsx`) | Verifies a Paystack or Flutterwave **farm slot** payment. On success: updates `checkout`, inserts `slot_subscriptions` and `payment_logs`. Uses `try_acquire_lock` / `release_lock` RPCs for Flutterwave concurrency safety. |
| `paystack-webhook` | Paystack webhook (HMAC validated) | Handles `charge.success` and `charge.failed` Paystack events for platform subscriptions; also handles `transfer.success` / `transfer.failed` for `withdrawals`. |
| `monthly-slot-payment` | Paystack webhook (references starting with `SLOT_`) | Processes recurring slot payment events; updates `slot_subscriptions`, inserts `subscription_payments`. |
| `process-monthly-payments` | Scheduled / cron invocation | Suspends overdue `slot_subscriptions` where the renewal date has passed without payment. |

---

## Payments Integration

Agroheal integrates two payment gateways to support users across different preferences:

### Flutterwave

- Public key loaded from `VITE_FLUTTERWAVE_PUBLIC_KEY`
- SDK script injected in `index.html`
- Used for both **platform subscription** and **farm slot** checkout flows
- Server-side verification in `verify-payment` and `verify-slot-payment` Edge Functions using the Flutterwave secret key

### Paystack

- Public key loaded from `VITE_PAYSTACK_KEYS`
- SDK script injected in `index.html`
- Used for both **platform subscription** and **farm slot** checkout flows
- Webhook endpoint: `paystack-webhook` and `monthly-slot-payment` Edge Functions, HMAC-validated using the Paystack secret key

---

## Third-Party Integrations

| Service | Integration Point | Purpose |
|---------|-----------------|---------|
| **Supabase** | `src/lib/supabaseClient.ts`, Edge Functions | Auth, database, storage, serverless compute |
| **Paystack** | `index.html` (SDK), Edge Functions | Payment processing & webhooks |
| **Flutterwave** | `index.html` (SDK), Edge Functions | Payment processing |
| **Sentry** | `src/main.tsx` (`Sentry.init`) | Frontend error tracking, session replay, performance tracing. Release tagged `agroheal@0.0.0` |
| **Vercel Analytics** | `src/main.tsx` (`<Analytics />`) | Page view & traffic analytics |
| **YouTube** | `CoursesDetails.tsx` (`react-youtube`) | Course video lesson playback |
| **Framer Motion** | Throughout `src/` | Page and component animations |
| **Lottie** | `src/assets/Icon/` + `lottie-react` | Vector animations for UI illustrations |
| **WhatsApp** | UI copy + `VITE_WHATSAPP_REDIRECT` env | Community redirect link (configurable) |
| **Telegram** | `TelegramPopup.tsx` | In-app prompt linking members to Telegram community |

---

## Deployment

The project is configured for deployment on **[Vercel](https://vercel.com/)**.

`vercel.json` configures a static build with an SPA catch-all fallback so that all routes resolve to `index.html` client-side:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Deploy Steps

1. Push the repository to GitHub / GitLab / Bitbucket.
2. Import the project in the Vercel dashboard.
3. Set all required **Environment Variables** (see [Environment Variables](#environment-variables)) in the Vercel project settings.
4. Vercel will automatically run `npm run build` on each push to the configured branch.

### Supabase Edge Functions

Deploy Edge Functions using the Supabase CLI:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login and link to your project
supabase login
supabase link --project-ref your-project-ref

# Deploy all Edge Functions
supabase functions deploy
```

Set the required server-side secrets via the CLI or Supabase Dashboard:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase secrets set PAYSTACK_SECRET_KEY=sk_live_xxxx
supabase secrets set FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxx
```
