# TaskFlow AI - Production-Ready AI SaaS Project Management System

**TaskFlow AI** is a modern, glassmorphic project management and team velocity tracking application. It integrates AI-powered features to help project managers and teams automatically draft task descriptions, generate subtasks, recommend target deadlines, summarize sprint achievements, and offer productivity advice. 

The system has a clean, beginner-friendly architecture specifically designed to be easily explained in 10–15 minutes during placement interviews.

---

## 🚀 Live Deployments

*   **Frontend Dashboard:** [https://task-flow-ai-zeta.vercel.app](https://task-flow-ai-zeta.vercel.app)
*   **Backend API Server:** [https://taskflow-ai-production-8b4d.up.railway.app](https://taskflow-ai-production-8b4d.up.railway.app)

---

## 🛠️ Technology Stack

### **Frontend**
*   **Framework:** Next.js 15 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (Modern Glassmorphic Dark UI)
*   **State & Forms:** React Hook Form + Zod validation
*   **Charts:** Recharts (Interactive Team Velocity indicators)
*   **HTTP Client:** Axios (Interceptors for JWT token attachment)
*   **Icons:** Lucide-React

### **Backend**
*   **Runtime:** Node.js
*   **Framework:** Express.js (TypeScript)
*   **Database ORM:** Prisma Client
*   **Database Engine:** PostgreSQL (Neon Cloud Database)
*   **Authentication:** JSON Web Tokens (JWT) + BCrypt (password hashing)
*   **AI Integration:** Groq SDK (Llama 3 LLM models)

---

## 🎨 System Architecture

TaskFlow AI follows a clean **Monorepo** structure:
```text
TaskFlow-AI/
├── backend/            # Express.js REST API Server
│   ├── prisma/         # Database schemas & seeding scripts
│   └── src/            # Controllers, middleware, and routes
├── frontend/           # Next.js 15 App Router client
│   ├── src/app/        # Dashboard layout, pages, and components
│   └── src/context/    # Auth state persistence wrapper
└── README.md           # Master Documentation
```

---

## 🎯 Key Features

1.  **Kanban Sprint Boards:** Drag-and-drop task card stages (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`) with live backend status updates.
2.  **Team Velocity Analytics:** Visual charts showing task completion metrics, distribution, and performance by assignee.
3.  **AI Assistant Service (Powered by Groq):**
    *   **Auto-Draft Description:** Writes technical descriptions for tasks given simple titles.
    *   **Subtask Generator:** Breaks down high-level tasks into actionable checkboxes.
    *   **Smart Deadline Recommendation:** Recommends due dates based on task priority.
    *   **Daily Sprint Summary:** Aggregates completed logs into a bulleted team report.
4.  **Activity logs & Notifications:** Keeps team members updated with audit feeds of project changes.

---

## 💻 Local Setup & Development

### **1. Clone the Repository**
```bash
git clone https://github.com/souravsinghrajput23/TaskFlow-AI.git
cd TaskFlow-AI
```

### **2. Setup Backend Server**
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a `.env` file in the `backend/` folder and paste your connection credentials:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://neondb_owner:your-password@ep-your-database-host.us-east-1.aws.neon.tech/neondb?sslmode=require"
   JWT_SECRET="your-jwt-signing-secret"
   GROQ_API_KEY="your-groq-api-key"
   ```
3. Sync the schema database tables:
   ```bash
   npx prisma db push
   ```
4. Seed the database with starter demo accounts:
   ```bash
   npx prisma db seed
   ```
5. Start the local server:
   ```bash
   npm run dev
   ```

### **3. Setup Next.js Frontend**
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Create a `.env.local` file in the `frontend/` folder:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:5000/api"
   NEXT_PUBLIC_SUPABASE_URL="https://your-supabase-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-supabase-anon-key"
   ```
3. Start the Next.js development client:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎓 Placement Interview Quick Reference

Be ready to explain these key implementation questions to interviewers:

#### **Q1: How does authentication and route protection work in TaskFlow AI?**
*   **Answer:** Users log in via the `/auth/login` endpoint. The server validates their credentials using BCrypt and generates a signed JWT token containing their user `id`, `email`, and `role`. 
*   On the frontend, the `AuthContext` component intercepts API calls via Axios, injecting the `Bearer <token>` inside the authorization headers. We also protect Next.js routes using standard layout client-side guards that redirect unauthenticated users back to `/login`.

#### **Q2: Why did you choose Prisma ORM over raw SQL queries?**
*   **Answer:** Prisma provides a fully type-safe database client. Every model defined in `schema.prisma` (e.g. `User`, `Task`) maps directly to compile-time TypeScript interfaces. This prevents database queries from breaking, handles foreign key cascades easily, and offers auto-completion for SQL queries out of the box.

#### **Q3: What happens to the AI features if the Groq API key is invalid or reaches rate limits?**
*   **Answer:** We implemented a **mock fallback service pattern**. Inside `ai.service.ts`, if the key is missing or an API call fails, the backend catches the exception and returns realistic, randomized project data instead of throwing a 500 error. This keeps the application 100% resilient and functional.

#### **Q4: How did you deploy your monorepo?**
*   **Answer:** The Node/Express backend is hosted on **Railway**, which handles container builds automatically. The frontend is hosted on **Vercel** with the root directory configuration configured to the `frontend` folder. Both deploy automatically whenever we push changes to `main`.
