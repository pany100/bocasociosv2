import axios from "axios";
import https from "https";

import { IPV4_CHECK_URL, QUEUEIT_URL } from "./constants.js";

const client = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
  maxRedirects: 0,
  validateStatus: (status) => status >= 200 && status < 400,
});

const headers = {
  accept: "application/json, text/plain, /",
  "accept-encoding": "gzip, deflate, br, zstd",
  "accept-language": "es-419,es;q=0.9",
  referer: "https://bocasocios.bocajuniors.com.ar/",
  origin: "https://bocasocios.bocajuniors.com.ar",
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

// ✨ Guardar cookies en memoria
let cachedCookies = [];

function extractCookies(setCookieHeaders) {
  if (!setCookieHeaders) return [];
  const headers = Array.isArray(setCookieHeaders)
    ? setCookieHeaders
    : [setCookieHeaders];
  return headers.map((c) => c.split(";")[0]);
}

function cookiesToString(cookieArray) {
  const cookieMap = new Map();

  cookieArray.forEach((cookie) => {
    const [name] = cookie.split("=");
    cookieMap.set(name, cookie);
  });

  return Array.from(cookieMap.values()).join("; ");
}

export async function validate(initializeFirst = false) {
  try {
    // Si no es la primera vez, usar las cookies cacheadas
    let allCookies = initializeFirst ? [] : [...cachedCookies];

    if (initializeFirst) {
      console.log("🔄 Inicializando Queue-it desde cero...");
      const response = await client.get(IPV4_CHECK_URL);
      console.log("IPV 4 response");
      console.log(response.data);
      // 2. Ir a Queue-it inicial
      console.log("2. Accediendo a Queue-it...");
      const queueItUrl =
        "https://bocajuniors.queue-it.net/?c=bocajuniors&e=e20251123adh&ver=v3-javascript-3.7.10&cver=262&man=Proteccion+Boca+Socios&t=https%3A%2F%2Fbocasocios-gw.bocajuniors.com.ar%2Fqueueit%2Fredirect";
      console.log("Queue it url", queueItUrl);
      const queueResponse = await client.get(queueItUrl, {
        headers: {
          ...headers,
          cookie: cookiesToString(allCookies),
        },
      });

      allCookies.push(...extractCookies(queueResponse.headers["set-cookie"]));

      // 3. Seguir el redirect (302) con el queueittoken
      if (queueResponse.status === 302 && queueResponse.headers.location) {
        console.log("3. Siguiendo redirect con queueittoken...");
        const redirectUrl = "https://bocajuniors.queue-it.net" + queueResponse.headers.location;
        console.log("redirect 2 to");
        console.log(redirectUrl);
        const redirectResponse = await client.get(redirectUrl, {
          headers: {
            ...headers,
            cookie: cookiesToString(allCookies),
          },
        });

        console.log(redirectResponse.data);

        allCookies.push(
          ...extractCookies(redirectResponse.headers["set-cookie"])
        );

        const redirectUrl2 = redirectResponse.headers.location;
        console.log("redirect 3 to");
        console.log(redirectUrl2);
        const redirectResponse2 = await client.get(redirectUrl2, {
          headers: {
            ...headers,
            cookie: cookiesToString(allCookies),
          },
        });

        console.log(redirectResponse.data);

        allCookies.push(
          ...extractCookies(redirectResponse2.headers["set-cookie"])
        );

        console.log("✓ Cookies de Queue-it obtenidas");
      }
    }

    // 4. Validar finalmente
    console.log("4. Validando con Queue-it...");
    const validateResponse = await client.get(QUEUEIT_URL, {
      headers: {
        ...headers,
        cookie: cookiesToString(allCookies),
      },
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 500,
    });

    allCookies.push(...extractCookies(validateResponse.headers["set-cookie"]));

    // Eliminar duplicados
    const uniqueCookies = Array.from(
      new Map(allCookies.map((c) => [c.split("=")[0], c])).values()
    );

    // ✨ Guardar cookies para la próxima llamada
    cachedCookies = uniqueCookies;

    console.log("✓ Validación completa");

    return uniqueCookies;
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

// ✨ Función opcional para limpiar el cache
export function clearCachedCookies() {
  cachedCookies = [];
}
