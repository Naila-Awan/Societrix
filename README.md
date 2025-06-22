# Societrix

Societrix is a comprehensive platform for university societies to manage events, venue bookings, announcements, reports, and communication between admins and society members.

## Features

- **Admin Dashboard:** Manage societies, approve/reject event requests, manage funds, and oversee reports.
- **Society Dashboard:** Submit event requests, book venues, post announcements, and manage society information.
- **Chat System:** Real-time messaging between admins and societies.
- **Reports:** Submit and review event and society reports.
- **Authentication:** Secure login for admins and societies.

## Tech Stack

- **Frontend:** React, Redux Toolkit, React Router
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Authentication:** JWT
- **Other:** Vite, Axios, Nodemon

## Project Structure

```
Societrix/
  client/    # React frontend
  server/    # Express backend
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB

### Setup

#### 1. Clone the repository

```bash
git clone <repo-url>
cd Societrix-main/Societrix
```

#### 2. Install dependencies

**For the backend:**
```bash
cd server
npm install
```

**For the frontend:**
```bash
cd ../client
npm install
```

#### 3. Configure Environment Variables

Create a `.env` file in the `server` directory with the following (example):

```
MONGO_URI=mongodb://localhost:27017/societrix
JWT_SECRET=your_jwt_secret
PORT=5000
```

#### 4. Seed the Database (Optional)

You can seed initial societies, events, and reports:

```bash
cd server
npm run seed:all
```

#### 5. Start the Development Servers

**Backend:**
```bash
cd server
npm run dev
```

**Frontend:**
```bash
cd ../client
npm run dev
```

- The frontend will run on [http://localhost:5173](http://localhost:5173)
- The backend will run on [http://localhost:5000](http://localhost:5000)

## Usage

- Visit the frontend URL and log in as an admin or society.
- Admin credentials and society credentials can be found in the seeded data or created via the admin panel.

## Scripts

- `npm run dev` - Start development server (frontend or backend)
- `npm run build` - Build frontend for production
- `npm run seed:all` - Seed all initial data (backend)

**For any issues or contributions, please open an issue or pull request.**
