import { Link } from "wouter";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

interface Week {
  id: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface WeekSelectorProps {
  weeks: Week[];
  activeWeekId?: number;
  onCreateNewWeek: () => void;
  isPending: boolean;
}

export default function WeekSelector({ 
  weeks, 
  activeWeekId, 
  onCreateNewWeek,
  isPending
}: WeekSelectorProps) {
  // Sort weeks by date (newest first)
  const sortedWeeks = [...weeks].sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return (
    <div className="mb-8 border-b border-gray-200 overflow-x-auto">
      <nav className="flex">
        {sortedWeeks.map((week) => {
          const isActive = week.id === activeWeekId;
          const startDate = new Date(week.startDate);
          const endDate = new Date(week.endDate);
          const dateRange = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`;
          
          return isActive ? (
            <span 
              key={week.id}
              className="px-4 py-2 text-sm font-medium text-primary border-b-2 border-primary"
              aria-current="page"
            >
              Current Week ({dateRange})
            </span>
          ) : (
            <Link key={week.id} href={`/week/${week.id}`}>
              <a className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                {dateRange}
              </a>
            </Link>
          );
        })}
        
        <Button 
          variant="default"
          size="sm"
          className="ml-auto"
          onClick={onCreateNewWeek}
          disabled={isPending}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          New Week
        </Button>
      </nav>
    </div>
  );
}
