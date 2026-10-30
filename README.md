<div align="center">

# 🍽️ Resto Mayo
### Next-Generation Restaurant Ordering & Kitchen Display System (KDS)

[![Next.js](https://img.shields.io/badge/Next.js-16.4.0-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.10.0-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

<p align="center">
  <strong>An enterprise-grade, mobile-first fullstack web application for modern restaurant dining, featuring instant QR code table ordering, real-time Kitchen Display System (KDS), digital payment flows, and comprehensive administrative back-office management.</strong>
</p>

[Explore Features](#-key-features) •
[Tech Stack](#-tech-stack) •
[Quick Start](#-quick-start--installation-guide) •
[Admin Credentials](#-admin-credentials) •
[Project Structure](#-project-architecture) •
[API Documentation](#-api-endpoints)

</div>

---

## 🌟 Overview

**Resto Mayo** is engineered to replace legacy paper menus and fragmented POS systems with a unified, cloud-ready digital culinary experience. Built with modern full-stack best practices, it eliminates ordering bottlenecks, connects dining tables directly to kitchen staff in real time, and provides restaurant managers with granular operational control.

Designed with a warm **Red & Gold** aesthetic inspired by international culinary dining, the UI delivers an engaging experience on smartphones, tablets, and desktop workstations.

---

## 🚀 Key Features

### 📱 1. Customer Dine-In Experience
- **Instant QR Code Table Binding**: Customers scan their table's standee QR code (e.g. `/?table=M01`) to automatically pair their session with the designated table without any app downloads or account creation.
- **Dynamic Digital Menu**: Real-time category filtering (*Food, Beverages, Dimsum*), instant keyword search, and high-resolution culinary photography.
- **Custom Chef Notes**: Add special dietary instructions, spice preferences, or allergen notes per dish.
- **Smart Dining Cart**: Real-time subtotal computation, Indonesian restaurant tax (PB1 10%) calculation, and responsive floating order bar.
- **Multi-Channel Digital Checkout**: Supports QRIS, simulated digital wallets (GoPay, DANA, OVO, ShopeePay), and direct bank transfers.
- **Live Kitchen Order Tracker**: Real-time visual progress indicator updating customers through 4 stages: `Received` ➔ `Cooking` ➔ `Ready` ➔ `Served`.

### 🍳 2. Kitchen Display System (KDS)
- **FIFO Order Queue**: Automatically sorts cooking tickets chronologically (*First-In, First-Out*).
- **One-Click Cooking Pipeline**: Kitchen staff transition order tickets seamlessly from `Pending` (New Ticket) ➔ `Cooking` (On Stove) ➔ `Ready` (Ready for Waiter) ➔ `Served`.
- **High-Visibility Alerts**: Prominently highlights custom chef instructions and item quantities.
- **Audio-Visual Polling**: Regularly syncs with the database to surface incoming orders without page reloads.

### 📊 3. Executive Back-Office Management
- **Live Analytics Dashboard**: Real-time metrics on total revenue, order count, active kitchen queue, and table occupancy rates.
- **Menu & Catalog CRUD**: Create, edit, and delete dishes with real-time price changes, image URLs, and instantaneous *"Available / Sold Out"* inventory toggles.
- **Category Management**: Organize dishes into custom culinary classifications.
- **Table QR Generator & Print Suite**: Automatically generates high-resolution, printable QR codes formatted for table standees and cashier banners with custom base URL configuration.

### 🛡️ 4. Defensive Security Architecture
- **In-Memory Rate Limiting**: Mitigates brute-force authentication attacks on `/api/admin/login` and prevents order flooding on `/api/orders`.
- **HMAC-SHA256 Signed Session Tokens**: Cryptographically signed HTTP-only cookies prevent cookie tampering, identity spoofing, and privilege escalation.
- **Authoritative Server-Side Pricing**: Computes cart totals on the backend using database records to prevent client-side price manipulation attacks.
- **Sanitization & Injection Prevention**: Strict string sanitization guards against Cross-Site Scripting (XSS), paired with Prisma's parameterized queries to eliminate SQL injection vulnerabilities.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | [Next.js 16.4.0 (App Router)](https://nextjs.org/) | Server Components, Turbopack, Streaming SSR |
| **UI Library** | [React 19.3.0](https://react.dev/) | Modern concurrent React primitives |
| **Language** | [TypeScript 5.x](https://www.typescriptlang.org/) | Strict end-to-end type safety |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Mobile-first custom red-gold culinary design system |
| **Database** | [MySQL 8.0+](https://www.mysql.com/) / MariaDB | Relational storage hosted locally or via Railway |
| **ORM** | [Prisma 7.10.0](https://www.prisma.io/) | Modern type-safe database client and migrations |
| **Security** | Node `crypto` / HMAC-SHA256 | Cryptographic token signatures & rate-limiting guards |

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Node.js**: `v18.18.0` or higher (`v20.x` LTS recommended)
- **Package Manager**: `npm` (bundled with Node), `pnpm`, or `yarn`
- **Database**: A running **MySQL 8.0+** instance (local, Docker container, or cloud-hosted on [Railway](https://railway.app), PlanetScale, Aiven, etc.)
- **Git**: Installed and configured on your OS

---

## 💻 Quick Start / Installation Guide

Follow these step-by-step instructions to clone and run the project locally on your machine.

### Step 1: Clone the Repository

Clone this repository to your local directory using Git:

```bash
git clone https://github.com/<your-username>/resto-mayo.git
cd resto-mayo
```

*(Replace `<your-username>` with your actual GitHub username or organization).*

---

### Step 2: Install Dependencies

Install all project dependencies:

```bash
npm install
```

> **Note**: During installation, Prisma will automatically run its `postinstall` script to generate the client engine.

---

### Step 3: Configure Environment Variables

Create your local `.env` configuration file from the provided template:

```bash
cp .env.example .env
```

Open `.env` in your preferred code editor and configure your database connection string and session secret:

```env
# Database Connection (MySQL / MariaDB)
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"

# Application Environment
NODE_ENV="development"

# Cryptographic Session & HMAC Signing Secret (min 32 characters in production)
SESSION_SECRET="resto-mayo-secure-secret-token-key-2026-c7f8a49e-d301"
```

*Example for local MySQL:*
```env
DATABASE_URL="mysql://root:password123@localhost:3306/resto_mayo"
```

*Example for Railway Cloud MySQL:*
```env
DATABASE_URL="mysql://root:secret@proxy.rlwy.net:50088/railway"
```

---

### Step 4: Synchronize Database Schema & Seed Data

1. Push the Prisma schema directly to your MySQL database:

```bash
npx prisma db push
```

2. Generate the updated Prisma Client:

```bash
npx prisma generate
```

3. Seed default tables, menu categories, culinary dishes, and initial administrator credentials:

```bash
npm run dev
```

*(Or execute the TypeScript seed script using `npx tsx prisma/seed.ts` if `tsx` is globally installed).*

---

### Step 5: Launch the Development Server

Start the Next.js development server powered by Turbopack:

```bash
npm run dev
```

Once running, the application will be accessible at:
- 🌐 **Customer Menu**: [http://localhost:3000](http://localhost:3000)
- 🪑 **Simulated Table Dine-In**: [http://localhost:3000/?table=M01](http://localhost:3000/?table=M01)
- 🔐 **Admin Login**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

---

## 🔐 Admin Credentials

A pre-configured administrator account is seeded for back-office and kitchen access:

| Field | Value |
| :--- | :--- |
| **Login URL** | `/admin/login` |
| **Email** | `admin234@restomayo.com` |
| **Password** | `password` |
| **Role** | `admin` |

> 🔒 **Security Notice**: To protect administrative access, there is no public navigation button to the login page on the customer-facing interface. Access is granted strictly via direct URL (`/admin/login` or `/login`). The login route is protected against brute-force attacks (maximum 5 attempts per 10 minutes).

---

## 📱 Testing Table QR Codes on Mobile

To test the dine-in experience on your smartphone:

1. **Local Wi-Fi Network**:
   - Find your laptop/PC's local IP address (e.g. `192.168.1.15`).
   - Run Next.js binding to host: `npm run dev -- -H 0.0.0.0`.
   - Open `/admin/qr` in your desktop browser.
   - Set the Target URL to `http://192.168.1.15:3000`.
   - Scan any Table QR card directly with your smartphone's camera.

2. **Public Tunnel (Cloudflared / Ngrok)**:
   - Run `ngrok http 3000` or `cloudflared tunnel --url http://localhost:3000`.
   - Paste the generated public HTTPS URL into `/admin/qr`.
   - Scan with any mobile device anywhere in the world.

---

## 🏗️ Project Architecture

```
resto-mayo/
├── app/
│   ├── admin/                     # Protected Administrative Back-Office
│   │   ├── categories/            # Menu category management
│   │   ├── dashboard/             # Revenue, sales & occupancy analytics
│   │   ├── kitchen/               # Live Kitchen Display System (KDS)
│   │   ├── login/                 # Secure admin authentication
│   │   ├── orders/                # Complete order history & status manager
│   │   ├── products/              # Dish catalog CRUD & availability toggle
│   │   ├── qr/                    # Table QR generator & print suite
│   │   └── layout.tsx             # Admin shell layout & navigation bar
│   ├── api/                       # RESTful Route Handlers
│   │   ├── admin/                 # Authentication, logout, and metrics APIs
│   │   ├── categories/            # Category endpoints
│   │   ├── orders/                # Order creation, listing & status updates
│   │   ├── payments/              # Payment confirmation simulation
│   │   ├── products/              # Product catalog endpoints
│   │   └── tables/                # Dining table occupancy endpoints
│   ├── cart/                      # Dining cart & order summary
│   ├── checkout/                  # Table selection & payment method gateway
│   ├── payment/[orderNumber]/     # Order tracking & payment receipt
│   ├── layout.tsx                 # Root layout & global typography
│   ├── page.tsx                   # Main customer menu & catalog page
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
├── .env.example                   # Environment variable template
├── package.json                   # Dependencies and build scripts
└── tsconfig.json                  # TypeScript compiler settings
```

---

## 📡 API Endpoints

### Customer Endpoints
- `GET /api/products` — Retrieve all active menu items and dishes.
- `GET /api/categories` — Retrieve all dining categories.
- `GET /api/tables` — Retrieve restaurant tables and occupancy status.
- `POST /api/orders` — Create a new customer order with server-side price computation.
- `GET /api/orders/[orderNumber]` — Retrieve order status and tracking details.
- `POST /api/payments/[orderNumber]/confirm` — Confirm payment and transition order to cooking.

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

## 📦 Production Deployment

### Building for Production

Compile and bundle the application with Turbopack:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

### Deploying to Cloud Platforms

- **Vercel**: Import the GitHub repository, configure `DATABASE_URL` and `SESSION_SECRET` in the Project Settings, and deploy.
- **Railway**: Connect your GitHub repository with a Railway MySQL database service. Set the `DATABASE_URL` environment variable to Railway's private or public MySQL connection string.
- **Docker**: Easily containerize using the standard Node.js Alpine base image.

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Crafted with passion, precision, and modern full-stack web technologies.</sub>
</div>
