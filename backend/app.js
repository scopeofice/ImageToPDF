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
app.use("/processed", express.static(path.join(__dirname, "processed")));

const upload = multer({
  dest: "uploads/",
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
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const opts = {
    format: "png",
    out_dir: outputDir,
    out_prefix: path.basename(pdfPath, path.extname(pdfPath)),
    page: null,
  };

  try {
    await pdfPoppler.convert(pdfPath, opts);
    return fs.readdirSync(outputDir).map((file) => path.join(outputDir, file));
  } catch (error) {
    console.error("Error converting PDF:", error);
    return [];
  }
};

const createPDFWithImages = async (imagePaths, outputFile) => {
  if (!fs.existsSync("processed")) {
    fs.mkdirSync("processed", { recursive: true });
  }

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
  fs.writeFileSync(outputFile, pdfBytes);
};

app.post("/upload", upload.array("files"), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const processedImages = [];
  const outputPDFPath = `processed/${Date.now()}_merged.pdf`;

  for (const file of req.files) {
    if (file.mimetype === "application/pdf") {
      const outputDir = `converted/${path.basename(file.path)}`;
      const images = await convertPDFToImages(file.path, outputDir);
      processedImages.push(...images);
      fs.unlinkSync(file.path);
    } else {
      processedImages.push(file.path);
    }
  }

  if (processedImages.length === 0) {
    return res.status(500).json({ error: "File conversion failed" });
  }

  await createPDFWithImages(processedImages, outputPDFPath);

  res.json({ downloadUrl: `http://localhost:5000/${outputPDFPath}` });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



// const express = require("express");
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");
// const pdfPoppler = require("pdf-poppler");
// const { PDFDocument } = require("pdf-lib");
// const cors = require("cors");

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use("/processed", express.static(path.join(__dirname, "processed")));


// const upload = multer({ dest: "uploads/" });

// const convertPDFToImages = async (pdfPath, outputDir) => {
//   if (!fs.existsSync(outputDir)) {
//     fs.mkdirSync(outputDir);
//   }

//   const opts = {
//     format: "png",
//     out_dir: outputDir,
//     out_prefix: path.basename(pdfPath, path.extname(pdfPath)),
//     page: null,
//   };

//   try {
//     await pdfPoppler.convert(pdfPath, opts);
//     return fs.readdirSync(outputDir).map((file) => path.join(outputDir, file));
//   } catch (error) {
//     console.error("Error converting PDF:", error);
//     return [];
//   }
// };

// const createPDFWithImages = async (imagePaths, outputFile) => {
//   const pdfDoc = await PDFDocument.create();
//   for (const imgPath of imagePaths) {
//     const imgBytes = fs.readFileSync(imgPath);
//     const img = await pdfDoc.embedPng(imgBytes);
//     const page = pdfDoc.addPage([img.width, img.height]);
//     page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
//   }
//   const pdfBytes = await pdfDoc.save();
//   fs.writeFileSync(outputFile, pdfBytes);
// };

// app.post("/uploadpdf", upload.array("pdfs"), async (req, res) => {
//   if (!req.files || req.files.length === 0) {
//     return res.status(400).json({ error: "No PDF files uploaded" });
//   }

//   const processedImages = [];
//   const outputPDFPath = `processed/${Date.now()}_merged.pdf`;

//   for (const file of req.files) {
//     const outputDir = `converted/${path.basename(file.path)}`;
//     const images = await convertPDFToImages(file.path, outputDir);
//     processedImages.push(...images);
//     fs.unlinkSync(file.path);
//   }

//   if (processedImages.length === 0) {
//     return res.status(500).json({ error: "PDF conversion failed" });
//   }

//   await createPDFWithImages(processedImages, outputPDFPath);

//   res.json({ downloadUrl: `http://localhost:5000/${outputPDFPath}` });
// });

// app.use(express.static("processed"));

// const PORT = 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
