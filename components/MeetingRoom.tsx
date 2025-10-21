// Filename: components/MeetingRoom.tsx

"use client";
import { cn } from "@/lib/utils";
import {
  CallControls,
  CallParticipantsList,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
  CallStatsButton,
  useCall, // We need this hook
} from "@stream-io/video-react-sdk";
import React from "react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutList, Users, Download, Info } from "lucide-react"; // 1. Import Info icon
import { useRouter, useSearchParams } from "next/navigation";
import EndCallButton from "./EndCallButton";
import Loader from "./Loader";
import { useClientSideRecording } from "@/hooks/useClientSideRecording";
import { useToast } from "./ui/use-toast";
import MeetingModal from "./MeetingModal"; // 2. Import MeetingModal

type CallLayoutType = "grid" | "speaker-right" | "speaker-left";

const MeetingRoom = () => {
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get("personal");
  const [layout, setLayout] = useState<CallLayoutType>("speaker-left");
  const [showParticipants, setShowParticipants] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  
  // 3. Add new state for the info modal
  const [showInfo, setShowInfo] = useState(false);

  const call = useCall(); // 4. Get the call object to find its ID
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const { isRecording, startRecording, stopRecording } =
    useClientSideRecording({
      onRecordingComplete: (blob) => {
        setRecordedBlob(blob);
        toast({ title: "Recording ready for download." });
      },
    });

  if (callingState !== CallingState.JOINED) return <Loader />;

  const handleDownload = () => {
    if (!recordedBlob) return;
    
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Collab-Recording-${new Date().toISOString()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setRecordedBlob(null);
  };

  const CallLayout = () => {
    switch (layout) {
      case "grid":
        return <PaginatedGridLayout />;
      case "speaker-right":
        return <SpeakerLayout participantsBarPosition="left" />;
      default:
        return <SpeakerLayout participantsBarPosition="right" />;
    }
  };

  // 5. Define the meeting link
  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${call?.id}`;

  return (
    <section className="relative h-screen w-full overflow-hidden pt-4 text-white">
      <div className="relative flex size-full items-center justify-center">
        <div className="flex size-full max-w-[1000px] items-center">
          <CallLayout />
        </div>
        <div
          className={cn("h-[calc(100vh-86px)] hidden ml-2", {
            "show-block": showParticipants,
          })}
        >
          <CallParticipantsList onClose={() => setShowParticipants(false)} />
        </div>
      </div>
      
      <div className="fixed bottom-0 flex w-full items-center justify-center gap-5 flex-wrap p-4">
        <CallControls onLeave={() => router.push("/")} />
        
        <DropdownMenu>
          <div className="flex items-center">
            <DropdownMenuTrigger className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
              <LayoutList size={20} className="text-white" />
            </DropdownMenuTrigger>
          </div>
          <DropdownMenuContent className=" border-dark-1 bg-dark-1 text-white">
            {["Grid", "Speaker Right", "Speaker Left"].map((item, index) => (
              <div key={index}>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setLayout(item.toLowerCase().replace(' ', '-') as CallLayoutType)}
                >
                  {item}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-dark-1" />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <CallStatsButton />
        
        <button
          className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]"
          onClick={() => setShowParticipants((prev) => !prev)}
        >
          <Users size={20} className="text-white" />
        </button>

        {/* --- 6. ADD THE NEW "i" INFO BUTTON --- */}
        <button
          className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]"
          onClick={() => setShowInfo(true)}
        >
          <Info size={20} className="text-white" />
        </button>
        {/* --- END OF NEW BUTTON --- */}

        <button
          className={cn(
            "cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]",
            { "bg-red-500 hover:bg-red-600": isRecording }
          )}
          onClick={() => (isRecording ? stopRecording() : startRecording())}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </button>

        {recordedBlob && (
          <button 
            onClick={handleDownload}
            className="cursor-pointer rounded-2xl bg-blue-1 px-4 py-2 hover:bg-blue-2 flex items-center gap-2"
          >
            <Download size={20} className="text-white" />
            Download
          </button>
        )}

        {!isPersonalRoom && <EndCallButton />}
      </div>

      {/* --- 7. ADD THE NEW INFO MODAL --- */}
      <MeetingModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        title="Meeting Info"
        className="text-center"
        buttonText="Copy Meeting Link"
        handleClick={() => {
          navigator.clipboard.writeText(meetingLink);
          toast({ title: "Link Copied" });
        }}
        buttonIcon="/icons/copy.svg"
      >
        <div className="flex flex-col gap-2">
          <p className="text-lg font-semibold text-white">
            Share this link to invite others
          </p>
          <p className="text-sm text-sky-1 bg-dark-2 p-2 rounded-lg break-all">
            {meetingLink}
          </p>
        </div>
      </MeetingModal>
      {/* --- END OF NEW MODAL --- */}
    </section>
  );
};

export default MeetingRoom;