import dotenv from "dotenv";
import express, { type Request, type Response } from "express";
import pool from "./config/database";
import { createTables } from "./config/initialize_database";
import extensionUserRoutes from "./routes/auth.route";
dotenv.config();

const app: express.Application = express();

const port: number = Number(process.env.PORT);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", async (req: Request, res: Response) => {
  return res.send("API HIT");
});

app.use("/auth", extensionUserRoutes);

app.listen(port, async () => {
  try {
    pool.connect((err, client, release) => {
      if (err) {
        console.error("Database connection error:", err.stack);
      } else {
        console.log("✅ Database connected successfully");
        release();
      }
    });

    await createTables();
    console.log(`Server is running on ${port}`);
  } catch (error: any) {
    console.error("Error creating database: ", error);
    process.exit(1);
  }
});
