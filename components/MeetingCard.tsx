// Filename: components/MeetingCard.tsx

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { avatarImages } from "@/constants";
import ShareModal from "./ShareModal";

interface MeetingCardProps {
  type: "upcoming" | "ended" | "recordings"; // Use a clear type prop
  title: string;
  date: string;
  icon: string;
  handleClick: () => void;
  link: string;
  buttonText?: string;
}

const MeetingCard = ({
  type,
  icon,
  title,
  date,
  handleClick,
  link,
  buttonText,
}: MeetingCardProps) => {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // This function now correctly renders buttons based on the type
  const renderButtons = () => {
    switch (type) {
      case "upcoming":
        return (
          <div className="flex gap-2">
            <Button onClick={handleClick} className="rounded bg-blue-1 px-6">
              <Image src="/icons/upcoming.svg" alt="start" width={20} height={20} />
              &nbsp; {buttonText}
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(link);
                toast({ title: "Link Copied" });
              }}
              className="bg-dark-4 px-6"
            >
              <Image src="/icons/copy.svg" alt="copy" width={20} height={20} />
              &nbsp; Copy Link
            </Button>
          </div>
        );
      case "recordings":
        return (
          <div className="flex gap-2">
            <Link href={link} target="_blank">
              <Button className="rounded bg-blue-1 px-6">
                <Image src="/icons/play.svg" alt="play" width={20} height={20} />
                &nbsp; Play
              </Button>
            </Link>
            <Button onClick={() => setIsModalOpen(true)} className="bg-dark-4 px-6">
              <Image src="/icons/share.svg" alt="share" width={20} height={20} />
              &nbsp; Share
            </Button>
             <Link href={link} download="meeting-recording.mp4" target="_blank">
                <Button className="bg-dark-4 px-6">
                  <Image src="/icons/Video.svg" alt="download" width={20} height={20} />
                  &nbsp; Download
                </Button>
            </Link>
          </div>
        );
      case "ended":
        // For "Previous" meetings that are not recordings, we show NO buttons.
        // This fixes your bug.
        return null;
      default:
        return null;
    }
  };

  return (
    <>
      <section className="flex min-h-[258px] w-full flex-col justify-between rounded-[14px] bg-dark-1 px-5 py-8 xl:max-w-[568px]">
        <article className="flex flex-col gap-5">
          <Image src={icon} alt="icon" width={28} height={28} />
          <div className="flex justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="text-base font-normal">{date}</p>
            </div>
          </div>
        </article>
        <article className="relative flex justify-between">
          <div className="relative flex w-full max-sm:hidden">
            {avatarImages.map((img, index) => (
              <Image
                key={index}
                src={img}
                alt="attendees"
                width={40}
                height={40}
                className={cn("rounded-full", { absolute: index > 0 })}
                style={{ top: 0, left: index * 28 }}
              />
            ))}
            <div className="flex-center absolute left-[136px] size-10 rounded-full border-[5px] border-dark-3 bg-dark-4">
              +5
            </div>
          </div>
          {/* This part is now much cleaner */}
          {renderButtons()}
        </article>
      </section>

      {/* The modal only renders if it's a recording */}
      {type === 'recordings' && (
        <ShareModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          recordingUrl={link}
        />
      )}
    </>
  );
};

export default MeetingCard;