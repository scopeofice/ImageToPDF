const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const pdfPoppler = require("pdf-poppler");
const { PDFDocument } = require("pdf-lib");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/processed", express.static("/tmp"));

const upload = multer({
  dest: "/tmp",
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDFs, PNG, JPG, and JPEG are allowed"));
    }
  },
});

const convertPDFToImages = async (pdfPath, outputDir) => {
  try {
    await fs.mkdir(outputDir, { recursive: true });
    const opts = {
      format: "png",
      out_dir: outputDir,
      out_prefix: path.basename(pdfPath, path.extname(pdfPath)),
      page: null,
    };
    await pdfPoppler.convert(pdfPath, opts);
    return (await fs.readdir(outputDir)).map((file) => path.join(outputDir, file));
  } catch (error) {
    console.error("Error converting PDF:", error);
    return [];
  }
};

const createPDFWithImages = async (imagePaths, outputFile) => {
  const pdfDoc = await PDFDocument.create();
  for (const imgPath of imagePaths) {
    const imgBytes = await fs.readFile(imgPath);
    let img = imgPath.endsWith(".png")
      ? await pdfDoc.embedPng(imgBytes)
      : await pdfDoc.embedJpg(imgBytes);

    const page = pdfDoc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(outputFile, pdfBytes);
};

app.post("/upload", upload.array("files"), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const processedImages = [];
  const outputPDFPath = `/tmp/${Date.now()}_merged.pdf`;

  for (const file of req.files) {
    if (file.mimetype === "application/pdf") {
      const outputDir = `/tmp/${path.basename(file.path)}`;
      const images = await convertPDFToImages(file.path, outputDir);
      processedImages.push(...images);
      await fs.unlink(file.path);
    } else {
      processedImages.push(file.path);
    }
  }

  if (processedImages.length === 0) {
    return res.status(500).json({ error: "File conversion failed" });
  }

  await createPDFWithImages(processedImages, outputPDFPath);

  res.json({ downloadUrl: `https://your-vercel-app.vercel.app/processed/${path.basename(outputPDFPath)}` });
});

module.exports = app;
