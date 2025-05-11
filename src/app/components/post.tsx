"use client"

import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { client } from "@/lib/client"

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
        slideCount 
      })
      return await res.json()
    },
    onSuccess: async (data) => {
      if (data.success) {
        try {
          // Create a blob from the base64 data
          // Fix: Ensure we're working with a string for atob()
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
          
          if (data.data.usedMockData) {
            setError("Note: Using mock data due to API limits or parsing issues")
          }
        } catch (error) {
          // Fix: Type the error properly
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
    <div className="w-full max-w-sm backdrop-blur-lg bg-black/15 px-8 py-6 rounded-md text-zinc-100/75 space-y-4">
      <h2 className="text-xl font-semibold">Easy Slides Generator</h2>
      
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-200 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-900/20 border border-green-500/30 text-green-200 px-3 py-2 rounded text-sm">
          {successMessage}
        </div>
      )}
      
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (prompt.trim()) {
            generateSlides()
          }
        }}
        className="flex flex-col gap-4"
      >
        <input
          type="text"
          placeholder="Enter presentation topic..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full text-base/6 rounded-md bg-black/50 hover:bg-black/75 focus-visible:outline-none ring-2 ring-transparent hover:ring-zinc-800 focus:ring-zinc-800 focus:bg-black/75 transition h-12 px-4 py-2 text-zinc-100"
        />
        
        <div className="flex items-center gap-2">
          <label className="text-sm">Number of slides:</label>
          <input
            type="number"
            min="1"
            max="20"
            value={slideCount}
            onChange={(e) => setSlideCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
            className="w-16 text-base/6 rounded-md bg-black/50 hover:bg-black/75 focus-visible:outline-none ring-2 ring-transparent hover:ring-zinc-800 focus:ring-zinc-800 focus:bg-black/75 transition h-10 px-2 py-1 text-zinc-100"
          />
        </div>
        
        <button
          disabled={isPending || !prompt.trim()}
          type="submit"
          className="rounded-md text-base/6 ring-2 ring-offset-2 ring-offset-black focus-visible:outline-none focus-visible:ring-zinc-100 ring-transparent hover:ring-zinc-100 h-12 px-10 py-3 bg-brand-700 text-zinc-800 font-medium bg-gradient-to-tl from-zinc-300 to-zinc-200 transition hover:bg-brand-800 disabled:opacity-50"
        >
          {isPending ? "Generating..." : "Generate Slides"}
        </button>
      </form>
    </div>
  )
}