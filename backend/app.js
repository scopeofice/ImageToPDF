const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors({ origin: "*" }));

const upload = multer({ dest: "/tmp/" });

app.get("/", (req, res) => {
  res.send("It is working");
});

app.post("/upload", upload.array("files"), async (req, res) => {
  try {
    const files = req.files;
    const pdfDoc = await PDFDocument.create();

    for (const file of files) {
      const filePath = path.join("/tmp", file.filename);
      const fileMimeType = file.mimetype;

      if (fileMimeType === "image/jpeg" || fileMimeType === "image/jpg" || fileMimeType === "image/png") {
        const imgBytes = fs.readFileSync(filePath);
        let img;

        if (fileMimeType === "image/jpeg" || fileMimeType === "image/jpg") {
          img = await pdfDoc.embedJpg(imgBytes);
        } else if (fileMimeType === "image/png") {
          img = await pdfDoc.embedPng(imgBytes);
        }

        const pageWidth = 595.28;
        const imgAspectRatio = img.width / img.height;
        const imgWidth = Math.min(img.width, pageWidth);
        const imgHeight = imgWidth / imgAspectRatio;

        const page = pdfDoc.addPage([pageWidth, imgHeight]);
        page.drawImage(img, { x: 0, y: 0, width: imgWidth, height: imgHeight });
      
      } else if (fileMimeType === "application/pdf") {
        const existingPdfBytes = fs.readFileSync(filePath);
        const existingPdfDoc = await PDFDocument.load(existingPdfBytes);
        const copiedPages = await pdfDoc.copyPages(existingPdfDoc, existingPdfDoc.getPageIndices());

        copiedPages.forEach((page) => pdfDoc.addPage(page));
      }
    }

    const pdfBytes = await pdfDoc.save();
    res.contentType("application/pdf");
    res.send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error("Error processing files:", error);
    res.status(500).send("Error generating PDF");
  }
});

module.exports = app;
// app.listen(5000, () => console.log("Server running on port 5000"));





// const express = require("express");
// const cors = require("cors");
// const multer = require("multer");
// const { PDFDocument } = require("pdf-lib");
// const fs = require("fs");
// const path = require("path");

// const app = express();
// // app.use(cors());
// app.use(cors({ origin: "*" }));
// // const upload = multer({ dest: "uploads/" });
// const upload = multer({ dest: "/tmp/" });

// app.get("/",(req,res)=>{
//   res.send("It is working");
// })

// app.post("/upload", upload.array("files"), async (req, res) => {
//   try {
//     const files = req.files;
//     const pdfDoc = await PDFDocument.create();

//     for (const file of files) {
//       // const filePath = path.join(__dirname, "uploads", file.filename);
//       const filePath = path.join("/tmp", file.filename);
//       const fileMimeType = file.mimetype;

//       const imgBytes = fs.readFileSync(filePath);
//       let img;

//       // Embed JPG or PNG into the PDF
//       if (fileMimeType === "image/jpeg" || fileMimeType === "image/jpg") {
//         img = await pdfDoc.embedJpg(imgBytes);
//       } else if (fileMimeType === "image/png") {
//         img = await pdfDoc.embedPng(imgBytes);
//       } else {
//         continue; // Skip unsupported file types
//       }

//       // Create a new page for each image
//       const page = pdfDoc.addPage([img.width, img.height]);
//       page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });

//       // Cleanup uploaded image
//       // fs.unlinkSync(filePath);
//     }

//     const pdfBytes = await pdfDoc.save();
//     res.contentType("application/pdf");
//     res.send(Buffer.from(pdfBytes));

//   } catch (error) {
//     console.error("Error processing images:", error);
//     res.status(500).send("Error generating PDF");
//   }
// });

// // app.listen(5000, () => console.log("Server running on port 5000"));
// module.exports = app;