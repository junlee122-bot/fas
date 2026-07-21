import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

if (import.meta.env.DEV) {
  document.title = `IRON DOMINION — LOCAL ${window.location.port || '4180'}`;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
