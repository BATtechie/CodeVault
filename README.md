# CodeVault – A Developer Code Snippet Management System

A platform for developers to store, organize, and browse reusable code snippets.

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
| **Authentication** | Signup, login, logout, protected routes (cookie-based session) |
| **Snippets** | Create, read, update, delete your own snippets |
| **Public browsing** | Browse public snippets shared by users |
| **Search (basic)** | Search by title/language/tags (client-side) |

---

## 🛠️ Tech Stack

### Frontend
- **React.js** – UI library
- **React Router DOM** – Client-side routing
- **Fetch API** – HTTP client
- **CSS** – Styling

### Backend
- **Node.js** – Runtime environment
- **Express.js** – Web framework (Express v5)
- **Prisma ORM** – Database ORM
- **Helmet** – Security headers
- **express-rate-limit** – Basic abuse protection for auth endpoints
- **dotenv** – Environment variable management
- **nodemon** – Development hot-reload

### Database
- **PostgreSQL** – Relational database (via Prisma)

### Authentication
- **JWT (jsonwebtoken)** – Stored in an `httpOnly` cookie (cookie-based session)
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
VITE_BACKEND_URL=http://localhost:3000
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
DATABASE_URL="postgresql://user:password@localhost:5432/codevault"
JWT_SECRET="your-secret-key-here"
PORT=3000
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

The frontend will run on `http://localhost:5173` and backend on `http://localhost:3000`

---

## 📡 API Overview

### Authentication Endpoints

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/api/auth/signup` | POST | Register new user | Public |
| `/api/auth/login` | POST | Authenticate user | Public |
| `/api/auth/me` | GET | Get current user | Authenticated |
| `/api/auth/me` | PUT | Update current user | Authenticated |
| `/api/auth/logout` | POST | Clear session cookie | Public |

### Snippet Endpoints

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/api/snippets` | GET | Get all user snippets | Authenticated |
| `/api/snippets/:id` | GET | Get single snippet | Authenticated |
| `/api/snippets` | POST | Create new snippet | Authenticated |
| `/api/snippets/:id` | PUT | Update snippet | Authenticated |
| `/api/snippets/:id` | DELETE | Delete snippet | Authenticated |
| `/api/snippets/public` | GET | Browse public snippets | Public |

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
VITE_BACKEND_URL=http://localhost:3000
```

### Backend (`.env`)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/codevault"

# JWT
JWT_SECRET="your-super-secret-key-change-this"

# Server
PORT=3000
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
