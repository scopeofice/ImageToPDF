const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const app = express();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
  })
);

const upload = multer({
  dest: "/tmp/",
  limits: {
    files: 120,
    fileSize: 20 * 1024 * 1024,
  },
});

app.get("/", (_, res) => {
  res.send("It is working");
});

app.post("/upload", upload.array("files"), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No files uploaded");
    }

    const pdfDoc = await PDFDocument.create();

    for (const file of req.files) {
      const filePath = path.join("/tmp", file.filename);

      try {
        if (file.mimetype.startsWith("image/")) {
          const imgBytes = await sharp(filePath)
            .resize({ width: 1200 })
            .toBuffer();

          const img = file.mimetype.includes("png")
            ? await pdfDoc.embedPng(imgBytes)
            : await pdfDoc.embedJpg(imgBytes);

          const PAGE_WIDTH = 595;
          const PAGE_HEIGHT = 842;

          let scale = PAGE_WIDTH / img.width;
          let scaledWidth = img.width * scale;
          let scaledHeight = img.height * scale;

          if (scaledHeight > PAGE_HEIGHT) {
            scale = PAGE_HEIGHT / img.height;
            scaledWidth = img.width * scale;
            scaledHeight = img.height * scale;
          }

          const page = pdfDoc.addPage([scaledWidth, scaledHeight]);

          page.drawImage(img, {
            x: 0,
            y: 0,
            width: scaledWidth,
            height: scaledHeight,
          });
        } else if (file.mimetype === "application/pdf") {
          const pdfBytes = await fs.promises.readFile(filePath);
          const srcDoc = await PDFDocument.load(pdfBytes);
          const pages = await pdfDoc.copyPages(srcDoc, srcDoc.getPageIndices());
          pages.forEach((p) => pdfDoc.addPage(p));
        }
      } finally {
        fs.promises.unlink(filePath).catch(() => {});
      }
    }

    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=merged.pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error("PDF merge error:", err);
    res.status(500).send("Error generating PDF");
  }
});

module.exports = app;
// const PORT = process.env.PORT || 3001;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
