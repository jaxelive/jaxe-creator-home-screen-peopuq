
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/app/integrations/supabase/client';

interface VideoProgress {
  video_id: string;
  completed: boolean;
  creator_handle: string;
}

export const useVideoProgress = (creatorHandle: string) => {
  const [videoProgress, setVideoProgress] = useState<VideoProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  const fetchVideoProgress = useCallback(async () => {
    if (!creatorHandle) return;
    
    try {
      const { data, error } = await supabase
        .from('user_video_progress')
        .select('*')
        .eq('creator_handle', creatorHandle);

      if (error) throw error;
      
      if (isMountedRef.current) {
        setVideoProgress(data || []);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching video progress:', error);
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [creatorHandle]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchVideoProgress();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchVideoProgress]);

  const isVideoWatched = useCallback((videoId: string): boolean => {
    return videoProgress.some(vp => vp.video_id === videoId && vp.completed);
  }, [videoProgress]);

  const getCourseProgress = useCallback((courseId: string, videos: any[]): { watched: number; total: number } => {
    const total = videos.length;
    const watched = videos.filter(video => isVideoWatched(video.id)).length;
    return { watched, total };
  }, [isVideoWatched]);

  const markVideoAsWatched = useCallback(async (videoId: string) => {
    if (!creatorHandle) return;

    try {
      const { error } = await supabase
        .from('user_video_progress')
        .upsert({
          creator_handle: creatorHandle,
          video_id: videoId,
          completed: true,
        }, {
          onConflict: 'creator_handle,video_id'
        });

      if (error) throw error;

      // Update local state immediately
      setVideoProgress(prev => {
        const existing = prev.find(vp => vp.video_id === videoId);
        if (existing) {
          return prev.map(vp => 
            vp.video_id === videoId ? { ...vp, completed: true } : vp
          );
        }
        return [...prev, { video_id: videoId, completed: true, creator_handle: creatorHandle }];
      });
    } catch (error) {
      console.error('Error marking video as watched:', error);
    }
  }, [creatorHandle]);

  const refetch = useCallback(() => {
    return fetchVideoProgress();
  }, [fetchVideoProgress]);

  return {
    videoProgress,
    loading,
    isVideoWatched,
    getCourseProgress,
    markVideoAsWatched,
    refetch,
  };
};
