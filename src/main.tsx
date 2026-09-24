import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import App from './App.tsx';

// A deploy replaces the hashed page chunks this tab was built against; reload
// once to pick up the new build instead of failing to open the page. The
// timestamp guard prevents a reload loop when the server itself is unreachable.
window.addEventListener('vite:preloadError', (event) => {
  const key = 'magic-auth:chunk-reload-at';
  try {
    const last = Number(sessionStorage.getItem(key) ?? 0);
    if (Date.now() - last < 10_000) return;
    sessionStorage.setItem(key, String(Date.now()));
  } catch {
    return;
  }
  event.preventDefault();
  window.location.reload();
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
