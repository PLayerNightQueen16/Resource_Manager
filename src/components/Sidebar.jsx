import { useState } from "react";
import { Sparkles, Hash, Pin, Video, Globe, Book, FileText, File, Image as ImageIcon, Trash2, Newspaper, Code2, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useListCollections, useCreateCollection, useDeleteCollection, useGetStatsSummary, useGetPopularTags, getListCollectionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
export const resourceTypeColors = {
    video: "var(--type-video)",
    website: "var(--type-website)",
    book: "var(--type-book)",
    pdf: "var(--type-pdf)",
    note: "var(--type-note)",
    image: "var(--type-image)",
    article: "var(--type-article, #60a5fa)",
    code: "var(--type-code, #f87171)",
};
export const resourceTypeIcons = {
    video: Video,
    website: Globe,
    book: Book,
    pdf: FileText,
    note: File,
    image: ImageIcon,
    article: Newspaper,
    code: Code2,
};
function toArray(value) {
    if (Array.isArray(value))
        return value;
    if (value && typeof value === "object") {
        const maybeData = value.data;
        if (Array.isArray(maybeData))
            return maybeData;
    }
    return [];
}
export function Sidebar({ user, onLogout, currentType, onSelectType, currentCollection, onSelectCollection, currentTag, onSelectTag, className, onInteract }) {
    const queryClient = useQueryClient();
    const { data: collectionsData } = useListCollections();
    const { data: statsData } = useGetStatsSummary();
    const { data: tagsData } = useGetPopularTags();
    const createCollection = useCreateCollection();
    const deleteCollection = useDeleteCollection();
    const [newCollectionName, setNewCollectionName] = useState("");
    const collections = toArray(collectionsData);
    const tags = toArray(tagsData);
    const rawStats = statsData && typeof statsData === "object" && "data" in statsData
        ? statsData.data
        : statsData;
    const stats = rawStats && typeof rawStats === "object" ? rawStats : undefined;
    const statsByType = stats?.byType && typeof stats.byType === "object" ? stats.byType : {};
    const statsTotal = typeof stats?.total === "number" ? stats.total : 0;
    const statsPinned = typeof stats?.pinned === "number" ? stats.pinned : 0;
    const handleCreateCollection = (e) => {
        e.preventDefault();
        if (!newCollectionName.trim())
            return;
        createCollection.mutate({ data: { name: newCollectionName.trim() } }, {
            onSuccess: () => {
                setNewCollectionName("");
                queryClient.invalidateQueries({ queryKey: getListCollectionsQueryKey() });
            }
        });
    };
    const handleDeleteCollection = (id, e) => {
        e.stopPropagation();
        deleteCollection.mutate({ id }, {
            onSuccess: () => {
                if (currentCollection === id)
                    onSelectCollection(undefined);
                queryClient.invalidateQueries({ queryKey: getListCollectionsQueryKey() });
            }
        });
    };
    const handleSelectCollection = (value) => {
        onSelectCollection(value);
        onInteract?.();
    };
    const handleSelectType = (value) => {
        onSelectType(value);
        onInteract?.();
    };
    const handleSelectTag = (value) => {
        onSelectTag(value);
        onInteract?.();
    };
    return (<aside className={cn("flex h-[100dvh] w-[280px] flex-shrink-0 flex-col border-r border-white/10 bg-black/20 backdrop-blur-xl", className)}>
      <div className="flex flex-col items-center justify-center gap-2 px-5 pb-4 pt-4 sm:gap-3 sm:px-8 sm:pt-8">
        <img src="/logo.jpg" alt="Noetica Logo" className="h-16 w-16 rounded-full object-contain shadow-[0_0_20px_rgba(255,255,255,0.15)] ring-1 ring-white/10 sm:h-24 sm:w-24 lg:h-32 lg:w-32" />
        <h1 className="text-xl tracking-wider text-white sm:text-2xl lg:text-3xl font-serif">Noetica</h1>
        {user && (
          <div className="flex flex-col items-center gap-1 mt-1">
            <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-medium">Voyager</span>
            <span className="text-xs text-white/60 font-medium tracking-wide">{user.username || user.email}</span>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 sm:px-4">
        <div className="space-y-6 pb-8">
          <div>
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 px-2">Collections</h2>
            <div className="space-y-1">
              <button onClick={() => handleSelectCollection(undefined)} className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-colors", !currentCollection ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white")}>
                All Resources
              </button>
              {collections.map(c => (<div key={c.id} className={cn("group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors", currentCollection === c.id ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white")} onClick={() => handleSelectCollection(c.id)}>
                  <span className="truncate">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40">{c.resourceCount}</span>
                    <button onClick={(e) => handleDeleteCollection(c.id, e)} className="text-white/40 transition-opacity hover:text-red-400 lg:opacity-0 lg:group-hover:opacity-100">
                      <Trash2 className="w-3 h-3"/>
                    </button>
                  </div>
                </div>))}
              <form onSubmit={handleCreateCollection} className="mt-2 px-1">
                <Input placeholder="+ New collection" value={newCollectionName} onChange={(e) => setNewCollectionName(e.target.value)} className="bg-transparent border-none h-8 text-sm placeholder:text-white/30 text-white/70 focus-visible:ring-0 focus-visible:bg-white/5"/>
              </form>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 px-2">Types</h2>
            <div className="space-y-1">
              {Object.entries(resourceTypeIcons).map(([type, Icon]) => (<button key={type} onClick={() => handleSelectType(currentType === type ? undefined : type)} className={cn("w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors", currentType === type ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white")}>
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" style={{ color: resourceTypeColors[type] }}/>
                    <span className="capitalize">{type}</span>
                  </div>
                  <span className="text-xs text-white/40">{statsByType[type] || 0}</span>
                </button>))}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 px-2">Tags</h2>
            <div className="flex flex-wrap gap-1 px-1">
              {tags.map((t) => (<button key={t.tag} onClick={() => handleSelectTag(currentTag === t.tag ? undefined : t.tag)} className={cn("px-2 py-1 rounded-md text-xs transition-colors flex items-center gap-1", currentTag === t.tag ? "bg-white/20 text-white" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white")}>
                  <Hash className="w-3 h-3 opacity-50"/>
                  {t.tag}
                </button>))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {stats && (<div className="border-t border-white/10 bg-white/5 p-4">
          <div className="flex justify-between items-center text-xs text-white/50 mb-3">
            <span>{statsTotal} total</span>
            <span className="flex items-center gap-1"><Pin className="w-3 h-3"/> {statsPinned} pinned</span>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-medium uppercase tracking-widest border border-red-500/10"
          >
            <LogOut className="w-3 h-3" />
            Logout
          </button>
        </div>)}
    </aside>);
}
