import dotenv from "dotenv";
dotenv.config();

export const USE_MOCKS = process.env.USE_MOCKS === "true";
