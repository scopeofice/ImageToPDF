"use client";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import moment from "moment";

const MAX_FILES = 100;
const MAX_PREVIEW_FILES = 100;
const MAX_TOTAL_SIZE_MB = 50;

const Home = () => {
  const [previews, setPreviews] = useState([]);
  const [pdfUrl, setPdfUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef(null);
  const [fileList, setFileList] = useState([]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      previews.forEach((url) => url && URL.revokeObjectURL(url));
    };
  }, [previews]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    const validFiles = selectedFiles.filter((file) =>
      ["image/jpeg", "image/png", "image/jpg", "application/pdf"].includes(
        file.type
      )
    );

    if (fileList.length + validFiles.length > MAX_FILES) {
      setErrorMessage(`Maximum ${MAX_FILES} files allowed.`);
      return;
    }

    const newFiles = validFiles.map((file) => ({
      file,
      preview: file.type.startsWith("image") ? URL.createObjectURL(file) : null,
    }));

    setFileList((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index) => {
    const removed = fileList[index];

    if (removed.preview) URL.revokeObjectURL(removed.preview);

    setFileList((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (sizeInBytes) => {
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    else if (sizeInBytes < 1024 * 1024)
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    else return `${(sizeInBytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const handleUpload = async () => {
    if (isLoading || fileList.length === 0) return;

    const totalSizeMB =
      fileList.reduce((sum, item) => sum + item.file.size, 0) / 1024 / 1024;

    if (totalSizeMB > MAX_TOTAL_SIZE_MB) {
      setErrorMessage(
        "Total upload size too large. Reduce file count or size."
      );
      return;
    }

    setIsLoading(true);
    setIsDisabled(true);
    setErrorMessage("");

    const formData = new FormData();
    fileList.forEach((item) => formData.append("files", item.file));

    try {
      const response = await axios.post(
        "https://image-to-pdf-backend.vercel.app/upload",
        formData,
        {
          responseType: "blob",
          timeout: 60000,
        }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      setPdfUrl(url);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to generate PDF. Try again later.");
      setIsDisabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    previews.forEach((url) => url && URL.revokeObjectURL(url));

    setFileList([]);
    setPreviews([]);
    setPdfUrl("");
    setIsDisabled(false);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const totalSizeMB = (
    fileList.reduce((sum, item) => sum + item.file.size, 0) /
    1024 /
    1024
  ).toFixed(2);

  return (
    <div className="p-6 max-w-xl mx-auto mt-10 border-2 border-gray-300 shadow-lg rounded-xl">
      <h2 className="text-2xl font-semibold text-center mb-4">
        Upload Images / PDFs
      </h2>

      <input
        type="file"
        multiple
        accept="image/jpeg,image/png,image/jpg,application/pdf"
        disabled={isDisabled}
        ref={fileInputRef}
        onChange={handleFileChange}
        className="block w-full border p-4 rounded-lg cursor-pointer"
      />

      <p className="text-xs text-center mt-2 text-gray-600">
        Files: {fileList.length} / {MAX_FILES} | Total size: {totalSizeMB} MB /{" "}
        {MAX_TOTAL_SIZE_MB} MB
      </p>

      {fileList.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={isDisabled}
          className="w-full mt-4 p-3 bg-blue-500 text-white rounded-lg"
        >
          Generate PDF
        </button>
      )}

      {isLoading && (
        <p className="text-center mt-4 text-blue-600 font-semibold">
          Generating PDF...
        </p>
      )}

      {errorMessage && (
        <p className="text-center mt-4 text-red-500 font-semibold">
          {errorMessage}
        </p>
      )}

      {pdfUrl && (
        <div className="mt-4 text-center">
          <a
            href={pdfUrl}
            download={`Merged-${moment().format("MM-DD-YYYY_HH-mm")}.pdf`}
            onClick={handleDownload}
            className="p-3 bg-green-500 text-white rounded-lg"
          >
            Download PDF
          </a>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-4 justify-center">
        {fileList.map((item, index) => (
          <div
            key={index}
            className="relative w-28 h-32 border rounded-lg flex flex-col items-center justify-center p-2"
          >
            {!isDisabled && (
              <button
                onClick={() => handleRemoveFile(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
              >
                ✕
              </button>
            )}

            {item.file.type === "application/pdf" ? (
              <span className="text-red-500 text-xs font-semibold">PDF</span>
            ) : index < MAX_PREVIEW_FILES ? (
              <img
                src={item.preview}
                alt=""
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <span className="text-xs text-gray-400">Preview off</span>
            )}

            <p className="text-[10px] mt-1 text-center w-full">
              <span className="block truncate">{item.file.name}</span>
              <span className="block text-gray-500">
                {formatFileSize(item.file.size)}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
