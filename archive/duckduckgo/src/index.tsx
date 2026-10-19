import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.sass';

const container = document.getElementById('root');
if (!container) throw new Error('Popup root is missing');

createRoot(container).render(<StrictMode><App /></StrictMode>);
