# InfoTact — Cache-Aside E-Commerce Platform

> A full-stack e-commerce demo built around the **Redis Cache-Aside Pattern**, showing how a single caching strategy can reduce API response times from ~240ms to ~4ms.

![CI](https://github.com/your-username/infotact/actions/workflows/main.yml/badge.svg)

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React 19 + TypeScript + Tailwind v4 |
| State | Zustand |
| Backend | Express + TypeScript + Node 20 |
| Database | MongoDB + Mongoose |
| Cache | Redis (Cache-Aside Pattern) |
| Auth | JWT + bcrypt |
| Search | MongoDB $text index |
| CI/CD | GitHub Actions |
| Container | Docker + docker-compose |

---

## ⚡ The Cache-Aside Pattern

```
GET /api/products
  ├─ Check Redis key "products:page:1:cat:all:sort:createdAt"
  ├─ HIT  → return JSON  (X-Cache: HIT,  ~4ms)
  └─ MISS → query MongoDB → store in Redis (TTL 5min) → return
             (X-Cache: MISS, ~240ms)

PUT /api/products/:id  (admin)
  ├─ Update MongoDB
  └─ DEL products:page:*  ← cache invalidation
     Next GET → X-Cache: MISS again ✓
```

---

## 📦 Project Structure

```
infotact/
├── client/          # Vite + React 19 + Tailwind v4
├── server/          # Express + TypeScript
│   ├── src/
│   │   ├── models/      # Product, User, Cart
│   │   ├── routes/      # auth, products, cart, admin
│   │   ├── services/    # redisService.ts
│   │   ├── middleware/  # auth.ts, responseTime.ts
│   │   └── seed/        # faker.js → 600 products
│   └── Dockerfile
├── docker-compose.yml
└── .github/workflows/main.yml
```

---

## 🛠 Local Setup

### Prerequisites
- Node 20+ (install via `nvm install 20`)
- MongoDB (local or [Atlas free tier](https://mongodb.com/atlas))
- Redis (local or [Upstash free tier](https://upstash.com))

### 1. Clone & install
```bash
git clone https://github.com/your-username/infotact.git
cd infotact

# Server
cd server && npm install

# Client
cd ../client && npm install
```

### 2. Configure server environment
```bash
# server/.env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/infotact
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
```

### 3. Seed the database (600 products + admin user)
```bash
cd server
npm run seed
# Admin credentials: admin@infotact.dev / admin123
```

### 4. Start development servers
```bash
# Terminal 1 — Server
cd server && npm run dev

# Terminal 2 — Client
cd client && npm run dev
```

Visit: http://localhost:5173

---

## 🐳 Docker

```bash
docker-compose up --build
```

Services:
- **MongoDB** → `localhost:27017`
- **Redis** → `localhost:6379`
- **API Server** → `http://localhost:5000`

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@infotact.dev | admin123 |
| User | Register via UI | your choice |

### Discount Codes
| Code | Discount |
|---|---|
| SAVE10 | 10% off |
| WELCOME20 | 20% off |
| FLASH30 | 30% off |

---

## 🧪 Demonstrating Cache Behaviour

1. Open browser DevTools → Network tab
2. `GET /api/products` → observe `X-Cache: MISS`, `X-Response-Time: ~240ms`
3. Refresh → `X-Cache: HIT`, `X-Response-Time: ~4ms`
4. In Admin → edit any product price → Save
5. Next `GET /api/products` → `X-Cache: MISS` again (invalidated!)
6. Admin → Cache tab → live hit rate, active Redis keys

---

## 📊 API Endpoints

### Auth
| Method | Endpoint | Auth |
|---|---|---|
| POST | /api/auth/register | — |
| POST | /api/auth/login | — |
| GET | /api/auth/me | 🔐 |

### Products
| Method | Endpoint | Auth |
|---|---|---|
| GET | /api/products | — |
| GET | /api/products/categories | — |
| GET | /api/products/:id | — |
| POST | /api/products | 🔐 Admin |
| PUT | /api/products/:id | 🔐 Admin |
| DELETE | /api/products/:id | 🔐 Admin |

### Cart
| Method | Endpoint | Auth |
|---|---|---|
| GET | /api/cart | 🔐 |
| POST | /api/cart/add | 🔐 |
| DELETE | /api/cart/item/:id | 🔐 |
| POST | /api/cart/apply-discount | 🔐 |
| DELETE | /api/cart | 🔐 |

### Admin
| Method | Endpoint | Auth |
|---|---|---|
| GET | /api/admin/stats | 🔐 Admin |
| GET | /api/admin/cache-stats | 🔐 Admin |
| GET | /api/admin/users | 🔐 Admin |

---

## 🔄 Git Workflow (Evaluation)

- **Branches**: `feat/week-1-setup`, `feat/week-2-redis`, `feat/week-3-search-cart`, `feat/week-4-admin-cicd`
- **Commits**: `feat: add Redis cache for product API (fixes #4)`
- **PRs**: 1 per week → merge to `main`
- **Issues**: tracked in GitHub Projects Kanban
- **CI**: runs on every push via `.github/workflows/main.yml`
