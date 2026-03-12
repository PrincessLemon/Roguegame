const gameEl = document.getElementById("game");
const statsEl = document.getElementById("stats");
const equipmentEl = document.getElementById("equipment");
const messageEl = document.getElementById("message");
const levelUpPanel = document.getElementById("levelUpPanel");
const inventoryPanel = document.getElementById("inventoryPanel");
const inventoryListEl = document.getElementById("inventoryList");

const MAP_WIDTH = 12;
const MAP_HEIGHT = 12;

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
    potion: "assets/potion.png",
    gold: "assets/gold.png",
    stairs: "assets/stairs.png",
    dagger: "assets/dagger.png",
    sword: "assets/sword.png",
    armor: "assets/armor.png"
};

const fallbackImages = {
    dagger: tileImages.gold,
    sword: tileImages.gold,
    armor: tileImages.potion
};

let player;
let enemies;
let lootItems;
let stairs;
let floorLevel;
let gameOver;
let awaitingLevelChoice;
let inventoryOpen;

function resetGame() {
    floorLevel = 1;
    awaitingLevelChoice = false;
    inventoryOpen = false;

    player = {
        x: 2,
        y: 2,
        baseMaxHp: 10,
        hp: 10,
        baseAttack: 1,
        gold: 0,
        level: 1,
        xp: 0,
        xpToNext: 3,
        inventory: [],
        equipment: {
            weapon: null,
            armor: null
        }
    };

    gameOver = false;
    hideLevelUpPanel();
    hideInventoryPanel();
    generateLevel();
    setMessage("Welcome to RogueHack.");
    draw();
}

function generateLevel() {
    enemies = [];
    lootItems = [];

    player.x = 2;
    player.y = 2;

    const enemyCount = 2 + floorLevel;
    const lootCount = 3;

    for (let i = 0; i < enemyCount; i++) {
        const pos = getRandomEmptyPosition();
        enemies.push({
            x: pos.x,
            y: pos.y,
            hp: 2 + floorLevel,
            alive: true,
            xpReward: 1 + Math.floor(floorLevel / 2)
        });
    }

    for (let i = 0; i < lootCount; i++) {
        const pos = getRandomEmptyPosition();
        lootItems.push({
            x: pos.x,
            y: pos.y,
            item: generateRandomLoot(),
            pickedUp: false
        });
    }

    const stairPos = getRandomEmptyPosition();
    stairs = {
        x: stairPos.x,
        y: stairPos.y
    };
}

function generateRandomLoot() {
    const roll = Math.random();

    if (roll < 0.30) {
        return { name: "Gold", type: "gold", amount: 1 + Math.floor(Math.random() * 5) };
    }

    if (roll < 0.55) {
        return { name: "Potion", type: "consumable", heal: 3, icon: "potion" };
    }

    if (roll < 0.75) {
        return { name: "Dagger", type: "weapon", attackBonus: 1, icon: "dagger" };
    }

    if (roll < 0.90) {
        return { name: "Sword", type: "weapon", attackBonus: 2, icon: "sword" };
    }

    return { name: "Leather Armor", type: "armor", hpBonus: 3, icon: "armor" };
}

function tileAt(x, y) {
    return baseMap[y][x];
}

function isWall(x, y) {
    return tileAt(x, y) === "#";
}

function setMessage(text) {
    messageEl.textContent = text;
}

function showLevelUpPanel() {
    levelUpPanel.classList.remove("hidden");
}

function hideLevelUpPanel() {
    levelUpPanel.classList.add("hidden");
}

function showInventoryPanel() {
    inventoryPanel.classList.remove("hidden");
}

function hideInventoryPanel() {
    inventoryPanel.classList.add("hidden");
}

function toggleInventory() {
    if (gameOver || awaitingLevelChoice) return;

    inventoryOpen = !inventoryOpen;

    if (inventoryOpen) {
        renderInventory();
        showInventoryPanel();
        setMessage("Inventory opened.");
    } else {
        hideInventoryPanel();
        setMessage("Inventory closed.");
    }

    draw();
}

function getArmorHpBonus() {
    return player.equipment.armor ? (player.equipment.armor.hpBonus || 0) : 0;
}

function getPlayerMaxHp() {
    return player.baseMaxHp + getArmorHpBonus();
}

function getWeaponAttackBonus() {
    return player.equipment.weapon ? (player.equipment.weapon.attackBonus || 0) : 0;
}

function getPlayerAttack() {
    return player.baseAttack + getWeaponAttackBonus();
}

function syncPlayerStats() {
    const maxHp = getPlayerMaxHp();
    if (player.hp > maxHp) {
        player.hp = maxHp;
    }
}

function updateStats() {
    syncPlayerStats();

    statsEl.textContent =
        `HP: ${player.hp}/${getPlayerMaxHp()} | ` +
        `ATK: ${getPlayerAttack()} | ` +
        `Gold: ${player.gold} | ` +
        `Floor: ${floorLevel} | ` +
        `LVL: ${player.level} | ` +
        `XP: ${player.xp}/${player.xpToNext}`;

    const weaponName = player.equipment.weapon ? player.equipment.weapon.name : "None";
    const armorName = player.equipment.armor ? player.equipment.armor.name : "None";

    equipmentEl.textContent = `Weapon: ${weaponName} | Armor: ${armorName}`;
}

function isOccupied(x, y) {
    if (player && player.x === x && player.y === y) return true;

    for (const enemy of enemies) {
        if (enemy.alive && enemy.x === x && enemy.y === y) return true;
    }

    for (const loot of lootItems) {
        if (!loot.pickedUp && loot.x === x && loot.y === y) return true;
    }

    if (stairs && stairs.x === x && stairs.y === y) return true;

    return false;
}

function getRandomEmptyPosition() {
    let x;
    let y;

    do {
        x = Math.floor(Math.random() * MAP_WIDTH);
        y = Math.floor(Math.random() * MAP_HEIGHT);
    } while (isWall(x, y) || isOccupied(x, y));

    return { x, y };
}

function getEnemyAt(x, y) {
    return enemies.find(enemy => enemy.alive && enemy.x === x && enemy.y === y);
}

function getLootAt(x, y) {
    return lootItems.find(loot => !loot.pickedUp && loot.x === x && loot.y === y);
}

function getImageForItem(item) {
    if (!item || !item.icon) return tileImages.gold;

    if (tileImages[item.icon]) {
        return tileImages[item.icon];
    }

    return tileImages.gold;
}

function createTile(imagePath, fallbackPath = null) {
    const tile = document.createElement("div");
    tile.classList.add("tile");

    const img = document.createElement("img");
    img.src = imagePath;
    img.alt = "";

    if (fallbackPath) {
        img.onerror = function () {
            this.onerror = null;
            this.src = fallbackPath;
        };
    }

    tile.appendChild(img);
    return tile;
}

function draw() {
    gameEl.innerHTML = "";

    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            let imagePath = tileImages.floor;
            let fallbackPath = null;

            if (isWall(x, y)) {
                imagePath = tileImages.wall;
            }

            for (const loot of lootItems) {
                if (!loot.pickedUp && loot.x === x && loot.y === y) {
                    if (loot.item.type === "gold") {
                        imagePath = tileImages.gold;
                    } else {
                        imagePath = getImageForItem(loot.item);
                        fallbackPath = fallbackImages[loot.item.icon] || null;
                    }
                }
            }

            if (stairs.x === x && stairs.y === y) {
                imagePath = tileImages.stairs;
                fallbackPath = null;
            }

            for (const enemy of enemies) {
                if (enemy.alive && enemy.x === x && enemy.y === y) {
                    imagePath = tileImages.goblin;
                    fallbackPath = null;
                }
            }

            if (player.x === x && player.y === y) {
                imagePath = tileImages.player;
                fallbackPath = null;
            }

            gameEl.appendChild(createTile(imagePath, fallbackPath));
        }
    }

    updateStats();

    if (inventoryOpen) {
        renderInventory();
    }
}

function tryMove(dx, dy) {
    if (gameOver || awaitingLevelChoice || inventoryOpen) return;

    const newX = player.x + dx;
    const newY = player.y + dy;

    if (isWall(newX, newY)) {
        setMessage("You bump into a wall.");
        draw();
        return;
    }

    const enemy = getEnemyAt(newX, newY);
    if (enemy) {
        attackEnemy(enemy);

        if (!gameOver && !awaitingLevelChoice) {
            enemiesTurn();
        }

        draw();
        return;
    }

    player.x = newX;
    player.y = newY;

    pickUpLoot();

    if (gameOver || awaitingLevelChoice) {
        draw();
        return;
    }

    if (player.x === stairs.x && player.y === stairs.y) {
        floorLevel++;
        setMessage("You descend deeper into RogueHack.");
        generateLevel();
        draw();
        return;
    }

    enemiesTurn();
    draw();
}

function attackEnemy(enemy) {
    enemy.hp -= getPlayerAttack();

    if (enemy.hp <= 0) {
        enemy.alive = false;
        player.gold += 3;
        gainXp(enemy.xpReward);

        if (!awaitingLevelChoice) {
            setMessage("You defeated a goblin and found 3 gold.");
        }
    } else {
        setMessage(`You hit a goblin. Goblin HP: ${enemy.hp}`);
    }
}

function gainXp(amount) {
    player.xp += amount;

    if (player.xp >= player.xpToNext) {
        player.xp -= player.xpToNext;
        player.level += 1;
        player.xpToNext += 2;
        awaitingLevelChoice = true;
        showLevelUpPanel();
        setMessage("Level up! Press 1 for Base Attack or 2 for Base Max HP.");
    }
}

function applyLevelChoice(choice) {
    if (!awaitingLevelChoice) return;

    if (choice === "1") {
        player.baseAttack += 1;
        awaitingLevelChoice = false;
        hideLevelUpPanel();
        setMessage("Your base attack increased by 1.");
        draw();
        return;
    }

    if (choice === "2") {
        player.baseMaxHp += 3;
        player.hp = Math.min(getPlayerMaxHp(), player.hp + 3);
        awaitingLevelChoice = false;
        hideLevelUpPanel();
        setMessage("Your base max HP increased by 3, and you healed 3 HP.");
        draw();
    }
}

function pickUpLoot() {
    const loot = getLootAt(player.x, player.y);

    if (!loot) {
        setMessage("You moved.");
        return;
    }

    loot.pickedUp = true;
    const item = loot.item;

    if (item.type === "gold") {
        player.gold += item.amount;
        setMessage(`You found ${item.amount} gold.`);
        return;
    }

    player.inventory.push(item);
    setMessage(`You picked up ${item.name}.`);
}

function renderInventory() {
    if (player.inventory.length === 0) {
        inventoryListEl.innerHTML = "Your inventory is empty.";
        return;
    }

    const lines = player.inventory.map((item, index) => {
        let extra = "";

        if (item.type === "weapon") {
            extra = ` (+${item.attackBonus} ATK)`;
        } else if (item.type === "armor") {
            extra = ` (+${item.hpBonus} Max HP)`;
        } else if (item.type === "consumable") {
            extra = ` (Heals ${item.heal})`;
        }

        return `<div class="inventory-item"><strong>${index + 1}.</strong> ${item.name}${extra}</div>`;
    });

    inventoryListEl.innerHTML = lines.join("");
}

function useInventorySlot(slotNumber) {
    if (!inventoryOpen || awaitingLevelChoice || gameOver) return;

    const index = slotNumber - 1;
    if (index < 0 || index >= player.inventory.length) return;

    const item = player.inventory[index];

    if (item.type === "consumable") {
        player.hp = Math.min(getPlayerMaxHp(), player.hp + item.heal);
        player.inventory.splice(index, 1);
        setMessage(`You used ${item.name} and recovered ${item.heal} HP.`);
    } else if (item.type === "weapon") {
        const oldWeapon = player.equipment.weapon;
        player.equipment.weapon = item;
        player.inventory.splice(index, 1);

        if (oldWeapon) {
            player.inventory.push(oldWeapon);
        }

        setMessage(`You equipped ${item.name}.`);
    } else if (item.type === "armor") {
        const oldArmor = player.equipment.armor;
        player.equipment.armor = item;
        player.inventory.splice(index, 1);

        if (oldArmor) {
            player.inventory.push(oldArmor);
        }

        syncPlayerStats();
        if (player.hp < getPlayerMaxHp()) {
            player.hp = Math.min(getPlayerMaxHp(), player.hp);
        }

        setMessage(`You equipped ${item.name}.`);
    }

    renderInventory();
    draw();
}

function enemiesTurn() {
    if (gameOver || awaitingLevelChoice || inventoryOpen) return;

    for (const enemy of enemies) {
        if (!enemy.alive) continue;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.abs(dx) + Math.abs(dy);

        if (distance === 1) {
            enemyAttack();
            if (gameOver || awaitingLevelChoice) return;
            continue;
        }

        let moveX = 0;
        let moveY = 0;

        if (Math.abs(dx) > Math.abs(dy)) {
            moveX = dx > 0 ? 1 : -1;
        } else if (dy !== 0) {
            moveY = dy > 0 ? 1 : -1;
        }

        const targetX = enemy.x + moveX;
        const targetY = enemy.y + moveY;

        const blockedByWall = isWall(targetX, targetY);
        const blockedByEnemy = enemies.some(
            other => other !== enemy && other.alive && other.x === targetX && other.y === targetY
        );
        const blockedByStairs = stairs.x === targetX && stairs.y === targetY;
        const blockedByPlayer = player.x === targetX && player.y === targetY;

        if (!blockedByWall && !blockedByEnemy && !blockedByStairs && !blockedByPlayer) {
            enemy.x = targetX;
            enemy.y = targetY;
        }

        const newDistance = Math.abs(player.x - enemy.x) + Math.abs(player.y - enemy.y);
        if (newDistance === 1) {
            enemyAttack();
            if (gameOver || awaitingLevelChoice) return;
        }
    }
}

function enemyAttack() {
    player.hp -= 1;

    if (player.hp <= 0) {
        player.hp = 0;
        gameOver = true;
        inventoryOpen = false;
        hideInventoryPanel();
        setMessage("You died. Press R to restart.");
    } else {
        setMessage(`A goblin hits you. HP is now ${player.hp}.`);
    }
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

    if (e.key.toLowerCase() === "r" && gameOver) {
        resetGame();
    }
});

resetGame();