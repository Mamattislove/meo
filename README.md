# OBO

MERN starter: Express + MongoDB (Mongoose) API with cookie-based JWT auth, and a Vite + React 19 + Tailwind v4 client.

## Folder structure

```
.
├── server.js                  # Express app: middleware, routes, static client, Mongo connect
├── .env.example               # Copy to .env (new-project.ps1 does this for you)
├── start-app.cmd              # Double-click to run `npm run dev`
├── controllers/               # Route handlers (business logic)
├── errors/                    # Custom error classes -> HTTP status codes
├── middlewares/
│   ├── authMiddleware.js      # authenticateUser, authorizePermission(...roles)
│   ├── errorHandlerMiddleware.js
│   ├── validationMiddleware.js# withValidationErrors, validateIdParam, auth validators
│   └── modelMiddlewares/      # Per-resource validators + loaders
├── models/                    # Mongoose schemas
├── routers/                   # Express routers, mounted in server.js
├── utils/                     # constants, JWT + password helpers
├── seeders/                   # seedAdmin.js and other data seeders
├── scripts/                   # One-off maintenance scripts
├── uploads/                   # Local file uploads (git-ignored)
└── client/
    ├── vite.config.js         # Proxies /api -> http://localhost:5100
    ├── utils/customFetch.js   # axios instance, baseURL /api/v1
    └── src/
        ├── App.jsx            # Router: public routes + /dashboard (protected)
        ├── components/
        │   ├── index.jsx      # Barrel export
        │   ├── common/        # InputField, Masthead, Ledger, RecordPicker, ...
        │   └── wrappers/      # FormBox, ...
        ├── constants/         # navigation.js (tabs), registers.jsx (each register's columns and form sections)
        ├── pages/             # One file per route (loader/action exported)
        └── assets/
```

## Getting started

```bash
npm install
cd client && npm install && cd ..
cp .env.example .env        # then edit MONGO_URL and JWT_SECRET
npm run seed:admin          # creates the first admin from SEED_ADMIN_* in .env
npm run dev                 # API on :5100, client on :5173
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Server (nodemon) + client (Vite) together |
| `npm run server` / `npm run client` | Run one side only |
| `npm run seed:admin` | Create the first admin user |
| `npm run build` | Install everything and build the client to `client/dist` |
| `npm start` | Production: serves the API and the built client |

## API

| Method | Path | Access |
| --- | --- | --- |
| POST | `/api/v1/auth/login` | public (rate limited) |
| GET | `/api/v1/auth/logout` | public |
| POST | `/api/v1/auth/register` | admin |
| GET | `/api/v1/users/current-user` | logged in |
| GET | `/api/v1/users` | admin |
| GET, PATCH, DELETE | `/api/v1/users/:userId` | admin |
| GET, POST | `/api/v1/businesses` | logged in |
| GET, PATCH | `/api/v1/businesses/:businessId` | logged in |
| DELETE | `/api/v1/businesses/:businessId` | admin |
| GET, POST | `/api/v1/annual-inspections` | logged in |
| GET | `/api/v1/annual-inspections/applications`, `/logbook` | logged in |
| PATCH | `/api/v1/annual-inspections/:annualInspectionId/hold`, `/resume` | logged in |
| GET, PATCH | `/api/v1/annual-inspections/:annualInspectionId` | logged in |
| DELETE | `/api/v1/annual-inspections/:annualInspectionId` | admin |
| GET, POST | `/api/v1/building-permits` | logged in |
| GET, PATCH | `/api/v1/building-permits/:buildingPermitId` | logged in |
| DELETE | `/api/v1/building-permits/:buildingPermitId` | admin |
| GET, POST | `/api/v1/electrical-permits` | logged in |
| GET, PATCH | `/api/v1/electrical-permits/:electricalPermitId` | logged in |
| DELETE | `/api/v1/electrical-permits/:electricalPermitId` | admin |
| GET, POST | `/api/v1/inspections` | logged in |
| GET, PATCH | `/api/v1/inspections/:inspectionId` | logged in |
| DELETE | `/api/v1/inspections/:inspectionId` | admin |
| GET, POST | `/api/v1/assessments` | logged in |
| GET, PATCH | `/api/v1/assessments/:assessmentId` | logged in |
| DELETE | `/api/v1/assessments/:assessmentId` | admin |
| PATCH | `/api/v1/inspections/:inspectionId/link` | logged in |
| PATCH | `/api/v1/inspections/:inspectionId/cancel` | admin |
| GET | `/api/v1/assessments/compute-fees` | logged in |
| PATCH | `/api/v1/assessments/:assessmentId/pay` | logged in |
| PATCH | `/api/v1/assessments/:assessmentId/cancel` | logged in (paid: admin) |
| GET, POST | `/api/v1/items` | logged in |
| GET, PATCH | `/api/v1/items/:itemId` | logged in |
| DELETE | `/api/v1/items/:itemId` | admin |

List routes take `page`, `limit` (up to 100), `search`, and exact-match filters such as `barangay` or `status`.

## Adding a new resource

`Item` is the worked example. For a new resource (e.g. `Product`):

1. `models/Product.js` - schema
2. `middlewares/modelMiddlewares/productValidations.js` - input validators + `loadProduct`
3. `controllers/productController.js` - handlers
4. `routers/productRouter.js` - routes
5. `server.js` - `app.use("/api/v1/products", authenticateUser, productRouter);`
6. `client/src/pages/Products.jsx` - page with `loader`/`action`
7. `client/src/App.jsx` - add the route; `client/src/constants/navigation.js` - add the sidebar link
