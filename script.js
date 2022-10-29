/** @type {HTMLCanvasElement} */
const canvas = document.querySelector("#game-canvas");

const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;

const BLOCK_LENGTH = CANVAS_WIDTH / GRID_WIDTH;

const BLOCK_COLORS = ["red", "orange", "yellow", "green", "cyan", "blue", "purple"];
const BLOCK_TYPES = [
    // Z Block
    [
        [0, 0],
        [1, 0],
        [1, 1],
        [2, 1],
    ],
    // S BLock
    [
        [0, 1],
        [1, 1],
        [1, 0],
        [2, 0],
    ],
    // I Block
    [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
    ],
    // L Block
    [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 2],
    ],
    // J Block
    [
        [1, 0],
        [1, 1],
        [1, 2],
        [0, 2],
    ],
    // T Block
    [
        [0, 0],
        [0, 1],
        [1, 1],
        [0, 2],
    ],
    // O Block
    [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
    ],
];

const score = document.querySelector("#score");

function choice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function degToRad(deg) {
    return (deg / 180) * Math.PI;
}

function findMidpoint(points) {
    const coordTotal = points.reduce(
        (prev, cur) => {
            return [prev[0] + cur[0], prev[1] + cur[1]];
        },
        [0, 0]
    );

    return coordTotal.map(coord => Math.round(coord / points.length));
}

class Field extends Array {
    constructor(height, width) {
        super();

        for (let i = 0; i < height; i++) {
            const line = [];
            for (let j = 0; j < width; j++) {
                line.push(null);
            }
            this.push(line);
        }
    }

    saveBlocks(blocks) {
        for (const coord of blocks.coordinates) {
            this[coord[1]][coord[0]] = blocks.color;
        }
    }

    collisionCheck(blocks) {
        for (const coord of blocks.coordinates) {
            if (this[coord[1]][coord[0]] !== null) {
                return true;
            }
        }

        return false;
    }

    eliminateLine(y) {
        if (y <= 0) {
            return;
        }

        for (let x = 0; x < GRID_WIDTH; x++) {
            this[y][x] = this[y - 1][x];
            this[y - 1][x] = null;
        }

        this.eliminateLine(y - 1);
    }

    checkLine() {
        let total = 0;

        lineLoop: for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (this[y][x] === null) {
                    continue lineLoop;
                }
            }

            total += 1;
            this.eliminateLine(y);
        }

        return total;
    }
}

class Blocks {
    constructor() {
        this.color = choice(BLOCK_COLORS);

        // Very stupid, but I need do this to deep clone the array
        this.coordinates = choice(BLOCK_TYPES).map(coord => [...coord]);

        this.midpoint = findMidpoint(this.coordinates);
    }

    moveY(value) {
        for (const coord of this.coordinates) {
            coord[1] += value;
        }

        this.midpoint[1] += value;
    }

    moveX(value) {
        for (const coord of this.coordinates) {
            coord[0] += value;
        }

        this.midpoint[0] += value;
    }

    /**
     * **It rotates counter clockwise**
     */
    rotate(deg) {
        const rad = degToRad(deg);

        const sin = Math.sin(rad);
        const cos = Math.cos(rad);

        for (const coord of this.coordinates) {
            const temp = Math.round(
                (coord[0] - this.midpoint[0]) * cos -
                    (coord[1] - this.midpoint[1]) * sin +
                    this.midpoint[0]
            );
            coord[1] = Math.round(
                (coord[0] - this.midpoint[0]) * sin +
                    (coord[1] - this.midpoint[1]) * cos +
                    this.midpoint[1]
            );
            coord[0] = temp;
        }
    }
}

class TetrisCanvas {
    constructor(canvas) {
        this.ctx = canvas.getContext("2d");

        this.currentBlocks = {};
        this.field = [];
        this.isLost = false;
    }

    setCurrentBlocks(blocks) {
        this.currentBlocks = blocks;
    }

    setField(field) {
        this.field = field;
    }

    setIsLost(isLost) {
        this.isLost = isLost;
    }

    drawStartingScreen() {
        const { ctx } = this;

        ctx.fillStyle = "hsla(0, 0%, 0%, 0.7)";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = "white";
        ctx.font = "40px consolas";
        ctx.textAlign = "center";
        ctx.fillText("Tetris!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);

        ctx.font = "20px consolas";
        ctx.fillText("Press space bar to start", CANVAS_WIDTH / 2, (CANVAS_HEIGHT * 2) / 3);
    }

    drawGame() {
        requestAnimationFrame(this.update);
    }

    update = () => {
        const { ctx } = this;

        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.beginPath();

        this.drawBackground();
        this.drawField();
        this.drawBlocks();

        if (this.isLost) {
            this.drawLostScreen();
        }

        requestAnimationFrame(this.update);
    };

    drawBackground() {
        const { ctx } = this;

        ctx.fillStyle = "#DDDDDDDD";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    drawBlocks() {
        const { ctx, currentBlocks } = this;

        ctx.beginPath();
        ctx.fillStyle = currentBlocks.color;

        for (const coord of currentBlocks.coordinates) {
            ctx.rect(coord[0] * BLOCK_LENGTH, coord[1] * BLOCK_LENGTH, BLOCK_LENGTH, BLOCK_LENGTH);
            ctx.fill();
            ctx.stroke();
        }
    }

    drawLostScreen() {
        const { ctx } = this;

        ctx.fillStyle = "#00000088";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = "red";
        ctx.font = "30px consolas";
        ctx.textAlign = "center";
        ctx.fillText("You LOST!!!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);

        ctx.fillStyle = "white";
        ctx.font = "18px consolas";
        ctx.fillText("Press space bar to try again", CANVAS_WIDTH / 2, (CANVAS_HEIGHT * 2) / 3);
    }

    drawField() {
        const { ctx } = this;

        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const color = this.field[y][x];

                if (color === null) {
                    continue;
                }

                ctx.beginPath();
                ctx.fillStyle = color;
                ctx.rect(x * BLOCK_LENGTH, y * BLOCK_LENGTH, BLOCK_LENGTH, BLOCK_LENGTH);
                ctx.fill();
                ctx.stroke();
            }
        }
    }
}

class Tetris {
    constructor() {
        this.tetrisCanvas = new TetrisCanvas(canvas);
    }

    start() {
        this.tetrisCanvas.drawStartingScreen();

        document.addEventListener("keyup", this.onKeyUp);
    }

    startGame() {
        this.currentBlocks = new Blocks();

        this.field = new Field(GRID_HEIGHT, GRID_WIDTH);

        this.score = 0;

        this.tetrisCanvas.setCurrentBlocks(this.currentBlocks);
        this.tetrisCanvas.setField(this.field);
        this.tetrisCanvas.drawGame();

        document.addEventListener("keydown", this.onKeyDown);
        document.removeEventListener("keyup", this.onKeyUp);

        this.tickTimerId = setInterval(this.tick, 800);
    }

    tick = () => {
        this.currentBlocks.moveY(1);
        if (this.verticalCollisionCheck() || this.field.collisionCheck(this.currentBlocks)) {
            this.currentBlocks.moveY(-1);

            this.field.saveBlocks(this.currentBlocks);

            const lineEliminated = this.field.checkLine();
            this.score += lineEliminated * 1000;
            score.textContent = `Score: ${this.score}`;

            this.currentBlocks = new Blocks();
            this.tetrisCanvas.setCurrentBlocks(this.currentBlocks);

            if (this.checkBlocksCollision()) {
                this.tetrisCanvas.setIsLost(true);
                clearInterval(this.tickTimerId);
                document.removeEventListener("keydown", this.onKeyDown);
                document.addEventListener("keyup", this.onKeyUp);
            }
        }
    };

    onKeyUp = event => {
        if (event.key === " ") {
            this.startGame();
            this.tetrisCanvas.setIsLost(false);
        }
    };

    horizontalCollisionCheck() {
        for (const coord of this.currentBlocks.coordinates) {
            if (!(0 <= coord[0] && coord[0] < GRID_WIDTH)) {
                return true;
            }
        }

        return false;
    }

    verticalCollisionCheck() {
        for (const coord of this.currentBlocks.coordinates) {
            if (coord[1] >= GRID_HEIGHT) {
                return true;
            }
        }

        return false;
    }

    checkBlocksCollision() {
        return (
            this.horizontalCollisionCheck() ||
            this.verticalCollisionCheck() ||
            this.field.collisionCheck(this.currentBlocks)
        );
    }

    onKeyDown = event => {
        switch (event.key) {
            case "ArrowLeft":
            case "a":
                this.currentBlocks.moveX(-1);
                if (this.checkBlocksCollision()) {
                    this.currentBlocks.moveX(1);
                }
                break;
            case "ArrowRight":
            case "d":
                this.currentBlocks.moveX(1);
                if (this.checkBlocksCollision()) {
                    this.currentBlocks.moveX(-1);
                }
                break;
            case "ArrowDown":
            case "s":
                this.tick();
                break;
            case "ArrowUp":
            case "w":
                this.currentBlocks.rotate(90);
                if (this.checkBlocksCollision()) {
                    this.currentBlocks.rotate(-90);
                }
                break;
        }
    };
}

const tetris = new Tetris();
tetris.start();
