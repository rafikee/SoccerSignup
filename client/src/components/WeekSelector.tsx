import { Link } from "wouter";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

interface Game {
  id: number;
  gameDate: string;
  isActive: boolean;
  gameTime: string;
  location: string;
}

interface GameSelectorProps {
  weeks: Game[];
  activeWeekId?: number;
  onCreateNewWeek: () => void;
  isPending: boolean;
}

export default function WeekSelector({ 
  weeks, 
  activeWeekId, 
  onCreateNewWeek,
  isPending
}: GameSelectorProps) {
  // Sort games by date (newest first)
  const sortedGames = [...weeks].sort((a, b) => 
    new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime()
  );

  return (
    <div className="mb-8 border-b border-gray-200 overflow-x-auto">
      <nav className="flex">
        {sortedGames.map((game) => {
          const isActive = game.id === activeWeekId;
          const gameDay = new Date(game.gameDate);
          const formattedDate = format(gameDay, 'EEEE, MMM d');
          
          return isActive ? (
            <span 
              key={game.id}
              className="px-4 py-2 text-sm font-medium text-primary border-b-2 border-primary"
              aria-current="page"
            >
              Today's Game ({formattedDate})
            </span>
          ) : (
            <Link key={game.id} href={`/week/${game.id}`} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
              {formattedDate}
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
          New Game
        </Button>
      </nav>
    </div>
  );
}
