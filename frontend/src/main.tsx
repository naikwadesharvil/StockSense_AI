import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { StockProvider } from './context/StockContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <StockProvider>
        <App />
      </StockProvider>
    </ThemeProvider>
  </React.StrictMode>
);
