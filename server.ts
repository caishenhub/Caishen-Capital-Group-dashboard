import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import { wrapResponse, deobfuscate } from "./lib/obfuscation";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Confía en el proxy (Nginx) para obtener la IP real del usuario
  app.set('trust proxy', 1);

  // Middleware para parsear JSON
  app.use(express.json());
  app.use(express.text({ type: "text/plain" }));

  // --- CAPA DE SEGURIDAD ADICIONAL: RATE LIMITING ---
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // limita cada IP a 100 peticiones por ventana
    message: wrapResponse({ error: "Demasiadas peticiones. Por seguridad, intente más tarde." }),
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Aplicar el limitador a las rutas de API
  app.use("/api/", limiter);

  // --- ESCUDO DE SEGURIDAD (PROXY + OFUSCACIÓN) ---
  
  // Endpoint de Lectura (GET)
  app.get("/api/sheets", async (req, res) => {
    try {
      const { tab } = req.query;
      const scriptUrl = process.env.GOOGLE_SCRIPT_APP_URL;
      const token = process.env.GOOGLE_SECURITY_TOKEN;

      if (!scriptUrl || !token) {
        console.error("Faltan variables de entorno: GOOGLE_SCRIPT_APP_URL o GOOGLE_SECURITY_TOKEN");
        return res.status(500).json(wrapResponse({ 
          error: "Error de configuración de seguridad",
          details: "El servidor no tiene configuradas las credenciales de enlace con Google. Revise la configuración del entorno."
        }));
      }

      if (!tab) {
        return res.status(400).json(wrapResponse({ error: "Parámetro 'tab' es requerido" }));
      }

      // Construimos la URL hacia Google con el Token oculto
      // Aseguramos que los parámetros estén correctamente codificados para evitar errores 500
      const separator = scriptUrl.includes('?') ? '&' : '?';
      const targetUrl = `${scriptUrl}${separator}tab=${encodeURIComponent(tab as string)}&token=${encodeURIComponent(token)}`;
      
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Google API Error (${response.status}):`, errorText);
        throw new Error(`Google API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Ofuscamos la respuesta antes de mandarla al cliente
      res.json(wrapResponse(data));
    } catch (error) {
      console.error("Proxy GET Error:", error);
      res.status(500).json(wrapResponse({ 
        error: "Servicio temporalmente no disponible",
        details: error instanceof Error ? error.message : String(error)
      }));
    }
  });

  // Endpoint de Escritura (POST)
  app.post("/api/sheets", async (req, res) => {
    try {
      const scriptUrl = process.env.GOOGLE_SCRIPT_APP_URL;
      const token = process.env.GOOGLE_SECURITY_TOKEN;

      if (!scriptUrl || !token) {
        return res.status(500).json(wrapResponse({ error: "Error de configuración de seguridad" }));
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
        headers: { 
          "Content-Type": "text/plain;charset=utf-8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        body: JSON.stringify(securedPayload)
      });
      
      const data = await response.json();
      // Ofuscamos la respuesta de confirmación también
      res.json(wrapResponse(data));
    } catch (error) {
      console.error("Proxy POST Error:", error);
      res.status(500).json(wrapResponse({ error: "No se pudo procesar la solicitud de escritura" }));
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
