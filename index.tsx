import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Impossibile trovare l'elemento root");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Errore critico durante il rendering:", error);
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif; color: #721c24; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; margin: 20px;">
      <h1 style="font-size: 18px; margin-bottom: 10px;">⚠️ Errore di Caricamento</h1>
      <p style="font-size: 14px;">L'applicazione non è riuscita ad avviarsi.</p>
      <pre style="font-size: 12px; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 4px; overflow: auto;">${error instanceof Error ? error.message : String(error)}</pre>
      <button onclick="window.location.reload()" style="margin-top: 15px; padding: 8px 16px; background: #721c24; color: white; border: none; border-radius: 4px; cursor: pointer;">Riprova</button>
    </div>
  `;
}