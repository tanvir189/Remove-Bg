import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Configure multer for file uploads
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const upload = multer({ dest: uploadDir });

  // API route for background removal
  app.post("/api/remove-bg", upload.single("image"), async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      const apiKey = process.env.REMOVE_BG_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "REMOVE_BG_API_KEY is not configured" });
      }

      const formData = new FormData();
      formData.append("size", "auto");
      formData.append("image_file", fs.createReadStream(req.file.path));

      const response = await axios.post("https://api.remove.bg/v1.0/removebg", formData, {
        headers: {
          ...formData.getHeaders(),
          "X-Api-Key": apiKey,
        },
        responseType: "arraybuffer",
      });

      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);

      // Send the processed image back as base64
      const base64Image = Buffer.from(response.data).toString("base64");
      res.json({ image: `data:image/png;base64,${base64Image}` });
    } catch (error: any) {
      const errorMessage = error.response?.data?.toString() || error.message;
      console.error("Error removing background:", errorMessage);
      
      // Ensure we always return JSON
      res.status(error.response?.status || 500).json({ 
        error: "Failed to remove background",
        details: errorMessage 
      });
    }
  });

  // Global error handler to prevent HTML error pages
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Global error:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
