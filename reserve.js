// reserve.js
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

async function getMockData() {
  const mockData = await readFile("./reserve.mock.json", "utf-8");
  return JSON.parse(mockData);
}

const headers = {
  accept: "application/json, text/plain, */*",
  "accept-encoding": "gzip, deflate, br, zstd",
  "accept-language": "es-419,es;q=0.9",
  "content-type": "application/json",
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

export async function reserve(seatNid, token) {
  try {
    console.log(`🎫 Intentando reservar asiento NID: ${seatNid}...`);
    const cookies = await validate();

    const url = `https://bocasocios-gw.bocajuniors.com.ar/event/seat/reserve/${seatNid}`;
    let response = {};
    if (USE_MOCKS) {
      const mockData = await getMockData();
      response.data = mockData;
    } else {
      response = await client.post(
        url,
        {
          eventoUbicacionNid: seatNid,
        },
        {
          headers: {
            ...headers,
            Authorization: `Bearer ${token}`,
            cookie: cookies ? cookies.join("; ") : "",
          },
        }
      );
    }

    console.log(`✅ ¡RESERVA EXITOSA!`);
    console.log(`Respuesta:`, response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error(
      "❌ Error al reservar:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}
