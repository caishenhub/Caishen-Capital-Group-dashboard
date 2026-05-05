import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { wrapResponse, deobfuscate } from "./lib/obfuscation";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware para parsear JSON
  app.use(express.json());
  app.use(express.text({ type: "text/plain" }));

  // --- ESCUDO DE SEGURIDAD (PROXY + OFUSCACIÓN) ---
  
  // Endpoint de Lectura (GET)
  app.get("/api/sheets", async (req, res) => {
    try {
      const { tab } = req.query;
      const scriptUrl = process.env.GOOGLE_SCRIPT_APP_URL;
      const token = process.env.GOOGLE_SECURITY_TOKEN;

      if (!scriptUrl || !token) {
        return res.status(500).json({ error: "Configuración del servidor incompleta" });
      }

      // Construimos la URL hacia Google con el Token oculto
      const targetUrl = `${scriptUrl}?tab=${tab}&token=${token}&_=${Date.now()}`;
      
      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error(`Google API Error: ${response.status}`);
      
      const data = await response.json();
      
      // Ofuscamos la respuesta antes de mandarla al cliente para que no sea legible en DevTools
      res.json(wrapResponse(data));
    } catch (error) {
      console.error("Proxy GET Error:", error);
      res.status(500).json({ error: "Error al comunicarse con el motor de datos" });
    }
  });

  // Endpoint de Escritura (POST)
  app.post("/api/sheets", async (req, res) => {
    try {
      const scriptUrl = process.env.GOOGLE_SCRIPT_APP_URL;
      const token = process.env.GOOGLE_SECURITY_TOKEN;

      if (!scriptUrl || !token) {
        return res.status(500).json({ error: "Configuración del servidor incompleta" });
      }

      let payload;
      // Soporte para recibir datos ofuscados (bajo la llave _s) o normales
      if (req.body && req.body._s) {
        payload = JSON.parse(deobfuscate(req.body._s));
      } else {
        payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      }

      // Inyectamos el token oculto
      const securedPayload = {
        ...payload,
        token: token
      };

      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(securedPayload)
      });
      
      const data = await response.json();
      // Ofuscamos la respuesta de confirmación también
      res.json(wrapResponse(data));
    } catch (error) {
      console.error("Proxy POST Error:", error);
      res.status(500).json({ error: "Error de escritura en motor de datos" });
    }
  });

  // --- CONFIGURACIÓN VITE ---

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
    console.log(`🚀 Servidor CAISHEN listo en http://0.0.0.0:${PORT}`);
    console.log(`🔒 Escudo de seguridad activo: Token y URL de Google ahora son privados.`);
  });
}

startServer();
