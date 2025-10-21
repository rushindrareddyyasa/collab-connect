// Filename: app/personal-room/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useGetCallById } from '@/hooks/useGetCallById';
import { useUser } from '@clerk/nextjs';
import { useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useRouter } from 'next/navigation';
import React from 'react';

const Table = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="flex flex-col items-start gap-2 xl:flex-row">
    <h1 className="text-base font-medium text-sky-1 lg:text-xl xl:min-w-32">
      {title} :
    </h1>
    <h1 className="truncate text-sm font-bold max-sm:max-w-[320px] lg:text-xl">
      {description}
    </h1>
  </div>
);

const PersonalRoom = () => {
  const { user } = useUser();
  const meeting_id = user?.id;
  const { toast } = useToast();
  const client = useStreamVideoClient();
  const router = useRouter();

  // --- 1. FIX FOR 'null' TOPIC ---
  // Fallback chain: username -> firstName -> email (before the @)
  const name =
    user?.username ||
    user?.firstName ||
    user?.emailAddresses[0]?.emailAddress.split('@')[0];
  const topic = `${name || 'User'}'s Meeting Room`;
  // --- END OF FIX ---

  // Note: The 'undefined' link is fixed by adding NEXT_PUBLIC_BASE_URL
  // in your Netlify environment variables, not by changing this code.
  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${meeting_id}?personal=true`;

  // We get the call reference but don't need to await it here.
  // We'll use 'getOrCreate' in startRoom to handle it.
  const { call } = useGetCallById(meeting_id!);

  const startRoom = async () => {
    if (!client || !user) return;

    // Get or create the call
    const newCall = client.call('default', meeting_id!);
    if (!call) {
      await newCall.getOrCreate({
        data: {
          starts_at: new Date().toISOString(),
          custom: {
            description: topic, // Set the topic as the call description
          },
        },
      });
    }

    // --- 2. LOGIC FIX ---
    // Always navigate to the meeting room when the button is clicked.
    router.push(`/meeting/${meeting_id}?personal=true`);
  };

  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <h1 className="text-3xl font-bold ">Personal Room</h1>
      <div className="flex w-full flex-col gap-8 xl:max-w-[900px]">
        {/* Use the new 'topic' variable */}
        <Table title="Topic" description={topic} />
        <Table title="Meeting Id" description={meeting_id!} />
        <Table title="Invite Link" description={meetingLink} />
      </div>
      <div className="flex gap-5">
        <Button className="bg-blue-1" onClick={startRoom}>
          Start Meeting
        </Button>
        <Button
          className="bg-dark-1"
          onClick={() => {
            navigator.clipboard.writeText(meetingLink);
            toast({
              title: 'Link Copied',
            });
          }}
        >
          Copy Link
        </Button>
      </div>
    </section>
  );
};

export default PersonalRoom;