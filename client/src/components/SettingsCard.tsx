import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Settings } from "lucide-react";

interface SettingsCardProps {
  maxAttendees: number;
  gameTime?: string;
  location?: string;
  onMaxAttendeesChange?: (value: number) => void;
  onGameTimeChange?: (value: string) => void;
  onLocationChange?: (value: string) => void;
  isPending?: boolean;
  readOnly?: boolean;
}

export default function SettingsCard({ 
  maxAttendees, 
  gameTime = "Sunday, 5:00 PM",
  location = "City Park Fields",
  onMaxAttendeesChange,
  onGameTimeChange,
  onLocationChange,
  isPending = false,
  readOnly = false
}: SettingsCardProps) {
  const [maxValue, setMaxValue] = useState(maxAttendees);
  const [gameTimeValue, setGameTimeValue] = useState(gameTime);
  const [locationValue, setLocationValue] = useState(location);

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    setMaxValue(newValue);
  };

  const handleGameTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGameTimeValue(e.target.value);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationValue(e.target.value);
  };

  const handleMaxBlur = () => {
    if (maxValue !== maxAttendees && !readOnly && onMaxAttendeesChange) {
      onMaxAttendeesChange(maxValue);
    }
  };

  const handleGameTimeBlur = () => {
    if (gameTimeValue !== gameTime && !readOnly && onGameTimeChange) {
      onGameTimeChange(gameTimeValue);
    }
  };

  const handleLocationBlur = () => {
    if (locationValue !== location && !readOnly && onLocationChange) {
      onLocationChange(locationValue);
    }
  };

  return (
    <Card className="lg:col-span-1 h-min">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Settings className="mr-2 h-5 w-5 text-gray-600" />
          Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Label htmlFor="max-attendees" className="block text-sm font-medium mb-1">
            Maximum Attendees
          </Label>
          <Input
            type="number"
            id="max-attendees"
            value={maxValue}
            min={1}
            onChange={handleMaxChange}
            onBlur={handleMaxBlur}
            disabled={isPending || readOnly}
            className="w-full"
          />
          <p className="text-sm text-gray-500 mt-1">
            Set the maximum number of players for this week
          </p>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div>
            <Label htmlFor="game-time" className="block text-sm font-medium mb-1">
              Game Time
            </Label>
            <Input
              type="text"
              id="game-time"
              value={gameTimeValue}
              onChange={handleGameTimeChange}
              onBlur={handleGameTimeBlur}
              disabled={isPending || readOnly}
              className="w-full"
            />
          </div>
          
          <div>
            <Label htmlFor="location" className="block text-sm font-medium mb-1">
              Location
            </Label>
            <Input
              type="text"
              id="location"
              value={locationValue}
              onChange={handleLocationChange}
              onBlur={handleLocationBlur}
              disabled={isPending || readOnly}
              className="w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
