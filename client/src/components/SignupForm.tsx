import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface SignupFormProps {
  weekId?: number;
  maxAttendees: number;
  currentCount: number;
}

type NotificationType = "success" | "waitlist" | "error" | "already-registered" | null;

export default function SignupForm({ 
  weekId, 
  maxAttendees,
  currentCount
}: SignupFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [notification, setNotification] = useState<NotificationType>(null);
  const [userRegistered, setUserRegistered] = useState(false);
  const [isWaitlisted, setIsWaitlisted] = useState(false);
  
  // Fetch attendees data to check if user is already registered
  const { data: attendeesData } = useQuery({
    queryKey: [`/api/weeks/${weekId}/attendees`],
    enabled: !!weekId,
  });
  
  // Check if any attendees for this user are already registered
  useEffect(() => {
    if (attendeesData) {
      // Check the main list
      const confirmedUserAttendees = attendeesData.confirmed?.filter((a: any) => a.isMyAttendee) || [];
      // Check the waitlist
      const waitlistUserAttendees = attendeesData.waitlist?.filter((a: any) => a.isMyAttendee) || [];
      
      if (confirmedUserAttendees.length > 0) {
        setUserRegistered(true);
        setIsWaitlisted(false);
        setNotification('success');
      } else if (waitlistUserAttendees.length > 0) {
        setUserRegistered(true);
        setIsWaitlisted(true);
        setNotification('waitlist');
      } else {
        setUserRegistered(false);
        setIsWaitlisted(false);
      }
    }
  }, [attendeesData]);

  const signupMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!weekId) throw new Error("No active week");
      return apiRequest('POST', `/api/weeks/${weekId}/attendees`, { name });
    },
    onSuccess: async (res) => {
      const data = await res.json();
      
      // Invalidate all queries related to attendees to ensure lists update
      await queryClient.invalidateQueries({ queryKey: [`/api/weeks/${weekId}/attendees`] });
      
      setIsWaitlisted(data.attendee.isWaitlist);
      setUserRegistered(true);
      setNotification(data.attendee.isWaitlist ? 'waitlist' : 'success');
      setName("");
    },
    onError: async (error: any) => {
      try {
        // Check if it's a specific error with structured data
        if (error.data && error.data.alreadyRegistered) {
          setNotification('already-registered');
        } else {
          // Generic error or validation error
          setNotification('error');
        }
      } catch (e) {
        setNotification('error');
      }
      
      // Only clear error notifications after a delay, not success or waitlist
      if (notification === 'error' || notification === 'already-registered') {
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setNotification('error');
      setTimeout(() => {
        setNotification(null);
      }, 3000);
      return;
    }
    
    signupMutation.mutate(name.trim());
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <UserPlus className="mr-2 h-5 w-5 text-gray-600" />
          Sign Up
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!userRegistered ? (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-grow">
                <label htmlFor="name" className="sr-only">Your Name</label>
                <Input
                  type="text"
                  id="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={signupMutation.isPending}
                />
              </div>
              <Button 
                type="submit"
                disabled={signupMutation.isPending}
                className="flex items-center justify-center"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Join Game
              </Button>
            </form>
            
            {notification === 'error' && (
              <Alert variant="destructive" className="mt-3">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Please enter your name
                </AlertDescription>
              </Alert>
            )}
            
            {notification === 'already-registered' && (
              <Alert variant="destructive" className="mt-3">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  You've already registered for this game
                </AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <>
            {notification === 'success' && (
              <Alert variant="default" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <p className="font-semibold">You are in this game.</p>
                  <p className="text-sm">If you want to remove yourself from this game you must do it on the same device you registered from. If you have trouble then reach out to an admin in the WhatsApp group. To add plus 1s then also reach out in the WhatsApp group.</p>
                </AlertDescription>
              </Alert>
            )}
            
            {notification === 'waitlist' && (
              <Alert variant="default" className="bg-amber-50 text-amber-700 border-amber-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <p className="font-semibold">You are on the waitlist.</p>
                  <p className="text-sm">You will be automatically added to the game if enough people drop. If you want to remove yourself you must do it on the same device you registered from. If you have trouble then reach out to an admin in the WhatsApp group. To add plus 1s then also reach out in the WhatsApp group.</p>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
