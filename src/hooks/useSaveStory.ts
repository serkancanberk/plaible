import { useState } from "react";
import { useAuth } from "./useAuth";
import { useToast } from "../components/ui/Toast";

export const useSaveStory = (storySlug: string) => {
  const [loading, setLoading] = useState(false);
  const { isSaved, toggleSaved } = useAuth();
  const { showToast, ToastComponent } = useToast();

  // Phase 2: Centralized state - no local state, no individual API calls
  const isStorySaved = isSaved(storySlug);

  const toggleSave = async () => {
    if (!storySlug) return;
    
    setLoading(true);
    
    try {
      console.log('[SAVED_STATE][UI] Toggling save for:', storySlug);
      
      await toggleSaved(storySlug);
      
      // Show feedback based on new state
      if (isStorySaved) {
        showToast("Story removed from your library.", "info");
      } else {
        showToast("Story saved to your library.", "success");
      }
    } catch (err) {
      console.error("[SAVED_STATE][UI] Toggle failed:", err);
      showToast("Couldn't save this story. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return { 
    isSaved: isStorySaved, 
    loading, 
    toggleSave, 
    ToastComponent 
  };
};
