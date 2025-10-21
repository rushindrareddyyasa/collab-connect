// Filename: hooks/useGetCalls.ts

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';

export const useGetCalls = () => {
  const { user } = useUser();
  const client = useStreamVideoClient();
  const [calls, setCalls] = useState<Call[]>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadCalls = async () => {
      if (!client || !user?.id) return;

      setIsLoading(true);

      try {
        // ✅ Corrected query: combines filters properly using $and
        const { calls } = await client.queryCalls({
          sort: [{ field: 'starts_at', direction: -1 }],
          filter_conditions: {
            $and: [
              {
                $or: [
                  { created_by_user_id: user.id },
                  { members: { $in: [user.id] } },
                ],
              },
              {
                $or: [
                  { starts_at: { $exists: true } },
                  { 'custom.recordingUrl': { $exists: true } },
                ],
              },
            ],
          },
        });

        setCalls(calls);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCalls();
  }, [client, user?.id]);

  const now = new Date();

  // Upcoming calls
  const upcomingCalls = calls?.filter(({ state: { startsAt } }: Call) => {
    return startsAt && new Date(startsAt) > now;
  });

  // Ended calls
  const endedCalls = calls?.filter(({ state: { startsAt, endedAt } }: Call) => {
    return (startsAt && new Date(startsAt) < now) || !!endedAt;
  });

  // --- THIS IS THE FIX ---
  // Calls with recordings
  const callRecordings = calls?.filter(
    (call) =>
      call.state.recording || // 1. Check for Stream's native recording
      call.state.custom?.recordingUrl // 2. Check for our custom recording URL
  );
  // --- END OF FIX ---

  return {
    endedCalls,
    upcomingCalls,
    callRecordings,
    isLoading,
  };
};