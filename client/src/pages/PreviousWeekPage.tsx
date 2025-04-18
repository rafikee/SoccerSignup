import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { format } from "date-fns";
import SettingsCard from "@/components/SettingsCard";
import AttendeesList from "@/components/AttendeesList";
import WaitlistList from "@/components/WaitlistList";

export default function PreviousWeekPage() {
  // Get the week ID from the URL
  const [match, params] = useRoute("/week/:id");
  const weekId = match ? parseInt(params.id) : null;

  // Fetch week data
  const { 
    data: week,
    isLoading: isLoadingWeek,
    isError: isWeekError
  } = useQuery({
    queryKey: [`/api/weeks/${weekId}`],
    enabled: weekId !== null,
  });

  // Fetch attendees
  const { 
    data: attendeesData,
    isLoading: isLoadingAttendees
  } = useQuery({
    queryKey: [`/api/weeks/${weekId}/attendees`],
    enabled: weekId !== null,
  });

  if (isLoadingWeek || isLoadingAttendees) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-screen">
          <p className="text-lg text-gray-500">Loading previous week data...</p>
        </div>
      </div>
    );
  }

  if (isWeekError || !week) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-lg text-red-500 mb-4">Failed to load week data.</p>
            <Link href="/">
              <a className="text-primary hover:underline">Return to current week</a>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const startDate = new Date(week.startDate);
  const endDate = new Date(week.endDate);
  const formattedDateRange = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <i className="fas fa-futbol mr-3 text-primary"></i>
          Weekly Soccer Sign-Up
        </h1>
        <p className="text-gray-600 mt-2">Previous week: {formattedDateRange}</p>
      </header>

      <div className="mb-8 border-b border-gray-200 overflow-x-auto">
        <nav className="flex">
          <Link href="/">
            <a className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
              Return to Current Week
            </a>
          </Link>
          <span className="px-4 py-2 text-sm font-medium text-primary border-b-2 border-primary" aria-current="page">
            {formattedDateRange}
          </span>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SettingsCard 
          maxAttendees={week.maxAttendees}
          gameTime={week.gameTime || "Sunday, 5:00 PM"} 
          location={week.location || "City Park Fields"}
          readOnly={true}
        />

        <div className="lg:col-span-2">
          <AttendeesList 
            attendees={attendeesData?.confirmed || []} 
            maxAttendees={week.maxAttendees} 
            weekId={weekId || 0}
            readOnly={true}
          />
          
          <WaitlistList 
            waitlist={attendeesData?.waitlist || []} 
            weekId={weekId || 0}
            readOnly={true}
          />
        </div>
      </div>
    </div>
  );
}
