import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useListResources, useListCollections, getListResourcesQueryKey } from "@workspace/api-client-react";
import { Sidebar } from "@/components/Sidebar";
import { ResourceCard } from "@/components/ResourceCard";
import { ResourceModal } from "@/components/ResourceModal";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";

export default function App() {
  const [currentType, setCurrentType] = useState<string | undefined>();
  const [currentCollection, setCurrentCollection] = useState<number | undefined>();
  const [currentTag, setCurrentTag] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);

  const { data: resources = [], isLoading } = useListResources(
    { 
      type: currentType, 
      collectionId: currentCollection,
      tags: currentTag,
      search: debouncedSearch || undefined
    },
    { query: { queryKey: getListResourcesQueryKey({ type: currentType, collectionId: currentCollection, tags: currentTag, search: debouncedSearch || undefined }) } }
  );

  const { data: collections = [] } = useListCollections();

  const handleOpenModal = (resource?: any) => {
    setSelectedResource(resource || null);
    setIsModalOpen(true);
  };

  // Sort resources to put pinned ones first
  const sortedResources = [...resources].sort((a, b) => {
    if (a.pinned === b.pinned) return b.id - a.id;
    return a.pinned ? -1 : 1;
  });

  return (
    <div className="min-h-[100dvh] w-full flex text-white selection:bg-white/20">
      <AnimatedBackground />
      
      <Sidebar 
        currentType={currentType} 
        onSelectType={setCurrentType}
        currentCollection={currentCollection}
        onSelectCollection={setCurrentCollection}
        currentTag={currentTag}
        onSelectTag={setCurrentTag}
      />

      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative">
        <header className="p-6 sticky top-0 z-10 bg-gradient-to-b from-[#0a0a1a] to-transparent">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your knowledge base..." 
              className="w-full h-12 pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-2xl backdrop-blur-md focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/20 text-lg shadow-xl"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 pt-0 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64 text-white/40">
                <div className="animate-pulse">Divining knowledge...</div>
              </div>
            ) : sortedResources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
                {sortedResources.map((resource, i) => (
                  <ResourceCard 
                    key={resource.id} 
                    resource={resource} 
                    index={i}
                    onClick={() => handleOpenModal(resource)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-white/40 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-lg font-serif">No resources found.</p>
                <p className="text-sm">The void echoes back empty.</p>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={() => handleOpenModal()}
          className="absolute bottom-8 right-8 w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform group"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </main>

      <ResourceModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        resource={selectedResource}
        collections={collections}
      />
    </div>
  );
}
