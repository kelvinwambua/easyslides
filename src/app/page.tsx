import { cn } from "@/lib/utils"
import { SlideGenerator } from "./components/post"
import { GradientBg } from "./components/ui/gradient-bg"

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center relative isolate overflow-hidden">

      <GradientBg />
      
      <div className="absolute inset-0 -z-10 opacity-30 mix-blend-soft-light bg-[url('/noise.svg')] [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />

      <div className="absolute inset-0 -z-5">
        <div className="particle-container">
          {Array(6).fill(null).map((_, i) => (
            <div key={i} className={`floating-orb orb-${i+1}`} />
          ))}
        </div>
      </div>

      <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16 relative z-10">

        <div className="mb-2 size-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[1px] shadow-lg shadow-indigo-500/20">
          <div className="size-full rounded-2xl bg-black/80 flex items-center justify-center backdrop-blur-xl">
            <svg className="size-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 3L18 12L6 21V3Z" fill="currentColor" />
            </svg>
          </div>
        </div>
        

        <h1
          className={cn(
            "inline-flex tracking-tight flex-col gap-1 text-center animate-shimmer",
            "font-display text-5xl sm:text-6xl md:text-7xl font-bold leading-none",
            "bg-clip-text text-transparent bg-[linear-gradient(110deg,#fff,45%,#7b68ee,55%,#fff)] bg-[length:200%_100%]"
          )}
        >
          <span>SlideAI</span>
        </h1>
        

        <p className="text-zinc-300 text-lg/7 md:text-xl/8 text-pretty sm:text-wrap text-center max-w-2xl mb-8">
          Create stunning presentations instantly with our 
          <span className="px-1.5 py-0.5 mx-1 rounded bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white font-medium">AI-powered</span> 
          slide generator.
        </p>
        
 
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {["React", "Next.js", "TypeScript", "AI Powered"].map((tag) => (
            <span key={tag} className="px-3 py-1 text-xs font-medium rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 backdrop-blur-sm">
              {tag}
            </span>
          ))}
        </div>
        

        <div className="w-full max-w-md relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-1000"></div>
          <SlideGenerator />
        </div>
        
   
        <div className="mt-16 flex flex-col items-center">
          <p className="text-zinc-400 text-sm mb-3">Trusted by innovative teams</p>
          <div className="flex gap-6 opacity-70 grayscale hover:grayscale-0 transition">
            {["Acme", "Globex", "Initech", "Umbrella"].map((company) => (
              <span key={company} className="text-zinc-500 font-semibold">{company}</span>
            ))}
          </div>
        </div>
      </div>
      

      <footer className="w-full py-4 text-center text-zinc-500 text-sm">
        © 2025 SlideAI • Built with Next.js
      </footer>
    </main>
  )
}