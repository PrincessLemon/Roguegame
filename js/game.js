function generateLevel() {
    enemies = [];
    lootItems = [];

    player.x = 2;
    player.y = 2;

    if (floorLevel === BOSS_FLOOR) {
        generateBossFloor();
        return;
    }

    const enemyCount = 2 + floorLevel;
    const lootCount = 3;

    for (let i = 0; i < enemyCount; i++) {
        const pos = getRandomEmptyPosition();
        enemies.push(generateRandomEnemy(pos.x, pos.y));
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

function generateBossFloor() {
    lootItems = [];

    const bossPos = { x: 8, y: 5 };
    enemies.push({
        x: bossPos.x,
        y: bossPos.y,
        name: "Dungeon Lord",
        type: "boss",
        hp: 12,
        maxHp: 12,
        damage: 2,
        alive: true,
        xpReward: 8,
        goldReward: 20,
        icon: "boss"
    });

    // no stairs on boss floor; kill boss to win
    stairs = null;
}

function generateRandomEnemy(x, y) {
    const roll = Math.random();

    if (roll < 0.35) {
        return {
            x,
            y,
            name: "Rat",
            type: "rat",
            hp: 1 + Math.max(0, floorLevel - 1),
            damage: 1,
            alive: true,
            xpReward: 1,
            goldReward: 1,
            icon: "rat"
        };
    }

    return {
        x,
        y,
        name: "Goblin",
        type: "goblin",
        hp: 1 + floorLevel,
        damage: 1,
        alive: true,
        xpReward: 1 + Math.floor(floorLevel / 2),
        goldReward: 3,
        icon: "goblin"
    };
}

function generateRandomLoot() {
    const roll = Math.random();

    if (roll < 0.30) {
        return {
            name: "Gold",
            type: "gold",
            amount: 1 + Math.floor(Math.random() * 5)
        };
    }

    if (roll < 0.55) {
        return {
            name: "Potion",
            type: "consumable",
            heal: 5,
            icon: "potion"
        };
    }

    if (roll < 0.75) {
        return {
            name: "Dagger",
            type: "weapon",
            attackBonus: 1,
            icon: "dagger"
        };
    }

    if (roll < 0.90) {
        return {
            name: "Sword",
            type: "weapon",
            attackBonus: 2,
            icon: "sword"
        };
    }

    return {
        name: "Leather Armor",
        type: "armor",
        hpBonus: 3,
        icon: "armor"
    };
}

function tileAt(x, y) {
    return baseMap[y][x];
}

function isWall(x, y) {
    return tileAt(x, y) === "#";
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

function tryMove(dx, dy) {
    if (gameOver || gameWon || awaitingLevelChoice || inventoryOpen) return;

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

        if (!gameOver && !gameWon && !awaitingLevelChoice) {
            enemiesTurn();
        }

        draw();
        return;
    }

    player.x = newX;
    player.y = newY;

    pickUpLoot();

    if (gameOver || gameWon || awaitingLevelChoice) {
        draw();
        return;
    }

    if (stairs && player.x === stairs.x && player.y === stairs.y) {
        floorLevel++;
        updateGoal();

        if (floorLevel === BOSS_FLOOR) {
            setMessage("You enter the boss floor...");
        } else {
            setMessage("You descend deeper into RogueHack.");
        }

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
        player.gold += enemy.goldReward || 0;
        gainXp(enemy.xpReward || 0);

        if (enemy.type === "boss") {
            winGame();
            return;
        }

        setMessage(`You defeated the ${enemy.name.toLowerCase()} and found ${enemy.goldReward || 0} gold.`);
    } else {
        if (enemy.type === "boss") {
            setMessage(`You hit the boss. Boss HP: ${enemy.hp}`);
        } else {
            setMessage(`You hit the ${enemy.name.toLowerCase()}. ${enemy.name} HP: ${enemy.hp}`);
        }
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

function useInventorySlot(slotNumber) {
    if (!inventoryOpen || awaitingLevelChoice || gameOver || gameWon) return;

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
        setMessage(`You equipped ${item.name}.`);
    }

    renderInventory();
    draw();
}

function enemiesTurn() {
    if (gameOver || gameWon || awaitingLevelChoice || inventoryOpen) return;

    for (const enemy of enemies) {
        if (!enemy.alive) continue;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.abs(dx) + Math.abs(dy);

        if (distance === 1) {
            enemyAttack(enemy);
            if (gameOver || gameWon || awaitingLevelChoice) return;
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
        const blockedByPlayer = player.x === targetX && player.y === targetY;

        if (!blockedByWall && !blockedByEnemy && !blockedByPlayer) {
            enemy.x = targetX;
            enemy.y = targetY;
        }

        const newDistance = Math.abs(player.x - enemy.x) + Math.abs(player.y - enemy.y);
        if (newDistance === 1) {
            enemyAttack(enemy);
            if (gameOver || gameWon || awaitingLevelChoice) return;
        }
    }
}

function enemyAttack(enemy) {
    const damage = enemy.damage || 1;
    player.hp -= damage;

    if (player.hp <= 0) {
        player.hp = 0;
        gameOver = true;
        inventoryOpen = false;
        hideInventoryPanel();
        hideLevelUpPanel();
        showDeathPanel();
        gameEl.classList.add("dead");

        if (enemy.type === "boss") {
            setMessage(`The boss defeated you. Press R to restart.`);
        } else {
            setMessage(`The ${enemy.name.toLowerCase()} defeated you. Press R to restart.`);
        }
    } else {
        if (enemy.type === "boss") {
            setMessage(`The boss hits you for ${damage}. HP is now ${player.hp}.`);
        } else {
            setMessage(`The ${enemy.name.toLowerCase()} hits you for ${damage}. HP is now ${player.hp}.`);
        }
    }
}

function winGame() {
    gameWon = true;
    inventoryOpen = false;
    hideInventoryPanel();
    hideLevelUpPanel();
    showWinPanel();
    gameEl.classList.add("won");
    setMessage("You defeated the Dungeon Lord and won RogueHack!");
}