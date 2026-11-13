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

// Image Proxy Endpoint untuk menyajikan gambar CDN secara stabil ke perangkat mobile
app.get("/api/proxy-image", async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).send("Parameter url diperlukan");
  }

  try {
    const upstreamRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": "https://www.gramedia.com/"
      }
    });

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).send("Gagal mengambil gambar dari sumber");
    }

    const contentType = upstreamRes.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    const arrayBuffer = await upstreamRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`MeepleCafe API Server running on port ${port}`);
});

export default app;

