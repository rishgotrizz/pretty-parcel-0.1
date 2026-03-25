# The Pretty Parcel

Production-ready full-stack e-commerce website for a handmade Instagram-based brand built with Next.js, Tailwind CSS, MongoDB, Mongoose, JWT auth, Razorpay test payments, analytics, recommendations, and an admin dashboard.

## Features

- Elegant responsive storefront with a soft pink premium aesthetic
- Homepage, category browsing, product detail pages, wishlist, and persistent cart
- JWT email/password authentication with admin role support
- MongoDB-backed products, users, carts, orders, coupons, and analytics events
- Coupon validation, flash sale pricing, and best-discount auto-apply logic
- Razorpay test-mode checkout flow with secure server-side verification
- Order tracking and invoice-style confirmation page
- Admin dashboard for products, inventory, orders, coupons, revenue, and drop-off analytics
- Smart search suggestions, rule-based chatbot, activity tracking, and personalized recommendations

## Tech Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- MongoDB + Mongoose
- JWT auth via `jose`
- Razorpay
- Recharts

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file and update secrets:

```bash
cp .env.example .env.local
```

3. Start MongoDB locally or use MongoDB Atlas.

Example using a local MongoDB instance:

```bash
mongod --dbpath /tmp/mongodb-pretty-parcel
```

Example Atlas connection string:

```bash
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=pretty-parcel
MONGODB_DB_NAME=pretty-parcel
```

4. Seed products, coupons, and the admin account:

```bash
npm run seed
```

5. Start the website:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Local Verification Flow

1. Start MongoDB.
2. Seed the database:

```bash
npm run seed
```

3. Start the app:

```bash
npm run dev
```

4. In another terminal, run the smoke test:

```bash
BASE_URL=http://127.0.0.1:3000 npm run smoke
```

The smoke test verifies:

- health check and database connectivity
- admin login
- admin product create, update, and delete
- customer signup and login
- cart add/update flows
- checkout flow
- payment verification and order creation

## Default Admin Credentials

- Email: value of `ADMIN_EMAIL`
- Password: value of `ADMIN_PASSWORD`

## Important Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: secret used to sign auth cookies
- `NEXT_PUBLIC_APP_URL`: base app URL
- `MONGODB_DB_NAME`: MongoDB database name
- `ENABLE_MOCK_PAYMENTS`: set to `true` for local/mock payment testing without live Razorpay secrets
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Razorpay public key for the checkout modal
- `RAZORPAY_KEY_ID`: Razorpay server key id
- `RAZORPAY_KEY_SECRET`: Razorpay server key secret
- `ADMIN_EMAIL`: seeded admin login email
- `ADMIN_PASSWORD`: seeded admin login password

## Project Structure

```text
app/
  api/                API routes for auth, cart, checkout, admin, analytics
  admin/              Admin dashboard page
  products/           Catalog and product detail pages
  cart/ checkout/     Commerce flow pages
  orders/ account/    Customer account and tracking pages
components/
  admin/ auth/ cart/ chatbot/ home/ layout/ products/ providers/ shared/
lib/
  models/             Mongoose schemas
  server/             DB, auth, pricing, analytics, recommendations, storefront helpers
public/               Branded placeholder artwork
scripts/seed.ts       Mongo seed script
types/                Shared TypeScript types
```

## Notes

- Google OAuth is optional and not enabled by default in this implementation.
- If Razorpay keys are not configured locally, checkout falls back to a safe mock verification path for preview purposes.
- Set `ENABLE_MOCK_PAYMENTS=false` in production so missing Razorpay keys fail fast instead of silently using mock payments.
- Seed the database before testing cart, wishlist, or checkout interactions so product documents exist in MongoDB.
