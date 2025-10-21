// Filename: actions/email.actions.ts
"use server"

import { Resend } from 'resend';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

// This is Resend's default email for testing.
// Replace with your own verified domain email if you have one.
const FROM_EMAIL = 'onboarding@resend.dev'; 

export const scheduleEmailReminder = async ({
  email,
  meetingTime,
  meetingLink,
}: {
  email: string;
  meetingTime: Date;
  meetingLink: string;
}) => {
  if (!process.env.RESEND_API_KEY) {
    console.error("Resend API key is not set.");
    return { error: 'Email service is not configured.' };
  }

  // --- THIS IS YOUR 10-MINUTE LOGIC ---
  // Calculate reminder time (10 minutes before the meeting)
  const reminderTime = new Date(meetingTime.getTime() - 10 * 60 * 1000);
  // --- END OF YOUR LOGIC ---

  // Don't schedule emails for meetings in the past or <10 mins from now
  if (reminderTime < new Date()) {
    console.log("Meeting is too soon, not scheduling reminder email.");
    return { info: 'Meeting is too soon to schedule a reminder.' };
  }

  try {
    // 'send_at' tells Resend to send this ONE email at the exact time
    const { data, error } = await resend.emails.send({
      from: `Collab Connect <${FROM_EMAIL}>`,
      to: [email], // The user's email
      subject: 'Your Upcoming Meeting Reminder',
      html: `
        <h1>Your meeting is starting in 10 minutes!</h1>
        <p>Your meeting is scheduled for ${meetingTime.toLocaleString()}.</p>
        <p>Join here: <a href="${meetingLink}">${meetingLink}</a></p>
      `,
      scheduledAt: reminderTime.toISOString(),
    });

    if (error) {
      console.error("Resend error:", error);
      return { error };
    }

    console.log("Email reminder scheduled successfully:", data);
    return { data };
  } catch (error) {
    console.error("Failed to schedule email:", error);
    return { error };
  }
};