import express from 'express';

import path from 'path';

import { fileURLToPath } from 'url';

import { dirname } from 'path';

import { createServer as createViteServer } from 'vite';



const __filename = fileURLToPath(import.meta.url);

const __dirname = dirname(__filename);



async function startServer() {

  const app = express();

  const PORT = 3000;



  // In development, we use Vite's middleware to handle JSX/TSX transformation

  if (process.env.NODE_ENV !== 'production') {

    const vite = await createViteServer({

      server: { middlewareMode: true },

      appType: 'spa', // Changed to 'spa' for better automatic routing

      root: __dirname, // Explicitly tell Vite to look in the current folder

    });

    app.use(vite.middlewares);

  } else {

    app.use(express.static(path.join(__dirname, 'dist')));

  }



  // Fallback to index.html for SPA routing

  app.get('*', (req, res) => {

    res.sendFile(path.join(__dirname, 'index.html'));

  });



  app.listen(PORT, '0.0.0.0', () => {

    console.log(`\n🌟 FARAH Portal is starting...`);

    console.log(`🔗 Access your app at: http://localhost:${PORT}\n`);

  });

}



startServer().catch(err => {

  console.error("Failed to start server:", err);

});
