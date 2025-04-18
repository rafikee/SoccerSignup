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
import { Users, Clock, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Attendee {
  id: number;
  name: string;
  signupTime: string;
  isWaitlist: boolean;
}

interface AdminAttendeesListProps {
  attendees: Attendee[];
  maxAttendees: number;
  weekId: number;
  isLoading?: boolean;
}

export default function AdminAttendeesList({ 
  attendees, 
  maxAttendees, 
  weekId,
  isLoading = false
}: AdminAttendeesListProps) {
  const { toast } = useToast();

  const deleteAttendeeMutation = useMutation({
    mutationFn: async (attendeeId: number) => {
      // Append admin=true query parameter to bypass session checks
      return apiRequest('DELETE', `/api/attendees/${attendeeId}?admin=true`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/weeks', weekId, 'attendees'] });
      toast({
        title: "Success",
        description: "Player removed successfully",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to remove player",
        variant: "destructive",
      });
    }
  });

  const handleRemoveAttendee = (attendeeId: number) => {
    deleteAttendeeMutation.mutate(attendeeId);
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
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-xl">
            <Users className="mr-2 h-5 w-5 text-gray-600" />
            Confirmed Players
          </CardTitle>
          <Badge variant="default" className="bg-green-600">
            {attendees.length}/{maxAttendees}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex justify-between items-center py-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        ) : attendees.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {attendees.map((attendee, index) => (
              <li key={attendee.id} className="py-3 flex justify-between items-center">
                <div>
                  <span className="font-medium">{index + 1}. {attendee.name}</span>
                  <span className="ml-3 text-xs text-gray-500 flex items-center md:inline-flex">
                    <Clock className="h-3 w-3 mr-1 inline" />
                    {formatTime(attendee.signupTime)}
                  </span>
                </div>
                <button 
                  className="text-gray-400 hover:text-red-500"
                  aria-label="Remove player"
                  title="Remove player"
                  onClick={() => handleRemoveAttendee(attendee.id)}
                  disabled={deleteAttendeeMutation.isPending}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <Users className="h-10 w-10 mx-auto mb-2" />
            <p>No confirmed players yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}