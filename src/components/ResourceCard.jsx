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
    
    return (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }} onClick={handleCardClick} className="glass-card group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-xl p-4 sm:p-5" style={{
            "--hover-glow": color,
        }}>
      <div className="absolute top-0 left-0 w-full h-1 opacity-80" style={{ backgroundColor: color }}/>
      
      <div className="relative z-10 mb-4 flex w-full items-start justify-between gap-2">
        <div className="rounded-lg border border-white/10 bg-white/5 p-2 backdrop-blur-md" style={{ color }}>
          {Icon && <Icon className="w-5 h-5"/>}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button 
             onClick={(e) => { e.stopPropagation(); onClick(); }} 
             className="rounded-lg bg-white/10 p-1.5 text-white shadow-xl backdrop-blur-md transition-opacity hover:bg-white/20 lg:opacity-0 lg:group-hover:opacity-100"
          >
             <Edit2 className="w-4 h-4" />
          </button>
          <button 
             onClick={handleDelete} 
             className="rounded-lg bg-white/10 p-1.5 text-white shadow-xl backdrop-blur-md transition-opacity hover:bg-red-500/80 lg:opacity-0 lg:group-hover:opacity-100"
          >
             <Trash2 className="w-4 h-4" />
          </button>
          <button 
             onClick={handleTogglePin} 
             className={`rounded-lg bg-white/10 p-1.5 shadow-xl backdrop-blur-md transition-opacity ${resource.pinned ? 'text-amber-300 opacity-100 hover:bg-amber-500/80 hover:text-white' : 'text-white/70 hover:bg-white/20 hover:text-white lg:opacity-0 lg:group-hover:opacity-100 opacity-100'}`}
          >
             <Pin className="w-4 h-4" fill={resource.pinned ? "currentColor" : "none"}/>
          </button>
        </div>
      </div>

      <h3 className="mb-1.5 line-clamp-2 text-base leading-tight text-white transition-colors group-hover:text-white/90 sm:mb-2 sm:text-lg lg:text-xl">
        {resource.title}
      </h3>
      
      {resource.description && (<p className="mb-4 flex-1 text-xs text-white/60 line-clamp-2 sm:text-sm sm:line-clamp-3">
          {resource.description}
        </p>)}
      
      {!resource.description && <div className="flex-1"/>}

      {tags.length > 0 && (<div className="relative z-10 mt-auto flex flex-wrap gap-1.5 border-t border-white/10 pt-3 sm:gap-2 sm:pt-4">
          {tags.map((tag, i) => (<span key={i} className="text-[10px] px-2 py-0.5 rounded-md transition-colors font-medium border sm:text-xs sm:px-2.5 sm:py-1"
             style={{ backgroundColor: `${color}1A`, color: color, borderColor: `${color}33` }}>
              {tag}
            </span>))}
        </div>)}
    </motion.div>);
}
