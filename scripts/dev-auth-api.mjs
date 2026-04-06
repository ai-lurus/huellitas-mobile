/**
 * API mínima para desarrollo local (sin dependencias extra).
 * Expone rutas como Better Auth: POST /api/auth/sign-up/email, POST /api/auth/sign-in/email
 * (y las legadas /auth/sign-up, /auth/sign-in), más PATCH /users/me
 *
 * Uso: en una terminal `npm run dev:api` y deja `EXPO_PUBLIC_API_URL=http://localhost:3000` en .env
 */
import http from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.PORT ?? 3000, 10);

/** @type {Map<string, { id: string; name: string; email: string; password: string; image?: string | null }>} */
const byEmail = new Map();
/** @type {Map<string, typeof byEmail extends Map<string, infer V> ? V : never>} */
const byId = new Map();

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
}

function json(res, status, body) {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 2_000_000) {
        reject(new Error('body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function getBearer(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return null;
  return h.slice(7);
}

function userFromToken(token) {
  if (!token || !token.startsWith('dev_')) return null;
  const id = token.slice(4);
  return byId.get(id) ?? null;
}

function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    ...(u.image != null && u.image !== '' ? { image: u.image } : {}),
  };
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    cors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url?.split('?')[0] ?? '';

  try {
    if (
      req.method === 'POST' &&
      (url === '/auth/sign-up' || url === '/api/auth/sign-up/email')
    ) {
      const raw = await readBody(req);
      const body = raw ? JSON.parse(raw) : {};
      const { name, email, password } = body;
      if (!email || !password) {
        json(res, 400, { message: 'Correo y contraseña son obligatorios' });
        return;
      }
      if (byEmail.has(String(email).toLowerCase())) {
        json(res, 409, { message: 'Correo ya registrado' });
        return;
      }
      const id = randomUUID();
      const record = {
        id,
        name: String(name || 'Usuario'),
        email: String(email).toLowerCase(),
        password: String(password),
      };
      byEmail.set(record.email, record);
      byId.set(id, record);
      json(res, 200, {
        token: `dev_${id}`,
        user: publicUser(record),
        isFirstLogin: true,
      });
      return;
    }

    if (
      req.method === 'POST' &&
      (url === '/auth/sign-in' || url === '/api/auth/sign-in/email')
    ) {
      const raw = await readBody(req);
      const body = raw ? JSON.parse(raw) : {};
      const { email, password } = body;
      const u = byEmail.get(String(email || '').toLowerCase());
      if (!u || u.password !== String(password)) {
        json(res, 401, { message: 'Invalid credentials' });
        return;
      }
      json(res, 200, {
        token: `dev_${u.id}`,
        user: publicUser(u),
        isFirstLogin: false,
      });
      return;
    }

    if (req.method === 'PATCH' && url === '/users/me') {
      const token = getBearer(req);
      const u = userFromToken(token);
      if (!u) {
        json(res, 401, { message: 'No autorizado' });
        return;
      }
      const ct = (req.headers['content-type'] || '').toLowerCase();
      if (ct.includes('application/json')) {
        const raw = await readBody(req);
        const body = raw ? JSON.parse(raw) : {};
        if (typeof body.name === 'string') u.name = body.name;
        if ('image' in body) u.image = body.image === null ? null : String(body.image);
      } else {
        await readBody(req);
      }
      json(res, 200, publicUser(u));
      return;
    }

    json(res, 404, { message: 'Not found' });
  } catch {
    json(res, 400, { message: 'Solicitud inválida' });
  }
});

server.listen(PORT, () => {
  console.log(
    `[dev-auth-api] http://localhost:${PORT}  (/api/auth/sign-up/email, /api/auth/sign-in/email, PATCH /users/me)`,
  );
});
