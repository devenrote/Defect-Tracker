# Defect Tracker Pro

Defect Tracker Pro is a professional, enterprise-grade defect and bug tracking system featuring role-based access control (RBAC) designed for software development and QA teams to manage issues throughout their complete lifecycle.

---

## Key Features

- **Authentication & Security**: Secure user logins and registration powered by JSON Web Tokens (JWT) and hashed passwords (`bcryptjs`).
- **Role-Based Access Control (RBAC)**: Detailed workflow and visibility restriction across four distinct user roles (Admin, Manager, Developer, Tester).
- **Interactive Dashboards**: Role-specific dashboard layouts utilizing `recharts` and `Chart.js` charts displaying real-time metrics (Open defects, Monthly trends, Severity ratios, etc.).
- **Project Management**: Creation and updates of projects with deadlines, priority, and assigned team members.
- **Defect Reporting & Assignment**: Standardized defect logging forms with screen/file attachments.
- **Verification Queue**: A dedicated queue where testers verify resolved issues. Enforces strict reporter privacy: testers only see resolved issues they originally created.
- **Activity Timeline**: Logged timestamps of defect progress, assignments, and file uploads.
- **Discussion System**: Comment threads on defect pages supporting updates, edits, and deletions.
- **Attachment Management**: Cloudinary-powered file storage with segregated folder paths.
- **Reports & Analytics**: Custom search, date-range filtering, and project statistics exports.
- **Data Exporting**: Local client-side generation of CSV, Excel (CSV format compatibility), and PDF reports.
- **Contact Us Form**: Customer landing page form integrated with local database storage and instant email delivery via **Web3Forms**.
- **Responsive Modern UI**: Sleek layout styled using Tailwind CSS and Lucide Icons.

---

## User Roles

### 👑 Admin
- Complete project management capabilities (create, update, delete).
- System-wide user roster management.
- Creation, updates, and deletion of any defects across all projects.
- Analytics generation and reports exporting.

### 💼 Manager
- General project overview and stats inspection.
- Allocation and assignment of defects to developers.
- Changing and updating defect status or description notes.
- Logging actions and adding discussion comments.

### 💻 Developer
- Overview of defects specifically assigned to their queue.
- Progress transitions (status changes to In Progress, Analysis Started, Resolved).
- Submission of resolution notes, technical updates, and attachments (stored under `'EVIDENCE'`).

### 🧪 Tester
- Reporting new defects with screenshots (stored under `'REPORT'`).
- Dedicated **Verification Queue** featuring defects they reported that developers resolved.
- Verification workflows: Mark resolved issues as Closed or Reopen them back to the queue.

---

## Defect Workflow

The standard defect resolution path progresses as follows:

```
Tester Reports Defect (Status: Open)
         ↓
Manager Assigns Defect to Developer (Status: Assigned)
         ↓
Developer Begins Work (Status: In Progress / Analysis Started)
         ↓
Developer Fixes Issue & Uploads Evidence (Status: Resolved / Ready For QA)
         ↓
Tester Reviews Fix (Verification Queue)
       ↙   ↘
Closed      Reopened (Returns to Assigned)
```

---

## Technology Stack

- **Frontend**: React.js (Vite), Tailwind CSS, Lucide Icons, React Router DOM, Axios, Chart.js, Recharts, React Hot Toast.
- **Backend**: Node.js, Express.js, Multer, JWT, bcryptjs.
- **Database**: PostgreSQL (pg client pool).
- **File Storage**: Cloudinary (utilizing folder segregation: `Defect-Tracker/` and `Defect-Tracker/evidence-attachments/`).
- **Form Mailer**: Web3Forms API.

---

## Folder Structure

```
Defect-Tracker/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & Cloudinary configurations
│   │   ├── controllers/     # Request handlers (MVC)
│   │   ├── middleware/      # Auth, uploads, validations, error handling
│   │   ├── repositories/    # Database query models
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic layer
│   │   ├── utils/           # JWT, AppError helpers
│   │   └── app.js           # Express app definition
│   ├── scripts/
│   │   ├── init-db.js       # Database initialization
│   │   ├── seed.js          # Demo data loader
│   │   └── migrate.js       # Table modification migrations
│   ├── server.js            # Server entrypoint
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Common components (Sidebar, Layout, badges)
│   │   ├── context/         # AuthContext provider
│   │   ├── pages/           # Pages (Home, Login, role-specific components)
│   │   ├── services/        # Client API service wrapper
│   │   ├── App.jsx          # Router & layout mappings
│   │   └── main.jsx         # React application bootstrap
│   ├── package.json
│   └── vite.config.js
├── database/
│   ├── schema.sql           # Database tables blueprint
│   └── sample-data.sql      # Seed inserts file
├── DEPLOYMENT.md            # Production deployment guide
└── README.md                # System documentation
```

---

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- Cloudinary Account
- Web3Forms Access Key

### 1. Database Setup
Create your local PostgreSQL database and load the schema:
```bash
createdb defect_tracker_pro
psql -U postgres -d defect_tracker_pro -f database/schema.sql
```

### 2. Backend Setup
1. Navigate to the backend directory and copy the environment template:
   ```bash
   cd backend
   cp .env.example .env
   ```
2. Populate the `.env` file with your credentials:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   DB_NAME=defect_tracker_pro
   DB_PORT=5432
   DB_SSL=false
   JWT_SECRET=your_super_secure_jwt_key
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   FRONTEND_URL=http://localhost:5173
   ```
3. Install dependencies, run DB setup scripts, and start the developer server:
   ```bash
   npm install
   npm run init-db
   npm run seed
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies and start the Vite dev server:
   ```bash
   npm install
   npm run dev
   ```

### 4. Application Endpoints
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## Demo Access Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@defecttracker.com` | `Password123!` |
| **Manager** | `manager@defecttracker.com` | `Password123!` |
| **Developer** | `developer@defecttracker.com` | `Password123!` |
| **Tester** | `tester@defecttracker.com` | `Password123!` |

---

## Screenshots Placeholder

- **Landing Page**: `![Landing Page Placeholder](https://placehold.co/800x450?text=Landing+Page)`
- **Admin Dashboard**: `![Admin Dashboard Placeholder](https://placehold.co/800x450?text=Admin+Dashboard)`
- **Manager Dashboard**: `![Manager Dashboard Placeholder](https://placehold.co/800x450?text=Manager+Dashboard)`
- **Developer Dashboard**: `![Developer Dashboard Placeholder](https://placehold.co/800x450?text=Developer+Dashboard)`
- **Tester Dashboard**: `![Tester Dashboard Placeholder](https://placehold.co/800x450?text=Tester+Dashboard)`
- **Reports**: `![Reports Page Placeholder](https://placehold.co/800x450?text=Reports+Page)`
- **Defect Details**: `![Defect Details Placeholder](https://placehold.co/800x450?text=Defect+Details)`
- **Verification Queue**: `![Verification Queue Placeholder](https://placehold.co/800x450?text=Verification+Queue)`

---

## License

Defect Tracker Pro is released under the [MIT License](LICENSE).
