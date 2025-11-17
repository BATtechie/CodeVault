# CodeVault – A Developer Code Snippet Management System

A collaborative platform for developers to store, organize, search, and share reusable code snippets with syntax highlighting and team collaboration features.

---

## 🎯 Problem Statement

Developers constantly reuse code patterns but waste time searching for solutions they've already written. Snippets get scattered across text files, notes apps, or old projects. Teams lose valuable knowledge when members leave. 

**GitHub Gists** lacks proper organization, while **note apps** don't support code highlighting. 

**CodeVault** solves this by providing a centralized platform to:
- Save and organize code snippets
- Search with syntax highlighting
- Tag and categorize code
- Share with team members
- Collaborate seamlessly

---

## ✨ Key Features

| Category | Features |
|----------|----------|
| **Authentication & Authorization** | User registration, login, logout, role-based access (admin/user), protected routes |
| **CRUD Operations** | Create, read, update, delete snippets and related entities |
| **Frontend Routing** | Home, Login, Register, Dashboard, Snippet Detail, Create/Edit Snippet, Teams, Profile |
| **Pagination** | Display 10-20 snippets per page with navigation and total count |
| **Search** | Search by title, description, code content, author username with debounced input |
| **Sorting** | Sort by date (newest/oldest), title (A-Z/Z-A), view count, language |
| **Filtering** | Filter by programming language, category, tags, visibility (public/private/team), favorites |
| **Syntax Highlighting** | Multi-language code highlighting with Prism.js |
| **Team Collaboration** | Create teams, share snippets with team members |
| **Hosting** | Deploy with HTTPS and CORS configured |

---

## 🛠️ Tech Stack

### Frontend
- **React.js** – UI library
- **React Router DOM** – Client-side routing
- **Axios** – HTTP client
- **Prism.js** – Syntax highlighting
- **React Icons** – Icon library
- **CSS** – Styling

### Backend
- **Node.js** – Runtime environment
- **Express.js** – Web framework
- **Prisma ORM** – Database ORM
- **express-validator** – Request validation
- **dotenv** – Environment variable management
- **nodemon** – Development hot-reload

### Database
- **MySQL** – Relational database

### Authentication
- **JWT (jsonwebtoken)** – Token-based authentication
- **bcrypt** – Password hashing

### Hosting
- **Frontend:** Vercel / Netlify
- **Backend:** Render / Railway
- **Database:** Railway / PlanetScale / Aiven

---

## 🏗️ System Architecture

```
┌─────────────────┐
│   Frontend      │
│   (React.js)    │
└────────┬────────┘
         │ Axios
         ▼
┌─────────────────┐
│   Backend API   │
│  (Express.js)   │
└────────┬────────┘
         │ Prisma ORM
         ▼
┌─────────────────┐
│   MySQL DB      │
└─────────────────┘
```

### Authentication Flow
- JWT-based authentication
- Passwords hashed with bcrypt
- Protected routes with middleware validation
- Role-based access control (admin/user)

---

## 🚀 Project Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MySQL database
- Git

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/BATtechie/CodeVault.git
cd CodeVault
```

#### 2. Setup Frontend
```bash
cd frontend/codeVault
npm install
```

Create `.env.local` file:
```env
VITE_BACKEND_URL=http://localhost:5000
```

Start frontend:
```bash
npm run dev
```

#### 3. Setup Backend
```bash
cd server
npm install
```

Create `.env` file:
```env
DATABASE_URL="mysql://user:password@localhost:3306/codevault"
JWT_SECRET="your-secret-key-here"
PORT=5000
NODE_ENV=development
```

Setup database:
```bash
npx prisma generate
npx prisma migrate dev
```

Start backend:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` and backend on `http://localhost:5000`

---

## 📡 API Overview

### Authentication Endpoints

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/api/auth/register` | POST | Register new user | Public |
| `/api/auth/login` | POST | Authenticate user | Public |

### Snippet Endpoints

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/api/snippets` | GET | Get all user snippets | Authenticated |
| `/api/snippets/:id` | GET | Get single snippet | Authenticated |
| `/api/snippets` | POST | Create new snippet | Authenticated |
| `/api/snippets/:id` | PUT | Update snippet | Authenticated |
| `/api/snippets/:id` | DELETE | Delete snippet | Authenticated |

### Team Endpoints

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/api/teams` | POST | Create team | Authenticated |
| `/api/teams/:id` | GET | Get team details | Authenticated |

### User Endpoints

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/api/users/profile` | GET | Get user profile | Authenticated |
| `/api/users/profile` | PUT | Update profile | Authenticated |

---

## 📂 Project Structure

```
CodeVault/
├── frontend/
│   └── codeVault/
│       ├── src/
│       │   ├── pages/
│       │   │   ├── LandingPage.jsx
│       │   │   ├── LandingPage.css
│       │   │   ├── SignIn.jsx
│       │   │   └── SignIn.css
│       │   ├── App.jsx
│       │   ├── main.jsx
│       │   ├── index.css
│       │   └── App.css
│       ├── package.json
│       └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── auth.controller.js
│   │   ├── routes/
│   │   │   └── auth.routes.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── db/
│   │   │   └── prisma.js
│   │   └── index.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── package.json
│   └── .env
│
└── README.md
```

---

## 🔐 Environment Variables

### Frontend (`.env.local`)
```env
VITE_BACKEND_URL=http://localhost:5000
```

### Backend (`.env`)
```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/codevault"

# JWT
JWT_SECRET="your-super-secret-key-change-this"

# Server
PORT=5000
NODE_ENV=development
```

---

## 🌐 Deployment

### Frontend Deployment (Vercel)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables:
   ```
   VITE_BACKEND_URL=https://api.yourdom.com
   ```
4. Deploy (automatic on push)

### Backend Deployment (Render)

1. Create account on Render
2. Connect GitHub repository
3. Set environment variables:
   ```
   DATABASE_URL=your-mysql-connection-string
   JWT_SECRET=your-jwt-secret
   NODE_ENV=production
   ```
4. Deploy

### Database (PlanetScale or Railway)

1. Create MySQL database instance
2. Update `DATABASE_URL` in backend `.env`
3. Run migrations: `npx prisma migrate deploy`

---

## 📝 Usage

### Creating a Snippet

1. Login to CodeVault
2. Navigate to Dashboard
3. Click "Create New Snippet"
4. Fill in:
   - Title
   - Description
   - Code content
   - Programming language
   - Tags
   - Visibility (Public/Private/Team)
5. Click "Save"

### Searching Snippets

- Use the search bar on Dashboard
- Search by title, description, or code content
- Results update in real-time (debounced)

### Sharing with Teams

1. Create or join a team
2. Create a snippet and set visibility to "Team"
3. Team members can view and collaborate

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License – see the LICENSE file for details.

---

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the development team.

---

**Made with ❤️ by CodeVault Team**
