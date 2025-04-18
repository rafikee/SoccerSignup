import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import SettingsCard from "@/components/SettingsCard";
import AdminAttendeesList from "@/components/AdminAttendeesList";
import AdminWaitlistList from "@/components/AdminWaitlistList";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function AdminPage() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const correctPassword = "mapsfutball";
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Fetch active week
  const { 
    data: activeWeek,
    isLoading,
    isError
  } = useQuery({
    queryKey: ['/api/weeks/active'],
  });
  
  // Fetch attendees for active week
  const {
    data: attendeesData,
    isLoading: isLoadingAttendees
  } = useQuery({
    queryKey: ['/api/weeks', activeWeek?.id, 'attendees'],
    enabled: !!activeWeek?.id,
  });

  // Update max attendees mutation
  const updateMaxAttendeesMutation = useMutation({
    mutationFn: async (maxAttendees: number) => {
      if (!activeWeek?.id) throw new Error("No active week");
      return apiRequest('PATCH', `/api/weeks/${activeWeek.id}`, { maxAttendees });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/weeks/active'] });
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
  
  // Create new game mutation
  const createGameMutation = useMutation({
    mutationFn: async (gameDate: Date) => {
      const newGame = {
        gameDate: gameDate.toISOString(),
        maxAttendees: activeWeek?.maxAttendees || 10,
        gameTime: activeWeek?.gameTime || "5:00 PM",
        location: activeWeek?.location || "City Park Fields",
        isActive: true
      };
      
      return apiRequest('POST', '/api/weeks', newGame);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/weeks'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/weeks/active'] });
      toast({
        title: "Success",
        description: "New game created! It is now the active game.",
        variant: "default",
      });
      setIsDatePickerOpen(false);
      // Redirect to home page to see the new game
      window.location.href = '/';
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create new game",
        variant: "destructive",
      });
    }
  });

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
  
  // Handle opening the date picker
  const handleNewGameClick = () => {
    setIsDatePickerOpen(true);
  };
  
  // Handle creating a new game
  const handleCreateGameWithDate = () => {
    if (selectedDate) {
      createGameMutation.mutate(selectedDate);
    }
  };

  const handleLogin = () => {
    if (password === correctPassword) {
      setIsAuthenticated(true);
      toast({
        title: "Authentication successful",
        description: "You're now in admin mode",
        variant: "default",
      });
    } else {
      toast({
        title: "Authentication failed",
        description: "Incorrect password",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-screen">
          <p className="text-lg text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-screen">
          <p className="text-lg text-red-500">Failed to load game data. Please try again.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Access</h1>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="flex justify-between items-center">
            <a
              href="/"
              className="text-primary hover:underline"
            >
              Back to Home
            </a>
            <button
              onClick={handleLogin}
              className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-primary"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <i className="fas fa-futbol mr-3 text-primary"></i>
          Admin Settings
        </h1>
        <p className="text-2xl font-bold text-center my-4 text-primary">Friday, April 18, 2025</p>
      </header>
      
      <div className="mb-6 flex justify-between items-center">
        <a 
          href="/" 
          className="text-primary hover:underline flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Home
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <SettingsCard 
            maxAttendees={activeWeek?.maxAttendees || 10}
            gameTime={activeWeek?.gameTime || "5:00 PM"}
            location={activeWeek?.location || "City Park Fields"} 
            onMaxAttendeesChange={handleMaxAttendeesChange}
            onGameTimeChange={handleGameTimeChange}
            onLocationChange={handleLocationChange}
            isPending={updateMaxAttendeesMutation.isPending || updateGameTimeMutation.isPending || updateLocationMutation.isPending}
          />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Admin Instructions</h2>
          <ul className="list-disc pl-5 space-y-2 mb-6">
            <li>You can adjust the maximum number of players allowed in the game</li>
            <li>Update the game time as needed</li>
            <li>Change the location for the game</li>
            <li>As admin, you can remove any player from the lists below</li>
            <li>All changes are immediately visible to users</li>
          </ul>
          
          <Button 
            onClick={handleNewGameClick} 
            className="w-full bg-primary hover:bg-primary/90"
            disabled={createGameMutation.isPending}
          >
            {createGameMutation.isPending ? "Creating..." : "Create New Game"}
          </Button>
        </div>
      </div>
      
      {/* Admin Player Management */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Player Management</h2>
        <p className="mb-6 text-gray-600">As an admin, you can remove any player from the lists below.</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeWeek && attendeesData && (
            <>
              <AdminAttendeesList 
                attendees={attendeesData.confirmed || []} 
                maxAttendees={activeWeek.maxAttendees || 10} 
                weekId={activeWeek.id}
                isLoading={isLoadingAttendees}
              />
              
              <AdminWaitlistList 
                waitlist={attendeesData.waitlist || []} 
                weekId={activeWeek.id}
                hasAvailableSpots={(attendeesData.confirmed?.length || 0) < (activeWeek.maxAttendees || 10)}
                isLoading={isLoadingAttendees}
              />
            </>
          )}
        </div>
      </div>
      
      {/* Date Picker Dialog */}
      <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select New Game Date</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-4">
            <div className="mx-auto">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                disabled={{ before: new Date() }}
              />
            </div>
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setIsDatePickerOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleCreateGameWithDate}
              disabled={!selectedDate || createGameMutation.isPending}
            >
              {createGameMutation.isPending ? "Creating..." : "Create Game"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}