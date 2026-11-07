<div align="center">

# 🍽️ Resto Mayo
### Next-Generation AI-Powered Restaurant Ordering & Kitchen Display System (KDS)

[![Next.js](https://img.shields.io/badge/Next.js-16.4.0-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini AI](https://img.shields.io/badge/Google_Gemini_AI-@google/genai-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-7.10.0-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

<p align="center">
  <strong>An enterprise-grade, mobile-first fullstack web application for modern restaurant dining and F&B MSME digitalization, featuring instant QR code table ordering, Google Gemini AI Food Copilot, real-time Kitchen Display System (KDS), AI review sentiment triage, and comprehensive back-office management.</strong>
</p>

[Live Demo](#-deployment-url--live-demo) •
[Problem & Target User](#-problem--target-user) •
[Key Features](#-key-features) •
[AI Implementation](#-ai-implementation) •
[Tech Stack](#-tech-stack) •
[Run Instructions](#-quick-start--installation-guide) •
[Team Members](#-team-members)

</div>

---

## 🌟 Overview

**Resto Mayo** is engineered to replace legacy paper menus and fragmented POS systems with a unified, cloud-ready, AI-powered digital culinary experience. Built with modern full-stack best practices for the **AI Web Innovation Challenge – Bali DigiFest 2026**, it eliminates ordering bottlenecks, guides customers with conversational AI menu discovery, connects dining tables directly to kitchen staff in real time, and empowers restaurant managers with AI-driven operational intelligence.

Designed with a warm **Red & Gold** aesthetic inspired by international culinary dining, the UI delivers an engaging experience on smartphones, tablets, and desktop workstations.

---

## 🌐 Deployment URL & Live Demo

The live Minimum Viable Product (MVP) is deployed and ready for testing without installation:

- 🚀 **Main Customer Web & Catalog**: [https://resto-mayo.vercel.app](https://resto-mayo.vercel.app)
- 🪑 **Simulated Table QR Dine-In (Table M01)**: [https://resto-mayo.vercel.app/?table=M01](https://resto-mayo.vercel.app/?table=M01)
- 🔐 **Admin Back-Office & KDS Login**: [https://resto-mayo.vercel.app/admin/login](https://resto-mayo.vercel.app/admin/login)
  - **Demo Admin Email**: `admin234@restomayo.com`
  - **Demo Admin Password**: `password`

---

## 🎯 Problem & Target User

### Problem Statement
Culinary MSMEs (UMKM Kuliner) and restaurants in Bali and across Indonesia face four critical operational bottlenecks:
1. **Menu Paralysis & Ordering Queues**: Diners frequently struggle to choose dishes that match their current mood, spice tolerance, dietary needs, or budget from static paper menus, while manual order-taking during peak hours creates long wait times and recording errors.
2. **Missed Upselling Opportunities**: Cashiers and waiters rarely have time during rush hours to suggest complementary food-and-drink pairings, leaving significant Average Order Value (AOV) untapped.
3. **Disconnected Kitchen Workflow**: Paper tickets between dining tables and kitchen staff result in delayed cooking, overlooked custom chef notes, and zero real-time order status visibility for customers.
4. **Unstructured Customer Reviews & Marketing Bottlenecks**: Restaurant managers struggle to manually read hundreds of reviews to spot urgent food hygiene/service complaints, or consistently craft engaging promotional copywriting and high-margin new menu concepts.

### Target Users
1. **Dine-In Customers**: Restaurant guests scanning table QR standees (`/?table=M01`) on their smartphones to discover meals via **AI Food Copilot**, add custom chef instructions, check out digitally, and track live kitchen cooking stages.
2. **Kitchen Staff (Chefs & Baristas)**: Culinary personnel using the **Kitchen Display System (KDS)** to process incoming order tickets chronologically (*First-In, First-Out*).
3. **Restaurant Owners & Managers (F&B MSMEs)**: Administrators using the **Executive Back-Office** to monitor real-time revenue, table occupancy, AI-analyzed customer feedback, AI menu R&D suggestions, and instant marketing copywriting.

---

## 🚀 Key Features

### 📱 1. Customer Dine-In Experience & AI Discovery
- **Instant QR Code Table Binding**: Customers scan their table's standee QR code (e.g. `/?table=M01`) to automatically pair their session with the designated table without any app downloads or account creation.
- **Gemini AI Food Copilot**: Natural language menu discovery assistant allowing guests to type what they crave (e.g., *"Warm broth under 30k"* or *"Crispy snacks for two"*) and receive personalized dish matches from the live catalog.
- **AI Smart Upselling & Dynamic Bundling**: Intelligently recommends 1–2 complementary dishes or refreshing drinks based on the flavor profile and spice level of items currently in the customer's cart.
- **Dynamic Digital Menu & Custom Chef Notes**: Real-time category filtering (*Food, Beverages, Dimsum*), instant keyword search, high-resolution culinary photography, and per-dish dietary/spice notes.
- **Smart Dining Cart & Multi-Channel Checkout**: Real-time subtotal computation, Indonesian restaurant tax (PB1 10%) calculation, and simulated digital payments (QRIS, GoPay, DANA, OVO, ShopeePay, Bank Transfer).
- **Live Kitchen Order Tracker & Customer Review**: Real-time visual progress indicator updating customers through 4 stages (`Received` ➔ `Cooking` ➔ `Ready` ➔ `Served`) followed by an AI-analyzed rating & feedback form.

### 🍳 2. Kitchen Display System (KDS)
- **FIFO Order Queue**: Automatically sorts cooking tickets chronologically (*First-In, First-Out*).
- **One-Click Cooking Pipeline**: Kitchen staff transition order tickets seamlessly from `Pending` (New Ticket) ➔ `Cooking` (On Stove) ➔ `Ready` (Ready for Waiter) ➔ `Served`.
- **High-Visibility Alerts**: Prominently highlights custom chef instructions and item quantities.
- **Audio-Visual Polling**: Regularly syncs with the database to surface incoming orders without page reloads.

### 📊 3. Executive Back-Office & AI Management Suite
- **Live Analytics Dashboard**: Real-time metrics on total paid revenue, order count, active kitchen queue, table occupancy rates, and AI-evaluated customer rating.
- **AI Review Triage & Critical Complaint Detection**: Automatically categorizes customer reviews into 6 operational areas, analyzes sentiment, flags critical hygiene/service complaints (`is_critical`), and generates periodic **AI Executive Review Digests**.
- **AI Menu R&D Consultant & Culinary Copywriter**: Analyzes catalog gaps to propose 3 high-profit new dish concepts and generates website descriptions, promotional taglines, and WhatsApp/social media broadcast copy.
- **Menu CRUD & Table QR Print Suite**: Create, edit, and toggle *"Available / Sold Out"* stock status instantly, plus generate printable high-resolution QR standees for every table.

### 🛡️ 4. Defensive Security Architecture
- **In-Memory Rate Limiting**: Mitigates brute-force authentication attacks on `/api/admin/login` and prevents order flooding on `/api/orders`.
- **HMAC-SHA256 Signed Session Tokens**: Cryptographically signed HTTP-only cookies prevent cookie tampering, identity spoofing, and privilege escalation.
- **Authoritative Server-Side Pricing**: Computes cart totals on the backend using database records to prevent client-side price manipulation attacks.
- **Sanitization & Injection Prevention**: Strict string sanitization guards against Cross-Site Scripting (XSS), paired with Prisma's parameterized queries to eliminate SQL injection vulnerabilities.

---

## 🤖 AI Implementation

**Resto Mayo** integrates **Google Gemini API** via the official `@google/genai` SDK (`^2.32.0`) directly into the core business logic (`/api/gemini` and `/api/reviews`):

| AI Capability | Endpoint / Action | Input Data | AI Processing & Output |
| :--- | :--- | :--- | :--- |
| **1. AI Food Copilot** | `POST /api/gemini` (`action: "food-copilot"`) | Customer natural language query (mood, craving, budget, dietary need) + live available catalog | Semantic matching returning JSON with `interpretedMood` and 1–4 available `productId` matches + personalized `matchReason`. |
| **2. AI Smart Upselling** | `POST /api/gemini` (`action: "smart-upsell"`) | Current `cartItems` + available products not in cart | Flavor/spice pairing analysis returning JSON with an enticing `headline` and 1–2 complementary item recommendations. |
| **3. AI Review QA & Triage** | `POST /api/reviews` & `action: "analyze-review"` | Star rating (1–5), customer comment, and ordered dishes summary | Classifies into 6 categories (*Food Taste, Service Speed, Pricing, Staff & Service, Hygiene & Cleanliness, General*), sentiment, `isCritical` flag + `criticalReason`, and 1-sentence `aiSummary`. |
| **4. AI Executive Digest** | `POST /api/gemini` (`action: "review-summary"`) | Up to 30 recent customer reviews from MySQL | Synthesizes an executive report JSON containing `executiveSummary`, `topPraises`, `topConcerns`, and 3 `actionableSteps`. |
| **5. AI Menu R&D Advisor** | `POST /api/gemini` (`action: "menu-ideas"`) | Current active products and menu categories | Identifies catalog gaps and outputs 3 high-margin new dish concepts with suggested prices and commercial rationale. |
| **6. AI Copywriter** | `POST /api/gemini` (`action: "generate-copywriting"`) | Dish name, category, and key ingredients | Generates storytelling menu `description`, banner `tagline`, and emoji-rich `socialPromo` broadcast text. |

### Multi-Model Cascade & Zero-Downtime Fallback Architecture
To ensure uninterrupted service during peak restaurant hours:
1. **Multi-Model Failover**: Requests automatically cascade across `gemini-flash-lite-latest` ➔ `gemini-3.5-flash-lite` ➔ `gemini-3.5-flash` ➔ `gemini-3.8-flash` with strict JSON extraction (`cleanJsonOutput`).
2. **Intelligent Local Fallback**: If external APIs experience high demand (`503`) or rate limits (`429`), built-in heuristic fallback engines (`fallbackFoodCopilot`, `fallbackSmartUpsell`, `fallbackMenuIdeas`, `fallbackCopywriting`, `fallbackReviewSummary`) automatically return context-aware results so the UI never fails.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | [Next.js 16.4.0 (App Router)](https://nextjs.org/) | Server Components, Turbopack, Streaming SSR |
| **UI Library** | [React 19.3.0](https://react.dev/) | Modern concurrent React primitives |
| **Language** | [TypeScript 5.x](https://www.typescriptlang.org/) | Strict end-to-end type safety |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Mobile-first custom red-gold culinary design system |
| **AI Engine** | [Google GenAI SDK (`@google/genai` ^2.32.0)](https://ai.google.dev/) | Gemini Flash Lite & Gemini Flash multi-model integration |
| **Database** | [MySQL 8.0+](https://www.mysql.com/) / MariaDB | Relational storage hosted locally or via Cloud MySQL |
| **ORM** | [Prisma 7.10.0](https://www.prisma.io/) | Type-safe database client (`@prisma/client` & `@prisma/adapter-mariadb`) |
| **Deployment** | [Vercel](https://vercel.app/) & [Railway](https://railway.app/) | Serverless web hosting and managed cloud MySQL database |
| **Security** | Node `crypto` / HMAC-SHA256 | Cryptographic token signatures & rate-limiting guards |

---

## 🏗️ Architecture & Data Flow

### System Data Flow Diagram

```text
[Customer / Admin Browser]
           │
           ▼
[Next.js 16 Frontend (React 19 + Tailwind CSS v4)]
           │
           ▼
[Next.js Serverless API Routes (/api/orders, /api/gemini, /api/reviews, /api/admin)]
           │
           ├──────► [Prisma ORM 7.10 + MySQL 8.0 / MariaDB]
           │        (Stores Products, Categories, Tables, Orders, KDS Status & AI Review Triage)
           │
           └──────► [Google GenAI SDK (@google/genai)]
                    ├─► 1. Multi-Model Cascade (gemini-flash-lite-latest ➔ gemini-3.8-flash)
                    └─► 2. Intelligent Local Heuristic Fallback (Zero-Downtime Guarantee)
                           │
                           ▼
                    [Structured JSON Result Rendered to User / Admin UI]
```

### Project Directory Structure

```text
resto-mayo/
├── app/
│   ├── admin/                     # Protected Administrative Back-Office
│   │   ├── categories/            # Menu category management
│   │   ├── dashboard/             # Revenue, sales, AI review insights & occupancy analytics
│   │   ├── kitchen/               # Live Kitchen Display System (KDS)
│   │   ├── login/                 # Secure admin authentication
│   │   ├── orders/                # Complete order history & status manager
│   │   ├── products/              # Dish catalog CRUD, AI R&D ideas & copywriting
│   │   ├── qr/                    # Table QR generator & print suite
│   │   └── layout.tsx             # Admin shell layout & navigation bar
│   ├── api/                       # RESTful & AI Route Handlers
│   │   ├── admin/                 # Authentication, logout, and metrics APIs
│   │   ├── categories/            # Category endpoints
│   │   ├── gemini/                # Google Gemini AI multi-action endpoint (Copilot, Upsell, R&D, Copy)
│   │   ├── orders/                # Order creation, listing & status updates
│   │   ├── payments/              # Payment confirmation simulation
│   │   ├── products/              # Product catalog endpoints
│   │   ├── reviews/               # Customer review submission & AI QA sentiment triage
│   │   └── tables/                # Dining table occupancy endpoints
│   ├── cart/                      # Dining cart, AI Smart Upsell & order summary
│   ├── checkout/                  # Table selection & payment method gateway
│   ├── payment/[orderNumber]/     # Live order tracking, payment receipt & review submission
│   ├── layout.tsx                 # Root layout & global typography
│   ├── page.tsx                   # Main customer menu, catalog & AI Food Copilot modal
│   └── globals.css                # Tailwind CSS v4 custom theme tokens
├── components/                    # Reusable React UI Components
│   ├── Navbar.tsx                 # Responsive header & cart pill
│   ├── OpeningScene.tsx           # Welcoming culinary intro splash
│   ├── RestoMayoLogo.tsx          # Scalable vector brand identity
│   └── TableSelectModal.tsx       # Table selection & guest name modal
├── lib/                           # Core Utilities & Infrastructure
│   ├── auth.ts                    # HMAC-SHA256 session token management
│   ├── prisma.ts                  # Cached Prisma Client singleton
│   └── security.ts                # In-memory rate limiting & XSS sanitizers
├── prisma/
│   ├── schema.prisma              # Database models & relationships
│   └── seed.ts                    # Initial data seeder (dishes, tables, admin)
├── public/                        # Static assets & public media
├── .env.example                   # Environment variable template (no raw secrets)
├── package.json                   # Dependencies and build scripts
└── tsconfig.json                  # TypeScript compiler settings
```

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Node.js**: `v18.18.0` or higher (`v20.x` LTS recommended)
- **Package Manager**: `npm` (bundled with Node), `pnpm`, or `yarn`
- **Database**: A running **MySQL 8.0+** or **MariaDB** instance (local, Docker container, or cloud-hosted on [Railway](https://railway.app), PlanetScale, Aiven, etc.)
- **Gemini API Key**: A valid Google AI Studio key (`GEMINI_API_KEY`)
- **Git**: Installed and configured on your OS

---

## 💻 Quick Start / Installation Guide

Follow these step-by-step instructions to clone and run the project locally on your machine.

### Step 1: Clone the Repository

```bash
git clone [https://github.com/](https://github.com/)<your-username>/resto-mayo.git
cd resto-mayo
```

*(Replace `<your-username>` with the actual GitHub repository owner).*

### Step 2: Install Dependencies

```bash
npm install
```

> **Note**: During installation, Prisma will automatically run its `postinstall` script to generate the client engine.

### Step 3: Configure Environment Variables

Create your local `.env` configuration file from the provided `.env.example` template (never commit `.env` to public repositories):

```bash
cp .env.example .env
```

Open `.env` in your code editor and configure your database connection string, Gemini API key, and session secret:

```env
# Database Connection (MySQL / MariaDB)
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"

# Google Gemini API Key (Required for AI Food Copilot, Smart Upsell & Review Analysis)
GEMINI_API_KEY="your_google_gemini_api_key_here"

# Application Environment
NODE_ENV="development"

# Cryptographic Session & HMAC Signing Secret (min 32 characters in production)
SESSION_SECRET="resto-mayo-secure-secret-token-key-2026-c7f8a49e-d301"
```

### Step 4: Synchronize Database Schema & Seed Data

1. Push the Prisma schema directly to your MySQL database:
   ```bash
   npx prisma db push
   ```
2. Generate the updated Prisma Client:
   ```bash
   npx prisma generate
   ```
3. Seed default tables, menu categories, culinary dishes, and initial administrator credentials (or run `npx tsx prisma/seed.ts`):
   ```bash
   npm run dev
   ```

### Step 5: Launch the Development Server

Start the Next.js development server powered by Turbopack:

```bash
npm run dev
```

Once running, the application will be accessible locally at:
- 🌐 **Customer Menu**: [http://localhost:3000](http://localhost:3000)
- 🪑 **Simulated Table Dine-In**: [http://localhost:3000/?table=M01](http://localhost:3000/?table=M01)
- 🔐 **Admin Login**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

---

## 🔐 Admin Credentials (Demo Account)

A pre-configured administrator account is seeded for back-office and kitchen evaluation:

| Field | Value |
| :--- | :--- |
| **Login URL** | [https://resto-mayo.vercel.app/admin/login](https://resto-mayo.vercel.app/admin/login) (or `/admin/login`) |
| **Email** | `admin234@restomayo.com` |
| **Password** | `password` |
| **Role** | `admin` |

> 🔒 **Security Notice**: To protect administrative access, there is no public navigation button to the login page on the customer-facing interface. Access is granted strictly via direct URL (`/admin/login`). The login route is protected against brute-force attacks (maximum 5 attempts per 10 minutes).

---

## 📡 API Endpoints

### Customer & AI Endpoints
- `GET /api/products` — Retrieve all active menu items and dishes.
- `GET /api/categories` — Retrieve all dining categories.
- `GET /api/tables` — Retrieve restaurant tables and occupancy status.
- `POST /api/orders` — Create a new customer order with server-side price computation.
- `GET /api/orders/[orderNumber]` — Retrieve order status and tracking details.
- `POST /api/payments/[orderNumber]/confirm` — Confirm payment and transition order to cooking.
- `POST /api/gemini` — Unified Google Gemini AI handler supporting `food-copilot`, `smart-upsell`, `menu-ideas`, `generate-copywriting`, `analyze-review`, and `review-summary`.
- `GET & POST /api/reviews` — Submit customer order ratings/reviews with automated Gemini AI sentiment & critical complaint triage.

### Admin & Operations Endpoints *(Requires Admin Session)*
- `POST /api/admin/login` — Authenticate administrator with brute-force protection.
- `POST /api/admin/logout` — Invalidate session and clear HTTP-only cookie.
- `GET /api/admin/stats` — Retrieve executive business and kitchen statistics.
- `PATCH /api/orders/[orderNumber]/status` — Update order cooking stage (`pending`, `processing`, `ready`, `completed`, `cancelled`).
- `POST /api/products` — Add a new culinary dish to the catalog.
- `PATCH /api/products/[id]` — Update dish details or toggle stock availability.
- `DELETE /api/products/[id]` — Delete a dish from the menu catalog.
- `POST /api/categories` — Create a new menu classification.

---

## ⚠️ Known Limitations (Current MVP Scope)

1. **Simulated Payment Gateway**: Multi-channel digital checkout (QRIS, GoPay, DANA, OVO, ShopeePay, and Bank Transfer) currently uses an internal payment confirmation simulation (`/api/payments/[orderNumber]/confirm`) rather than a live production webhook integration with third-party payment aggregators (such as Midtrans or Xendit).
2. **In-Memory Rate Limiting State**: The brute-force login protection and order-flooding rate limiter (`lib/security.ts`) maintain state in server memory, which resets across serverless cold starts unless backed by a distributed Redis cache.
3. **Polling-Based Kitchen Sync**: The Kitchen Display System (KDS) and live customer order tracker rely on client-side interval polling rather than persistent WebSockets or Server-Sent Events (SSE).
4. **Single-Branch Inventory Toggle**: Stock management currently operates via an instant dish-level availability toggle (*Available / Sold Out*) for a single restaurant outlet without automated raw-ingredient Bill of Materials (BOM) deduction.

---

## 👥 Team Members

| No. | Name | Role & Responsibility | Institution |
| :---: | :--- | :--- | :--- |
| 1 | **I Gusti Made Fitto Darmanta** | Team Lead, System Tester & System Analyst | Primakara University |
| 2 | **Nyoman Agus Dana Adnyana** | Full-Stack Developer, Backend Architecture & Database Engineer | Primakara University |
| 3 | **I Gusti Putu Wira Satya Adi Munang** | UI/UX Designer & Quality Assurance | Primakara University |

---

## 📚 Third-Party Resources, Credits & AI Disclosure

### Open-Source Libraries & APIs
- **Next.js (`16.4.0`) & React (`19.3.0`)**: MIT License — Frontend & full-stack application framework.
- **Tailwind CSS (`v4`)**: MIT License — Utility-first CSS styling framework.
- **Prisma ORM (`7.10.0`) & `@prisma/adapter-mariadb`**: Apache-2.0 License — Type-safe database ORM and MariaDB/MySQL adapter.
- **Google GenAI SDK (`@google/genai` `^2.32.0`)**: Apache-2.0 License — Official SDK for accessing Google Gemini LLM APIs (`gemini-flash-lite-latest`, `gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.8-flash`).
- **Culinary Photography & Icons**: High-resolution royalty-free food imagery (Unsplash) and custom SVG vector illustrations.

### Pre-Existing Components & Competition Development Disclosure
- **Foundational System**: Core digital menu catalog, QR table binding, and order management structure were initiated by the team and expanded for this competition.
- **Developed Specifically for Bali DigiFest 2026**: Full end-to-end Google Gemini AI integration (`@google/genai`), including **AI Food Copilot**, **AI Smart Upselling**, **AI Quality Assurance & Critical Review Triage**, **AI Executive Review Digest**, **AI Menu R&D Consultant**, **AI Culinary Copywriter**, and the **Multi-Model Cascade + Intelligent Local Fallback** architecture.

### AI-Assisted Development Tools Disclosure
In compliance with the *AI Web Innovation Challenge – Bali DigiFest 2026* guidelines, the team discloses the use of **Claude**, **Google Gemini**, and **GitHub Copilot / Cursor** as development assistants for code refactoring, debugging, and technical documentation structuring. All system architecture, database schemas, security implementations, and AI workflows have been thoroughly tested, verified, and are fully understood by the team.

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with AI, Solved for Bali — Resto Mayo Team (Bali DigiFest 2026).</sub>
</div>
