const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pdfPoppler = require("pdf-poppler");
const { PDFDocument } = require("pdf-lib");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(), // Use memory storage instead of writing to disk
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDFs, PNG, JPG, and JPEG are allowed"));
    }
  },
});

const convertPDFToImages = async (pdfBuffer) => {
  const tempFilePath = "/tmp/temp.pdf";
  fs.writeFileSync(tempFilePath, pdfBuffer);

  const outputDir = "/tmp/output_images";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const opts = {
    format: "png",
    out_dir: outputDir,
    out_prefix: "converted_image",
    page: null,
  };

  try {
    await pdfPoppler.convert(tempFilePath, opts);
    return fs.readdirSync(outputDir).map((file) => path.join(outputDir, file));
  } catch (error) {
    console.error("Error converting PDF:", error);
    return [];
  }
};

const createPDFWithImages = async (imagePaths) => {
  const pdfDoc = await PDFDocument.create();
  for (const imgPath of imagePaths) {
    const imgBytes = fs.readFileSync(imgPath);
    let img;

    if (imgPath.endsWith(".png")) {
      img = await pdfDoc.embedPng(imgBytes);
    } else {
      img = await pdfDoc.embedJpg(imgBytes);
    }

    const page = pdfDoc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes; // Return the PDF buffer directly
};

app.post("/upload", upload.array("files"), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const processedImages = [];
  
  for (const file of req.files) {
    if (file.mimetype === "application/pdf") {
      const images = await convertPDFToImages(file.buffer); // Use file.buffer
      processedImages.push(...images);
    } else {
      // Directly add image buffers to processedImages
      processedImages.push(file.buffer);
    }
  }

  if (processedImages.length === 0) {
    return res.status(500).json({ error: "File conversion failed" });
  }

  const pdfBuffer = await createPDFWithImages(processedImages);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=merged.pdf");
  res.send(pdfBuffer); // Send PDF as response
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
