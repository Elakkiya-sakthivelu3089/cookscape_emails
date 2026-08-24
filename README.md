# 🏢 Cookscape Workspace | Enterprise Mail & Communication Suite

> A modern, in-house corporate email and safe collaboration platform designed specifically for **Cookscape Interior Designing Company**, powered by **PostgreSQL** and **Prisma ORM**.

---

## 🌟 Key Capabilities

### 1. 🛡️ Super Admin Control Center (`/admin`)
- **Employee Provisioning**: Generate `@cookscape.com` email addresses (e.g. `priya.designer@cookscape.com`) with automated password generators.
- **One-Click Credential Card**: Generates an employee welcome slip with login URL, official email, and temporary password ready to share.
- **Storage Quotas & Department Management**: Allocate mailbox storage limits (2GB, 5GB, 10GB, 25GB) and organize team members into departments (*Design Studio, Modular Kitchen, 3D Architecture, Site Ops, Management*).
- **Security & Audit Logs**: Detailed timeline of logins, emails dispatched, and password modifications.

### 2. 📧 Zoho / Gmail-Style Webmail Client (`/mail`)
- **3-Column Workspace**: Left folder navigation, middle message preview list with category tags, and right full conversation thread reader.
- **Interior Design Proposal Templates**: One-click insertion of pre-built design pitches, modular kitchen estimates, BOQ breakdowns, and site milestone sign-offs.
- **Full Email Lifecycle**: Threading, Starred, Sent, Drafts, Trash, Spam, Archive, Priority flags (Normal, High, Urgent), and Unread counters.
- **Attachment Support**: Upload floor plans, 3D renders, CAD drawings, PDFs, and quotations.
- **Inline Quick Reply & Full Rich HTML Composer**.

### 3. 💬 Safe In-House Messenger & Client Project Rooms (`/chat`)
- **Internal Studio Channels**: `#general`, `#design-studio`, `#modular-kitchens`, `#site-supervisors`.
- **1-on-1 Direct Messaging**: Private encrypted direct chats between colleagues with live online status indicators.
- **Client Project Rooms**: Dedicated project communication portals (e.g. *Villa 402 - Living & Modular Kitchen Renovation*, Project Code `CK-2026-VILLA402`) to share design renders, CAD drawings, and site progress safely within company servers.
- **Real-Time WebSockets**: Instant message delivery, live typing indicators ("*Priya is typing...*"), unread counters, and sound/badge alerts.

---

## 🔑 Pre-Configured Demo Accounts (1-Click Login Available)

| Name | Role | Email | Password |
| :--- | :--- | :--- | :--- |
| **Karthik Raja** | Super Admin & Principal Architect | `admin@cookscape.com` | `Cookscape@123` |
| **Priya Sundaram** | Senior Interior Designer | `priya.designer@cookscape.com` | `Cookscape@123` |
| **Rajesh Sharma** | Lead Site Supervisor | `rajesh.ops@cookscape.com` | `Cookscape@123` |
| **Vikram Mehta** | Modular Kitchen Specialist | `vikram.kitchens@cookscape.com` | `Cookscape@123` |
| **Ananya Verma** | Client (Homeowner - Villa 402) | `ananya.client@gmail.com` | `Cookscape@123` |

---

## 🐘 PostgreSQL & Database Migration

The project is configured for **PostgreSQL** via Prisma.

### 1. Database Connection (`backend/.env`)
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cookscape_db?schema=public"
```
*(You can also use cloud PostgreSQL URLs from Supabase, Neon, AWS RDS, Railway, or DigitalOcean).*

### 2. Launch Local PostgreSQL with Docker (Optional 1-Click)
```bash
npm run db:up
```

### 3. Run Prisma Migration
```bash
# Push schema changes to your PostgreSQL database:
npm run prisma:push

# Or run standard Prisma migrations:
npm run prisma:migrate
```

### 4. Seed Database
```bash
npm run seed
```

### 5. Open Prisma Studio (Database Visual UI)
```bash
npm run prisma:studio
```

---

## 🚀 Quick Start Guide (Single Command)

```bash
# Start both frontend and backend together:
npm run dev
```

- **Frontend App**: `http://localhost:5173`
- **Backend API & WebSocket Server**: `http://localhost:5000`

---

## 📂 Project Architecture

```
cookscape-email-service/
├── backend/
│   ├── src/
│   │   ├── config/             # Prisma client & environment configs
│   │   ├── controllers/        # Admin, Mail, Chat, Template, Contact controllers
│   │   ├── middleware/         # JWT Auth, Role Guard, Multer upload
│   │   ├── routes/             # REST API routes
│   │   ├── services/           # MailEngine, Socket.IO real-time, Audit logger, Seed
│   │   └── server.ts           # Express + Socket.IO server
│   ├── prisma/
│   │   └── schema.prisma       # PostgreSQL models with @db.Text and indexes
│   └── uploads/                # Design drawings & attachments
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/          # Admin dashboard, employee manager, credential modal
│   │   │   ├── mail/           # Zoho/Gmail 3-pane client, composer, templates
│   │   │   ├── chat/           # Studio channels, client project rooms, typing indicators
│   │   │   ├── layout/         # App navigation, navbar, theme
│   │   │   └── auth/           # Login portal with 1-click role switcher
│   │   ├── context/            # AuthContext, MailContext, ChatContext
│   │   └── services/           # Axios API client & Socket.IO client
│   └── index.html
├── docker-compose.yml          # Production PostgreSQL 16 service
└── README.md
```
