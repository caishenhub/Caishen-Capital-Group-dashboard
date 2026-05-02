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
  
  // Si la URL del entorno es corrupta (contiene caracteres especiales como #^$) o no es una URL válida, usamos el respaldo
  const GOOGLE_URL = (ENV_URL.startsWith('https://') && !ENV_URL.includes('#^$')) 
    ? ENV_URL 
    : BACKUP_URL;

  console.log('🚀 Iniciando Servidor de Seguridad CCG...');
  if (GOOGLE_URL === BACKUP_URL && ENV_URL) {
    console.warn('⚠️ Detectada URL corrupta en entorno, usando Conexión de Respaldo Segura.');
  }

  // ROUTE: Proxy para obtener datos (GET)
  app.get('/api/gsheets', async (req, res) => {
    try {
      const { tab, _ } = req.query;
      if (!tab) return res.status(400).json({ error: 'Tab name is required' });

      console.log(`[GET] Petición de datos: ${tab}`);
      
      const targetUrl = `${GOOGLE_URL}?tab=${tab}&_=${_ || Date.now()}`;
      const response = await fetch(targetUrl, { redirect: 'follow' });
      
      if (!response.ok) throw new Error(`Google Script Error: ${response.status}`);
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error en Proxy GET:', error);
      res.status(500).json({ error: 'Error al conectar con Google Sheets', details: String(error) });
    }
  });

  // ROUTE: Proxy para enviar datos (POST)
  app.post('/api/gsheets', async (req, res) => {
    try {
      console.log('[POST] Guardando datos en el sistema...');
      
      const response = await fetch(GOOGLE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(req.body),
        redirect: 'follow'
      });

      const text = await response.text();
      try {
        res.json(JSON.parse(text));
      } catch (e) {
        res.send(text);
      }
    } catch (error) {
      console.error('Error en Proxy POST:', error);
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
