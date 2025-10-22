// Filename: components/ToggleCanvasButton.tsx
'use client';

import { useCall } from '@stream-io/video-react-sdk';
import { useUser } from '@clerk/nextjs';
import { Brush, X } from 'lucide-react'; // Using Brush icon
import { Button } from './ui/button';

interface ToggleCanvasButtonProps {
    isCanvasActive: boolean;
    setIsCanvasActive: (isActive: boolean) => void;
}

export const ToggleCanvasButton = ({
    isCanvasActive,
    setIsCanvasActive,
}: ToggleCanvasButtonProps) => {
    const { user } = useUser();
    const call = useCall();
    const hostId = call?.state.createdBy?.id;
    const isHost = user?.id === hostId;

    const toggleCanvas = async () => {
        if (!call || !isHost) return;
        const newState = !isCanvasActive;
        setIsCanvasActive(newState);
        try {
            // Use the same event type for consistency
            await call.sendCustomEvent({
                type: 'whiteboard-state', // Keep same event name
                data: { state: newState ? 'active' : 'inactive' },
            });
        } catch (error) {
            console.error('Failed to send canvas state update:', error);
        }
    };

    if (!isHost) return null; // Only render for host

    return (
        <Button
            variant="outline"
            className="cursor-pointer rounded-lg bg-[#19232d] p-2 hover:bg-[#4c535b] border-none" // Match other button styles
            onClick={toggleCanvas}
            title={isCanvasActive ? 'Hide Canvas' : 'Show Drawing Canvas'}
        >
            {isCanvasActive ? (
                <X size={20} className="text-red-500" />
            ) : (
                <Brush size={20} className="text-white" /> // Use Brush icon
            )}
        </Button>
    );
};