import React, { useState, useRef, useEffect } from "react";
import { Upload, Image as ImageIcon, Download, Loader2, Trash2, RefreshCw, Sun, Moon, Menu, X, Info, Heart, GraduationCap, User, Stethoscope } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";

type Tab = "remove-bg" | "about";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("remove-bg");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize dark mode from system preference
  useEffect(() => {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setIsDarkMode(true);
    }
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setOriginalImage(event.target?.result as string);
        setProcessedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBackground = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(originalImage);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append("image", blob, "image.png");

      const apiResponse = await fetch("/api/remove-bg", {
        method: "POST",
        body: formData,
      });

      const contentType = apiResponse.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await apiResponse.text();
        console.error("Unexpected response from server:", text);
        throw new Error("Server returned an invalid response. Please check if the backend is running.");
      }

      const data = await apiResponse.json();

      if (!apiResponse.ok) {
        throw new Error(data.error || "Failed to process image");
      }

      setProcessedImage(data.image);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    const link = document.createElement("a");
    link.href = processedImage;
    link.download = "background-removed.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={cn(
      "min-h-screen font-sans transition-colors duration-300 selection:bg-blue-100 overflow-x-hidden",
      isDarkMode ? "bg-slate-950 text-slate-100 dark" : "bg-slate-50 text-slate-900"
    )}>
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "fixed top-0 left-0 bottom-0 w-72 z-50 shadow-2xl flex flex-col transition-colors",
              isDarkMode ? "bg-slate-900 border-r border-slate-800" : "bg-white border-r border-slate-200"
            )}
          >
            <div className="p-6 flex items-center justify-between border-b border-slate-200/10">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-1.5 rounded-lg">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg tracking-tight">BG Remover</span>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "p-2 rounded-xl transition-all active:scale-90",
                  isDarkMode ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100"
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              <button
                onClick={() => {
                  setActiveTab("remove-bg");
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all active:scale-95",
                  activeTab === "remove-bg"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : isDarkMode ? "text-slate-400 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <RefreshCw className="w-5 h-5" />
                Remove BG
              </button>
              <button
                onClick={() => {
                  setActiveTab("about");
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all active:scale-95",
                  activeTab === "about"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : isDarkMode ? "text-slate-400 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Info className="w-5 h-5" />
                About
              </button>
            </nav>

            <div className="p-6 border-t border-slate-200/10">
              <p className={cn(
                "text-[10px] font-bold uppercase tracking-widest text-center",
                isDarkMode ? "text-slate-500" : "text-slate-400"
              )}>
                Version 1.0.0
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className={cn(
        "sticky top-0 z-30 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between transition-colors",
        isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"
      )}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className={cn(
              "p-2 rounded-xl transition-all active:scale-90",
              isDarkMode ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100"
            )}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">BG Remover</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={cn(
              "p-2 rounded-xl transition-all active:scale-90",
              isDarkMode ? "text-yellow-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100"
            )}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          {originalImage && activeTab === "remove-bg" && (
            <button
              onClick={reset}
              className={cn(
                "transition-all active:scale-90 p-2 rounded-xl",
                isDarkMode ? "text-slate-400 hover:text-red-400 hover:bg-slate-800" : "text-slate-500 hover:text-red-500 hover:bg-slate-100"
              )}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === "remove-bg" ? (
            <motion.div
              key="remove-bg-tab"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {!originalImage ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                  <div className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center transition-colors",
                    isDarkMode ? "bg-slate-900" : "bg-blue-50"
                  )}>
                    <Upload className="w-10 h-10 text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Remove Backgrounds</h2>
                    <p className={cn(
                      "max-w-[280px] mx-auto transition-colors",
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    )}>
                      Upload a photo to instantly remove the background with AI precision.
                    </p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Select Image
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Preview Section */}
                  <div className="space-y-4">
                    <div className={cn(
                      "relative aspect-square rounded-3xl overflow-hidden shadow-inner border transition-colors",
                      isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-200 border-slate-200"
                    )}>
                      <AnimatePresence mode="wait">
                        {!processedImage ? (
                          <motion.img
                            key="original"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            src={originalImage}
                            alt="Original"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <motion.div
                            key="processed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={cn(
                              "w-full h-full relative bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')]",
                              isDarkMode ? "bg-slate-800" : "bg-slate-300"
                            )}
                          >
                            <img
                              src={processedImage}
                              alt="Processed"
                              className="w-full h-full object-contain relative z-10"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {isProcessing && (
                        <div className={cn(
                          "absolute inset-0 backdrop-blur-sm flex flex-col items-center justify-center z-20 transition-colors",
                          isDarkMode ? "bg-slate-950/60" : "bg-white/60"
                        )}>
                          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-2" />
                          <p className={cn(
                            "font-medium transition-colors",
                            isDarkMode ? "text-blue-400" : "text-blue-700"
                          )}>Removing background...</p>
                        </div>
                      )}
                    </div>

                    {/* Comparison Toggle / Info */}
                    <div className="flex justify-center">
                      <div className={cn(
                        "p-1 rounded-full flex gap-1 transition-colors",
                        isDarkMode ? "bg-slate-900" : "bg-slate-200/50"
                      )}>
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                          !processedImage 
                            ? (isDarkMode ? "bg-slate-800 text-blue-400 shadow-sm" : "bg-white text-blue-600 shadow-sm") 
                            : (isDarkMode ? "text-slate-500" : "text-slate-500")
                        )}>
                          Original
                        </span>
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                          processedImage 
                            ? (isDarkMode ? "bg-slate-800 text-blue-400 shadow-sm" : "bg-white text-blue-600 shadow-sm") 
                            : (isDarkMode ? "text-slate-500" : "text-slate-500")
                        )}>
                          Removed
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-4">
                    {error && (
                      <div className={cn(
                        "p-4 rounded-2xl text-sm font-medium border transition-colors",
                        isDarkMode ? "bg-red-950/30 text-red-400 border-red-900/50" : "bg-red-50 text-red-600 border-red-100"
                      )}>
                        {error}
                      </div>
                    )}

                    {!processedImage ? (
                      <button
                        disabled={isProcessing}
                        onClick={removeBackground}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-4 px-8 rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                        Remove Background
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={downloadImage}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Download className="w-5 h-5" />
                          Save
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className={cn(
                            "border font-semibold py-4 px-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2",
                            isDarkMode 
                              ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800" 
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          )}
                        >
                          <Upload className="w-5 h-5" />
                          New
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="about-tab"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8"
            >
              <div className="relative">
                <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/40 relative z-10">
                  <Stethoscope className="w-16 h-16 text-white" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-2 -right-2 bg-red-500 p-2 rounded-full shadow-lg z-20"
                >
                  <Heart className="w-4 h-4 text-white fill-current" />
                </motion.div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <p className={cn(
                    "text-sm font-bold uppercase tracking-[0.3em]",
                    isDarkMode ? "text-blue-400" : "text-blue-600"
                  )}>
                    Developer
                  </p>
                  <h2 className="text-4xl font-black tracking-tighter">MD. TAMIM</h2>
                </div>

                <div className={cn(
                  "flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border transition-colors",
                  isDarkMode ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-700"
                )}>
                  <GraduationCap className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold italic">Sher E Bangla Medical College</span>
                </div>

                <div className={cn(
                  "inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest",
                  isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-100 text-blue-700"
                )}>
                  54th Batch
                </div>
              </div>

              <p className={cn(
                "text-sm max-w-[240px] leading-relaxed",
                isDarkMode ? "text-slate-400" : "text-slate-500"
              )}>
                "Combining the precision of medicine with the creativity of technology."
              </p>

              <button
                onClick={() => setActiveTab("remove-bg")}
                className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-2"
              >
                Back to Remover
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
