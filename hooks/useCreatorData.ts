
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/app/integrations/supabase/client';

export interface CreatorData {
  id: string;
  first_name: string;
  last_name: string;
  creator_handle: string;
  email: string;
  profile_picture_url: string | null;
  avatar_url: string | null;
  region: string | null;
  creator_type: string[] | null;
  diamonds_monthly: number;
  total_diamonds: number;
  diamonds_30d: number;
  live_days_30d: number;
  live_duration_seconds_30d: number;
  hours_streamed: number;
  graduation_status: string | null;
  silver_target: number | null;
  gold_target: number | null;
  assigned_manager_id: string | null;
  is_active: boolean;
}

export interface CreatorStats {
  monthlyDiamonds: number;
  totalDiamonds: number;
  liveDays: number;
  liveHours: number;
  diamondsToday: number;
  streak: number;
  currentProgress: number;
  remaining: number;
  nextTarget: string;
  targetAmount: number;
  currentStatus: string;
}

export function useCreatorData(creatorHandle?: string) {
  const [creator, setCreator] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCreatorData = useCallback(async () => {
    try {
      console.log('[useCreatorData] Starting fetch...', { creatorHandle });
      setLoading(true);
      setError(null);

      let query = supabase
        .from('creators')
        .select('*')
        .eq('is_active', true);

      if (creatorHandle) {
        console.log('[useCreatorData] Filtering by creator_handle:', creatorHandle);
        query = query.eq('creator_handle', creatorHandle);
      }

      // Use limit(1) and get first result instead of .single()
      const { data, error: fetchError } = await query.limit(1);

      if (fetchError) {
        console.error('[useCreatorData] Fetch error:', fetchError);
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      console.log('[useCreatorData] Query result:', { 
        dataLength: data?.length, 
        hasData: !!data && data.length > 0 
      });

      if (data && data.length > 0) {
        const creatorData = data[0] as CreatorData;
        console.log('[useCreatorData] Creator data loaded:', {
          handle: creatorData.creator_handle,
          name: `${creatorData.first_name} ${creatorData.last_name}`,
          diamonds: creatorData.total_diamonds
        });
        setCreator(creatorData);
      } else {
        console.warn('[useCreatorData] No creator data found');
        setError('No creator data found');
      }
    } catch (err) {
      console.error('[useCreatorData] Unexpected error:', err);
      setError('Failed to fetch creator data');
    } finally {
      setLoading(false);
    }
  }, [creatorHandle]);

  useEffect(() => {
    console.log('[useCreatorData] Effect triggered');
    fetchCreatorData();
  }, [fetchCreatorData]);

  const getCreatorStats = (): CreatorStats | null => {
    if (!creator) return null;

    const liveHours = Math.floor(creator.live_duration_seconds_30d / 3600);
    const silverTarget = creator.silver_target || 200000;
    const goldTarget = creator.gold_target || 500000;
    
    let nextTarget = 'Silver';
    let targetAmount = silverTarget;
    
    if (creator.total_diamonds >= silverTarget) {
      nextTarget = 'Gold';
      targetAmount = goldTarget;
    }

    const remaining = Math.max(0, targetAmount - creator.total_diamonds);
    const currentProgress = targetAmount > 0 
      ? ((creator.total_diamonds / targetAmount) * 100).toFixed(1)
      : '0.0';

    return {
      monthlyDiamonds: creator.diamonds_monthly || 0,
      totalDiamonds: creator.total_diamonds || 0,
      liveDays: creator.live_days_30d || 0,
      liveHours: liveHours,
      diamondsToday: creator.diamonds_30d || 0,
      streak: creator.live_days_30d || 0,
      currentProgress: parseFloat(currentProgress),
      remaining: remaining,
      nextTarget: nextTarget,
      targetAmount: targetAmount,
      currentStatus: creator.graduation_status || 'Rookie (New)',
    };
  };

  return {
    creator,
    loading,
    error,
    stats: getCreatorStats(),
    refetch: fetchCreatorData,
  };
}
