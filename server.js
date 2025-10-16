import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

// รับทุกชนิดของ body เป็น raw เพื่อที่จะส่งต่อแบบเดิม (ไม่แปลงเป็น JSON เสมอไป)
app.use(express.raw({ type: "*/*", limit: "10mb" }));

// เปลี่ยน URL ปลายทางเป็นของคุณ
const TARGET = "http://us2.bot-hosting.net:20338";

app.use("/", async (req, res) => {
  try {
    const targetUrl = TARGET + req.originalUrl;

    // คัดลอก headers จาก client แต่ไม่ส่ง header 'host' และ 'content-length' ต้นทางมาโดยตรง
    const headers = { ...req.headers };
    delete headers.host;
    delete headers["content-length"];

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      // ให้ body เป็น undefined สำหรับ GET/HEAD, สำหรับคำขออื่น ๆ ใช้ raw buffer ที่ได้จาก express.raw()
      body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body,
      redirect: "manual"
    });

    // ส่งต่อ status และ headers จากปลายทาง (ยกเว้น header ที่ไม่ควรส่งต่อแบบ hop-by-hop ถ้าจำเป็น)
    res.status(response.status);
    response.headers.forEach((val, name) => {
      // ข้ามบาง hop-by-hop headers ถ้าต้องการ เช่น: connection, keep-alive, transfer-encoding
      const skip = ["connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailers", "transfer-encoding", "upgrade"];
      if (!skip.includes(name.toLowerCase())) {
        res.set(name, val);
      }
    });

    // อ่าน body เป็น buffer เพื่อรองรับทั้ง text/binary และส่งต่อแบบดิบ ๆ
    const bodyBuffer = await response.buffer();
    res.send(bodyBuffer);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy failed", detail: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
