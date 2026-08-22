import { isSunk, key, shipAt } from '../game/board';
import { BOARD_SIZE, type Board, type Coord } from '../game/types';

const COLUMN_LABELS = 'ABCDEFGHIJ'.split('');

type CellVisual = 'water' | 'ship' | 'hit' | 'miss' | 'sunk';

interface GridProps {
  board: Board;
  /** Show un-hit ships. True for your own waters, false for the enemy's. */
  revealShips: boolean;
  label: string;
  onCellClick?: (coord: Coord) => void;
  onCellHover?: (coord: Coord | null) => void;
  /** Cells highlighted during placement. */
  preview?: Coord[];
  previewValid?: boolean;
  interactive?: boolean;
}

function visualFor(board: Board, coord: Coord, revealShips: boolean): CellVisual {
  const shot = board.shots[key(coord)];
  const ship = shipAt(board, coord);
  if (shot === 'hit') return ship && isSunk(ship) ? 'sunk' : 'hit';
  if (shot === 'miss') return 'miss';
  if (ship && revealShips) return 'ship';
  return 'water';
}

export function Grid({
  board,
  revealShips,
  label,
  onCellClick,
  onCellHover,
  preview = [],
  previewValid = true,
  interactive = false,
}: GridProps) {
  const previewKeys = new Set(preview.map(key));

  return (
    <section className="grid-panel" aria-label={label}>
      <h2 className="grid-title">{label}</h2>
      <div className="grid" onMouseLeave={() => onCellHover?.(null)}>
        <div className="grid-corner" />
        {COLUMN_LABELS.map((letter) => (
          <div key={letter} className="grid-header">
            {letter}
          </div>
        ))}
        {Array.from({ length: BOARD_SIZE }, (_, row) => (
          <div key={row} style={{ display: 'contents' }}>
            <div className="grid-header">{row + 1}</div>
            {Array.from({ length: BOARD_SIZE }, (_, col) => {
              const coord = { row, col };
              const visual = visualFor(board, coord, revealShips);
              const previewed = previewKeys.has(key(coord));
              const cellName = `${COLUMN_LABELS[col]}${row + 1}`;
              return (
                <button
                  key={col}
                  type="button"
                  className={[
                    'cell',
                    `cell--${visual}`,
                    previewed ? (previewValid ? 'cell--preview' : 'cell--preview-invalid') : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  disabled={!interactive}
                  aria-label={`${label} ${cellName}: ${visual}`}
                  data-cell={cellName}
                  onClick={() => onCellClick?.(coord)}
                  onMouseEnter={() => onCellHover?.(coord)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
