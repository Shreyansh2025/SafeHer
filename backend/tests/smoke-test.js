/**
 * SafeHer backend smoke test — walks through the whole app flow in order.
 *
 * 1. Start the server in another terminal:   npm run dev
 * 2. Run this:                               npm run smoke
 *
 * Settings are read from your .env file (same folder as package.json):
 *   PORT            used to build the URL (default 3000)
 *   ADMIN_EMAIL     \ test-only: the admin login hardcoded in services/adminService.js.
 *   ADMIN_PASSWORD  / Without them the admin steps are skipped.
 *
 * Each run creates its own new test user, so it can be run again and again.
 */
require('dotenv').config();
const BASE = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const stat = { pass: 0, fail: 0, warn: 0, skip: 0 };

async function call(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON body */ }
  return { status: res.status, json };
}

// check(): prints one line per step and counts the result
function check(label, ok, detail = '') {
  if (ok) { stat.pass++; console.log(`  ✅ PASS  ${label}`); }
  else    { stat.fail++; console.log(`  ❌ FAIL  ${label}  ${detail}`); }
}
function warn(label) { stat.warn++; console.log(`  ⚠️  WARN  ${label}`); }
function skip(label) { stat.skip++; console.log(`  ⏭️  SKIP  ${label}`); }
const show = (r) => `(got ${r.status}: ${JSON.stringify(r.json)?.slice(0, 140)})`;
const title = (t) => console.log(`\n── ${t} ──`);

(async () => {
  const stamp = Date.now();
  const user = {
    name: 'Smoke Test',
    email: `smoke${stamp}@test.com`,
    phone: `9${String(stamp).slice(-9)}`,
    password: 'Pass@1234',
    role: 'USER',
  };
  let r, token, userId, contactIds = [], emergencyId;

  title('0. Server alive');
  try { r = await call('GET', '/'); } catch (e) {
    console.log(`  ❌ Cannot reach ${BASE}. Is the server running? (${e.cause?.code || e.message})`);
    process.exit(1);
  }
  check('GET /  → 200', r.status === 200, show(r));

  title('1. Auth  (routes/authRoute.js → authController → authservice)');
  r = await call('POST', '/api/register', user);
  check('POST /api/register  → 201 + token', r.status === 201 && !!r.json?.data?.token, show(r));
  userId = r.json?.data?.user?.id;
  r = await call('POST', '/api/register', user);
  check('POST /api/register (same email) → 409 "already exist"',
    r.status === 409 && /already exist/i.test(r.json?.message || ''), show(r));
  r = await call('POST', '/api/login', { email: user.email, password: user.password });
  check('POST /api/login  → 200 + token', r.status === 200 && !!r.json?.data?.token, show(r));
  token = r.json?.data?.token;
  if (!userId || !token) {
    console.log('\n  ⛔ Register/login failed, so the remaining steps cannot run.');
    console.log('     Check: MySQL is running, the database in DB_NAME exists, DB_* and JWT_SECRET are set in .env.');
    process.exit(1);
  }
  r = await call('POST', '/api/login', { email: user.email, password: 'wrong-password' });
  check('POST /api/login (wrong password) → 401', r.status === 401, show(r));

  title('2. Emergency contacts  (/api/emergency-Contact)');
  for (const [name, relation] of [['Mom', 'Family'], ['Best Friend', 'Friend']]) {
    r = await call('POST', '/api/emergency-Contact', {
      name, phone: `8${String(stamp).slice(-8)}${contactIds.length}`, relation,
    }, token);
    check(`POST contact "${name}" → 201`, r.status === 201 && !!r.json?.data?.id, show(r));
    contactIds.push(r.json?.data?.id);
  }
  r = await call('GET', '/api/emergency-Contact', null, token);
  check('GET all contacts → 200 and includes ours',
    r.status === 200 && r.json?.data?.some((c) => c.id === contactIds[0]), show(r));
  r = await call('GET', `/api/emergency-Contact/${contactIds[0]}`, null, token);
  check('GET contact by id → 200', r.status === 200 && r.json?.data?.id === contactIds[0], show(r));
  r = await call('PUT', `/api/emergency-Contact/${contactIds[0]}`, { name: 'Mom (updated)' }, token);
  check('PUT contact → 200 and name changed', r.status === 200 && r.json?.data?.name === 'Mom (updated)', show(r));

  title('3. SOS  (/api/emergency)');
  r = await call('POST', '/api/emergency/trigger', { latitude: 23.17, longitude: 75.79 }, token);
  check('POST /trigger → 201 + emergency id', r.status === 201 && !!r.json?.emergency?.id, show(r));
  emergencyId = r.json?.emergency?.id;
  check('new emergency starts as ACTIVE', r.json?.emergency?.status === 'ACTIVE', show(r));

  title('4. Notifications  (/api/notifications/:contactId)');
  r = await call('GET', `/api/notifications/${contactIds[0]}`, null, token);
  const alerts = r.json?.alerts || [];
  check('one notification row was created for contact 1', r.status === 200 && alerts.length >= 1, show(r));
  check('…linked to the emergency, with its location', alerts[0]?.Emergency?.status === 'ACTIVE', show(r));
  if (alerts[0]?.status === 'PENDING') {
    warn('notification status is PENDING — nothing actually sends SMS/call/push yet (known gap)');
  }

  title('5. Admin  (/api/admin)');
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    skip('admin steps — set ADMIN_EMAIL and ADMIN_PASSWORD in .env');
  } else {
    r = await call('POST', '/api/admin/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    check('POST /admin/login → 200 + token (needs ADMIN_JWT_SECRET in .env)',
      r.status === 200 && !!r.json?.data?.token, show(r));
    const adminToken = r.json?.data?.token;
    if (!adminToken) {
      warn('admin login failed, skipping protected admin routes');
    } else {
      r = await call('GET', '/api/admin/allactive/emergency', null, adminToken);
      check('GET active emergencies → includes ours, with user info',
        r.status === 200 && r.json?.data?.some((e) => e.id === emergencyId && e.User?.id === userId), show(r));
      r = await call('GET', '/api/admin/emergencies?status=ACTIVE', null, adminToken);
      check('GET emergencies?status=ACTIVE → 200', r.status === 200 && r.json?.count >= 1, show(r));
      r = await call('GET', '/api/admin/users', null, adminToken);
      check('GET users → 200, no password field leaked',
        r.status === 200 && r.json?.count >= 1 && !('password' in (r.json?.data?.[0] || {})), show(r));
    }
  }

  title('6. Resolve + delete');
  r = await call('PUT', `/api/emergency/${emergencyId}/resolve`, null, token);
  check('PUT /:id/resolve → 200, status RESOLVED', r.status === 200 && r.json?.emergency?.status === 'RESOLVED', show(r));
  r = await call('PUT', '/api/emergency/99999999/resolve', null, token);
  check('resolve unknown id → 404', r.status === 404, show(r));
  r = await call('DELETE', `/api/emergency-Contact/${contactIds[1]}`, null, token);
  check('DELETE contact → 200', r.status === 200, show(r));
  r = await call('GET', `/api/emergency-Contact/${contactIds[1]}`, null, token);
  check('deleted contact is gone → 404', r.status === 404, show(r));

  title('7. Socket.IO live location');
  let ioClient;
  try { ioClient = require('socket.io-client').io; } catch { /* not installed */ }
  if (!ioClient) {
    skip('socket test — run: npm install  (socket.io-client is a devDependency)');
  } else {
    const got = await new Promise((resolve) => {
      const a = ioClient(BASE), b = ioClient(BASE);
      let ready = 0;
      const timer = setTimeout(() => { a.close(); b.close(); resolve(null); }, 4000);
      b.on('receiveLocation', (d) => { clearTimeout(timer); a.close(); b.close(); resolve(d); });
      const go = () => { if (++ready === 2) a.emit('sendLocation', { userId, latitude: 23.17, longitude: 75.79 }); };
      a.on('connect', go); b.on('connect', go);
    });
    check('client A sends "sendLocation" → client B receives "receiveLocation"', got?.userId === userId);
    warn('server broadcasts every location to ALL connected clients, no login check (known gap)');
  }

  console.log(`\n══ ${stat.pass} passed, ${stat.fail} failed, ${stat.warn} warnings, ${stat.skip} skipped ══`);
  process.exit(stat.fail ? 1 : 0);
})();
