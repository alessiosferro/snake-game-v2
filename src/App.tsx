import './App.css';
import {MouseEventHandler, useEffect, useRef, useState} from "react";
import {
    ArrowBackIcon,
    ArrowDownIcon,
    ArrowForwardIcon,
    ArrowUpIcon
} from "@chakra-ui/icons";

function App() {
    const canvas = useRef<HTMLCanvasElement | null>(null);
    const timeoutId = useRef<number | null>(null);

    const [points, setPoints] = useState(0);
    const [showEnd, setShowEnd] = useState(false);

    const playerState = useRef(initialPlayerState);
    const gameState = useRef(initialGameState);

    const updateFruitPosition = () => {
        gameState.current = {
            ...gameState.current,
            fruitPosition: getFruitPosition()
        }
    }

    const updatePlayerDirection = (direction: 'up' | 'left' | 'right' | 'down') => {
        if (
            playerState.current.direction === direction ||
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

        // const drawGrid = () => {
        //     for (let i = 0; i < cellsCount; i++) {
        //         for (let j = 0; j < cellsCount; j++) {
        //             canvasContext.strokeRect(i * cellSize, j * cellSize, cellSize, cellSize);
        //         }
        //     }
        // }

        const drawPlayer = () => {
            const {parts} = playerState.current;

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];

                const isHead = i === 0;
                canvasContext.fillStyle = (isHead && parts.length > 1) ? 'rebeccapurple' : 'white';
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
            canvasContext.fillStyle = 'white';
            canvasContext.strokeStyle = 'white';

            movePlayer();
            eatFruit();

            // drawGrid();
            drawPlayer();
            drawFruit();

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
    }, [showEnd]);

    const handleReset = () => {
        setPoints(0);
        setShowEnd(false);
        gameState.current = initialGameState;
        playerState.current = initialPlayerState;
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
        <div className="app">
            <div className="container">
                {!showEnd && (
                    <p>
                        Punti: <strong>{points}</strong>
                    </p>
                )}

                {showEnd && (
                    <div className="end-results">
                        <p style={{ fontWeight: "bold", fontSize: "8rem", color: "red" }}>SEI MORTO</p>
                        <p style={{margin: "3rem 0 5rem", lineHeight: "2.4rem" }}>Anche mia sorella saprebbe fare <strong>{points}</strong> punti. Impegnati di più per favore, fai pena.</p>
                        <button className="button button--danger" onClick={handleReset}>Riprova</button>
                    </div>)}

                {!showEnd && (
                    <>
                        <canvas
                            ref={canvas}
                            height={gridSize}
                            width={gridSize}
                        />

                        <div className="actions" onClick={handleChangeDirectionClick}>
                            <button id="up" className="button">
                                <ArrowUpIcon />
                            </button>
                            <button id="left" className="button">
                                <ArrowBackIcon />
                            </button>
                            <button id="down" className="button">
                                <ArrowDownIcon />
                            </button>
                            <button id="right" className="button">
                                <ArrowForwardIcon />
                            </button>
                        </div>
                    </>
                )}
            </div>

            <p style={{ marginBottom: "2rem" }}>Manuel è un figo (w l'Armenia)</p>
        </div>
    )
}

export default App

const gridSize = 300;
const cellsCount = 10;
const FPS = 6;

const initialPlayerState = {
    parts: [{
        x: 5,
        y: 5
    }],
    direction: 'right',
    isFruitEaten: false,
}

const initialGameState = {
    fruitPosition: getFruitPosition(),
    isEnd: false,
}

function getFruitPosition() {
    return {
        x: getRandomPosition(),
        y: getRandomPosition()
    }
}

function getRandomPosition() {
    return Math.floor(Math.random() * 10);
}