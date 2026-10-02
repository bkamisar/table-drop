import { createApp } from "./app.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import express from "express";

const app = createApp();

// In production, serve the built renderer (created by `vite build` -> dist/).
const here = dirname(fileURLToPath(import.meta.url));
const distDir = join(here, "..", "..", "dist");
app.use(express.static(distDir));

const PORT = Number(process.env.PORT ?? 4173);
// Bind to loopback ONLY — never exposed to the local network.
app.listen(PORT, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${PORT}`;
  console.log(`Table Drop running at ${url}`);
  console.log("Open that URL in your browser (Ctrl+C to stop).");
});
