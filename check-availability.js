import axios from "axios";
import dotenv from "dotenv";
import { readFile } from "fs/promises";
import https from "https";
import { USE_MOCKS } from "./config.js";
import { ALLOWED_SECTIONS, AVAILABILITY_URL } from "./constants.js";
import { validate } from "./validate.js";

dotenv.config();

const client = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

const headers = {
  accept: "application/json, text/plain, */*",
  "accept-encoding": "gzip, deflate, br, zstd",
  "accept-language": "es-419,es;q=0.9",
  origin: "https://bocasocios.bocajuniors.com.ar",
  referer: "https://bocasocios.bocajuniors.com.ar/",
  "sec-ch-ua":
    '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
};

async function getMockData() {
  const mockData = await readFile("./check-availability.mock.json", "utf-8");
  return JSON.parse(mockData);
}

export async function checkAvailability(
  token,
  intervalSeconds = 5,
  maxAttempts = null
) {
  let attempts = 0;

  console.log(
    `🔍 Iniciando monitoreo de disponibilidad (cada ${intervalSeconds}s)...`
  );

  if (USE_MOCKS) {
    console.log("🧪 MODO MOCK ACTIVADO");
  }

  while (true) {
    attempts++;

    if (maxAttempts && attempts > maxAttempts) {
      console.log(`❌ Se alcanzó el límite de ${maxAttempts} intentos`);
      return null;
    }

    try {
      console.log(`\n[Intento ${attempts}] Consultando disponibilidad...`);
      const cookies = await validate();
      console.log("Checking Availability...");
      const response = await client.get(AVAILABILITY_URL, {
        headers: {
          ...headers,
          Authorization: `Bearer ${token}`,
          cookie: cookies ? cookies.join("; ") : "",
        },
      });
      let data;
      if (USE_MOCKS) {
        const mockData = await getMockData();
        response.data = mockData;
        data = response.data;
      } else {
        data = response.data;
      }
      // Filtrar solo las secciones permitidas
      // const seccionesFiltradas = data.secciones.filter((s) =>
      //   ALLOWED_SECTIONS.includes(s.codigo)
      // );

      const seccionesFiltradas = data.secciones;

      // Buscar secciones con disponibilidad
      const disponibles = seccionesFiltradas.filter((s) => s.hayDisponibilidad);

      if (disponibles.length > 0) {
        console.log(`\n🎉 ¡DISPONIBILIDAD ENCONTRADA!`);

        // Extraer solo los NIDs
        const nids = disponibles.map((s) => s.nid);

        console.log(`\nNIDs disponibles:`, nids);

        return nids; // Devuelve array de NIDs: [75811, 75812, ...]
      }

      console.log(
        `❌ Sin disponibilidad (0/${seccionesFiltradas.length} secciones permitidas)`
      );

      // Esperar antes del siguiente intento
      await new Promise((resolve) =>
        setTimeout(resolve, intervalSeconds * 1000)
      );
    } catch (error) {
      console.error(
        "Error al consultar:",
        error.response?.data || error.message
      );

      // Si es error de auth, detener
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log("❌ Error de autenticación. Token inválido o expirado.");
        return null;
      }

      // Para otros errores, reintentar
      console.log(`Reintentando en ${intervalSeconds}s...`);
      await new Promise((resolve) =>
        setTimeout(resolve, intervalSeconds * 1000)
      );
    }
  }
}

// Función alternativa: verificar una sola vez
export async function checkAvailabilityOnce(token) {
  try {
    const cookies = await validate();
    const response = await client.get(AVAILABILITY_URL, {
      headers: {
        ...headers,
        Authorization: `Bearer ${token}`,
        cookie: cookies ? cookies.join("; ") : "",
      },
    });

    // Filtrar solo las secciones permitidas
    const seccionesFiltradas = response.data.secciones.filter((s) =>
      ALLOWED_SECTIONS.includes(s.codigo)
    );

    const disponibles = seccionesFiltradas.filter((s) => s.hayDisponibilidad);

    if (disponibles.length > 0) {
      const nids = disponibles.map((s) => s.nid);
      return nids; // [75811, 75812, ...]
    }

    return []; // Sin disponibilidad
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    return null; // Error
  }
}
