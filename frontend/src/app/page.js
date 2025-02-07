"use client";
import { useState, useRef } from "react";
import axios from "axios";
import moment from "moment";

const Home = () => {
  const [files, setFiles] = useState([]);
  const [pdfUrl, setPdfUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(
      (file) => file.type.startsWith("image/") &&
        (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/jpg")
    );

    setFiles((prevFiles) => [...prevFiles, ...validFiles]);
  };

  const handleRemoveImage = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    setIsLoading(true);
    setErrorMessage("");
    setIsDisabled(true);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const response = await axios.post("http://localhost:5000/upload", formData, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      setPdfUrl(url);
    } catch (error) {
      console.error("Error uploading files:", error);
      setErrorMessage("Something went wrong. Try again after some time.");
      setIsDisabled(false);
      setTimeout(() => {
        setErrorMessage("");
      }, 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    setFiles([]);
    setIsDisabled(false);
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
          disabled={isDisabled}
          ref={fileInputRef}
          className="block w-full text-sm text-gray-700 border border-dashed border-gray-300 p-4 rounded-lg cursor-pointer hover:border-blue-400 focus:outline-none"
        />
      </div>

      <div className="mt-4">
        <button
          onClick={handleUpload}
          disabled={isDisabled}
          className={`w-full p-3 bg-blue-500 text-white rounded-lg ${files.length === 0 ? "hidden" : "block"}`}
        >
          Generate PDF
        </button>
      </div>

      {isLoading && (
        <div role="status" className="flex justify-center items-center w-full my-5">
          <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
          </svg>
        </div>
      )}

      {errorMessage && <div className="mt-4 text-center text-red-500 font-semibold">{errorMessage}</div>}

      {pdfUrl && (
        <div className="mt-4 text-center">
          <a href={pdfUrl} download={`File-${moment().format("MM-DD-YYYY HH:mm:ss")}`} onClick={handleDownload} className="p-3 bg-green-500 text-white rounded-lg">
            Download PDF
          </a>
        </div>
      )}
      <div className="mt-6">
        {files.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {files.map((file, index) => (
              <div key={index} className="relative w-24 h-24 border rounded-lg overflow-hidden">
                {!isDisabled && (
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"
                >
                  ✕
                </button>
                )}
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
