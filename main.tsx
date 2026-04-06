import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';



/**

 * Entry point for FARAH Portal.

 * To fix the resolution errors in the Canvas environment, we use 

 * explicit file extensions for our internal imports. 

 */

import App from './App.jsx';

import './index.css';



const mountApp = () => {

  const rootElement = document.getElementById('root');



  if (rootElement) {

    try {

      const root = createRoot(rootElement);

      root.render(

        <StrictMode>

          <App />

        </StrictMode>

      );

      console.log("✅ FARAH Portal: React mounted successfully!");

    } catch (err) {

      console.error("❌ FARAH Portal: Render error:", err);

    }

  } else {

    console.error("❌ Critical Error: Could not find #root element in index.html");

  }

};



if (document.readyState === 'complete' || document.readyState === 'interactive') {

  mountApp();

} else {

  document.addEventListener('DOMContentLoaded', mountApp);

}
