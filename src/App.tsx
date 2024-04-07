import './App.css';
import {MouseEventHandler, useEffect, useRef, useState} from "react";

const gridSize = 300;
const cellsCount = 10;
const FPS = 7;

function App() {
    const canvas = useRef<HTMLCanvasElement | null>(null);
    const timeoutId = useRef<number | null>(null);

    const [points, setPoints] = useState(0);
    const [showEnd, setShowEnd] = useState(false);

    const playerState = useRef({
        parts: [{
            x: 5,
            y: 5
        }],
        direction: 'right',
        isFruitEaten: false,
    });

    const gameState = useRef({
        fruitPosition: getFruitPosition(),
        isEnd: false,
    });

    const updateFruitPosition = () => {
        gameState.current = {
            ...gameState.current,
            fruitPosition: getFruitPosition()
        }
    }

    const updatePlayerDirection = (direction: 'up' | 'left' | 'right' | 'down') => {
        if (
            playerState.current.direction === 'left' && direction === 'right' ||
            playerState.current.direction === 'right' && direction === 'left' ||
            playerState.current.direction === 'up' && direction === 'down' ||
            playerState.current.direction === 'down' && direction === 'up'
        ) {
            return;
        }

        playerState.current = {
            ...playerState.current,
            parts: [...playerState.current.parts],
            direction
        };
    }

    const handleKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
            case "ArrowDown":
                updatePlayerDirection('down')
                break;

            case "ArrowLeft":
                updatePlayerDirection('left');
                break;

            case "ArrowRight":
                updatePlayerDirection('right')
                break;

            case "ArrowUp":
                updatePlayerDirection('up')
                break;

        }
    }

    const listenForKeyboardEvents = () => {
        document.addEventListener('keydown', handleKeyDown);
    }

    const game = () => {
        if (!canvas.current) return;

        const canvasContext = canvas.current?.getContext('2d');

        const cellSize = gridSize / cellsCount;

        if (!canvasContext) return;

        const drawGrid = () => {
            for (let i = 0; i < cellsCount; i++) {
                for (let j = 0; j < cellsCount; j++) {
                    canvasContext.strokeRect(i * cellSize, j * cellSize, cellSize, cellSize);
                }
            }
        }

        const drawPlayer = () => {
            const { parts } = playerState.current;

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];

                const isHead = i === 0;
                canvasContext.fillStyle = (isHead && parts.length > 1) ? 'red' : 'black';
                canvasContext.fillRect(part.x * cellSize, part.y * cellSize, cellSize, cellSize);
            }
        }

        const detectCollision = () => {
            const [head, ...parts] = playerState.current.parts;

            return !!parts.find(p => p.x === head.x && p.y === head.y);
        }

        const endGame = () => {
            gameState.current = {
                ...gameState.current,
                isEnd: true
            }
        }

        const getUpdatedHead = (part: { y: number, x: number }) => {
            switch (playerState.current.direction) {
                case "up": {
                    const y = part.y - 1 < 0 ? cellsCount - 1 : part.y - 1;

                    return {
                        ...part,
                        y
                    };
                }


                case "down": {
                    const y = part.y + 1 === cellsCount ? 0 : part.y + 1;

                    return {
                        ...part,
                        y
                    }
                }

                case "left": {
                    const x = part.x - 1 < 0 ? cellsCount - 1 : part.x - 1;

                    return {
                        ...part,
                        x
                    }
                }

                case "right": {
                    const x = part.x + 1 === cellsCount ? 0 : part.x + 1;

                    return {
                        ...part,
                        x
                    }
                }
            }

            return part;
        }

        const movePlayer = () => {
            if (!playerState.current.isFruitEaten && detectCollision()) {
                return endGame();
            }

            playerState.current = {
                ...playerState.current,
                parts: playerState.current.parts.map((part, index, parts) => {
                    const isHead = index === 0;

                    if (isHead) {
                        return getUpdatedHead(part);
                    }

                    return {
                        x: parts[index - 1].x,
                        y: parts[index - 1].y
                    }
                })
            };
        }

        const updatePlayerPoints = () => {
            playerState.current = {
                ...playerState.current,
                parts: [...playerState.current.parts],
            };

            setPoints((points) => points + 5);
        }

        const drawFruit = () => {
            const {x, y} = gameState.current.fruitPosition;

            canvasContext.fillStyle = 'green';
            canvasContext.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }

        const updatePlayerParts = () => {
            const {x, y} = playerState.current.parts[playerState.current.parts.length - 1];

            playerState.current = {
                ...playerState.current,
                parts: [
                    ...playerState.current.parts,
                    {
                        x,
                        y
                    }
                ]
            };
        }

        const eatFruit = () => {
            const [head] = playerState.current.parts;
            const {x, y} = gameState.current.fruitPosition;

            if (head.x !== x || head.y !== y) {
                playerState.current = {
                    ...playerState.current,
                    parts: [...playerState.current.parts],
                    isFruitEaten: false
                };
                return;
            }

            updateFruitPosition();
            updatePlayerPoints();
            updatePlayerParts();

            playerState.current = {
                ...playerState.current,
                parts: [...playerState.current.parts],
                isFruitEaten: true
            };
        }

        const loop = () => {
            canvasContext.clearRect(0, 0, gridSize, gridSize);
            canvasContext.fillStyle = 'black';
            canvasContext.strokeStyle = 'black';

            drawGrid();
            drawPlayer();
            drawFruit();
            movePlayer();
            eatFruit();

            if (gameState.current.isEnd) {
                canvasContext.clearRect(0, 0, gridSize, gridSize);
                setShowEnd(true);
                return;
            }

            timeoutId.current = setTimeout(() => {
                loop();
            }, 1000 / FPS);
        }

        loop();
    };

    useEffect(() => {
        listenForKeyboardEvents();

        if (!showEnd) {
            game();
        }

        return () => {
            if (!timeoutId.current) return;
            clearTimeout(timeoutId.current);
            document.removeEventListener('keydown', handleKeyDown);
        }
    }, [showEnd, game]);

    const handleReset = () => {
        setPoints(0);
        setShowEnd(false);
    }

    const handleChangeDirectionClick: MouseEventHandler = (e) => {
        e.stopPropagation();

        const element = e.target as HTMLButtonElement;

        if (!element.id) return;

        switch (element.id) {
            case "up":
                updatePlayerDirection("up");
                break;

            case "down":
                updatePlayerDirection("down");
                break;

            case "right":
                updatePlayerDirection("right");
                break;

            case "left":
                updatePlayerDirection("left");
                break;
        }
    }

    return (
        <div className="container">
            <h1 style={{ margin: 0, textTransform: 'uppercase' }}>Snake</h1>

            <p>Manuel è un figo (w l'Armenia)</p>

            {!showEnd && (
                <p>
                    Punti: <strong>{points}</strong>
                </p>
            )}

            {showEnd && (
                <>
                    <p>Peccato, hai perso!</p>
                    <p>In totale hai realizzato {points} punti!</p>
                    <button onClick={handleReset}>Riprova</button>
                </>)}

            {!showEnd && <canvas
                ref={canvas}
                height={gridSize}
                width={gridSize}
            />}

            <div className="mobile-buttons" onClick={handleChangeDirectionClick}>
                <button id="up" className="button">UP</button>
                <button id="left" className="button">LEFT</button>
                <button id="down" className="button">DOWN</button>
                <button id="right" className="button">RIGHT</button>
            </div>
        </div>
    )
}

export default App

const getFruitPosition = () => {
    return {
        x: getRandomPosition(),
        y: getRandomPosition()
    }
}

const getRandomPosition = () => {
    return Math.floor(Math.random() * 10);
}