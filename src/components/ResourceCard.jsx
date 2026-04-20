import { motion } from "framer-motion";
import { Pin, Edit2, Trash2 } from "lucide-react";
import { resourceTypeColors, resourceTypeIcons } from "./Sidebar";
import { useDeleteResource, useTogglePin, getListResourcesQueryKey, getGetStatsSummaryQueryKey, getGetPopularTagsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
export function ResourceCard({ resource, collection, onClick, index = 0 }) {
    const staticColorMap = { red: "#f87171", orange: "#fb923c", yellow: "#fbbf24", green: "#34d399", blue: "#60a5fa", purple: "#a78bfa" };
    const mappedResourceColor = staticColorMap[resource.colorLabel] || resource.colorLabel;
    const color = mappedResourceColor || collection?.color_label || resourceTypeColors[resource.type] || "#ffffff";
    const tags = resource.tags ? resource.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
    
    const Icon = resourceTypeIcons[resource.type];
    const queryClient = useQueryClient();
    const deleteResource = useDeleteResource();
    const togglePinMutation = useTogglePin();

    const handleTogglePin = (e) => {
        e.stopPropagation();
        togglePinMutation.mutate({ id: resource.id }, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getListResourcesQueryKey() });
                queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
                queryClient.invalidateQueries({ queryKey: getGetPopularTagsQueryKey() });
            }
        });
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this resource?")) {
            deleteResource.mutate(
                { id: resource.id },
                {
                    onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: getListResourcesQueryKey() });
                        queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
                        queryClient.invalidateQueries({ queryKey: getGetPopularTagsQueryKey() });
                    }
                }
            );
        }
    };
    
    const handleCardClick = () => {
        if (resource.url && resource.url !== 'localfile') {
            window.open(resource.url, '_blank', 'noopener,noreferrer');
        } else if (resource.type === 'book') {
            const googleBooksUrl = `https://www.google.com/search?tbm=bks&q=${encodeURIComponent(resource.title)}`;
            window.open(googleBooksUrl, '_blank', 'noopener,noreferrer');
        } else if (resource.type === 'note' && (resource.content || resource.description)) {
            const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${resource.title}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; background: #fafafa; }
                    .page { background: white; padding: 60px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px; min-height: 800px; }
                    h1 { color: #111; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 30px; font-weight: 500; font-family: Georgia, serif; }
                    .meta { color: #666; font-size: 0.9em; margin-bottom: 40px; }
                    .content { white-space: pre-wrap; font-size: 1.1em; }
                </style>
            </head>
            <body>
                <div class="page">
                    <h1>${resource.title}</h1>
                    ${resource.author ? `<div class="meta"><strong>Author:</strong> ${resource.author}</div>` : ''}
                    <div class="content">${resource.content || resource.description}</div>
                </div>
            </body>
            </html>`;
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const docUrl = URL.createObjectURL(blob);
            window.open(docUrl, '_blank', 'noopener,noreferrer');
        } else {
            onClick();
        }
    };
    
    return (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }} onClick={handleCardClick} className="glass-card rounded-xl p-5 cursor-pointer relative overflow-hidden group flex flex-col h-full" style={{
            "--hover-glow": color,
        }}>
      <div className="absolute top-0 left-0 w-full h-1 opacity-80" style={{ backgroundColor: color }}/>
      
      <div className="flex items-center justify-between mb-4 relative z-10 w-full gap-2">
        <div className="p-2 rounded-lg bg-white/5 backdrop-blur-md border border-white/10" style={{ color }}>
          {Icon && <Icon className="w-5 h-5"/>}
        </div>
        <div className="flex items-center gap-2">
          <button 
             onClick={(e) => { e.stopPropagation(); onClick(); }} 
             className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white shadow-xl backdrop-blur-md"
          >
             <Edit2 className="w-4 h-4" />
          </button>
          <button 
             onClick={handleDelete} 
             className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-white/10 hover:bg-red-500/80 text-white shadow-xl backdrop-blur-md"
          >
             <Trash2 className="w-4 h-4" />
          </button>
          <button 
             onClick={handleTogglePin} 
             className={`transition-opacity p-1.5 rounded-lg bg-white/10 ${resource.pinned ? 'opacity-100 text-amber-300 hover:bg-amber-500/80 hover:text-white' : 'opacity-0 group-hover:opacity-100 hover:bg-white/20 text-white/70 hover:text-white'} shadow-xl backdrop-blur-md`}
          >
             <Pin className="w-4 h-4" fill={resource.pinned ? "currentColor" : "none"}/>
          </button>
        </div>
      </div>

      <h3 className="font-serif text-xl text-white mb-2 leading-tight group-hover:text-white/90 transition-colors line-clamp-2">
        {resource.title}
      </h3>
      
      {resource.description && (<p className="text-sm text-white/60 line-clamp-3 mb-4 flex-1">
          {resource.description}
        </p>)}
      
      {!resource.description && <div className="flex-1"/>}

      {tags.length > 0 && (<div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10 relative z-10">
          {tags.map((tag, i) => (<span key={i} className="text-xs px-2.5 py-1 rounded-md transition-colors font-medium border"
             style={{ backgroundColor: `${color}1A`, color: color, borderColor: `${color}33` }}>
              {tag}
            </span>))}
        </div>)}
    </motion.div>);
}
