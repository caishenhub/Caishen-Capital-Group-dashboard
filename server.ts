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

    try {
      // Reenviamos los parámetros de consulta (tab, etc)
      const response = await axios({
        method: req.method,
        url: GOOGLE_URL,
        params: req.query,
        data: req.body,
        maxRedirects: 5,
        validateStatus: () => true, // Permite que axios pase el status real
        headers: {
          'Accept': 'application/json',
          'Content-Type': req.headers['content-type'] || 'application/json'
        }
      });

      res.status(response.status).send(response.data);
    } catch (error: any) {
      console.error("Proxy Error:", error.message);
      res.status(500).json({
        error: "Error al comunicar con el proveedor de datos",
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
