import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Proxy for Google Sheets
  // Oculta la URL real de Google Apps Script del navegador
  app.all("/api/gsheets", async (req, res) => {
    // Fallback URL real para asegurar que el sitio no se rompa si el usuario pone una clave inválida en el ENV
    const REAL_GOOGLE_URL = "https://script.google.com/macros/s/AKfycbwnZW8iOTcd1S3NJZXvjQm2IcF_ZgpbLMwA8hII2AE75Pei2aZmPI3aYr0AHIKQop7Ezw/exec";
    const envUrl = process.env.GOOGLE_SCRIPT_URL;
    
    // Si la URL del ENV no empieza con http, usamos la URL real guardada internamente
    const GOOGLE_URL = (envUrl && envUrl.startsWith('http')) ? envUrl : REAL_GOOGLE_URL;
    const GOOGLE_KEY = process.env.GOOGLE_SCRIPT_KEY || "I423#^$&$B!$@V@$";

    try {
      console.log(`[Proxy] ${req.method} request for tab: ${req.query.tab || 'unknown'}`);
      console.log(`[Proxy] Origin: ${req.headers.origin || 'none'}`);
      
      const config: any = {
        method: req.method,
        url: GOOGLE_URL,
        // Usamos params serializados manualmente para evitar problemas de encoding
        params: { ...req.query, key: GOOGLE_KEY, _cache: Date.now() },
        maxRedirects: 15,
        timeout: 45000, 
        validateStatus: () => true,
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cache-Control': 'no-cache'
        }
      };

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        config.data = req.body;
        config.headers['Content-Type'] = req.headers['content-type'] || 'application/json';
      }

      const response = await axios(config);
      let data = response.data;

      // Si Google nos bloquea, a veces devuelve un error 429 o una página de login/captcha
      if (response.status === 429) {
        return res.status(429).json({ error: "Límite de peticiones de Google excedido. Espere unos minutos." });
      }

      // Si la respuesta es HTML (página de Google de error o login)
      if (typeof data === 'string' && (data.includes('document.getElementById') || data.includes('<html'))) {
          console.error("[Proxy] Bloqueo de Google detectado (HTML)");
          return res.status(502).json({ 
            error: "El motor de datos está temporalmente inaccesible desde esta red.",
            details: "Google devolvió una página web de seguridad en lugar de datos JSON."
          });
      }

      res.status(response.status).send(data);
    } catch (error: any) {
      console.error("[Proxy Error]:", error.message);
      res.status(500).json({
        error: "Fallo crítico en el túnel de datos",
        message: error.message
      });
    }
  });

  // Vite middleware logic
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Google Sheets Proxy Active at /api/gsheets`);
  });
}

startServer();
