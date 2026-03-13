const gameEl = document.getElementById("game");
const statsEl = document.getElementById("stats");
const equipmentEl = document.getElementById("equipment");
const messageEl = document.getElementById("message");
const levelUpPanel = document.getElementById("levelUpPanel");
const inventoryPanel = document.getElementById("inventoryPanel");
const inventoryListEl = document.getElementById("inventoryList");
const deathPanel = document.getElementById("deathPanel");
const winPanel = document.getElementById("winPanel");
const goalEl = document.getElementById("goal");

const MAP_WIDTH = 12;
const MAP_HEIGHT = 12;
const BOSS_FLOOR = 5;

const baseMap = [
    "############",
    "#..........#",
    "#..........#",
    "#..........#",
    "#..........#",
    "#..........#",
    "#..........#",
    "#..........#",
    "#..........#",
    "#..........#",
    "#..........#",
    "############"
];

const tileImages = {
    floor: "assets/floor.png",
    wall: "assets/wall.png",
    player: "assets/player.png",
    goblin: "assets/goblin.png",
    rat: "assets/rat.png",
    boss: "assets/boss.png",
    potion: "assets/potion.png",
    gold: "assets/gold.png",
    stairs: "assets/stairs.png",
    bossStairs: "assets/boss_stairs.png",
    dagger: "assets/dagger.png",
    sword: "assets/sword.png",
    armor: "assets/armor.png"
};

let player;
let enemies;
let lootItems;
let stairs;
let floorLevel;
let gameOver;
let gameWon;
let awaitingLevelChoice;
let inventoryOpen;

function resetGame() {
    floorLevel = 1;
    awaitingLevelChoice = false;
    inventoryOpen = false;
    gameWon = false;

    player = {
        x: 2,
        y: 2,
        baseMaxHp: 14,
        hp: 14,
        baseAttack: 1,
        gold: 0,
        level: 1,
        xp: 0,
        xpToNext: 3,
        inventory: [
            { name: "Potion", type: "consumable", heal: 5, icon: "potion" }
        ],
        equipment: {
            weapon: null,
            armor: null
        }
    };

    gameOver = false;
    hideLevelUpPanel();
    hideInventoryPanel();
    hideDeathPanel();
    hideWinPanel();
    gameEl.classList.remove("dead");
    gameEl.classList.remove("won");
    generateLevel();
    updateGoal();
    setMessage("Welcome to RogueHack. You start with one potion.");
    draw();
}

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") tryMove(0, -1);
    if (e.key === "ArrowDown") tryMove(0, 1);
    if (e.key === "ArrowLeft") tryMove(-1, 0);
    if (e.key === "ArrowRight") tryMove(1, 0);

    if (e.key === "1" || e.key === "2") {
        if (awaitingLevelChoice) {
            applyLevelChoice(e.key);
            return;
        }
    }

    if (e.key.toLowerCase() === "i") {
        toggleInventory();
        return;
    }

    if (inventoryOpen && /^[1-9]$/.test(e.key)) {
        useInventorySlot(Number(e.key));
        return;
    }

    if (e.key.toLowerCase() === "r" && (gameOver || gameWon)) {
        resetGame();
    }
});

resetGame();