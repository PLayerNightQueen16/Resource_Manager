import { cn } from "@/lib/utils";

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#0a0a1a]">
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full orb-1 blur-3xl opacity-40 mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full orb-2 blur-3xl opacity-30 mix-blend-screen" />
      <div className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full orb-3 blur-3xl opacity-30 mix-blend-screen" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
    </div>
  );
}
