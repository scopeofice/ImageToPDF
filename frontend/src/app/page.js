"use client";
import { useState, useRef } from "react";
import axios from "axios";

const Home = () => {
  const [files, setFiles] = useState([]);
  const [pdfUrl, setPdfUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // Error message state
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    const validFiles = selectedFiles.filter((file) =>
      file.type.startsWith("image/") && (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/jpg")
    );

    setFiles((prevFiles) => [...prevFiles, ...validFiles]);
  };

  const handleUpload = async () => {
    setIsLoading(true);
    setErrorMessage(""); // Reset any previous error messages

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const response = await axios.post("https://image-to-pdf-backend.vercel.app/upload", formData, {
        responseType: "blob",
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      setPdfUrl(url);
    } catch (error) {
      console.error("Error uploading files:", error);
      setErrorMessage("Something went wrong. Try again after some time."); // Set error message
      setTimeout(() => {
        setErrorMessage(""); // Hide the error message after 3 seconds
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    setFiles([]);
    setPdfUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto mt-10 border-2 border-gray-300 shadow-lg rounded-xl">
      <h2 className="text-2xl font-semibold text-center mb-4">Upload Images</h2>

      <div className="mb-4">
        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
          Select Images (JPG, JPEG, PNG)
        </label>
        <input
          type="file"
          id="file-upload"
          multiple
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="block w-full text-sm text-gray-700 border border-dashed border-gray-300 p-4 rounded-lg cursor-pointer hover:border-blue-400 focus:outline-none"
        />
      </div>

      <div className="mt-4">
        <button
          onClick={handleUpload}
          className={`w-full p-3 bg-blue-500 text-white rounded-lg ${files.length === 0 ? "hidden" : "block"}`}
        >
          Generate PDF
        </button>
      </div>

      {/* Loading animation */}
      {isLoading && (
        <div className="flex justify-center items-center mt-4">
          <div className="w-8 h-8 border-4 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="mt-4 text-center text-red-500 font-semibold">
          {errorMessage}
        </div>
      )}

      {pdfUrl && (
        <div className="mt-4 text-center">
          <a
            href={pdfUrl}
            download="output.pdf"
            onClick={handleDownload}
            className="p-3 bg-green-500 text-white rounded-lg"
          >
            Download PDF
          </a>
        </div>
      )}

      <div className="mt-6">
        {files.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {files.map((file, index) => (
              <div key={index} className="w-24 h-24 border rounded-lg overflow-hidden">
                <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
