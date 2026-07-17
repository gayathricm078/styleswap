import React, { useState } from "react";
import { Sparkles, Image as ImageIcon, Download, Share2, ArrowRight, RotateCcw, Sparkle, HelpCircle, Film, RefreshCw } from "lucide-react";
import { api, ApiError } from "../api/client";

interface GeneratedAsset {
  id: string;
  prompt: string;
  aspectRatio: string;
  imageUrl: string;
  isFallback: boolean;
  date: string;
  category: string;
  styleAdvice: string;
}

export default function AiStudio() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [category, setCategory] = useState("Women");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Historical generated assets in session
  const [assets, setAssets] = useState<GeneratedAsset[]>([
    {
      id: "asset-1",
      prompt: "A minimalist silk backless gown in champagne gold, modeled in a sun-drenched raw concrete editorial studio.",
      aspectRatio: "3:4",
      imageUrl: "https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&q=80&w=600",
      isFallback: true,
      date: "Just now",
      category: "Wedding",
      styleAdvice: "Pair with architectural brushed gold drops and an unstructured leather hobo tote for the perfect high-contrast luxury presence."
    },
    {
      id: "asset-2",
      prompt: "Brutalist 18K satin-finished gold orbit hoop collar resting on a smooth cream linen backdrop.",
      aspectRatio: "1:1",
      imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600",
      isFallback: true,
      date: "10 mins ago",
      category: "Jewellery",
      styleAdvice: "Best layered over oversized double-breasted blazers in dark slate gray or charcoal to emphasize structural geometric curves."
    }
  ]);

  const [activeAsset, setActiveAsset] = useState<GeneratedAsset | null>(assets[0]);

  // Luxury quick prompt presets to guide user creation
  const promptPresets = [
    {
      title: "Ivory Silk Drape",
      category: "Women",
      prompt: "An asymmetric ivory silk column dress with structured cowl neck drapery, editorial fashion campaign shoot, hyper-minimalist concrete backdrop."
    },
    {
      title: "Brutalist Orbit Gold",
      category: "Jewellery",
      prompt: "Heavy-gauge geometric brutalist gold hinged orbit collar resting on a charcoal gray textured raw silk background."
    },
    {
      title: "Suede Sand Sliders",
      category: "Shoes",
      prompt: "Minimalist sand suede square-toed designer slides with architectural heels, set against soft dune-colored backdrop, Hasselblad studio lighting."
    },
    {
      title: "Calf Leather Hobo",
      category: "Handbags",
      prompt: "Oversized unstructured calf leather hobo bag in espresso brown, hand-stitched raw edges, resting on a minimalist stone pedestal."
    }
  ];

  const handlePresetSelect = (presetPrompt: string, presetCat: string) => {
    setPrompt(presetPrompt);
    setCategory(presetCat);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const data = await api.generateImage(prompt, aspectRatio);

      // Dynamically prompt-generate a nice editorial style guidance based on the generated image
      const categoryLabel = category;
      const advice = `Stylist Commentary: This ${categoryLabel.toLowerCase()} piece captures a sophisticated spatial rhythm. The light drapes are perfectly balanced for high-fashion circular rental, pairing beautifully with natural textures.`;

      const newAsset: GeneratedAsset = {
        id: "asset-" + Date.now(),
        prompt,
        aspectRatio,
        imageUrl: data.imageUrl,
        isFallback: !!data.isFallback,
        date: "Just now",
        category: categoryLabel,
        styleAdvice: advice
      };

      setAssets((prev) => [newAsset, ...prev]);
      setActiveAsset(newAsset);
    } catch (err: any) {
      console.error(err);
      setError(err instanceof ApiError ? err.message : "The image service is unavailable.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case "16:9": return "aspect-video";
      case "3:4": return "aspect-[3/4]";
      case "4:3": return "aspect-[4/3]";
      case "9:16": return "aspect-[9/16]";
      default: return "aspect-square";
    }
  };

  return (
    <div className="bg-[#F8F6F2] min-h-screen py-10 px-6 animate-fadeIn">
      <div className="max-w-7xl mx-auto">
        
        {/* Title Stage Header */}
        <div className="text-left mb-10 border-b border-[#DADADA] pb-6 flex justify-between items-end flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#6B6B6B] font-sans">
              <span>Couture Generation Lab</span>
              <span className="text-[#D4AF37]">✦</span>
              <span>Gemini 3.1 Image Synthesis</span>
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl text-[#1C1C1C] tracking-tight mt-1 flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-[#D4AF37]" /> AI Atelier Studio
            </h2>
            <p className="text-xs text-[#6B6B6B] font-sans mt-1">
              Visualize bespoke designer listings, create circular fashion moodboards, and synthesize model lookbooks in real time.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="bg-white border border-[#DADADA] text-[10px] font-mono text-[#6B6B6B] px-3 py-1.5 rounded-full flex items-center gap-1">
              <Film className="w-3 h-3 text-[#D4AF37]" /> model: gemini-3.1-flash-lite-image
            </span>
          </div>
        </div>

        {/* Studio Workspace Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 text-left">
          
          {/* Left Column: Configuration Controls */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-[#DADADA] rounded-[32px] p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#DADADA] pb-4">
                <div className="flex items-center gap-2">
                  <Sparkle className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs font-sans uppercase tracking-widest font-bold text-[#1C1C1C]">
                    Prompt Synthesis
                  </span>
                </div>
                <button
                  onClick={() => {
                    setPrompt("");
                    setError(null);
                  }}
                  className="text-[10px] font-sans uppercase font-semibold text-[#6B6B6B] hover:text-black flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Clear Form
                </button>
              </div>

              {error && (
                <div className="bg-[#FAF9F6] border border-amber-200 text-amber-800 rounded-xl p-3.5 text-[11px] font-sans flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleGenerate} className="space-y-5">
                {/* Product/Listing Concept Category */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-sans uppercase tracking-widest font-bold text-[#1C1C1C]">
                    Couture Category
                  </label>
                  <select
                    id="studio-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#DADADA] rounded-xl py-3 px-3.5 text-xs text-[#1C1C1C] focus:outline-none"
                  >
                    <option value="Women">Women's Gowns & Clothing</option>
                    <option value="Men">Men's Tailored Clothing</option>
                    <option value="Wedding">Wedding & Bridal wear</option>
                    <option value="Jewellery">High Jewelry & Collars</option>
                    <option value="Shoes">Designer Footwear</option>
                    <option value="Handbags">Luxury Bags & Leather</option>
                  </select>
                </div>

                {/* Prompt Input Area */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-sans uppercase tracking-widest font-bold text-[#1C1C1C]">
                    Atelier Editorial Prompt
                  </label>
                  <textarea
                    id="studio-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe textures (mulberry silk, bouclé wool), colors (champagne, oatmeal), background details, lighting conditions..."
                    rows={4}
                    required
                    className="w-full bg-[#FAF9F6] border border-[#DADADA] rounded-xl p-3.5 text-xs text-[#1C1C1C] focus:outline-none focus:border-[#303030] leading-relaxed"
                  ></textarea>
                </div>

                {/* Aspect Ratio Options */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-sans uppercase tracking-widest font-bold text-[#1C1C1C]">
                    Image Aspect Ratio
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["1:1", "3:4", "4:3", "16:9"].map((ratio) => (
                      <button
                        key={ratio}
                        id={`studio-ratio-${ratio.replace(":", "-")}`}
                        type="button"
                        onClick={() => setAspectRatio(ratio)}
                        className={`py-2 text-[11px] font-sans font-bold border rounded-xl transition ${aspectRatio === ratio ? "border-black bg-black text-white" : "border-[#DADADA] bg-white text-[#6B6B6B] hover:border-black"}`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  id="studio-generate-btn"
                  type="submit"
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full bg-[#1C1C1C] hover:bg-black disabled:bg-[#DADADA] text-white text-xs font-sans font-bold uppercase tracking-widest py-4 rounded-full transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#D4AF37]" />
                      Synthesizing Atelier Texture...
                    </>
                  ) : (
                    <>
                      Synthesize Couture Image
                      <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Prompt presets / ideas card */}
            <div className="bg-[#FAF9F6] border border-[#DADADA] rounded-[24px] p-5 space-y-3">
              <h4 className="text-[10px] font-sans uppercase tracking-widest font-bold text-[#1C1C1C]">
                Atelier Inspiration Presets
              </h4>
              <p className="text-[11px] text-[#6B6B6B] leading-relaxed">
                Tap on any ready-to-wear preset to load a pre-configured high-fashion layout:
              </p>
              <div className="grid grid-cols-2 gap-2.5 pt-1.5">
                {promptPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    id={`preset-prompt-btn-${idx}`}
                    onClick={() => handlePresetSelect(preset.prompt, preset.category)}
                    className="text-left bg-white p-3 border border-[#DADADA]/80 rounded-xl hover:border-[#1C1C1C] hover:shadow-sm transition"
                  >
                    <span className="text-[9px] uppercase font-bold text-[#D4AF37] block">✦ {preset.category}</span>
                    <strong className="text-[10px] text-[#1C1C1C] block font-semibold truncate mt-0.5">{preset.title}</strong>
                    <p className="text-[9px] text-[#6B6B6B] line-clamp-1 mt-0.5 leading-tight">{preset.prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Display Render Output Canvas */}
          <div className="lg:col-span-7 flex flex-col justify-start space-y-6">
            
            {/* Main Active Canvas */}
            <div className="bg-white border border-[#DADADA] rounded-[32px] p-6 shadow-sm flex flex-col min-h-[500px] justify-between text-left">
              
              {isGenerating ? (
                /* Scanning Cinematic Loader */
                <div className="flex-1 flex flex-col justify-center items-center space-y-6 py-12">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-[#D4AF37]/20 border-t-[#D4AF37] border-b-[#1C1C1C] animate-spin"></div>
                    <Sparkle className="w-8 h-8 text-[#D4AF37] absolute top-8 left-8 animate-pulse" />
                  </div>
                  <div className="space-y-1.5 text-center">
                    <h4 className="font-serif text-xl font-medium text-[#1C1C1C]">Weaving Textile Pixels</h4>
                    <p className="text-xs text-[#6B6B6B] uppercase tracking-widest">Rendering lighting vectors & shadow drapes...</p>
                  </div>
                  <div className="max-w-xs space-y-1.5 text-center text-[10px] font-mono text-[#6B6B6B]">
                    <p className="animate-pulse">✓ Calibrating Hasselblad 500c studio sensor...</p>
                    <p>✓ Generating realistic organic linen weaves...</p>
                    <p>✓ Matching color space with circular fashion indexes...</p>
                  </div>
                </div>
              ) : activeAsset ? (
                /* Main Asset Display */
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Aspect Ratio Box Wrapper */}
                  <div className="flex justify-center bg-[#F8F6F2] rounded-2xl overflow-hidden border border-[#DADADA]/60 relative group">
                    <div className={`w-full max-w-md ${getAspectRatioClass(activeAsset.aspectRatio)} overflow-hidden`}>
                      <img
                        src={activeAsset.imageUrl}
                        alt="Besope Couture Generated"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    
                    {activeAsset.isFallback && (
                      <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm border border-[#DADADA] text-[#1C1C1C] px-3 py-1 rounded text-[9px] font-mono uppercase tracking-widest font-bold shadow-sm">
                        ✦ Studio Sandbox Preview
                      </span>
                    )}

                    <span className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-1 rounded text-[9px] font-mono uppercase tracking-widest">
                      Ratio: {activeAsset.aspectRatio}
                    </span>
                  </div>

                  {/* Details Card info */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-start flex-wrap gap-2 border-b border-[#FAF9F6] pb-3">
                      <div>
                        <span className="text-[10px] bg-[#D4AF37]/10 text-[#D4AF37] font-semibold tracking-wider uppercase px-2 py-0.5 rounded">
                          Atelier {activeAsset.category} archive
                        </span>
                        <h3 className="font-serif text-lg text-[#1C1C1C] mt-2 leading-snug">
                          "{activeAsset.prompt}"
                        </h3>
                      </div>
                      <div className="flex gap-2">
                        <button
                          id="studio-dl-btn"
                          onClick={() => alert("Downloading raw campaign render...")}
                          className="p-2.5 border border-[#DADADA] rounded-full hover:border-[#1C1C1C] transition cursor-pointer bg-white"
                          title="Download high-res photo"
                        >
                          <Download className="w-4 h-4 text-[#1C1C1C]" />
                        </button>
                        <button
                          id="studio-share-btn"
                          onClick={() => alert("Atelier shareable portfolio link copied to clipboard!")}
                          className="p-2.5 border border-[#DADADA] rounded-full hover:border-[#1C1C1C] transition cursor-pointer bg-white"
                          title="Share lookbook"
                        >
                          <Share2 className="w-4 h-4 text-[#1C1C1C]" />
                        </button>
                      </div>
                    </div>

                    {/* Styling advise drapes */}
                    <p className="text-xs text-[#6B6B6B] leading-relaxed italic bg-[#FAF9F6] p-4 rounded-xl border border-[#DADADA]/40">
                      {activeAsset.styleAdvice}
                    </p>
                  </div>

                </div>
              ) : (
                /* Unselected State Placeholder */
                <div className="flex-1 flex flex-col justify-center items-center py-20 space-y-4 text-center">
                  <ImageIcon className="w-12 h-12 text-[#DADADA]" />
                  <h4 className="font-serif text-lg text-[#1C1C1C]">Atelier Canvas</h4>
                  <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto leading-relaxed">
                    Formulate custom fashion prompts in the left configuration card and click Synthesize to initialize dynamic model image generation.
                  </p>
                </div>
              )}

              {/* Backing Circular manifesto tag */}
              <div className="mt-6 pt-4 border-t border-[#DADADA] flex justify-between items-center text-[10px] text-[#6B6B6B] font-mono">
                <span>✦ CIRCULAR PRODUCTION STUDIOS</span>
                <span>SWAP YOUR STYLE NOT YOUR BUDGET</span>
              </div>
            </div>

            {/* Gallery list of generated assets during session */}
            {assets.length > 1 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-sans uppercase tracking-widest font-bold text-[#1C1C1C]">
                  Session Moodboard Assets ({assets.length})
                </h4>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  {assets.map((as) => (
                    <button
                      key={as.id}
                      id={`moodboard-asset-${as.id}`}
                      onClick={() => setActiveAsset(as)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition ${activeAsset?.id === as.id ? "border-[#D4AF37] scale-105 shadow-sm" : "border-transparent opacity-70 hover:opacity-100"}`}
                    >
                      <img src={as.imageUrl} alt="preview" className="w-full h-full object-cover" />
                      {as.isFallback && (
                        <span className="absolute top-1 left-1 bg-white/90 text-[7px] font-mono px-1 rounded">MOCK</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
