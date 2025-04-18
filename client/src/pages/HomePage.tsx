import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import WeekSelector from "@/components/WeekSelector";
import SettingsCard from "@/components/SettingsCard";
import SignupForm from "@/components/SignupForm";
import AttendeesList from "@/components/AttendeesList";
import WaitlistList from "@/components/WaitlistList";

interface Week {
  id: number;
  startDate: string;
  endDate: string;
  maxAttendees: number;
  isActive: boolean;
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

  const { 
    data: allWeeks,
    isLoading: isLoadingWeeks
  } = useQuery({
    queryKey: ['/api/weeks'],
  });

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

  // Create new week mutation
  const createWeekMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
      
      const newWeek = {
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
        maxAttendees: activeWeek?.maxAttendees || 10,
        gameTime: activeWeek?.gameTime || "Sunday, 5:00 PM",
        location: activeWeek?.location || "City Park Fields",
        isActive: true
      };
      
      return apiRequest('POST', '/api/weeks', newWeek);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/weeks'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/weeks/active'] });
      toast({
        title: "Success",
        description: "New week created!",
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create new week",
        variant: "destructive",
      });
    }
  });

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

  // Handle creating a new week
  const handleCreateNewWeek = () => {
    createWeekMutation.mutate();
  };

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

  if (isLoadingActiveWeek || isLoadingWeeks) {
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
          Weekly Soccer Sign-Up
        </h1>
        <p className="text-gray-600 mt-2">Sign up for our weekly soccer games</p>
      </header>

      <WeekSelector 
        weeks={allWeeks || []} 
        activeWeekId={activeWeek?.id}
        onCreateNewWeek={handleCreateNewWeek}
        isPending={createWeekMutation.isPending}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SettingsCard 
          maxAttendees={activeWeek?.maxAttendees || 10}
          gameTime={activeWeek?.gameTime || "Sunday, 5:00 PM"}
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
