import { Resource } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Pin } from "lucide-react";
import { resourceTypeColors, resourceTypeIcons } from "./Sidebar";
import { cn } from "@/lib/utils";

export function ResourceCard({ resource, onClick, index = 0 }: { resource: Resource; onClick: () => void; index?: number }) {
  const Icon = resourceTypeIcons[resource.type];
  const color = resourceTypeColors[resource.type];
  const tags = resource.tags ? resource.tags.split(",").map(t => t.trim()).filter(Boolean) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      onClick={onClick}
      className="glass-card rounded-xl p-5 cursor-pointer relative overflow-hidden group flex flex-col h-full"
      style={{ 
        "--hover-glow": color,
      } as React.CSSProperties}
    >
      <div 
        className="absolute top-0 left-0 w-full h-1 opacity-80" 
        style={{ backgroundColor: color }} 
      />
      
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br from-transparent via-transparent to-current" style={{ color }} />

      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="p-2 rounded-lg bg-white/5 backdrop-blur-md border border-white/10" style={{ color }}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        {resource.pinned && <Pin className="w-4 h-4 text-amber-300" fill="currentColor" />}
      </div>

      <h3 className="font-serif text-xl text-white mb-2 leading-tight group-hover:text-white/90 transition-colors line-clamp-2">
        {resource.title}
      </h3>
      
      {resource.description && (
        <p className="text-sm text-white/60 line-clamp-3 mb-4 flex-1">
          {resource.description}
        </p>
      )}
      
      {!resource.description && <div className="flex-1" />}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10 relative z-10">
          {tags.map((tag, i) => (
            <span key={i} className="text-xs px-2 py-1 rounded-md bg-white/5 text-white/50 border border-white/5 group-hover:border-white/10 transition-colors">
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
