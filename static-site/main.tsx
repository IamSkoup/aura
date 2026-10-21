import React from 'react';
import {createRoot} from 'react-dom/client';
import '@fontsource-variable/manrope/index.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/600.css';
import '../src/app/globals.css';
import './static.css';
import App from './App';

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
