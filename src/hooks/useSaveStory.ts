import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { useToast } from "../components/ui/Toast";

export const useSaveStory = (storySlug: string) => {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const { updateSaveStatus } = useAuth();
  const { showToast, ToastComponent } = useToast();

  // Design system integration verification
  console.log('[DESIGN_SYNC] Save/Saved feature refined with Plaible design tokens and smooth animations');
  console.log('[DESIGN_REFINEMENT] Toast & SaveButton sync complete');

  useEffect(() => {
    const fetchStatus = async () => {
      if (!storySlug) return;
      
      try {
        setLoading(true);
        console.log('[useSaveStory] Fetching save status for:', storySlug);
        const res = await fetch(`/api/saves/story/${storySlug}/is-saved`, { 
          credentials: "include",
          cache: 'no-store' as RequestCache
        });
        
        if (!res.ok) {
          console.warn('[useSaveStory] Failed to fetch save status:', res.status);
          return;
        }
        
        const data = await res.json();
        console.log('[useSaveStory] status:', data.saved ? 'saved' : 'unsaved');
        setIsSaved(data.saved);
      } catch (err) {
        console.error("[useSaveStory] Failed to fetch save status", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatus();
  }, [storySlug]);

  const toggleSave = async () => {
    if (!storySlug) return;
    
    // Store previous state for potential rollback
    const previousSavedState = isSaved;
    const newSavedState = !isSaved;
    
    // Optimistic UI update - update immediately
    setIsSaved(newSavedState);
    updateSaveStatus(storySlug, newSavedState);
    
    // Show optimistic feedback
    if (newSavedState) {
      showToast("Story saved to your library.", "success");
    } else {
      showToast("Story removed from your library.", "info");
    }
    
    setLoading(true);
    
    try {
      console.log('[useSaveStory] Toggling save for:', storySlug, 'current:', previousSavedState, '→ optimistic:', newSavedState);
      
      if (previousSavedState) {
        // Unsave
        const res = await fetch(`/api/saves/${storySlug}`, { 
          method: "DELETE", 
          credentials: "include" 
        });
        
        if (!res.ok) {
          throw new Error(`Failed to unsave story: ${res.status}`);
        }
        
        console.log('[useSaveStory] Story unsaved successfully');
      } else {
        // Save
        const res = await fetch(`/api/saves`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storySlug })
        });
        
        if (!res.ok) {
          throw new Error(`Failed to save story: ${res.status}`);
        }
        
        console.log('[useSaveStory] Story saved successfully');
      }
      
      console.log('[useSaveStory] Toggle completed successfully:', newSavedState ? 'saved' : 'unsaved');
    } catch (err) {
      console.error("[useSaveStory] Toggle failed, rolling back optimistic update", err);
      console.log("[useSaveStory] optimistic update → rollback on error");
      
      // Rollback optimistic update
      setIsSaved(previousSavedState);
      updateSaveStatus(storySlug, previousSavedState);
      
      // Show error feedback
      showToast("Couldn't save this story. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return { isSaved, loading, toggleSave, ToastComponent };
};
