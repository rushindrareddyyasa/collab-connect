// Filename: app/(root)/layout.tsx
import { ReactNode } from 'react';
import StreamVideoProvider from '@/providers/StreamClientProvider'; // Import the default
import { Metadata } from 'next';

// We import the tokenProvider here, in a SERVER COMPONENT
import { tokenProvider } from '@/actions/stream.actions';

// export const metadata: Metadata = {
//   title: "Collab Connect",
//   description: "Video calling App",
//   icons: {
//     icon: "/icons/logo.svg",
//   },
// };

// This layout is now an async function
const RootLayout = async ({ children }: { children: ReactNode }) => {
  
  // We call the server action here and get the token
  const token = await tokenProvider();

  return (
    <main>
      {/* We pass the token down as a prop.
        This fixes the (action-browser) bug permanently.
      */}
      <StreamVideoProvider token={token}>
        {children}
      </StreamVideoProvider>
    </main>
  );
};

export default RootLayout;