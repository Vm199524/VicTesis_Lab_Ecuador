import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { PreferencesProvider } from './context/PreferencesContext';
import { AuthProvider } from './context/AuthContext';
import { OriginalityCheckProvider } from './context/OriginalityCheckContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PreferencesProvider>
      <AuthProvider>
        {/* Fuera de App: así el estado del verificador de originalidad
            sobrevive a cualquier cambio de módulo o de vista dentro de la SPA
            (ver el comentario de OriginalityCheckContext). No depende de
            AuthProvider; va anidado aquí solo para no dispersar el árbol de
            providers en dos ramas distintas. */}
        <OriginalityCheckProvider>
          <App />
        </OriginalityCheckProvider>
      </AuthProvider>
    </PreferencesProvider>
  </StrictMode>,
);
