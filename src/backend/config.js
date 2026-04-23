// JWT_SECRET, puerto, etc
import dotenv from "dotenv";
import process from "process";

dotenv.config();

const rawPort = process.env.PORT;
const parsedPort = rawPort === undefined ? 3005 : Number.parseInt(rawPort, 10);

if (!Number.isInteger(parsedPort) || parsedPort < 0 || parsedPort > 65535) {
  throw new Error("PORT must be a valid integer between 0 and 65535");
}

export const port = parsedPort;

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("Missing required environment variable: JWT_SECRET");
}

export { jwtSecret };
