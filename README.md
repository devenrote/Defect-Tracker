# Defect Tracker

A production-ready defect tracking system for software companies. Manage bugs, assign defects to developers, track status workflows, upload screenshots, and monitor project health through role-based dashboards.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React.js, Tailwind CSS, Axios, React Router DOM, React Hook Form, Chart.js |
| Backend | Node.js, Express.js, JWT, bcryptjs, Multer, Cloudinary |
| Database | PostgreSQL |

## Architecture

```
Frontend (React + Vite)
        ↓ REST API
Backend (Node.js + Express)
        ↓
PostgreSQL Database
        ↓
Cloudinary (Screenshot Storage)
```

## Folder Structure

```
Defect-Tracker/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & Cloudinary config
│   │   ├── controllers/     # Request handlers (MVC)
│   │   ├── middleware/      # Auth, upload, validation, errors
│   │   ├── repositories/    # Data access layer
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic layer
│   │   ├── utils/           # JWT, AppError utilities
│   │   ├── validators/      # Input validation rules
│   │   ├── app.js             # Express app setup
│   │   └── server.js          # Server entry point
│   ├── scripts/
│   │   └── seed.js            # Database seeder
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # Auth context provider
│   │   ├── pages/           # Page components by role
│   │   ├── services/        # API service layer
│   │   ├── App.jsx          # Route definitions
│   │   ├── main.jsx         # App entry
│   │   └── index.css        # Tailwind styles
│   ├── package.json
│   └── vite.config.js
├── database/
│   ├── schema.sql           # PostgreSQL schema
│   └── sample-data.sql      # Sample data reference
├── DEPLOYMENT.md            # Deployment guide
└── README.md
```

## User Roles

| Role | Capabilities |
|------|-------------|
| **Admin** | Create projects, manage users, assign defects, view all defects, generate reports |
| **Tester** | Report defects, upload screenshots, view reported defects, verify fixes, add comments |
| **Developer** | View assigned defects, update status, add comments, mark as resolved |

## Defect Status Workflow

```
Open → Assigned → In Progress → Resolved → Verified → Closed
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Cloudinary account (for screenshot uploads)

### 1. Database Setup

```bash
createdb defect_tracker_pro
psql -U postgres -d defect_tracker_pro -f database/schema.sql
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your database and Cloudinary credentials
npm install
npm run init-db
npm run seed
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api/health

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@defecttracker.com | Password123! |
| Tester | tester@defecttracker.com | Password123! |
| Developer | developer@defecttracker.com | Password123! |

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT token |

### Projects (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/projects/:id/statistics` | Project defect stats |

### Defects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/defects` | List defects (with filters) |
| GET | `/api/defects/:id` | Get defect details |
| POST | `/api/defects` | Create defect (multipart for screenshot) |
| PUT | `/api/defects/:id` | Update defect |
| DELETE | `/api/defects/:id` | Delete defect (Admin) |
| GET | `/api/defects/dashboard/stats` | Dashboard statistics |
| GET | `/api/defects/reports` | Reports data (Admin) |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/comments/:defectId` | Get comments for defect |
| POST | `/api/comments` | Add comment |
| PUT | `/api/comments/:id` | Edit own comment |
| DELETE | `/api/comments/:id` | Delete own comment |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users (Admin) |
| PUT | `/api/users/:id` | Update user profile |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all as read |

## Environment Variables

### Backend (.env)

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=defect_tracker_pro
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:5173
```

## Features

- JWT authentication with role-based authorization
- Password hashing with bcrypt
- Screenshot upload via Multer + Cloudinary (jpg, jpeg, png, webp, max 5MB)
- Real-time notification system
- Defect status timeline/history
- Interactive dashboards with Chart.js
- Search, filter, and pagination on data tables
- Toast notifications and loading states
- Responsive modern UI with Tailwind CSS
- MVC architecture with Repository/Service pattern
- Centralized error handling
- Input validation with express-validator

## License

MIT
