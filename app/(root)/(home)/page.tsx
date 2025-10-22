// Filename: app/(root)/(home)/page.tsx
'use client'
import MeetingTypeList from '@/components/MeetingTypeList';
import React, { useEffect, useState } from 'react'
// 1. Import the hook to get call data
import { useGetCalls } from '@/hooks/useGetCalls';

const Page = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // This effect correctly updates the time every second
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000); // Use setInterval to update every second

    // Clear interval on component unmount
    return () => clearInterval(timerId);
  }, []); // Empty dependency array runs this effect only once on mount

  // 2. Fetch the call lists
  const { upcomingCalls, isLoading } = useGetCalls();

  // 3. Find the next meeting
  // useGetCalls already sorts upcoming calls, so the next one is just the first in the array.
  const nextMeeting = upcomingCalls?.[0];

  // 4. Format the time for the banner, or set a message
  const bannerText = isLoading
    ? 'Loading upcoming meetings...'
    : nextMeeting
    ? `Upcoming meeting at ${nextMeeting.state.startsAt?.toLocaleTimeString(
        'en-US',
        { hour: '2-digit', minute: '2-digit', hour12: true }
      )}`
    : 'No upcoming meetings';

  // --- Your existing formatting functions ---
  const formatDate = (date:Date) => {
    let dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
  };
    return date.toLocaleDateString('en-US', dateOptions);
  };

  const formatTime = (date:Date) => {
    let timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleTimeString('en-US', timeOptions);
  };

  return (
    <section className='flex size-full flex-col gap-10 text-white'>
        <div className='h-[300px] w-full rounded-[20px] bg-hero bg-cover'>
            <div className='flex h-full flex-col justify-between max-md:px-5 max-md:py-8 lg:p-11'>
                
                {/* 5. Use the dynamic bannerText here */}
                <h2 className='glassmorphism max-w-[270px] rounded py-2 text-center text-base font-normal'>
                  {bannerText}
                </h2>
                
                <div className='flex flex-col gap-2'> 
                  <h1 className='text-4xl font-extrabold lg:text-7xl '>
                    {formatTime(currentDateTime)}
                  </h1>
                  <p className='text-lg font-medium text-sky-1 lg:text-2xl '> {formatDate(currentDateTime)} </p>
                </div>
            </div>
        </div>
        <MeetingTypeList />
    </section>
  )
}

export default Page