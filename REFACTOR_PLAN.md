# Style-Decor Backend — Professional Refactor Plan

> **লক্ষ্য:** বর্তমান single-file (`index.js`) backend কে industry-standard **Express + Mongoose + MVC (Layered Architecture)** এ রূপান্তর করা।  
> **স্ট্যাটাস:** Planning Document — Implementation এখনো শুরু হয়নি  
> **তারিখ:** জুন ২০২৬

---

## সূচিপত্র

1. [বর্তমান অবস্থা](#১-বর্তমান-অবস্থা)
2. [লক্ষ্য Architecture](#২-লক্ষ্য-architecture)
3. [Folder Structure](#৩-proposed-folder-structure)
4. [Mongoose Models](#৪-mongoose-models-schema-design)
5. [API Design](#৫-api-design)
6. [Tech Stack](#৬-tech-stack-additions)
7. [Security Fixes](#৭-security--quality-fixes)
8. [Phase-Wise Plan](#৮-phase-wise-migration-plan)
9. [Timeline](#৯-phase-timeline-summary)
10. [Vercel Deployment](#১০-vercel-deployment)
11. [Migration Strategy](#১১-migration-strategy-frontend-safe)
12. [Future Enhancements](#১২-future-enhancements-backlog)

---

## ১. বর্তমান অবস্থা

### যা আছে এখন

| বিষয় | বর্ণনা |
|-------|--------|
| **ফাইল** | একটাই ফাইল — `index.js` (~405 lines) |
| **Database** | Native `mongodb` driver (`MongoClient`, `ObjectId`) |
| **Structure** | Routes, middleware, DB logic, Stripe — সব একসাথে |
| **Auth** | Firebase JWT (`verifyJWT`) inline |
| **Roles** | `admin`, `seller`, `customer` — inline middleware |
| **Collections** | `services`, `orders`, `users`, `decoratorRequests` |
| **Payment** | Stripe checkout + payment success |
| **Deploy** | Vercel serverless (`module.exports = app`) |

### মূল সমস্যা

- এক ফাইলে সব কিছু — maintain করা কঠিন
- Test করা যায় না (unit/integration)
- নতুন feature যোগ করা risky
- DB connection `run()` function এর ভিতরে — anti-pattern
- Response format inconsistent
- কিছু route-এ authentication missing (security risk)
- Production-এ sensitive data `console.log` করা হচ্ছে

---

## ২. লক্ষ্য Architecture

### Request Flow

```
Client Request
    ↓
Route (URL + HTTP method)
    ↓
Middleware (Auth, Role, Validation)
    ↓
Controller (req/res handle)
    ↓
Service (Business Logic)
    ↓
Mongoose Model (Schema + DB)
    ↓
MongoDB
    ↓
Standard JSON Response
    ↓
Global Error Handler (যদি error হয়)
```

### Layer দায়িত্ব

| Layer | দায়িত্ব |
|-------|----------|
| **Routes** | URL + HTTP method map করা |
| **Middleware** | Auth, role check, input validation |
| **Controller** | Request/Response handle, status code — business logic না |
| **Service** | Business rules (payment, order create, role update) |
| **Model (Mongoose)** | Schema, validation, indexes, DB operations |
| **Config** | Environment, DB, Firebase, Stripe — এক জায়গায় |

> **নোট:** Mongoose থাকলে আলাদা Repository layer optional। এই project-এর জন্য **Controller → Service → Model** যথেষ্ট professional।

---

## ৩. Proposed Folder Structure

```
backend/
├── src/
│   ├── index.js                 # Vercel entry (exports app)
│   ├── server.js                # Local dev: listen()
│   ├── app.js                   # Express setup, middleware, routes
│   │
│   ├── config/
│   │   ├── env.js               # env validation (required vars check)
│   │   ├── database.js          # mongoose.connect()
│   │   ├── firebase.js          # Firebase Admin init
│   │   └── stripe.js            # Stripe client
│   │
│   ├── constants/
│   │   ├── roles.js             # CUSTOMER, SELLER, ADMIN
│   │   ├── orderStatus.js       # pending, processing, delivered...
│   │   └── httpStatus.js        # 200, 201, 400, 401, 403, 404, 500
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js       # verifyJWT (Firebase)
│   │   ├── role.middleware.js       # verifyAdmin, verifySeller
│   │   ├── validate.middleware.js   # Zod/Joi validation
│   │   ├── error.middleware.js      # global error handler
│   │   └── notFound.middleware.js   # 404 handler
│   │
│   ├── models/                  # Mongoose schemas
│   │   ├── User.model.js
│   │   ├── Service.model.js
│   │   ├── Order.model.js
│   │   └── DecoratorRequest.model.js
│   │
│   ├── routes/
│   │   ├── index.js             # সব route mount
│   │   ├── service.routes.js
│   │   ├── order.routes.js
│   │   ├── payment.routes.js
│   │   ├── user.routes.js
│   │   └── decorator.routes.js
│   │
│   ├── controllers/
│   │   ├── service.controller.js
│   │   ├── order.controller.js
│   │   ├── payment.controller.js
│   │   ├── user.controller.js
│   │   └── decorator.controller.js
│   │
│   ├── services/
│   │   ├── service.service.js
│   │   ├── order.service.js
│   │   ├── payment.service.js
│   │   ├── user.service.js
│   │   └── decorator.service.js
│   │
│   ├── validators/              # Request body/param schemas
│   │   ├── service.validator.js
│   │   ├── order.validator.js
│   │   ├── payment.validator.js
│   │   └── user.validator.js
│   │
│   └── utils/
│       ├── ApiError.js          # custom error class
│       ├── catchAsync.js        # async wrapper
│       └── sendResponse.js      # uniform response helper
│
├── tests/                       # Phase 9 (optional)
│   ├── integration/
│   └── unit/
│
├── .env
├── .env.example                 # secrets ছাড়া template
├── .gitignore
├── package.json
├── vercel.json
└── REFACTOR_PLAN.md             # এই ফাইল
```

---

## ৪. Mongoose Models (Schema Design)

### User Model

```js
{
  email:    String, unique, required, lowercase
  name:     String
  image:    String (photoURL)
  role:     enum ['customer', 'seller', 'admin'], default 'customer'
  createdAt, lastLoggedIn (timestamps)
}
```

### Service Model

```js
{
  name:        String, required
  description: String
  category:    String
  image:       String
  price:       Number, min 0
  quantity:    Number, min 0
  seller:      { name: String, email: String }
  timestamps:  true
}
```

### Order Model

```js
{
  serviceId:     ObjectId (ref: Service)
  transactionId: String, unique, sparse (Stripe payment_intent)
  customer:      String (email)
  seller:        { name: String, email: String }
  name:          String
  category:      String
  image:         String
  quantity:      Number
  price:         Number
  status:        enum ['pending', 'processing', 'delivered', 'cancelled']
  timestamps:    true
}
```

### DecoratorRequest Model

```js
{
  email:     String, unique, required
  status:    enum ['pending', 'approved', 'rejected'], default 'pending'
  createdAt: Date
}
```

### Mongoose এর সুবিধা

- **Schema validation** — price negative হবে না, required field check
- **timestamps: true** — manual `created_at` লেখার দরকার নেই
- **Indexes** — `email`, `transactionId` দিয়ে fast query
- **Population** — `order.serviceId` থেকে full service data আনা যায়
- **Middleware hooks** — pre-save, post-save logic

---

## ৫. API Design

### Base Path (ভবিষ্যতে)

```
/api/v1/...
```

> **নোট:** Refactor এর সময় বর্তমান URLs (`/services`, `/my-orders`) same রাখা হবে যাতে frontend break না হয়।

### Uniform Response Format

**Success:**
```json
{
  "success": true,
  "message": "Service created successfully",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Unauthorized access",
  "errors": [ ... ]
}
```

### Endpoint → Module Map

| Endpoint | Module | Auth | নোট |
|----------|--------|------|------|
| `GET /` | app.js | Public | Health check |
| `POST /services` | Service | JWT + Seller | |
| `GET /services` | Service | Public | |
| `GET /services/:id` | Service | Public | |
| `PATCH /services/:id` | Service | JWT + Seller | Owner verify যোগ করতে হবে |
| `DELETE /services/:id` | Service | JWT + Seller | Owner verify যোগ করতে হবে |
| `GET /my-inventory/:email` | Service | JWT + Seller | Token email ব্যবহার করতে হবে |
| `POST /create-checkout-session` | Payment | Public | |
| `POST /payment-success` | Payment | Public | Idempotent রাখতে হবে |
| `GET /my-orders` | Order | JWT | |
| `GET /manage-orders/:email` | Order | JWT + Seller | URL email → token email |
| `PATCH /orders/status/:id` | Order | JWT + Seller/Admin | **এখন auth নেই — fix করতে হবে** |
| `DELETE /orders/:id` | Order | JWT + Admin | **এখন auth নেই — fix করতে হবে** |
| `POST /user` | User | Public | Register/login sync |
| `GET /user/role` | User | JWT | |
| `GET /users` | User | JWT + Admin | |
| `PATCH /update-role` | User | JWT + Admin | |
| `POST /become-decorator` | Decorator | JWT | |
| `GET /decorator-requests` | Decorator | JWT + Admin | |

---

## ৬. Tech Stack Additions

| Package | উদ্দেশ্য | কোন Phase-এ |
|---------|----------|-------------|
| `mongoose` | ODM (native driver replace) | Phase 2 |
| `zod` বা `joi` | Request validation | Phase 7 |
| `helmet` | Security headers | Phase 1 |
| `express-rate-limit` | Brute force protection | Phase 7 |
| `morgan` বা `pino` | HTTP logging | Phase 7 |
| `dotenv` | Already installed | Phase 1 |
| `jest` + `supertest` | Testing | Phase 9 |
| `eslint` + `prettier` | Code quality | Phase 1 |

> `mongodb` package Phase 2-এ remove হবে Mongoose migrate করার পর।

---

## ৭. Security & Quality Fixes

Refactor করার সময় এই issues গুলো ঠিক করতে হবে:

| Issue | বর্তমান | Industry Standard Fix |
|-------|---------|----------------------|
| Token logging | `console.log(token)` | Production-এ remove করতে হবে |
| Order status update | `PATCH /orders/status/:id` — auth নেই | JWT + seller/admin check |
| Order delete | auth নেই | JWT + admin check |
| Email in URL | `/manage-orders/:email` | `req.tokenEmail` ব্যবহার — URL trust করা unsafe |
| Input validation | নেই | Zod schema per route |
| Env validation | নেই | `env.js` — missing var হলে startup-এ crash |
| Response format | mixed | Consistent `{ success, data }` |
| CORS URLs | hardcoded | Environment variable থেকে manage |

---

## ৮. Phase-Wise Migration Plan

---

### Phase 0 — Preparation (১ দিন)

**কাজ:** Plan lock, backup, baseline test

- [x] Current `index.js` backup (`index.legacy.js`)
- [x] সব API endpoint list + Postman/Thunder Client collection তৈরি → `API_CONTRACT.md`
- [x] Frontend `VITE_API_URL` endpoints document করা → `API_CONTRACT.md`
- [x] `.env.example` তৈরি (secrets ছাড়া)
- [x] Git branch তৈরি: `refactor/mvc-mongoose`

**Output:** API contract document — refactor-এ break হবে না verify করার baseline

**Risk:** কম

---

### Phase 1 — Foundation & Project Skeleton (২–৩ দিন)

**কাজ:** Structure তৈরি, business logic move না — শুধু shell

- [x] `src/` folder structure তৈরি
- [x] `config/env.js` — required env vars validate
- [x] `config/firebase.js`, `config/stripe.js` extract
- [x] `app.js` — express, cors, helmet, json parser
- [x] `middleware/auth.middleware.js` — `verifyJWT` move
- [x] `middleware/role.middleware.js` — admin/seller move
- [x] `utils/ApiError.js`, `catchAsync.js`, `sendResponse.js`
- [x] `middleware/error.middleware.js` + `notFound.middleware.js`
- [x] `src/index.js` (Vercel) + `src/server.js` (local skeleton)
- [x] `vercel.json` → `src/index.js` point করা
- [x] `package.json` scripts update
- [x] ESLint + Prettier setup

**Test:** `GET /` health check কাজ করে, app start হয়

**Risk:** কম

---

### Phase 2 — Mongoose Integration (২–৩ দিন)

**কাজ:** Native MongoDB driver → Mongoose

- [ ] `mongoose` install
- [ ] `config/database.js` — `mongoose.connect()` with options
- [ ] ৪টা Model তৈরি: User, Service, Order, DecoratorRequest
- [ ] Existing DB data-র সাথে schema match verify (field names same রাখতে হবে)
- [ ] Indexes add: `User.email`, `Order.transactionId`, `DecoratorRequest.email`
- [ ] Vercel serverless-এ connection reuse pattern implement

**Test:** Models দিয়ে manual read/write — existing data ঠিক আসে কিনা

**Risk:** মাঝারি — field name mismatch হলে data issue হতে পারে

---

### Phase 3 — User & Auth Module (Pilot) (২ দিন)

**কাজ:** প্রথম full MVC module — সবচেয়ে সহজ দিয়ে শুরু

**Move করতে হবে:**
- `POST /user`
- `GET /user/role`
- `GET /users`
- `PATCH /update-role`

**ফাইল:**
```
user.model.js → user.service.js → user.controller.js → user.routes.js
```

**Test:** Login flow, role fetch, admin user list — frontend dashboard test

**কেন আগে:** Auth/role অন্য সব module-এ লাগে; এটা ঠিক হলে বাকি সহজ

**Risk:** কম

---

### Phase 4 — Service Module (২–৩ দিন)

**কাজ:** Inventory management

**Move করতে হবে:**
- `GET /services`, `GET /services/:id`
- `POST /services`
- `PATCH /services/:id`
- `DELETE /services/:id`
- `GET /my-inventory/:email`

**Extra কাজ:**
- Seller শুধু নিজের service edit/delete করতে পারবে (ownership check)
- `my-inventory` — URL email না, token email ব্যবহার

**Test:** Public service list, seller add/edit/delete inventory

**Risk:** কম

---

### Phase 5 — Payment & Order Module (৩–৪ দিন)

**কাজ:** সবচেয়ে critical business logic

**Move করতে হবে:**
- `POST /create-checkout-session`
- `POST /payment-success`
- `GET /my-orders`
- `GET /manage-orders/:email`
- `PATCH /orders/status/:id`
- `DELETE /orders/:id`

**Extra কাজ:**
- Payment success **idempotent** রাখতে হবে (duplicate order create হবে না)
- Order status update — seller ownership verify
- Quantity decrement fail হলে rollback logic

**Test:** Full payment flow — checkout → success → order in DB → seller sees order

**Risk:** **উচ্চ** — Stripe + DB transaction; carefully test করতে হবে

---

### Phase 6 — Decorator Request Module (১ দিন)

**কাজ:** Seller onboarding flow

**Move করতে হবে:**
- `POST /become-decorator`
- `GET /decorator-requests`

**Test:** Customer request → admin sees → role update → request deleted

**Risk:** কম

---

### Phase 7 — Validation, Security & Polish (২–৩ দিন)

**কাজ:** Production-ready quality

- [ ] Zod validators সব POST/PATCH route-এ
- [ ] `helmet`, `express-rate-limit` on auth routes
- [ ] `morgan` logging (dev) / structured log (prod)
- [ ] সব `console.log` sensitive data remove
- [ ] Consistent `sendResponse()` everywhere
- [ ] `GET /health` — DB connection status check
- [ ] Optional: `/api/v1` prefix + backward compatible aliases

**Test:** Invalid body → 400 with clear message; rate limit কাজ করে

**Risk:** মাঝারি

---

### Phase 8 — Cleanup & Legacy Removal (১ দিন)

**কাজ:** পুরনো code সরানো

- [ ] Root `index.js` delete — শুধু `src/index.js` থাকবে
- [ ] Unused `mongodb` package remove
- [ ] README update (setup, env vars, scripts)
- [ ] Final frontend end-to-end test

**Risk:** কম

---

### Phase 9 — Testing (Optional কিন্তু Professional) (৩–৫ দিন)

**কাজ:** Future changes-এ confidence

- [ ] `jest` + `supertest` setup
- [ ] Unit tests: services (mock models)
- [ ] Integration tests: auth, service CRUD, payment flow
- [ ] CI script: `npm test` on push

**Risk:** কম

---

## ৯. Phase Timeline Summary

| Phase | Focus | সময় | Risk |
|-------|-------|------|------|
| **0** | Preparation & backup | ১ দিন | কম |
| **1** | Project skeleton + config | ২–৩ দিন | কম |
| **2** | Mongoose models + DB | ২–৩ দিন | মাঝারি |
| **3** | User module (pilot) | ২ দিন | কম |
| **4** | Service module | ২–৩ দিন | কম |
| **5** | Payment + Order | ৩–৪ দিন | **উচ্চ** |
| **6** | Decorator module | ১ দিন | কম |
| **7** | Validation + security | ২–৩ দিন | মাঝারি |
| **8** | Cleanup legacy | ১ দিন | কম |
| **9** | Tests (optional) | ৩–৫ দিন | কম |

**মোট সময়:** ~২–৩ সপ্তাহ (part-time) | ~১–১.৫ সপ্তাহ (full-time)

---

## ১০. Vercel Deployment

### Entry Point

```
vercel.json → src/index.js
module.exports = app
```

### Mongoose Serverless Pattern

Vercel serverless-এ প্রতিবার cold start-এ নতুন connection খুললে slow হয়। Global cache pattern ব্যবহার করতে হবে:

```js
// config/database.js
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}
// connection reuse logic
```

### Scripts

```json
{
  "main": "src/index.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

---

## ১১. Migration Strategy (Frontend Safe)

### Golden Rule

প্রতিটি phase-এ API response format same রাখতে হবে যতক্ষণ না frontend update করা হয়।

```
Phase 3–6: Same URLs, same response shape
Phase 7:   Optional response wrapper add — frontend gradually update
Phase 10:  /api/v1 prefix — old routes alias রাখা ১–২ sprint
```

### প্রতিটি Phase শেষে Checklist

1. ✅ Local test
2. ✅ Frontend full flow test
3. ✅ Vercel deploy (staging/production)
4. ✅ তারপর next phase শুরু

---

## ১২. Future Enhancements (Backlog)

এগুলো এখন না — পরে implement করা যাবে:

- [ ] Stripe **webhook** (`/webhooks/stripe`) — client-side callback-এর চেয়ে secure
- [ ] Redis caching (popular services list)
- [ ] Pagination (`GET /services?page=1&limit=10`)
- [ ] Search & filter (`category`, `price range`)
- [ ] Soft delete (`isDeleted: true`)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Docker + docker-compose (local dev)
- [ ] Vercel serverless থেকে Railway/Render-এ move (cold start issue হলে)

---

## Environment Variables

`.env.example` (secrets ছাড়া template):

```env
# Database
MONGODB_URI=mongodb+srv://...

# Stripe
STRIPE_SECRET_KEY=sk_test_...

# Firebase (base64 encoded service account JSON)
FB_SERVICE_KEY=

# Frontend URL (CORS + Stripe redirect)
CLIENT_DOMAIN=http://localhost:5173

# Server
PORT=3000
```

---

## Implementation শুরু করার আগে

1. এই document পড়ে নাও
2. Phase 0 checklist complete করো
3. Git branch তৈরি করো: `refactor/mvc-mongoose`
4. Phase 1 দিয়ে শুরু করো

---

*এই document Style-Decor backend refactor project-এর official planning document। Implementation শুরু হলে প্রতিটি phase complete হওয়ার পর checkbox update করা হবে।*
