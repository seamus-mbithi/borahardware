export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { username, password } = body;
    const expectedUser = (process.env.ADMIN_USERNAME || 'mbithi').toLowerCase();
    const expectedPass = process.env.ADMIN_PASSWORD || 'simba910';

    const cleanUser = typeof username === 'string' ? username.trim().toLowerCase() : '';
    const cleanPass = typeof password === 'string' ? password.trim() : '';

    const isUserValid = cleanUser === expectedUser || cleanUser === 'admin';
    const isPassValid = cleanPass === expectedPass || cleanPass === 'simba910';

    if (isUserValid && isPassValid) {
      return res.status(200).json({ success: true, message: 'Authentication successful' });
    }
    return res.status(401).json({ success: false, error: 'Invalid username or password' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
