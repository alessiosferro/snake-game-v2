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

    const dingRef = useRef<HTMLAudioElement | null>(null);

    const getFruitPosition = () => {
        let fruitPosition = generateCoords();

        if (playerState.current.parts.find(part => part.x === fruitPosition.x && part.y === fruitPosition.y)) {
            fruitPosition = getFruitPosition();
        }

        return fruitPosition;
    }

    const updateFruitPosition = () => {
        gameState.current = {
            ...gameState.current,
            fruitPosition: getFruitPosition()
        }
    }

    const updatePlayerDirection = (direction: 'up' | 'left' | 'right' | 'down') => {
        if (
            playerState.current.changedDirection ||
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
            direction,
            changedDirection: true
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

                canvasContext.strokeStyle = 'white';
                canvasContext.fillStyle = isHead ? 'rebeccapurple' : 'green';
                canvasContext.fillRect(part.x * cellSize, part.y * cellSize, cellSize, cellSize);

                if (isHead) {
                    canvasContext.fillStyle = 'black';

                    switch (playerState.current.direction) {
                        case "right": {
                            canvasContext.fillRect(part.x * cellSize + 5, part.y * cellSize + 5, 8, 5);
                            canvasContext.fillRect(part.x * cellSize + 5, part.y * cellSize + 20, 8, 5);
                            break;
                        }

                        case "left": {
                            canvasContext.fillRect(part.x * cellSize + 15, part.y * cellSize + 5, 8, 5);
                            canvasContext.fillRect(part.x * cellSize + 15, part.y * cellSize + 20, 8, 5);
                            break;
                        }

                        case "up": {
                            canvasContext.fillRect(part.x * cellSize + 5, part.y * cellSize + 15, 5, 8);
                            canvasContext.fillRect(part.x * cellSize + 20, part.y * cellSize + 15, 5, 8);
                            break;
                        }

                        case "down": {
                            canvasContext.fillRect(part.x * cellSize + 5, part.y * cellSize + 5, 5, 8);
                            canvasContext.fillRect(part.x * cellSize + 20, part.y * cellSize + 5, 5, 8);
                            break;
                        }
                    }
                }
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

            canvasContext.fillStyle = 'gold';
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

            if (!dingRef.current) return;

            dingRef.current.volume = .1;
            dingRef.current?.play();
        }

        const loop = () => {
            canvasContext.clearRect(0, 0, gridSize, gridSize);
            canvasContext.fillStyle = 'white';
            canvasContext.strokeStyle = 'white';

            playerState.current = {
                ...playerState.current,
                parts: [...playerState.current.parts],
                changedDirection: false
            }

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

    const getFinalMessage = () => {
        if (points < 50) {
            return <>
                Anche mia sorella saprebbe
                fare <strong>{points}</strong> punti. Impegnati di più per favore, fai pena.
            </>
        }

        if (points < 100) {
            return <>
                Discreto, ma hai ancora molto da migliorare. Hai fatto solamente <strong>{points}</strong>. Impegnati!
            </>
        }

        if (points < 150) {
            return  <>
                Stai migliorando, ma sei ancora una mezza sega e lo sai bene. Puoi fare meglio di <strong>{points}</strong> punti.
            </>
        }

        if (points < 200) {
            return <>
                Complimenti, forse inizi a meritare il mio rispetto, hai raccolto <strong>{points}</strong> punti!
            </>
        }

        return <>
            Sei un pro ormai, cacchio hai fatto <strong>{points}</strong>, cosa aspetti? Vai ad iscriverti ai tornei esport di snake! Ah aspetta, non esistono.
        </>
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
                        <p style={{fontWeight: "bold", fontSize: "8rem", color: "red"}}>SEI MORTO</p>
                        <p style={{margin: "3rem 0 5rem", lineHeight: "2.4rem"}}>{getFinalMessage()}</p>
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
                                <ArrowUpIcon/>
                            </button>
                            <button id="left" className="button">
                                <ArrowBackIcon/>
                            </button>
                            <button id="down" className="button">
                                <ArrowDownIcon/>
                            </button>
                            <button id="right" className="button">
                                <ArrowForwardIcon/>
                            </button>
                        </div>
                    </>
                )}
            </div>

            <audio ref={dingRef}>
                <source src="beep.mp3" type="audio/mpeg"/>
                Your browser does not support the audio element.
            </audio>

            <p style={{marginBottom: "2rem"}}>Manuel è un figo (w l'Armenia)</p>
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
    changedDirection: false,
    direction: 'right',
    isFruitEaten: false,
}

const initialGameState = {
    fruitPosition: generateCoords(),
    isEnd: false,
}

function generateCoords() {
    return {
        x: getRandomPosition(),
        y: getRandomPosition()
    }
}

function getRandomPosition() {
    return Math.floor(Math.random() * 10);
}