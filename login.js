import axios from "axios";
import dotenv from "dotenv";
import https from "https";
import { LOGIN_URL } from "./constants.js";
import { validate } from "./validate.js";

dotenv.config();

export async function login() {
  try {
    const cookies = await validate(true);
    console.log("Iniciando login...");
    console.log("URL:", LOGIN_URL);
    console.log("Username:", process.env.CUSTOM_USERNAME);

    const response = await axios.post(
      LOGIN_URL,
      {
        email: process.env.CUSTOM_USERNAME,
        password: process.env.PASSWORD,
      },
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-encoding": "gzip, deflate, br, zstd",
          "accept-language": "es-419,es;q=0.9",
          "content-type": "application/json",
          cookie: cookies ? cookies.join("; ") : "",
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
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      }
    );

    return {
      success: true,
      data: response.data,
      token: response.data.token,
      refreshToken: response.data.refreshToken,
      usuario: response.data.usuario,
    };
  } catch (error) {
    console.error("Error en login:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}
