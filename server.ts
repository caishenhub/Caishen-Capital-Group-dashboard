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

  // Validación de variables de entorno al inicio
  const scriptUrl = process.env.GOOGLE_SCRIPT_APP_URL;
  const token = process.env.GOOGLE_SECURITY_TOKEN;

  console.log("--- INICIANDO SERVIDOR CAISHEN ---");
  if (!scriptUrl) console.warn("⚠️ ALERTA: GOOGLE_SCRIPT_APP_URL no está configurada.");
  if (!token) console.warn("⚠️ ALERTA: GOOGLE_SECURITY_TOKEN no está configurada.");
  if (scriptUrl && token) console.log("✅ Configuración de Google detectada correctamente.");
  console.log("----------------------------------");

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
  
  // Endpoint de Salud (Dashboard de diagnóstico)
  app.get("/api/health", (req, res) => {
    const scriptUrl = process.env.GOOGLE_SCRIPT_APP_URL;
    const token = process.env.GOOGLE_SECURITY_TOKEN;
    
    res.json({ 
      status: "online", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      config: {
        google_url_configured: !!scriptUrl,
        google_url_length: scriptUrl ? scriptUrl.length : 0,
        google_token_configured: !!token,
        google_token_length: token ? token.length : 0
      },
      proxy: {
        trust_proxy: app.get('trust proxy'),
        port: PORT
      }
    });
  });

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
          details: "El servidor no tiene configuradas las credenciales de enlace con Google."
        }));
      }

      if (!tab) {
        return res.status(400).json(wrapResponse({ error: "Parámetro 'tab' es requerido" }));
      }

      // Caso especial PING: No saturar Google si solo queremos saber si el proxy vive
      if (tab === 'PING') {
        return res.json(wrapResponse({ status: "pong", timestamp: Date.now() }));
      }

      // Construimos la URL hacia Google con el Token oculto codificado
      const separator = scriptUrl.includes('?') ? '&' : '?';
      const encodedTab = encodeURIComponent(tab as string);
      const encodedToken = encodeURIComponent(token as string);
      const targetUrl = `${scriptUrl}${separator}tab=${encodedTab}&token=${encodedToken}&_=${Date.now()}`;
      
      console.log(`[GET] Consultando Google - Pestaña: ${tab}`);
      
      const response = await fetch(targetUrl, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Google API Error (${response.status}) para ${tab}:`, errorText.substring(0, 200));
        throw new Error(`Google API Error: ${response.status}`);
      }
      
      const rawData = await response.text();
      let data;
      try {
        data = JSON.parse(rawData);
      } catch (parseError) {
        console.error(`Error parseando respuesta de Google para ${tab}:`, rawData.substring(0, 100));
        throw new Error("Respuesta de Google no es un JSON válido");
      }
      
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

      console.log(`[POST] Enviando solicitud a Google para pestaña: ${payload.tab || 'N/A'}`);

      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "text/plain;charset=utf-8",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        body: JSON.stringify(securedPayload)
      });
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Google POST API Error (${response.status}):`, errorBody.substring(0, 500));
        throw new Error(`Google API POST Error: ${response.status}`);
      }
      
      const resData = await response.json();
      // Ofuscamos la respuesta de confirmación también
      res.json(wrapResponse(resData));
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
