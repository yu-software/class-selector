// JWT_SECRET, puerto, etc
import dotenv from "dotenv";
import process from "process";

dotenv.config();

export const port = process.env.PORT ?? 3000;
export const jwtSecret = process.env.JWT_SECRET ?? "class-selector-secret";

export default { port, jwtSecret };
