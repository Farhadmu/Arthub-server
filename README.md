<div align="center">

# 🎨 ArtHub — Online Art Marketplace (Backend API)

**REST API powering the ArtHub art marketplace**

[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF?logo=stripe)](https://stripe.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://vercel.com/)

[Live API](https://arthub-server-two.vercel.app) · [Frontend Repo](https://github.com/Farhadmu/Arthub-client) · [Live Site](https://arthub-client-olive.vercel.app)

</div>

---

## 📖 About The Project

This is the backend REST API for **ArtHub**, an online art marketplace connecting artists and art buyers. Built with Node.js, Express, and MongoDB, it handles authentication, role-based access control, artwork management, Stripe payments, comments, wishlists, and admin analytics for the [ArtHub frontend](https://github.com/Farhadmu/Arthub-client).

### 🔑 Demo Admin Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@arthub.com` | `Admin@123` |

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [API Routes](#-api-routes)
- [Links](#-links)

---

## ✨ Key Features

### 🔐 Authentication & Security
- JWT authentication (email/password + Google OAuth), 7-day token expiry
- Role-based access control middleware (`user`, `artist`, `admin`)
- Password hashing with bcrypt
- Helmet, CORS, and rate limiting (global + auth-specific) for hardened security

### 🖼️ Artwork Management
- Full CRUD on artworks, scoped to the owning artist
- Server-side search, category & price filtering, sorting, and pagination
- Featured artworks and top-artists aggregation endpoints

### 💳 Payments (Stripe)
- Checkout sessions for one-time artwork purchases and recurring subscriptions
- Verified Stripe webhook (`checkout.session.completed`) with raw-body signature validation
- Subscription tier enforcement (Free: 3, Pro: 9, Premium: unlimited purchases)
- Automatic artwork "sold" status and purchase-count tracking on successful payment

### 💬 Engagement
- Purchase-gated comment system — only buyers can comment, with edit/delete for owners
- Wishlist endpoints — add, remove, and list saved artworks per user
- Dummy email notification service — simulated purchase/subscription confirmation emails logged to the console

### 📊 Admin & Analytics
- User management with role updates
- Platform-wide transaction history
- Aggregated analytics: total users, artists, artworks sold, revenue, monthly sales, sales by category

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Runtime | [Node.js](https://nodejs.org/) |
| Framework | [Express 5](https://expressjs.com/) |
| Database | [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/) |
| Auth | [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken), [bcryptjs](https://www.npmjs.com/package/bcryptjs) |
| Payments | [Stripe](https://stripe.com/) |
| Security | [helmet](https://www.npmjs.com/package/helmet), [cors](https://www.npmjs.com/package/cors), [express-rate-limit](https://www.npmjs.com/package/express-rate-limit), [cookie-parser](https://www.npmjs.com/package/cookie-parser) |
| Email (dummy) | [nodemailer](https://www.npmjs.com/package/nodemailer) (console-simulated) |
| Dev Tooling | [nodemon](https://www.npmjs.com/package/nodemon) |
| Deployment | [Vercel](https://vercel.com/) (serverless functions) |

---

## 📁 Project Structure

```
arthub-server/
├── api/
│   └── index.js              # Vercel serverless entry point
├── src/
│   ├── config/                # Database connection
│   ├── middleware/            # Auth, role authorization, rate limiting, error handling
│   ├── models/                # User, Artwork, Transaction, Comment (Mongoose schemas)
│   ├── routes/
│   │   ├── auth.js            # Register, login, Google login, profile, password
│   │   ├── artworks.js        # CRUD, search/filter, featured, top-artists, by-artist
│   │   ├── transactions.js    # Stripe checkout, webhook, history, analytics
│   │   ├── comments.js        # Purchase-gated comment CRUD
│   │   ├── users.js           # Admin user/role management
│   │   └── wishlist.js        # Wishlist CRUD
│   └── utils/
│       └── emailService.js    # Dummy email notification logger
├── index.js                   # Local dev entry point
└── vercel.json                # Vercel build/route config
```

---

## 🔧 Environment Variables

Create a `.env` file in the root:

```env
PORT=5000
MONGODB_URI=
JWT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
CLIENT_URL=
NODE_ENV=production
```

---

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/Farhadmu/Arthub-server.git
cd Arthub-server

# Install dependencies
npm install

# Run the development server
npm run dev
```

The API runs on `http://localhost:5000` by default. All routes are prefixed with `/api`.

---

## 🔌 API Routes

| Route Prefix | Description |
|---|---|
| `POST /api/auth/register` | Register a new user (User or Artist role) |
| `POST /api/auth/login` | Email/password login |
| `POST /api/auth/google` | Google OAuth login |
| `PUT /api/auth/profile` | Update profile (name, avatar) |
| `PUT /api/auth/change-password` | Change password |
| `GET /api/artworks` | Browse with search/filter/sort/pagination |
| `GET /api/artworks/:id` | Get a single artwork |
| `POST /api/artworks` | Create artwork *(artist only)* |
| `PUT /api/artworks/:id` | Update own artwork *(artist only)* |
| `DELETE /api/artworks/:id` | Delete artwork *(artist/admin)* |
| `GET /api/artworks/artist/:artistId` | Public artworks by a specific artist |
| `POST /api/transactions/create-purchase-session` | Start Stripe checkout for a purchase |
| `POST /api/transactions/create-subscription-session` | Start Stripe checkout for a subscription |
| `POST /api/transactions/webhook` | Stripe webhook (signature-verified) |
| `GET /api/transactions/user/purchases` | User's purchase history |
| `GET /api/transactions/artist/sales` | Artist's sales history |
| `GET /api/transactions/all` | All transactions *(admin only)* |
| `GET /api/transactions/analytics` | Platform analytics *(admin only)* |
| `GET /api/comments/artwork/:id` | Get comments for an artwork |
| `POST /api/comments/artwork/:id` | Add a comment *(purchasers only)* |
| `PUT /api/comments/:id` | Edit own comment |
| `DELETE /api/comments/:id` | Delete own comment |
| `GET /api/users` | List all users *(admin only)* |
| `PUT /api/users/:id/role` | Change a user's role *(admin only)* |
| `GET /api/wishlist` | Get current user's wishlist |
| `POST /api/wishlist/:artworkId` | Add artwork to wishlist |
| `DELETE /api/wishlist/:artworkId` | Remove artwork from wishlist |

---

## 🔗 Links

- **Live API:** [arthub-server-two.vercel.app](https://arthub-server-two.vercel.app)
- **Live Site:** [arthub-client-olive.vercel.app](https://arthub-client-olive.vercel.app)
- **Frontend Repo:** [github.com/Farhadmu/Arthub-client](https://github.com/Farhadmu/Arthub-client)
- **Backend Repo:** [github.com/Farhadmu/Arthub-server](https://github.com/Farhadmu/Arthub-server)

---

<div align="center">

Built with ❤️ for art lovers and creators everywhere.

</div>
