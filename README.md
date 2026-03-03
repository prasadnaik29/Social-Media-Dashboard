# 📱 Social Media Dashboard

A full-stack social media platform built with the **MERN stack** — featuring real-time messaging via **Socket.IO**, JWT authentication, media uploads, and a rich analytics dashboard.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-18+-green.svg)
![React](https://img.shields.io/badge/react-19-61DAFB.svg)

---

## ✨ Features

| Feature | Description |
|---|---|
| 📈 **Analytics Dashboard** | Interactive charts (Line, Bar) showing posts over time, engagement by day, top posts & follower stats |
| 💬 **Real-time Messaging** | Socket.IO powered direct messaging with live online/offline presence indicators |
| 🔔 **Live Notifications** | Instant like, comment, and follow alerts via WebSocket events |
| 🔐 **JWT Authentication** | Secure login with Bearer token, bcrypt password hashing, and protected routes |
| 📝 **Post Feed** | Create posts with image uploads, like/unlike, comment, and delete your own posts |
| 👥 **User Profiles** | View profiles, follower/following counts, post history, and update your own bio & avatar |
| 🔍 **User Discovery** | Search users and get follow suggestions (people you don't follow yet) |
| 📤 **Media Uploads** | Multer-based local image storage for posts, avatars, and cover photos |
| 🛡️ **Security** | CORS, rate limiting via Express, bcrypt hashing, and JWT middleware on all private routes |

---

## 🖥️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19 · Vite · React Router v7 · Chart.js · Socket.IO Client · Axios · Lucide React |
| **Backend** | Express.js 5 · MongoDB / Mongoose · Socket.IO · JWT · Multer · Morgan |
| **DevOps** | Node.js 18+ · Nodemon · dotenv · npm workspaces |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **MongoDB Atlas** account (free M0 cluster) or a local MongoDB instance

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/social-media-dashboard.git
cd social-media-dashboard

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your credentials (see **API Keys Setup** below).

### 3. Run the App

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd server
npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), register a new account, and start exploring!

---

## 🔑 API Keys Setup

### MongoDB Atlas *(Required — Free)*

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Click **"Create a Free Cluster"** → Select **M0 (Free Forever)**
3. Create a **database user** with a username & password
4. Go to **Network Access** → **Add IP Address** → Select **"Allow Access from Anywhere"**
5. Go to **Clusters** → **Connect** → **Drivers**
6. Copy the connection string and replace `<password>` with your database user password
7. Paste it into `MONGO_URI` in your `.env`

### JWT Secret *(Required — Generate Locally)*

Run this command to generate a secure random secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Paste the output into `JWT_SECRET` in your `.env`.

---

## ⚙️ Environment Variables

Create a `server/.env` file with the following:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/social-media
JWT_SECRET=your_super_secret_key_here
CLIENT_URL=http://localhost:5173
```

---

## 📁 Project Structure

```
├── client/                     # React Frontend (Vite)
│   ├── src/
│   │   ├── components/         # PostCard, Sidebar, Suggestions
│   │   ├── context/            # AuthContext, SocketContext
│   │   ├── pages/              # Home, Analytics, Messages, Profile, Login, Register
│   │   ├── App.jsx             # Routing & layout
│   │   └── index.css           # Global styles & design system
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Express Backend
│   ├── middleware/             # auth.js (JWT protect), upload.js (Multer)
│   ├── models/                 # User, Post, Message, Conversation schemas
│   ├── routes/                 # auth, users, posts, messages, analytics
│   ├── socket/                 # Socket.IO event handlers (online presence, messaging)
│   ├── uploads/                # Locally stored uploaded media
│   ├── index.js                # Entry point — Express + Socket.IO + MongoDB
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🔌 API Endpoints

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Register a new user |
| `POST` | `/api/auth/login` | ❌ | Login and receive JWT |

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users/me` | ✅ | Get current authenticated user |
| `PUT` | `/api/users/me/profile` | ✅ | Update profile (bio, avatar, cover photo) |
| `GET` | `/api/users/search?q=` | ✅ | Search users by username or name |
| `GET` | `/api/users/suggestions/list` | ✅ | Get suggested users to follow |
| `GET` | `/api/users/:username` | ✅ | Get user profile + their posts |
| `POST` | `/api/users/:id/follow` | ✅ | Toggle follow / unfollow a user |

### Posts

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/posts/feed` | ✅ | Get paginated feed (following + own) |
| `POST` | `/api/posts` | ✅ | Create a post (with optional image upload) |
| `GET` | `/api/posts/:id` | ✅ | Get a single post |
| `POST` | `/api/posts/:id/like` | ✅ | Toggle like / unlike on a post |
| `POST` | `/api/posts/:id/comment` | ✅ | Add a comment to a post |
| `DELETE` | `/api/posts/:id` | ✅ | Delete your own post |

### Messages

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/messages/conversations` | ✅ | Get all conversations |
| `GET` | `/api/messages/:userId` | ✅ | Get message history with a user |
| `POST` | `/api/messages/:userId` | ✅ | Send a message to a user |

### Analytics

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/analytics/dashboard` | ✅ | Posts over time, engagement by day, top posts, follower snapshot |

### Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | ❌ | Check server status |

---

## 🔌 Real-time Events (Socket.IO)

| Event | Direction | Description |
|---|---|---|
| `userOnline` | Client → Server | Mark user as online |
| `sendMessage` | Client → Server | Send a direct message |
| `receiveMessage` | Server → Client | Receive a new message |
| `getOnlineUsers` | Server → Client | Broadcast list of online user IDs |

---

## 📜 License

MIT © 2025 · Built with ❤️ using the MERN Stack
