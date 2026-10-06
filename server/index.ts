import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findStation, stations } from "./stations.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const isProd = process.env.NODE_ENV === "production";

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, stations: stations.length });
});

app.get("/api/stations", (_req, res) => {
  res.json(
    stations.map(({ streamUrl: _streamUrl, ...publicStation }) => publicStation),
  );
});

app.get("/api/stations/:id", (req, res) => {
  const station = findStation(req.params.id);
  if (!station) {
    res.status(404).json({ error: "Station not found" });
    return;
  }
  const { streamUrl: _streamUrl, ...publicStation } = station;
  res.json(publicStation);
});

app.get("/api/stream/:id", async (req, res) => {
  const station = findStation(req.params.id);
  if (!station) {
    res.status(404).json({ error: "Station not found" });
    return;
  }

  try {
    const upstream = await fetch(station.streamUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "TheRadio/1.0 (receiver)",
        Accept: "*/*",
        "Icy-MetaData": "0",
      },
    });

    if (!upstream.ok || !upstream.body) {
      res.status(upstream.status).json({ error: "Upstream stream unavailable" });
      return;
    }

    const contentType = upstream.headers.get("content-type") ?? "audio/mpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Transfer-Encoding", "chunked");

    const reader = upstream.body.getReader();
    const abort = () => {
      void reader.cancel();
    };
    req.on("close", abort);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!res.write(Buffer.from(value))) {
        await new Promise<void>((resolve) => res.once("drain", resolve));
      }
    }
    res.end();
  } catch {
    if (!res.headersSent) {
      res.status(502).json({ error: "Could not reach stream" });
    } else {
      res.end();
    }
  }
});

if (isProd) {
  const dist = path.join(__dirname, "..", "dist");
  app.use(express.static(dist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(dist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`The Radio transmitter on http://127.0.0.1:${PORT}`);
});
