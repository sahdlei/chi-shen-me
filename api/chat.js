export const config = { runtime: 'edge' };

const PROVIDERS = {
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    }),
  },
  deepseek: {
    url: 'https://api.deepseek.com/chat/completions',
    headers: (key) => ({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + key,
    }),
  },
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { provider, key, payload } = body;

  if (!provider || !key || !payload) {
    return json({ error: 'Missing provider, key, or payload' }, 400);
  }

  const p = PROVIDERS[provider];
  if (!p) return json({ error: 'Unknown provider' }, 400);

  try {
    const upstream = await fetch(p.url, {
      method: 'POST',
      headers: p.headers(key),
      body: JSON.stringify(payload),
    });

    const data = await upstream.json();
    return json(data, upstream.status);
  } catch (e) {
    return json({ error: e.message }, 502);
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
