import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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

type NotificationType = "success" | "waitlist" | "error" | null;

export default function SignupForm({ 
  weekId, 
  maxAttendees,
  currentCount
}: SignupFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [notification, setNotification] = useState<NotificationType>(null);

  const signupMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!weekId) throw new Error("No active week");
      return apiRequest('POST', `/api/weeks/${weekId}/attendees`, { name });
    },
    onSuccess: async (res) => {
      const data = await res.json();
      await queryClient.invalidateQueries({ queryKey: ['/api/weeks', weekId, 'attendees'] });
      
      setNotification(data.isWaitlist ? 'waitlist' : 'success');
      setName("");
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    },
    onError: () => {
      setNotification('error');
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setNotification('error');
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
            Add Player
          </Button>
        </form>
        
        {notification === 'success' && (
          <Alert variant="default" className="mt-3 bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              You've been added to the list
            </AlertDescription>
          </Alert>
        )}
        
        {notification === 'waitlist' && (
          <Alert variant="default" className="mt-3 bg-amber-50 text-amber-700 border-amber-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You've been added to the waitlist
            </AlertDescription>
          </Alert>
        )}
        
        {notification === 'error' && (
          <Alert variant="destructive" className="mt-3">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Please enter your name
            </AlertDescription>
          </Alert>
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
