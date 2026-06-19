# ArtHub - Online Art Marketplace

## Overview
ArtHub is a full-stack web application that connects art lovers, collectors, and buyers with talented artists. The platform allows users to browse, discover, and purchase original artworks. Artists can upload and manage their creations, while an admin oversees the entire system.

## Live Demo
- **Live Site**: [Your Vercel URL]
- **Server**: [Your Server URL]

## Features

### For Buyers (Users)
- Browse and search artworks with advanced filters
- Purchase original artworks via Stripe
- Comment on purchased artworks
- Track purchase history
- Subscription tiers (Free, Pro, Premium)
- Wishlist functionality

### For Artists
- Upload and manage artworks
- Edit and delete own creations
- View sales history and analytics
- Track revenue from artwork sales

### For Admins
- Manage all users and roles
- Oversee all artworks
- View all transactions
- Analytics dashboard with charts
- Revenue tracking

### Technical Features
- JWT authentication with email/password and Google OAuth
- Role-based access control (User, Artist, Admin)
- Stripe payment integration
- Image upload via imgBB API
- Dark mode toggle
- Responsive design for all devices
- Advanced search and filtering
- Pagination
- Real-time comments system
- Skeleton loaders and animations

## Tech Stack

### Frontend
- **Next.js 14** - React framework
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Swiper** - Image carousel
- **React Hot Toast** - Notifications
- **Next Themes** - Dark mode
- **React Icons** - Icon library
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB + Mongoose** - Database
- **JWT** - Authentication
- **Stripe** - Payment processing
- **imgBB API** - Image hosting
- **Bcrypt** - Password hashing
- **CORS** - Cross-origin support
- **Helmet** - Security headers

## Getting Started

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account
- Stripe account (for payments)
- imgBB account (for image uploads)

### Installation

1. **Clone the repositories**
```bash
# Server
git clone [your-server-repo-url]
cd arthub-server

# Client
git clone [your-client-repo-url]
cd arthub-client
```

2. **Install dependencies**
```bash
# Server
npm install

# Client
npm install
```

3. **Set up environment variables**

**Server (.env)**
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

**Client (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_IMGBB_API_KEY=your_imgbb_api_key
```

4. **Seed admin user**
```bash
# In server directory
node seed.js
```

5. **Run the application**
```bash
# Server (terminal 1)
npm run dev

# Client (terminal 2)
npm run dev
```

6. **Open browser**
- Client: http://localhost:3000
- Server: http://localhost:5000

## Default Admin Credentials
- **Email**: admin@arthub.com
- **Password**: Admin@123

## Deployment

### Server (Backend)
1. Push to GitHub
2. Deploy to Render, Railway, or Vercel (serverless)
3. Set environment variables in deployment platform
4. Update `CLIENT_URL` to your live frontend URL

### Client (Frontend)
1. Push to GitHub
2. Deploy to Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL` = your live backend URL
   - `NEXT_PUBLIC_IMGBB_API_KEY` = your imgBB API key
4. Deploy

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/google` - Google OAuth
- `GET /api/auth/me` - Get current user

### Artworks
- `GET /api/artworks` - Get all artworks (with filters)
- `GET /api/artworks/:id` - Get single artwork
- `POST /api/artworks` - Create artwork (artist)
- `PUT /api/artworks/:id` - Update artwork (artist)
- `DELETE /api/artworks/:id` - Delete artwork

### Transactions
- `POST /api/transactions/create-purchase-session` - Purchase artwork
- `POST /api/transactions/create-subscription-session` - Subscribe
- `GET /api/transactions/user/purchases` - User purchase history
- `GET /api/transactions/artist/sales` - Artist sales history
- `GET /api/transactions/analytics` - Admin analytics

### Comments
- `GET /api/comments/artwork/:id` - Get comments
- `POST /api/comments/artwork/:id` - Add comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Users (Admin)
- `GET /api/users` - Get all users
- `PUT /api/users/:id/role` - Update user role

## Subscription Tiers

| Tier | Max Purchases | Price |
|------|--------------|-------|
| Free | 3 paintings | $0 |
| Pro | 9 paintings | $9.99/month |
| Premium | Unlimited | $19.99/month |

## Project Structure

```
arthub-server/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── utils/
├── index.js
├── seed.js
└── package.json

arthub-client/
├── app/
│   ├── artworks/
│   ├── dashboard/
│   ├── login/
│   ├── register/
│   └── page.js
├── components/
├── context/
├── lib/
└── package.json
```

## Key Features Implemented

✅ Role-based authentication (User, Artist, Admin)  
✅ JWT token-based auth with 7-day expiry  
✅ Google OAuth integration  
✅ Stripe payment integration  
✅ Image upload via imgBB  
✅ Advanced search and filtering  
✅ Pagination  
✅ Comment system (purchase required)  
✅ Subscription tiers  
✅ Wishlist functionality  
✅ Dark mode  
✅ Responsive design  
✅ Loading states and skeleton loaders  
✅ Error handling  
✅ Animations with Framer Motion  

## License
MIT License

## Credits
Developed for Programming Hero Course
