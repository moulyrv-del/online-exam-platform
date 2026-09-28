// Small helper for talking to the backend. It adds the login token automatically.
export async function api(path, options = {}) {
  const token = localStorage.getItem('token');

  const response = await fetch('/api' + path, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  // Token expired: clear it and go back to the login page
  if (response.status === 401 && token && !path.startsWith('/auth/')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong. Is the server running?');
  }
  return data;
}
