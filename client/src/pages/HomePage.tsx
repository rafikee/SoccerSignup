import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import SettingsCard from "@/components/SettingsCard";
import SignupForm from "@/components/SignupForm";
import AttendeesList from "@/components/AttendeesList";
import WaitlistList from "@/components/WaitlistList";

interface Game {
  id: number;
  gameDate: string;
  maxAttendees: number;
  isActive: boolean;
  gameTime: string;
  location: string;
}

export default function HomePage() {
  const { toast } = useToast();
  
  // Fetch active week and all weeks for the selector
  const { 
    data: activeWeek,
    isLoading: isLoadingActiveWeek,
    isError: isActiveWeekError
  } = useQuery({
    queryKey: ['/api/weeks/active'],
  });

  // No longer need to fetch all weeks since we're only showing the active game

  // Fetch attendees for the active week
  const { 
    data: attendeesData,
    isLoading: isLoadingAttendees,
    isError: isAttendeesError
  } = useQuery({
    queryKey: [`/api/weeks/${activeWeek?.id}/attendees`],
    enabled: !!activeWeek?.id,
    refetchInterval: 2000, // Poll for updates every 2 seconds
  });

  // No longer allowing creation of new games

  // Update max attendees mutation
  const updateMaxAttendeesMutation = useMutation({
    mutationFn: async (maxAttendees: number) => {
      if (!activeWeek?.id) throw new Error("No active week");
      return apiRequest('PATCH', `/api/weeks/${activeWeek.id}`, { maxAttendees });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/weeks/active'] });
      await queryClient.invalidateQueries({ queryKey: [`/api/weeks/${activeWeek?.id}/attendees`] });
      toast({
        title: "Settings updated",
        description: "Maximum attendees updated successfully",
        variant: "default",
      });
    }
  });

  // Update game time mutation
  const updateGameTimeMutation = useMutation({
    mutationFn: async (gameTime: string) => {
      if (!activeWeek?.id) throw new Error("No active week");
      return apiRequest('PATCH', `/api/weeks/${activeWeek.id}`, { gameTime });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/weeks/active'] });
      toast({
        title: "Settings updated",
        description: "Game time updated successfully",
        variant: "default",
      });
    }
  });

  // Update location mutation
  const updateLocationMutation = useMutation({
    mutationFn: async (location: string) => {
      if (!activeWeek?.id) throw new Error("No active week");
      return apiRequest('PATCH', `/api/weeks/${activeWeek.id}`, { location });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/weeks/active'] });
      toast({
        title: "Settings updated",
        description: "Location updated successfully",
        variant: "default",
      });
    }
  });

  // No longer allowing creation of new games

  // Handle updating max attendees
  const handleMaxAttendeesChange = (maxAttendees: number) => {
    updateMaxAttendeesMutation.mutate(maxAttendees);
  };

  // Handle updating game time
  const handleGameTimeChange = (gameTime: string) => {
    updateGameTimeMutation.mutate(gameTime);
  };

  // Handle updating location
  const handleLocationChange = (location: string) => {
    updateLocationMutation.mutate(location);
  };

  if (isLoadingActiveWeek) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-screen">
          <p className="text-lg text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (isActiveWeekError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-screen">
          <p className="text-lg text-red-500">Failed to load active week. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <i className="fas fa-futbol mr-3 text-primary"></i>
          Soccer Game Sign-Up
        </h1>
        <p className="text-gray-600 mt-2">Sign up for our soccer game on Friday, April 18, 2025</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SettingsCard 
          maxAttendees={activeWeek?.maxAttendees || 10}
          gameTime={activeWeek?.gameTime || "5:00 PM"}
          location={activeWeek?.location || "City Park Fields"} 
          onMaxAttendeesChange={handleMaxAttendeesChange}
          onGameTimeChange={handleGameTimeChange}
          onLocationChange={handleLocationChange}
          isPending={updateMaxAttendeesMutation.isPending || updateGameTimeMutation.isPending || updateLocationMutation.isPending}
        />

        <div className="lg:col-span-2">
          <SignupForm 
            weekId={activeWeek?.id}
            maxAttendees={activeWeek?.maxAttendees || 10}
            currentCount={attendeesData?.confirmed?.length || 0}
          />
          
          <AttendeesList 
            attendees={attendeesData?.confirmed || []} 
            maxAttendees={activeWeek?.maxAttendees || 10} 
            weekId={activeWeek?.id}
            isLoading={isLoadingAttendees}
          />
          
          <WaitlistList 
            waitlist={attendeesData?.waitlist || []} 
            weekId={activeWeek?.id}
            hasAvailableSpots={(attendeesData?.confirmed?.length || 0) < (activeWeek?.maxAttendees || 10)}
            isLoading={isLoadingAttendees}
          />
        </div>
      </div>
    </div>
  );
}
