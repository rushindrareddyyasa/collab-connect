// Filename: components/SimpleCanvas.tsx
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCall } from '@stream-io/video-react-sdk';
import { useUser } from '@clerk/nextjs';

// Define the structure for a line segment
interface LineSegment {
    x0: number; y0: number; x1: number; y1: number;
    // Optional: Add color, lineWidth later if needed
}

// Debounce function (keep as is)
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
    // ... debounce logic ...
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<F>): Promise<ReturnType<F>> =>
        new Promise(resolve => {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => resolve(func(...args)), waitFor);
        });
};


export const SimpleCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPosition, setLastPosition] = useState<{ x: number; y: number } | null>(null);
    // --- Store all line segments ---
    const [lines, setLines] = useState<LineSegment[]>([]);
    // --- End store lines ---
    const call = useCall();
    const { user } = useUser();

    // Initialize canvas context
    useEffect(() => {
        // ... (keep context initialization logic) ...
         if (canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.strokeStyle = '#FFFFFF';
                context.lineWidth = 3;
                context.lineJoin = 'round';
                context.lineCap = 'round';
                setCtx(context);
                // Draw existing lines when context is ready
                lines.forEach(line => drawLineLocal(line.x0, line.y0, line.x1, line.y1));
            }
        }
    }, [lines]); // Re-run if lines change before ctx is ready

    // Function to draw a line segment LOCALLY
    const drawLineLocal = useCallback((x0: number, y0: number, x1: number, y1: number) => {
        if (!ctx) return;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.closePath();
    }, [ctx]);

    // Debounced function to send INDIVIDUAL draw data
    const sendDrawDataDebounced = useCallback(debounce(async (line: LineSegment) => {
        if (!call || !user) return;
        try {
            await call.sendCustomEvent({
                type: 'canvas-draw', // Event for single line
                data: { senderId: user.id, line },
            });
        } catch (error) { console.error("Failed to send draw data:", error); }
    }, 50), [call, user]);

    // Function to handle drawing locally and emitting
    const handleDrawAndEmit = useCallback((x0: number, y0: number, x1: number, y1: number) => {
        const newLine: LineSegment = { x0, y0, x1, y1 };
        drawLineLocal(x0, y0, x1, y1); // Draw locally first
        setLines(prevLines => [...prevLines, newLine]); // Add to local history
        sendDrawDataDebounced(newLine); // Send the new line
    }, [drawLineLocal, sendDrawDataDebounced]);


    // Redraw all lines (used when receiving full state or resizing)
    const redrawAllLines = useCallback((allLines: LineSegment[]) => {
        if (!ctx || !canvasRef.current) return;
        // Clear first
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        // Draw all lines
        allLines.forEach(line => drawLineLocal(line.x0, line.y0, line.x1, line.y1));
    }, [ctx, drawLineLocal]);


    // Event listener for receiving draw data and full state
    useEffect(() => {
        if (!call || !user || !ctx) return;

        const handleCustomEvent = (event: any) => {
            // Received a single line from someone else
            if (event.type === 'canvas-draw' && event.data.senderId !== user.id) {
                const line = event.data.line as LineSegment;
                if (line) {
                    drawLineLocal(line.x0, line.y0, line.x1, line.y1); // Draw locally
                    setLines(prevLines => [...prevLines, line]); // Add to history
                }
            // Received the full state from the host (or someone)
            } else if (event.type === 'canvas-full-state' /* && event.data.senderId !== user.id */) { // Allow receiving own state if needed
                 const receivedLines = event.data.lines as LineSegment[];
                 if (receivedLines) {
                     console.log(`Received full state with ${receivedLines.length} lines.`);
                     setLines(receivedLines); // Update local history
                     redrawAllLines(receivedLines); // Redraw everything
                 }
            } else if (event.type === 'canvas-clear' && event.data.senderId !== user.id) {
                 clearCanvasLocal();
                 setLines([]); // Clear history
            }
        };

        call.on('custom', handleCustomEvent);
        return () => { call.off('custom', handleCustomEvent); };
    }, [call, user, ctx, drawLineLocal, redrawAllLines]); // Added dependencies


    // --- Drawing Event Handlers ---
    const getCoordinates = (event: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
        // ... (keep getCoordinates logic) ...
        if (!canvasRef.current) return null;
        const canvas = canvasRef.current; const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        if ('touches' in event) { clientX = event.touches[0].clientX; clientY = event.touches[0].clientY; }
        else { clientX = event.clientX; clientY = event.clientY; }
        return { x: clientX - rect.left, y: clientY - rect.top, };
    };

    const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
        const coords = getCoordinates(event);
        if (!coords) return;
        setIsDrawing(true);
        setLastPosition(coords);
    };

    const draw = (event: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !lastPosition) return;
        const coords = getCoordinates(event);
        if (!coords) return;
        handleDrawAndEmit(lastPosition.x, lastPosition.y, coords.x, coords.y); // Use new handler
        setLastPosition(coords);
    };

    const stopDrawing = () => { setIsDrawing(false); setLastPosition(null); };

    // Function to clear canvas locally
    const clearCanvasLocal = () => {
        if (!ctx || !canvasRef.current) return;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    };

     // Function to clear canvas and notify others
    const clearCanvasAndNotify = async () => {
        clearCanvasLocal();
        setLines([]); // Clear local history
        if (!call || !user) return;
         try {
             await call.sendCustomEvent({
                 type: 'canvas-clear',
                 data: { senderId: user.id },
             });
         } catch (error) { console.error("Failed to send clear event:", error); }
    };

    // --- Add Resize Handler ---
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current && ctx) {
                // Store current drawing to redraw after resize
                const currentLines = lines;
                canvasRef.current.width = canvasRef.current.offsetWidth;
                canvasRef.current.height = canvasRef.current.offsetHeight;
                // Reapply context settings after resize
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 3;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';
                // Redraw
                redrawAllLines(currentLines);
            }
        };
        window.addEventListener('resize', handleResize);
        // Initial draw in case resize happens before first draw
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [ctx, lines, redrawAllLines]); // Add dependencies


    return (
        <div className="h-full w-full relative bg-gray-800 rounded-lg overflow-hidden">
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="h-full w-full cursor-crosshair"
            />
             <button onClick={clearCanvasAndNotify} /* ... clear button styling ... */ > Clear </button>
        </div>
    );
};