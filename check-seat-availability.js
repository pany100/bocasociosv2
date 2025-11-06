// check-seat-availability.js
import axios from "axios";
import dotenv from "dotenv";
import { readFile } from "fs/promises";
import https from "https";
import { USE_MOCKS } from "./config.js";
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
  const mockData = await readFile(
    "./check-seat-availability.mock.json",
    "utf-8"
  );
  return JSON.parse(mockData);
}

export async function checkSeatAvailability(sectionNid, token) {
  try {
    console.log(`🔍 Consultando asientos para sección NID: ${sectionNid}...`);

    const cookies = await validate();
    const url = `https://bocasocios-gw.bocajuniors.com.ar/event/seat/section/${sectionNid}/availability`;
    console.log("Checking Seat Availability...:" + url);
    const response = await client.get(url, {
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

    if (data.ubicaciones && data.ubicaciones.length > 0) {
      // Extraer solo los NIDs de las ubicaciones
      const nids = data.ubicaciones.map((u) => u.nid);

      console.log(
        `✓ ${nids.length} asiento(s) disponible(s) en sección ${data.nombreSeccion}`
      );
      console.log(`NIDs de asientos:`, nids);

      return nids; // [6335320, 6335321, ...]
    }

    console.log(`❌ No hay asientos disponibles en la sección`);
    return []; // Sin asientos disponibles
  } catch (error) {
    console.error(
      "Error al consultar asientos:",
      error.response?.data || error.message
    );
    return null; // Error
  }
}
