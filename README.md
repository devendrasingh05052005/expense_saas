# RoomMates – Multi-User Shared Expense Management SaaS

A complete, production-ready, modern responsive web application built with **React 19 + TypeScript + Tailwind CSS** on the frontend and **FastAPI + SQLAlchemy + SQLite/PostgreSQL** on the backend.

Designed for roommates, friends, families, and shared-living groups to manage individual personal expenses, isolated common room funds, and automatic debt settlements.

---

## ⚡ Features

- **Multi-Tenant & Dynamic Groups**: Not limited to 3 roommates! Supports groups of 2, 3, 5, 10, 20+ members with role-based access (Admin, Co-Admin, Member) and invite codes.
- **Secure Email Authentication**: Registration with real 6-digit OTP email verification, password reset, and JWT sessions.
- **Feature 1: Individual Expense Tracking**:
  - Track personal out-of-pocket expenses with Date, Amount in ₹ (INR), Description, and Category.
  - Interactive analytics: Member contribution donut chart, comparative bar chart, spending trends area chart.
  - Date range filtering (From Date to To Date) and search/category filters.
- **Feature 2: Common Room Fund (Completely Isolated)**:
  - Pooled money contributions (equal or unequal) and shared room purchases (Groceries, Milk, Gas, Veggies).
  - Strict overdraft prevention: cannot spend more than available balance.
  - Chronological transaction ledger with running balance recalculated on any edit or delete.
- **Feature 3: Automatic Settlement Calculator**:
  - Calculates fair share per member and net balances.
  - Greedy min-cash-flow algorithm to output minimal peer-to-peer debt payments.
  - 1-click "Mark Paid via UPI" and settlement payment history ledger.
- **Dark & Light Mode**: Seamless theme switching with persistent preferences.

---

## 🚀 One-Click Vercel Deployment

This project includes pre-configured **`vercel.json`** and **`api/index.py`** to deploy the fullstack app (React frontend + FastAPI serverless backend) directly on **Vercel**!

### Step 1: Push to GitHub
If you haven't already:
```bash
git remote add origin https://github.com/devendrasingh05052005/expense_saas.git
git branch -M main
git push -u origin main
```

### Step 2: Import into Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Select your GitHub repository **`expense_saas`**.
4. Leave the root directory as `./` (default). Vercel will automatically detect `vercel.json` and build both the Vite frontend and Python API.

### Step 3: Add Environment Variables in Vercel
In the Vercel project settings, go to **Settings** > **Environment Variables** and add:

| Variable | Recommended Value / Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string (e.g. free from [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com)). *If omitted, defaults to temporary SQLite `/tmp/roommates.db`*. |
| `SECRET_KEY` | Any random 32+ character secret string for JWT tokens. |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your Gmail address (e.g. `your_email@gmail.com`) |
| `SMTP_PASSWORD` | Your 16-character Google App Password (e.g. `zron bwvb lbsg nloo`) |
| `EMAILS_FROM_EMAIL` | Your Gmail address |
| `EMAILS_FROM_NAME` | `RoomMates App` |
| `DEV_MODE` | `False` |

5. Click **Deploy**!
Your full-stack application will be live at `https://your-project.vercel.app`.

---

## 💻 Local Development

### Option 1: 1-Click Launch on Windows
Double-click **`start.bat`** in the project root. It will:
1. Start the FastAPI Backend on `http://127.0.0.1:8000`
2. Start the Vite React Frontend on `http://localhost:5173`
3. Automatically open your browser to the application!

---

### Option 2: Run via Terminal

#### Terminal 1 — Backend:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Docs (Swagger): `http://127.0.0.1:8000/docs`

#### Terminal 2 — Frontend:
```bash
cd frontend
npm install
npm run dev
```
- Frontend: `http://localhost:5173`

---

## 🔒 Security Best Practices
- `.env` and `*.db` files are strictly added to `.gitignore` and never committed to GitHub.
- Passwords are securely hashed with `bcrypt`.
- Email OTP verification codes expire in 5 minutes and are rate-limited.
