function serviceEnv(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase service configuration');
  }
  return { url: url.replace(/\/$/, ''), key };
}

function headers(key: string): Record<string, string> {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

export async function sbSelect(path: string): Promise<any[]> {
  const { url, key } = serviceEnv();
  const res = await fetch(`${url}/rest/v1/${path}`, { headers: headers(key) });
  if (!res.ok) {
    throw new Error(`${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function sbInsert(table: string, row: Record<string, unknown>): Promise<void> {
  const { url, key } = serviceEnv();
  const res = await fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers(key), Prefer: 'return=minimal' },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${await res.text()}`);
  }
}
