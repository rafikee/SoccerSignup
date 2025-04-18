import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClockIcon, MapPinIcon, UsersIcon } from "lucide-react";

interface InfoCardProps {
  maxAttendees: number;
  gameTime?: string;
  location?: string;
}

export default function InfoCard({ 
  maxAttendees, 
  gameTime = "5:00 PM",
  location = "City Park Fields"
}: InfoCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          <span className="text-primary">Game Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center">
            <UsersIcon className="h-5 w-5 mr-2 text-primary" />
            <div className="font-medium">Max Players:</div>
            <div className="ml-2">{maxAttendees}</div>
          </div>
          
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-primary" />
            <div className="font-medium">Game Time:</div>
            <div className="ml-2">{gameTime}</div>
          </div>
          
          <div className="flex items-center">
            <MapPinIcon className="h-5 w-5 mr-2 text-primary" />
            <div className="font-medium">Location:</div>
            <div className="ml-2">{location}</div>
          </div>

          <div className="mt-4">
            <a 
              href="/admin" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Admin Access
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}