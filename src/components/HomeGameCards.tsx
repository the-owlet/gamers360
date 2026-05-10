"use client";

import GameCard from "@/components/GameCard";
import type { GameTag } from "@/lib/constants";

interface Game {
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  maxPoints: number;
  multiplier: string;
  tags?: GameTag[];
  playTime?: string;
}

export default function HomeGameCards({ games }: { games: Game[] }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
      {games.map((game) => (
        <GameCard
          key={game.slug}
          slug={game.slug}
          name={game.name}
          icon={game.icon}
          color={game.color}
          maxPoints={game.maxPoints}
          multiplier={game.multiplier}
          isFavorite={false}
          onFavorite={(e) => e.preventDefault()}
          isHot={game.tags?.includes("hot") ?? false}
          tags={game.tags}
          description={game.description}
          playTime={game.playTime}
        />
      ))}
    </div>
  );
}
