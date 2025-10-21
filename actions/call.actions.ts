// Filename: actions/call.actions.ts
"use server";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const apiSecret = process.env.STREAM_SECRET_KEY;

export const addRecordingUrlToCall = async ({
  callId,
  recordingUrl,
}: {
  callId: string;
  recordingUrl: string;
}) => {
  if (!apiSecret || !apiKey)
    throw new Error("Stream API key or secret not set");

  // Dynamically import the node-sdk to keep it server-side
  const { StreamClient } = await import("@stream-io/node-sdk");

  try {
    const client = new StreamClient(apiKey, apiSecret);

    // 1. Get a reference to the call
    const call = client.video.call("default", callId);

    // 2. Get the call's current details from the server
    const { call: callDetails } = await call.get();

    // 3. Update the call with the new recording URL
    await call.update({
      custom: {
        // 4. Use 'callDetails.custom' to preserve existing custom data
        ...(callDetails.custom || {}),
        recordingUrl: recordingUrl,
      },
    });

    console.log("✅ Successfully added recording URL to call:", callId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error updating call with recording URL:", error);
    return { success: false };
  }
};