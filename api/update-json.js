const ALLOWED_FILES = new Set([
  'data/news.json',
  'data/photos.json',
  'data/schedule.json',
  'data/weekly-schedule.json'
]);

function sendJSON(response, statusCode, data) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');
  response.end(JSON.stringify(data));
}

function normalizeFilename(filename) {
  const clean = String(filename || '').replace(/^\/+/, '');
  return clean.startsWith('data/') ? clean : `data/${clean}`;
}

async function readRequestBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

async function githubRequest(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.message || `GitHub API error: ${response.status}`);
  }

  return data;
}

module.exports = async function handler(request, response) {
  if (request.method === 'OPTIONS') {
    sendJSON(response, 200, { ok: true });
    return;
  }

  if (request.method !== 'POST') {
    sendJSON(response, 405, { error: 'Method not allowed' });
    return;
  }

  if (!process.env.ADMIN_API_KEY || request.headers['x-admin-key'] !== process.env.ADMIN_API_KEY) {
    sendJSON(response, 401, { error: 'Неправильний ключ адміністратора' });
    return;
  }

  const requiredEnv = ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO'];
  const missingEnv = requiredEnv.filter(name => !process.env[name]);

  if (missingEnv.length) {
    sendJSON(response, 500, {
      error: `Не налаштовано змінні Vercel: ${missingEnv.join(', ')}`
    });
    return;
  }

  try {
    const body = await readRequestBody(request);
    const path = normalizeFilename(body.filename);
    const branch = process.env.GITHUB_BRANCH || 'main';

    if (!ALLOWED_FILES.has(path)) {
      sendJSON(response, 400, { error: 'Цей файл не дозволено оновлювати' });
      return;
    }

    const content = `${JSON.stringify(body.content, null, 2)}\n`;
    const encodedContent = Buffer.from(content, 'utf8').toString('base64');
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`;
    const currentFile = await githubRequest(`${fileUrl}?ref=${encodeURIComponent(branch)}`, {
      method: 'GET'
    });

    const result = await githubRequest(fileUrl, {
      method: 'PUT',
      body: JSON.stringify({
        message: body.message || `update ${path}`,
        content: encodedContent,
        sha: currentFile.sha,
        branch
      })
    });

    sendJSON(response, 200, {
      ok: true,
      path,
      commit: result.commit?.sha,
      htmlUrl: result.content?.html_url
    });
  } catch (error) {
    sendJSON(response, 500, { error: error.message });
  }
};
