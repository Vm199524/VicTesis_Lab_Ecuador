/**
 * Servidor mínimo para las pruebas de integración.
 *
 * Levanta las rutas reales —las mismas que sirve Cloud Run— sin la capa de
 * estáticos ni el Vite de desarrollo de `server/index.js`: una prueba de rutas
 * no tiene por qué compilar el cliente ni depender de un `dist/` que puede no
 * estar construido. Lo que se prueba aquí es el contrato HTTP, así que el
 * middleware es exactamente el que importa: el analizador de JSON y las rutas.
 *
 * El puerto llega por variable de entorno para que varias suites puedan correr
 * sin pisarse.
 */
import express from "express";
import { registerRoutes } from "../server/routes.js";

const PORT = Number(process.env.TEST_PORT) || 5099;

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false, limit: "2mb" }));
registerRoutes(app);

app.listen(PORT, "127.0.0.1", () => {
  // La suite espera esta línea antes de disparar la primera petición.
  console.log(`listo ${PORT}`);
});
