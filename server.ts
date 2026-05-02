import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware para parsear JSON
  app.use(express.json());
  app.use(cors());

  // --- VALIDACIÓN DE MOTOR DE DATOS ---
  const BACKUP_URL = 'https://script.google.com/macros/s/AKfycbwnZW8iOTcd1S3NJZXvjQm2IcF_ZgpbLMwA8hII2AE75Pei2aZmPI3aYr0AHIKQop7Ezw/exec';
  const ENV_URL = process.env.GOOGLE_SCRIPT_API_URL || '';
  
  // Limpieza y validación rigurosa de la URL
  let GOOGLE_URL = BACKUP_URL;
  if (ENV_URL && ENV_URL.includes('script.google.com') && ENV_URL.startsWith('https://') && !ENV_URL.includes('#^$')) {
    GOOGLE_URL = ENV_URL;
  }

  console.log('🚀 Servidor de Seguridad CCG Activado');
  console.log(`📂 Motor de Datos configurado: ${GOOGLE_URL.substring(0, 40)}...`);

  // ROUTE: Proxy para obtener datos (GET)
  app.get('/api/gsheets', async (req, res) => {
    const { tab, _ } = req.query;
    try {
      if (!tab) return res.status(400).json({ error: 'Tab name is required' });

      console.log(`[GET] Consultando pestaña: ${tab}`);
      
      const targetUrl = `${GOOGLE_URL}?tab=${tab}&_=${_ || Date.now()}`;
      const response = await fetch(targetUrl, { 
        method: 'GET',
        headers: {
          'User-Agent': 'CCG-Secure-Proxy/1.0'
        },
        redirect: 'follow' 
      });
      
      if (!response.ok) {
        console.error(`❌ Error de Google Script (${tab}): ${response.status}`);
        // Si el error es de Google, devolvemos un array vacío para no romper el frontend
        // Esto permite que la app funcione aunque una pestaña específica falle
        if (response.status >= 500) {
           return res.json([]);
        }
        return res.status(response.status).json({ error: `Google Script Error: ${response.status}`, tab });
      }
      
      const data = await response.json();
      console.log(`✅ Datos recibidos correctamente [${tab}]: ${Array.isArray(data) ? data.length : 'Object'} registros`);
      res.json(data);
    } catch (error) {
      console.error(`🔥 Error crítico en Proxy GET (${tab}):`, error);
      res.status(500).json({ 
        error: 'Error interno de conexión segura', 
        details: String(error),
        tab 
      });
    }
  });

  // ROUTE: Proxy para enviar datos (POST)
  app.post('/api/gsheets', async (req, res) => {
    try {
      console.log(`[POST] Enviando datos a: ${req.body.tab || 'Acción General'}`);
      
      const response = await fetch(GOOGLE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'text/plain;charset=utf-8',
          'User-Agent': 'CCG-Secure-Proxy/1.0'
        },
        body: JSON.stringify(req.body),
        redirect: 'follow'
      });

      const text = await response.text();
      console.log(`✅ Respuesta POST recibida: ${text.substring(0, 50)}...`);
      
      try {
        res.json(JSON.parse(text));
      } catch (e) {
        res.send(text);
      }
    } catch (error) {
      console.error('🔥 Error crítico en Proxy POST:', error);
      res.status(500).json({ error: 'Fallo en la escritura segura', details: String(error) });
    }
  });

  // Integración con Vite (Frontend)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Plataforma Segura en ejecución en http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fallo al iniciar el sistema:', err);
});
