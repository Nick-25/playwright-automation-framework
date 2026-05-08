import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createServer } from 'node:http';

const port = Number(process.env.PORT ?? 3000);
const appRoot = join(process.cwd(), 'app');

const users = [
  {
    id: 'ada',
    email: 'ada@example.com',
    password: 'lovelace-123',
    name: 'Ada Lovelace',
    role: 'Automation Engineer',
    team: 'Quality Platform',
  },
  {
    id: 'grace',
    email: 'grace@example.com',
    password: 'hopper-123',
    name: 'Grace Hopper',
    role: 'Test Architect',
    team: 'Developer Experience',
  },
  {
    id: 'nick',
    email: 'nick@example.com',
    password: 'nick-123',
    name: 'Nick Boegel',
    role: 'Super User',
    team: 'Analytics',
  }
];

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', chunk => {
      body += chunk;

      if (body.length > 10_000) {
        request.destroy();
        reject(new Error('Request body is too large'));
      }
    });
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Request body must be valid JSON'));
      }
    });
    request.on('error', reject);
  });
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    team: user.team,
  };
}

function userFromToken(request) {
  const authorization = request.headers.authorization ?? '';
  const token = authorization.replace(/^Bearer\s+/i, '');
  const [, userId] = token.match(/^session-(.+)$/) ?? [];

  return users.find(user => user.id === userId);
}

function resolveFilePath(pathname) {
  const routes = {
    '/': 'index.html',
    '/todos': 'todos.html',
    '/sign-in': 'sign-in.html',
    '/profile': 'profile.html',
  };

  const routeFile = routes[pathname] ?? pathname.replace(/^\//, '');
  const normalizedPath = normalize(routeFile);

  if (normalizedPath.startsWith('..')) {
    return null;
  }

  return join(appRoot, normalizedPath);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);

  if (url.pathname === '/api/users') {
    sendJson(
      response,
      200,
      users.map(user => ({
        email: user.email,
        name: user.name,
        role: user.role,
        team: user.team,
      })),
    );
    return;
  }

  if (url.pathname === '/api/login') {
    if (request.method !== 'POST') {
      sendJson(response, 405, { message: 'Method not allowed' });
      return;
    }

    try {
      const credentials = await readJson(request);
      const email = String(credentials.email ?? '').trim().toLowerCase();
      const password = String(credentials.password ?? '');
      const user = users.find(candidate => candidate.email === email && candidate.password === password);

      if (!user) {
        sendJson(response, 401, { message: 'Email or password is incorrect.' });
        return;
      }

      sendJson(response, 200, {
        token: `session-${user.id}`,
        user: publicUser(user),
      });
    } catch (error) {
      sendJson(response, 400, { message: error.message });
    }
    return;
  }

  if (url.pathname === '/api/profile') {
    const user = userFromToken(request);

    if (!user) {
      sendJson(response, 401, { message: 'Please sign in to load your profile.' });
      return;
    }

    sendJson(response, 200, publicUser(user));
    return;
  }

  const filePath = resolveFilePath(url.pathname);

  if (!filePath) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const file = await stat(filePath);

    if (!file.isFile()) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }

    response.writeHead(200, {
      'content-type': contentTypes[extname(filePath)] ?? 'application/octet-stream',
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Sample app running at http://127.0.0.1:${port}`);
});
