import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import categoryRoutes from "./routes/categoryRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import tableRoutes from "./routes/tableRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Base health check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    app: "MeepleCafe RESTful API",
    version: "1.0.0",
    endpoints: [
      "/api/categories",
      "/api/games",
      "/api/tables",
      "/api/reservations"
    ]
  });
});

// Mount Routes according to Modul 1
app.use("/api/categories", categoryRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/reservations", reservationRoutes);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`MeepleCafe API Server running on port ${port}`);
});

export default app;

