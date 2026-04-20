import { useEffect, useState } from "react";
import { Plus, Search, Pin, PanelLeft } from "lucide-react";
import { useListResources, useListCollections, getListResourcesQueryKey } from "@workspace/api-client-react";
import { Sidebar } from "@/components/Sidebar";
import { ResourceCard } from "@/components/ResourceCard";
import { ResourceModal } from "@/components/ResourceModal";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Auth } from "@/components/Auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useDebounce } from "@/hooks/use-debounce";
import { useIsMobile } from "@/hooks/use-mobile";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

const STORAGE_KEY = "noetica:app-state";

function readStoredState() {
    if (typeof window === "undefined")
        return {};
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    }
    catch {
        return {};
    }
}

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
export default function App() {
    const [storedState] = useState(() => readStoredState());
    const isMobile = useIsMobile();
    const [currentType, setCurrentType] = useState(storedState.currentType);
    const [currentCollection, setCurrentCollection] = useState(storedState.currentCollection);
    const [currentTag, setCurrentTag] = useState(storedState.currentTag);
    const [search, setSearch] = useState(storedState.search || "");
    const debouncedSearch = useDebounce(search, 300);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState(null);
    const [user, setUser] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(Boolean(storedState.isSidebarOpen));

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };
    const { data: resourcesData, isLoading } = useListResources({
        type: currentType,
        collectionId: currentCollection,
        tags: currentTag,
        search: debouncedSearch || undefined
    }, { query: { queryKey: getListResourcesQueryKey({ type: currentType, collectionId: currentCollection, tags: currentTag, search: debouncedSearch || undefined }) } });
    const { data: collectionsData } = useListCollections();
    const resources = toArray(resourcesData);
    const collections = toArray(collectionsData);
    useEffect(() => {
        if (typeof window === "undefined")
            return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
            currentType,
            currentCollection,
            currentTag,
            search,
            isSidebarOpen,
        }));
    }, [currentType, currentCollection, currentTag, search, isSidebarOpen]);
    useEffect(() => {
        if (!isMobile) {
            setIsSidebarOpen(false);
        }
    }, [isMobile]);
    const handleOpenModal = (resource) => {
        setSelectedResource(resource || null);
        setIsModalOpen(true);
    };
    // Sort resources to put pinned ones first
    const sortedResources = [...resources].sort((a, b) => b.id - a.id);
    const pinnedResources = sortedResources.filter(r => r.pinned);
    const unpinnedResources = sortedResources.filter(r => !r.pinned);
    if (!user) {
        return <Auth onLogin={setUser}/>;
    }

    return (<div className="min-h-[100dvh] w-full lg:flex text-white selection:bg-white/20">
      <AnimatedBackground />

      <Sidebar className="hidden lg:flex" user={user} onLogout={handleLogout} currentType={currentType} onSelectType={setCurrentType} currentCollection={currentCollection} onSelectCollection={setCurrentCollection} currentTag={currentTag} onSelectTag={setCurrentTag}/>

      <Drawer open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <DrawerContent className="max-h-[90dvh] border-white/10 bg-[#090914]/95 text-white backdrop-blur-2xl lg:hidden">
          <DrawerHeader className="border-b border-white/10 text-left">
            <DrawerTitle className="text-white">Browse Filters</DrawerTitle>
          </DrawerHeader>
          <Sidebar className="h-[calc(90dvh-5rem)] w-full border-0 bg-transparent" user={user} onLogout={handleLogout} currentType={currentType} onSelectType={setCurrentType} currentCollection={currentCollection} onSelectCollection={setCurrentCollection} currentTag={currentTag} onSelectTag={setCurrentTag} onInteract={() => setIsSidebarOpen(false)}/>
        </DrawerContent>
      </Drawer>

      <main className="relative flex min-h-[100dvh] flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-10 bg-gradient-to-b from-[#0a0a1a] via-[#0a0a1a]/90 to-transparent px-3 py-2.5 sm:px-5 sm:py-4 lg:px-6">
          <div className="mx-auto flex max-w-7xl items-center gap-2 sm:gap-3">
            <Button type="button" variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="h-10 w-10 shrink-0 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 lg:hidden">
              <PanelLeft className="h-4 w-4"/>
            </Button>
            <div className="relative mx-auto w-full max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 sm:w-5 sm:h-5"/>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your knowledge base..." className="h-10 w-full rounded-xl border-white/10 bg-white/5 pl-10 text-sm text-white shadow-xl backdrop-blur-md placeholder:text-white/40 focus-visible:border-white/20 focus-visible:ring-1 focus-visible:ring-white/20 sm:h-12 sm:rounded-2xl sm:pl-12 sm:text-lg"/>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-3 pb-24 pt-1 custom-scrollbar sm:px-5 lg:px-6">
          <div className="max-w-7xl mx-auto">
            {isLoading ? (<div className="flex items-center justify-center h-64 text-white/40">
                <div className="animate-pulse">Divining knowledge...</div>
              </div>) : (pinnedResources.length > 0 || unpinnedResources.length > 0) ? (
                <div className="space-y-10">
                  {pinnedResources.length > 0 && (
                    <div>
                      <h3 className="mb-4 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/50 sm:text-sm">
                        <Pin className="w-4 h-4 text-amber-300" /> Pinned
                      </h3>
                      <div className="grid auto-rows-max grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5">
                        {pinnedResources.map((resource, i) => {
                          const parentCollection = collections.find(c => c.id === resource.collectionId);
                          return (
                            <ResourceCard 
                              key={resource.id} 
                              resource={resource} 
                              collection={parentCollection} 
                              index={i} 
                              onClick={() => handleOpenModal(resource)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {unpinnedResources.length > 0 && (
                    <div>
                      {pinnedResources.length > 0 && (
                        <h3 className="mb-4 px-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/50 sm:text-sm">
                          All Resources
                        </h3>
                      )}
                      <div className="grid auto-rows-max grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5">
                        {unpinnedResources.map((resource, i) => {
                          const parentCollection = collections.find(c => c.id === resource.collectionId);
                          return (
                            <ResourceCard 
                              key={resource.id} 
                              resource={resource} 
                              collection={parentCollection} 
                              index={i} 
                              onClick={() => handleOpenModal(resource)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (<div className="flex flex-col items-center justify-center h-64 text-white/40 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-white/20"/>
                </div>
                <p className="text-lg font-serif">No resources found.</p>
                <p className="text-sm">The void echoes back empty.</p>
              </div>)}
          </div>
        </div>

        <button onClick={() => handleOpenModal()} className="group absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-2xl transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14">
          <Plus className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90 sm:h-6 sm:w-6"/>
        </button>
      </main>

      <ResourceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} resource={selectedResource} collections={collections}/>
    </div>);
}
