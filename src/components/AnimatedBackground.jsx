import { useMemo, memo } from "react";

export const AnimatedBackground = memo(function AnimatedBackground() {
    const blobs = useMemo(() => {
        return Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 100 + 150,
            color: ["#f87171", "#fbbf24", "#60a5fa", "#34d399", "#a78bfa"][i % 5],
            duration: Math.random() * 4 + 5,
            delay: Math.random() * -10, // Negative delay to start mid-animation
            xOffset: Math.random() * 30 - 15,
            yOffset: Math.random() * 30 - 15
        }));
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#0a0a1a]">
          <style>
             {blobs.map(blob => `
                 @keyframes float-${blob.id} {
                     0%, 100% { transform: translate(0vw, 0vh) scale(1); opacity: 0.15; }
                     50% { transform: translate(${blob.xOffset}vw, ${blob.yOffset}vh) scale(1.2); opacity: 0.25; }
                 }
             `).join('\n')}
          </style>
          
          {blobs.map((blob) => (
             <div
                key={blob.id}
                className="absolute rounded-full mix-blend-screen blur-[80px]"
                style={{
                    backgroundColor: blob.color,
                    width: `${blob.size}px`,
                    height: `${blob.size}px`,
                    top: `${blob.y}vh`,
                    left: `${blob.x}vw`,
                    animation: `float-${blob.id} ${blob.duration}s ease-in-out infinite ${blob.delay}s`
                }}
             />
          ))}
          <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.35)_1px,transparent_0)] [background-size:3px_3px]"/>
        </div>
    );
});
