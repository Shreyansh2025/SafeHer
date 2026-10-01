# SafeHer – Team Notes (read this before you write code)

## 1. Run the backend
```
cd backend
cp .env.example .env      # then fill in your MySQL details + two secrets
npm install
npm run dev               # or: npm start
```
Create an empty MySQL database with the same name as `DB_NAME`. Tables are created automatically on start.
Each person uses their **own local database**. Do not share one.

Check that everything works (server must be running in another terminal):
```
npm run smoke
```
It walks through register → login → contacts → SOS → notifications → admin → resolve → socket.io and prints PASS / FAIL / WARN for each step.
For the admin steps, add `ADMIN_EMAIL` and `ADMIN_PASSWORD` (the values hardcoded in `services/adminService.js`) to your `.env`.
Run it after every change you make. If it was green before you started and red after, your change broke something.

## 2. What was merged (so nobody is surprised)
Base = backend from `women_safety_and_emergency_alert.zip` (it had everything: auth, contacts, SOS, notifications, admin).
Nothing in that backend was rewritten. These are the only changes:

| File | Change | Why |
|---|---|---|
| `server.js` | Rebuilt: SafeHer's http + socket.io server, with all route mounts from the other backend (same URL paths) | The other `server.js` used `io` but never created it, so it crashed |
| `routes/emergencyContactRoutes.js` | `":/id"` → `"/:id"` | Express 5 refuses to start with the typo |
| `package.json` | Added `socket.io` and the `dev` script | Needed by the new `server.js` |
| all `.js` files | Windows line endings (CRLF) → LF | One style for everyone |
| new files | `.env.example`, `.gitignore`, `.gitattributes`, this file | Team hygiene |

Everything else (models, services, controllers, other routes) is byte-for-byte the same logic as before.
SafeHer's frontend is **not** in this zip. It stays in `SafeHer.zip` and will be reconnected after the backend is finished.

## 3. Decisions – we pick ONE way and both follow it
| Topic | We use |
|---|---|
| Layers | route → controller (HTTP only, validates input) → service (logic + DB) → model |
| Folder/file names | Models in `PascalCase` (`User.js`). Everything else `camelCase` (`authService.js`). Never two files that differ only by upper/lower case |
| Importing models | Always from `../models/relation`, never from a single model file (relation.js sets up the links between tables) |
| Line endings | LF only (`.gitattributes` enforces it) |
| API response shape (new code) | `{ success, message, data }` |
| Who is the user | Taken from the login token (`req.user.id`), **never** from the request body |
| Admin | Separate token signed with `ADMIN_JWT_SECRET`, separate middleware |
| URL style | lowercase, plural nouns (`/api/contacts`). Old paths stay until we reconnect the frontend |
| Status codes | Always `return res.status(...)` so a response is never sent twice |
| Secrets | Only in `.env` (never committed). Add every new key to `.env.example` |
| Database changes | Only by editing `models/*.js`. Tell the other person before you change a model |

## 4. How to avoid merge conflicts
1. One Git repo. `main` must always start. Nobody commits straight to `main`.
2. Each person works on their own branch (`feature/<name>-<what>`) and merges by pull request.
3. Run `git pull` on `main` before you start work each day, and again before you open a pull request.
4. Split work **by feature**, not by file. One person owns a feature's route + controller + service (+ model).
5. Adding a feature = new files + one new line in `server.js`. Do not edit the other person's files without telling them.
6. "Hot files" that both of you will touch: `server.js`, `models/relation.js`, `package.json`, `.env.example`.
   Only add lines. Never reformat or reorder them. Keep those commits tiny and push them quickly.
7. Never run "format entire file/project". It changes every line and creates conflicts.
8. Installing a package: run `npm install <pkg>`, commit `package.json` and `package-lock.json` together, and tell the other person to run `npm install`.
9. Before changing what an endpoint accepts or returns, update the endpoint table in section 7 and tell the other person.

## 5. Known issues (deliberately NOT fixed in this merge)
- **Nothing is protected yet.** `middleware/authMiddleware.js` exists but is not used on any route. Anyone can call any endpoint.
- Contact list (`GET /api/emergency-Contact`) returns every user's contacts, and `userId` is read from the body.
- Admin login needs `ADMIN_JWT_SECRET` in `.env`, otherwise it always fails.
- `adminService.js` has a hardcoded admin email/password and ignores the `Admin` table.
- `config/database.js` has a hardcoded fallback DB password. Remove the fallback.
- Register accepts `role` from the client (anyone could register as ADMIN).
- `emergencyController.resolve` is missing `return` after the 404 (sends a second response and errors).
- Notifications stay `PENDING` forever. Nothing sends SMS/push yet.
- Socket.IO sends every user's live location to every connected client, with no login check.
- `notificationController`: `order` is inside `include`, where it does nothing.
- No CORS yet (needed the moment the browser frontend connects).

## 6. Frontend reconnect checklist (later)
The frontend (in `SafeHer.zip`) was built against different URLs and response shapes. When we reconnect it:

| Frontend calls | Backend has now | Do |
|---|---|---|
| `POST /api/auth/register`, `/api/auth/login` | `/api/register`, `/api/login` | Change one side |
| `GET/PUT /api/users/me` | missing | Add |
| `/api/contacts` (CRUD) | `/api/emergency-Contact`, needs `userId` in body | Rename + take user from token |
| `POST /api/emergency/trigger {lat,lng}` | needs `{userId, latitude, longitude}` | Accept `lat/lng`, user from token |
| `GET /api/emergency/active` | missing | Add |
| `GET /api/emergency/history` | missing | Add |
| `GET /api/emergency/:id/notifications` | missing (`/api/notifications/:contactId` is per contact) | Add |
| `GET /api/admin/emergencies/active` | `/api/admin/allactive/emergency` | Rename |
| Pages read `lat`, `lng`, `user`, `contact` | API returns `latitude`, `longitude`, `User`, `EmergencyContact` (decimals come back as strings) | Map names + `Number()` in the frontend `src/api` layer |
| Responses read as bare arrays / `.token` | API wraps in `{ success, message, data }` | Unwrap `data` in the frontend `src/api` layer |

## 7. Current endpoints (keep this table up to date)
No route requires login yet.

| Method + path | Body / query |
|---|---|
| `POST /api/register` | `name, email, phone, password, role` |
| `POST /api/login` | `email, password` |
| `POST /api/emergency-Contact` | `userId, name, phone, relation` |
| `GET /api/emergency-Contact` | – |
| `GET /api/emergency-Contact/:id` | – |
| `PUT /api/emergency-Contact/:id` | `name, phone, relation` |
| `DELETE /api/emergency-Contact/:id` | – |
| `POST /api/emergency/trigger` | `userId, latitude, longitude` |
| `PUT /api/emergency/:id/resolve` | – |
| `GET /api/notifications/:contactId` | – |
| `POST /api/admin/login` | `email, password` |
| `GET /api/admin/allactive/emergency` | – |
| `GET /api/admin/emergencies` | optional `?status=ACTIVE\|RESOLVED&userId=` |
| `GET /api/admin/users` | – |
| Socket.IO | client sends `sendLocation {userId, latitude, longitude}`; every client receives `receiveLocation` |
