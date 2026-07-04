import React, { useState, useRef } from "react";
import api from "../services/api";
import { Upload, X, Star, ArrowLeft, ArrowRight, Image as ImageIcon, AlertCircle } from "lucide-react";

export default function ImageUpload({ images = [], onChange, maxImages = 5 }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
    const extension = file.name.split(".").pop().toLowerCase();
    
    if (!allowedExtensions.includes(extension)) {
      return "Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.";
    }
    
    if (file.size > 10 * 1024 * 1024) {
      return "File size exceeds 10MB limit.";
    }
    
    return null;
  };

  const handleUpload = async (files) => {
    setError("");
    const validFiles = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      validFiles.push(file);
    }

    if (images.length + validFiles.length > maxImages) {
      setError(`Maximum ${maxImages} images are allowed.`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const uploadedList = [...images];
      
      for (const file of validFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api.post("/images/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          },
        });

        const data = response.data?.data || response.data;
        if (data && data.secureUrl) {
          const isFirst = uploadedList.length === 0;
          uploadedList.push({
            imageUrl: data.secureUrl,
            publicId: data.publicId,
            isPrimary: isFirst,
            displayOrder: uploadedList.length,
          });
        }
      }

      onChange(uploadedList);
    } catch (err) {
      console.error(err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const removeImage = (indexToRemove) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    // If the primary image was removed, assign a new primary
    if (images[indexToRemove]?.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    // Re-adjust displayOrder
    const final = updated.map((img, idx) => ({
      ...img,
      displayOrder: idx,
    }));
    onChange(final);
  };

  const setPrimaryImage = (indexToPrimary) => {
    const updated = images.map((img, idx) => ({
      ...img,
      isPrimary: idx === indexToPrimary,
    }));
    onChange(updated);
  };

  const moveImage = (index, direction) => {
    const newIndex = direction === "left" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;

    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    // Reset displayOrder values
    const final = updated.map((img, idx) => ({
      ...img,
      displayOrder: idx,
    }));
    onChange(final);
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      {images.length < maxImages && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
            dragActive
              ? "border-green-600 bg-green-50/50"
              : "border-gray-300 hover:border-green-500 hover:bg-gray-50"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
            accept="image/jpeg,image/jpg,image/png,image/webp"
          />
          
          <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
            <Upload size={28} className={uploading ? "animate-bounce" : ""} />
          </div>
          
          <div>
            <p className="font-extrabold text-green-950 text-sm">
              Click to upload or drag & drop files here
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supports JPEG, JPG, PNG, WEBP (Max 10MB per file)
            </p>
          </div>
        </div>
      )}

      {/* Progress & Error Handling */}
      {uploading && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
          <div className="flex justify-between text-xs font-bold text-gray-500">
            <span>Uploading images to Cloudinary...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-green-600 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold">
          <AlertCircle className="text-red-500" size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Gallery List */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative group border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white hover:shadow-md transition"
            >
              <img
                src={img.imageUrl}
                alt={`Uploaded ${idx + 1}`}
                className="w-full h-28 object-cover"
              />

              {/* Action overlays */}
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-md transition"
                  title="Remove image"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Primary badge or star button */}
              <div className="absolute top-2 left-2">
                <button
                  type="button"
                  onClick={() => setPrimaryImage(idx)}
                  className={`p-1.5 rounded-full shadow-md transition ${
                    img.isPrimary
                      ? "bg-yellow-500 text-white"
                      : "bg-white/80 hover:bg-white text-gray-400 hover:text-yellow-500"
                  }`}
                  title={img.isPrimary ? "Primary Image" : "Make Primary"}
                >
                  <Star size={14} fill={img.isPrimary ? "white" : "none"} />
                </button>
              </div>

              {/* Reordering Controls */}
              <div className="flex items-center justify-between p-2 bg-gray-50 border-t border-gray-100">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveImage(idx, "left")}
                  className={`p-1 rounded hover:bg-gray-200 transition ${
                    idx === 0 ? "opacity-30 cursor-not-allowed" : "text-gray-600"
                  }`}
                >
                  <ArrowLeft size={14} />
                </button>
                <span className="text-[10px] font-black text-gray-400 uppercase">
                  Order {idx + 1}
                </span>
                <button
                  type="button"
                  disabled={idx === images.length - 1}
                  onClick={() => moveImage(idx, "right")}
                  className={`p-1 rounded hover:bg-gray-200 transition ${
                    idx === images.length - 1 ? "opacity-30 cursor-not-allowed" : "text-gray-600"
                  }`}
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
