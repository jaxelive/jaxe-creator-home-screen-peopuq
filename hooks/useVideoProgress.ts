
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/app/integrations/supabase/client';

interface VideoProgress {
  video_id: string;
  completed: boolean;
  watched_seconds: number;
  progress_percentage: number;
}

interface CourseProgress {
  completed: number;
  total: number;
}

interface UseVideoProgressReturn {
  videoProgress: VideoProgress[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getVideoProgress: (videoId: string) => VideoProgress | undefined;
  isVideoWatched: (videoId: string) => boolean;
  getCourseProgress: (courseId: string, courseVideos: { id: string }[]) => CourseProgress;
}

const CREATOR_HANDLE = 'avelezsanti';

export function useVideoProgress(courseVideos?: { id: string; duration_seconds: number | null }[]): UseVideoProgressReturn {
  const [videoProgress, setVideoProgress] = useState<VideoProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const courseVideosRef = useRef(courseVideos);

  // Update ref when courseVideos changes
  useEffect(() => {
    courseVideosRef.current = courseVideos;
  }, [courseVideos]);

  const fetchVideoProgress = useCallback(async () => {
    try {
      console.log('[useVideoProgress] 🔄 Fetching video progress for creator:', CREATOR_HANDLE);
      setLoading(true);
      setError(null);

      const { data: progressData, error: progressError } = await supabase
        .from('user_video_progress')
        .select('*')
        .eq('creator_handle', CREATOR_HANDLE);

      if (progressError) {
        console.error('[useVideoProgress] ❌ Error fetching video progress:', progressError);
        setError(progressError.message);
        setLoading(false);
        return;
      }

      console.log('[useVideoProgress] ✅ Video progress fetched:', progressData?.length || 0, 'records');
      console.log('[useVideoProgress] 📊 Progress data:', JSON.stringify(progressData, null, 2));

      // Calculate progress percentage for each video
      const progressWithPercentage = progressData?.map((p: any) => {
        let duration = 0;

        // Find duration from courseVideos if provided
        if (courseVideosRef.current) {
          const video = courseVideosRef.current.find(v => v.id === p.video_id);
          if (video?.duration_seconds) {
            duration = video.duration_seconds;
          }
        }

        const percentage = duration > 0
          ? Math.min(100, Math.round((p.watched_seconds / duration) * 100))
          : 0;

        const result = {
          video_id: p.video_id,
          completed: p.completed || false,
          watched_seconds: p.watched_seconds || 0,
          progress_percentage: percentage,
        };

        console.log(`[useVideoProgress] 📹 Video ${p.video_id.substring(0, 8)}... - Completed: ${result.completed}, Watched: ${result.watched_seconds}s`);

        return result;
      }) || [];

      setVideoProgress(progressWithPercentage);
      setLoading(false);
    } catch (err: any) {
      console.error('[useVideoProgress] ❌ Exception fetching video progress:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []); // Remove courseVideos from dependencies to prevent infinite loop

  useEffect(() => {
    fetchVideoProgress();
  }, [fetchVideoProgress]);

  const getVideoProgress = useCallback((videoId: string): VideoProgress | undefined => {
    const progress = videoProgress.find(p => p.video_id === videoId);
    console.log(`[useVideoProgress] 🔍 Getting progress for video ${videoId.substring(0, 8)}...`, progress ? `Completed: ${progress.completed}` : 'Not found');
    return progress;
  }, [videoProgress]);

  const isVideoWatched = useCallback((videoId: string): boolean => {
    const progress = videoProgress.find(p => p.video_id === videoId);
    const watched = progress?.completed || false;
    console.log(`[useVideoProgress] ✓ Is video ${videoId.substring(0, 8)}... watched?`, watched);
    return watched;
  }, [videoProgress]);

  const getCourseProgress = useCallback((courseId: string, courseVideos: { id: string }[]): CourseProgress => {
    const totalVideos = courseVideos.length;
    const watchedVideos = courseVideos.filter(video => {
      const progress = videoProgress.find(p => p.video_id === video.id);
      return progress?.completed || false;
    }).length;
    
    console.log(`[useVideoProgress] 📚 Course ${courseId.substring(0, 8)}... progress: ${watchedVideos}/${totalVideos}`);
    
    return {
      completed: watchedVideos,
      total: totalVideos,
    };
  }, [videoProgress]);

  return {
    videoProgress,
    loading,
    error,
    refetch: fetchVideoProgress,
    getVideoProgress,
    isVideoWatched,
    getCourseProgress,
  };
}
