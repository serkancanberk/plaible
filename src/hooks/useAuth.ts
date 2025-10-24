import { useContext } from 'react';
import { AuthContext } from '../context/AuthProvider';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // DATA_FLOW_DEBUG: Log context value when consumed
  console.log('[DATA_FLOW_DEBUG][HOOK] useAuth context consumed:', {
    hasUser: !!context.user,
    userId: context.user?._id,
    hasSavedStories: !!context.user?.savedStories,
    savedStoriesLength: context.user?.savedStories?.length || 0,
    savedStoriesStructure: context.user?.savedStories,
    timestamp: new Date().toISOString()
  });
  
  return context;
};
