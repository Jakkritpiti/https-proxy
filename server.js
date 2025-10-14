import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// เปลี่ยน URL ปลายทางเป็นของคุณ
const TARGET = "http://us2.bot-hosting.net:20338";

app.use("/", async (req, res) => {
  try {
    const targetUrl = TARGET + req.originalUrl;

    // ส่งต่อ headers และ body เดิม
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: { ...req.headers, host: undefined },
      body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body)
    });

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const text = await response.text();
      res.status(response.status).send(text);
    }
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy failed", detail: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
