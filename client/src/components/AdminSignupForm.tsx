import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminSignupFormProps {
  weekId?: number;
  maxAttendees: number;
  currentCount: number;
}

type NotificationType = "success" | "waitlist" | "error" | "already-registered" | null;

export default function AdminSignupForm({ 
  weekId,
  maxAttendees,
  currentCount
}: AdminSignupFormProps) {
  const [name, setName] = useState("");
  const [notification, setNotification] = useState<NotificationType>(null);
  const { toast } = useToast();

  const signupMutation = useMutation({
    mutationFn: async (playerName: string) => {
      if (!weekId) throw new Error("Week ID is required");
      return apiRequest('POST', `/api/weeks/${weekId}/attendees`, { 
        name: playerName, 
        admin: true  // Add admin flag to bypass session checks
      });
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['/api/weeks', weekId, 'attendees'] });
      
      setName("");
      
      if (data.attendee.isWaitlist) {
        setNotification("waitlist");
        toast({
          title: "Added to waitlist",
          description: `${name} has been added to the waitlist`,
          variant: "default",
        });
      } else {
        setNotification("success");
        toast({
          title: "Success",
          description: `${name} has been signed up for the game`,
          variant: "default",
        });
      }
      
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    },
    onError: (error: any) => {
      if (error.data && error.data.alreadyRegistered) {
        setNotification("already-registered");
        toast({
          title: "Already registered",
          description: "This name is already signed up for this game",
          variant: "destructive",
        });
      } else {
        setNotification("error");
        toast({
          title: "Error",
          description: "Failed to sign up. Please try again.",
          variant: "destructive",
        });
      }
      
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    signupMutation.mutate(name);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Add New Player (Admin)</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="text"
            placeholder="Enter player name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full"
            disabled={signupMutation.isPending}
            aria-label="Player name"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={!name.trim() || signupMutation.isPending}
        >
          {signupMutation.isPending ? "Adding..." : "Add Player"}
        </Button>

        {notification === "success" && (
          <div className="p-3 bg-green-100 text-green-700 text-sm rounded">
            Player successfully added to the game!
          </div>
        )}
        
        {notification === "waitlist" && (
          <div className="p-3 bg-amber-100 text-amber-700 text-sm rounded">
            Game is full. Player has been added to the waitlist.
          </div>
        )}
        
        {notification === "already-registered" && (
          <div className="p-3 bg-red-100 text-red-700 text-sm rounded">
            This name is already signed up for this game.
          </div>
        )}
        
        {notification === "error" && (
          <div className="p-3 bg-red-100 text-red-700 text-sm rounded">
            Something went wrong. Please try again.
          </div>
        )}
      </form>
    </div>
  );
}