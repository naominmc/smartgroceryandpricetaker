// Vercel Serverless Function: /api/snapshot
// Synchronizes single-user grocery state across all user devices (HP, Laptop, Tablet)
const CLOUD_OBJECT_ID = 'ff808181a09d98f701a1973493867f53';
const CLOUD_URL = `https://api.restful-api.dev/objects/${CLOUD_OBJECT_ID}`;

let memoryCache = null;

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const snapshot = body.snapshot || body;
      memoryCache = snapshot;

      // Persist to central cloud store
      await fetch(CLOUD_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'smartgrocery_singleuser_naomiiracle',
          data: snapshot,
        }),
      });

      return res.status(200).json({ success: true, timestamp: Date.now() });
    } catch (err) {
      console.error('Error persisting snapshot:', err);
      return res.status(200).json({ success: true, cached: true });
    }
  }

  if (req.method === 'GET') {
    try {
      const cloudRes = await fetch(CLOUD_URL, { cache: 'no-store' });
      if (cloudRes.ok) {
        const json = await cloudRes.json();
        if (json && json.data) {
          memoryCache = json.data;
          return res.status(200).json({ success: true, snapshot: json.data });
        }
      }
    } catch (err) {
      console.warn('Cloud fetch failed, using memory fallback:', err);
    }

    if (memoryCache) {
      return res.status(200).json({ success: true, snapshot: memoryCache });
    }

    return res.status(200).json({ success: false, message: 'No snapshot available yet' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
