import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { FleetStatus } from './components/FleetStatus';
import { Grid } from './components/Grid';
import { canPlace, emptyBoard, placeShip, randomBoard, shipCells } from './game/board';
import { aiFire, createGame, playerFire, startBattle, type GameState } from './game/engine';
import { FLEET, type Coord, type Difficulty, type Orientation } from './game/types';

const AI_THINKING_MS = 650;

const DIFFICULTY_BLURB: Record<Difficulty, string> = {
  easy: 'fires at random',
  normal: 'hunts adjacent cells after a hit',
  hard: 'searches on a parity grid and tracks a wounded ship’s axis',
};

export default function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [game, setGame] = useState<GameState>(() => createGame('normal'));
  const [placement, setPlacement] = useState(() => emptyBoard());
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [hover, setHover] = useState<Coord | null>(null);

  const nextShip = FLEET[placement.ships.length];
  const placementComplete = placement.ships.length === FLEET.length;

  const preview = useMemo(() => {
    if (!hover || !nextShip) return [];
    return shipCells(hover, nextShip.size, orientation);
  }, [hover, nextShip, orientation]);

  const previewValid = Boolean(
    hover && nextShip && canPlace(placement, hover, nextShip.size, orientation),
  );

  const newGame = useCallback((level: Difficulty) => {
    setDifficulty(level);
    setGame(createGame(level));
    setPlacement(emptyBoard());
    setOrientation('horizontal');
    setHover(null);
  }, []);

  const handlePlace = (coord: Coord) => {
    if (!nextShip) return;
    const next = placeShip(placement, nextShip, coord, orientation);
    if (next) setPlacement(next);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'r') return;
      setOrientation((current) => (current === 'horizontal' ? 'vertical' : 'horizontal'));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // The AI's shot is delayed so the player can read the outcome of their own.
  useEffect(() => {
    if (game.phase !== 'aiTurn') return;
    const timer = window.setTimeout(() => {
      setGame((current) => (current.phase === 'aiTurn' ? aiFire(current) : current));
    }, AI_THINKING_MS);
    return () => window.clearTimeout(timer);
  }, [game.phase, game.log.length]);

  const status = (() => {
    if (game.phase === 'placement') {
      return placementComplete
        ? 'Fleet ready — start the battle.'
        : `Place your ${nextShip?.name} (${nextShip?.size} cells).`;
    }
    if (game.phase === 'gameOver') {
      return game.winner === 'player' ? 'Victory — enemy fleet destroyed.' : 'Defeat — fleet lost.';
    }
    return game.phase === 'playerTurn' ? 'Your turn — fire at the enemy grid.' : 'Enemy is aiming…';
  })();

  return (
    <div className="app">
      <header className="app-header">
        <h1>Battleship</h1>
        <p className="tagline">Sink the enemy fleet before it sinks yours.</p>
      </header>

      <p className="status" role="status">
        {status}
      </p>

      {game.phase === 'placement' ? (
        <section className="placement">
          <div className="placement-controls">
            <button
              type="button"
              onClick={() =>
                setOrientation(orientation === 'horizontal' ? 'vertical' : 'horizontal')
              }
            >
              Rotate ({orientation === 'horizontal' ? 'horizontal' : 'vertical'}) — R
            </button>
            <button type="button" onClick={() => setPlacement(randomBoard())}>
              Random fleet
            </button>
            <button
              type="button"
              onClick={() => setPlacement(emptyBoard())}
              disabled={placement.ships.length === 0}
            >
              Clear
            </button>
            <label className="difficulty">
              Enemy AI
              <select
                value={difficulty}
                onChange={(event) => newGame(event.target.value as Difficulty)}
              >
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
                <option value="hard">Hard</option>
              </select>
            </label>
            <button
              type="button"
              className="primary"
              disabled={!placementComplete}
              onClick={() => setGame(startBattle(game, placement))}
            >
              Start battle
            </button>
          </div>
          <p className="hint">
            Enemy AI {DIFFICULTY_BLURB[difficulty]}. Click a cell to drop the highlighted ship.
          </p>
          <div className="boards">
            <Grid
              board={placement}
              revealShips
              label="Your waters"
              interactive={!placementComplete}
              onCellClick={handlePlace}
              onCellHover={setHover}
              preview={preview}
              previewValid={previewValid}
            />
          </div>
        </section>
      ) : (
        <>
          <div className="boards">
            <div className="board-column">
              <Grid
                board={game.aiBoard}
                revealShips={game.phase === 'gameOver'}
                label="Enemy waters"
                interactive={game.phase === 'playerTurn'}
                onCellClick={(coord) => setGame((current) => playerFire(current, coord))}
              />
              <FleetStatus board={game.aiBoard} title="Enemy fleet" revealDamage={false} />
            </div>
            <div className="board-column">
              <Grid board={game.playerBoard} revealShips label="Your waters" />
              <FleetStatus board={game.playerBoard} title="Your fleet" revealDamage />
            </div>
          </div>

          <div className="footer-row">
            <button type="button" className="primary" onClick={() => newGame(difficulty)}>
              {game.phase === 'gameOver' ? 'Play again' : 'Restart'}
            </button>
            <ol className="log" aria-label="Battle log">
              {game.log.slice(0, 8).map((entry, index) => (
                <li key={`${game.log.length - index}-${entry}`}>{entry}</li>
              ))}
            </ol>
          </div>
        </>
      )}
    </div>
  );
}
