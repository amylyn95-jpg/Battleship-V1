import { isSunk } from '../game/board';
import type { Board } from '../game/types';

interface FleetStatusProps {
  board: Board;
  title: string;
  /** Partial damage is only public information on your own fleet. */
  revealDamage: boolean;
}

export function FleetStatus({ board, title, revealDamage }: FleetStatusProps) {
  return (
    <div className="fleet-status">
      <h3>{title}</h3>
      <ul>
        {board.ships.map((ship) => {
          const sunk = isSunk(ship);
          const damage = revealDamage ? ship.hits.length : sunk ? ship.size : 0;
          return (
            <li key={ship.id} className={sunk ? 'ship-sunk' : ''}>
              <span className="ship-name">{ship.name}</span>
              <span className="ship-pips" aria-label={sunk ? 'sunk' : 'afloat'}>
                {Array.from({ length: ship.size }, (_, i) => (
                  <span key={i} className={i < damage ? 'pip pip--hit' : 'pip'} />
                ))}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
