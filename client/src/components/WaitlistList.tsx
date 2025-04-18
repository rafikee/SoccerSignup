import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Watch, Clock, X, ArrowUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Attendee {
  id: number;
  name: string;
  signupTime: string;
  isWaitlist: boolean;
  isMyAttendee?: boolean;
}

interface WaitlistListProps {
  waitlist: Attendee[];
  weekId: number;
  hasAvailableSpots?: boolean;
  isLoading?: boolean;
  readOnly?: boolean;
}

export default function WaitlistList({ 
  waitlist, 
  weekId,
  hasAvailableSpots = false,
  isLoading = false, 
  readOnly = false
}: WaitlistListProps) {
  const { toast } = useToast();

  // Delete from waitlist mutation
  const deleteFromWaitlistMutation = useMutation({
    mutationFn: async (attendeeId: number) => {
      return apiRequest('DELETE', `/api/attendees/${attendeeId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/weeks', weekId, 'attendees'] });
      toast({
        title: "Success",
        description: "Player removed from waitlist",
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove player from waitlist",
        variant: "destructive",
      });
    }
  });

  // Promote from waitlist mutation
  const promoteFromWaitlistMutation = useMutation({
    mutationFn: async (attendeeId: number) => {
      return apiRequest('POST', `/api/weeks/${weekId}/promote-from-waitlist/${attendeeId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/weeks', weekId, 'attendees'] });
      toast({
        title: "Success",
        description: "Player promoted to confirmed list",
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to promote player",
        variant: "destructive",
      });
    }
  });

  const handleRemoveFromWaitlist = (attendeeId: number) => {
    if (readOnly) return;
    deleteFromWaitlistMutation.mutate(attendeeId);
  };

  const handlePromoteFromWaitlist = (attendeeId: number) => {
    if (readOnly || !hasAvailableSpots) return;
    promoteFromWaitlistMutation.mutate(attendeeId);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const isToday = new Date().toDateString() === date.toDateString();
    
    if (isToday) {
      return `Today, ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-xl">
            <Watch className="mr-2 h-5 w-5 text-gray-600" />
            Waitlist
          </CardTitle>
          <Badge variant="default" className="bg-amber-500">
            {waitlist.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="flex justify-between items-center py-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        ) : waitlist.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {waitlist.map((person, index) => (
              <li key={person.id} className="py-3 flex justify-between items-center">
                <div>
                  <span className="font-medium">{index + 1}. {person.name}</span>
                  <span className="ml-3 text-xs text-gray-500 flex items-center md:inline-flex">
                    <Clock className="h-3 w-3 mr-1 inline" />
                    {formatTime(person.signupTime)}
                  </span>
                </div>
                {!readOnly && (
                  <div className="flex items-center gap-2">
                    {hasAvailableSpots && (
                      <button 
                        className="text-green-600 hover:text-green-700"
                        aria-label="Move to confirmed list"
                        title="Move to confirmed list"
                        onClick={() => handlePromoteFromWaitlist(person.id)}
                        disabled={promoteFromWaitlistMutation.isPending}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                    )}
                    <button 
                      className={`${person.isMyAttendee ? 'text-gray-400 hover:text-red-500' : 'text-gray-300 cursor-not-allowed'}`}
                      aria-label={person.isMyAttendee ? "Remove from waitlist" : "You can only remove your own name"}
                      title={person.isMyAttendee ? "Remove from waitlist" : "You can only remove your own name"}
                      onClick={() => person.isMyAttendee && handleRemoveFromWaitlist(person.id)}
                      disabled={deleteFromWaitlistMutation.isPending || !person.isMyAttendee}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-8 text-center text-gray-500" id="empty-waitlist">
            <Watch className="h-10 w-10 mx-auto mb-2" />
            <p>No one on the waitlist yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
