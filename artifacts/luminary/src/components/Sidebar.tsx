import { useState } from "react";
import { Link } from "wouter";
import { Sparkles, Hash, Pin, Video, Globe, Book, FileText, File, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useListCollections, useCreateCollection, useDeleteCollection, useGetStatsSummary, useGetPopularTags, getListCollectionsQueryKey, getGetStatsSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export const resourceTypeColors: Record<string, string> = {
  video: "var(--type-video)",
  website: "var(--type-website)",
  book: "var(--type-book)",
  pdf: "var(--type-pdf)",
  note: "var(--type-note)",
  image: "var(--type-image)",
};

export const resourceTypeIcons: Record<string, any> = {
  video: Video,
  website: Globe,
  book: Book,
  pdf: FileText,
  note: File,
  image: ImageIcon,
};

export function Sidebar({ currentType, onSelectType, currentCollection, onSelectCollection, currentTag, onSelectTag }: { currentType?: string; onSelectType: (t?: string) => void; currentCollection?: number; onSelectCollection: (c?: number) => void; currentTag?: string; onSelectTag: (t?: string) => void; }) {
  const queryClient = useQueryClient();
  const { data: collections = [] } = useListCollections();
  const { data: stats } = useGetStatsSummary();
  const { data: tags = [] } = useGetPopularTags();
  const createCollection = useCreateCollection();
  const deleteCollection = useDeleteCollection();
  const [newCollectionName, setNewCollectionName] = useState("");

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    createCollection.mutate(
      { data: { name: newCollectionName.trim() } },
      {
        onSuccess: () => {
          setNewCollectionName("");
          queryClient.invalidateQueries({ queryKey: getListCollectionsQueryKey() });
        }
      }
    );
  };

  const handleDeleteCollection = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCollection.mutate({ id }, {
      onSuccess: () => {
        if (currentCollection === id) onSelectCollection(undefined);
        queryClient.invalidateQueries({ queryKey: getListCollectionsQueryKey() });
      }
    });
  };

  return (
    <div className="w-[260px] flex-shrink-0 h-[100dvh] flex flex-col border-r border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="p-6 flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
        <h1 className="text-2xl font-serif text-white tracking-wide">Luminary</h1>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-6 pb-8">
          <div>
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 px-2">Collections</h2>
            <div className="space-y-1">
              <button 
                onClick={() => onSelectCollection(undefined)}
                className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors", !currentCollection ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white")}
              >
                All Resources
              </button>
              {collections.map(c => (
                <div key={c.id} className={cn("group flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer", currentCollection === c.id ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white")} onClick={() => onSelectCollection(c.id)}>
                  <span className="truncate">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40">{c.resourceCount}</span>
                    <button onClick={(e) => handleDeleteCollection(c.id, e)} className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 transition-opacity">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              <form onSubmit={handleCreateCollection} className="mt-2 px-1">
                <Input 
                  placeholder="+ New collection" 
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="bg-transparent border-none h-8 text-sm placeholder:text-white/30 text-white/70 focus-visible:ring-0 focus-visible:bg-white/5"
                />
              </form>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 px-2">Types</h2>
            <div className="space-y-1">
              {Object.entries(resourceTypeIcons).map(([type, Icon]) => (
                <button
                  key={type}
                  onClick={() => onSelectType(currentType === type ? undefined : type)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                    currentType === type ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" style={{ color: resourceTypeColors[type] }} />
                    <span className="capitalize">{type}</span>
                  </div>
                  {stats && <span className="text-xs text-white/40">{stats.byType[type] || 0}</span>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 px-2">Tags</h2>
            <div className="flex flex-wrap gap-1 px-1">
              {tags.map((t: any) => (
                <button
                  key={t.tag}
                  onClick={() => onSelectTag(currentTag === t.tag ? undefined : t.tag)}
                  className={cn(
                    "px-2 py-1 rounded-md text-xs transition-colors flex items-center gap-1",
                    currentTag === t.tag ? "bg-white/20 text-white" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Hash className="w-3 h-3 opacity-50" />
                  {t.tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {stats && (
        <div className="p-4 border-t border-white/10 bg-white/5">
          <div className="flex justify-between items-center text-xs text-white/50">
            <span>{stats.total} total</span>
            <span className="flex items-center gap-1"><Pin className="w-3 h-3" /> {stats.pinned} pinned</span>
          </div>
        </div>
      )}
    </div>
  );
}
