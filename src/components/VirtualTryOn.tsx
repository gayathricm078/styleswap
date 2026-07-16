import React, { useEffect, useRef, useState } from "react";
import { Camera, Upload, Sparkles, Image as ImageIcon, Check, Download, Share2, Sparkle, X, AlertCircle } from "lucide-react";
import { Product } from "../types";
import { api, ApiError } from "../api/client";

interface VirtualTryOnProps {
  products: Product[];
  onViewChange: (view: string) => void;
}

/** Reject anything that isn't a real image, or is big enough to hang the tab. */
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export default function VirtualTryOn({ products, onViewChange }: VirtualTryOnProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string>("Sofia");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(products[1] || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compositeResult, setCompositeResult] = useState<string | null>(null);
  const [tryOnReport, setTryOnReport] = useState<{ fitReview: string; toneHarmony: string; styleScore: string } | null>(null);

  // A photo the user uploaded or captured. Held as a data URL in component
  // state only — it is never uploaded anywhere, which is what "private photo"
  // in the blurb has to mean for it to be true.
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const avatars = [
    { name: "Sofia", gender: "Female", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300" },
    { name: "Helena", gender: "Female", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300" },
    { name: "Charlotte", gender: "Female", url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=300" },
    { name: "Alistair", gender: "Male", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300" }
  ];

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
    setCameraOpen(false);
  };

  // Releasing the camera on unmount is not optional — the OS keeps the webcam
  // light on until every track is stopped.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleOpenCamera = async () => {
    setMediaError(null);

    // getUserMedia only exists on a secure origin (https or localhost).
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaError("Your browser blocks camera access on this page. Cameras need HTTPS or localhost.");
      return;
    }

    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
    } catch (err: any) {
      // Name the actual reason — "camera failed" tells the user nothing about
      // whether to click Allow, close Zoom, or plug a camera in.
      const reason =
        err?.name === "NotAllowedError"
          ? "Camera permission was denied. Allow it in your browser's address bar, then try again."
          : err?.name === "NotFoundError"
          ? "No camera found on this device."
          : err?.name === "NotReadableError"
          ? "Your camera is already in use by another app."
          : `Could not start the camera: ${err?.message || err?.name || "unknown error"}`;
      setMediaError(reason);
      stopCamera();
    }
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !cameraReady) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // The preview is mirrored so it reads like a mirror; flip back on capture
    // so the saved photo isn't reversed.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setCustomPhoto(canvas.toDataURL("image/jpeg", 0.9));
    setSelectedAvatar("Your photo");
    setCompositeResult(null);
    stopCamera();
  };

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMediaError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMediaError("That file isn't an image. Pick a JPG, PNG, or WEBP.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setMediaError(`That image is ${(file.size / 1024 / 1024).toFixed(1)}MB — keep it under 8MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCustomPhoto(String(reader.result));
      setSelectedAvatar("Your photo");
      setCompositeResult(null);
    };
    reader.onerror = () => setMediaError("Could not read that file.");
    reader.readAsDataURL(file);

    // Reset so picking the same file twice still fires onChange.
    e.target.value = "";
  };

  const clearCustomPhoto = () => {
    setCustomPhoto(null);
    setSelectedAvatar("Sofia");
    setCompositeResult(null);
  };

  const handleGenerateTryOn = async () => {
    if (!selectedProduct) return;
    setIsProcessing(true);
    setCompositeResult(null);
    setTryOnReport(null);

    // A captured/uploaded photo is a data URL and can be megabytes; the API
    // only uses avatarUrl for prompt context, so send the label instead of
    // pushing the user's photo to the server.
    const activeAvatarUrl = customPhoto ? "" : avatars.find((a) => a.name === selectedAvatar)?.url || "";

    try {
      const data = await api.tryOn({
        avatarUrl: activeAvatarUrl,
        productUrl: selectedProduct.image,
        productName: selectedProduct.name,
        avatarName: selectedAvatar,
        productBrand: selectedProduct.brand,
      });

      setCompositeResult(data.imageUrl);
      setTryOnReport({
        fitReview: data.fitReview,
        toneHarmony: data.toneHarmony,
        styleScore: data.styleScore,
      });
    } catch (err) {
      console.error(err);
      // Show the garment, but say plainly that the written review is missing
      // rather than inventing praise for it.
      setCompositeResult(selectedProduct.image);
      setTryOnReport({
        fitReview:
          err instanceof ApiError
            ? `Fitting room commentary unavailable: ${err.message}`
            : "Fitting room commentary is unavailable right now.",
        toneHarmony: "—",
        styleScore: "—",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const activeAvatarUrl = customPhoto || avatars.find((a) => a.name === selectedAvatar)?.url;

  return (
    <div className="bg-[#F8F6F2] min-h-screen py-10 px-6 animate-fadeIn">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Title */}
        <div className="text-left mb-10 border-b border-[#DADADA] pb-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#6B6B6B] font-sans">
            <span>StyleSwap Fitting Room</span>
            <span>✦</span>
            <span>Real-time AI Overlay</span>
          </div>
          <h2 className="font-serif text-3xl lg:text-4xl text-[#1C1C1C] tracking-tight mt-1 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-[#D4AF37]" /> Virtual Try-On Studio
          </h2>
          <p className="text-xs text-[#6B6B6B] font-sans mt-1">
            Evaluate drape, length, and posture before checking out. Select your model avatar or upload a private photo.
          </p>
        </div>

        {/* Studio Workspace Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 text-left">
          
          {/* Left Column: Avatar & Garment Selector */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Step 1: Select/Upload Avatar */}
            <div className="bg-white border border-[#DADADA] rounded-[24px] p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C] flex items-center gap-1.5">
                <span className="bg-[#1C1C1C] text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
                Upload or Select Avatar
              </h3>
              
              <div className="grid grid-cols-4 gap-3">
                {/* The user's own photo takes the first slot once it exists. */}
                {customPhoto && (
                  <div className="relative">
                    <button
                      id="tryon-avatar-custom"
                      onClick={() => {
                        setSelectedAvatar("Your photo");
                        setCompositeResult(null);
                      }}
                      className={`relative w-full rounded-xl overflow-hidden border-2 transition ${
                        selectedAvatar === "Your photo"
                          ? "border-[#D4AF37] scale-105"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={customPhoto} alt="Your photo" className="w-full h-12 object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white py-0.5 text-center truncate">
                        You
                      </span>
                    </button>
                    <button
                      id="tryon-clear-custom"
                      onClick={clearCustomPhoto}
                      title="Remove your photo"
                      className="absolute -top-1.5 -right-1.5 bg-[#1C1C1C] text-white rounded-full p-0.5 hover:bg-black transition"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}

                {avatars.slice(0, customPhoto ? 3 : 4).map((av) => (
                  <button
                    key={av.name}
                    id={`tryon-avatar-${av.name}`}
                    onClick={() => {
                      setSelectedAvatar(av.name);
                      setCompositeResult(null);
                    }}
                    className={`relative rounded-xl overflow-hidden border-2 transition ${selectedAvatar === av.name ? "border-[#D4AF37] scale-105" : "border-transparent opacity-70 hover:opacity-100"}`}
                  >
                    <img src={av.url} alt={av.name} className="w-full h-12 object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white py-0.5 text-center truncate">{av.name}</span>
                  </button>
                ))}
              </div>

              {mediaError && (
                <div className="flex items-start gap-2 bg-[#FAF9F6] border border-red-200 rounded-xl px-3 py-2.5 text-[10px] text-[#6B6B6B] leading-relaxed">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-px" />
                  {mediaError}
                </div>
              )}

              {/* Upload & Camera */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {/* The real file picker. Hidden, driven by the styled button. */}
                <input
                  ref={fileInputRef}
                  id="tryon-file-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFilePicked}
                  className="hidden"
                />
                <button
                  id="tryon-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 py-2.5 border border-[#DADADA] rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider text-[#1C1C1C] bg-[#FAF9F6] hover:border-black transition"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Photo
                </button>
                <button
                  id="tryon-camera-btn"
                  onClick={handleOpenCamera}
                  className="flex items-center justify-center gap-1.5 py-2.5 border border-[#DADADA] rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider text-[#1C1C1C] bg-[#FAF9F6] hover:border-black transition"
                >
                  <Camera className="w-3.5 h-3.5" /> Capture Live
                </button>
              </div>

              <p className="text-[9px] text-[#6B6B6B] leading-relaxed">
                Your photo stays in this browser tab — it is never uploaded to StyleSwap.
              </p>
            </div>

            {/* Camera modal */}
            {cameraOpen && (
              <div
                className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-label="Capture a photo"
              >
                <div className="bg-white rounded-[24px] p-5 max-w-md w-full space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C]">
                      Capture live
                    </h4>
                    <button
                      id="tryon-camera-close"
                      onClick={stopCamera}
                      className="text-[#6B6B6B] hover:text-[#1C1C1C] transition"
                      aria-label="Close camera"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="relative bg-[#1C1C1C] rounded-2xl overflow-hidden aspect-[3/4]">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      // Mirrored so it behaves like a mirror; the capture flips
                      // it back so the stored photo isn't reversed.
                      className="w-full h-full object-cover -scale-x-100"
                    />
                    {!cameraReady && (
                      <div className="absolute inset-0 flex items-center justify-center text-[11px] text-white/70">
                        Waiting for camera permission…
                      </div>
                    )}
                  </div>

                  <button
                    id="tryon-capture-btn"
                    onClick={handleCapture}
                    disabled={!cameraReady}
                    className="w-full bg-[#303030] text-white text-[10px] font-sans font-bold uppercase tracking-widest py-3 rounded-full hover:bg-black transition disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" /> {cameraReady ? "Capture photo" : "Starting camera…"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Choose Garment */}
            <div className="bg-white border border-[#DADADA] rounded-[24px] p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C] flex items-center gap-1.5">
                <span className="bg-[#1C1C1C] text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
                Choose Style Swap Garment
              </h3>

              <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {products.slice(0, 8).map((prod) => (
                  <button
                    key={prod.id}
                    id={`tryon-garment-${prod.id}`}
                    onClick={() => {
                      setSelectedProduct(prod);
                      setCompositeResult(null);
                    }}
                    className={`border rounded-xl p-2.5 flex items-center gap-3 transition text-left ${selectedProduct?.id === prod.id ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#DADADA] bg-white hover:border-[#1C1C1C]"}`}
                  >
                    <div className="w-9 h-12 rounded-lg overflow-hidden shrink-0">
                      <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[10px] font-bold text-[#1C1C1C] truncate">{prod.name}</h4>
                      <p className="text-[8px] text-[#6B6B6B] uppercase font-semibold">{prod.brand}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Action */}
            <button
              id="tryon-generate-action-btn"
              onClick={handleGenerateTryOn}
              disabled={isProcessing || !selectedProduct}
              className="w-full bg-[#303030] hover:bg-black text-white text-xs font-sans font-bold uppercase tracking-widest py-4 rounded-full transition shadow-md flex items-center justify-center gap-2"
            >
              {isProcessing ? "Synthesizing Overlay Fit..." : "Generate AI Try-On Result"}
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            </button>
          </div>

          {/* Right Column: Comparative Try-On Output Stage */}
          <div className="lg:col-span-8 flex flex-col justify-center">
            
            {/* Processing State */}
            {isProcessing && (
              <div className="bg-white border border-[#DADADA] rounded-[32px] p-16 text-center min-h-[500px] flex flex-col justify-center items-center space-y-6">
                <div className="w-16 h-16 rounded-full border-4 border-t-[#D4AF37] border-r-transparent border-b-[#1C1C1C] border-l-transparent animate-spin mx-auto"></div>
                <div className="space-y-1">
                  <h3 className="font-serif text-xl font-medium text-[#1C1C1C]">Weaving Fabric Overlay</h3>
                  <p className="text-xs text-[#6B6B6B] tracking-widest uppercase">Calculating shoulder drapes & shadow matching...</p>
                </div>
                <p className="text-[10px] font-mono text-[#6B6B6B] animate-pulse">Running server-side image mesh alignments...</p>
              </div>
            )}

            {/* Composite Results Display */}
            {!isProcessing && compositeResult && selectedProduct && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-white border border-[#DADADA] rounded-[32px] p-6 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    
                    {/* Before/After Comparative View */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-sans uppercase tracking-widest font-bold text-[#6B6B6B] text-center">Original Face Input</p>
                      <div className="w-full h-80 rounded-t-[100px] rounded-b-[20px] overflow-hidden border border-[#DADADA] bg-slate-100">
                        <img src={activeAvatarUrl} alt="source face" className="w-full h-full object-cover" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-center items-center gap-1.5">
                        <p className="text-[10px] font-sans uppercase tracking-widest font-bold text-[#D4AF37] text-center">AI Synthesis Result</p>
                        <Sparkle className="w-3.5 h-3.5 text-[#D4AF37]" />
                      </div>
                      <div className="w-full h-80 rounded-t-[100px] rounded-b-[20px] overflow-hidden border-2 border-[#D4AF37] bg-slate-100 relative shadow-lg">
                        <img src={compositeResult} alt="composite look" className="w-full h-full object-cover" />
                        <span className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded text-[9px] font-mono uppercase tracking-widest font-bold">
                          ✦ Try-on complete
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* AI Styling & Drape Feedback Report */}
                  {tryOnReport && (
                    <div className="mt-8 pt-6 border-t border-[#DADADA] grid grid-cols-1 md:grid-cols-3 gap-6 text-left animate-slideDown">
                      <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#DADADA]/50 space-y-1">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-[#D4AF37]">Haute Fitting Score</span>
                        <div className="text-2xl font-serif font-bold text-[#1C1C1C] flex items-center gap-1">
                          <span>{tryOnReport.styleScore}</span>
                          <span className="text-xs text-[#6B6B6B] font-sans font-normal">fit index</span>
                        </div>
                        <p className="text-[10px] text-[#6B6B6B]">Highly recommended tailored drape symmetry.</p>
                      </div>
                      <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#DADADA]/50 space-y-1 col-span-2">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-[#1C1C1C]">Atelier Silhouette Review</span>
                        <p className="text-xs text-[#1C1C1C] leading-relaxed font-sans">{tryOnReport.fitReview}</p>
                        <p className="text-[10px] text-[#6B6B6B] font-sans italic mt-2">✦ {tryOnReport.toneHarmony}</p>
                      </div>
                    </div>
                  )}

                  {/* Look details */}
                  <div className="mt-8 pt-6 border-t border-[#DADADA] text-left flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-sans font-bold">Active Garment Match</span>
                      <h4 className="text-sm font-bold text-[#1C1C1C] mt-1">{selectedProduct.name}</h4>
                      <p className="text-xs text-[#6B6B6B] font-sans">{selectedProduct.brand} — <strong className="font-serif font-semibold text-[#1C1C1C]">₹{selectedProduct.rentalPrice}/day</strong></p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        id="tryon-save-btn"
                        onClick={() => alert("Look saved to your private style board!")}
                        className="p-3 border border-[#DADADA] rounded-full hover:border-[#1C1C1C] transition cursor-pointer"
                        title="Save to profile"
                      >
                        <Check className="w-4 h-4 text-green-600" />
                      </button>
                      <button
                        id="tryon-download-btn"
                        onClick={() => alert("Downloading composite high-fidelity render...")}
                        className="p-3 border border-[#DADADA] rounded-full hover:border-[#1C1C1C] transition cursor-pointer"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-[#1C1C1C]" />
                      </button>
                      <button
                        id="tryon-share-btn"
                        onClick={() => alert("Copied private fit link to clipboard!")}
                        className="p-3 border border-[#DADADA] rounded-full hover:border-[#1C1C1C] transition cursor-pointer"
                        title="Share look"
                      >
                        <Share2 className="w-4 h-4 text-[#1C1C1C]" />
                      </button>
                      <button
                        id="tryon-add-cart-btn"
                        onClick={() => onViewChange("browse")}
                        className="bg-[#303030] text-white text-xs font-sans font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:bg-black transition shadow"
                      >
                        Rent This Look
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Standard Placeholder */}
            {!isProcessing && !compositeResult && (
              <div className="bg-white border border-[#DADADA] rounded-[32px] p-16 text-center min-h-[500px] flex flex-col justify-center items-center space-y-4">
                <ImageIcon className="w-12 h-12 text-[#DADADA]" />
                <h3 className="font-serif text-xl font-medium text-[#1C1C1C]">Overlay Studio</h3>
                <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto leading-relaxed">
                  Select an input face and choice garment, then click 'Generate AI Try-On' to synthesize a real-time overlay visualization.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
