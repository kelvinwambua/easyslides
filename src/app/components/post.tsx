"use client"

import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { client } from "@/lib/client"
import { Sparkles, FilePenIcon, Loader2, Download, AlertCircle, CheckCircle } from "lucide-react"

export const SlideGenerator = () => {
  const [prompt, setPrompt] = useState<string>("")
  const [slideCount, setSlideCount] = useState<number>(5)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { mutate: generateSlides, isPending } = useMutation({
    mutationFn: async () => {
      setError(null)
      setSuccessMessage(null)
      const res = await client.slides.generateFromPrompt.$post({ 
        prompt, 
        slideCount,
        includeCharts: true,
        includeImages: true
      })
      return await res.json()
    },
    onSuccess: async (data) => {
      if (data.success) {
        try {
          // Create a blob from the base64 data
          const byteCharacters = atob(data.data.presentation as string);
          const byteNumbers = new Array(byteCharacters.length);
          
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], {
            type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
          });
          
          // Create a URL for the blob
          const blobUrl = URL.createObjectURL(blob);
          
          // Create download link
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = data.data.filename || 'presentation.pptx';
          document.body.appendChild(link);
          link.click();
          
          // Clean up
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
          
          setPrompt("")
          setSuccessMessage(`Presentation created successfully with ${data.data.slideCount} slides!`);
          
          if (data.data.usedFallback) {
            setError("Note: Using mock data due to API limits or parsing issues")
          }
        } catch (error) {
          const downloadError = error as Error;
          console.error('Error creating download:', downloadError);
          setError(`Generated presentation but failed to download: ${downloadError.message}`);
        }
      } else {
        setError(`Failed to generate presentation: ${data.message}`);
      }
    },
    onError: (error) => {
      console.error("Error generating slides:", error);
      setError("Failed to generate slides. Please try again later.");
    }
  });

  return (
    <div className="w-full max-w-md backdrop-blur-xl bg-black/30 px-8 py-8 rounded-xl text-zinc-100 space-y-5 border border-white/10 shadow-xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="size-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <FilePenIcon className="size-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-300">AI Slide Creator</h2>
      </div>
      
      {error && (
        <div className="bg-red-900/30 border border-red-500/40 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-fade-in">
          <AlertCircle className="size-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-emerald-900/30 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle className="size-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (prompt.trim()) {
            generateSlides()
          }
        }}
        className="flex flex-col gap-5"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300 flex items-center gap-1.5">
            <Sparkles className="size-3.5" />
            Presentation Topic
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Enter your presentation topic or idea..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full text-base/6 rounded-lg bg-black/50 hover:bg-black/60 focus-visible:outline-none ring-1 ring-white/10 focus:ring-indigo-500/70 focus:bg-black/70 transition-all duration-200 h-12 px-4 py-2 text-zinc-100 placeholder:text-zinc-500"
            />
            {prompt.trim() && (
              <button 
                type="button" 
                onClick={() => setPrompt("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <span className="sr-only">Clear</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
          <p className="text-xs text-zinc-400 px-1">Try "Digital Marketing Trends 2025" or "Team Building Activities"</p>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Slide Count</label>
          <div className="flex flex-col gap-2">
            <input
              type="range"
              min="1"
              max="20"
              value={slideCount}
              onChange={(e) => setSlideCount(parseInt(e.target.value))}
              className="w-full h-2 bg-black/70 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-zinc-400">
              <span>1</span>
              <span className="text-indigo-400 font-medium">{slideCount} slides</span>
              <span>20</span>
            </div>
          </div>
        </div>
        
        <button
          disabled={isPending || !prompt.trim()}
          type="submit"
          className="rounded-lg text-base/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 h-12 px-5 py-3 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300 group-hover:scale-105 group-active:scale-100"></div>
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-20 transition-opacity"></div>
          <span className="relative flex items-center justify-center gap-2 font-medium text-white">
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating Presentation...
              </>
            ) : (
              <>
                <Download className="size-4" />
                Generate & Download
              </>
            )}
          </span>
        </button>
        
        {!isPending && (
          <div className="text-center text-xs text-zinc-500">
            Instant generation • Professional designs • Ready to present
          </div>
        )}
      </form>
      
      {isPending && (
        <div className="pt-2">
          <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full w-3/4 animate-pulse"></div>
          </div>
          <div className="flex justify-between text-xs text-zinc-500 mt-2">
            <span>Generating slides...</span>
            <span>This may take a moment</span>
          </div>
        </div>
      )}
    </div>
  )
}