// Filename: components/MeetingRoom.tsx
'use client';

import { cn } from "@/lib/utils";
import {
  CallControls,
  CallParticipantsList,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
  CallStatsButton,
  useCall,
} from "@stream-io/video-react-sdk";
import React, { useState, useEffect } from "react"; // Added useEffect
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutList, Users, Download, Info } from "lucide-react"; // Original icons
import { useRouter, useSearchParams } from "next/navigation";
import EndCallButton from "./EndCallButton";
import Loader from "./Loader";
import { useClientSideRecording } from "@/hooks/useClientSideRecording";
import { useToast } from "./ui/use-toast";
import MeetingModal from "./MeetingModal";

// --- Import Canvas Components ---
import { ToggleCanvasButton } from './ToggleCanvasButton';
import { SimpleCanvas } from './SimpleCanvas';
// --- End Canvas Imports ---


type CallLayoutType = "grid" | "speaker-right" | "speaker-left";

const MeetingRoom = () => {
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get("personal");
  const [layout, setLayout] = useState<CallLayoutType>("speaker-left");
  const [showParticipants, setShowParticipants] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  // --- Add Canvas State ---
  const [isCanvasActive, setIsCanvasActive] = useState(false);
  // --- End Canvas State ---

  const call = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const { isRecording, startRecording, stopRecording } =
    useClientSideRecording({
      onRecordingComplete: (blob) => {
        setRecordedBlob(blob);
        toast({ title: "Recording ready for download." });
      },
    });

  // --- Add Effect for Canvas State ---
  useEffect(() => {
    if (!call) return;
    const handleCustomEvent = (event: any) => {
      // Use the same event name as the toggle button
      if (event.type === 'whiteboard-state') {
        setIsCanvasActive(event.data.state === 'active');
      }
    };
    call.on('custom', handleCustomEvent);
    return () => { call.off('custom', handleCustomEvent); };
  }, [call]);
  // --- End Effect ---

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

  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${call?.id}`;

  return (
    // Use Flexbox column layout for the whole screen
    <section className="relative h-screen w-full flex flex-col text-white bg-dark-2">

      {/* Main Content Area (Video/Canvas + Participants) */}
      <div className="relative flex flex-1 overflow-hidden pt-4 px-4"> {/* flex-1 makes this grow */}

        {/* --- Container for Video AND Canvas Layer --- */}
        {/* Make this container relative to position children absolutely */}
        <div className="flex flex-1 overflow-hidden mr-2 relative">

          {/* Video Layout Wrapper - Positioned Absolutely */}
          <div className={cn(
                "absolute inset-0 flex items-center justify-center transition-opacity duration-300", // Full overlay
                isCanvasActive ? 'opacity-0 pointer-events-none z-0' : 'opacity-100 z-10' // Toggle visibility
             )}>
             {/* Use original centering div */}
             <div className="flex size-full max-w-[1000px] items-center mx-auto">
                <CallLayout />
             </div>
          </div>

          {/* Canvas Wrapper - Positioned Absolutely */}
           <div className={cn(
               "absolute inset-0 bg-dark-2 transition-opacity duration-300", // Full overlay
               isCanvasActive ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0' // Toggle visibility
             )}>
             {/* Conditionally mount canvas only when active */}
             {isCanvasActive && <SimpleCanvas />}
           </div>
        </div>
        {/* --- End Container --- */}


        {/* Participants Panel */}
        <div
          className={cn(
            // Use original class structure + add rounding/padding
            "h-[calc(100vh-86px)] hidden ml-2 bg-dark-1 p-2 rounded-lg",
            {
              // Keep original show logic, but hide if canvas is active
              'show-block': showParticipants && !isCanvasActive,
            }
          )}
        >
          <CallParticipantsList onClose={() => setShowParticipants(false)} />
        </div>
      </div> {/* End Main Content Area */}


      {/* Bottom Controls Area */}
      {/* Adjusted gaps for potentially more buttons */}
      <div className="flex h-[80px] w-full items-center justify-center gap-2 md:gap-3 flex-wrap p-2 bg-dark-1 border-t border-dark-3">
        <CallControls onLeave={() => router.push("/")} />

        {/* Layout Dropdown (Render only if canvas NOT active) */}
        {!isCanvasActive && (
          <DropdownMenu>
            <div className="flex items-center">
              {/* Use original styling but adjust padding if needed */}
              <DropdownMenuTrigger className="cursor-pointer rounded-lg bg-[#19232d] p-2 hover:bg-[#4c535b]">
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
                  {index < 2 && <DropdownMenuSeparator className="border-dark-1" />}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <CallStatsButton />

        {/* Participants Button (Render only if canvas NOT active) */}
        {!isCanvasActive && (
          <button
            // Use original styling but adjust padding if needed
            className="cursor-pointer rounded-lg bg-[#19232d] p-2 hover:bg-[#4c535b]"
            onClick={() => setShowParticipants((prev) => !prev)}
            title="Participants"
          >
            <Users size={20} className="text-white" />
          </button>
        )}

        {/* Canvas Toggle Button */}
        <ToggleCanvasButton
            isCanvasActive={isCanvasActive}
            setIsCanvasActive={setIsCanvasActive}
        />

        {/* Info Button */}
        <button
          // Use original styling but adjust padding if needed
          className="cursor-pointer rounded-lg bg-[#19232d] p-2 hover:bg-[#4c535b]"
          onClick={() => setShowInfo(true)}
          title="Meeting Info"
        >
          <Info size={20} className="text-white" />
        </button>

        {/* Recording Button */}
         <button
          className={cn(
             // Use original styling but adjust padding if needed
            'cursor-pointer rounded-lg bg-[#19232d] p-2 hover:bg-[#4c535b]',
            { 'bg-red-500 hover:bg-red-600': isRecording }
          )}
          onClick={() => (isRecording ? stopRecording() : startRecording())}
          title={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          {/* Using simple dot for recording indicator */}
           <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isRecording ? 'bg-white' : 'bg-red-500'}`}>
             {isRecording && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>}
           </div>
        </button>

        {/* Download Button */}
        {recordedBlob && (
          <button
            onClick={handleDownload}
             // Use original styling but adjust padding if needed
            className="cursor-pointer rounded-lg bg-blue-1 p-2 hover:bg-blue-2 flex items-center gap-1"
            title="Download Recording"
          >
            <Download size={20} className="text-white" />
          </button>
        )}

        {/* End Call Button */}
        {!isPersonalRoom && <EndCallButton />}

      </div> {/* End Bottom Controls Area */}


      {/* Info Modal (Keep original) */}
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
    </section>
  );
};

export default MeetingRoom;