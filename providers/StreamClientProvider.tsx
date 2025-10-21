// Filename: providers/StreamProvider.tsx
'use client';

import {
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-sdk';
import { ReactNode, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Loader from '@/components/Loader';

// We have REMOVED the 'tokenProvider' import. This is the fix.

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;

// This component now receives the token as a PROP
export const StreamVideoProvider = ({ children, token }: { children: ReactNode, token: string | undefined }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (!apiKey) throw new Error('Stream API key is missing');
    
    // If the token is missing from the prop, we cannot continue.
    if (!token) {
      console.error("Stream token is missing. Cannot initialize video client.");
      return;
    }

    const client = new StreamVideoClient({
      apiKey,
      user: {
        id: user?.id,
        name: user?.username || user?.id,
        image: user?.imageUrl,
      },
      token: token, // We use the token from the prop
    });

    setVideoClient(client);

    return () => {
      client.disconnectUser();
      setVideoClient(undefined);
    };
    
  }, [user, isLoaded, token]); // Add 'token' to dependency array

  if (!videoClient) return <Loader />;

  return (
    <StreamVideo client={videoClient}>
      {children}
    </StreamVideo>
  );
};

// We must now export it as a default
export default StreamVideoProvider;