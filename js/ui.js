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

function showDeathPanel() {
    deathPanel.classList.remove("hidden");
}

function hideDeathPanel() {
    deathPanel.classList.add("hidden");
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

function getImageForItem(item) {
    if (!item || !item.icon) return tileImages.gold;
    return tileImages[item.icon] || tileImages.gold;
}

function createTile(imagePath) {
    const tile = document.createElement("div");
    tile.classList.add("tile");

    const img = document.createElement("img");
    img.src = imagePath;
    img.alt = "";

    tile.appendChild(img);
    return tile;
}

function draw() {
    gameEl.innerHTML = "";

    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            let imagePath = tileImages.floor;

            if (isWall(x, y)) {
                imagePath = tileImages.wall;
            }

            for (const loot of lootItems) {
                if (!loot.pickedUp && loot.x === x && loot.y === y) {
                    if (loot.item.type === "gold") {
                        imagePath = tileImages.gold;
                    } else {
                        imagePath = getImageForItem(loot.item);
                    }
                }
            }

            if (stairs.x === x && stairs.y === y) {
                imagePath = tileImages.stairs;
            }

            for (const enemy of enemies) {
                if (enemy.alive && enemy.x === x && enemy.y === y) {
                    imagePath = tileImages.goblin;
                }
            }

            if (player.x === x && player.y === y) {
                imagePath = tileImages.player;
            }

            gameEl.appendChild(createTile(imagePath));
        }
    }

    updateStats();

    if (inventoryOpen) {
        renderInventory();
    }
}