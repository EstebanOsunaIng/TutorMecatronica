import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './routes/AppRouter.jsx';
import CookieBanner from './components/privacy/CookieBanner.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
      <CookieBanner />
    </BrowserRouter>
  );
}
