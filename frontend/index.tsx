import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Terminal-style initialization log
console.log(
  "%c SOFIYA AI %c v5.0.0 %c INITIALIZING_CORE_SERVICES...",
  "background: #8b5cf6; color: white; padding: 2px 5px; border-radius: 3px 0 0 3px; font-weight: bold;",
  "background: #1e1b4b; color: #a5f3fc; padding: 2px 5px; border-radius: 0 3px 3px 0;",
  "color: #8b5cf6; font-style: italic;"
);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("CRITICAL_OS_ERROR: Could not find root element to mount [SOFIYA.CORE]");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);