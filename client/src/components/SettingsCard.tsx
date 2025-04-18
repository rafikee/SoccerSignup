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
  onMaxAttendeesChange?: (value: number) => void;
  isPending?: boolean;
  readOnly?: boolean;
}

export default function SettingsCard({ 
  maxAttendees, 
  onMaxAttendeesChange,
  isPending = false,
  readOnly = false
}: SettingsCardProps) {
  const [value, setValue] = useState(maxAttendees);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    setValue(newValue);
  };

  const handleBlur = () => {
    if (value !== maxAttendees && !readOnly && onMaxAttendeesChange) {
      onMaxAttendeesChange(value);
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
            value={value}
            min={1}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isPending || readOnly}
            className="w-full"
          />
          <p className="text-sm text-gray-500 mt-1">
            Set the maximum number of players for this week
          </p>
        </div>

        <div className="text-sm text-gray-600 pt-4 border-t border-gray-100">
          <div className="mb-2">
            <span className="font-medium">Game Time:</span>
            <span className="ml-2">Sunday, 5:00 PM</span>
          </div>
          <div>
            <span className="font-medium">Location:</span>
            <span className="ml-2">City Park Fields</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
