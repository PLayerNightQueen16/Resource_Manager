import { useState, useEffect } from "react";
import { useCreateResource, useUpdateResource, useDeleteResource, useTogglePin, getListResourcesQueryKey, getGetStatsSummaryQueryKey, getGetPopularTagsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { resourceTypeColors } from "./Sidebar";
import { Pin, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
export function ResourceModal({ resource, isOpen, onClose, collections }) {
    const queryClient = useQueryClient();
    const createResource = useCreateResource();
    const updateResource = useUpdateResource();
    const deleteResource = useDeleteResource();
    const togglePinMutation = useTogglePin();
    const [formData, setFormData] = useState({
        title: "",
        type: "website",
        url: "",
        description: "",
        tags: "",
        content: "",
        author: "",
        collectionId: undefined,
        colorLabel: undefined,
    });
    const isEditing = !!resource;
    useEffect(() => {
        if (isOpen && resource) {
            setFormData({
                title: resource.title || "",
                type: resource.type || "website",
                url: resource.url || "",
                description: resource.description || "",
                tags: resource.tags || "",
                content: resource.content || "",
                author: resource.author || "",
                collectionId: resource.collectionId || undefined,
                colorLabel: resource.colorLabel || undefined,
            });
        }
        else if (isOpen && !resource) {
            setFormData({
                title: "",
                type: "website",
                url: "",
                description: "",
                tags: "",
                content: "",
                author: "",
                collectionId: undefined,
                colorLabel: undefined,
            });
        }
    }, [isOpen, resource]);
    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSubmit = { ...formData };
        if (dataToSubmit.collectionId === "none" || !dataToSubmit.collectionId) {
            dataToSubmit.collectionId = null;
        }
        else {
            dataToSubmit.collectionId = Number(dataToSubmit.collectionId);
        }
        if (isEditing && resource) {
            updateResource.mutate({ id: resource.id, data: dataToSubmit }, {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: getListResourcesQueryKey() });
                    queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
                    queryClient.invalidateQueries({ queryKey: getGetPopularTagsQueryKey() });
                    onClose();
                }
            });
        }
        else {
            createResource.mutate({ data: dataToSubmit }, {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: getListResourcesQueryKey() });
                    queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
                    queryClient.invalidateQueries({ queryKey: getGetPopularTagsQueryKey() });
                    onClose();
                }
            });
        }
    };
    const handleDelete = () => {
        if (!resource)
            return;
        if (window.confirm("Are you sure you want to delete this resource?")) {
            deleteResource.mutate({ id: resource.id }, {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: getListResourcesQueryKey() });
                    queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
                    queryClient.invalidateQueries({ queryKey: getGetPopularTagsQueryKey() });
                    onClose();
                }
            });
        }
    };
    const handleTogglePin = () => {
        if (!resource)
            return;
        togglePinMutation.mutate({ id: resource.id }, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getListResourcesQueryKey() });
                queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
            }
        });
    };
    
    const staticColorMap = { red: "#f87171", orange: "#fb923c", yellow: "#fbbf24", green: "#34d399", blue: "#60a5fa", purple: "#a78bfa" };
    const typeColor = formData.colorLabel ? staticColorMap[formData.colorLabel] : (resourceTypeColors[formData.type] || "white");
    
    return (<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[600px] bg-black/40 backdrop-blur-2xl border border-white/10 text-white shadow-2xl p-0 overflow-hidden" style={{ boxShadow: `0 0 40px -10px ${typeColor}20` }}>
        <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: typeColor }}/>
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
          <DialogHeader className="p-6 pb-4 border-b border-white/10">
            <div className="flex justify-between items-start">
              <DialogTitle className="text-2xl font-serif">{isEditing ? "Edit Resource" : "New Resource"}</DialogTitle>
              {isEditing && (<div className="flex items-center gap-2 mr-6">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-amber-300 hover:bg-white/5" onClick={handleTogglePin}>
                    <Pin className="h-4 w-4" fill={resource.pinned ? "currentColor" : "none"}/>
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-red-400 hover:bg-white/5" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4"/>
                  </Button>
                </div>)}
            </div>
          </DialogHeader>

          <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-white/60">Type</label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-1 focus:ring-white/20">
                    <SelectValue placeholder="Select type"/>
                  </SelectTrigger>
                  <SelectContent className="bg-[#15152a] border-white/10 text-white">
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="code">Code</SelectItem>
                    <SelectItem value="book">Book</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/60">Collection</label>
                <Select value={formData.collectionId?.toString() || "none"} onValueChange={(v) => setFormData({ ...formData, collectionId: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-1 focus:ring-white/20">
                    <SelectValue placeholder="No collection"/>
                  </SelectTrigger>
                  <SelectContent className="bg-[#15152a] border-white/10 text-white">
                    <SelectItem value="none">No collection</SelectItem>
                    {collections.map(c => (<SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/60">Title</label>
              <Input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="bg-white/5 border-white/10 text-white text-lg placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-white/20 font-serif" placeholder="A magical title..."/>
            </div>

            {['video', 'website', 'image', 'article', 'pdf', 'code'].includes(formData.type) && (<div className="space-y-2">
                <label className="text-sm text-white/60">URL or File</label>
                <div className="flex gap-2">
                  <Input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-white/20 font-mono text-sm flex-1" placeholder="https://..."/>
                  <div className="relative overflow-hidden w-[100px] h-10 border border-white/10 rounded-md bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer text-sm text-white/70">
                    Upload
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const fileUrl = URL.createObjectURL(e.target.files[0]);
                        setFormData({ ...formData, url: fileUrl });
                      }
                    }}/>
                  </div>
                </div>
              </div>)}

            {formData.type === 'book' && (<div className="space-y-2">
                <label className="text-sm text-white/60">Author</label>
                <Input value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-white/20"/>
              </div>)}

            {formData.type === 'note' ? (<div className="space-y-2">
                <label className="text-sm text-white/60">Content</label>
                <Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-white/20 min-h-[150px] font-sans" placeholder="Write your thoughts..."/>
              </div>) : (<div className="space-y-2">
                <label className="text-sm text-white/60">Description</label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-white/20 min-h-[80px]"/>
              </div>)}

            <div className="space-y-2">
              <label className="text-sm text-white/60">Tags (comma separated)</label>
              <Input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-white/20" placeholder="inspiration, tutorial, reference"/>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/60">Color Label</label>
              <div className="flex gap-2">
                {[
            { value: "red", color: "#f87171" },
            { value: "orange", color: "#fb923c" },
            { value: "yellow", color: "#fbbf24" },
            { value: "green", color: "#34d399" },
            { value: "blue", color: "#60a5fa" },
            { value: "purple", color: "#a78bfa" },
        ].map((c) => (<button key={c.value} type="button" onClick={() => setFormData({ ...formData, colorLabel: c.value })} className={cn("w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black", formData.colorLabel === c.value ? "scale-125 ring-2 ring-white" : "")} style={{ backgroundColor: c.color }}/>))}
                <button type="button" onClick={() => setFormData({ ...formData, colorLabel: undefined })} className={cn("w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-colors", !formData.colorLabel ? "ring-2 ring-white" : "")}>
                  <span className="text-[10px]">✕</span>
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-4 border-t border-white/10 flex justify-end gap-3 bg-white/5">
            <Button type="button" variant="ghost" onClick={onClose} className="text-white/60 hover:text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button type="submit" className="bg-white text-black hover:bg-white/90" disabled={createResource.isPending || updateResource.isPending}>
              {isEditing ? "Save Changes" : "Create Resource"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>);
}
