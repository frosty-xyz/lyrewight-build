// js/game.js

document.getElementById('ui-version-tag').innerText = "v" + GAME_VERSION;
document.getElementById('start-version-tag').innerText = "v" + GAME_VERSION;

const startVer = document.getElementById('start-version-tag');
if (startVer) {
    startVer.innerText = "v" + GAME_VERSION;
}

document.getElementById('loc-level').innerText = `(Lvl ${typeof dungeonLevel !== 'undefined' ? dungeonLevel : 1})`;

const logBox = document.getElementById('message-log');
let audioCtx = null;

window.gameTurnCounter = 0;
window.gameState = 'EXPLORE'; 
window.isSilencedAudio = false;
window.combatState = { enemyData: null, activePortrait: null, enemyHp: 0, distance: 0, activeCharIndex: 0, queuedActions: [] };
let activeModalCharIndex = null;
let currentInvTab = 'All'; 
let currentInvSubTab = 'All';

// 🌟 NEW: Apply Combat Speed Multiplier dynamically to the sleep utility
let storedSpeed = localStorage.getItem('lyrewight_combatSpeed');
window.combatSpeedMultiplier = storedSpeed !== null ? parseFloat(storedSpeed) : 1.0;
const sleep = ms => new Promise(r => setTimeout(r, ms * window.combatSpeedMultiplier));

window.isGuardianEncounter = false;
window.townGatekeepersDefeated = JSON.parse(localStorage.getItem('townGatekeepersDefeated') || '[]');

let unlockedCards = JSON.parse(localStorage.getItem('unlockedCards') || '[]');

const AILMENT_ICONS = { 
    'Poison': '🤢', 
    'Disease': '🦠', 
    'Paralysis': '⚡', 
    'Sleep': '💤', 
    'Madness': '🌀', 
    'Confusion': '😵', 
    'Blindness': '🕶️', 
    'Frozen': '🧊' 
};

window.partyEffects = [];
window.textureAtlas = {};
window.textureAtlasImages = {};
window.itemTextureAtlas = {};
window.itemTextureAtlasImages = {};
window.spellTextureAtlas = {};
window.spellTextureAtlasImages = {};
window.dungeonTextureAtlas = {};
window.dungeonTextureAtlasImages = {};
window.cityTextureAtlas = {};
window.cityTextureAtlasImages = {};

window.getSpriteDataUrl = function(filename) {
    // 1. Check Item Atlas
    let sprite = window.getItemAtlasSprite(filename);

    // 2. Check Bestiary Atlas (if not found)
    if (!sprite) sprite = window.getAtlasSprite(filename);

    // 3. Check Spell Atlas (if not found)
    if (!sprite) sprite = window.getSpellAtlasSprite(filename);

    // 4. Check Dungeon Atlas (if not found)
    if (!sprite) sprite = window.getDungeonAtlasSprite(filename);

    // 5. Check City Atlas (if not found)
    if (!sprite) sprite = window.getCityAtlasSprite(filename);

    // 6. If sprite isn't in any atlas, return the standard URL safely formatted
    if (!sprite || !sprite.image) {
        let path = filename;
        if (!path.startsWith('assets/') && !path.startsWith('data:')) {
            path = `assets/${path}`;
        }
        if (!path.includes('?v=') && !path.startsWith('data:')) {
            path += `?v=${GAME_VERSION}`;
        }
        return path;
    }

    // 7. Create the DataURL from the atlas
    const c = document.createElement('canvas');
    c.width = sprite.frame.w;
    c.height = sprite.frame.h;
    const ctx = c.getContext('2d');
    ctx.drawImage(sprite.image, 
        sprite.frame.x, sprite.frame.y, sprite.frame.w, sprite.frame.h, 
        0, 0, sprite.frame.w, sprite.frame.h
    );

    return c.toDataURL();
};


window.loadBestiaryAtlases = async function() {
    const totalPacks = 8;
    let promises = [];
    for (let i = 1; i <= totalPacks; i++) {
        promises.push((async () => {
            let packName = i === 1 ? 'bestiary' : `bestiary-${i}`;
            try {
                const res = await fetch(`assets/${packName}.json?v=${GAME_VERSION}`);
                if (!res.ok) return;
                const data = await res.json();

                let img = new Image();
                img.src = `assets/${data.meta.image}?v=${GAME_VERSION}`;
                window.textureAtlasImages[data.meta.image] = img;

                await new Promise(resolve => {
                    if (img.complete) resolve();
                    else { img.onload = resolve; img.onerror = resolve; }
                });

                data.frames.forEach(f => {
                    window.textureAtlas[f.filename] = { 
                        image: img, 
                        frame: f.frame 
                    };
                });
            } catch (e) {
                console.warn(`Could not load ${packName}.json`, e);
            }
        })());
    }
    await Promise.all(promises);
    console.log("Bestiary Atlas Loaded.");
};

window.loadSpellAtlases = async function() {
    const packs = ['spells.json', 'spells-2.json'];
    let promises = [];
    for (let pack of packs) {
        promises.push((async () => {
            try {
                const res = await fetch(`assets/${pack}?v=${GAME_VERSION}`);
                if (!res.ok) return;
                const data = await res.json();

                let img = new Image();
                img.src = `assets/${data.meta.image}?v=${GAME_VERSION}`;
                window.spellTextureAtlasImages[data.meta.image] = img;

                await new Promise(resolve => {
                    if (img.complete) resolve();
                    else { img.onload = resolve; img.onerror = resolve; }
                });

                data.frames.forEach(f => {
                    window.spellTextureAtlas[f.filename] = { 
                        image: img, 
                        frame: f.frame 
                    };
                });
            } catch(e) { console.warn("Failed to load spell atlas pack:", pack); }
        })());
    }
    await Promise.all(promises);
    console.log("Spell Atlas Loaded.");
};

window.getSpellAtlasSprite = function(filename) {
    if (window.spellTextureAtlas[filename]) return window.spellTextureAtlas[filename];
    let baseName = filename.includes('.') ? filename.substring(0, filename.lastIndexOf('.')) : filename;
    for (let key in window.spellTextureAtlas) {
        let keyBase = key.includes('.') ? key.substring(0, key.lastIndexOf('.')) : key;
        if (keyBase === baseName) return window.spellTextureAtlas[key];
    }
    return null;
};

window.getAtlasSprite = function(filename) {
    if (window.textureAtlas[filename]) return window.textureAtlas[filename];
    let baseName = filename.includes('.') ? filename.substring(0, filename.lastIndexOf('.')) : filename;
    for (let key in window.textureAtlas) {
        let keyBase = key.includes('.') ? key.substring(0, key.lastIndexOf('.')) : key;
        if (keyBase === baseName) return window.textureAtlas[key];
    }
    return null;
};

window.loadItemAtlases = async function() {
    // Pack 1 (main) + Related packs updated to include all 8 sets
    const packs = ['items.json', 'items-2.json', 'items-3.json', 'items-4.json', 'items-5.json', 'items-6.json', 'items-7.json', 'items-8.json'];
    let promises = [];
    for (let pack of packs) {
        promises.push((async () => {
            try {
                const res = await fetch(`assets/${pack}?v=${GAME_VERSION}`);
                if (!res.ok) return;
                const data = await res.json();

                let img = new Image();
                img.src = `assets/${data.meta.image}?v=${GAME_VERSION}`;
                window.itemTextureAtlasImages[data.meta.image] = img;

                await new Promise(resolve => {
                    if (img.complete) resolve();
                    else { img.onload = resolve; img.onerror = resolve; }
                });

                data.frames.forEach(f => {
                    window.itemTextureAtlas[f.filename] = { 
                        image: img, 
                        frame: f.frame 
                    };
                });
            } catch(e) { console.warn("Failed to load item atlas pack:", pack); }
        })());
    }
    await Promise.all(promises);
    console.log("Item Atlas Loaded.");
};

window.getItemAtlasSprite = function(filename) {
    if (window.itemTextureAtlas[filename]) return window.itemTextureAtlas[filename];
    let baseName = filename.includes('.') ? filename.substring(0, filename.lastIndexOf('.')) : filename;
    for (let key in window.itemTextureAtlas) {
        let keyBase = key.includes('.') ? key.substring(0, key.lastIndexOf('.')) : key;
        if (keyBase === baseName) return window.itemTextureAtlas[key];
    }
    return null;
};

window.loadDungeonAtlases = async function() {
    // There are 47 packs
    const totalPacks = 47;
    let promises = [];
    for (let i = 1; i <= totalPacks; i++) {
        promises.push((async () => {
            let packName = i === 1 ? 'dungeons' : `dungeons-${i}`;
            try {
                const res = await fetch(`assets/${packName}.json?v=${GAME_VERSION}`);
                if (!res.ok) return;
                const data = await res.json();

                let img = new Image();
                img.src = `assets/${data.meta.image}?v=${GAME_VERSION}`;
                window.dungeonTextureAtlasImages[data.meta.image] = img;

                await new Promise(resolve => {
                    if (img.complete) resolve();
                    else { img.onload = resolve; img.onerror = resolve; }
                });

                data.frames.forEach(f => {
                    window.dungeonTextureAtlas[f.filename] = { 
                        image: img, 
                        frame: f.frame 
                    };
                });
            } catch(e) { console.warn(`Failed to load dungeon atlas pack: ${packName}`, e); }
        })());
    }
    await Promise.all(promises);
    console.log("Dungeon Atlas System Loaded.");
};

window.getDungeonAtlasSprite = function(filename) {
    if (window.dungeonTextureAtlas[filename]) return window.dungeonTextureAtlas[filename];
    let baseName = filename.includes('.') ? filename.substring(0, filename.lastIndexOf('.')) : filename;
    for (let key in window.dungeonTextureAtlas) {
        let keyBase = key.includes('.') ? key.substring(0, key.lastIndexOf('.')) : key;
        if (keyBase === baseName) return window.dungeonTextureAtlas[key];
    }
    return null;
};

window.loadCityAtlases = async function() {
    const totalPacks = 19;
    let promises = [];
    for (let i = 1; i <= totalPacks; i++) {
        promises.push((async () => {
            let packName = i === 1 ? 'cities' : `cities-${i}`;
            try {
                const res = await fetch(`assets/${packName}.json?v=${GAME_VERSION}`);
                if (!res.ok) return;
                const data = await res.json();

                let img = new Image();
                img.src = `assets/${data.meta.image}?v=${GAME_VERSION}`;
                window.cityTextureAtlasImages[data.meta.image] = img;

                await new Promise(resolve => {
                    if (img.complete) resolve();
                    else { img.onload = resolve; img.onerror = resolve; }
                });

                data.frames.forEach(f => {
                    window.cityTextureAtlas[f.filename] = { 
                        image: img, 
                        frame: f.frame 
                    };
                });
            } catch(e) { console.warn(`Failed to load city atlas pack: ${packName}`, e); }
        })());
    }
    await Promise.all(promises);
    console.log("City Atlas System Loaded.");
};

window.getCityAtlasSprite = function(filename) {
    if (window.cityTextureAtlas[filename]) return window.cityTextureAtlas[filename];
    let baseName = filename.includes('.') ? filename.substring(0, filename.lastIndexOf('.')) : filename;
    for (let key in window.cityTextureAtlas) {
        let keyBase = key.includes('.') ? key.substring(0, key.lastIndexOf('.')) : key;
        if (keyBase === baseName) return window.cityTextureAtlas[key];
    }
    return null;
};

// 🌟 NEW: PRELOAD ALL ATLASES IN BACKGROUND AT BOOT
window.atlasesLoaded = false;
window.preloadAllAtlasesPromise = (async function() {
    let btnStart = document.getElementById('btn-start-game');
    let btnGuild = document.getElementById('btn-start-guild');
    if (btnStart) { btnStart.disabled = true; btnStart.innerText = "Loading Atlases..."; }
    if (btnGuild) { btnGuild.disabled = true; btnGuild.innerText = "Loading Atlases..."; }

    await Promise.all([
        window.loadItemAtlases(),
        window.loadBestiaryAtlases(),
        window.loadSpellAtlases(),
        window.loadDungeonAtlases(),
        window.loadCityAtlases()
    ]);

    window.atlasesLoaded = true;

    if (typeof totalAssetsToLoad !== 'undefined' && currentLoadedCount >= totalAssetsToLoad) {
        if (btnStart) { btnStart.disabled = false; btnStart.innerText = "Start at Vaults"; }
        if (btnGuild) { btnGuild.disabled = false; btnGuild.innerText = "Start at Guild"; }
    }
})();

window.getCharPortrait = function(char) {
    if (char.name === "Empty") return 'assets/portrait_none_guest_m.webp?v=' + GAME_VERSION;

    // 🌟 REPAIR LEGACY SUMMONS
    if (char.isSummon) {
        if (!char.enemyData && typeof enemyBestiary !== 'undefined') {
            char.enemyData = enemyBestiary.find(e => e.name === char.name) || 
                           enemyBestiary.find(e => e.level === char.level) || 
                           enemyBestiary[0];
        }
        if (char.enemyData) {
            let pIdx = window.ccgPortraitIndices[char.enemyData.name] || 0;
            let port = char.enemyData.portraits[pIdx];
            // 🌟 Return just the filename, the atlas engine handles the path
            return port.replace('.png', '.webp');
        }
    }

    let raceStr = char.race.toLowerCase(); let classStr = char.class.toLowerCase(); let genderStr = char.gender ? char.gender.toLowerCase() : "m";
    // For PC portraits, we keep the original path logic if they are not in the bestiary atlas
    return `assets/portrait_${raceStr}_${classStr}_${genderStr}.webp?v=${GAME_VERSION}`;
};


window.getArticle = function(word) {
    if (!word) return "A";
    // Check if the first character is a vowel
    return "aeiou".includes(word.charAt(0).toLowerCase()) ? "An" : "A";
};

window.getEffectiveStat = function(statValue) {
    if (statValue <= 18) {
        return statValue;
    } else {
        // 18 + (amount above 18 * 2)
        return 18 + ((statValue - 18) * 2);
    }
};

window.runPassiveRegen = function() {
    let roundRegenLog = [];
    party.forEach(char => {
        if (char.name !== "Empty" && char.hp > 0) {
            let regen = getEquipRegen(char);
            // Use your requested * 20 formula
            let hpGain = Math.floor(regen.hp * 20);
            let mpGain = Math.floor(regen.mp * 20);

            if (hpGain > 0) char.hp = Math.min(char.maxHp, char.hp + hpGain);
            if (mpGain > 0) char.mp = Math.min(char.maxMp, char.mp + mpGain);

            if (hpGain > 0 || mpGain > 0) {
                // 🌟 DYNAMIC LABEL: Switch to "Songs" for Bards, "SP" for others
                let mpLabel = char.class === 'Bard' ? 'Songs' : 'SP';
                roundRegenLog.push(`${char.name}: ${hpGain > 0 ? '+' + hpGain + ' HP ' : ''}${mpGain > 0 ? '+' + mpGain + ' ' + mpLabel : ''}`);
            }
        }
    });
    if (roundRegenLog.length > 0) {
        logMsg(`<span style="color:#006600;">Passive Regen: ${roundRegenLog.join(', ')}</span>`);
    }
    updateCombatUI();
};

function logMsg(msg) {
    const entry = document.createElement('div');
    entry.className = 'log-entry'; entry.innerHTML = msg;
    logBox.appendChild(entry); logBox.scrollTop = logBox.scrollHeight;
}

window.cleanPartyRoster = function() {
    // 1. Filter out dead summons
    let active = party.filter(p => !(p.isSummon && p.hp <= 0));

    // 2. Pad back to 6 slots using the "Empty" structure
    while (active.length < 6) {
        active.push({ 
            name: "Empty", race: "None", class: "Guest", gender: "n", 
            hp: 0, maxHp: 0, mp: 0, maxMp: 0, level: 0, xp: 0, stats: {}, baseAc: 0, 
            equipped: { Weapon: null, Offhand: null, Body: null, Helmet: null, Gloves: null, Boots: null, Ammo: null, Ring1: null, Ring2: null }, 
            isDefending: false, spells: [], ailments: [] 
        });
    }

    // 3. Mutate the global party array in place so references remain valid
    party.length = 0;
    active.forEach(p => party.push(p));
};

window.getLootQuantity = function(itemId, isShop = false) {
    // 🌟 FORCE: Gems are never multiplied
    if (itemId.startsWith("gem_")) return 1;

    let item = itemDB[itemId];
    if (!item || !item.stackable) return 1;

    const isAmmo = item.isAmmo === true;
    const isPotion = itemId.startsWith("potion_");

    if (isShop) {
         // Shop stock is abundant
         if (isAmmo || isPotion) return Math.floor(Math.random() * 81) + 20; // 20-100 range
         return Math.floor(Math.random() * 11) + 10; // 10-20 range
    } else {
         // Enemy drops are less abundant but still stacks
         if (isAmmo) return Math.floor(Math.random() * 11) + 5; // 5-15 range
         if (isPotion) return Math.floor(Math.random() * 5) + 1; // 1-5 range
         return Math.floor(Math.random() * 6) + 3; // 3-8 range
    }
};

window.syncEntityPersistence = function() {
    // 1. Ensure worldMaps has the latest entities list
    if (worldMaps[currentMapId]) {
        worldMaps[currentMapId].entities = entities;
    }

    // 2. Ensure the dynamic data buffer used by Save/Load has the latest list
    if (!window.savedDynamicData) window.savedDynamicData = {};
    window.savedDynamicData[currentMapId] = {
        entities: entities,
        doors: doors // Include doors in case of opened/closed state changes
    };
};

window.getXpCost = function(level) {
    const table =[0, 100, 200, 350, 500, 750, 1000, 1500, 2500, 4000, 5500, 7500, 10000];
    if (level < table.length) return table[level];

    let cost = 10000;
    let increment = 2500;
    for (let i = 12; i < level; i++) {
        increment += 500;
        cost += increment;
    }
    return cost;
};

window.getBaseXp = function(level) {
    let total = 0;
    for (let i = 1; i < level; i++) {
        total += window.getXpCost(i);
    }
    return total;
};

window.showClassInfo = function(race, charClass, lookupName = null, displayName = null) {
    // 🌟 FIX: Handle missing arguments to prevent 'undefined' showing up as the title
    if (!displayName) displayName = `${race} ${charClass}`;

    document.getElementById('info-title').innerText = displayName;

    let enemyData = lookupName ? enemyBestiary.find(e => e.name === lookupName) : null;
    let raceDesc = "";
    let classDesc = "";

    if (enemyData) {
        // 🌟 DYNAMIC BESTIARY DATA (Mirroring CCG Card info)
        let category = (enemyData.category || "monster").charAt(0).toUpperCase() + (enemyData.category || "monster").slice(1);
        raceDesc = `<b>Category:</b> ${category}<br><br>${enemyData.desc || "No description available."}`;

        let attacks = [];
        if (enemyData.canMelee) attacks.push(`⚔️ Melee: ${enemyData.meleeDmgMin}-${enemyData.meleeDmgMax} ${enemyData.meleeEffect && enemyData.meleeEffect !== "None" ? '(' + enemyData.meleeEffect + ')' : ''}`);
        if (enemyData.canRanged) attacks.push(`🏹 Ranged: ${enemyData.rangedDmgMin}-${enemyData.rangedDmgMax} ${enemyData.rangedEffect && enemyData.rangedEffect !== "None" ? '(' + enemyData.rangedEffect + ')' : ''}`);
        if (enemyData.canMagic) attacks.push(`✨ Magic: ${enemyData.magicDmgMin}-${enemyData.magicDmgMax} ${enemyData.magicEffect && enemyData.magicEffect !== "None" ? '(' + enemyData.magicEffect + ')' : ''}`);

        classDesc = `<b>Base Stats:</b> HP ${enemyData.hpMin}-${enemyData.hpMax} | AC ${Math.abs(enemyData.ac || 0)}<br><br><b>Attacks:</b><br>${attacks.join('<br>')}`;

        if (enemyData.immunities && enemyData.immunities.length > 0) {
            classDesc += `<br><br><b>Immunities:</b> <span style="color:#aa0000;">${enemyData.immunities.join(', ')}</span>`;
        }
    } else {
        // 🌟 STANDARD PC OVERLAY
        if (race === "Human") raceDesc = "<b>Humans</b> are versatile and adaptable, capable of excelling in any discipline they choose to study.";
        else if (race === "Elf") raceDesc = "<b>Elves</b> are ancient and graceful, naturally attuned to the arcane arts and swift movements.";
        else if (race === "Dwarf") raceDesc = "<b>Dwarves</b> are fiercely resilient, bringing unmatched hardiness and strength to the front lines.";
        else if (race === "Halfling") raceDesc = "<b>Halflings</b> are naturally stealthy and possess an uncanny amount of luck, allowing them to dodge blows that would strike a taller hero.";
        else if (race === "Vibrant") raceDesc = "<b>Vibrants</b> are living constructs forged of resonant metal.<br><br><span style='color:#aa0000;'><b>Restriction:</b></span> Can only equip special Bronze armor and weapons, or magical Instruments instead of shields.<br><span style='color:#006600;'><b>Passive:</b></span> Striking a Vibrant with a melee attack rings them like a bell, reflecting 30% of the melee damage taken (or 60% when defending) as a sonic shockwave scaled by their Charisma!";
        else raceDesc = "An unknown wanderer.";

        if (charClass === "Warrior") {
            classDesc = "<b>Warriors</b> are the ultimate masters of martial combat.<br><br><b>Equipment:</b> Light & Heavy Armor, Shields, and all Light & Heavy Melee Weapons.<br><b>Passive:</b> Gains an extra melee weapon strike every 7 levels.<br><b>Primary Stats:</b> Strength and Constitution.";
        } 
        else if (charClass === "Paladin") {
            classDesc = "<b>Paladins</b> are holy crusaders of the light.<br><br><b>Equipment:</b> Light & Heavy Armor, Shields. <span style='color:#aa0000;'>May only wield Swords.</span><br><b>Magic:</b> Uses Wisdom to cast divine spells.<br><b>Passives:</b> Deals +50% bonus physical damage to Undead enemies. Gains an extra melee weapon strike every 7 levels.<br><b>Primary Stats:</b> Strength, Constitution, and Wisdom.";
        }
        else if (charClass === "Rogue") {
            classDesc = "<b>Rogues</b> are masters of stealth and precision and the only class that can wield Ranged Weapons.<br><br><b>Equipment:</b> Light Armor, Light Shields, Light Melee Weapons and Ranged Weapons.<br><b>Passive:</b> Gains an extra melee weapon strike every 7 levels.<br><b>Primary Stats:</b> Dexterity and Luck.";
        }
        else if (charClass === "Bard") {
            let eqText = race === "Vibrant" 
                ? "<span style='color:#8b6508; font-weight:bold;'>Bronze Armor, Bronze Weapons, and Instruments.</span>" 
                : "Light Armor, Light Shields, Light Melee Weapons, and Instruments.";

            classDesc = `<b>Bards</b> are inspiring musicians and agile fighters.<br><br>
            <b>Equipment:</b> ${eqText}<br>
            <b>Magic (Songs):</b> Uses Charisma to perform powerful party-wide buffs and enemy afflictions from their Songbook. They draw from a highly restricted pool of <b>Songs</b> (equal exactly to their Level).<br>
            <b>Instruments:</b> Songs require an equipped Instrument. Higher quality instruments drastically extend the duration of song effects, and certain songs cannot be played with basic instruments.<br>
            <b>Recovery:</b> Bards clear their throats to recover Songs by drinking common beverages (Water, Ale, Wine, etc.). <br>
            <b>Passive:</b> Gains an extra melee weapon strike every 7 levels.<br>
            <b>Primary Stats:</b> Charisma and Dexterity.`;
        }
        else if (charClass === "Mage") {
            classDesc = "<b>Mages</b> are wielders of immense arcane power.<br><br><b>Equipment:</b> Mage Robes, Light Melee Weapons, Wands, and Staves.<br><b>Magic:</b> Uses Intelligence to cast destructive and utility spells.<br><b>Primary Stats:</b> Intelligence.";
        }
        else if (charClass === "Healer") {
            classDesc = "<b>Healers</b> are pure channels of divine grace.<br><br><b>Equipment:</b> Mage Robes, Light Melee Weapons, Wands, and Staves.<br><b>Magic:</b> Uses Wisdom to cast healing, curing, and restorative spells.<br><b>Primary Stats:</b> Wisdom.";
        }
        else classDesc = "A guest of the party.";
    }

    document.getElementById('info-race-text').innerHTML = raceDesc;
    document.getElementById('info-class-text').innerHTML = classDesc;

    document.getElementById('info-modal').style.display = 'flex';
};


// 🌟 GLOBAL DICE BOX
let diceBox = null;

async function getDiceBox() {
    // If we've already tried and failed, don't try again
    if (window.diceBoxFailed) return null;

    try {
        const module = await import('https://cdn.jsdelivr.net/npm/@3d-dice/dice-box@1.1.4/dist/dice-box.es.min.js');
        const DiceBoxClass = module.default;

        diceBox = new DiceBoxClass("#dice-container", {
            scale: 6, // 🌟 Increased scale for a much larger die
            theme: {
                faces: [
                    'assets/stat_hp.webp',     // 1: HP
                    'assets/stat_sp.webp',     // 2: SP
                    'assets/stat_ac.webp',     // 3: AC
                    'assets/stat_melee.webp',  // 4: Melee
                    'assets/stat_ranged.webp', // 5: Ranged
                    'assets/stat_magic.webp'   // 6: Magic
						]
					},
            offscreen: false, 
            // 🌟 FIXED: Point explicitly to the assets folder so themes load correctly
            assetPath: 'https://cdn.jsdelivr.net/npm/@3d-dice/dice-box@1.1.4/dist/assets/'
        });

        // 🌟 THE FIX: Bypass the hardcoded origin bug in dice-box that prepends localhost to absolute CDN URLs
        diceBox.config.origin = ""; 
        diceBox.config.base = "https://cdn.jsdelivr.net/npm/@3d-dice/dice-box@1.1.4/dist/";

        await diceBox.init();
        return diceBox;
    } catch (e) {
        console.warn("DiceBox blocked by browser security, using 2D dice logic.", e);
        window.diceBoxFailed = true; // Set flag to stop trying
        return null;
    }
}

window.initiateCardGame = function() {
    const status = document.getElementById('game-status');
    const stakeInput = document.getElementById('game-stake');
    const dice = document.getElementById('dice');

    // 🌟 1. Validate Discovery Count
    let townLevel = worldMaps[currentMapId].townLevel || 1;
    let validPlayerCards = enemyBestiary.filter(e => unlockedCards.includes(e.name) && e.level <= townLevel + 3);

    if (validPlayerCards.length < 3) {
        status.innerText = "You need at least 3 discovered cards to play!";
        return;
    }

    // 2. Validate Stake
    let maxStake = townLevel * 100;
    let stake = parseInt(stakeInput.value);

    if (isNaN(stake) || stake <= 0 || stake > maxStake || sharedGold < stake) {
        status.innerText = "Invalid stake or insufficient gold.";
        return;
    }

    // ... (rest of your existing rotation and initiation logic)
    const rotations = { 1: {x:0, y:0}, 2: {x:0, y:-90}, 3: {x:0, y:-180}, 4: {x:0, y:90}, 5: {x:-90, y:0}, 6: {x:90, y:0} };
    const result = Math.floor(Math.random() * 6) + 1;
    const attrs = ['hp', 'sp', 'ac', 'melee', 'ranged', 'magic'];
    const chosenAttr = attrs[result - 1];

    document.getElementById('btn-game-deal').disabled = true;
    status.innerText = `🎲 Rolling...`;

    const targetX = rotations[result].x + ((Math.floor(Math.random() * 3) + 2) * 360);
    const targetY = rotations[result].y + ((Math.floor(Math.random() * 3) + 2) * 360);
    dice.style.transform = `rotateX(${targetX}deg) rotateY(${targetY}deg)`;

    setTimeout(() => {
        status.innerText = `You rolled ${chosenAttr.toUpperCase()}! Comparing...`;
        window.performComparison(chosenAttr, stake, townLevel); // Pass townLevel here
        document.getElementById('btn-game-deal').disabled = false;
    }, 1600);
};


window.performComparison = async function(chosenAttr, stake, townLevel) {
    sharedGold -= stake;
    document.getElementById('sm-gold').innerText = sharedGold;

    function getVal(e, attr) {
        switch(attr) {
            case 'hp': return e.hpMax || 0;
            case 'sp': return e.canMagic ? (e.level * 20 + 20) : 0;
            case 'ac': return (e.ac !== undefined ? Math.abs(e.ac) : 0);
            case 'melee': return e.meleeDmgMax || 0;
            case 'ranged': return e.rangedDmgMax || 0;
            case 'magic': return e.magicDmgMax || 0;
            default: return 0;
        }
    }

    const getHand = (pool) => {
        let hand = [];
        let available = [...pool];
        for(let i = 0; i < 3; i++) {
            if (available.length === 0) break;
            let randomIndex = Math.floor(Math.random() * available.length);
            hand.push(available.splice(randomIndex, 1)[0]);
        }
        return hand;
    };

    const renderCCGCard = (boundObj) => {
        const e = boundObj.card;
        // 🌟 FIX: Force webp format for CCG cards and fetch from Atlas safely!
        const portStr = e.portraits[0] ? e.portraits[0].replace('.png', '.webp') : 'card_back.webp';
        const portrait = window.getSpriteDataUrl(portStr);
        let atkIcon = "⚔️", atkVal = e.meleeDmgMax || 0;
        if (e.magicDmgMax > 0) { atkIcon = "✨"; atkVal = e.magicDmgMax; } 
        else if (e.rangedDmgMax > 0) { atkIcon = "🏹"; atkVal = e.rangedDmgMax; }

        return `
            <div class="ccg-card">
                <div class="ccg-header">
                    <div style="font-size: 0.8rem; font-weight:bold;">${e.level}</div>
                    <div class="ccg-card-title" style="font-size: 0.7rem;">${e.name}</div>
                </div>
                <div class="ccg-card-img" style="background-image: url('${portrait}'); cursor: default;"></div>
                <div class="ccg-card-stats" style="margin-top: 5px;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #8b0000; background: #fff; padding: 2px 8px; border-radius: 4px;">${boundObj.val}</div>
                    <div style="display:flex; gap: 5px; font-size: 0.8rem;">
                        <span>${atkIcon} ${atkVal}</span>
                        <span>HP: ${e.hpMax}</span>
                    </div>
                </div>
            </div>`;
    };

    let playerPool = enemyBestiary.filter(e => unlockedCards.includes(e.name) && e.level <= (townLevel + 3));
    let housePool = enemyBestiary.filter(e => e.level <= (townLevel + 2));
    if (housePool.length === 0) housePool = enemyBestiary;

    let playerHand = getHand(playerPool);
    let houseHand = getHand(housePool);

    let pBound = playerHand.map(card => ({ card, val: getVal(card, chosenAttr) }));
    let hBound = houseHand.map(card => ({ card, val: getVal(card, chosenAttr) }));

    // 🌟 FIND THE HIGHEST CARD IN EACH HAND
    let pHigh = pBound.reduce((prev, curr) => (curr.val > prev.val ? curr : prev));
    let hHigh = hBound.reduce((prev, curr) => (curr.val > prev.val ? curr : prev));

    document.getElementById('btn-game-deal').disabled = true;

    document.getElementById('game-display').style.flexDirection = 'column';
    document.getElementById('game-display').style.overflowY = 'auto';
    document.getElementById('game-display').innerHTML = `
        <div style="width:100%; margin-bottom: 0px;">
            <div style="text-align:center; font-weight:bold; color:#e8dcc4; margin-bottom: 5px;">House Hand:</div>
            <div style="display:flex; justify-content:center; gap:10px;">${hBound.map(renderCCGCard).join('')}</div>
        </div>
        <div style="width:100%; padding-top: 0px;">
            <div style="text-align:center; font-weight:bold; color:#e8dcc4; margin-bottom: 5px;">Player Hand:</div>
            <div id="player-hand-container" style="display:flex; justify-content:center; gap:10px; min-height: 200px;"></div>
        </div>`;

    let container = document.getElementById('player-hand-container');
    for (let i = 0; i < pBound.length; i++) {
        await sleep(800);
        container.innerHTML += renderCCGCard(pBound[i]);
    }

    await sleep(500);

    // 🌟 COMPARE HIGHEST CARDS ONLY
    if (pHigh.val > hHigh.val) {
        let win = stake * 2;
        sharedGold += win;
        document.getElementById('game-status').innerText = `You won! ${pHigh.card.name} (${pHigh.val}) beat ${hHigh.card.name} (${hHigh.val})! You gained ${win} Gold!`;
    } else if (hHigh.val > pHigh.val) {
        document.getElementById('game-status').innerText = `House wins. ${hHigh.card.name} (${hHigh.val}) beat your ${pHigh.card.name} (${pHigh.val}). You lost ${stake} Gold.`;
    } else {
        sharedGold += stake;
        document.getElementById('game-status').innerText = `It's a draw (${pHigh.val} vs ${hHigh.val})! Stakes returned.`;
    }

    document.getElementById('sm-gold').innerText = sharedGold;
    document.getElementById('btn-game-deal').disabled = false;
};


function updateUIState() {
    document.getElementById('house-interior-view').style.display = 'none';

    let zoneLoc = document.getElementById('zone-loc'); 
    let uiBg = document.getElementById('ui-background');

    uiBg.classList.remove('solid-mode'); 

    if (window.gameState === 'EXPLORE') {
        if (window.isInsideHouse) document.getElementById('house-interior-view').style.display = 'flex';
        else document.getElementById('house-interior-view').style.display = 'none';
        if (zoneLoc) zoneLoc.style.display = 'flex'; 
        document.getElementById('canvas-container').style.display = 'flex'; 
        document.getElementById('pre-combat-view').style.display = 'none';
        document.getElementById('encounter-view').style.display = 'none';
        document.getElementById('victory-screen').style.display = 'none';
        document.getElementById('minimap-panel').style.display = 'flex';
        document.getElementById('explore-panel').style.display = 'flex';
        document.getElementById('combat-panel').style.display = 'none';
        checkInteractable();
    } 
    else if (window.gameState === 'PRE_COMBAT') {
        if (zoneLoc) zoneLoc.style.display = 'none'; 
        document.getElementById('canvas-container').style.display = 'none'; 
        document.getElementById('explore-panel').style.display = 'none';
        document.getElementById('minimap-panel').style.display = 'none'; 
        document.getElementById('pre-combat-view').style.display = 'flex';
    }
    else if (window.gameState === 'COMBAT') {
        if (zoneLoc) zoneLoc.style.display = 'none'; 
        document.getElementById('canvas-container').style.display = 'none'; 
        document.getElementById('pre-combat-view').style.display = 'none';
        document.getElementById('encounter-view').style.display = 'flex'; 
        document.getElementById('combat-panel').style.display = 'flex';
    }
    else if (window.gameState === 'VICTORY') {
        if (zoneLoc) zoneLoc.style.display = 'none'; 
        document.getElementById('canvas-container').style.display = 'none'; 
        document.getElementById('encounter-view').style.display = 'none';
        document.getElementById('minimap-panel').style.display = 'none'; 
        document.getElementById('victory-screen').style.display = 'flex'; 
        document.getElementById('explore-panel').style.display = 'none';
        document.getElementById('combat-panel').style.display = 'none';
    }
    else if (window.gameState === 'SHOP') {
        if (zoneLoc) zoneLoc.style.display = 'none'; 
        document.getElementById('canvas-container').style.display = 'none';
        document.getElementById('explore-panel').style.display = 'none';
        document.getElementById('minimap-panel').style.display = 'none'; 
        document.getElementById('pre-combat-view').style.display = 'none';
        document.getElementById('encounter-view').style.display = 'none';
        document.getElementById('victory-screen').style.display = 'none';
    }

    if (typeof renderParty === 'function') renderParty();
}


window.lastVisitedTown = 'barrowtown';
window.lastTownSpawn = { x: 6, y: 10, dir: 0 };

window.getDynamicLevel = function() {
    if (currentMapId !== 'wilderness') return worldMaps[currentMapId].level;    

    // 1. Get the map dimensions dynamically
    const mapWidth = map[0].length;
    const mapHeight = map.length;

    // 2. Barrowtown origin from your data.js
    const originX = 11;
    const originY = 9;

    // 3. Find the furthest corner from Barrowtown
    // The furthest point will be one of the four corners
    const corners = [
        {x: 0, y: 0},
        {x: mapWidth - 1, y: 0},
        {x: 0, y: mapHeight - 1},
        {x: mapWidth - 1, y: mapHeight - 1}
    ];

    let maxDist = 0;
    corners.forEach(corner => {
        let d = Math.hypot(corner.x - originX, corner.y - originY);
        if (d > maxDist) maxDist = d;
    });

    // 4. Current distance
    const currentDist = Math.hypot(player.x - originX, player.y - originY);

    // 5. Calculate level: 
    // We want a range of 6 levels (Level 2 to Level 8)
    const levelSpread = 6; 
    const lvl = 2 + Math.floor((currentDist / maxDist) * levelSpread);

    // Clamp the result between 2 and 8
    return Math.min(8, Math.max(2, lvl));
};


window.refreshBanner = function() {
    let mapData = worldMaps[currentMapId];
    let displayLvl = (mapData.townLevel !== undefined) ? mapData.townLevel : 
                     (currentMapId === 'wilderness') ? window.getDynamicLevel() : dungeonLevel;

    let lvlText = `(Lvl ${displayLvl})`;
    const locTextDiv = document.getElementById('location-text');
    locTextDiv.innerHTML = `${mapData.name} <span id="loc-level" style="font-size:0.9em; color:#5a2e0e;">${lvlText}</span>`;
    const container = document.getElementById('zone-loc');
    let fontSize = 1.2;
    locTextDiv.style.fontSize = fontSize + 'rem';

    const maxWidth = container.offsetWidth * 0.75; 

    while (locTextDiv.scrollWidth > maxWidth && fontSize > 0.5) {
        fontSize -= 0.05;
        locTextDiv.style.fontSize = fontSize + 'rem';
    }
};

window.isSpinProtected = function() {
    return party.some(p => p.hp > 0 && (
        (p.equipped.Ring1 && itemDB[p.equipped.Ring1.id || p.equipped.Ring1]?.preventSpin) ||
        (p.equipped.Ring2 && itemDB[p.equipped.Ring2.id || p.equipped.Ring2]?.preventSpin)
    ));
};

window.isPartyLevitating = function() {
    return party.some(p => {
        if (p.name === "Empty" || p.hp <= 0) return false;
        return Object.values(p.equipped).some(slotItem => {
            if (!slotItem) return false;
            let id = typeof slotItem === 'object' ? slotItem.id : slotItem;
            return itemDB[id] && itemDB[id].levitation === true;
        });
    });
};

window.canFastTravelTo = function(entName) {
    // 1. Only enabled for towns
    if (worldMaps[currentMapId].theme !== 'town') return false;

    // 2. Are all shops/gates discovered?
    const townEntities = entities.filter(e => e.type === 'shop' || e.type === 'gate');
    const allDiscovered = townEntities.every(e => {
        let rX = e.wallX !== undefined ? e.wallX : e.x;
        let rY = e.wallY !== undefined ? e.wallY : e.y;
        return discoveredMaps[currentMapId][rY][rX] === 1;
    });

    return allDiscovered;
};

window.tryFastTravel = function(entName) {
    if (!window.canFastTravelTo(entName)) {
        alert("You must discover all shops in this town before you can fast travel!");
        return;
    }

    document.getElementById('ft-target-name').innerText = entName;
    document.getElementById('btn-ft-yes').onclick = () => {
        window.executeFastTravel(entName);
        document.getElementById('fast-travel-modal').style.display = 'none';
    };
    document.getElementById('btn-ft-no').onclick = () => {
        document.getElementById('fast-travel-modal').style.display = 'none';
    };

    document.getElementById('fast-travel-modal').style.display = 'flex';
};

window.executeFastTravel = function(entName) {
    let ent = entities.find(e => e.name === entName);
    if (!ent) return;

    // Intelligent placement logic
    let doorX = ent.wallX !== undefined ? ent.wallX : ent.x;
    let doorY = ent.wallY !== undefined ? ent.wallY : ent.y;

    let target = window.findSafeSpot(doorX, doorY);

    if (target) {
        player.x = target.x;
        player.y = target.y;
        player.dir = target.dir;
    } else {
        // Fallback if no safe spot found
        player.x = ent.x;
        player.y = ent.y;
    }

    document.getElementById('full-map-modal').style.display = 'none';
    logMsg(`You swiftly make your way to ${ent.name}.`);
    if (typeof update === 'function') update();
};

window.findSafeSpot = function(doorX, doorY) {
    // Check neighbors: Up, Down, Left, Right
    // Order: North (0), East (1), South (2), West (3)
    const candidates = [
        {dx: 0, dy: -1, dir: 2}, // Spot is North, Face South
        {dx: 0, dy: 1, dir: 0},  // Spot is South, Face North
        {dx: -1, dy: 0, dir: 1}, // Spot is West, Face East
        {dx: 1, dy: 0, dir: 3}   // Spot is East, Face West
    ];

    for (let c of candidates) {
        let nX = doorX + c.dx;
        let nY = doorY + c.dy;

        // Check if map exists and tile is walkable (0)
        // Also ensure it is not blocked by a wall (>=1)
        if (map[nY] !== undefined && map[nY][nX] !== undefined && map[nY][nX] === 0) {
            return { x: nX, y: nY, dir: c.dir };
        }
    }
    return null; // No walkable spot found
};


window.loadMap = async function(targetId, spawnX, spawnY, spawnDir) {
    // 1. Wait for the external loader (PNG or JSON) to finish populating mapData
	currentMapId = targetId;
    await loadExternalMapData(targetId);

    let mapData = worldMaps[targetId];

    // 2. Safety check: If for some reason the map is still empty, stop here
    if (!mapData.map || mapData.map.length === 0) {
        console.error(`[loadMap] Critical error: Map ${targetId} failed to load data.`);
        return;
    }

	const proceedWithMapLoad = () => {
		currentMapId = targetId;
		const mapData = worldMaps[targetId];

		map = mapData.map;
		entities = mapData.entities || [];
		doors = mapData.doors || [];
		dungeonLevel = mapData.level;
		WALL_TYPE_NAME = mapData.wallName;

		// 🌟 FIX: Run the sync engine on EVERY map load so footprints stamp onto the grid!
		syncEntitiesToGrid(map, entities);

		// 🌟 FIX: Force initialization based on the ACTUAL map dimensions
		// map.length is the number of rows, map[0].length is columns
		if (!discoveredMaps[targetId] || discoveredMaps[targetId].length === 0) {
			console.log(`[MapLoader] Initializing discovery array with dims: ${map.length}x${map[0].length}`);
			discoveredMaps[targetId] = Array.from({ length: map.length }, () => Array(map[0].length).fill(0));
		}

		discoveredMap = discoveredMaps[targetId];

		player.x = spawnX;
		player.y = spawnY;
		player.dir = spawnDir;

		window.refreshBanner();
		window.checkZoneEffects(); 
		if (mapData.bgm) window.playBgm(mapData.bgm);

		logMsg(`<span style="color:#0044aa;">You enter ${mapData.name}...</span>`);
		window.walkOffset = 0;

		// 🌟 4. TRIGGER RENDER
		if (typeof update === 'function') update();
	};

    // 3. Trigger the appropriate loading path
    if (mapData.theme === 'town') {
        window.lastVisitedTown = targetId;
        window.lastTownSpawn = { x: spawnX || 6, y: spawnY || 10, dir: spawnDir || 0 };
        proceedWithMapLoad();
    } 
    else if (mapData.theme === 'dungeon') {
        window.preloadDungeonAssets(mapData.wallName, proceedWithMapLoad);
    } 
    else {
        proceedWithMapLoad();
    }
};

const subTypeNames = {
    'mage_armor': 'Mage Armor', 'light': 'Light Armor', 'heavy': 'Heavy Armor', 'bronze': 'Bronze Armor',
    'light_weapon': 'Light Weapon', 'heavy_weapon': 'Heavy Weapon', 'ranged': 'Ranged Weapon', 'mage_weapon': 'Mage Weapon', 'bronze_weapon': 'Bronze Weapon',
    'instrument': 'Instrument', 'light_shield': 'Light Shield', 'heavy_shield': 'Heavy Shield', 'bronze_shield': 'Bronze Shield'
};

window.getStat = function(char, statName) {
    let base = char.stats[statName] || 10;
    ['Weapon', 'Offhand', 'Body', 'Helmet', 'Gloves', 'Boots', 'Ring1', 'Ring2', 'Ammo'].forEach(slot => {
        if (char.equipped[slot]) {
            let id = typeof char.equipped[slot] === 'object' ? char.equipped[slot].id : char.equipped[slot];
            if (itemDB[id] && itemDB[id][statName]) base += itemDB[id][statName];
        }
    });
    return base;
};

window.getEquipBoosts = function(char) {
    let boosts = { magic: 0, heal: 0, off: 0, res: 0 };
    if (!char || !char.equipped) return boosts;['Weapon', 'Offhand', 'Body', 'Helmet', 'Gloves', 'Boots', 'Ring1', 'Ring2', 'Ammo'].forEach(slot => {
        let itemId = char.equipped[slot];
        if (itemId) {
            let id = typeof itemId === 'object' ? itemId.id : itemId;
            let item = typeof itemDB !== 'undefined' ? itemDB[id] : null;
            if (item) {
                if (item.magicBoost) boosts.magic += (item.magicBoost - 1);
                if (item.healBoost) boosts.heal += (item.healBoost - 1);
                if (item.offBoost) boosts.off += (item.offBoost - 1);
                if (item.magicResistance) boosts.res += item.magicResistance;
				if (item.drawsAggro) boosts.aggro += item.drawsAggro;
            }
        }
    });
    return boosts;
};

function canEquip(char, item) {
    if (!item.subType) return true;
    let itemId = Object.keys(itemDB).find(k => itemDB[k] === item) || "";
    if (char.race === 'Vibrant') {
        const vibrantAllowed =['bronze', 'bronze_weapon', 'bronze_shield', 'instrument'];
        return vibrantAllowed.includes(item.subType);
    }
    let allowed =[];
    switch(char.class) {
        case 'Warrior':
            allowed =['light', 'heavy', 'light_weapon', 'heavy_weapon', 'light_shield', 'heavy_shield'];
            break;
        case 'Paladin':
            allowed =['light', 'heavy', 'light_weapon', 'heavy_weapon', 'light_shield', 'heavy_shield'];
            if (item.slot === 'Weapon') {
                let isSword = itemId.startsWith('sword_') || itemId === 'unique_eclipse' || itemId === 'unique_titans_reach';
                if (!isSword) return false;
            }
            break;
        case 'Rogue':
            allowed = ['light', 'light_weapon', 'ranged', 'light_shield'];
            break;
        case 'Bard':
            allowed =['light', 'light_weapon', 'instrument'];
            break;
        case 'Mage':
        case 'Healer':
            allowed = ['mage_armor', 'light_weapon', 'mage_weapon'];
            break;
    }
    return allowed.includes(item.subType);
}

window.tryTriggerScriptedEncounter = function(ent) {
    if (ent.isTriggered) return;

    // Log the description provided in the entity
    logMsg(`<span style="color:#aa44ff; font-weight:bold;">${ent.desc}</span>`);

    window.preCombatPos = { x: player.x, y: player.y };

    // 🌟 Flag as final battle to intercept in the Engage listener
    window.isFinalBattlePending = (ent.encounterType === 'final_battle');

    // Trigger combat
    initCombat(null, null, ent.enemies, ent.encounterType || 'normal');

    ent.isTriggered = true; // Mark as done
    window.syncEntityPersistence(); // <--- ADDED: Ensure triggered status persists
};

window.showEndingModal = function(bard = null) {
    const modal = document.getElementById('ending-modal');
    const titleEl = document.getElementById('ending-modal-title');
    const txtEl = document.getElementById('ending-text');
    const wightEl = document.getElementById('ending-wight-portrait');
    const batonEl = document.getElementById('ending-baton-img');
    const bardEl = document.getElementById('ending-bard-portrait');

    // 🌟 Play Victory Theme
    window.playBgm('theme_victory');

    // 🌟 Set Wight Portrait using Atlas System
    const wightData = enemyBestiary.find(e => e.name === "The Lyre-Wight");
    if (wightData && wightData.portraits.length > 0) {
        let wPort = wightData.portraits[0].replace('.png', '.webp');
        // 🌟 FIX: Use getSpriteDataUrl to extract from Atlas
        wightEl.style.backgroundImage = `url('${window.getSpriteDataUrl(wPort)}')`;
    }

    if (bard) {
        titleEl.innerText = "The Silent Chord";
        // 🌟 Baton Narrative
        batonEl.style.display = 'flex';
        bardEl.style.display = 'flex';

        // 🌟 FIX: Use getSpriteDataUrl to extract from Atlas
        batonEl.style.backgroundImage = `url('${window.getSpriteDataUrl('item_quest_silent_baton.webp')}')`;
        bardEl.style.backgroundImage = `url('${window.getSpriteDataUrl(window.getCharPortrait(bard))}')`;

        const bName = bard.name;
        const pronoun = (bard.gender === 'f' ? 'She' : 'He');

        txtEl.innerHTML = `As your party prepares for the battle ${bName} holds up the Silent Baton. ${pronoun} appears to have intrinsic knowledge of how to operate it. Immediately, the Baton starts emitting it's purposeful hum which stops the Lyre-Wight in her tracks. Her agonised scream fills the chamber, yet the Baton seems to only increase in power while the world around you grows quieter. The Bronze Chamber is amplifying the Baton's Silent Chord!<br><br>As the Chord's power grows and grows, the Lyre-Wight appears to panic as her own power withers away. She attempts to cast her spells but all her words fall silent. In quiet agony she falls on her knees. She seems to grow old and weak in front of your eyes... Within moments she is crawling frantically towards you appealing for mercy. ${bName} resolutely raises the Silent Baton even higher, as if to administer the final blow.<br><br>The once all-powerful Lyre-Wight now lies dead in front of your astonished party as her remains crumble into dust. You have defeated the Lyre-Wight and saved the realm from her evil!<br><br>Congratulations, you have won the game, and lifted the Curse of the Lyre-Wight! Would you like to continue the game or start a new one?`;
    } else {
        titleEl.innerText = "The Lyre-Wight is defeated!";
        // 🌟 Default Narrative
        batonEl.style.display = 'none';
        bardEl.style.display = 'none';
        txtEl.innerHTML = "The once all powerful Lyre-Wight now lies dead in front of your astonished party as her remains crumble into dust. You have defeated the Lyre-Wight and saved the realm from her evil!<br><br>Congratulations, you have won the game, and lifted the Curse of the Lyre-Wight! Would you like to continue the game or start a new one?";
    }

    modal.style.display = 'flex';
};


const legendaryItems = [
    'unique_aegis_lyrewight', 
    'unique_crown_lyrewight', 
    'unique_grasps_lyrewight', 
    'unique_treads_lyrewight'
];

window.closeEndingModal = function() {
    // 🌟 1. Stop victory music and resume map background music
    window.fadeOutBgm();
    window.resumeMapBgm();

    // 2. HARD CLEANUP: Remove leftover combat UI before switching state
    document.getElementById('pre-combat-view').style.display = 'none';
    document.getElementById('encounter-view').style.display = 'none';
    window.combatState.enemies = []; // Clear combatants

    // 3. Identify Reward Values
    const wightData = enemyBestiary.find(e => e.name === "The Lyre-Wight");
    const xpReward = wightData ? wightData.exp : 5000;

    // 4. Award Gold
    sharedGold += 100000;

    // 5. Award Items
    const legendaryItems = [
        'unique_aegis_lyrewight', 
        'unique_crown_lyrewight', 
        'unique_grasps_lyrewight', 
        'unique_treads_lyrewight'
    ];
    let itemsFoundText = "";
    legendaryItems.forEach(itemId => {
        if (addLootToInventory(itemId, 1)) {
            itemsFoundText += `Found ${itemDB[itemId].name}! `;
        } else {
            itemsFoundText += `Party full, left ${itemDB[itemId].name} behind. `;
        }
    });

    // 6. Award Card
    window.grantCard("The Lyre-Wight");

    // 7. Award XP
    party.forEach(p => {
        if (p.name !== "Empty" && p.hp > 0 && !p.isSummon) {
            p.xp += xpReward;
        }
    });

    // 8. Transition to Victory Screen
    window.gameState = 'VICTORY';

    // Update Victory UI text and image
    document.getElementById('victory-loot').innerHTML = `
        <div style="margin-bottom:10px;"><b>Defeated The Lyre-Wight!</b></div>
        <div>Found 100,000 Gold and legendary artifacts!</div>
        <div style="font-size:0.9rem; color:#8b6508;">${itemsFoundText}</div>
        <div style="margin-top:10px; color:#00aa00;">Party gains ${xpReward} XP!</div>
    `;

    document.getElementById('victory-portrait').style.backgroundImage = `url('assets/victory_level4.webp?v=${GAME_VERSION}')`;
    document.getElementById('victory-portrait').style.backgroundSize = 'contain';
    document.getElementById('victory-portrait').style.backgroundPosition = 'center center';

    // 9. Hide Ending Modal
    document.getElementById('ending-modal').style.display = 'none';

    // 10. Refresh UI
    updateUIState();
    logMsg("You have vanquished the Lyre-Wight and secured legendary artifacts!");
};


window.formatEnemyName = function(name) {
    if (name.startsWith("The ")) return name;
    return "The " + name;
};

function initCombat(enemyName = null, customName = null, overrideEnemies = null, encounterType = 'normal') {
    window.combatState.enemies = [];
    window.combatState.selectedEnemyId = null;

    // 🌟 FORCE final_battle if encountering Lyre-Wight
    if (enemyName === "The Lyre-Wight" || (overrideEnemies && overrideEnemies.some(e => e.name === "The Lyre-Wight"))) {
        encounterType = 'final_battle';
    }

    // 1. Determine Ambush/Surprise
    if (window.TEST_MODE_ALWAYS_ENABLE_FLEE === true) {
        window.combatState.isAmbush = false;
        window.combatState.isSurprise = true;
    } else {
        if (encounterType === 'ambush') { window.combatState.isAmbush = true; window.combatState.isSurprise = false; }
        else if (encounterType === 'surprise') { window.combatState.isAmbush = false; window.combatState.isSurprise = true; }
        else {
            let rand = Math.random();
            window.combatState.isAmbush = rand < 0.20;
            window.combatState.isSurprise = rand > 0.80;
        }
    }

    // 2. Build Enemy List
    if (overrideEnemies) {
        overrideEnemies.forEach((eInfo) => {
            let data = enemyBestiary.find(e => e.name === eInfo.name);
            if (data) {
                for(let i = 0; i < (eInfo.count || 1); i++) {
                    let hp = Math.floor(Math.random() * (data.hpMax - data.hpMin + 1)) + data.hpMin;
                    let enemyMp = data.canMagic ? (data.level * 20 + 20) : 0;
                    if (data.name === "The Lyre-Wight") enemyMp *= 2;
                    let portStr = data.portraits[Math.floor(Math.random() * data.portraits.length)].replace('.png', '.webp');

                    window.combatState.enemies.push({
                        id: window.combatState.enemies.length,
                        data: data,
                        customName: null,
                        portrait: portStr,
                        hp: hp,
                        maxHp: hp,
                        mp: enemyMp,
                        maxMp: enemyMp,
                        distance: Math.floor(Math.random() * (data.startRank[1] - data.startRank[0] + 1)) + data.startRank[0],
                        ailments: [] // 🌟 FIXED: Ensures array exists right at spawn!
                    });
                }
            }
        });
    } else {
        let primaryBestiary = enemyBestiary.find(e => e.name === enemyName);
        if (!primaryBestiary) { window.gameState = 'EXPLORE'; return; }

        let minEnemies = 2, maxEnemies = 5; 
        let hordeSize = customName ? 1 : Math.floor(Math.random() * (maxEnemies - minEnemies + 1)) + minEnemies;

        // 🌟 FORCE single encounter for Lyre-Wight
        if (encounterType === 'final_battle') hordeSize = 1;

        for (let i = 0; i < hordeSize; i++) {
            let eData = (i === 0 || Math.random() < 0.75) ? primaryBestiary : (spawnRandomEnemy() || primaryBestiary);
            let hp = Math.floor(Math.random() * (eData.hpMax - eData.hpMin + 1)) + eData.hpMin;
            let enemyMp = eData.canMagic ? (eData.level * 20 + 20) : 0;
            if (eData.name === "The Lyre-Wight") enemyMp *= 2;
            let portStr = eData.portraits[Math.floor(Math.random() * eData.portraits.length)].replace('.png', '.webp');

            window.combatState.enemies.push({
                id: i,
                data: eData,
                customName: customName,
                portrait: portStr,
                hp: hp,
                maxHp: hp,
                mp: enemyMp,
                maxMp: enemyMp,
                distance: Math.floor(Math.random() * (eData.startRank[1] - eData.startRank[0] + 1)) + eData.startRank[0],
                ailments: [] // 🌟 FIXED: Ensures array exists right at spawn!
            });
        }
    }

    party.forEach(p => p.isDefending = false);
    window.fadeOutBgm();

    // 3. UI Setup
	let pDiv = document.getElementById('pre-combat-portrait');
	let pStr = window.combatState.enemies[0].portrait.replace('.png', '.webp');

	// 🌟 FIX: Convert atlas portrait to DataURL
	let pUrl = window.getSpriteDataUrl(pStr);
	pDiv.style.backgroundImage = `url('${pUrl}')`;
	pDiv.style.backgroundSize = 'contain';
	pDiv.style.backgroundPosition = 'center bottom';
	pDiv.style.backgroundRepeat = 'no-repeat';

    let typeCounts = {};
    window.combatState.enemies.forEach(e => {
        let name = e.customName || e.data.name;
        typeCounts[name] = (typeCounts[name] || 0) + 1;
    });

    let countStrings = [];
    for (let name in typeCounts) {
        let count = typeCounts[name];
        let pluralName = (count > 1 && !name.includes("Skarin")) ? (name.endsWith('s') ? name : name + 's') : name;
        countStrings.push(`${count > 1 ? count + ' ' : ''}${pluralName}`);
    }

    // 🌟 DYNAMIC TEXT LOGIC
    let encounterText = `${window.combatState.isAmbush ? "Ambushed by " : (window.combatState.isSurprise ? "Surprised " : "Encountered ")}${countStrings.join(", ")}!`;
    if (encounterType === 'final_battle') encounterText = "The Lyre-Wight appears!";

    document.getElementById('pre-combat-text').innerText = encounterText;

    // 4. Handle Button Visibility
    let btnFlee = document.getElementById('btn-pre-flee');
    let btnStart = document.getElementById('btn-start-combat');

    // 🌟 BUG FIX: Clear any lingering click handlers from Dungeon Guardians or Gatekeepers!
    // If these are left on, they will aggressively force the game into combat when clicked.
    btnFlee.onclick = null;
    btnStart.onclick = null;

    // 🌟 FORCED ENGAGE ONLY for Final Battle
    if (encounterType === 'final_battle') {
        window.isFinalBattlePending = true;
        btnFlee.style.display = 'none';
        btnStart.style.gridColumn = 'span 2'; // Ensure it spans full width
    } else {
        window.isFinalBattlePending = false;
        btnStart.style.gridColumn = ''; // Revert to normal layout safely

        let isAmbush = window.combatState.isAmbush && !window.TEST_MODE_ALWAYS_ENABLE_FLEE;
        if (window.isGuardianEncounter || window.activeGatekeeperId) {
            btnFlee.style.display = 'block';
            btnFlee.innerText = "🏃 Retreat";
            btnStart.innerText = window.activeGatekeeperId ? `⚔️ Fight ${worldMaps[window.activeGatekeeperId].gatekeeperName}` : "⚔️ Engage";
        } else if (isAmbush) {
            btnFlee.style.display = 'none';
        } else {
            btnFlee.style.display = 'block';
            btnFlee.innerText = "🏃‍♂️ Avoid";
            btnStart.innerText = "⚔️ Engage";
        }
    }

    window.gameState = 'PRE_COMBAT';
    updateUIState();
}


window.combatState.selectedEnemyId = null;

window.selectEnemyTarget = function(enemyId) {
    if (window.gameState !== 'COMBAT') return;
    let target = window.combatState.enemies.find(e => e.id === enemyId && e.hp > 0);
    if (target) {
        window.combatState.selectedEnemyId = enemyId;
        updateCombatUI();
        if (document.getElementById('combat-individual-controls').style.display !== 'none') {
            promptNextCombatant(); 
        }
    }
};

document.getElementById('btn-pre-flee').addEventListener('click', () => {
    if (window.gameState !== 'PRE_COMBAT') return;
    if (window.combatState.isAmbush && !window.TEST_MODE_ALWAYS_ENABLE_FLEE) return;

    // 1. Clean up combat state
    window.gameState = 'EXPLORE';
    window.combatState.enemies.length = 0;
    party.forEach(p => {
        p.isDefending = false;
        if (p.combatBuffs) p.combatBuffs.length = 0;
    });
    Object.keys(window.activeSpellAudios).forEach(spellId => {
        window.fadeOutAudio(window.activeSpellAudios[spellId]);
        delete window.activeSpellAudios[spellId];
    });
    updateEffectsUI();
    window.resumeMapBgm();

    // 2. Handle position restoration
    if (window.isInsideHouse) {
        // If inside house, leaveHouse() restores the player to the street coordinate.
        // We do NOT want to run the preCombatPos logic below, so we return early.
        window.leaveHouse();
    } else {
        // Standard Field/Dungeon escape logic
        if (window.preCombatPos) {
            player.x = window.preCombatPos.x;
            player.y = window.preCombatPos.y;
        } else {
            // Backup fallback
            player.x -= dx[player.dir];
            player.y -= dy[player.dir];
        }
        if (typeof update === 'function') update();
    }

    logMsg(`<span style="color:#8b6508;">The party quietly avoids the enemy pack and retreats!</span>`);
    updateUIState();
});

document.getElementById('btn-start-combat').addEventListener('click', () => {
    if (window.gameState !== 'PRE_COMBAT') return;

    // 🌟 FINAL BATTLE INTERCEPT
    if (window.isFinalBattlePending) {
        let vibrantBard = party.find(p => p.race === 'Vibrant' && p.class === 'Bard' && p.hp > 0);

        // 🌟 FIX: Check both inventories for the Baton!
        let hasBaton = questInventory.some(i => i && i.isQuestItem && i.itemType === 'silent_baton') ||
                       sharedInventory.some(i => i && i.isQuestItem && i.itemType === 'silent_baton');

        if (vibrantBard && hasBaton) {
            window.isFinalBattlePending = false; // Reset flag
            window.showEndingModal(vibrantBard);
            return; // ABORT combat entry
        }
        // If requirements not met, continue to combat as normal
        window.isFinalBattlePending = false;
    }

    window.gameState = 'COMBAT';
    updateUIState();

    let enemies = window.combatState.enemies;
    let isSingle = enemies.length === 1;
    let name = isSingle ? (enemies[0].customName || enemies[0].data.name) : "the horde";
    let logMsgText = isSingle ? `${name} attacks!` : `the horde attacks!`;

    // 🌟 DYNAMIC LOG: Check for Gatekeeper/Guardian
    if (window.activeGatekeeperId) {
        logMsg(`<span class="log-combat">Combat!</span> ${worldMaps[window.activeGatekeeperId].gatekeeperName} attacks!`);
    } else if (window.activeGuardianId) {
        logMsg(`<span class="log-combat">Combat!</span> The guardian attacks!`);
    } else {
        logMsg(`<span class="log-combat">Combat!</span> ${isSingle ? name : "The horde"} attacks!`);
    }

    if (window.combatState.isAmbush) { 
        logMsg(`<span class="log-damage">Ambush!</span> The enemies strike first!`); 
        enemyTurn().then(() => { if (window.gameState === 'COMBAT') startCombatRound(); });
    } else if (window.combatState.isSurprise) {
        logMsg("You have the element of surprise! The enemy is caught off guard!"); 
        startCombatRound(); 
    } else { startCombatRound(); }
});


function startCombatRound() {
    window.combatState.queuedActions = []; 
    party.forEach(p => p.isDefending = false); 
    document.getElementById('combat-status').innerText = "Party Strategy Phase";

    // 🌟 Ensure we cannot flee from the final Lyre-Wight battle!
    let isFinalBoss = window.combatState.enemies.some(e => e.data.name === "The Lyre-Wight");
    document.getElementById('combat-party-controls').style.gridTemplateColumns = isFinalBoss ? '1fr 1fr' : '1fr 1fr 1fr';
    document.getElementById('btn-party-flee').style.display = isFinalBoss ? 'none' : 'block';

    document.getElementById('combat-party-controls').style.display = 'grid';
    document.getElementById('combat-individual-controls').style.display = 'none';
    let anyInMelee = window.combatState.enemies.some(e => e.hp > 0 && e.distance <= 1);
    document.getElementById('btn-party-advance').disabled = anyInMelee;
    window.combatState.activeCharIndex = 99; 
    updateCombatUI();
}

document.getElementById('btn-party-fight').addEventListener('click', () => {
    document.getElementById('combat-party-controls').style.display = 'none';
    document.getElementById('combat-individual-controls').style.display = 'grid';
    window.combatState.activeCharIndex = 0;
    promptNextCombatant();
});

document.getElementById('btn-party-advance').addEventListener('click', async () => {
    document.getElementById('combat-party-controls').style.display = 'none';
    logMsg("The party charges forward as a group!");
	window.runPassiveRegen();
    window.combatState.enemies.forEach(e => { if (e.hp > 0) e.distance = Math.max(1, e.distance - 1); });
    updateCombatUI();
    await sleep(800);
    await enemyTurn();
    updateCombatUI();
    await sleep(1000);
    if (window.gameState === 'COMBAT') startCombatRound();
});

document.getElementById('btn-party-flee').addEventListener('click', async () => {
    document.getElementById('combat-party-controls').style.display = 'none';
    logMsg("<span style='color:#aa44ff; font-weight:bold;'>The party prepares to run and braces for impact!</span>");

    // 1. Process Party End-of-Round Afflictions First
    for (let p of party) {
        if (p.name !== "Empty" && p.hp > 0) {
            if (p.ailments.includes('Poison')) {
                let dmg = Math.max(1, Math.floor(p.maxHp * 0.05));
                p.hp = Math.max(0, Math.floor(p.hp) - dmg); 
                logMsg(`<span style="color:#00aa00;">${p.name} suffers ${dmg} poison damage!</span>`);
            }
            if (p.ailments.includes('Disease')) {
                let dmg = Math.max(1, Math.floor(p.maxHp * 0.02));
                p.hp = Math.max(0, Math.floor(p.hp) - dmg);
                logMsg(`<span style="color:#8b6508;">${p.name} suffers ${dmg} disease damage!</span>`);
            }
            if (p.hp <= 0) {
                logMsg(`<span style="color:#aa0000; font-weight:bold;">${p.name} has succumbed to their afflictions!</span>`);
            }
        }
    }
    window.cleanPartyRoster(); 
    updateCombatUI();
    if (window.checkPartyDefeat()) return;

    // 2. Enemy gets a free attack round!
    await enemyTurn();

    // 3. Post-Enemy Checks
    if (window.combatState.enemies.every(e => e.hp <= 0)) { await sleep(800); winCombat(); return; }
    if (window.checkPartyDefeat()) return;

    // 4. Calculate Flee Chance
    let livingMembers = party.filter(p => p.name !== "Empty" && p.hp > 0 && !p.isSummon);
    let combinedDex = 0;

    livingMembers.forEach(p => {
        combinedDex += window.getEffectiveStat(window.getStat(p, 'DEX'));
    });

    // As requested: Multiplier = Combined DEX / 75. Applies to base 50%.
    let multiplier = combinedDex / 75;
    let fleeChance = 0.50 * multiplier;
    fleeChance = Math.min(0.95, fleeChance); // Cap at 95% to maintain a tiny amount of risk

    if (window.TEST_MODE_ALWAYS_ENABLE_FLEE) fleeChance = 1.0;

    await sleep(500);

    // 5. Resolution
    if (Math.random() < fleeChance) {
        logMsg(`<span style="color:#00aa00; font-weight:bold;">The party successfully escapes!</span>`);
        await sleep(800);

        // Cleanup and Exit Combat
        window.gameState = 'EXPLORE';
        window.combatState.enemies.length = 0;

        party.forEach(p => {
            p.isDefending = false;
            if (p.combatBuffs) p.combatBuffs.length = 0;
        });

        Object.keys(window.activeSpellAudios).forEach(spellId => {
            window.fadeOutAudio(window.activeSpellAudios[spellId]);
            delete window.activeSpellAudios[spellId];
        });

        updateEffectsUI();
        window.resumeMapBgm();

        // Restore Position
        if (window.isInsideHouse) {
            window.leaveHouse();
        } else {
            if (window.preCombatPos) {
                player.x = window.preCombatPos.x;
                player.y = window.preCombatPos.y;
            } else {
                player.x -= dx[player.dir];
                player.y -= dy[player.dir];
            }
            if (typeof update === 'function') update();
        }
        updateUIState();
    } else {
        logMsg(`<span style="color:#aa0000; font-weight:bold;">The party failed to escape!</span>`);
        await sleep(800);

        // 6. Handle standard end of round decay since we are staying in combat
        let hasPermSong = party.some(p => p.hp > 0 && (p.equipped.Ring1 === 'ring_bard' || p.equipped.Ring2 === 'ring_bard'));
        let expiredBuffs =[]; 

        party.forEach(p => {
            if (p.combatBuffs) {
                p.combatBuffs.forEach(b => {
                    if (!(b.isSong && hasPermSong)) {
                        b.duration--;
                    }
                    if (b.duration <= 0) {
                        expiredBuffs.push(b.id);
                    }
                });
                p.combatBuffs = p.combatBuffs.filter(b => b.duration > 0);
            }
        });

        expiredBuffs.forEach(spellId => {
            let stillActive = party.some(p => p.hp > 0 && p.combatBuffs && p.combatBuffs.some(b => b.id === spellId));
            if (!stillActive && window.activeSpellAudios[spellId]) {
                window.fadeOutAudio(window.activeSpellAudios[spellId], true);
                delete window.activeSpellAudios[spellId];
                if (spellId.startsWith('b_')) window.resumeMapBgm();
            }
        });

        expiredBuffs.length = 0; 		
        updateEffectsUI();
        window.runPassiveRegen();

        if (window.gameState === 'COMBAT') startCombatRound();
    }
});

window.showCombatItemPicker = function(charIndex) {
    let char = party[charIndex];
    document.getElementById('sb-title').innerText = `Use Item`;
    document.getElementById('sb-mp').innerText = ``;

    // Hide all spell-specific tabs for the item picker
    document.getElementById('sb-main-tabs').style.display = 'none';
    document.getElementById('sb-elem-tabs').style.display = 'none';

    let listDiv = document.getElementById('sb-list');
    listDiv.innerHTML = '';

    let hasItems = false;

    sharedInventory.forEach((invObj, invIdx) => {
        if (!invObj || invObj.isQuestItem) return;
        let itemId = typeof invObj === 'string' ? invObj : invObj.id;
        let item = itemDB[itemId];

        // Only allow specific consumables in combat (exclude light sources/torches)
        if (item && item.slot === 'Consumable' && !item.isBeacon && !item.lightRadius) {
            hasItems = true;
            let qty = typeof invObj === 'object' ? invObj.qty : 1;
            let btn = document.createElement('div');
            btn.className = 'sm-item-card'; 
            btn.style.width = '96%'; 
            btn.style.margin = '0 auto 6px auto'; 
            btn.style.padding = '12px 15px'; 
            btn.style.justifyContent = 'space-between'; 
            btn.style.border = '1px solid rgba(139, 69, 19, 0.3)'; 

            let desc = "";
            if (item.hpHeal) desc = `Restores ${item.hpHeal >= 9999 ? "MAX" : item.hpHeal} HP`;
            else if (item.mpHeal) desc = `Restores ${item.mpHeal >= 9999 ? "MAX" : item.mpHeal} SP`;
            else if (item.songHeal) desc = `Replenishes ${item.songHeal} Songs`;
            else if (item.curesAll) desc = `Cures ALL Ailments`;
            else if (item.cures) desc = `Cures ${item.cures.join(', ')}`;
            else if (item.resurrect) desc = `Revives dead ally`;

            // 🌟 FIXED: Retrieve icon path from the Texture Atlas system
            let iconPath = window.getSpriteDataUrl(item.icon || item.iconM);

            btn.innerHTML = `
                <div style="display: flex; gap: 12px; align-items: center;">
                    <div class="sm-item-icon" style="background-image:url('${iconPath}'); border-radius: 4px; border: 2px solid rgba(139, 69, 19, 0.5);"></div>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <div style="font-size:1.4rem; color:#0044aa; font-weight:bold; text-shadow: none;">${item.name} <span style="font-size:1rem; color:#555;">(x${qty})</span></div>
                        <div style="font-size:1.0rem; color:#5a2e0e; font-style:italic; font-weight:normal; text-shadow: none;">${desc}</div>
                    </div>
                </div>
                <button style="width:100px; height:40px; background:#44aa44; color:#fff; font-size:1rem;">Use</button>
            `;

            btn.querySelector('button').onclick = (e) => {
                e.stopPropagation();
                window.combatState.queuedActions.push({ charIndex: charIndex, action: 'USE_ITEM', invIdx: invIdx });
                document.getElementById('spellbook-modal').style.display = 'none';
                window.combatState.activeCharIndex++; 
                promptNextCombatant();
            };
            listDiv.appendChild(btn);
        }
    });

    if (!hasItems) {
        listDiv.innerHTML = `<div style="text-align:center; color:#555; padding:20px; font-style:italic;">No combat-usable items in inventory.</div>`;
    }

    let cancelBtn = document.createElement('button');
    cancelBtn.innerText = "Cancel";
    cancelBtn.style.width = "96%";
    cancelBtn.style.margin = "10px auto 0 auto"; 
    cancelBtn.style.height = "50px"; 
    cancelBtn.style.background = "#555";
    cancelBtn.style.color = "#fff";
    cancelBtn.onclick = () => {
        document.getElementById('spellbook-modal').style.display = 'none';
    };
    listDiv.appendChild(cancelBtn);

    document.getElementById('spellbook-modal').style.display = 'flex';
};

document.getElementById('btn-c-attack').addEventListener('click', () => {
    if (window.gameState !== 'COMBAT' || window.combatState.activeCharIndex >= party.length) return;
    window.combatState.queuedActions.push({ charIndex: window.combatState.activeCharIndex, action: 'ATTACK', targetId: window.combatState.selectedEnemyId });
    window.combatState.activeCharIndex++; promptNextCombatant();
});

document.getElementById('btn-c-defend').addEventListener('click', () => {
    if (window.gameState !== 'COMBAT' || window.combatState.activeCharIndex >= party.length) return;
    party[window.combatState.activeCharIndex].isDefending = true;
    window.combatState.queuedActions.push({ charIndex: window.combatState.activeCharIndex, action: 'DEFEND' });
    window.combatState.activeCharIndex++; promptNextCombatant();
});

document.getElementById('btn-c-cast').addEventListener('click', () => {
    window.openSpellbook('combat', window.combatState.activeCharIndex);
});

document.getElementById('btn-c-item').addEventListener('click', () => {
    window.showCombatItemPicker(window.combatState.activeCharIndex);
});

window.showAllyPicker = function(spellId, casterIndex, mode) {
    let spell = spellDB[spellId];
    let caster = party[casterIndex];
    document.getElementById('sb-title').innerText = `Cast on who?`;
    // 🌟 ADDED: Sync the MP counter with the caster's current MP
    document.getElementById('sb-mp').innerText = `${caster.class === 'Bard' ? 'Songs' : 'MP'}: ${Math.floor(caster.mp)} / ${caster.maxMp}`;
    let listDiv = document.getElementById('sb-list');
    listDiv.innerHTML = '';

    // Iterate through the party to build the selection UI
    party.forEach((p, idx) => {
        if (p.name === "Empty") return;

        // 🌟 LOGIC: Determine validity based on spell type
        let isValid = false;
        let ailmentText = "";

        if (spell.type === 'revive') {
            isValid = p.hp <= 0;
            ailmentText = (p.hp <= 0) ? "Dead" : "Alive";
        } else if (spell.type === 'cure') {
            // Valid if they have at least one of the ailments the specific spell cures
            let targetAilments = p.ailments.filter(a => spell.cures.includes(a));
            isValid = p.hp > 0 && targetAilments.length > 0;
            ailmentText = p.ailments.length > 0 ? `Afflicted: ${p.ailments.join(', ')}` : "Healthy";
        } else if (spell.type === 'cure_all' || spell.type === 'cure_one') {
            // 🌟 FIXED: cure_one grouped here since it doesn't rely on a spell.cures array
            isValid = p.hp > 0 && p.ailments.length > 0;
            ailmentText = p.ailments.length > 0 ? `Afflicted: ${p.ailments.join(', ')}` : "Healthy";
        } else if (spell.type === 'heal' || spell.type === 'party_heal') {
            isValid = p.hp > 0 && p.hp < p.maxHp;
            ailmentText = `${p.hp}/${p.maxHp} HP`;
        } else {
            isValid = p.hp > 0; // Default for buffs
            ailmentText = "Healthy";
        }

        // Determine Party Rank
        let rank = idx < 4 ? 1 : 2;
        let hpPct = Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100));
        let hpColor = hpPct <= 20 ? '#cc0000' : (hpPct <= 50 ? '#ffcc00' : '#00cc00');

        let btn = document.createElement('div');
        btn.className = 'sm-item-card';
        btn.style.width = '96%';
        btn.style.margin = '0 auto 6px auto';
        btn.style.padding = '8px 15px';
        btn.style.display = 'flex';
        btn.style.justifyContent = 'space-between';
        btn.style.alignItems = 'center';
        btn.style.border = '1px solid rgba(139, 69, 19, 0.3)';

        if (!isValid) { 
            btn.style.opacity = '0.4'; 
            btn.style.filter = 'grayscale(1)';
            btn.style.cursor = 'not-allowed'; 
        } else {
            btn.style.cursor = 'pointer';
            btn.onclick = () => {
                if (mode === 'combat') {
                    window.combatState.queuedActions.push({ charIndex: casterIndex, action: 'CAST', spellId: spellId, targetId: window.combatState.selectedEnemyId, targetAllyIndex: idx });
                    document.getElementById('spellbook-modal').style.display = 'none';
                    window.combatState.activeCharIndex++; promptNextCombatant(); 
                } else { 
                    // 🌟 PASS 'explore' MODE HERE
                    window.castExploreSpell(spellId, casterIndex, idx, 'explore'); 
                }
            };
        }

        btn.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <div style="font-size:1.1rem; color:${isValid ? '#0044aa' : '#777'}; font-weight:bold;">${p.name} (Rank ${rank})</div>
                <div style="font-size:0.85rem; color:${isValid ? '#5a2e0e' : '#777'}; font-style:italic;">${ailmentText}</div>
            </div>
            <div style="width: 120px; height: 16px; background: #222; border: 1px solid #000; position: relative;">
                <div style="width: ${hpPct}%; height: 100%; background: ${hpColor};"></div>
            </div>
        `;
        listDiv.appendChild(btn);
    });

    let backBtn = document.createElement('button');
    backBtn.innerText = "◀ Back to Spells";
    backBtn.style.width = "96%";
    backBtn.style.margin = "4px auto 0 auto"; 
    backBtn.style.height = "38px"; 
    backBtn.style.minHeight = "38px";
    backBtn.style.fontSize = "1rem";
    backBtn.onclick = () => window.openSpellbook(mode, casterIndex);
    listDiv.appendChild(backBtn);
};


window.currentSpellTab = 'All';
window.currentSpellElem = 'All';
window.activeSpellbookMode = 'explore';
window.activeSpellbookChar = null;

window.setSpellTab = function(tabName) {
    window.currentSpellTab = tabName;
    document.querySelectorAll('#sb-main-tabs .inv-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('sbt-' + tabName)?.classList.add('active');
    document.getElementById('sb-elem-tabs').style.display = (tabName === 'Offensive') ? 'flex' : 'none';
    if (tabName !== 'Offensive') window.setSpellElemTab('All');
    else window.openSpellbook(window.activeSpellbookMode, window.activeSpellbookChar);
};

window.setSpellElemTab = function(elemName) {
    window.currentSpellElem = elemName;
    document.querySelectorAll('#sb-elem-tabs .inv-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('sbet-' + elemName)?.classList.add('active');
    window.openSpellbook(window.activeSpellbookMode, window.activeSpellbookChar);
};

window.calculateSpellMult = function(char, spell) {
    let magicStat = ['Healer', 'Paladin'].includes(char.class) ? getStat(char, 'WIS') : (char.class === 'Bard' ? getStat(char, 'CHA') : getStat(char, 'INT'));
    let eqBoosts = window.getEquipBoosts(char);
    let isOffensive = (spell.type === 'damage' || spell.type === 'siphon_hp' || spell.type === 'siphon_mp');
    let isHealing = (spell.type === 'heal' || spell.type === 'party_heal' || spell.type === 'party_revive');

    let totalGearBoost = 1.0 + eqBoosts.magic;
    if (isOffensive) totalGearBoost += eqBoosts.off;
    if (isHealing) totalGearBoost += eqBoosts.heal;

    let statBonusFactor = Math.max(0, magicStat - 10) * 0.05; 
    let levelScaling = 1 + (char.level / 20);

    return levelScaling * (1 + statBonusFactor) * totalGearBoost;
};

window.openSpellbook = function(mode, charIndex) {
    let char = party[charIndex];
    if (!char) return;

    // 🌟 FIX: Restore main tabs visibility in case the Item Picker hid them previously!
    document.getElementById('sb-main-tabs').style.display = 'flex';

    let isBard = char.class === 'Bard';
    let resColor = isBard ? '#cc5500' : '#0044aa';
    let resLabel = isBard ? 'Songs' : 'SP';
    document.getElementById('sb-title').innerText = isBard ? `${char.name}'s Songbook` : `${char.name}'s Spells`;
    document.getElementById('sb-title').style.color = resColor;
    document.getElementById('sb-mp').innerText = `${resLabel}: ${Math.floor(char.mp)} / ${char.maxMp}`;
    document.getElementById('sb-mp').style.color = resColor;
    let allTab = document.getElementById('sbt-All');
    if (allTab) allTab.innerText = isBard ? 'All Songs' : 'All Spells';
    let tabOff = document.getElementById('sbt-Offensive'), tabHeal = document.getElementById('sbt-Healing'), tabUtil = document.getElementById('sbt-Utility');
    if (isBard) { if (tabUtil) tabUtil.style.order = 1; if (tabOff) tabOff.style.order = 2; if (tabHeal) tabHeal.style.order = 3; } 
    else { if (tabOff) tabOff.style.order = 1; if (tabHeal) tabHeal.style.order = 2; if (tabUtil) tabUtil.style.order = 3; }
    let listDiv = document.getElementById('sb-list');
    listDiv.innerHTML = '';

    let distToEnemy = 0;
    if (mode === 'combat') {
        let aliveEnemies = window.combatState.enemies.filter(e => e.hp > 0);
        let targetEnemy = aliveEnemies.find(e => e.id === window.combatState.selectedEnemyId);
        if (!targetEnemy && aliveEnemies.length > 0) targetEnemy = aliveEnemies[0]; 
        if (targetEnemy) { 
            let charRank = charIndex < 4 ? 1 : 2; 
            distToEnemy = targetEnemy.distance + (charRank - 1);
        }
    }

    window.activeSpellbookMode = mode;
    window.activeSpellbookChar = charIndex;
    let allUnlocked = Object.keys(spellDB).filter(k => spellDB[k].classReq === char.class && spellDB[k].levelReq <= char.level);
    let hasOffensive = allUnlocked.some(k => spellDB[k].type === 'damage' || spellDB[k].type.startsWith('siphon'));
    let hasHealing = allUnlocked.some(k => Array.of('heal', 'party_heal', 'cure', 'cure_all', 'cure_one', 'revive', 'party_revive').includes(spellDB[k].type));
    let hasUtility = allUnlocked.some(k => Array.of('light', 'teleport', 'buff', 'party_buff', 'inflict_ailment', 'summon').includes(spellDB[k].type));
    document.getElementById('sbt-Offensive').style.display = hasOffensive ? 'block' : 'none';
    document.getElementById('sbt-Healing').style.display = hasHealing ? 'block' : 'none';
    document.getElementById('sbt-Utility').style.display = hasUtility ? 'block' : 'none';
    if ((window.currentSpellTab === 'Offensive' && !hasOffensive) || (window.currentSpellTab === 'Healing' && !hasHealing) || (window.currentSpellTab === 'Utility' && !hasUtility)) { window.currentSpellTab = 'All'; document.querySelectorAll('#sb-main-tabs .inv-tab').forEach(t => t.classList.remove('active')); document.getElementById('sbt-All')?.classList.add('active'); document.getElementById('sb-elem-tabs').style.display = 'none'; }
    let unlockedElements = new Set();
    if (hasOffensive) allUnlocked.forEach(k => { let sp = spellDB[k]; if ((sp.type === 'damage' || sp.type.startsWith('siphon')) && sp.element) unlockedElements.add(sp.element); });
    ['fire', 'ice', 'lightning', 'arcane', 'void', 'holy', 'dark'].forEach(elem => { let elTab = document.getElementById('sbet-' + elem); if (elTab) elTab.style.display = unlockedElements.has(elem) ? 'block' : 'none'; });
    if (window.currentSpellElem !== 'All' && !unlockedElements.has(window.currentSpellElem)) { window.currentSpellElem = 'All'; document.querySelectorAll('#sb-elem-tabs .inv-tab').forEach(t => t.classList.remove('active')); document.getElementById('sbet-All')?.classList.add('active'); }
    let knownSpells = allUnlocked.filter(spellId => {
        let spell = spellDB[spellId];
        let isOffensive = spell.type === 'damage' || spell.type.startsWith('siphon');
        let isHealing = Array.of('heal', 'party_heal', 'cure', 'cure_all', 'cure_one', 'revive', 'party_revive').includes(spell.type);
        let isUtility = Array.of('light', 'teleport', 'buff', 'party_buff', 'inflict_ailment', 'summon').includes(spell.type);
        if (window.currentSpellTab === 'Offensive' && !isOffensive) return false;
        if (window.currentSpellTab === 'Healing' && !isHealing) return false;
        if (window.currentSpellTab === 'Utility' && !isUtility) return false;
        if (window.currentSpellTab === 'Offensive' && window.currentSpellElem !== 'All') { if (spell.element !== window.currentSpellElem) return false; }
        return true;
    });
    const checkDisabled = (spellId) => {
        let spell = spellDB[spellId];
        let isAntiMagic = window.isAntiMagic(player.x, player.y);
        if (isAntiMagic && spell.magical) return true;
        let canAfford = char.mp >= spell.mpCost;
        let isUsableInMode = (mode === 'combat' && spell.combatUsable) || (mode === 'explore' && spell.exploreUsable);
        let isOffensive = spell.type === 'damage' || spell.type === 'siphon_hp' || spell.type === 'siphon_mp';
        let outOfRange = mode === 'combat' && isOffensive && spell.maxRange && distToEnemy > spell.maxRange;
        return !canAfford || outOfRange || !isUsableInMode;
    };
    knownSpells.sort((a, b) => { let disabledA = checkDisabled(a), disabledB = checkDisabled(b); if (disabledA !== disabledB) return disabledA ? 1 : -1; return spellDB[b].levelReq - spellDB[a].levelReq; });
    knownSpells.forEach(spellId => {
        let spell = spellDB[spellId];
        let instBonus = 0;
        if (char.class === 'Bard') { Array.of('Weapon', 'Offhand').forEach(slot => { let itemId = char.equipped[slot]; let id = (itemId && typeof itemId === 'object') ? itemId.id : itemId; if (id && itemDB[id] && itemDB[id].subType === 'instrument' && itemDB[id].duration !== undefined) instBonus = itemDB[id].duration; }); }
        let finalDuration = spell.duration !== undefined ? spell.duration + instBonus : undefined;
        let canAfford = char.mp >= spell.mpCost, isUsableInMode = (mode === 'combat' && spell.combatUsable) || (mode === 'explore' && spell.exploreUsable), isOffensive = spell.type === 'damage' || spell.type === 'siphon_hp' || spell.type === 'siphon_mp', outOfRange = mode === 'combat' && isOffensive && spell.maxRange && distToEnemy > spell.maxRange, durationTooLow = (finalDuration !== undefined && finalDuration <= 0);
        let isAntiMagic = window.isAntiMagic(player.x, player.y);
        let isSpellcaster = ['Mage', 'Healer', 'Paladin'].includes(char.class);
        let isBlockedByField = (isAntiMagic && isSpellcaster && spell.magical);
        let isDisabled = !canAfford || outOfRange || !isUsableInMode || durationTooLow || isBlockedByField;

        // 🌟 USE HELPER HERE
        let spellMult = window.calculateSpellMult(char, spell);

        let bMin = 0, bMax = 0, bHeal = 0;
        if (spell.minDmg !== undefined) { bMin = Math.floor(spell.minDmg * spellMult); bMax = Math.floor(spell.maxDmg * spellMult); }
        if (spell.healAmount !== undefined) { bHeal = Math.floor(spell.healAmount * spellMult); }
        let displayName = spell.name;
        const elementIcons = { 'fire': '🔥', 'ice': '❄️', 'lightning': '⚡', 'arcane': '✨', 'void': '🌌', 'holy': '☀️', 'dark': '💀' };
        if (spell.element && elementIcons[spell.element]) displayName += ` ${elementIcons[spell.element]}`;

        let targetLabel = "";
        if (spell.target === 'party' || spell.target === 'all_enemies') {
            let label = spell.target === 'party' ? 'Party' : 'All Enemies';
            targetLabel = `<span style="font-size:0.7rem; background:#444; color:#fff; padding:2px 6px; border-radius:4px; margin-left:8px; vertical-align:middle;">${label}</span>`;
        }

        let desc = "";
        if (spell.type === 'damage') desc = spell.target === 'all_enemies' ? `AoE Dmg: <b style="color:#0044aa;">${bMin}-${bMax}</b>` : `Dmg: <b style="color:#0044aa;">${bMin}-${bMax}</b>`;
        else if (spell.type === 'heal' || spell.type === 'party_heal') desc = `Heals: <b style="color:#00aa00;">${bHeal}</b> HP`;
        else if (spell.type === 'siphon_hp') desc = `Siphons: <b style="color:#0044aa;">${bMin}-${bMax}</b> HP`;
        else if (spell.type === 'siphon_mp') desc = `Siphons: <b style="color:#0044aa;">${bMin}-${bMax}</b> SP`;
        else if (spell.type === 'cure') desc = `Cures: ${spell.cures.join(', ')}`;
        else if (spell.type === 'cure_all') desc = `Cures: ALL Ailments`;
        else if (spell.type === 'cure_one') desc = `Cures: One Ailment`;
        else if (spell.type === 'revive') desc = `Revives Dead Ally`;
        else if (spell.type === 'light') desc = `Light Radius: +${spell.lightRadius} (${spell.duration} steps)`;
        else if (spell.type === 'teleport') { let tName = worldMaps[window.lastVisitedTown || 'barrowtown'].name; displayName = `Portal to ${tName} 🌀`; desc = `Teleports to ${tName}`; }
        else if (spell.type === 'party_revive') desc = `Revives & Heals Party: <b style="color:#00aa00;">${bHeal}</b> HP`;
        else if (spell.type === 'inflict_ailment') desc = `Inflicts <b style="color:#aa44ff;">${spell.ailment}</b> on Enemies`;
        else if (spell.buffType === 'inspiration') desc = `Party Physical Dmg +25% (${finalDuration} Rnds)`;
        else if (spell.buffType === 'taunt') desc = `Draws All Enemy Attacks (${finalDuration} Rnds)`;
        else if (spell.buffType === 'haste') desc = `Massive Dodge Bonus (${finalDuration} Rnds)`;
        else if (spell.buffType === 'resist_magic') desc = `+50% Magic Resistance (${finalDuration} Rnds)`;
        else if (spell.buffType === 'wight_ward') desc = `Blocks Afflictions, +75% Magic Resist (${finalDuration} Rnds)`;
        else if (spell.type === 'buff' || spell.type === 'party_buff') { if (spell.buffType === 'undeadDmg') desc = `+50% Dmg to Undead (${spell.duration} Rnds)`; else if (spell.buffType === 'undeadResist') desc = `-50% Dmg from Undead (${spell.duration} Rnds)`; }
        else if (spell.type === 'summon') desc = `Summons a creature.`;
        if (spell.maxRange) desc += ` <span style="margin-left: 10px; color: #885522; font-weight: bold;">[Range: ${spell.maxRange}]</span>`;
        let titleColor = !isDisabled ? '#0044aa' : '#777', costColor = !isDisabled ? '#0044aa' : (!isUsableInMode ? '#777' : '#aa0000'); 
        let costText = `${spell.mpCost} ${isBard ? 'Songs' : 'SP'}`;
        if (!isUsableInMode) costText = `<div style="font-size:0.8rem; text-transform:uppercase;">${mode === 'explore' ? 'Combat Only' : 'Explore Only'}</div><div>${spell.mpCost} ${isBard ? 'Songs' : 'SP'}</div>`;
        else if (outOfRange) costText = `<div style="font-size:0.8rem; text-transform:uppercase;">Out of Range</div><div>${spell.mpCost} ${isBard ? 'Songs' : 'SP'}</div>`;
        else if (durationTooLow) costText = `<div style="font-size:0.8rem; text-transform:uppercase; color:#aa0000; line-height: 1.1;">Instrument<br>Too Weak</div><div style="margin-top:2px;">${spell.mpCost} ${isBard ? 'Songs' : 'SP'}</div>`;

        let spellIconName = `spell_${spellId}.webp`;
        let spellImgPath = window.getSpriteDataUrl(spellIconName);

        let btn = document.createElement('div');
        btn.className = 'sm-item-card'; btn.style.width = '96%'; btn.style.margin = '0 auto 6px auto'; btn.style.padding = '12px 15px'; btn.style.justifyContent = 'space-between'; btn.style.border = '1px solid rgba(139, 69, 19, 0.3)'; 
        btn.innerHTML = `<div style="display: flex; gap: 12px; align-items: center;"><div class="sm-item-icon" style="background-image:url('${spellImgPath}'); border-radius: 4px; border: 2px solid rgba(139, 69, 19, 0.5);"></div><div style="display: flex; flex-direction: column; gap: 4px;"><div style="font-size:1.4rem; color:${titleColor}; font-weight:bold; text-shadow: none;">${displayName}${targetLabel}</div><div style="font-size:1.0rem; color:#5a2e0e; font-style:italic; font-weight:normal; text-shadow: none;">${desc}</div></div></div><div style="font-size:1.4rem; font-weight:bold; color:${costColor}; text-shadow: none; text-align:right; display:flex; flex-direction:column; justify-content:center;">${costText}</div>`;
        if (isDisabled) btn.style.opacity = '0.5';
        btn.onclick = () => window.openSpellModal(spellId, charIndex, mode, distToEnemy, isDisabled);
        listDiv.appendChild(btn);
    });
    if (knownSpells.length === 0) listDiv.innerHTML = `<div style="text-align:center; color:#555; padding:20px; font-style:italic;">No spells match this filter.</div>`;
    document.getElementById('spellbook-modal').style.display = 'flex';
};

window.openSpellModal = function(spellId, charIndex, mode, distToEnemy, isDisabled) {
    let spell = spellDB[spellId], char = party[charIndex], isBard = char.class === 'Bard';

    // 1. Calculate base stats needed for the additive part of the formula
    let magicStat = ['Healer', 'Paladin'].includes(char.class) ? getStat(char, 'WIS') : (isBard ? getStat(char, 'CHA') : getStat(char, 'INT'));
    let spellBonus = Math.max(0, magicStat - 17) + Math.floor(char.level / 2);

    // 2. Use the new shared Multiplier engine
    let spellMult = window.calculateSpellMult(char, spell);

    let bMin = 0, bMax = 0, bHeal = 0;
    // 3. Update math to include spellBonus so the UI matches the actual engine damage/healing
    if (spell.minDmg !== undefined) { 
        bMin = Math.floor((spell.minDmg + spellBonus) * spellMult); 
        bMax = Math.floor((spell.maxDmg + spellBonus) * spellMult); 
    }
    if (spell.healAmount !== undefined) { 
        bHeal = Math.floor((spell.healAmount + (spellBonus * 2)) * spellMult); 
    }

    let instBonus = 0;
    if (isBard) {
        Array.of('Weapon', 'Offhand').forEach(slot => {
            let itemId = char.equipped[slot];
            let id = (itemId && typeof itemId === 'object') ? itemId.id : itemId;
            if (id && itemDB[id] && itemDB[id].subType === 'instrument' && itemDB[id].duration !== undefined) {
                instBonus = itemDB[id].duration;
            }
        });
    }
    let finalDuration = spell.duration !== undefined ? spell.duration + instBonus : undefined;
    const elementIcons = { 'fire': '🔥', 'ice': '❄️', 'lightning': '⚡', 'arcane': '✨', 'void': '🌌', 'holy': '☀️', 'dark': '💀' };
    let elemStr = spell.element && elementIcons[spell.element] ? elementIcons[spell.element] + ' ' : '';
    let titleColor = isBard ? '#cc5500' : '#0044aa', resName = isBard ? 'Songs' : 'SP';

    document.getElementById('spm-name').innerText = elemStr + spell.name;
    document.getElementById('spm-name').style.color = titleColor;
    document.getElementById('spm-subtitle').innerText = `Level ${spell.levelReq} ${isBard ? 'Song' : 'Spell'}`;

    // Resolve icon path via Atlas
    let spellIconName = `spell_${spellId}.webp`;
    let spellImgPath = window.getSpriteDataUrl(spellIconName);
    document.getElementById('spm-icon').style.backgroundImage = `url('${spellImgPath}')`;

    let statsHtml = `<div style="color:${titleColor}; font-size:1.4rem;"><b>Cost:</b> ${spell.mpCost} ${resName}</div>`;
    if (spell.type === 'damage') statsHtml += `<div style="margin-top:8px;"><b>Damage:</b> ${bMin}-${bMax}</div>`;
    if (spell.type.startsWith('siphon')) statsHtml += `<div style="margin-top:8px;"><b>Siphons:</b> ${bMin}-${bMax} ${spell.type === 'siphon_hp' ? 'HP' : 'SP'}</div>`;
    if (spell.type.includes('heal')) statsHtml += `<div style="color:#00aa00; margin-top:8px;"><b>Heals:</b> ${bHeal} HP</div>`;
    if (spell.type === 'party_revive') statsHtml += `<div style="color:#00aa00; margin-top:8px;"><b>Revives & Heals Party:</b> ${bHeal} HP</div>`;
    if (spell.type === 'revive') statsHtml += `<div style="color:#00aa00; margin-top:8px;"><b>Revives Dead Ally</b></div>`;
    if (spell.curesAll || spell.type === 'cure_all') statsHtml += `<div style="color:#00aa00; margin-top:8px;"><b>Cures:</b> ALL Ailments</div>`;
    else if (spell.cures) statsHtml += `<div style="color:#00aa00; margin-top:8px;"><b>Cures:</b> ${spell.cures.join(', ')}</div>`;
    if (spell.type === 'inflict_ailment') statsHtml += `<div style="color:#aa44ff; margin-top:8px;"><b>Inflicts:</b> ${spell.ailment}</div>`;
    if (spell.lightRadius) statsHtml += `<div style="margin-top:8px;"><b>Light Radius:</b> +${spell.lightRadius} (${spell.duration} steps)</div>`;
    if (spell.type === 'buff' || spell.type === 'party_buff') {
        let buffText = { 'inspiration': "Physical Dmg +25%", 'taunt': "Draws All Enemy Attacks", 'haste': "Massive Dodge Bonus", 'resist_magic': "+50% Magic Resistance", 'wight_ward': "Blocks Afflictions, +75% Magic Resist", 'undeadDmg': "+50% Dmg to Undead", 'undeadResist': "-50% Dmg from Undead" }[spell.buffType] || "";
        if (buffText !== "") statsHtml += `<div style="color:#00aa00; margin-top:8px;"><b>Effect:</b> ${buffText}</div>`;
    }
    if (spell.type === 'summon') {
        statsHtml += `<div style="color:#aa44ff; margin-top:8px;"><b>Effect:</b> Consumes a Gem to summon a creature. Cost is ${spell.mpCost} SP x Gem Level.</div>`;
    }
    if (finalDuration !== undefined) statsHtml += `<div style="margin-top:8px;"><b>Duration:</b> ${finalDuration} ${mode === 'combat' ? 'Rounds' : 'Steps'}</div>`;
    if (spell.maxRange) statsHtml += `<div style="margin-top:8px;"><b>Max Range:</b> ${spell.maxRange} Ranks</div>`;
    let targetDesc = spell.target === 'party' ? 'Entire Party' : (spell.target === 'all_enemies' ? 'All Enemies' : (spell.target === 'self' ? 'Self' : 'Single Target'));
    statsHtml += `<div style="margin-top:12px; color:#555; font-style:italic;"><b>Target:</b> ${targetDesc}</div>`;

    document.getElementById('spm-stats').innerHTML = statsHtml || `<i>No special properties.</i>`;

    let btnBox = document.getElementById('spm-buttons'); 
    btnBox.innerHTML = '';
    let actionWord = isBard ? '🎵 Sing' : '✨ Cast';

    if (isDisabled) {
        let errorBtn = document.createElement('button');
        errorBtn.innerText = `Cannot ${actionWord}`; 
        errorBtn.disabled = true; 
        errorBtn.style.height = '50px'; 
        errorBtn.style.background = '#444'; 
        errorBtn.style.color = '#888'; 
        btnBox.appendChild(errorBtn);
    } else {
        let castBtn = document.createElement('button');
        castBtn.innerText = spell.type === 'summon' ? `${actionWord} (Select Gem)` : `${actionWord} (${spell.mpCost} ${resName})`; 
        castBtn.style.height = '50px'; 
        castBtn.style.background = isBard ? '#cc5500' : '#44aa44'; 
        castBtn.style.color = '#fff';
        castBtn.onclick = () => {
            document.getElementById('spell-modal').style.display = 'none';
            if (spell.type === 'summon') { window.showGemPicker(spellId, charIndex, mode); }
            else if (spell.target === 'ally') window.showAllyPicker(spellId, charIndex, mode);
            else {
                if (mode === 'combat') {
                    let allyIdx = (spell.target === 'self' || spell.target === 'party') ? charIndex : null;
                    window.combatState.queuedActions.push({ charIndex: charIndex, action: 'CAST', spellId: spellId, targetId: window.combatState.selectedEnemyId, targetAllyIndex: allyIdx });
                    document.getElementById('spellbook-modal').style.display = 'none';
                    window.combatState.activeCharIndex++; 
                    promptNextCombatant(); 
                } else { window.castExploreSpell(spellId, charIndex, spell.target === 'self' ? charIndex : null, 'explore'); }
            }
        };
        btnBox.appendChild(castBtn);
    }
    let cancelBtn = document.createElement('button'); 
    cancelBtn.innerText = 'Cancel'; 
    cancelBtn.style.height = '50px'; 
    cancelBtn.style.background = '#555'; 
    cancelBtn.style.color = '#fff'; 
    cancelBtn.onclick = () => { document.getElementById('spell-modal').style.display = 'none'; }; 
    btnBox.appendChild(cancelBtn);
    document.getElementById('spell-modal').style.display = 'flex';
};


window.castSummonSpell = function(spellId, casterIndex, invIdx, mode) {
    let spell = spellDB[spellId];
    let caster = party[casterIndex];
    let invObj = sharedInventory[invIdx];
    let itemId = typeof invObj === 'string' ? invObj : invObj.id;
    let iData = itemDB[itemId];
    let gemLevel = iData.level || 1;
    let requiredMp = spell.mpCost * gemLevel;

    if (caster.mp < requiredMp) return;

    if (window.isAntiMagic(player.x, player.y)) {
        logMsg(`<span style="color:#aa44ff; font-weight:bold;">${caster.name} attempts to summon, but the Anti-Magic field suppresses the spell!</span>`);
        if (mode === 'combat_resolve') updateCombatUI();
        return;
    }

    caster.mp -= requiredMp;
    if (typeof invObj === 'object') {
        invObj.qty -= 1;
        if (invObj.qty <= 0) sharedInventory[invIdx] = null;
    } else {
        sharedInventory[invIdx] = null;
    }

    let candidates = enemyBestiary.filter(e => e.level === gemLevel && e.name !== "The Lyre-Wight");
    if (candidates.length === 0) candidates = enemyBestiary.filter(e => e.level <= gemLevel && e.name !== "The Lyre-Wight").sort((a,b)=>b.level - a.level);
    if (candidates.length === 0) candidates = enemyBestiary;

    let maxLvl = candidates[0].level;
    let validCandidates = candidates.filter(e => e.level === maxLvl);
    let chosenEnemy = validCandidates[Math.floor(Math.random() * validCandidates.length)];

    // 🌟 ADDED: Grant card on successful summon
    window.grantCard(chosenEnemy.name);

    let summonMp = chosenEnemy.canMagic ? (chosenEnemy.level * 20 + 20) : 0;
    let summon = {
        name: chosenEnemy.name,
        race: chosenEnemy.category || "Monster",
        class: "Summon",
        gender: "n",
        level: chosenEnemy.level,
        xp: 0,
        hp: chosenEnemy.hpMax,
        maxHp: chosenEnemy.hpMax,
        mp: summonMp,
        maxMp: summonMp,
        stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10, LUK: 10 },
        baseAc: Math.abs(chosenEnemy.ac || 0),
        equipped: { Weapon: null, Offhand: null, Body: null, Helmet: null, Gloves: null, Boots: null, Ammo: null, Ring1: null, Ring2: null },
        isDefending: false,
        spells: [],
        ailments: [],
        isSummon: true,
        enemyData: chosenEnemy 
    };

    let targetSlot = 6;
    let emptyIdx = party.findIndex(p => p.name === "Empty" || p.isSummon);
    if (emptyIdx !== -1) targetSlot = emptyIdx;

    party[targetSlot] = summon;

    window.playSpellAudio(spellId);
    logMsg(`<span style="color:#0044aa; font-weight:bold;">${caster.name} uses the ${iData.name} to summon a ${summon.name}!</span>`);

    if (mode === 'explore') {
        renderParty();
        if (activeModalCharIndex !== null) openCharSheet(activeModalCharIndex);
        if (typeof update === 'function') update();
    } else if (mode === 'combat_resolve') {
        updateCombatUI();
    }
};

window.castExploreSpell = function(spellId, casterIndex, targetAllyIndex, mode) {
    let spell = spellDB[spellId], caster = party[casterIndex];
    if (caster.mp < spell.mpCost) return;

    if ((window.isAntiMagic(player.x, player.y) && spell.magical) || 
        (window.isSilence(player.x, player.y) && spell.classReq === 'Bard')) {
        logMsg("<span style='color:#aa44ff;'>The air is stagnant; your power is stifled here.</span>");
        return;
    }

    let effectFired = false, logText = "";

    // 🌟 USE HELPER: Multiplier is unified
    let spellMult = window.calculateSpellMult(caster, spell);

    if (spell.type === 'heal') {
        let targetAlly = targetAllyIndex !== null ? party[targetAllyIndex] : null;
        if (targetAlly) { 
            let rawHeal = Math.floor(spell.healAmount * spellMult);
            let actualHeal = Math.min(rawHeal, targetAlly.maxHp - targetAlly.hp); 
            targetAlly.hp += actualHeal; 
            logText = `${caster.name} heals ${targetAlly.name} for ${actualHeal} HP!`; 
            effectFired = true; 
        }    
    } else if (spell.type === 'party_heal') {
        let rawHeal = Math.floor(spell.healAmount * spellMult);
        let injured = party.filter(p => p.name !== "Empty" && p.hp > 0 && p.hp < p.maxHp);
        if (injured.length > 0) { 
            injured.forEach(p => p.hp = Math.min(p.maxHp, p.hp + rawHeal)); 
            logText = `${caster.name} heals the entire party!`; 
            effectFired = true; 
        } else alert("Everyone is healthy.");
    } else if (spell.type === 'cure') {
        let targetAlly = targetAllyIndex !== null ? party[targetAllyIndex] : null;
        if (targetAlly) { targetAlly.ailments = targetAlly.ailments.filter(a => !spell.cures.includes(a)); logText = `${caster.name} cures ${targetAlly.name}!`; effectFired = true; }
    } else if (spell.type === 'cure_all') {
        let afflicted = party.filter(p => p.name !== "Empty" && p.hp > 0 && p.ailments.length > 0);
        if (afflicted.length > 0) { afflicted.forEach(p => p.ailments =[]); logText = `${caster.name} purifies the party!`; effectFired = true; } else alert("No ailments found.");
    } else if (spell.type === 'cure_one') {
        let targetAlly = targetAllyIndex !== null ? party[targetAllyIndex] : null;
        if (targetAlly && targetAlly.ailments.length > 0) { let curedAilment = targetAlly.ailments.shift(); logText = `${caster.name} cleanses ${curedAilment} from ${targetAlly.name}!`; effectFired = true; }
    } else if (spell.type === 'revive') {
        let targetAlly = targetAllyIndex !== null ? party[targetAllyIndex] : null;
        if (targetAlly) { targetAlly.hp = spell.healAmount >= 9999 ? targetAlly.maxHp : spell.healAmount; targetAlly.ailments =[]; logText = `${caster.name} resurrects ${targetAlly.name}!`; effectFired = true; }
    } else if (spell.type === 'light') {
        if (worldMaps[currentMapId].isLit) { alert("Already bright."); return; }
        let existing = window.partyEffects.find(e => e.type === 'light');
        if (existing) { existing.duration += spell.duration; existing.power = Math.max(existing.power, spell.lightRadius); existing.name = spell.name; } 
        else window.partyEffects.push({ id: spellId, name: spell.name, icon: `spell_${spellId}.webp`, duration: spell.duration, type: 'light', power: spell.lightRadius });
        logText = `${caster.name} conjures light.`; updateEffectsUI(); effectFired = true;
    } else if (spell.type === 'teleport') {
        document.getElementById('spellbook-modal').style.display = 'none'; document.getElementById('char-modal').style.display = 'none';
        let tId = window.lastVisitedTown || 'barrowtown', tName = worldMaps[tId].name, spawn = window.lastTownSpawn || { x: 6, y: 10, dir: 0 };
        logMsg(`<span style="color:#aa44ff;">${caster.name} opens a portal!</span>`); caster.mp -= spell.mpCost; setTimeout(() => loadMap(tId, spawn.x, spawn.y, spawn.dir), 500); return;
    }

    if (effectFired) {
        // 🌟 FIX: We replaced an invalid window.stopAllSongs() call with the correct targeted stop sequence.
        if (spell.classReq === 'Bard') {
            window.stopBardSongs(casterIndex);
        }
		caster.mp -= spell.mpCost; window.playSpellAudio(spellId); 
        logMsg(`<span style="color:#0044aa; font-weight:bold;">${logText}</span>`);

        openCharSheet(activeModalCharIndex); 
        renderParty();

        // 🌟 FIX: Force immediate render to update lighting
        if (typeof update === 'function') update();

        if (mode === 'explore') {
            if (spell.target === 'ally') {
                window.showAllyPicker(spellId, casterIndex, 'explore');
            } else {
                window.openSpellbook(mode, casterIndex);
            }
        }
    }
};


window.showGemPicker = function(spellId, casterIndex, mode) {
    let spell = spellDB[spellId];
    let caster = party[casterIndex];
    document.getElementById('sb-title').innerText = `Select a Gem`;
    let listDiv = document.getElementById('sb-list');
    listDiv.innerHTML = '';

    let gemsFound = false;

    sharedInventory.forEach((item, invIdx) => {
        if (item && !item.isQuestItem) {
            let itemId = typeof item === 'string' ? item : item.id;
            let iData = itemDB[itemId];
            if (iData && itemId.startsWith('gem_')) {
                gemsFound = true;
                let gemLevel = iData.level || 1;
                let requiredMp = spell.mpCost * gemLevel;
                let canAfford = caster.mp >= requiredMp;

                let btn = document.createElement('div');
                btn.className = 'sm-item-card';
                btn.style.width = '96%';
                btn.style.margin = '0 auto 6px auto';
                btn.style.padding = '6px 15px';
                btn.style.justifyContent = 'space-between';
                btn.style.border = '1px solid rgba(139, 69, 19, 0.3)';

                let titleColor = canAfford ? '#0044aa' : '#777';
                btn.innerHTML = `<div style="display: flex; align-items: center; gap: 10px;">
                    <div class="sm-item-icon" style="background-image:url('assets/${iData.icon || iData.iconM}?v=${GAME_VERSION}'); border-radius: 4px; border: 1px solid #5a2e0e; width: 32px; height: 32px;"></div>
                    <div style="display: flex; flex-direction: column;">
                        <div style="font-size:1.2rem; color:${titleColor}; font-weight:bold;">${iData.name}</div>
                        <div style="font-size:0.9rem; color:#5a2e0e;">Summons Lvl ${gemLevel} Creature</div>
                    </div>
                </div>
                <div style="font-weight:bold; color:${canAfford ? '#0044aa' : '#aa0000'};">Cost: ${requiredMp} SP</div>`;

                if (!canAfford) {
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                } else {
                    btn.onclick = () => {
                        if (mode === 'combat') {
                            window.combatState.queuedActions.push({ 
                                charIndex: casterIndex, 
                                action: 'CAST_SUMMON', 
                                spellId: spellId, 
                                invIdx: invIdx 
                            });
                            document.getElementById('spellbook-modal').style.display = 'none';
                            window.combatState.activeCharIndex++; 
                            promptNextCombatant();
                        } else {
                            document.getElementById('spellbook-modal').style.display = 'none';
                            window.castSummonSpell(spellId, casterIndex, invIdx, mode);
                        }
                    };
                }
                listDiv.appendChild(btn);
            }
        }
    });

    if (!gemsFound) {
        listDiv.innerHTML = `<div style="text-align:center; padding:20px; color:#777; font-style:italic;">No gems found in inventory.</div>`;
    }

    let backBtn = document.createElement('button');
    backBtn.innerText = "◀ Back to Spells";
    backBtn.style.width = "96%";
    backBtn.style.margin = "10px auto 0 auto"; 
    backBtn.style.height = "38px"; 
    backBtn.style.minHeight = "38px";
    backBtn.onclick = () => window.openSpellbook(mode, casterIndex);
    listDiv.appendChild(backBtn);

    document.getElementById('spellbook-modal').style.display = 'flex';
};

function updateCombatUI() {
    if (window.gameState !== 'COMBAT') return;

    // 🌟 UPDATED: Allow visually affected dead enemies to remain on screen to finish animating!
    let aliveEnemies = window.combatState.enemies.filter(e => e.hp > 0 || e.visualEffect);
    const enemyZone = document.getElementById('enemy-zone');

    // Clear and prepare containers
    enemyZone.innerHTML = '';
    const partyZone = document.getElementById('party-zone');
    partyZone.innerHTML = '';

    // 🌟 ENEMY ZONE LAYOUT
    enemyZone.style.display = 'flex';
    enemyZone.style.justifyContent = 'center';
    enemyZone.style.alignItems = 'flex-end';
    enemyZone.style.position = 'relative'; 
    enemyZone.style.gap = '0px'; 
    enemyZone.style.flexWrap = 'nowrap'; 

    // Draw Rank Lines
    let uniqueRanks = [...new Set(aliveEnemies.map(e => e.distance))];
    uniqueRanks.forEach(dist => {
        let bottomPct = (dist - 1) * 8; 
        let lineDiv = document.createElement('div');
        lineDiv.style.position = 'absolute';
        lineDiv.style.left = '5%';
        lineDiv.style.right = '5%';
        lineDiv.style.bottom = `${bottomPct}%`;
        lineDiv.style.borderBottom = '1px dashed rgba(255,255,255,0.2)';
        lineDiv.style.zIndex = '5';
        lineDiv.style.pointerEvents = 'none';
        lineDiv.innerHTML = `<div style="position: absolute; right: 0; bottom: 2px; color: rgba(255,255,255,0.5); font-size: 0.8rem; font-weight: bold; text-shadow: 1px 1px 0 #000;">Rank ${dist}</div>`;
        enemyZone.appendChild(lineDiv);
    });

    let sortedByDistance = [...aliveEnemies].sort((a, b) => a.distance - b.distance);
    sortedByDistance.forEach((e, i) => e.hSlot = Math.ceil(i / 2) * (i % 2 !== 0 ? 1 : -1));
    let sortedLeftToRight = [...sortedByDistance].sort((a, b) => a.hSlot - b.hSlot);

    const enemyContainerWidth = enemyZone.clientWidth || 800;
    const enemySpriteSizes = sortedLeftToRight.map(e => Math.floor(160 * (e.data.scale || 1.0)));
    const totalEnemyWidth = enemySpriteSizes.reduce((sum, val) => sum + val, 0);

    let enemyMargin = 15;
    if (totalEnemyWidth + (sortedLeftToRight.length * 2 * enemyMargin) > enemyContainerWidth) {
        enemyMargin = Math.floor((enemyContainerWidth - totalEnemyWidth) / (sortedLeftToRight.length * 2));
        const minMargin = -Math.floor((totalEnemyWidth / sortedLeftToRight.length) * 0.4);
        if (enemyMargin < minMargin) enemyMargin = minMargin;
    }

    sortedLeftToRight.forEach((e, i) => {
        const size = enemySpriteSizes[i];
        const isTargeted = (e.id === window.combatState.selectedEnemyId && !e.visualEffect) ? 'targeted' : '';
        const ePct = Math.max(0, (e.hp / e.maxHp) * 100);
        const zIndex = 100 - (e.distance * 10) - Math.abs(e.hSlot);
        const bottomPct = (e.distance - 1) * 8; 

        const effectClass = e.visualEffect ? `effect-${e.visualEffect}` : '';
        const deadClass = e.hp <= 0 ? 'dead' : '';
        const uiVisibility = e.hp > 0 ? 'visible' : 'hidden';

        // 🌟 FIX: Convert atlas portrait to DataURL for CSS
        let ePort = e.portrait.replace('.png', '.webp');
        let eUrl = window.getSpriteDataUrl(ePort);

        const enemyDiv = document.createElement('div');
        enemyDiv.style.marginLeft = `${enemyMargin}px`;
        enemyDiv.style.marginRight = `${enemyMargin}px`;
        enemyDiv.style.position = 'relative';
        enemyDiv.style.zIndex = zIndex;
        enemyDiv.style.flexShrink = '0';
        enemyDiv.style.bottom = `${bottomPct}%`;
        enemyDiv.innerHTML = `
            <div class="bf-sprite bf-sprite-enemy ${isTargeted} ${effectClass} ${deadClass}" onclick="selectEnemyTarget(${e.id})" 
                 style="width: ${size}px; height: ${size}px; background-image: url('${eUrl}'); cursor:pointer; background-size: contain; background-position: bottom center; background-repeat: no-repeat;">
                <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 80px; height: 6px; background: #222; border: 1px solid #000; visibility: ${uiVisibility};">
                    <div style="width: ${ePct}%; height: 100%; background: #cc0000;"></div>
                </div>
                ${e.maxMp > 0 ? `<div style="position: absolute; bottom: -16px; left: 50%; transform: translateX(-50%); width: 80px; height: 4px; background: #222; border: 1px solid #000; visibility: ${uiVisibility};"><div style="width: ${Math.max(0, (e.mp / e.maxMp) * 100)}%; height: 100%; background: #0044aa;"></div></div>` : ''}
                <div style="position:absolute; bottom: -35px; left: 50%; transform: translateX(-50%); color:#fff; font-size:0.8rem; font-weight:bold; text-shadow:1px 1px 0 #000; white-space:nowrap; visibility: ${uiVisibility};">${e.customName || e.data.name}</div>
            </div>`;
        enemyZone.appendChild(enemyDiv);
    });

    // 🌟 PARTY ZONE LAYOUT
    partyZone.style.display = 'flex';
    partyZone.style.justifyContent = 'center';
    partyZone.style.alignItems = 'flex-end';
    partyZone.style.position = 'relative';
    partyZone.style.gap = '0px';
    partyZone.style.flexWrap = 'nowrap';

    // 🌟 Ensure dying/animated party members aren't snapped out prematurely
    const aliveParty = party.map((p, i) => ({p, i})).filter(x => x.p.name !== "Empty" && (x.p.hp > 0 || x.p.visualEffect));
    const partySpriteSizes = aliveParty.map(item => {
        let p = item.p;
        let scale = (p.isSummon && p.enemyData?.scale) ? p.enemyData.scale : (p.race === "Dwarf" ? 0.8 : p.race === "Halfling" ? 0.7 : 1.0);
        return Math.floor(144 * scale);
    });
    const totalPartyWidth = partySpriteSizes.reduce((sum, s) => sum + s, 0);
    const partyContainerWidth = partyZone.clientWidth || 800;

    let partyMargin = 15;
    if (totalPartyWidth + (aliveParty.length * 2 * partyMargin) > partyContainerWidth) {
        partyMargin = Math.floor((partyContainerWidth - totalPartyWidth) / (aliveParty.length * 2));
        const minMargin = -Math.floor((totalPartyWidth / aliveParty.length) * 0.4);
        if (partyMargin < minMargin) partyMargin = minMargin;
    }

    aliveParty.forEach((item, i) => {
        let p = item.p;
        let rank = item.i < 4 ? 1 : 2;
        let bottomOffset = (rank === 1) ? 40 : 0;
        let zIndex = (rank === 1) ? 100 : 50;
        let spriteSize = partySpriteSizes[i];
        let barWidth = Math.min(115, Math.floor(spriteSize * 0.8));
        let pPct = Math.max(0, (p.hp / p.maxHp) * 100);
        let hpColor = pPct <= 20 ? '#cc0000' : (pPct <= 50 ? '#ffcc00' : '#00cc00');
        let hasSp = p.maxMp > 0;
        let activeClass = (item.i === window.combatState.activeCharIndex) ? 'active' : '';

        // 🌟 DYNAMIC BAR COLOR: Bard songs (Songs) match the roster orange
        let spColor = (p.class === 'Bard') ? '#cc5500' : '#0044aa';

        const effectClass = p.visualEffect ? `effect-${p.visualEffect}` : '';
        const deadClass = p.hp <= 0 ? 'dead' : '';
        const uiVisibility = p.hp > 0 ? 'visible' : 'hidden';

        // 🌟 FIX: Handle Portrait rendering for Summons (Atlas) vs Regular (File)
        let pPath = window.getCharPortrait(p);
        let pUrl = p.isSummon ? window.getSpriteDataUrl(pPath) : pPath;

        const partyDiv = document.createElement('div');
        partyDiv.style.marginLeft = `${partyMargin}px`;
        partyDiv.style.marginRight = `${partyMargin}px`;
        partyDiv.style.marginBottom = `${bottomOffset}px`;
        partyDiv.style.zIndex = zIndex;
        partyDiv.style.flexShrink = '0';
        partyDiv.innerHTML = `
            <div class="bf-sprite ${activeClass} ${effectClass} ${deadClass}" style="width: ${spriteSize}px; height: ${spriteSize}px; background-image: url('${pUrl}'); background-size: contain; background-position: bottom center; background-repeat: no-repeat;">
                <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: ${barWidth}px; height: 6px; background: #222; border: 1px solid #000; visibility: ${uiVisibility};">
                    <div style="width: ${pPct}%; height: 100%; background: ${hpColor};"></div>
                </div>
                ${hasSp ? `<div style="position: absolute; bottom: -16px; left: 50%; transform: translateX(-50%); width: ${barWidth}px; height: 4px; background: #222; border: 1px solid #000; visibility: ${uiVisibility};"><div style="width: ${Math.max(0, (p.mp / p.maxMp) * 100)}%; height: 100%; background: ${spColor};"></div></div>` : ''}
            </div>`;
        partyZone.appendChild(partyDiv);
    });

    renderParty();
}


function promptNextCombatant() {
    while (window.combatState.activeCharIndex < party.length) {
        let p = party[window.combatState.activeCharIndex];
        if (p.name !== "Empty" && p.hp > 0) {
            if (p.isSummon) {
                window.combatState.queuedActions.push({ charIndex: window.combatState.activeCharIndex, action: 'AUTONOMOUS' });
            } else if (p.ailments.includes('Sleep') || p.ailments.includes('Paralysis') || p.ailments.includes('Frozen')) {
                window.combatState.queuedActions.push({ charIndex: window.combatState.activeCharIndex, action: 'INCAPACITATED' });
            } else {
                break;
            }
        }
        window.combatState.activeCharIndex++;
    }

    if (window.combatState.activeCharIndex >= party.length) { executeCombatRound(); return; }

    let char = party[window.combatState.activeCharIndex];
    let charRank = window.combatState.activeCharIndex < 4 ? 1 : 2; 

    let aliveEnemies = window.combatState.enemies.filter(e => e.hp > 0);
    if (aliveEnemies.length === 0) return;

    let targetEnemy = aliveEnemies.find(e => e.id === window.combatState.selectedEnemyId);
    if (!targetEnemy) {
        aliveEnemies.sort((a, b) => a.distance - b.distance);
        targetEnemy = aliveEnemies[0];
        window.combatState.selectedEnemyId = targetEnemy.id; 
    }

    // 🌟 FIXED: Use customName for the prompt text
    let targetName = targetEnemy.customName || targetEnemy.data.name;
    document.getElementById('combat-status').innerText = `${char.name} (Rank ${charRank}) aims at ${targetName} (Rank ${targetEnemy.distance})`;

    let distToEnemy = targetEnemy.distance + (charRank - 1); 
    let btnAttack = document.getElementById('btn-c-attack');
    let weapId = char.equipped.Weapon; let weaponData = weapId ? itemDB[weapId] : null;
    // 🌟 UPDATED: Check requiresAmmo OR subType for correct button text
    let isRanged = weaponData && (weaponData.requiresAmmo || weaponData.subType === 'ranged');
    let isAmmoBased = weaponData && weaponData.requiresAmmo;
    let weaponRange = weaponData && weaponData.maxRange ? weaponData.maxRange : 1; 

    if (distToEnemy > weaponRange) { 
        btnAttack.disabled = true; btnAttack.innerText = isRanged ? `🏹 Out of Range` : `⚔️ Out of Range`; 
    } else { 
        btnAttack.disabled = false; btnAttack.innerText = isRanged ? `🏹 Attack` : `⚔️ Attack`; 
    }

    let btnCast = document.getElementById('btn-c-cast');

    const isBard = char.class === 'Bard'; 
    const isAntiMagic = window.isAntiMagic(player.x, player.y);
    const isSilence = window.isSilence(player.x, player.y);
    const isSpellcaster = ['Mage', 'Healer', 'Paladin'].includes(char.class);

    if ((isAntiMagic && isSpellcaster) || (isSilence && isBard)) {
        btnCast.disabled = true;
        btnCast.innerText = "✨ Suppressed";
    } else {
        let hasInstrument = false;
        if (isBard) {
            Array.of('Weapon', 'Offhand').forEach(s => {
                let eqId = char.equipped[s];
                let id = (eqId && typeof eqId === 'object') ? eqId.id : eqId;
                if (id && itemDB[id] && itemDB[id].subType === 'instrument') hasInstrument = true;
            });
        }
        if (char.maxMp <= 0 || char.mp <= 0 || (isBard && !hasInstrument)) {
            btnCast.disabled = true; 
        } else {
            btnCast.disabled = false;
        }
        btnCast.innerText = isBard ? '🎵 Sing' : '✨ Cast';
    }
    document.getElementById('combat-individual-controls').style.display = 'grid';
    document.getElementById('combat-spell-menu').style.display = 'none';
    updateCombatUI();
}

function getAilmentFromAttack(effectName) {
    if (!effectName || effectName === "None") return null;
    let str = effectName.toLowerCase();
    const ailmentKeywords = {
        'Poison': ['poison', 'venom', 'acid'],
        'Disease': ['disease', 'necrotic', 'rot', 'rust', 'plague'],
        'Paralysis': ['paralyz', 'petrify', 'aegis'],
        'Sleep': ['sleep', 'mesmer', 'ethereal', 'requiem'],
        'Madness': ['madness', 'mind', 'wight-song', 'despair', 'maddening', 'neural', 'psychic', 'terror'],
        'Confusion': ['confus', 'curse', 'warp', 'singularity', 'void', 'reality'],
        'Blindness': ['blind', 'gaze', 'searing', 'eclipse', 'halo', 'ink', 'glare', 'celestial'],
        'Frozen': ['freez', 'blizzard', 'ice', 'frost', 'frozen', 'chill', 'glacial', 'zero']
    };
    for(let ailment in ailmentKeywords) {
        if(ailmentKeywords[ailment].some(k => str.includes(k))) return ailment;
    }
    return null;
}

// Update your getPotentialAilments to use the same logic
function getPotentialAilments(enemy) {
    let ailments = [];
    [enemy.meleeEffect, enemy.rangedEffect, enemy.magicEffect].forEach(eff => {
        let a = getAilmentFromAttack(eff);
        if (a && !ailments.includes(a)) ailments.push(a);
    });
    return ailments;
}

window.getEquipRegen = function(char) {
    let regen = { hp: 0, mp: 0 };
    if (!char || !char.equipped) return regen;

    ['Weapon', 'Offhand', 'Body', 'Helmet', 'Gloves', 'Boots', 'Ring1', 'Ring2', 'Ammo'].forEach(slot => {
        let itemId = char.equipped[slot];
        if (itemId) {
            let id = typeof itemId === 'object' ? itemId.id : itemId;
            let item = itemDB[id];
            if (item) {
                if (item.hpRegen) regen.hp += item.hpRegen;
                if (item.mpRegen) regen.mp += item.mpRegen;
            }
        }
    });
    return regen;
};

window.playSfx = function(filename) {
    if (!window.isSfxEnabled()) return;
    const audio = new Audio(`assets/audio/${filename}?v=${GAME_VERSION}`);
    audio.volume = 0.5;
    audio.play().catch(e => console.warn(`SFX Failed: ${filename}`, e));
};

async function executeCombatRound() {
    logMsg("--- Round Resolution ---");
    document.getElementById('combat-individual-controls').style.display = 'none';
    document.getElementById('combat-spell-menu').style.display = 'none'; 
    window.combatState.activeCharIndex = 99; updateCombatUI();

    for (let act of window.combatState.queuedActions) {
        if (window.gameState !== 'COMBAT') return; 
        let char = party[act.charIndex];
        if (char.hp <= 0) continue; 

        if (char.hp <= 0 || char.ailments.includes('Sleep') || char.ailments.includes('Paralysis') || char.ailments.includes('Frozen')) {
            if (char.class === 'Bard') {
                logMsg(`<span style="color:#cc5500; font-weight:bold;">${char.name} is incapacitated, the song fades away...</span>`);
                window.stopBardSongs(act.charIndex);
            } else {
                logMsg(`<span style="color:#aa44ff; font-weight:bold;">${char.name} is incapacitated and cannot act!</span>`);
            }
            await sleep(800); continue;
        }

        if (char.ailments.includes('Confusion') && Math.random() < 0.5) {
            char.isDefending = false;
            logMsg(`<span style="color:#aa44ff; font-weight:bold;">${char.name} is overwhelmed by confusion and does nothing!</span>`);
            await sleep(800); continue;
        }

        if (char.ailments.includes('Madness') && Math.random() < 0.5) {
            char.isDefending = false; 
            let myRank = act.charIndex < 4 ? 1 : 2;
            let validTargets = party.filter((p, i) => p.name !== "Empty" && p.hp > 0 && i !== act.charIndex && (i < 4 ? 1 : 2) === myRank);

            if (validTargets.length > 0) {
                let victim = validTargets[Math.floor(Math.random() * validTargets.length)];
                logMsg(`<span style="color:#aa44ff; font-weight:bold; font-size:1.1rem;">Madness consumes ${char.name}! They turn and attack ${victim.name}!</span>`);

                char.visualEffect = 'glow-debuff';
                updateCombatUI();
                await sleep(300);
                char.visualEffect = null;

                let weapId = char.equipped.Weapon; 
                let weaponData = weapId ? itemDB[weapId] : null;
                let minDmg = weaponData ? (weaponData.minDmg || 1) : 1;
                let maxDmg = weaponData ? (weaponData.maxDmg || 4) : 4;
                let statBonus = Math.floor(getStat(char, 'STR') / 3);
                let lvlBonus = Math.floor(char.level / 2);
                let rawDmg = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;
                let dmg = Math.floor((rawDmg + statBonus + lvlBonus) * (1 + (char.level / 15)));
                let tLUK = getStat(victim, 'LUK');

                if (Math.random() * 100 < tLUK) { 
                    logMsg(`<span style="color:#00aa00;">${victim.name} dodged the frantic strike!</span>`); 
                    window.playSfx('melee_miss.ogg');
                    victim.visualEffect = 'glow-dodge';
                } else {
                    let totalAC = victim.baseAc || 0;
                    Array.of('Body', 'Helmet', 'Gloves', 'Boots', 'Offhand').forEach(slot => {
                        let itemId = victim.equipped[slot];
                        let id = (itemId && typeof itemId === 'object') ? itemId.id : itemId;
                        if (id && itemDB[id] && itemDB[id].ac) totalAC += itemDB[id].ac;
                    });
                    let tAC = Math.abs(totalAC); 
                    let tDEX = getStat(victim, 'DEX');
                    if (victim.isDefending) { tAC *= 2; tDEX = Math.min(50, tDEX * 2); }
                    let postAcDmg = dmg - tAC;
                    if (postAcDmg <= 0) { 
                        logMsg(`<span style="color:#00aa00;">Armor absorbed the blow!</span>`); 
                        window.playSfx('melee_parry.ogg');
                        victim.visualEffect = 'glow-absorb';
                    } else {
                        let finalDmg = Math.floor(postAcDmg * (1 - (tDEX / 100))); 
                        if (finalDmg <= 0) { 
                            logMsg(`<span style="color:#00aa00;">${victim.name} deflected it!</span>`); 
                            window.playSfx('melee_parry.ogg');
                            victim.visualEffect = 'glow-absorb';
                        } else {
                            victim.hp = Math.max(0, victim.hp - finalDmg);
                            logMsg(`<span class="log-damage">${victim.name} takes ${finalDmg} damage!</span>`);
                            window.playSfx('melee_hit_flesh.ogg');
                            victim.visualEffect = 'glow-hit';
                            if (victim.hp <= 0) logMsg(`<span style="color:#aa0000; font-weight:bold;">${victim.name} has been killed by their ally!</span>`);
                        }
                    }
                }
                updateCombatUI();
                await sleep(400);
                victim.visualEffect = null;
                updateCombatUI();
                await sleep(200);
                continue; 
            } else {
                logMsg(`<span style="color:#aa44ff; font-weight:bold;">${char.name} screams in madness, but no allies are close enough to strike!</span>`);
                await sleep(800);
                continue; 
            }
        }

        let aliveEnemies = window.combatState.enemies.filter(e => e.hp > 0);
        if (aliveEnemies.length === 0) break; 

        if (act.action === 'CAST_SUMMON') {
            char.visualEffect = 'glow-magic';
            updateCombatUI();
            await sleep(300);
            char.visualEffect = null;
            window.castSummonSpell(act.spellId, act.charIndex, act.invIdx, 'combat_resolve');
            await sleep(400);
            continue;
        }

        // 🌟 NEW: CONSUMABLE USAGE RESOLUTION
        if (act.action === 'USE_ITEM') {
            let invObj = sharedInventory[act.invIdx];
            if (!invObj) {
                logMsg(`<span style="color:#888;">${char.name} reaches for an item, but it's gone!</span>`);
                await sleep(800);
                continue;
            }

            let itemId = typeof invObj === 'string' ? invObj : invObj.id;
            let itemData = itemDB[itemId];

            char.visualEffect = 'glow-heal';
            updateCombatUI();
            await sleep(300);
            char.visualEffect = null;

            let verb = 'uses';
            if (itemId.startsWith('food_')) verb = 'eats';
            else if (itemId.startsWith('drink_') || itemId.startsWith('potion_')) verb = 'drinks';

            let target = char; 
            let msg = `${char.name} ${verb} the ${itemData.name}.`;

            // Auto-Target resolution (Same logic as Exploration Mode)
            if (itemData.resurrect) {
                target = party.find(p => p.name !== "Empty" && p.hp <= 0);
                if (target) {
                    target.hp = itemData.hpHeal >= 9999 ? target.maxHp : itemData.hpHeal;
                    target.ailments.length = 0;
                    msg = `${char.name} uses ${itemData.name} on ${target.name}, bringing them back to life!`;
                } else {
                    msg = `${char.name} tries to use ${itemData.name}, but everyone is alive!`;
                }
            } else {
                if (itemData.hpHeal && target.hp === target.maxHp) {
                    target = party.filter(p => p.name !== "Empty" && p.hp > 0).sort((a,b) => (a.hp/a.maxHp) - (b.hp/b.maxHp))[0] || char;
                }
                if ((itemData.cures || itemData.curesAll) && target.ailments.length === 0) {
                    target = party.find(p => p.name !== "Empty" && p.hp > 0 && p.ailments.length > 0) || char;
                }

                if (target !== char) {
                    msg = `${char.name} gives the ${itemData.name} to ${target.name}.`;
                }

                if (itemData.hpHeal && target.hp > 0) target.hp = Math.min(target.maxHp, target.hp + itemData.hpHeal);
                if (itemData.mpHeal && target.hp > 0 && target.class !== 'Bard') target.mp = Math.min(target.maxMp, target.mp + itemData.mpHeal);
                if (itemData.songHeal && target.hp > 0 && target.class === 'Bard') target.mp = Math.min(target.maxMp, target.mp + itemData.songHeal);

                if (itemData.curesAll && target.hp > 0) { 
                    target.ailments.length = 0;
                    msg += ` They are completely purified!`; 
                }
                else if (itemData.cures && target.hp > 0) {
                    target.ailments = target.ailments.filter(a => !itemData.cures.includes(a));
                    msg += ` They feel cleansed.`; 
                }
            }

            logMsg(`<span style="color:#00aa00;">${msg}</span>`);

            if (typeof invObj === 'object') {
                invObj.qty -= 1;
                if (invObj.qty <= 0) sharedInventory[act.invIdx] = null;
            } else {
                sharedInventory[act.invIdx] = null;
            }

            target.visualEffect = 'glow-heal';
            updateCombatUI();
            await sleep(400);
            target.visualEffect = null;
            updateCombatUI();
            continue;
        }

        if (act.action === 'AUTONOMOUS') {
            let eData = char.enemyData;
            if (!eData) { await sleep(100); continue; }

            let myRank = act.charIndex < 4 ? 1 : 2;
            let attackType = 'NONE';

            aliveEnemies.sort((a,b) => a.distance - b.distance);
            let closestDist = aliveEnemies[0].distance + (myRank - 1);

            if (eData.canMelee && closestDist <= 1) { attackType = 'MELEE'; }
            else if (eData.canRanged && closestDist <= eData.rangedRange) { attackType = 'RANGED'; }
            else if (eData.canMagic && char.mp > 0 && closestDist <= eData.magicRange) { attackType = 'MAGIC'; }

            if (attackType === 'NONE') {
                logMsg(`<span style="color:#888;">${char.name} snarls, but its prey is out of range!</span>`);
                await sleep(800); continue;
            }

            char.visualEffect = attackType === 'MELEE' ? 'glow-melee' : (attackType === 'RANGED' ? 'glow-ranged' : 'glow-magic');
            updateCombatUI();
            await sleep(300);
            char.visualEffect = null;

            let validTargets = aliveEnemies.filter(e => {
                let dist = e.distance + (myRank - 1);
                if (attackType === 'MELEE') return dist <= 1;
                if (attackType === 'RANGED') return dist <= eData.rangedRange;
                if (attackType === 'MAGIC') return dist <= eData.magicRange;
                return false;
            });

            let target = validTargets.length > 0 ? validTargets[Math.floor(Math.random() * validTargets.length)] : aliveEnemies[0];

            let rawDmg = 0; let attackName = "";		
            if (attackType === 'MELEE') { rawDmg = Math.floor(Math.random() * (eData.meleeDmgMax - eData.meleeDmgMin + 1)) + eData.meleeDmgMin; attackName = eData.meleeEffect; }
            else if (attackType === 'RANGED') { rawDmg = Math.floor(Math.random() * (eData.rangedDmgMax - eData.rangedDmgMin + 1)) + eData.rangedDmgMin; attackName = eData.rangedEffect; }
            else if (attackType === 'MAGIC') { 
                char.mp -= Math.max(10, eData.level * 2);
                rawDmg = Math.floor(Math.random() * (eData.magicDmgMax - eData.magicDmgMin + 1)) + eData.magicDmgMin; attackName = eData.magicEffect; 
            }

            let targetName = target.customName || target.data.name;
            logMsg(`<span style="color:#0044aa;">${char.name} uses ${attackName} on the ${targetName}!</span>`);

            let tAC = Math.abs(target.data.ac || 0);
            let finalDmg = Math.max(0, rawDmg - tAC);

            if (finalDmg <= 0) { 
                logMsg(`<span style="color:#888;">The ${targetName}'s hide absorbed the blow!</span>`); 
                window.playSfx('melee_parry.ogg');
                target.visualEffect = 'glow-absorb';
            } else {
                target.hp -= finalDmg;
                logMsg(`<span class="log-damage">The ${targetName} takes ${finalDmg} damage!</span>`);
                window.playSfx('melee_hit_flesh.ogg');
                target.visualEffect = 'glow-hit';
                if (target.hp <= 0) logMsg(`<span style="color:#8b6508;">The ${targetName} is slain by ${char.name}!</span>`);
            }

            if (target.hp > 0 && Math.random() < 0.25) {
                let newAilment = getAilmentFromAttack(attackName);
                if (newAilment) {
                    if (!target.ailments) target.ailments = new Array(); 
                    if (!target.ailments.includes(newAilment)) {
                        target.ailments.push(newAilment);
                        logMsg(`<span style="margin-left:15px; color:#aa44ff;">...the ${target.data.name} is afflicted with ${newAilment}!</span>`);				
                    }
                }
            }

            updateCombatUI();
            await sleep(400);
            target.visualEffect = null;
            updateCombatUI();

            if (window.combatState.enemies.every(e => e.hp <= 0)) { await sleep(200); winCombat(); return; }
            await sleep(200);
            continue;
        }

        if (act.action === 'DEFEND') { 
            logMsg(`${char.name} assumes a defensive stance.`); 
            await sleep(800); 
            continue; 
        }

        let targetEnemy = aliveEnemies.find(e => e.id === act.targetId);
        if (!targetEnemy) {
            aliveEnemies.sort((a, b) => a.distance - b.distance);
            targetEnemy = aliveEnemies[0];
            logMsg(`<span style="color:#888;">${char.name}'s target is down! Aiming at the closest enemy!</span>`);
        }

        let distToEnemy = targetEnemy.distance + (act.charIndex < 4 ? 0 : 1);
        let targetName = targetEnemy.customName || targetEnemy.data.name;

        if (act.action === 'ATTACK') {
            if (char.ailments.includes('Blindness') && Math.random() < 0.5) {
                logMsg(`<span style="color:#888; font-weight:bold;">${char.name} is Blinded and swings wildly, missing the target completely!</span>`);
                window.playSfx('melee_miss.ogg');
                let isRanged = char.equipped.Weapon && itemDB[char.equipped.Weapon] && itemDB[char.equipped.Weapon].requiresAmmo;
                let ammo = isRanged ? char.equipped.Ammo : null;
                if (isRanged && ammo) { ammo.qty -= 1; if (ammo.qty <= 0) char.equipped.Ammo = null; }
                updateCombatUI(); await sleep(800); continue; 
            }

            let weapId = char.equipped.Weapon; let weaponData = weapId ? itemDB[weapId] : null;
            let weaponRange = weaponData && weaponData.maxRange ? weaponData.maxRange : 1;

            if (distToEnemy > weaponRange) {
                logMsg(`<span style="color:#888;">${char.name} looks for a target, but the ${targetName} is out of range!</span>`);
                await sleep(800); continue; 
            }

            let minDmg = 1, maxDmg = 4, dmgMult = 1.0;
            if (weaponData) { minDmg = weaponData.minDmg || 1; maxDmg = weaponData.maxDmg || 4; }
            let isRanged = weaponData && weaponData.requiresAmmo;
            let ammo = isRanged ? char.equipped.Ammo : null;
            if (isRanged) {
                if (!ammo || ammo.qty <= 0) { logMsg(`<span style="color:#888;">${char.name} tries to fire, but is out of ammo!</span>`); await sleep(800); continue; }
                let aD = itemDB[ammo.id];
                if (!aD || aD.ammoType !== weaponData.requiresAmmo) { logMsg(`<span style="color:#888;">${char.name} has wrong ammo!</span>`); await sleep(800); continue; }
                dmgMult = aD.dmgMult || 1.0;
            }

            char.visualEffect = isRanged ? 'glow-ranged' : 'glow-melee';
            updateCombatUI();
            await sleep(300);
            char.visualEffect = null;

            let isProjectile = weaponData && weaponData.subType === 'ranged';
            let numAttacks = 1 + ( (['Warrior', 'Paladin', 'Rogue', 'Bard'].includes(char.class) && !isProjectile) ? Math.floor(char.level / 7) : 0 );
            if (isRanged && ammo) numAttacks = Math.min(numAttacks, ammo.qty);

            let statBonus = isRanged ? Math.floor(getStat(char, 'DEX') / 3) : Math.floor(getStat(char, 'STR') / 3);
            let lvlBonus = Math.floor(char.level / 2);

            let totalDmgThisTurn = 0, actualHits = 0, smiteTriggered = false, wokeEnemyUp = false; 

            for (let i = 0; i < numAttacks; i++) {
                if (targetEnemy.hp <= 0) break; 
                let rawDmg = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;
                let diseaseMult = char.ailments.includes('Disease') ? 0.9 : 1.0;
                let bDmgMult = (char.combatBuffs && char.combatBuffs.some(b => b.type === 'inspiration')) ? 1.25 : 1.0;
                let dmg = Math.floor((rawDmg + statBonus + lvlBonus) * dmgMult * diseaseMult * bDmgMult * (1 + (char.level / 15)));
                let finalDmg = Math.max(0, dmg - Math.abs(targetEnemy.data.ac));
                let isUndead = targetEnemy.data.category === 'undead';
                let smiteMult = 1.0;
                if (isUndead && char.class === 'Paladin') smiteMult += 0.5;
                if (isUndead && char.combatBuffs && char.combatBuffs.some(b => b.type === 'undeadDmg')) smiteMult += 0.5;
                if (smiteMult > 1.0) { finalDmg = Math.floor(finalDmg * smiteMult); smiteTriggered = true; }

                if (finalDmg > 0) {
                    targetEnemy.hp -= finalDmg; totalDmgThisTurn += finalDmg; actualHits++;
                }

                if (targetEnemy.ailments && targetEnemy.ailments.includes('Sleep')) { targetEnemy.ailments = targetEnemy.ailments.filter(a => a !== 'Sleep'); wokeEnemyUp = true; }
                if (isRanged && ammo) { ammo.qty -= 1; if (ammo.qty <= 0) char.equipped.Ammo = null; }
            }

            let totalAC = Math.abs(targetEnemy.data.ac || 0);

            if (actualHits === 0) {
                targetEnemy.visualEffect = 'glow-absorb';
                window.playSfx('melee_miss.ogg');
            } else {
                targetEnemy.visualEffect = 'glow-hit';
                // Pick hit sound based on AC
                let hitSound = (totalAC > 2) ? 'melee_hit_armor.ogg' : 'melee_hit_flesh.ogg';
                window.playSfx(hitSound);
            }
            updateCombatUI();

            if (totalDmgThisTurn === 0) {
                let hitText = actualHits > 1 ? `strikes ${actualHits} times` : `strikes`;
                logMsg(`${char.name} ${hitText} the ${targetName}, but armor absorbs it!`);
            } else {
                let hitText = actualHits > 1 ? `hits ${actualHits} times` : `hits`;
                let smiteText = smiteTriggered ? ` <span style="color:#a38300; font-weight:bold;">(Holy Smite!)</span>` : ``;
                logMsg(`${char.name} ${hitText} the ${targetName} for a total of <span class="log-damage">${totalDmgThisTurn} dmg!</span>${smiteText}`);
            }
            if (wokeEnemyUp) logMsg(`<span style="color:#4488ff; font-weight:bold;">The blow wakes the ${targetName} up!</span>`);

            await sleep(400);
            targetEnemy.visualEffect = null;
            updateCombatUI();

            if (targetEnemy.hp <= 0) {
                logMsg(`<span style="color:#8b6508;">The ${targetName} falls!</span>`);
				window.cleanPartyRoster();
                if (window.combatState.enemies.every(e => e.hp <= 0)) { await sleep(200); winCombat(); return; }
            }
            await sleep(200);

		} else if (act.action === 'CAST') {
            let spell = spellDB[act.spellId];
            if (window.isAntiMagic(player.x, player.y) && spell.magical) {
				logMsg(`<span style="color:#aa44ff; font-weight:bold;">${char.name} attempts to cast, but the Anti-Magic field suppresses the spell!</span>`);
				continue; 
			}
            if (char.mp < spell.mpCost) { logMsg(`<span style="color:#888;">${char.name} lacks the mana!</span>`); continue; }

            char.mp -= spell.mpCost; 

            char.visualEffect = (char.class === 'Bard') ? 'glow-song' : 'glow-magic';
            updateCombatUI();
            await sleep(300);
            char.visualEffect = null;

            let magicStat = ['Healer', 'Paladin'].includes(char.class) ? getStat(char, 'WIS') : (char.class === 'Bard' ? getStat(char, 'CHA') : getStat(char, 'INT'));
            let eqBoosts = window.getEquipBoosts(char);
            let isOffensive = spell.type === 'damage' || spell.type === 'siphon_hp' || spell.type === 'siphon_mp';
            let isHealing = spell.type === 'heal' || spell.type === 'party_heal';
            let totalGearBoost = 1.0 + eqBoosts.magic;
            if (isOffensive) totalGearBoost += eqBoosts.off;
            if (isHealing) totalGearBoost += eqBoosts.heal;

            let statBonusFactor = Math.max(0, magicStat - 10) * 0.05; 
            let levelScaling = 1 + (char.level / 20);
            let spellMult = window.calculateSpellMult(char, spell);
            let spellBonus = Math.max(0, magicStat - 17) + Math.floor(char.level / 2);

            let instBonus = 0;
            if (char.class === 'Bard') {
                Array.of('Weapon', 'Offhand').forEach(slot => {
                    let itemId = char.equipped[slot];
                    let id = (itemId && typeof itemId === 'object') ? itemId.id : itemId;
                    if (id && itemDB[id] && itemDB[id].subType === 'instrument' && itemDB[id].duration !== undefined) {
                        instBonus = itemDB[id].duration;
                    }
                });
            }
            let finalDuration = spell.duration !== undefined ? spell.duration + instBonus : 0;
            let isBuff = (spell.type === 'buff' || spell.type === 'party_buff');

            if (char.class === 'Bard' && isBuff) {
                window.stopBardSongs(act.charIndex);
            }

            let audioKey = (spell.classReq === 'Bard') ? `b_song_${act.charIndex}` : act.spellId;
            window.playSpellAudio(act.spellId, isBuff && finalDuration > 0, act.charIndex);

            let casterRank = act.charIndex < 4 ? 1 : 2;

            if (spell.type === 'damage') {
                if (distToEnemy > spell.maxRange) { logMsg(`<span style="color:#888;">${targetEnemy.data.name} is out of range!</span>`); continue; }

				let rawMin = Math.floor(spell.minDmg * spellMult) + spellBonus;
				let rawMax = Math.floor(spell.maxDmg * spellMult) + spellBonus;

                if (spell.target === 'all_enemies') {
                    logMsg(`<span style="color:#0044aa; font-weight:bold;">${char.name} casts ${spell.name}!</span>`);
                    for (let e of aliveEnemies) {
                        let distToTarget = e.distance + (casterRank - 1);
                        if (spell.maxRange && distToTarget > spell.maxRange) continue;

                        await sleep(200); 
                        let isImmune = spell.element && e.data.immunities && e.data.immunities.includes(spell.element);
                        if (isImmune) {
                            e.visualEffect = 'glow-absorb';
                            logMsg(`<span style="margin-left:15px; color:#888;">...the ${e.data.name} is immune to ${spell.element}!</span>`);
                        } else {
                            let dmg = Math.floor(Math.random() * (rawMax - rawMin + 1)) + rawMin;
                            e.hp -= Math.max(0, dmg);
                            e.visualEffect = 'glow-hit';
                            logMsg(`<span style="margin-left:15px; color:#0044aa;">...hits ${e.data.name} for ${dmg} dmg!</span>`);
                        }
                        updateCombatUI(); 
                    }
                    await sleep(300);
                    aliveEnemies.forEach(e => e.visualEffect = null);
                    updateCombatUI();
                } else {
                    let isImmune = spell.element && targetEnemy.data.immunities && targetEnemy.data.immunities.includes(spell.element);
                    if (isImmune) {
                        targetEnemy.visualEffect = 'glow-absorb';
                        logMsg(`<span style="color:#888;">${char.name} casts ${spell.name}, but the ${targetEnemy.data.name} is immune!</span>`);
                    } else {
                        let dmg = Math.floor(Math.random() * (rawMax - rawMin + 1)) + rawMin;
                        targetEnemy.hp -= Math.max(0, dmg);
                        targetEnemy.visualEffect = 'glow-hit';
                        logMsg(`<span style="color:#0044aa;">${char.name} casts ${spell.name} on the ${targetEnemy.data.name} for ${dmg} damage!</span>`);
                    }
                    updateCombatUI();
                    await sleep(400);
                    targetEnemy.visualEffect = null;
                    updateCombatUI();
                }
            } 
            else if (spell.type === 'siphon_hp' || spell.type === 'siphon_mp') {
                let rawMin = Math.floor(spell.minDmg * spellMult) + spellBonus;
                let rawMax = Math.floor(spell.maxDmg * spellMult) + spellBonus;

                if (spell.target === 'all_enemies') {
                    logMsg(`<span style="color:#aa00aa; font-weight:bold;">${char.name} siphons from the horde!</span>`);
                    let totalDrained = 0;
                    for (let e of aliveEnemies) {
                        let distToTarget = e.distance + (casterRank - 1);
                        if (spell.maxRange && distToTarget > spell.maxRange) continue;

                        await sleep(200);
                        let isImmune = spell.element && e.data.immunities && e.data.immunities.includes(spell.element);
                        if (isImmune) {
                            e.visualEffect = 'glow-absorb';
                            logMsg(`<span style="margin-left:15px; color:#888;">...the ${e.data.name} is immune!</span>`);
                            updateCombatUI();
                            continue;
                        }

                        e.visualEffect = 'glow-hit';
                        let drainAmount = Math.floor(Math.random() * (rawMax - rawMin + 1)) + rawMin;

                        if (spell.type === 'siphon_mp') {
                            let actualDrain = Math.min(drainAmount, e.mp);
                            e.mp -= actualDrain;
                            totalDrained += actualDrain;
                            logMsg(`<span style="margin-left:15px; color:#aa00aa;">...drains ${actualDrain} SP from ${e.data.name}!</span>`);
                        } else {
                            e.hp -= Math.max(0, drainAmount);
                            totalDrained += drainAmount;
                            logMsg(`<span style="margin-left:15px; color:#aa00aa;">...drains ${drainAmount} HP from ${e.data.name}!</span>`);
                        }
                        updateCombatUI();
                    }
                    await sleep(300);
                    aliveEnemies.forEach(e => e.visualEffect = null);

                    if (spell.type === 'siphon_mp') {
                        let remaining = totalDrained;
                        let recipients = [];

                        if (char.mp < char.maxMp && char.class !== 'Bard') {
                            let take = Math.min(remaining, char.maxMp - char.mp);
                            char.mp += take;
                            remaining -= take;
                            recipients.push(char.name);
                        }
                        if (remaining > 0) {
                            let lowestSPAlly = party.filter(p => p.name !== "Empty" && p.hp > 0 && p.maxMp > 0 && p.class !== 'Bard').sort((a,b) => (a.mp/a.maxMp) - (b.mp/b.maxMp))[0];
                            if (lowestSPAlly) {
                                let take = Math.min(remaining, lowestSPAlly.maxMp - lowestSPAlly.mp);
                                lowestSPAlly.mp += take;
                                remaining -= take;
                                recipients.push(lowestSPAlly.name);
                            }
                        }
                        logMsg(`<span style="color:#aa00aa; font-style:italic;">...${totalDrained} SP distributed to ${recipients.join(' and ')}!</span>`);
                    } else {
                        let lowestAlly = party.filter(p => p.name !== "Empty" && p.hp > 0).sort((a,b) => (a.hp/a.maxHp) - (b.hp/b.maxHp))[0];
                        if (lowestAlly) lowestAlly.hp = Math.min(lowestAlly.maxHp, lowestAlly.hp + totalDrained);
                    }
                    updateCombatUI();
                } else {
                    if (distToEnemy > spell.maxRange) { logMsg(`<span style="color:#888;">${targetEnemy.data.name} is out of range!</span>`); continue; }
                    let isImmune = spell.element && targetEnemy.data.immunities && targetEnemy.data.immunities.includes(spell.element);

                    if (spell.type === 'siphon_mp') {
                        if (isImmune) {
                            targetEnemy.visualEffect = 'glow-absorb';
                            logMsg(`<span style="color:#888;">${char.name} tries to siphon SP, but the ${targetEnemy.data.name} is immune!</span>`);
                        } else if (targetEnemy.maxMp <= 0) {
                            targetEnemy.visualEffect = 'glow-absorb';
                            logMsg(`<span style="color:#888;">${char.name} tries to siphon SP, but the ${targetEnemy.data.name} has no magical essence!</span>`);
                        } else if (targetEnemy.mp <= 0) {
                            targetEnemy.visualEffect = 'glow-absorb';
                            logMsg(`<span style="color:#888;">${char.name} tries to siphon SP, but the ${targetEnemy.data.name}'s magic is completely depleted!</span>`);
                        } else {
                            targetEnemy.visualEffect = 'glow-hit';
                            let drainAmount = Math.floor(Math.random() * (rawMax - rawMin + 1)) + rawMin;
                            let actualDrain = Math.min(drainAmount, targetEnemy.mp);
                            targetEnemy.mp -= actualDrain;

                            let remaining = actualDrain;
                            let recipients = [];
                            if (char.mp < char.maxMp && char.class !== 'Bard') {
                                let take = Math.min(remaining, char.maxMp - char.mp);
                                char.mp += take;
                                remaining -= take;
                                recipients.push(char.name);
                            }
                            if (remaining > 0) {
                                let lowestSPAlly = party.filter(p => p.name !== "Empty" && p.hp > 0 && p.maxMp > 0 && p.class !== 'Bard').sort((a,b) => (a.mp/a.maxMp) - (b.mp/b.maxMp))[0];
                                if (lowestSPAlly) {
                                    let take = Math.min(remaining, lowestSPAlly.maxMp - lowestSPAlly.mp);
                                    lowestSPAlly.mp += take;
                                    remaining -= take;
                                    recipients.push(lowestSPAlly.name);
                                }
                            }
                            logMsg(`<span style="color:#aa00aa;">${char.name} siphons ${actualDrain} SP from the ${targetEnemy.data.name} and gives it to ${recipients.join(' and ')}!</span>`);
                        }
                    } 
                    else if (spell.type === 'siphon_hp') {
                        if (isImmune) {
                            targetEnemy.visualEffect = 'glow-absorb';
                            logMsg(`<span style="color:#888;">${char.name} tries to siphon HP from the ${targetEnemy.data.name}, but it is immune!</span>`);
                        } else {
                            targetEnemy.visualEffect = 'glow-hit';
                            let dmg = Math.floor(Math.random() * (rawMax - rawMin + 1)) + rawMin;
                            targetEnemy.hp -= Math.max(0, dmg);
                            let lowestAlly = party.filter(p => p.name !== "Empty" && p.hp > 0).sort((a,b) => (a.hp/a.maxHp) - (b.hp/b.maxHp))[0];
                            if (lowestAlly) lowestAlly.hp = Math.min(lowestAlly.maxHp, lowestAlly.hp + dmg);
                            logMsg(`<span style="color:#aa00aa;">${char.name} siphons ${dmg} HP from the ${targetEnemy.data.name} and heals ${lowestAlly.name}!</span>`);
                        }
                    }
                    updateCombatUI();
                    await sleep(400);
                    targetEnemy.visualEffect = null;
                    updateCombatUI();
                }
            }
            else if (spell.type === 'heal' || spell.type === 'party_heal') {
                let healAmount = Math.floor(spell.healAmount * spellMult); 
                if (spell.target === 'party') {
                    party.forEach(p => { 
                        if (p.name !== "Empty" && p.hp > 0) { 
                            p.hp = Math.min(p.maxHp, p.hp + healAmount);
                            p.visualEffect = 'glow-heal';
                        }
                    });
                    logMsg(`<span style="color:#00aa00;">${char.name} casts ${spell.name}, healing the party!</span>`);
                } else {
                    let targetAlly = party[act.targetAllyIndex];
                    if (!targetAlly || targetAlly.hp <= 0) {
                        targetAlly = party.filter(p => p.name !== "Empty" && p.hp > 0).sort((a,b) => (a.hp/a.maxHp) - (b.hp/b.maxHp))[0];
                    }
                    if (targetAlly) {
                        let actualHeal = Math.min(healAmount, targetAlly.maxHp - targetAlly.hp);
                        targetAlly.hp += actualHeal;
                        targetAlly.visualEffect = 'glow-heal';
                        if (actualHeal > 0) {
                            logMsg(`<span style="color:#00aa00;">${char.name} casts ${spell.name}, healing ${targetAlly.name} for ${actualHeal} HP!</span>`);
                        } else {
                            logMsg(`<span style="color:#00aa00;">${char.name} casts ${spell.name} on ${targetAlly.name}, but they are already fully healed!</span>`);
                        }
                    }
                }
                updateCombatUI();
                await sleep(400);
                party.forEach(p => p.visualEffect = null);
                updateCombatUI();
            }
            else if (spell.type === 'cure') {
                let targetAlly = party[act.targetAllyIndex];
                if (targetAlly && targetAlly.hp > 0) {
                    targetAlly.ailments = targetAlly.ailments.filter(a => !spell.cures.includes(a));
                    targetAlly.visualEffect = 'glow-heal';
                    logMsg(`<span style="color:#00aa00;">${char.name} casts ${spell.name}, purifying ${targetAlly.name}!</span>`);
                    updateCombatUI();
                    await sleep(400);
                    targetAlly.visualEffect = null;
                    updateCombatUI();
                }
            }
            else if (spell.type === 'cure_all') {
                if (spell.target === 'party') {
                    party.forEach(p => { 
                        if (p.name !== "Empty" && p.hp > 0) {
                            p.ailments =[]; 
                            p.visualEffect = 'glow-heal';
                        }
                    });
                    logMsg(`<span style="color:#00aa00;">${char.name} casts ${spell.name}, purifying the entire party!</span>`);
                    updateCombatUI();
                    await sleep(400);
                    party.forEach(p => p.visualEffect = null);
                    updateCombatUI();
                } else {
                    let targetAlly = party[act.targetAllyIndex];
                    if (targetAlly && targetAlly.hp > 0) {
                        targetAlly.ailments =[];
                        targetAlly.visualEffect = 'glow-heal';
                        logMsg(`<span style="color:#00aa00;">${char.name} casts ${spell.name}, purifying ${targetAlly.name}!</span>`);
                        updateCombatUI();
                        await sleep(400);
                        targetAlly.visualEffect = null;
                        updateCombatUI();
                    }
                }
            }
            else if (spell.type === 'cure_one') {
                let targetAlly = party[act.targetAllyIndex];
                if (targetAlly && targetAlly.hp > 0) {
                    if (targetAlly.ailments.length > 0) {
                        let curedAilment = targetAlly.ailments.shift(); 
                        targetAlly.visualEffect = 'glow-heal';
                        logMsg(`<span style="color:#00aa00;">${char.name} casts ${spell.name}, cleansing ${curedAilment} from ${targetAlly.name}!</span>`);
                    } else {
                        targetAlly.visualEffect = 'glow-buff';
                        logMsg(`<span style="color:#00aa00;">${char.name} casts ${spell.name} on ${targetAlly.name}, but they are already pure!</span>`);
                    }
                    updateCombatUI();
                    await sleep(400);
                    targetAlly.visualEffect = null;
                    updateCombatUI();
                }
            }
            else if (spell.type === 'revive') {
                let targetAlly = party[act.targetAllyIndex];
                if (targetAlly && targetAlly.hp <= 0) {
                    let healAmount = spell.healAmount >= 9999 ? targetAlly.maxHp : spell.healAmount;
                    targetAlly.hp = healAmount;
                    targetAlly.ailments = [];
                    targetAlly.visualEffect = 'glow-heal';
					logMsg(`<span style="color:#00aa00;">${char.name} casts ${spell.name}, resurrecting ${targetAlly.name}!</span>`);
                    updateCombatUI();
                    await sleep(400);
                    targetAlly.visualEffect = null;
                    updateCombatUI();
                }
            }
            else if (spell.type === 'inflict_ailment') {
                logMsg(`<span style="color:#aa44ff; font-weight:bold;">${char.name} performs ${spell.name}!</span>`);
                for (let e of aliveEnemies) {
                    let distToTarget = e.distance + (casterRank - 1);
                    if (spell.maxRange && distToTarget > spell.maxRange) continue;

                    await sleep(200);                    
                    let baseChance = 0.25;
                    if (Math.random() < baseChance + (spellBonus * 0.05)) {
                        if (!e.ailments) e.ailments = new Array();
                        let isImmune = false;
                        if (spell.ailment === 'Madness' && e.data.immunities && (e.data.immunities.includes('void') || e.data.immunities.includes('arcane'))) isImmune = true;
                        if (spell.ailment === 'Sleep' && e.data.immunities && e.data.immunities.includes('dark')) isImmune = true;

                        if (isImmune) {
                            e.visualEffect = 'glow-absorb';
                            logMsg(`<span style="margin-left:15px; color:#888;">...the ${e.data.name} is immune!</span>`);
                        } else if (!e.ailments.includes(spell.ailment)) {
                            e.ailments.push(spell.ailment);
                            e.visualEffect = 'glow-debuff';
                            logMsg(`<span style="margin-left:15px; color:#aa44ff;">...the ${e.data.name} is afflicted with ${spell.ailment}!</span>`);				
                        } else {
                            e.visualEffect = 'glow-absorb';
                        }
                    } else {
                        e.visualEffect = 'glow-absorb';
                        logMsg(`<span style="margin-left:15px; color:#888;">...the ${e.data.name} resisted it!</span>`);
                    }
                    updateCombatUI();
                }
                await sleep(300);
                aliveEnemies.forEach(e => e.visualEffect = null);
                updateCombatUI();
            }
            else if (spell.type === 'party_revive') {
                let healAmount = Math.floor(spell.healAmount * spellMult);
                party.forEach(p => {
                    if (p.name !== "Empty") {
                        if (p.hp <= 0) {
                            p.hp = healAmount;
                            p.ailments.length = 0;
                            p.visualEffect = 'glow-heal';
                            logMsg(`<span style="color:#00aa00;">${char.name}'s song revives ${p.name}!</span>`);
                        } else if (p.hp < p.maxHp) {
                            p.hp = Math.min(p.maxHp, p.hp + healAmount);
                            p.visualEffect = 'glow-heal';
                        }
                    }
                });
                logMsg(`<span style="color:#00aa00;">${char.name} performs ${spell.name}, inspiring the party!</span>`);
                updateCombatUI();
                await sleep(400);
                party.forEach(p => p.visualEffect = null);
                updateCombatUI();
            }
			else if (spell.type === 'buff' || spell.type === 'party_buff') {
				let isSong = (char.class === 'Bard');

				let buffPayload = { 
					type: spell.buffType, 
					duration: finalDuration,
					name: spell.name,
					icon: `spell_${act.spellId}.webp`,
					id: act.spellId,
					isSong: isSong,
					casterIndex: act.charIndex
				};
                if (spell.target === 'party') {
                    party.forEach(p => { 
                        if (p.name !== "Empty" && p.hp > 0) {
                            p.combatBuffs = p.combatBuffs || new Array();
                            let existing = p.combatBuffs.find(b => b.type === spell.buffType);
                            if (existing) {
                                existing.duration = Math.max(existing.duration, finalDuration);
                            } else {
                                p.combatBuffs.push({ ...buffPayload, newRound: true }); 
                            }
                            p.visualEffect = 'glow-buff';
                        }
                    });
                    logMsg(`<span style="color:#00aa00;">${char.name} performs ${spell.name}, inspiring the entire party!</span>`);
                } else {
                    let targetAlly = party[act.targetAllyIndex];
                    if (targetAlly && targetAlly.hp > 0) {
                        targetAlly.combatBuffs = targetAlly.combatBuffs || new Array();
                        let existing = targetAlly.combatBuffs.find(b => b.type === spell.buffType);
                        if (existing) {
                            existing.duration = Math.max(existing.duration, finalDuration);
                        } else {
                            targetAlly.combatBuffs.push({ ...buffPayload, newRound: true }); 
                        }
                        targetAlly.visualEffect = 'glow-buff';
                        if (spell.buffType === 'taunt') {
                            logMsg(`<span style="color:#00aa00;">${char.name} performs ${spell.name}, drawing the ire of all enemies!</span>`);
                        } else {
                            logMsg(`<span style="color:#00aa00;">${char.name} casts ${spell.name}, inspiring ${targetAlly.name}!</span>`);
                        }
                    }
                }
                updateEffectsUI();
                updateCombatUI();
                await sleep(400);
                party.forEach(p => p.visualEffect = null);
                updateCombatUI();
            }
            if (aliveEnemies.every(e => e.hp <= 0)) { await sleep(200); winCombat(); return; }
        } else if (act.action === 'DEFEND') { 
            logMsg(`${char.name} assumes a defensive stance.`); 
            await sleep(800); 
            continue; 
        }
    }


    logMsg("--- End of Round Resolution ---");
	for (let p of party) {
		if (p.name !== "Empty" && p.hp > 0) {
			if (p.ailments.includes('Poison')) {
				let dmg = Math.max(1, Math.floor(p.maxHp * 0.05));
				p.hp = Math.max(0, Math.floor(p.hp) - dmg); 
				logMsg(`<span style="color:#00aa00;">${p.name} suffers ${dmg} poison damage!</span>`);
			}
			if (p.ailments.includes('Disease')) {
				let dmg = Math.max(1, Math.floor(p.maxHp * 0.02));
				p.hp = Math.max(0, p.hp - dmg);
				logMsg(`<span style="color:#8b6508;">${p.name} suffers ${dmg} disease damage!</span>`);
			}
			if (p.hp <= 0) {
				logMsg(`<span style="color:#aa0000; font-weight:bold;">${p.name} has succumbed to their afflictions!</span>`);
			}
		}
	}
	window.cleanPartyRoster(); 
	updateCombatUI();

	if (window.checkPartyDefeat()) return;

	await enemyTurn();

    if (window.combatState.enemies.every(e => e.hp <= 0)) { await sleep(200); winCombat(); return; }

    if (window.checkPartyDefeat()) return;

    let hasPermSong = party.some(p => p.hp > 0 && (p.equipped.Ring1 === 'ring_bard' || p.equipped.Ring2 === 'ring_bard'));
    let expiredBuffs =[]; 

    party.forEach(p => {
        if (p.combatBuffs) {
            p.combatBuffs.forEach(b => {
                if (b.newRound) {
                    b.newRound = false; 
                } else {
                    if (!(b.isSong && hasPermSong)) {
                        b.duration--;
                    }
                    if (b.duration <= 0) {
                        expiredBuffs.push(b.id);
                    }
                }
            });
            p.combatBuffs = p.combatBuffs.filter(b => b.duration > 0);
        }
    });

    expiredBuffs.forEach(spellId => {
        let isSong = spellId.startsWith('b_');
        let audioKey = isSong ? `b_song_${party.findIndex(p => p.combatBuffs && p.combatBuffs.some(b => b.id === spellId))}` : spellId;

        let foundKey = Object.keys(window.activeSpellAudios).find(k => k === audioKey || k === spellId);

        if (foundKey && window.activeSpellAudios[foundKey]) {
            window.fadeOutAudio(window.activeSpellAudios[foundKey], true);
            delete window.activeSpellAudios[foundKey];
            if (foundKey.startsWith('b_')) window.resumeMapBgm();
        }
    });

    expiredBuffs.length = 0; 		
    updateEffectsUI();
	window.runPassiveRegen();

    if (window.gameState === 'COMBAT') startCombatRound();
}

window.showGameOver = function() {
    document.getElementById('game-over-screen').style.display = 'flex';
};

window.restartGame = function() {
    localStorage.clear();
    location.reload();
};

document.getElementById('btn-restart-game').addEventListener('click', () => {
    window.restartGame();
});

async function enemyTurn() {
    let aliveEnemies = window.combatState.enemies.filter(e => e.hp > 0);
    const isAntiMagic = window.isAntiMagic(player.x, player.y);

    for (let e of aliveEnemies) {
        if (window.gameState !== 'COMBAT') return;

        let eName = e.customName || e.data.name;
        let formattedName = e.customName ? eName : `${window.getArticle(e.data.name)} ${e.data.name}`;
        let formattedNameLower = e.customName ? eName : `${window.getArticle(e.data.name).toLowerCase()} ${e.data.name}`;

        if (!e.ailments) e.ailments = new Array();

        // 1. DOT Damage
        if (e.ailments.includes('Poison')) {
            let dmg = Math.max(1, Math.floor(e.maxHp * 0.05));
            e.hp = Math.max(0, e.hp - dmg);
            logMsg(`<span style="color:#00aa00;">${formattedName} suffers ${dmg} poison damage!</span>`);
        }
        if (e.ailments.includes('Disease')) {
            let dmg = Math.max(1, Math.floor(e.maxHp * 0.02));
            e.hp = Math.max(0, e.hp - dmg);
            logMsg(`<span style="color:#8b6508;">${formattedName} suffers ${dmg} disease damage!</span>`);
        }
        if (e.hp <= 0) {
            logMsg(`<span style="color:#8b6508; font-weight:bold;">${formattedName} succumbs to its afflictions!</span>`);
            updateCombatUI(); await sleep(400); continue;
        }

        // 2. Stuns/Incapacitation
        if (e.ailments.includes('Sleep') || e.ailments.includes('Paralysis') || e.ailments.includes('Frozen')) {
            logMsg(`<span style="color:#aa44ff; font-weight:bold;">${formattedName} is incapacitated and cannot act!</span>`);
            await sleep(800); continue;
        }

        // 3. Confusion
        if (e.ailments.includes('Confusion') && Math.random() < 0.5) {
            logMsg(`<span style="color:#aa44ff; font-weight:bold;">${formattedName} thrashes about in confusion and does nothing!</span>`);
            await sleep(800); continue;
        }

        // 4. Madness (Friendly Fire!)
        if (e.ailments.includes('Madness') && Math.random() < 0.5) {
            let validVictims = window.combatState.enemies.filter(v => v.hp > 0 && v.id !== e.id);
            if (validVictims.length > 0) {
                e.visualEffect = 'glow-debuff';
                updateCombatUI();
                await sleep(300);
                e.visualEffect = null;

                let victim = validVictims[Math.floor(Math.random() * validVictims.length)];
                let vName = victim.customName || victim.data.name;
                logMsg(`<span style="color:#aa44ff; font-weight:bold; font-size:1.1rem;">Madness consumes ${formattedNameLower}! It turns and attacks the ${vName}!</span>`);

                window.playSfx('melee_hit_armor.ogg');
                let rawDmg = Math.floor(Math.random() * (e.data.meleeDmgMax - e.data.meleeDmgMin + 1)) + e.data.meleeDmgMin;
                let finalDmg = Math.max(0, rawDmg - Math.abs(victim.data.ac));
                if (finalDmg <= 0) {
                    logMsg(`<span style="color:#00aa00;">The ${vName}'s hide absorbed the blow!</span>`);
                    window.playSfx('melee_parry.ogg');
                    victim.visualEffect = 'glow-absorb';
                }
                else {
                    victim.hp = Math.max(0, victim.hp - finalDmg);
                    logMsg(`<span class="log-damage">The ${vName} takes ${finalDmg} damage!</span>`);
                    window.playSfx('melee_hit_flesh.ogg');
                    victim.visualEffect = 'glow-hit';
                    if (victim.hp <= 0) logMsg(`<span style="color:#8b6508;">The ${vName} is killed by its maddened ally!</span>`);
                }
                updateCombatUI(); 
                await sleep(400); 
                victim.visualEffect = null;
                updateCombatUI();
                continue;
            }
        }

        let distFront = e.distance;
        let attackType = 'NONE', targetGroup = 'NONE';
        let canMagic = e.data.canMagic && !isAntiMagic;

        // Determine Attack Type
        if (e.data.canMelee && distFront <= 1) { attackType = 'MELEE'; targetGroup = 'FRONT'; }
        else if (e.data.canRanged && distFront <= e.data.rangedRange) { attackType = 'RANGED'; targetGroup = Math.random() > 0.5 ? 'FRONT' : 'BACK'; }
        else if (canMagic && e.mp > 0 && distFront <= e.data.magicRange) { attackType = 'MAGIC'; targetGroup = Math.random() > 0.5 ? 'FRONT' : 'BACK'; }

        // Movement Logic
        if (attackType === 'NONE') {
            if (e.data.canMelee && distFront > 1) {
                logMsg(`${formattedName} advances toward the party!`);
                e.distance = Math.max(1, e.distance - 1);
                updateCombatUI(); 
                await sleep(800);
                continue; 
            } else { 
                logMsg(`${formattedName} snarls from afar, out of range!`); 
                await sleep(800); 
                continue; 
            }
        }

        // Targeting Logic
        let validTargets = [];
        for(let i = 0; i < 6; i++) {
            if(party[i].hp > 0 && party[i].name !== "Empty") {
                if (targetGroup === 'FRONT' && i < 4) validTargets.push(party[i]);
                if (targetGroup === 'BACK' && i >= 4) validTargets.push(party[i]);
            }
        }
        if (validTargets.length === 0 && targetGroup === 'FRONT') {
            for(let i = 4; i < 6; i++) if(party[i].hp > 0 && party[i].name !== "Empty") validTargets.push(party[i]);
        }

        if (validTargets.length === 0) { logMsg("Your entire party has fallen..."); return; }

        let totalWeight = 0;
        let weightedTargets = validTargets.map(t => {
            let aggroBonus = window.getEquipBoosts(t).aggro || 0;
            let weight = Math.max(1, 10 + aggroBonus); 
            totalWeight += weight;
            return { char: t, weight: weight };
        });

        let randomRoll = Math.random() * totalWeight;
        let currentWeight = 0;
        let target = validTargets[0];

        for (let wt of weightedTargets) {
            currentWeight += wt.weight;
            if (randomRoll <= currentWeight) {
                target = wt.char;
                break;
            }
        }

        // 🌟 ATTACKER SFX
        if (attackType === 'MELEE') window.playSfx('melee_hit_armor.ogg');
        else if (attackType === 'RANGED') window.playSfx('ranged_fire.ogg');
        else if (attackType === 'MAGIC') window.playSfx('m_4.ogg');

        let rawDmg = 0; let attackName = "";		
        if (attackType === 'MELEE') { rawDmg = Math.floor(Math.random() * (e.data.meleeDmgMax - e.data.meleeDmgMin + 1)) + e.data.meleeDmgMin; attackName = e.data.meleeEffect; }
        else if (attackType === 'RANGED') { rawDmg = Math.floor(Math.random() * (e.data.rangedDmgMax - e.data.rangedDmgMin + 1)) + e.data.rangedDmgMin; attackName = e.data.rangedEffect; }
        else if (attackType === 'MAGIC') { 
            e.mp -= Math.max(10, e.data.level * 2);
            rawDmg = Math.floor(Math.random() * (e.data.magicDmgMax - e.data.magicDmgMin + 1)) + e.data.magicDmgMin; attackName = e.data.magicEffect; 
        }

        // 🌟 ATTACKER GLOW
        e.visualEffect = attackType === 'MELEE' ? 'glow-melee' : (attackType === 'RANGED' ? 'glow-ranged' : 'glow-magic');
        updateCombatUI();
        await sleep(300);
        e.visualEffect = null;

        let targetName = target.name;
        logMsg(`${formattedName} uses ${attackName} on ${targetName}!`);

        // Blindness Penalty
        if (e.ailments.includes('Blindness') && attackType !== 'MAGIC' && Math.random() < 0.5) {
            logMsg(`<span style="color:#888; font-weight:bold;">The blinded ${eName} attacks the darkness, missing completely!</span>`);
            window.playSfx('melee_miss.ogg');
            await sleep(600);
            continue;
        }

        let tLUK = getStat(target, 'LUK');
        if (target.combatBuffs && target.combatBuffs.some(b => b.type === 'haste')) tLUK += 50; 
        if (Math.random() * 100 < tLUK) { 
            logMsg(`<span style="color:#00aa00;">${targetName} dodged!</span>`); 
            window.playSfx('melee_miss.ogg');
            target.visualEffect = 'glow-dodge';
            updateCombatUI();
            await sleep(400); 
            target.visualEffect = null;
            updateCombatUI();
            continue; 
        }

        let totalAC = target.baseAc || 0;['Body', 'Helmet', 'Gloves', 'Boots', 'Offhand'].forEach(slot => {
            let itemId = target.equipped[slot];
            if (itemId && typeof itemDB !== 'undefined' && itemDB[itemId] && itemDB[itemId].ac) totalAC += itemDB[itemId].ac;
        });

        let tAC = Math.abs(totalAC); 
        let tDEX = getStat(target, 'DEX');
        if (target.isDefending) { tAC *= 2; tDEX = Math.min(50, tDEX * 2); }

        let postAcDmg = rawDmg - tAC;
        if (postAcDmg <= 0) { 
            logMsg(`<span style="color:#00aa00;">Armor absorbed the blow!</span>`); 
            window.playSfx('melee_parry.ogg');
            target.visualEffect = 'glow-absorb';
            updateCombatUI();
            await sleep(400); 
            target.visualEffect = null;
            updateCombatUI();
            continue; 
        }

        let effectiveDex = window.getEffectiveStat(tDEX);
        let finalDmg = Math.floor(postAcDmg * (1 - (effectiveDex / 100))); 

        if (attackType === 'MAGIC') {
            let eqBoosts = window.getEquipBoosts(target);
            let resistMult = 1.0;
            if (eqBoosts.res > 0) resistMult -= eqBoosts.res;
            if (target.combatBuffs && target.combatBuffs.some(b => b.type === 'resist_magic')) resistMult -= 0.5;
            if (target.combatBuffs && target.combatBuffs.some(b => b.type === 'wight_ward')) resistMult -= 0.75;
            resistMult = Math.max(0, resistMult);

            if (resistMult < 1.0) {
                let blocked = finalDmg - Math.floor(finalDmg * resistMult);
                finalDmg = Math.floor(finalDmg * resistMult);
                logMsg(`<span style="color:#aa44ff; font-style:italic;">Magical wards absorbed ${blocked} damage!</span>`);
            }
        }

        if (e.data.category === 'undead' && target.combatBuffs && target.combatBuffs.some(b => b.type === 'undeadResist')) {
            let blocked = finalDmg - Math.floor(finalDmg * 0.5);
            finalDmg = Math.floor(finalDmg * 0.5);
            logMsg(`<span style="color:#fada5e; font-style:italic;">Aegis of Light repels the undead, absorbing ${blocked} damage!</span>`);
        }

        if (finalDmg <= 0) { 
            logMsg(`<span style="color:#00aa00;">${targetName} deflected it!</span>`); 
            window.playSfx('melee_parry.ogg');
            target.visualEffect = 'glow-absorb';
            updateCombatUI();
            await sleep(400); 
            target.visualEffect = null;
            updateCombatUI();
            continue; 
        }

        // Vibrant Resonance
        if (target.race === 'Vibrant' && attackType === 'MELEE') {             
            let reflectDmg = Math.floor(finalDmg * (target.isDefending ? 0.6 : 0.3)) + Math.floor(getStat(target, 'CHA') / 4);
            if (reflectDmg > 0) {					
                e.hp -= reflectDmg;
                window.playSfx('melee_parry_vibrant.ogg');
                logMsg(`<span class="log-vibrant" style="font-weight:bold; font-size:1.1rem;">BONG!</span>`);                     
                logMsg(`<span style="color:#cc5500; font-style:italic;">The resonant shockwave ripples back, hitting ${formattedNameLower} for ${reflectDmg} sonic damage!</span>`);
            }
        }

        target.hp = Math.max(0, target.hp - finalDmg);
        logMsg(`<span class="log-damage">${targetName} takes ${finalDmg} damage!</span>`);

        // 🌟 SFX Hit Selection
        let hitSound = (totalAC > 2) ? 'melee_hit_armor.ogg' : 'melee_hit_flesh.ogg';
        window.playSfx(hitSound);

		if (window.checkPartyDefeat()) return; 

        if (target.ailments.includes('Sleep')) {
            target.ailments = target.ailments.filter(a => a !== 'Sleep');
            logMsg(`<span style="color:#4488ff; font-weight:bold;">The blow wakes ${targetName} up!</span>`);
        }

        // Ailments
        if (target.hp > 0 && Math.random() < 0.25) {
            let newAilment = getAilmentFromAttack(attackName);
            if (newAilment && !target.ailments.includes(newAilment)) {
                if (target.combatBuffs && target.combatBuffs.some(b => b.type === 'wight_ward')) {
                    logMsg(`<span style="color:#fada5e; font-style:italic;">Aegis of the Maestro perfectly shields ${targetName} from the affliction!</span>`);
                } else if (target.race === 'Vibrant' && (newAilment === 'Poison' || newAilment === 'Disease')) {
                    logMsg(`<span style="color:#888; font-style:italic;">${targetName}'s bronze body resists the ${newAilment}!</span>`);
                } else {
                    target.ailments.push(newAilment);
                    if (newAilment === 'Frozen') target.frozenSteps = 10;
                    logMsg(`<span style="color:#aa44ff; font-weight:bold;">${targetName} is afflicted with ${newAilment} ${AILMENT_ICONS[newAilment]}!</span>`);				
                }
            }
        }

        target.visualEffect = 'glow-hit';
        updateCombatUI();
        await sleep(400);
        target.visualEffect = null;
        updateCombatUI();
    }
}


window.grantCard = function(enemyName) {
    if (!unlockedCards.includes(enemyName)) {
        unlockedCards.push(enemyName);
        localStorage.setItem('unlockedCards', JSON.stringify(unlockedCards));
        logMsg(`<span style="color:#87752e; font-weight:bold;">✨ New Card Unlocked: ${enemyName}!</span>`);
    }
};

function winCombat() {
    let enemy = window.combatState.enemies[0];
    let isSingle = window.combatState.enemies.length === 1;
    let enemyName = isSingle ? (enemy.customName || enemy.data.name) : "the horde";
    let formattedVictoriousName = isSingle ? enemyName : "the horde";

    // 🌟 INTERCEPT: If Lyre-Wight is defeated, trigger ending modal instead of standard victory
    if (window.combatState.enemies.some(e => e.data.name === "The Lyre-Wight")) {
        window.showEndingModal(null);
        return;
    }

    // 🌟 Check if this was a guardian battle and update persistence BEFORE clearing the ID!
    if (window.activeGuardianId && window.dungeonGuardians[window.activeGuardianId]) {
        window.dungeonGuardians[window.activeGuardianId].defeated = true;
        window.dungeonGuardians[window.activeGuardianId].horde = [];
    }

    if (window.activeGatekeeperId) {
        logMsg(`<span class="log-combat">Victory!</span> You defeated ${worldMaps[window.activeGatekeeperId].gatekeeperName}!`);
        window.activeGatekeeperId = null; 
    } else if (window.activeGuardianId) {
        logMsg(`<span class="log-combat">Victory!</span> You defeated the guardian!`);
        window.activeGuardianId = null; // 🌟 FIXED: Cleared here to prevent UI stickiness
    } else {
        logMsg(`<span class="log-combat">Victory!</span> You defeated ${formattedVictoriousName}!`);
    }

    window.isGuardianEncounter = false;

    let totalGold = 0, totalExp = 0, itemsFound = [];
    let enemiesKilled = window.combatState.enemies.length;

    window.combatState.enemies.forEach(e => {
        totalExp += e.data.exp;
        if (Math.random() >= 0.5) {
            let eLvl = e.data.level || 1;
            totalGold += Math.floor(Math.random() * (eLvl * 5)) + 1; 
            if (Math.random() < 0.25) {
                let iD = generateLootDrop(eLvl);
                if (iD) itemsFound.push(iD);
            }
        }
		window.grantCard(e.data.name);
    });

    let lootLevel = totalGold >= 501 ? 4 : (totalGold >= 251 ? 3 : (totalGold >= 51 ? 2 : (totalGold >= 11 ? 1 : 0)));
    let livingMembers = party.filter(p => p.hp > 0 && p.name !== "Empty" && !p.isSummon);

    let xpPerPerson = 0;
    if (livingMembers.length > 0) {
        let calculatedXp = Math.floor(totalExp / livingMembers.length);
        xpPerPerson = Math.max(enemiesKilled, calculatedXp); 
    }

    let victoryString = "";
    if (livingMembers.length > 0) {
        let baseGold = Math.floor(totalGold / livingMembers.length);
        let remainderGold = totalGold % livingMembers.length;
        livingMembers.forEach((p, index) => { 
            p.xp += xpPerPerson; 
            p.gold = (p.gold || 0) + baseGold + (index < remainderGold ? 1 : 0); 
        });

        sharedGold += totalGold;
        victoryString = `Gained ${totalGold} Gold. `;

        itemsFound.forEach(itemId => {
            // 🌟 Use the new shared logic (isShop = false)
            let qty = window.getLootQuantity(itemId, false); 
            let wasAdded = addLootToInventory(itemId, qty);

            // Pluralization check (if item name ends in s, don't add another s)
            let iName = qty > 1 ? `${qty} ${itemDB[itemId].name}${itemDB[itemId].name.endsWith('s') ? '' : 's'}` : `a ${itemDB[itemId].name}`;

            victoryString += wasAdded ? `You found ${iName}! ` : `Party full, left ${iName} behind. `;
        });
        victoryString += `Survivors gain ${xpPerPerson} XP!`;
    } else {
        victoryString = `Found ${totalGold} Gold. Party gains 0 XP.`;
    }

	window.cleanPartyRoster();
    window.gameState = 'VICTORY';
    party.forEach(p => { 
        p.isDefending = false; 
        if (p.combatBuffs) p.combatBuffs.length = 0; 
    });

    Object.keys(window.activeSpellAudios).forEach(spellId => {
        window.fadeOutAudio(window.activeSpellAudios[spellId]);
        delete window.activeSpellAudios[spellId];
    });
    updateEffectsUI();

    if (typeof entities !== 'undefined') {
        let idx = entities.findIndex(e => e.x === player.x && e.y === player.y && e.type === 'enemy');
        if (idx !== -1) {
            entities.splice(idx, 1);
            // 🌟 SYNC REMOVAL TO SOURCE
            if (worldMaps[currentMapId]) {
                worldMaps[currentMapId].entities = entities;
                if (window.savedDynamicData && window.savedDynamicData[currentMapId]) {
                    window.savedDynamicData[currentMapId].entities = entities;
                }
            }
        }
    }

    document.getElementById('victory-loot').innerText = victoryString;
    let vDiv = document.getElementById('victory-portrait');
    vDiv.style.backgroundImage = `url('assets/victory_level${lootLevel}.webp?v=${GAME_VERSION}')`;
    vDiv.style.backgroundSize = 'contain'; vDiv.style.backgroundPosition = 'center center';

    updateUIState();
}

document.getElementById('btn-victory-continue').addEventListener('click', () => {
    // 🌟 FIX: Immediately hide the overlay to prevent the "stuck" UI sensation
    document.getElementById('victory-screen').style.display = 'none';

    if (window.gameState === 'VICTORY') {
        window.gameState = 'EXPLORE'; 
        window.combatState.enemyData = null; 

        // 🌟 NEW: Auto-enter dungeon if we just defeated the guardian!
        if (window.activeGuardianId && window.dungeonGuardians[window.activeGuardianId]?.defeated) {
            let tId = window.activeGuardianId;
            // Clear the active flag now that we are auto-entering
            window.activeGuardianId = null; 

            // Find the gate entity to get spawn coordinates
            let gate = entities.find(e => e.targetMap === tId);
            if (gate) {
                logMsg("You step past the fallen guardians into the dungeon.");

                // 🌟 FIX: We must update the UI state to unhide the canvas, minimap, and controls
                // BEFORE we return and let loadMap() take over!
                updateUIState();

                loadMap(gate.targetMap, gate.spawnX, gate.spawnY, gate.spawnDir);
                return; // Stop here, loadMap will handle the rest
            }
        }

        // Standard flow
        if (window.isInsideHouse) {
            document.getElementById('house-interior-view').style.display = 'flex';
        }

        updateUIState(); 
        window.resumeMapBgm(); 
        if(typeof update === 'function') update();
    }
});

window.checkFacingShop = function() {
    if (window.gameState !== 'EXPLORE' || typeof entities === 'undefined') return;

    let fX = player.x + dx[player.dir];
    let fY = player.y + dy[player.dir];

    // Find the entity based on where the player is looking	
    let shopEnt = entities.find(e => e.type === 'shop' && e.wallX === fX && e.wallY === fY);
	let forgeEnt = entities.find(e => e.type === 'forge_interaction' && e.wallX === fX && e.wallY === fY);
    let gateEnt = entities.find(e => e.type === 'transition' && e.wallX === fX && e.wallY === fY);
    let dungeonGateEnt = entities.find(e => e.type === 'dungeon_gate' && e.wallX === fX && e.wallY === fY);

    if (shopEnt) {
        let appearance = shopEnt.shopAppearance || "an old stone shop";
        let noteDesc = shopEnt.desc || (SHOP_CFG[shopEnt.shopType] ? SHOP_CFG[shopEnt.shopType].desc : "A small note indicating this shop offers goods.");
        logMsg(`<span style="color:#0044aa;">You are facing ${appearance}. The sign above says "${shopEnt.name}". ${noteDesc}</span>`);
    } 
    else if (forgeEnt) {        
        logMsg(`<span style="color:#aa44ff;">You are facing ${forgeEnt.name}. ${forgeEnt.desc}</span>`);
    }	
	else if (gateEnt) {
        logMsg(`<span style="color:#0044aa;">You stand before ${gateEnt.desc}.</span>`);
    }
    else if (dungeonGateEnt) {
        logMsg(`<span style="color:#0044aa;">You stand before ${dungeonGateEnt.desc}.</span>`);
    }
}

const TRAP_DATABASE = {
    1:  { name: "Dart", dmgMult: 1, ailment: null, instantDeath: false },
    2:  { name: "Poison Needle", dmgMult: 1, ailment: "Poison", instantDeath: false },
    3:  { name: "Flash Powder", dmgMult: 0, ailment: "Blindness", instantDeath: false },
    4:  { name: "Acid Spray", dmgMult: 1.5, ailment: null, instantDeath: false },
    5:  { name: "Hallucinogenic Spores", dmgMult: 0, ailment: "Madness", instantDeath: false },
    6:  { name: "Sleep Gas", dmgMult: 0, ailment: "Sleep", instantDeath: false },
    7:  { name: "Electric Wire", dmgMult: 2, ailment: "Paralysis", instantDeath: false },
    8:  { name: "Freezing Blast", dmgMult: 2, ailment: "Frozen", instantDeath: false },
    9:  { name: "Sickening Miasma", dmgMult: 2.5, ailment: "Disease", instantDeath: false },
    10: { name: "Death Rune", dmgMult: 4, ailment: null, instantDeath: true }
};

window.isDark = function(x, y) {
    if (typeof entities === 'undefined') return false;
    return entities.some(e => e.type === 'darkness' && e.x === x && e.y === y);
};

window.isAntiMagic = function(x, y) {
    return entities.some(e => e.type === 'anti_magic' && e.x === x && e.y === y);
};

window.isSilence = function(x, y) {
    if (typeof entities === 'undefined') return false;
    return entities.some(e => e.type === 'silence' && e.x === x && e.y === y);
};

window.checkZoneEffects = function() {
    if (window.gameState !== 'EXPLORE') return;

    const isAntiMagic = window.isAntiMagic(player.x, player.y);
    const isSilence = window.isSilence(player.x, player.y);

    // --- 1. Music Management ---
    if (isSilence && !window.isSilencedAudio) {
        window.fadeOutBgm();
        window.isSilencedAudio = true;
    } else if (!isSilence && window.isSilencedAudio) {
        window.resumeMapBgm();
        window.isSilencedAudio = false;
    }

    // --- 2. Suppression Management ---
    if (isAntiMagic || isSilence) {
        let dispelled = false;

        party.forEach(p => {
            if (p.combatBuffs) {
                p.combatBuffs = p.combatBuffs.filter(b => {
                    let spell = spellDB[b.id];
                    if (!spell) return true;

                    // Suppress magic if anti-magic, or Bard Songs if silenced
                    let shouldSuppress = (isAntiMagic && spell.magical) || (isSilence && spell.classReq === 'Bard');

                    if (shouldSuppress) {
                        logMsg(`<span style="color:#aa44ff;">${p.name}'s ${b.name} is suppressed!</span>`);
                        dispelled = true;

                        // If it's a song, ensure the song audio fades too
                        if (spell.classReq === 'Bard' && window.activeSpellAudios[b.id]) {
                            window.fadeOutAudio(window.activeSpellAudios[b.id], true);
                            delete window.activeSpellAudios[b.id];
                        }
                        return false;
                    }
                    return true;
                });
            }
        });
        if (dispelled) updateEffectsUI();
    }
};

/* ================= EXPLORE LOGIC ================= */
function move(direction) {
    if (window.gameState !== 'EXPLORE' && window.gameState !== 'HOUSE') return;
    if (window.gameState === 'HOUSE' && direction === -1) { window.leaveHouse(); return; }
    if (window.isAnimating) { window.queuedAction = () => move(direction); return; }

    let nX = player.x + dx[player.dir] * direction;
    let nY = player.y + dy[player.dir] * direction;

    if (direction === 1 && typeof entities !== 'undefined') {
        let shopEnt = entities.find(e => e.type === 'shop' && e.wallX === nX && e.wallY === nY);
        let gateEnt = entities.find(e => (e.type === 'transition' || e.type === 'dungeon_gate') && e.wallX === nX && e.wallY === nY);
        let forgeEnt = entities.find(e => e.type === 'forge_interaction' && e.wallX === nX && e.wallY === nY);
        let isWall = map[nY] ? map[nY][nX] >= 1 : false;
        let isHouse = (worldMaps[currentMapId].theme === 'town' && isWall && !shopEnt && !gateEnt && !forgeEnt);

        // Block forward movement into forge
        if (forgeEnt) { 
            logMsg("The forge is too hot to approach."); 
            return; 
        }

        if (shopEnt || gateEnt || isHouse) { interact(); return; }
    }

    let isOutOfBounds = !map[nY] || map[nY][nX] === undefined;
    let cellVal = isOutOfBounds ? 1 : map[nY][nX];
    let isWall = cellVal >= 1;
    let chestBlocks = !isWall && entities.some(e => e.x === nX && e.y === nY && e.type === 'chest' && e.state === 'closed');

    // 🌟 Reveal tile on bump
    if (isWall || chestBlocks || (typeof getDoor === 'function' && getDoor(player.x, player.y, nX, nY)?.state === 'closed')) {
        revealMap(nX, nY);
        if(typeof update === 'function') update();
    }

    let boundaryDoor = typeof getDoor === 'function' ? getDoor(player.x, player.y, nX, nY) : null;
    let enemyEntity = !isWall ? entities.find(e => e.x === nX && e.y === nY && e.type === 'enemy') : null;

    // 🌟 Thematic bump messages!
    if (isWall) { 
        let theme = worldMaps[currentMapId].theme;
        if (theme === 'wilderness') {
            if (cellVal === 3) logMsg("You bump into the cold outside walls of a dungeon.");
            else if (cellVal === 2) logMsg("You bump into the towering stone walls of the city.");
            else logMsg("A dense thicket of trees blocks your path.");
        } else if (theme === 'town') {
            logMsg("You bump into the side of a building.");
        } else {
            logMsg("Ouch! You bump into a solid stone wall."); 
        }
        return; 
    }
    else if (boundaryDoor && boundaryDoor.state === 'closed') { logMsg("The door is closed. You must open it first."); return; } 
    else if (chestBlocks) { logMsg(direction > 0 ? "A heavy wooden chest blocks your path." : "You bump into a chest behind you."); return; }
    else if (enemyEntity) { 
        window.preCombatPos = { x: player.x, y: player.y }; // 🌟 Take a snapshot of the safe tile!
        player.x = nX; player.y = nY; 
        initCombat(enemyEntity.name); 
        return; 
    }
    else if (!isWall) {

        let animType = direction > 0 ? 'forward' : 'backward';

        // 🌟 Dynamic Step Messages!
        let transOnNewTile = entities.find(e => e.x === nX && e.y === nY && e.type === 'transition' && !e.wallX);
        let stepMsg = direction > 0 ? "You step forward into the darkness." : "You step backward.";

        // Change default text if we are in town or wilderness!
        if (worldMaps[currentMapId].theme === 'town') {
            stepMsg = direction > 0 ? "You step forward down the street." : "You step backward.";
        } else if (worldMaps[currentMapId].theme === 'wilderness') {
            stepMsg = direction > 0 ? "You step forward through the wilderness." : "You step backward.";
        }

        // Override with Transition text if we stepped onto one
        if (transOnNewTile && transOnNewTile.desc) {
            stepMsg = `You are standing ${transOnNewTile.desc}.`;
        }

        // Helper to run logic after move
        const handleArrival = () => {
            player.x = nX; player.y = nY;

			let scriptedEnt = entities.find(e => e.type === 'scripted_encounter' && e.x === player.x && e.y === player.y);
			if (scriptedEnt) {
				window.tryTriggerScriptedEncounter(scriptedEnt);
				return; // Stop move processing
			}

			 window.checkZoneEffects();

            // 🌟 NEW: Darkness Fizzle Logic
            if (window.isDark(player.x, player.y)) {
                let lightEffect = window.partyEffects.find(e => e.type === 'light');
                if (lightEffect) {
                    logMsg(`<span style="color:#aa0000; font-weight:bold;">Your ${lightEffect.name} fizzles out!</span>`);
                    window.partyEffects = window.partyEffects.filter(e => e.type !== 'light');
                    updateEffectsUI();
                }
            }

            // 🌟 NEW: Darkness Log (only if not bumping into something, handled by move logic)
            // We check this at the end of the move
            if (window.isDark(player.x, player.y)) {
                logMsg("Darkness!");
            }

			if (window.isAntiMagic(player.x, player.y)) {
				window.checkZoneEffects();
			}			

			let spinner = entities.find(e => e.type === 'spinner' && e.x === player.x && e.y === player.y);
			if (spinner && !window.isSpinProtected()) {
				let oldDir = player.dir;
				player.dir = Math.floor(Math.random() * 4); // Spin to a random direction
				logMsg(`<span style="color:#aa44ff;">The floor spins beneath your feet! You are disoriented.</span>`);
			}

            // 🌟 DETECTION: Detect Traps AND Spinners within 2 tiles (EXCLUDE Darkness, Silence, Anti-Magic)
			entities.filter(e => (e.type === 'trap' || e.type === 'spinner') && !e.isDetected).forEach(ent => {
				if (Math.hypot(ent.x - player.x, ent.y - player.y) <= 2) {
					let bestDex = party.reduce((max, p) => Math.max(max, getStat(p, 'DEX')), 0);
					if (Math.random() * 100 < (bestDex * 3)) { 
						ent.isDetected = true;
						window.playSfx('secret_discovery.ogg'); // 🌟 TRAP DETECTION SFX
						logMsg(`<span style="color:#635725;">You've spotted a hidden ${ent.type.replace('_', ' ')} nearby!</span>`);
					}
				}
			});

			// Trigger Anti-Magic / Silence / Darkness on Arrival
			entities.filter(e => 
				(e.type === 'darkness' || e.type === 'anti_magic' || e.type === 'silence') && 
				!e.isDetected && e.x === player.x && e.y === player.y
			).forEach(ent => {
				ent.isDetected = true;
				let typeName = ent.type.replace('_', '-');
				logMsg(`<span style="color:#aa44ff; font-weight:bold;">You have stumbled into a zone of ${typeName}!</span>`);

				// Trigger zone effects immediately
				window.checkZoneEffects();
			});

            // 🌟 TRAP TRIGGER LOGIC
            let trapOnTile = entities.find(e => e.type === 'trap' && e.x === player.x && e.y === player.y && e.state !== 'disarmed');

			if (trapOnTile) {
				logMsg(`<span style="color:#aa0000; font-weight:bold;">YOU TRIGGERED A TRAP!</span>`);
				let victimIdx = party.findIndex(p => p.name !== "Empty" && p.hp > 0);
				window.triggerChestTrap(trapOnTile.trapLevel, victimIdx);

				// Set to triggered so it doesn't fire again if you walk off and back on
				trapOnTile.state = 'triggered'; 
				// Optionally remove it from the map if it's a "one-shot" trap
				// entities = entities.filter(e => e !== trapOnTile);
			}

			// 🌟 TRIGGER: Handle Spinner logic			
			if (spinner) {
				// If we haven't seen it yet, reveal it now
				if (!spinner.isDetected) {
					logMsg(`<span style="color:#aa44ff;">You stepped on a hidden Spinner!</span>`);
					spinner.isDetected = true;
				}

				// Trigger the spin if not protected by the ring
				if (!window.isSpinProtected()) {
					player.dir = Math.floor(Math.random() * 4);
					logMsg(`<span style="color:#aa44ff;">The floor spins beneath your feet! You are disoriented.</span>`);
				} else {
					logMsg(`<span style="color:#635725;">Your Ring of Stability holds you firm against the spinner!</span>`);
				}
			}

			let teleporter = entities.find(e => e.type === 'teleporter' && e.x === player.x && e.y === player.y);
			if (teleporter) {
				if (!teleporter.isDetected) {
					logMsg(`<span style="color:#017070; font-weight:bold;">You stepped onto a hidden teleporter!</span>`);
					teleporter.isDetected = true;
				}

                if (teleporter.targetMap) {
                     logMsg("The air shimmers... you are teleported to a new level!");
                     loadMap(teleporter.targetMap, teleporter.destX, teleporter.destY, teleporter.spawnDir || 0);
                } else {
                     player.x = teleporter.destX;
                     player.y = teleporter.destY;
                     logMsg("The air shimmers... you are teleported!");
                }
			}

			let trapDoor = entities.find(e => e.type === 'trap_door' && e.x === player.x && e.y === player.y);
			if (trapDoor) {
				if (!trapDoor.isDetected) {
					logMsg(`<span style="color:#aa0000; font-weight:bold;">YOU STEPPED ON A TRAP DOOR!</span>`);
					trapDoor.isDetected = true;
				} else {
					logMsg("You step onto the trap door...");
				}

				// 🌟 UPDATED: Check for Levitation
				if (window.isPartyLevitating()) {
					logMsg("<span style='color:#4488ff;'>Your party levitates safely over the trap door!</span>");
				} else {
					// Auto-transition after a short delay
					setTimeout(() => { 
						loadMap(trapDoor.targetMap, trapDoor.spawnX, trapDoor.spawnY, trapDoor.spawnDir); 
					}, 500);
				}
			}

            // Update global state and level
            dungeonLevel = window.getDynamicLevel();
            window.refreshBanner();

            logMsg(stepMsg); 
            if (typeof window.checkFacingShop === 'function') window.checkFacingShop(); 
            tickTime();
            if(typeof update === 'function') update(); 
        };

        // Use the Animation Wrapper!
        if (typeof window.animateView === 'function') {
            window.animateView(animType, handleArrival);
        } else {
            handleArrival();
        }

        // Random Encounter Check (Delayed so animation finishes first)
        if (Math.random() < 0.10 && worldMaps[currentMapId].theme !== 'town') { 
            setTimeout(() => {
                // 🌟 FIX: Stop random encounters if we are already in combat/scripted state
                if (window.gameState !== 'EXPLORE') return;

                let randomEnemy = spawnRandomEnemy(); 
                if (randomEnemy) {
                    window.preCombatPos = { x: player.x, y: player.y }; 
                    initCombat(randomEnemy.name); 
                }
            }, 250);
        }
    } 
}


function turn(direction) {
    if (window.gameState !== 'EXPLORE') return; 

    // 🌟 NEW: If animating, save this turn for the exact moment the animation finishes!
    if (window.isAnimating) {
        window.queuedAction = () => turn(direction);
        return; 
    }

    let animType = direction === 1 ? 'turnRight' : 'turnLeft';

    // Use the new Animation Wrapper!
    if (typeof window.animateView === 'function') {
        window.animateView(animType, () => {
            player.dir = (player.dir + direction) % 4;
            // Refresh level in case looking around changes context (though only location moves strictly matter)
            dungeonLevel = window.getDynamicLevel();
            window.refreshBanner();

			if (typeof window.checkFacingShop === 'function') window.checkFacingShop(); // 🌟 ADDED!
            tickTime();
            if(typeof update === 'function') update();
        });
    } else {
        // Failsafe fallback
        player.dir = (player.dir + direction) % 4;
        dungeonLevel = window.getDynamicLevel();
        window.refreshBanner();
		if (typeof window.checkFacingShop === 'function') window.checkFacingShop(); // 🌟 ADDED!
        tickTime();
        if(typeof update === 'function') update();
    }
}

window.spawnRandomEnemy = function() {
    let dLvl = typeof dungeonLevel !== 'undefined' ? dungeonLevel : 1;
    let r = Math.random(); 
    let targetEnemyLevel = dLvl;

    // 🌟 Define unique enemies that should NEVER be spawned randomly
    const uniqueEnemies = ["The Lyre-Wight"]; 

    // Standard ±3 variance logic
    if (r < 0.50) targetEnemyLevel = dLvl; 
    else if (r < 0.80) targetEnemyLevel = Math.max(1, Math.random() < 0.5 ? dLvl + 1 : dLvl - 1); 
    else if (r < 0.95) targetEnemyLevel = Math.max(1, Math.random() < 0.5 ? dLvl + 2 : dLvl - 2); 
    else targetEnemyLevel = Math.max(1, Math.random() < 0.5 ? dLvl + 3 : dLvl - 3); 

    // 🌟 HIGH-LEVEL EXCEPTION LOGIC (Tier 24+)
    if (targetEnemyLevel >= 24) {
        // Define our tiers, excluding uniques
        let bossTier = enemyBestiary.filter(e => e.level >= 26 && !uniqueEnemies.includes(e.name)); 
        let eliteTier = enemyBestiary.filter(e => e.level >= 23 && e.level < 26 && !uniqueEnemies.includes(e.name)); 

        // If we rolled a boss-level target, apply a Rarity Gate
        if (targetEnemyLevel >= 26) {
            // 70% chance to force a spawn from the Elite tier (Diversity check)
            if (Math.random() < 0.70 && eliteTier.length > 0) {
                return eliteTier[Math.floor(Math.random() * eliteTier.length)];
            }
        }

        // If we are here, we allow the high-level roll, or we failed to find elite mobs
        let highPool = enemyBestiary.filter(e => e.level >= 23 && !uniqueEnemies.includes(e.name));
        return highPool.length > 0 ? highPool[Math.floor(Math.random() * highPool.length)] : null;
    }

    // Standard low/mid-level pool logic
    let validEnemies = enemyBestiary.filter(e => e.level === targetEnemyLevel && !uniqueEnemies.includes(e.name));

    // Fallback: If no enemies exactly at target level, broaden the scope
    if (validEnemies.length === 0) {
        validEnemies = enemyBestiary.filter(e => Math.abs(e.level - targetEnemyLevel) <= 1 && !uniqueEnemies.includes(e.name));
    }

    // Final desperate fallback
    if (validEnemies.length === 0) validEnemies = enemyBestiary.filter(e => e.level <= dLvl + 1 && !uniqueEnemies.includes(e.name));

    return validEnemies.length > 0 ? validEnemies[Math.floor(Math.random() * validEnemies.length)] : null;
};

function checkInteractable() {
    if (typeof entities === 'undefined') return;

    let canInteract = false;
    let btnText = "🗝️";
    let foundInteractable = null;

    let fX = player.x + dx[player.dir], fY = player.y + dy[player.dir];
    let isDungeon = (worldMaps[currentMapId] && worldMaps[currentMapId].theme === 'dungeon');

    // 1. Always check underfoot
    foundInteractable = entities.find(e => (e.type === 'message' || e.type === 'quest') && e.isDetected && e.x === player.x && e.y === player.y);

    // 2. If nothing underfoot, check in front (DUNGEON ONLY)
    if (!foundInteractable && isDungeon) {
        foundInteractable = entities.find(e => (e.type === 'message' || e.type === 'quest') && e.isDetected && e.x === fX && e.y === fY);
    }

    if (foundInteractable) {
        canInteract = true; 
        btnText = (foundInteractable.type === 'message') ? '📜 Read' : '✨ Pick Up';
    } else {
        let fDoor = typeof getDoor === 'function' ? getDoor(player.x, player.y, fX, fY) : null;
        let hasChest = entities.some(e => e.x === fX && e.y === fY && e.type === 'chest' && e.state === 'closed');
        let wallTransEnt = entities.find(e => e.type === 'transition' && e.wallX === fX && e.wallY === fY);
        let floorTransEnt = entities.find(e => e.type === 'transition' && e.x === player.x && e.y === player.y && !e.wallX);
        let shopEnt = entities.find(e => e.type === 'shop' && e.wallX === fX && e.wallY === fY);
        let forgeEnt = entities.find(e => e.type === 'forge_interaction' && e.wallX === fX && e.wallY === fY);
        let gateEnt = entities.find(e => (e.type === 'dungeon_gate' || e.type === 'transition') && e.wallX === fX && e.wallY === fY);
        let detectedTrap = entities.find(e => e.type === 'trap' && e.isDetected && e.x === fX && e.y === fY && e.state !== 'disarmed');

        if (forgeEnt) {
            canInteract = true; btnText = '🔨 Forge';
        }
        else if (fDoor && fDoor.state === 'closed') { canInteract = true; btnText = '🗝️'; }
        else if (hasChest) { canInteract = true; btnText = '🗝️'; }
        else if (detectedTrap) { canInteract = true; btnText = '⚠️ Disarm'; }
        else if (shopEnt) { canInteract = true; btnText = '🛒 Enter'; }
        else if (gateEnt) { canInteract = true; btnText = '🚪 Enter'; }
        else if (wallTransEnt) { canInteract = true; btnText = '🚪 Enter'; }
        else if (floorTransEnt) { canInteract = true; btnText = (floorTransEnt.direction === 'up') ? '🪜 Climb Up' : '🪜 Climb Down'; }
        else if (window.gameState === 'EXPLORE' && worldMaps[currentMapId].theme === 'town' && map[fY] && map[fY][fX] === 1) { canInteract = true; btnText = '🚪 Enter'; }
    }

    let btn = document.getElementById('btn-interact');
    btn.innerText = btnText;
    btn.style.visibility = canInteract ? 'visible' : 'hidden';
}


function checkMessageDiscovery() {
    if (window.gameState !== 'EXPLORE' && window.gameState !== 'HOUSE') return;

    entities.forEach(e => {
        if ((e.type === 'message' || e.type === 'quest') && !e.isDetected) {
            let dist = Math.hypot(e.x - player.x, e.y - player.y);

            if (dist <= 1.5) {
                e.isDetected = true;
                window.playSfx('secret_discovery.ogg'); // 🌟 PLAY SECRET SFX
                logMsg(e.type === 'quest' ? "You noticed a glimmer of something." : "You noticed something unusual nearby.");
            } 
            else if (dist <= 2.0) {
                let bestDex = party.reduce((max, p) => Math.max(max, getStat(p, 'DEX')), 0);
                if (Math.random() * 100 < (bestDex * 3)) { 
                    e.isDetected = true;
                    window.playSfx('secret_discovery.ogg'); // 🌟 PLAY SECRET SFX
                    logMsg(e.type === 'quest' ? "You spotted a glimmer nearby!" : "You spotted something hidden nearby!");
                }
            }
        }
    });
}

function interact() {
    let fX = player.x + dx[player.dir], fY = player.y + dy[player.dir];
    let isDungeon = (worldMaps[currentMapId] && worldMaps[currentMapId].theme === 'dungeon');

    // 1. Identify Target
    // Rule: Always check underfoot. 
    // Rule: Only check front if in Dungeon.
    let target = entities.find(e => (e.type === 'message' || e.type === 'quest') && e.isDetected && e.x === player.x && e.y === player.y);

    if (!target && isDungeon) {
        target = entities.find(e => (e.type === 'message' || e.type === 'quest') && e.isDetected && e.x === fX && e.y === fY);
    }

    // Process Pickup
    if (target) {
        if (target.type === 'quest') {
            logMsg(`You pick up ${target.desc}.`);
            let newItem = { 
                id: 'quest_item', qty: 1, isQuestItem: true, itemType: target.itemType, 
                content: target.content, title: target.desc, type: 'quest', location: worldMaps[currentMapId].name 
            };

            // 🌟 PUSH TO QUEST INVENTORY INSTEAD
            questInventory.push(newItem);
            let idx = questInventory.length - 1;

            entities = entities.filter(e => !(e.x === target.x && e.y === target.y && e.type === target.type));
            window.syncEntityPersistence();

            if(typeof update === 'function') update();
            window.openQuestModal(idx, true); // True flag indicates it's from questInventory
            return;
        } else if (target.type === 'message') {
            logMsg(`You pick up the ${target.msgType}: "${target.desc}"`);
            let newItem = { 
                id: 'quest_item', qty: 1, isQuestItem: true, content: target.content, 
                title: target.desc, type: target.msgType, location: worldMaps[currentMapId].name,
                part: target.part, of: target.of
            };

            // 🌟 PUSH TO QUEST INVENTORY INSTEAD
            questInventory.push(newItem);
            let idx = questInventory.length - 1;

            entities = entities.filter(e => e !== target);
            window.syncEntityPersistence();

            if(typeof update === 'function') update();
            window.openQuestModal(idx, true);
            return;
        }
    }

    // 🌟 MOVED: Prioritize Underfoot Transitions (Gratings/Ladders) over facing walls/shops
    let floorTransIndex = entities.findIndex(e => e.type === 'transition' && !e.wallX && (e.x === player.x && e.y === player.y));
    if (floorTransIndex !== -1) {
        let t = entities[floorTransIndex];
        let actionMsg = (t.direction === 'up') ? "You climb up..." : "You climb down...";
        logMsg(actionMsg);
        setTimeout(() => { loadMap(t.targetMap, t.spawnX, t.spawnY, t.spawnDir); }, 500);
        return;
    }

    // Standard non-item interaction logic
    if (window.gameState === 'EXPLORE') {
        let shopEnt = entities.find(e => e.type === 'shop' && e.wallX === fX && e.wallY === fY);
        let gateEnt = entities.find(e => (e.type === 'dungeon_gate' || e.type === 'transition') && e.wallX === fX && e.wallY === fY);
        let forgeEnt = entities.find(e => e.type === 'forge_interaction' && e.wallX === fX && e.wallY === fY);

        if (forgeEnt) {
            window.triggerForgeInteraction(forgeEnt);
            return;
        }
        else if (shopEnt) {
            logMsg(`You open the heavy doors and step into ${shopEnt.name}...`);
            if (typeof window.openShop === 'function') window.openShop(shopEnt);
            return; 
        } 
        else if (gateEnt) {
            window.tryTriggerGuardedEntrance(gateEnt);
            return; 
        }
    }

    if (window.gameState === 'EXPLORE' && worldMaps[currentMapId].theme === 'town' && map[fY] && map[fY][fX] === 1) {
        window.enterHouse(fX, fY);
        return;
    }

    if (window.gameState !== 'EXPLORE') return;

	let fDoor = typeof getDoor === 'function' ? getDoor(player.x, player.y, fX, fY) : null;
    if (fDoor && fDoor.state === 'closed') { 
        fDoor.state = 'open'; 
        window.playSfx('door_opening.ogg'); // 🌟 PLAY DOOR SFX
        logMsg("You turn the handle and push open the heavy wooden door."); 
        if(typeof update === 'function') update(); 
        return; 
    }

    let chestIndex = entities.findIndex(e => e.x === fX && e.y === fY && e.type === 'chest' && e.state === 'closed');
    if (chestIndex !== -1) {
        window.promptChestOpener(fX, fY, chestIndex);
        return;
    }

    let trap = entities.find(e => e.type === 'trap' && e.isDetected && e.x === fX && e.y === fY && e.state !== 'disarmed');
    if (trap) {
        window.promptTrapDisarm(trap);
        return;
    }
}

window.enterHouse = function(fX, fY) {
    // 🌟 SAVE POSITION: Store where we were standing (on the street)
    window.houseEntryPos = { x: player.x, y: player.y };

    // Move the player into the house grid coordinate
    player.x = fX;
    player.y = fY;

    window.gameState = 'HOUSE';
    window.isInsideHouse = true; 

    let houseType = getTownHouseType(fX, fY); 
    let variant = Math.floor(Math.random() * 10);

    let imgContainer = document.getElementById('house-interior-image');
    let interiorFile = `town-house-interior-type-${houseType}${variant}.webp`;
    let interiorDataUrl = window.getSpriteDataUrl(interiorFile);
    imgContainer.style.backgroundImage = `url('${interiorDataUrl}')`;

    // 🌟 Detect hidden message to populate the UI overlay
    let msg = entities.find(e => e.type === 'message' && e.isDetected && e.x === player.x && e.y === player.y);
    let titleEl = document.getElementById('house-title');
    let descEl = document.getElementById('house-desc');

    if (msg) {
        titleEl.innerText = `You found a ${msg.msgType}!`;
        descEl.innerText = `It appears to be ${msg.desc.charAt(0).toLowerCase() + msg.desc.slice(1)}`;
    } else {
        titleEl.innerText = "Empty House";
        descEl.innerText = "";
    }

    document.getElementById('house-interior-view').style.display = 'flex';

    // Check for message button visibility
    window.updateHouseUI();

    // Random Encounter Check
    if (Math.random() < 0.10) {
        let oldLevel = dungeonLevel;
        dungeonLevel = worldMaps[currentMapId].townLevel || 1;
        let randomEnemy = spawnRandomEnemy();
        if (randomEnemy) {
            window.preCombatPos = { x: player.x, y: player.y };
            initCombat(randomEnemy.name);
        }
        dungeonLevel = oldLevel;
    }

	tickTime();
    if (typeof update === 'function') update();
};

window.updateHouseUI = function() {
    let msgBtn = document.getElementById('btn-read-house-message');
    // Look for a detected message at player's current location
    let msg = entities.find(e => e.type === 'message' && e.isDetected && e.x === player.x && e.y === player.y);

    if (msg) {
        // 🌟 NEW: Announcement logic to prevent spam
        if (!msg.announced) {
            logMsg(`You found a ${msg.msgType}. ${msg.desc}`);
            msg.announced = true;
        }

        msgBtn.style.display = 'block';
        msgBtn.onclick = () => {
            logMsg(`You pick up the ${msg.msgType}: "${msg.desc}"`);

            let newItem = { 
                id: 'quest_item', 
                qty: 1, 
                isQuestItem: true, 
                content: msg.content, 
                title: msg.desc, 
                type: msg.msgType, 
                location: worldMaps[currentMapId].name,
                part: msg.part, 
                of: msg.of
            };

            // 🌟 FIXED: Push to limitless questInventory instead of sharedInventory
            questInventory.push(newItem);
            let idx = questInventory.length - 1;

            // 🌟 PERSISTENCE FIX: Update both local, global, and save state references
            entities = entities.filter(e => e !== msg);
            if (worldMaps[currentMapId]) {
                worldMaps[currentMapId].entities = entities;
                if (window.savedDynamicData && window.savedDynamicData[currentMapId]) {
                    window.savedDynamicData[currentMapId].entities = entities;
                }
            }

            msgBtn.style.display = 'none';
            if(typeof update === 'function') update();

            // 1. Leave the house first so the interior overlay doesn't block the modal
            window.leaveHouse();

            // 2. Open the modal using the index we just found (true = from questInventory)
            window.openQuestModal(idx, true);
        };
    } else {
        msgBtn.style.display = 'none';
    }
};


window.leaveHouse = function() {
    window.isInsideHouse = false;
    window.gameState = 'EXPLORE';

    // 🌟 RESTORE POSITION: Move player back to where they were standing before entry
    if (window.houseEntryPos) {
        player.x = window.houseEntryPos.x;
        player.y = window.houseEntryPos.y;
    }

    document.getElementById('house-interior-view').style.display = 'none';

    // Flip player 180 degrees to face away from the door
    player.dir = (player.dir + 2) % 4;

    if (typeof update === 'function') update();
};

document.getElementById('btn-leave-house').addEventListener('click', () => {
    window.leaveHouse();
});

function addLootToInventory(itemId, qty = 1) {
    let itemData = itemDB[itemId];
    if (!itemData) return false;
    
    if (itemData.stackable) {
        let amountLeft = qty;
        // Try filling existing stacks first (assuming max stack size of 10)
        for (let i = 0; i < sharedInventory.length; i++) {
            let item = sharedInventory[i];
            if (item && item.id === itemId && item.qty < 10) {
                let space = 10 - item.qty;
                let addAmount = Math.min(space, amountLeft);
                item.qty += addAmount;
                amountLeft -= addAmount;
                if (amountLeft <= 0) return true;
            }
        }
        // Place remaining amount in empty slots
        while (amountLeft > 0) {
            let emptyIdx = sharedInventory.findIndex(i => i === null);
            if (emptyIdx !== -1) {
                let addAmount = Math.min(10, amountLeft);
                sharedInventory[emptyIdx] = { id: itemId, qty: addAmount };
                amountLeft -= addAmount;
            } else {
                return false; // Inventory is full
            }
        }
        return true;
    } else {
        // Non-stackable
        let emptyIdx = sharedInventory.findIndex(i => i === null);
        if (emptyIdx !== -1) { sharedInventory[emptyIdx] = { id: itemId, qty: 1 }; return true; }
        return false; 
    }
}

/* ================= MODAL LOGIC ================= */
window.setInvTab = function(tabName) {
    currentInvTab = tabName;
    currentInvSubTab = 'All'; // Reset sub-tab when switching main tabs
    document.querySelectorAll('.inv-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tabName)?.classList.add('active');
    openCharSheet(activeModalCharIndex); 
};

window.setInvSubTab = function(subType) {
    currentInvSubTab = subType;
    openCharSheet(activeModalCharIndex);
};

function buildItemSlot(invObj, expectedSlotName, actionData) {
    let dragSource = actionData.startsWith('unequip') ? `eq:${actionData.split(':')[1]}` : `inv:${actionData.split(':')[1]}`;
    let dragAttrs = `draggable="true" data-source="${dragSource}" ondragstart="window.handleItemDragStart(event)" ondragover="window.handleItemDragOver(event)" ondragenter="window.handleItemDragEnter(event)" ondragleave="window.handleItemDragLeave(event)" ondrop="window.handleItemDrop(event)" ondragend="window.handleItemDragEnd(event)"`;

    if (!invObj) {
        let activeChar = party[activeModalCharIndex];
        let genericFile = "";
        if (expectedSlotName === 'HELM') genericFile = "slot_helmet.webp";
        else if (expectedSlotName === 'BODY') genericFile = "slot_body.webp";
        else if (expectedSlotName === 'GLOV') genericFile = "slot_gloves.webp";
        else if (expectedSlotName === 'BOOT') genericFile = "slot_boots.webp";
        else if (expectedSlotName === 'WEAP') genericFile = "slot_weapon.webp";
        else if (expectedSlotName === 'OFFH') genericFile = (activeChar && activeChar.class === 'Bard') ? "slot_instrument.webp" : "slot_offhand.webp";
        else if (expectedSlotName === 'AMMO') genericFile = "slot_ammo.webp";
        else if (expectedSlotName === 'RING') genericFile = "slot_ring.webp"; 

        let placeholderHtml = genericFile ? `<div class="item-icon placeholder-icon" style="background-image: url('assets/${genericFile}?v=${GAME_VERSION}');"></div>` : "";
        return `<div class="item-slot empty" ${dragAttrs} onclick="executeItemAction('${actionData}')">${placeholderHtml}</div>`;
    }

    let itemId = typeof invObj === 'string' ? invObj : invObj.id;
    let qty = typeof invObj === 'object' ? invObj.qty : 1;
    let item = itemDB[itemId];
    if (!item) return `<div class="item-slot empty" ${dragAttrs}></div>`;

    let activeChar = party[activeModalCharIndex];
    let genderExt = (activeChar && activeChar.gender) ? activeChar.gender.toLowerCase() : 'm';

    let iconFile = item.icon; 
    if (item.iconM && item.iconF) iconFile = genderExt === 'f' ? item.iconF : item.iconM;

    // Resolve via Atlas or File
    let imgPath = window.getSpriteDataUrl(iconFile);
    let qtyHtml = (qty > 1) ? `<div class="item-qty">x${qty}</div>` : '';

    return `<div class="item-slot" ${dragAttrs} onclick="openItemModal('${actionData}')">
                <div class="item-icon" style="background-image: url('${imgPath}');"></div>
                ${qtyHtml}
            </div>`;
}


/* ================= ITEM DRAG AND DROP ENGINE ================= */
window.handleItemDragStart = function(e) {
    // 🌟 FIXED: Save the element to a variable immediately!
    let dragTarget = e.currentTarget; 
    
    if (dragTarget.classList.contains('empty')) { e.preventDefault(); return; } // Don't drag empty air!
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragTarget.dataset.source);
    
    // 🌟 FIXED: Use the saved variable inside the timeout
    setTimeout(() => dragTarget.classList.add('dragging'), 0);
};

window.handleItemDragOver = function(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
window.handleItemDragEnter = function(e) { e.currentTarget.classList.add('drag-over'); };
window.handleItemDragLeave = function(e) { e.currentTarget.classList.remove('drag-over'); };

window.handleItemDragEnd = function(e) {
    document.querySelectorAll('.item-slot').forEach(el => { el.classList.remove('dragging'); el.classList.remove('drag-over'); });
};

window.handleItemDrop = function(e) {
    e.preventDefault(); e.stopPropagation();
    
    let sourceStr = e.dataTransfer.getData('text/plain');
    let targetStr = e.currentTarget.dataset.source;
    document.querySelectorAll('.item-slot').forEach(el => { el.classList.remove('dragging'); el.classList.remove('drag-over'); });

    if (!sourceStr || !targetStr || sourceStr === targetStr) return;

    let char = party[activeModalCharIndex];
    if (!char) return;

    // Parse the data strings (e.g. "inv:5" or "eq:Weapon")
    let srcParts = sourceStr.split(':'), tgtParts = targetStr.split(':');
    let srcType = srcParts[0], srcLoc = srcParts[1]; 
    let tgtType = tgtParts[0], tgtLoc = tgtParts[1]; 

    // Extract Source Object
    let srcObj = srcType === 'inv' ? sharedInventory[parseInt(srcLoc)] : char.equipped[srcLoc];
    if (!srcObj) return;
    if (typeof srcObj === 'string') srcObj = { id: srcObj, qty: 1 };

    // Extract Target Object
    let tgtObj = tgtType === 'inv' ? sharedInventory[parseInt(tgtLoc)] : char.equipped[tgtLoc];
    if (tgtObj && typeof tgtObj === 'string') tgtObj = { id: tgtObj, qty: 1 };

    let sData = itemDB[srcObj.id];
    let tData = tgtObj ? itemDB[tgtObj.id] : null;

    // 🟢 SCENARIO 1: INVENTORY to INVENTORY
    if (srcType === 'inv' && tgtType === 'inv') {
        if (tgtObj && tgtObj.id === srcObj.id && sData.stackable) {
            // Merge Stacks!
            let space = 10 - tgtObj.qty;
            let move = Math.min(space, srcObj.qty);
            sharedInventory[parseInt(tgtLoc)].qty += move;
            sharedInventory[parseInt(srcLoc)].qty -= move;
            if (sharedInventory[parseInt(srcLoc)].qty <= 0) sharedInventory[parseInt(srcLoc)] = null;
        } else {
            // Swap Places
            sharedInventory[parseInt(tgtLoc)] = srcObj;
            sharedInventory[parseInt(srcLoc)] = tgtObj;
        }
    }
    
    // ⚔️ SCENARIO 2: INVENTORY to EQUIPMENT
    else if (srcType === 'inv' && tgtType === 'eq') {
        let allowedSlot = tgtLoc.startsWith('Ring') ? 'Ring' : tgtLoc; 
        if (sData.slot !== allowedSlot) { logMsg(`<span style="color:#aa0000;">Cannot equip ${sData.name} to the ${tgtLoc} slot.</span>`); return; }
        
        // 🌟 FIXED: Drag and Drop now strictly obeys race and class rules!
        if (!canEquip(char, sData)) { logMsg(`<span style="color:#aa0000;">${char.name} cannot equip this type of item.</span>`); return; }
        if (sData.reqClass && !sData.reqClass.includes(char.class)) { logMsg(`<span style="color:#aa0000;">${char.name}'s class cannot equip this item.</span>`); return; }

        if (tgtLoc === 'Ammo') {
            if (tgtObj && tgtObj.id === srcObj.id) { char.equipped.Ammo.qty += srcObj.qty; sharedInventory[parseInt(srcLoc)] = null; } 
            else { char.equipped.Ammo = { id: srcObj.id, qty: srcObj.qty }; sharedInventory[parseInt(srcLoc)] = tgtObj; }
        } else {
            if (srcObj.qty > 1) { // Split the stack!
                char.equipped[tgtLoc] = srcObj.id;
                sharedInventory[parseInt(srcLoc)].qty -= 1;
                if (tgtObj) addLootToInventory(tgtObj.id, tgtObj.qty);
            } else { // Standard equip swap
                char.equipped[tgtLoc] = srcObj.id;
                sharedInventory[parseInt(srcLoc)] = tgtObj;
            }
        }
        renderParty();
    }

    // 🎒 SCENARIO 3: EQUIPMENT to INVENTORY
    else if (srcType === 'eq' && tgtType === 'inv') {
        if (tgtObj) {
            // Swapping equipped item for an item in inventory
            // 🌟 FIXED: Added reqClass check so swapped items are fully validated!
            if (tData.slot === srcLoc && canEquip(char, tData) && (!tData.reqClass || tData.reqClass.includes(char.class))) {
                if (srcLoc === 'Ammo') {
                    char.equipped.Ammo = { id: tgtObj.id, qty: tgtObj.qty };
                    sharedInventory[parseInt(tgtLoc)] = srcObj;
                } else {
                    if (tgtObj.qty > 1) {
                        char.equipped[srcLoc] = tgtObj.id;
                        sharedInventory[parseInt(tgtLoc)].qty -= 1;
                        addLootToInventory(srcObj.id, srcObj.qty);
                    } else {
                        char.equipped[srcLoc] = tgtObj.id;
                        sharedInventory[parseInt(tgtLoc)] = srcObj;
                    }
                }
                renderParty();
            } else if (tgtObj.id === srcObj.id && sData.stackable) {
                // Merging equipped ammo back into the inventory stack
                let space = 10 - tgtObj.qty;
                let move = Math.min(space, srcObj.qty);
                sharedInventory[parseInt(tgtLoc)].qty += move;
                if (srcLoc === 'Ammo') {
                    char.equipped.Ammo.qty -= move;
                    if (char.equipped.Ammo.qty <= 0) char.equipped.Ammo = null;
                } else {
                    if (move > 0) char.equipped[srcLoc] = null;
                }
                renderParty();
            } else {
                logMsg(`<span style="color:#aa0000;">Cannot swap ${sData.name} with ${tData.name}.</span>`);
            }
        } else {
            // Target inventory slot is empty, just unequip it!
            sharedInventory[parseInt(tgtLoc)] = srcObj;
            char.equipped[srcLoc] = null;
            renderParty();
        }
    }

    // Finally, re-render the modal to show the changes!
    openCharSheet(activeModalCharIndex);
};

// Opens the inspector overlay
window.openItemModal = function(actionData) {
    let parts = actionData.split(':');
    let action = parts[0], payload = parts[1]; 

    let itemId, qty = 1;
    let isEquipped = (action === 'unequip');
    let isShopBuy = (action === 'shopbuy');   
    let isShopSell = (action === 'shopsell'); 

    let char = (typeof activeModalCharIndex !== 'undefined' && activeModalCharIndex !== null && party[activeModalCharIndex]) ? party[activeModalCharIndex] : null;

    if (isEquipped) {
        let eqData = char.equipped[payload];
        itemId = typeof eqData === 'object' ? eqData.id : eqData;
        qty = typeof eqData === 'object' ? eqData.qty : 1;
    } else if (isShopBuy) {
        let invObj = activeShop.inventory[parseInt(payload)];
        if (!invObj) return;
        itemId = typeof invObj === 'string' ? invObj : invObj.id;
        qty = typeof invObj === 'object' ? invObj.qty : 1;
    } else { 
        let invObj = sharedInventory[parseInt(payload)];
        if (!invObj) return;
        itemId = typeof invObj === 'string' ? invObj : invObj.id;
        qty = typeof invObj === 'object' ? invObj.qty : 1;
    }

    let item = itemDB[itemId];
    if (!item) return;

    document.getElementById('im-name').innerText = item.name;

    let typeDisplay = item.subType ? subTypeNames[item.subType] || item.slot : item.slot;
    if (item.slot === 'Consumable' || item.isAmmo) typeDisplay = 'Consumable Item';
    document.getElementById('im-subtitle').innerText = `Level ${item.level} ${typeDisplay}`;

    let genderExt = (char && char.gender) ? char.gender.toLowerCase() : 'm';
    let iconFile = item.icon; 
    if (item.iconM && item.iconF) iconFile = genderExt === 'f' ? item.iconF : item.iconM;

    // Resolve via Atlas or File
    let imgPath = window.getSpriteDataUrl(iconFile);
    document.getElementById('im-icon').style.backgroundImage = `url('${imgPath}')`;

    let qtyTag = document.getElementById('im-qty-tag');
    if (qty > 1) {
        qtyTag.innerText = `x${qty}`;
        qtyTag.style.display = 'block';
    } else {
        qtyTag.style.display = 'none';
    }

    // 📊 2. POPULATE STATS
    let statsHtml = ``;
    if (item.minDmg) statsHtml += `<div><b>Damage:</b> ${item.minDmg}-${item.maxDmg}</div>`;
    if (item.maxRange) statsHtml += `<div><b>Range:</b> ${item.maxRange}</div>`;
    if (item.dmgMult && item.dmgMult !== 1.0) statsHtml += `<div><b>Dmg Mult:</b> x${item.dmgMult}</div>`;
    if (item.ac) statsHtml += `<div><b>Armor Class:</b> ${item.ac}</div>`;

    // Core Attributes
    if (item.STR) statsHtml += `<div style="color:#5a2e0e;"><b>Strength:</b> +${item.STR}</div>`;
    if (item.DEX) statsHtml += `<div style="color:#5a2e0e;"><b>Dexterity:</b> +${item.DEX}</div>`;
    if (item.CON) statsHtml += `<div style="color:#5a2e0e;"><b>Constitution:</b> +${item.CON}</div>`;
    if (item.INT) statsHtml += `<div style="color:#5a2e0e;"><b>Intelligence:</b> +${item.INT}</div>`;
    if (item.WIS) statsHtml += `<div style="color:#5a2e0e;"><b>Wisdom:</b> +${item.WIS}</div>`;
    if (item.CHA) statsHtml += `<div style="color:#5a2e0e;"><b>Charisma:</b> +${item.CHA}</div>`;
    if (item.LUK) statsHtml += `<div style="color:#5a2e0e;"><b>Luck:</b> +${item.LUK}</div>`;

    // Regeneration (Combat + Exploration)
    if (item.hpRegen || item.mpRegen) {
        // 🌟 DYNAMIC REGEN LABEL: Check if this should be "Songs" for Bard-restricted items
        let isSongRegen = item.mpRegen && ((item.reqClass && item.reqClass.includes('Bard')) || (char && char.class === 'Bard'));
        let type = item.hpRegen ? "HP" : (isSongRegen ? "Songs" : "SP");
        let color = item.hpRegen ? "#aa0000" : (isSongRegen ? "#cc5500" : "#0044aa");
        let val = item.hpRegen || item.mpRegen;

        // Exploration: 1 / value steps OR value per step
        let exploreText = val >= 1 ? `+${val} ${type} / step` : `+1 ${type} / ${Math.round(1/val)} steps`;

        // Combat: val * 20 per round
        let combatVal = Math.floor(val * 20);
        let combatText = `+${combatVal} ${type} / combat round`;

        statsHtml += `<div style="color:${color};"><b>Regeneration:</b><br>${exploreText}<br>${combatText}</div>`;
    }

    // Unique Ring Effects
    if (item.preventSpin) statsHtml += `<div style="color:#8b6508;"><b>Effect:</b> Immune to Spinner Traps</div>`;
    if (item.resistAoE) statsHtml += `<div style="color:#8b6508;"><b>Effect:</b> Resists Dragon Breath & AoE</div>`;
    if (item.isBeacon) statsHtml += `<div style="color:#aa44ff;"><b>Effect:</b> Allows Teleportation</div>`;
    if (item.permanentSong) statsHtml += `<div style="color:#00aa00;"><b>Effect:</b> Bard Songs Last Forever</div>`;
    if (item.permanentLight) statsHtml += `<div style="color:#fada5e;"><b>Effect:</b> Torches Never Expire</div>`;
    if (item.levitation) statsHtml += `<div style="color:#4488ff;"><b>Effect:</b> Levitates over Pit Traps</div>`;

    // Class Restrictions
    if (item.reqClass) statsHtml += `<div style="color:#aa0000; font-weight:bold; margin-top:5px;"><b>Requires:</b> ${item.reqClass.join(' or ')}</div>`;

    // Consumables & Magic
    if (item.resurrect) statsHtml += `<div style="color:#0044aa;"><b>Effect:</b> Revives dead ally</div>`;
    if (item.hpHeal) statsHtml += `<div style="color:#aa0000;"><b>Restores:</b> ${item.hpHeal >= 9999 ? "MAX" : item.hpHeal} HP</div>`;
    if (item.mpHeal) statsHtml += `<div style="color:#0044aa;"><b>Restores:</b> ${item.mpHeal >= 9999 ? "MAX" : item.mpHeal} SP</div>`;
    if (item.songHeal) statsHtml += `<div style="color:#cc5500;"><b>Replenishes:</b> ${item.songHeal} Songs</div>`;
    if (item.curesAll) statsHtml += `<div style="color:#00aa00;"><b>Cures:</b> ALL Ailments</div>`;
    else if (item.cures) statsHtml += `<div style="color:#00aa00;"><b>Cures:</b> ${item.cures.join(', ')}</div>`;

    if (item.duration && item.lightRadius) statsHtml += `<div><b>Light Radius:</b> +${item.lightRadius} (${item.duration} steps)</div>`;
    else if (item.subType === 'instrument' && item.duration !== undefined) statsHtml += `<div style="color:#cc5500;"><b>Song Duration:</b> +${item.duration} Rounds</div>`;

    // Magic Boosts & Resistances
    if (item.magicBoost) {
        let boostPct = Math.round((item.magicBoost - 1) * 100); 
        statsHtml += `<div style="color:#0044aa;"><b>Spell Power:</b> +${boostPct}%</div>`;
    }
    if (item.healBoost) {
        let boostPct = Math.round((item.healBoost - 1) * 100); 
        statsHtml += `<div style="color:#00aa00;"><b>Healing Power:</b> +${boostPct}%</div>`;
    }
    if (item.offBoost) {
        let boostPct = Math.round((item.offBoost - 1) * 100); 
        statsHtml += `<div style="color:#aa0000;"><b>Destruction Magic:</b> +${boostPct}%</div>`;
    }
    if (item.magicResistance) {
        let resPct = Math.round(item.magicResistance * 100); 
        statsHtml += `<div style="color:#aa44ff;"><b>Magic Resistance:</b> +${resPct}%</div>`;
    }
    if (item.drawsAggro) {
        let aggroPct = item.drawsAggro * 10;
        statsHtml += `<div style="color:#cc5500;"><b>Target Attraction:</b> +${aggroPct}%</div>`;
    }

    // SHOP PRICING OR INTRINSIC VALUE
    if (isShopBuy) {
        statsHtml += `<div style="color:#8b0000; margin-top:8px; font-size:1.4rem;"><b>Cost:</b> ${item.value} Gold</div>`;
    } else if (isShopSell) {
        let sellPrice = Math.max(1, Math.floor(item.value * 0.5));
        statsHtml += `<div style="color:#006600; margin-top:8px; font-size:1.4rem;"><b>Sell for:</b> ${sellPrice} Gold</div>`;
    } else if (item.value) {
        statsHtml += `<div style="color:#8b6508; margin-top:8px;"><b>Value:</b> ${item.value} Gold</div>`;
    }

    document.getElementById('im-stats').innerHTML = statsHtml || `<i>No special properties.</i>`;

    // 🎛️ CONFIGURE BUTTONS & DISCARD SLIDER
    let btnBox = document.getElementById('im-buttons');
    btnBox.innerHTML = '';

    let sliderZone = document.getElementById('im-drop-zone');
    let slider = document.getElementById('im-drop-slider');

    slider.oninput = null;

    if (isEquipped) {
        sliderZone.style.display = 'none';
        btnBox.innerHTML = `<button onclick="executeItemAction('${action}', '${payload}', 0)" style="grid-column: span 2; height: 50px;">🎒 Unequip</button>`;

        if (itemId === 'ring_beacon') {
            btnBox.innerHTML = `
                <button onclick="executeItemAction('teleport', '${payload}', 0)" style="height: 50px; background:#aa44ff; color:#fff; border-color:#6600aa;">✨ Teleport</button>
                <button onclick="executeItemAction('${action}', '${payload}', 0)" style="height: 50px;">🎒 Unequip</button>
            `;
        }
    } else if (isShopBuy) {
        if (qty > 1) {
            sliderZone.style.display = 'block';
            slider.max = qty; slider.value = 1;
            sliderZone.querySelector('span:first-child').innerText = 'Buy Quantity:'; 
            document.getElementById('im-drop-val').innerText = '1';
            document.getElementById('im-drop-val').style.color = '#006600';

            slider.oninput = function() {
                let val = parseInt(this.value);
                document.getElementById('im-drop-val').innerText = val;
                let total = val * item.value;
                let btn = document.getElementById('im-modal-action-btn');
                if (sharedGold >= total) {
                    btn.disabled = false;
                    btn.innerHTML = `🛒 Buy (${total} G)`;
                    btn.style.background = '#44aa44';
                    btn.style.color = '#fff';
                } else {
                    btn.disabled = true;
                    btn.innerHTML = `Not enough Gold (${total} G)`;
                    btn.style.background = '#444';
                    btn.style.color = '#888';
                }
            };
        } else {
            sliderZone.style.display = 'none'; slider.value = 1;
        }

        let canAfford = sharedGold >= item.value;
        if (canAfford) {
            btnBox.innerHTML = `<button id="im-modal-action-btn" onclick="executeItemAction('shopbuy', '${payload}', document.getElementById('im-drop-slider').value)" style="grid-column: span 2; height: 50px; background:#44aa44; color:#fff; border-color:#006600;">🛒 Buy (${item.value} G)</button>`;
        } else {
            btnBox.innerHTML = `<button id="im-modal-action-btn" disabled style="grid-column: span 2; height: 50px; background:#444; color:#888;">Not enough Gold (${item.value} G)</button>`;
        }
    } else if (isShopSell) {
        if (qty > 1) {
            sliderZone.style.display = 'block';
            slider.max = qty; slider.value = 1;
            sliderZone.querySelector('span:first-child').innerText = 'Sell Quantity:'; 
            document.getElementById('im-drop-val').innerText = '1';
            document.getElementById('im-drop-val').style.color = '#006600';

            slider.oninput = function() {
                let val = parseInt(this.value);
                document.getElementById('im-drop-val').innerText = val;
                let total = val * Math.max(1, Math.floor(item.value * 0.5));
                document.getElementById('im-modal-action-btn').innerHTML = `💰 Sell (${total} G)`;
            };
        } else {
            sliderZone.style.display = 'none'; slider.value = 1;
        }
        let sellPrice = Math.max(1, Math.floor(item.value * 0.5));
        btnBox.innerHTML = `<button id="im-modal-action-btn" onclick="executeItemAction('shopsell', '${payload}', document.getElementById('im-drop-slider').value)" style="grid-column: span 2; height: 50px; background:#fada5e; color:#000;">💰 Sell (${sellPrice} G)</button>`;
    } else {
        // NORMAL INVENTORY MODE        
        let btnText = "🎒 Equip";
        if (item.slot === 'Consumable') {
            if (item.lightRadius) btnText = "🔥 Light";
            else btnText = "🧪 Drink / Use";
        } else if (item.slot === 'Ammo') {
            btnText = "🏹 Equip Ammo";
        }

        btnBox.innerHTML = `
            <button onclick="executeItemAction('equip', '${payload}', 0)" style="height: 50px; background:#44aa44; color:#fff; border-color:#006600;">${btnText}</button>
            <button onclick="executeItemAction('discard', '${payload}', document.getElementById('im-drop-slider').value)" style="height: 50px; background:#aa4444; color:#fff; border-color:#660000;">🗑️ Discard</button>
        `;

        if (qty > 1) {
            sliderZone.style.display = 'block';
            slider.max = qty; slider.value = 1;
            sliderZone.querySelector('span:first-child').innerText = 'Discard Quantity:';
            document.getElementById('im-drop-val').innerText = '1';
            document.getElementById('im-drop-val').style.color = '#8b0000';
            slider.oninput = function() { document.getElementById('im-drop-val').innerText = this.value; };
        } else {
            sliderZone.style.display = 'none'; slider.value = 1; 
        }
    }

    document.getElementById('item-modal').style.display = 'flex';
};
window.closeItemModal = function() {
    document.getElementById('item-modal').style.display = 'none';
};

// The execution engine (Fires after buttons are pressed in the Modal)
window.executeItemAction = function(action, payload, extraArg) {

    // ==========================================
    // 🛒 SHOP LOGIC (No Character Required)
    // ==========================================
    if (action === 'shopbuy') {
        let invIdx = parseInt(payload);
        let invObj = activeShop.inventory[invIdx];
        if (!invObj) return;

        // 🌟 BULLETPROOF EXTRACTION
        let itemId = typeof invObj === 'string' ? invObj : invObj.id;
        let item = itemDB[itemId];
        let buyQty = parseInt(extraArg) || 1;
        let totalCost = item.value * buyQty;

        if (sharedGold >= totalCost) {
            if (addLootToInventory(itemId, buyQty)) {
                sharedGold -= totalCost;
                playCoinSound();
                logMsg(`Bought ${buyQty}x ${item.name} for ${totalCost} Gold.`);

                if (typeof invObj === 'object') {
                    invObj.qty -= buyQty;
                    if (invObj.qty <= 0) activeShop.inventory[invIdx] = null; // Sold out!
                } else {
                    activeShop.inventory[invIdx] = null; // Old string format sold out!
                }

                closeItemModal();
                renderShopMenu();
            } else {
                alert("Your party inventory is full!");
            }
        }
        return;
    }

    if (action === 'shopsell') {
        let invIdx = parseInt(payload);
        let sellQty = parseInt(extraArg) || 1;
        let invObj = sharedInventory[invIdx];
        if (!invObj) return;

        let itemId = typeof invObj === 'string' ? invObj : invObj.id;
        let item = itemDB[itemId];
        let sellPrice = Math.max(1, Math.floor(item.value * 0.5));
        let totalProfit = sellPrice * sellQty;

        sharedGold += totalProfit;
        if (typeof invObj === 'object') {
            invObj.qty -= sellQty;
            if (invObj.qty <= 0) sharedInventory[invIdx] = null;
        } else {
            sharedInventory[invIdx] = null;
        }

        // 🌟 ADDED: Move item to shopkeeper's inventory
        let foundExisting = activeShop.inventory.find(i => i && i.id === itemId);
        if (foundExisting) {
            foundExisting.qty += sellQty;
        } else {
            activeShop.inventory.push({ id: itemId, qty: sellQty });
        }

        playCoinSound();
        logMsg(`Sold ${sellQty}x ${item.name} for ${totalProfit} Gold.`);
        closeItemModal();
        renderShopMenu();
        return;
    }

    // ==========================================
    // 👤 CHARACTER LOGIC (Requires Character)
    // ==========================================
    let char = (typeof activeModalCharIndex !== 'undefined' && activeModalCharIndex !== null && party[activeModalCharIndex]) ? party[activeModalCharIndex] : null;
    if (!char) return; // Silent fail if not in the character sheet!

    // === DISCARD LOGIC ===
    if (action === 'discard') {
        let invIdx = parseInt(payload);
        let dropQty = parseInt(extraArg);
        let invObj = sharedInventory[invIdx];
        if (!invObj) return;

        let itemId = typeof invObj === 'string' ? invObj : invObj.id;
        let itemName = itemDB[itemId].name;

        if (typeof invObj === 'object') {
            invObj.qty -= dropQty;
            if (invObj.qty <= 0) sharedInventory[invIdx] = null;
        } else {
            sharedInventory[invIdx] = null;
        }

        logMsg(`Discarded ${dropQty}x ${itemName}.`);
        closeItemModal();
        openCharSheet(activeModalCharIndex);
        return; 
    }

	if (action === 'teleport') {
        let eqData = char.equipped[payload];
        if (eqData && typeof eqData === 'object' && eqData.mapId) {
            closeItemModal();
            document.getElementById('char-modal').style.display = 'none';
            logMsg(`<span style="color:#aa44ff;">The Beacon Ring flashes! You are transported through the void...</span>`);
            setTimeout(() => loadMap(eqData.mapId, eqData.x, eqData.y, eqData.dir), 500);
        }
        return;
    }

    // === UNEQUIP LOGIC ===
    if (action === 'unequip') {
        let slotName = payload;
        let eqData = char.equipped[slotName];
        if (!eqData) return; 

        let unequipId = typeof eqData === 'object' ? eqData.id : eqData;
        let unequipQty = typeof eqData === 'object' ? eqData.qty : 1;

        let wasAdded = addLootToInventory(unequipId, unequipQty);
        if (!wasAdded) { alert("Party inventory is full!"); return; }

        char.equipped[slotName] = null; 

        closeItemModal();
        openCharSheet(activeModalCharIndex); 
        renderParty(); 
    } 
    // === EQUIP / USE LOGIC ===
    else if (action === 'equip') {
        let invIdx = parseInt(payload);
        let invObj = sharedInventory[invIdx];
        if (!invObj) return; 

        let itemId = typeof invObj === 'string' ? invObj : invObj.id;
        let itemData = itemDB[itemId];
        if (!itemData) return; 

        let targetSlot = itemData.slot;

        // 🌟 FIXED: Universal Class and Race Restriction Check!
        if (targetSlot !== 'Consumable' && targetSlot !== 'Ammo') {
            if (char.isSummon) { alert(`${char.name} is a summoned creature and cannot equip items.`); return; }
            if (!canEquip(char, itemData)) { alert(`${char.name} cannot equip this type of item.`); return; }
            if (itemData.reqClass && !itemData.reqClass.includes(char.class)) { alert(`${char.name}'s class cannot equip this item.`); return; }
        } 
        else if (targetSlot === 'Ammo' && char.class !== 'Rogue') {
            alert(`${char.name} does not use ranged weapons and cannot equip ammunition.`);
            return;
        }

        // 🌟 TYPE VALIDATION: Check weapon/ammo compatibility
        if (targetSlot === 'Ammo') {
            let weaponId = char.equipped.Weapon;
            let weaponData = weaponId ? itemDB[weaponId] : null;
            if (weaponData && weaponData.requiresAmmo && itemData.ammoType !== weaponData.requiresAmmo) {
                alert(`Cannot equip ${itemData.name} with ${weaponData.name}.`);
                return;
            }
        }
        if (targetSlot === 'Weapon' && itemData.requiresAmmo) {
            let ammoData = char.equipped.Ammo ? itemDB[char.equipped.Ammo.id] : null;
            if (ammoData && ammoData.ammoType !== itemData.requiresAmmo) {
                alert(`Cannot equip ${itemData.name} with ${ammoData.name}.`);
                return;
            }
        }

        if (targetSlot === 'Consumable') {
            let isTorch = false; 

            if (itemData.lightRadius) { 
                if (worldMaps[currentMapId].isLit) {
                    alert(`It is already bright enough here. You don't need to use a ${itemData.name}.`);
                    return;
                }

                let existing = window.partyEffects.find(e => e.type === 'light');
                if (existing) {
                    existing.duration += itemData.duration; 
                    existing.power = Math.max(existing.power, itemData.lightRadius);
                    existing.name = itemData.name;
                    existing.icon = itemData.icon;
                } 
                else window.partyEffects.push({ id: itemId, name: itemData.name, icon: itemData.icon, duration: itemData.duration, type: 'light', power: itemData.lightRadius });
                logMsg(`The party activates the ${itemData.name}. It illuminates the dark dungeon.`);
                updateEffectsUI();
                isTorch = true; 
            }
            else if (itemData.hpHeal || itemData.mpHeal || itemData.songHeal || itemData.cures || itemData.curesAll || itemData.resurrect) {
                if (char.hp <= 0 && !itemData.resurrect) { alert(`${char.name} is dead and cannot consume this!`); return; }
                if (char.hp > 0 && itemData.resurrect) { alert(`${char.name} is already alive!`); return; }

                let used = false;

                // 🌟 Dynamic Verb Logic!
                let verb = 'uses';
                if (itemId.startsWith('food_')) verb = 'eats';
                else if (itemId.startsWith('drink_') || itemId.startsWith('potion_')) verb = 'drinks';

                // 🌟 NEW: Incapacitated / Dead item receipt logic
                let isDeadOrIncap = char.hp <= 0 || char.ailments.includes('Sleep') || char.ailments.includes('Paralysis') || char.ailments.includes('Frozen');
                let msg = '';

                if (isDeadOrIncap) {
                    if (verb === 'drinks') msg = `A fellow party member pours the ${itemData.name} into ${char.name}'s mouth.`;
                    else if (verb === 'eats') msg = `A fellow party member carefully feeds the ${itemData.name} to ${char.name}.`;
                    else msg = `A fellow party member applies the ${itemData.name} to ${char.name}.`;
                } else {
                    msg = `${char.name} ${verb} the ${itemData.name}.`;
                }

                if (itemData.resurrect && char.hp <= 0) { 
                    char.hp = itemData.hpHeal >= 9999 ? char.maxHp : itemData.hpHeal; 
                    char.ailments.length = 0; // 🌟 Clears the array safely!
                    msg += ` They are brought back to life!`; 
                    used = true; 
                }
                if (itemData.hpHeal && char.hp > 0) { 
                    if (char.hp < char.maxHp) { char.hp = Math.min(char.maxHp, char.hp + itemData.hpHeal); used = true; } 
                }

                // 🌟 MAGES & HEALERS: Restores SP
                if (itemData.mpHeal && char.hp > 0 && char.class !== 'Bard') { 
                    if (char.mp < char.maxMp) { char.mp = Math.min(char.maxMp, char.mp + itemData.mpHeal); used = true; } 
                }

                // 🌟 BARDS ONLY: Restores Songs
                if (itemData.songHeal && char.hp > 0 && char.class === 'Bard') { 
                    if (char.mp < char.maxMp) { char.mp = Math.min(char.maxMp, char.mp + itemData.songHeal); used = true; } 
                }

                if (itemData.curesAll && char.hp > 0 && char.ailments.length > 0) { 
                    char.ailments.length = 0; // 🌟 Clears the array safely!
                    msg += ` They are completely purified!`; 
                    used = true; 
                }
                else if (itemData.cures && char.hp > 0 && char.ailments.some(a => itemData.cures.includes(a))) {
                    char.ailments = char.ailments.filter(a => !itemData.cures.includes(a));
                    msg += ` They feel cleansed.`; 
                    used = true; 
                }

                if (!used) { alert(`${char.name} doesn't need to use that right now.`); return; }
                logMsg(msg);
            } else {
                alert(`Cannot equip or use ${itemData.name} right now.`); return;
            }

            if (typeof invObj === 'object') {
                invObj.qty -= 1;
                if (invObj.qty <= 0) sharedInventory[invIdx] = null;
            } else { sharedInventory[invIdx] = null; }

            closeItemModal();
            renderParty(); 

            if (isTorch) {
                document.getElementById('char-modal').style.display = 'none'; 
                activeModalCharIndex = null;
            } else {
                openCharSheet(activeModalCharIndex);
            }

            if(typeof update === 'function') update(); 
            return; 
        }

        if (targetSlot === 'Ring') {

            let eqObj = (itemId === 'ring_beacon') ? { id: itemId, mapId: currentMapId, x: player.x, y: player.y, dir: player.dir } : itemId;

            let replacedRing = null;
            if (!char.equipped.Ring1) { char.equipped.Ring1 = eqObj; }
            else if (!char.equipped.Ring2) { char.equipped.Ring2 = eqObj; }
            else {
                replacedRing = char.equipped.Ring1;
                char.equipped.Ring1 = eqObj;
            }

            // 🌟 FIX 2: Remove the equipped ring from the inventory!
            if (typeof invObj === 'object') {
                invObj.qty -= 1;
                if (invObj.qty <= 0) sharedInventory[invIdx] = null;
            } else {
                sharedInventory[invIdx] = null;
            }

            // 🌟 FIX 3: Put the replaced ring back in the inventory!
            if (replacedRing) addLootToInventory(typeof replacedRing === 'object' ? replacedRing.id : replacedRing, 1);

        } else if (targetSlot === 'Ammo') {
            let currentlyWearing = char.equipped.Ammo;
            if (currentlyWearing && currentlyWearing.id === itemId) {
                currentlyWearing.qty += invObj.qty;
                sharedInventory[invIdx] = null;
            } else {
                char.equipped.Ammo = { id: itemId, qty: invObj.qty };
                sharedInventory[invIdx] = null;
                if (currentlyWearing) addLootToInventory(currentlyWearing.id, currentlyWearing.qty);
            }
        } else {
            let currentlyWearing = char.equipped[targetSlot];
            char.equipped[targetSlot] = itemId;

            if (typeof invObj === 'object') {
                invObj.qty -= 1;
                if (invObj.qty <= 0) sharedInventory[invIdx] = null; 
            } else {
                sharedInventory[invIdx] = null;
            }
            if (currentlyWearing) addLootToInventory(currentlyWearing, 1);
        }

        closeItemModal();
        openCharSheet(activeModalCharIndex); 
        renderParty(); 
    }
};


window.ccgPortraitIndices = {}; 

window.toggleEnemyPortrait = function(el, enemyName) {
    let enemy = enemyBestiary.find(e => e.name === enemyName);
    if (!enemy || !enemy.portraits || enemy.portraits.length <= 1) return;

    // Cycle through available portraits
    let currentIdx = window.ccgPortraitIndices[enemyName] || 0;
    currentIdx = (currentIdx + 1) % enemy.portraits.length;
    window.ccgPortraitIndices[enemyName] = currentIdx;

    // Update UI
    let newPortrait = enemy.portraits[currentIdx].replace('.png', '.webp'); // 🌟 FIX: Force webp format
    el.style.backgroundImage = `url('${window.getSpriteDataUrl(newPortrait)}')`;
};

window.openQuestModal = function(invIdx, fromQuestInv = false) {
    let item = fromQuestInv ? questInventory[parseInt(invIdx)] : sharedInventory[parseInt(invIdx)];
    if (!item || !item.isQuestItem) return;

    document.getElementById('item-modal').style.display = 'flex';

    let questSequence = questInventory
        .map((i, index) => ({ item: i, index }))
        .filter(entry => entry.item && entry.item.isQuestItem && entry.item.title === item.title)
        .sort((a, b) => (parseInt(a.item.part) || 0) - (parseInt(b.item.part) || 0));

    let currentSeqIdx = questSequence.findIndex(entry => entry.index === parseInt(invIdx));

    document.getElementById('im-name').innerText = item.title;

    let typeFormatted = item.type.charAt(0).toUpperCase() + item.type.slice(1);
    let partDisplay = item.part ? ` (Part ${item.part}${item.of ? ' of ' + item.of : ''})` : '';
    document.getElementById('im-subtitle').innerText = `${typeFormatted}${partDisplay}`;

    // 🌟 PATCH: Resolve icon via Atlas first, fallback to asset folder
    let iconFile = item.itemType ? `item_quest_${item.itemType}.webp` : `message_${item.type}.webp`;
    let iconPath = window.getSpriteDataUrl(iconFile);

    // 🌟 PATCH: Explicitly center the background position in the inspector modal
    let iconEl = document.getElementById('im-icon');
    iconEl.style.backgroundImage = `url('${iconPath}')`;
    iconEl.style.backgroundPosition = 'center center';
    iconEl.style.backgroundSize = 'contain';
    iconEl.style.backgroundRepeat = 'no-repeat';

    document.getElementById('im-qty-tag').style.display = 'none';

    document.getElementById('im-stats').innerHTML = `
        <div style="font-style:italic; font-size:1.1rem; color:#444;">Found in: ${item.location}</div>
        <div style="margin-top:15px; white-space:pre-wrap; line-height:1.5;">${item.content || "An important quest object."}</div>
    `;

    let btnBox = document.getElementById('im-buttons');
    btnBox.innerHTML = '';

    if (questSequence.length > 1) {
        let prevEntry = currentSeqIdx > 0 ? questSequence[currentSeqIdx - 1] : null;
        let nextEntry = currentSeqIdx < questSequence.length - 1 ? questSequence[currentSeqIdx + 1] : null;

        if (prevEntry) {
            let prevBtn = document.createElement('button');
            prevBtn.innerText = "◀ Prev";
            prevBtn.style.height = "50px";
            prevBtn.onclick = () => window.openQuestModal(prevEntry.index, true);
            btnBox.appendChild(prevBtn);
        }

        if (nextEntry) {
            let nextBtn = document.createElement('button');
            nextBtn.innerText = "Next ▶";
            nextBtn.style.height = "50px";
            nextBtn.onclick = () => window.openQuestModal(nextEntry.index, true);
            btnBox.appendChild(nextBtn);
        }
    }

    document.getElementById('im-drop-zone').style.display = 'none';
};


function openCharSheet(index) {
    activeModalCharIndex = index;
    let c = party[index];
    if (!c || c.name === "Empty") return;

    // 🌟 LOGIC: Display format for summons vs. party members
    let displayName = c.name;
    if (c.isSummon && c.enemyData && c.name !== c.enemyData.name) {
        displayName = `${c.name} (${c.enemyData.name})`;
    }

    document.getElementById('cs-name').innerText = displayName;    

    // Prepare arguments for showClassInfo
    const lookupName = c.isSummon ? `'${c.enemyData.name}'` : 'null';
    const displayArg = `'${displayName}'`;

    let raceDisplay = c.race.charAt(0).toUpperCase() + c.race.slice(1);
    document.getElementById('cs-subtitle').innerHTML = `Level ${c.level} <span style="cursor: pointer; color: #0044aa; border-bottom: 1px dashed #0044aa;" onclick="window.showClassInfo('${c.race}', '${c.class}', ${lookupName}, ${displayArg})">${raceDisplay} ${c.class} ℹ️</span>`;

    let portraitDiv = document.getElementById('cs-portrait');
    let pPath = window.getCharPortrait(c);

    // 🌟 PATCH: Handle Portrait rendering from Atlas vs File
    if (c.isSummon) {
        // Use the DataURL helper to extract the slice from the atlas
        let dataUrl = window.getSpriteDataUrl(pPath);
        portraitDiv.innerHTML = '';
        portraitDiv.style.backgroundImage = `url('${dataUrl}')`;
        portraitDiv.style.backgroundSize = 'contain';
        portraitDiv.style.backgroundPosition = 'center center';
        portraitDiv.style.backgroundRepeat = 'no-repeat';
    } else {
        // Keep existing logic for standard PC files
        let imgTest = new Image();
        imgTest.onload = function() { 
            portraitDiv.innerHTML = ''; 
            portraitDiv.style.backgroundImage = `url('${pPath}')`; 
            portraitDiv.style.backgroundSize = 'contain'; 
            portraitDiv.style.backgroundPosition = 'center center'; 
            portraitDiv.style.backgroundRepeat = 'no-repeat'; 
        };
        imgTest.onerror = function() { 
            portraitDiv.style.backgroundImage = 'none'; 
            portraitDiv.innerHTML = '<span>[ NO PORTRAIT ]</span>'; 
        };
        imgTest.src = pPath;
    }

    let eq = c.equipped;
    let showAmmo = c.class === 'Rogue';
    let showOffhand = c.class !== 'Mage' && c.class !== 'Healer';

    document.getElementById('cs-eq-ammo').innerHTML = showAmmo ? buildItemSlot(eq.Ammo, 'AMMO', 'unequip:Ammo') : ''; 
    document.getElementById('cs-eq-top').innerHTML = buildItemSlot(eq.Helmet, 'HELM', 'unequip:Helmet');
    document.getElementById('cs-eq-left').innerHTML = buildItemSlot(eq.Body, 'BODY', 'unequip:Body') + buildItemSlot(eq.Weapon, 'WEAP', 'unequip:Weapon');

    let rightHtml = buildItemSlot(eq.Gloves, 'GLOV', 'unequip:Gloves');
    if (showOffhand) rightHtml += buildItemSlot(eq.Offhand, 'OFFH', 'unequip:Offhand');
    document.getElementById('cs-eq-right').innerHTML = rightHtml;

    document.getElementById('cs-eq-bottom').innerHTML = buildItemSlot(eq.Boots, 'BOOT', 'unequip:Boots');
    document.getElementById('cs-eq-ring1').innerHTML = buildItemSlot(eq.Ring1, 'RING', 'unequip:Ring1');
    document.getElementById('cs-eq-ring2').innerHTML = buildItemSlot(eq.Ring2, 'RING', 'unequip:Ring2');

    // Stats Calculation
    let weapId = c.equipped.Weapon;
    let wMin = 1, wMax = 4, isRanged = false, ammoMult = 1.0;
    if (weapId && itemDB[weapId]) { 
        wMin = itemDB[weapId].minDmg || 1; wMax = itemDB[weapId].maxDmg || 4; isRanged = itemDB[weapId].requiresAmmo;
        if (isRanged && c.equipped.Ammo) {
            let ammoId = typeof c.equipped.Ammo === 'object' ? c.equipped.Ammo.id : c.equipped.Ammo;
            if (itemDB[ammoId] && itemDB[ammoId].dmgMult) ammoMult = itemDB[ammoId].dmgMult;
        }
    }
    let statBonus = Math.floor(getStat(c, isRanged ? 'DEX' : 'STR') / 3);
    let lvlBonus = Math.floor(c.level / 2);
    let dmgMult = (1 + (c.level / 15));
    let calcMin = Math.floor((wMin + statBonus + lvlBonus) * dmgMult * ammoMult);
    let calcMax = Math.floor((wMax + statBonus + lvlBonus) * dmgMult * ammoMult);
    let numAttacks = 1;
    let totalAc = c.baseAc || 0;

    if (c.isSummon && c.enemyData) {
        calcMin = c.enemyData.meleeDmgMin || 0;
        calcMax = c.enemyData.meleeDmgMax || 0;
        // 🌟 FORCE NEGATIVE AC DISPLAY FOR SUMMONS
        totalAc = -Math.abs(c.enemyData.ac || 0);
    } else {
        if (['Warrior', 'Paladin', 'Rogue', 'Bard'].includes(c.class) && !isRanged) numAttacks += Math.floor(c.level / 7);
        ['Body', 'Helmet', 'Gloves', 'Boots', 'Offhand', 'Ring1', 'Ring2'].forEach(s => {
            let id = c.equipped[s]; let itemId = (id && typeof id === 'object') ? id.id : id;
            if (itemId && itemDB[itemId] && itemDB[itemId].ac) totalAc += itemDB[itemId].ac;
        });
    }

    let strikeStr = numAttacks > 1 ? ` <span style="color:#00aa00; font-size:0.9rem;">(x${numAttacks})</span>` : "";

    let nextXp = window.getXpCost(c.level);

    let xpPct = Math.min(100, Math.max(0, (c.xp / nextXp) * 100));
    let displayXp = window.getBaseXp(c.level) + c.xp;
    let displayNextXp = window.getBaseXp(c.level) + nextXp;

    let statsHtml = `
        <div style="grid-column: span 3; background: rgba(139, 69, 19, 0.05); border: 2px solid rgba(139, 69, 19, 0.2); border-radius: 6px; padding: 8px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 8px; box-shadow: inset 0 0 10px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-around; border-bottom: 1px dashed rgba(139, 69, 19, 0.3); padding-bottom: 8px;">
                <div style="text-align: center; width: 33%;"><div style="font-size: 0.8rem; color: #666; font-weight:bold;">HP</div><div style="color: #cc0000; font-weight: bold; font-size:1.2rem;">${c.hp} / ${c.maxHp}</div></div>
                <div style="text-align: center; width: 33%; visibility: ${c.maxMp > 0 ? 'visible' : 'hidden'};">
                    <div style="font-size: 0.8rem; color: #666; font-weight:bold;">${c.class === 'Bard' ? 'SONGS' : 'SP'}</div>
                    <div style="color: ${c.class === 'Bard' ? '#cc5500' : '#0044aa'}; font-weight: bold; font-size:1.2rem;">${c.mp} / ${c.maxMp}</div>
                </div>
                <div style="text-align: center; width: 33%; cursor: help;" title="XP ${displayXp} / ${displayNextXp}">
                    <div style="font-size: 0.8rem; color: #666; font-weight:bold;">XP</div>
                    <div style="color: #5a2e0e; font-weight: bold; font-size:1.2rem;">${displayXp}</div>
                    <div style="width: 70%; height: 4px; background: #222; border: 1px solid #000; margin: 2px auto 0 auto; border-radius: 2px;"><div style="width: ${xpPct}%; height: 100%; background: #00cc00; transition: width 0.3s;"></div></div>
                </div>
            </div>
            ${c.ailments && c.ailments.length > 0 ? `<div style="color: #aa00aa; font-weight: bold; font-size: 0.9rem; text-align: center; border-bottom: 1px dashed rgba(139, 69, 19, 0.3); padding-bottom: 6px; padding-top: 6px;">Afflictions: ${c.ailments.join(', ')}</div>` : ''}
            <div style="display: flex; justify-content: space-around; padding-top: 2px;">
                <div style="text-align: center;"><div style="font-size: 0.8rem; color: #666; font-weight:bold;">DMG</div><div style="color: #111; font-weight: bold; font-size:1.2rem;">${calcMin}-${calcMax}${strikeStr}</div></div>
                <div style="text-align: center;"><div style="font-size: 0.8rem; color: #666; font-weight:bold;">ARMOR (AC)</div><div style="color: #111; font-weight: bold; font-size:1.2rem;">${totalAc}</div></div>
            </div>
        </div>
    `;

    // 🌟 ONLY SHOW STATS FOR REAL PARTY MEMBERS
    if (!c.isSummon) {
        for (let [key, val] of Object.entries(c.stats)) { 
            let eff = getStat(c, key);
            let display = (eff > val) ? `<span style="color:#00aa00; font-weight:bold;">${eff}</span>` : (eff < val) ? `<span style="color:#aa0000; font-weight:bold;">${eff}</span>` : `<span style="font-weight:bold; color:#221100;">${val}</span>`;
            statsHtml += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background: rgba(255,255,255,0.4); border: 1px solid rgba(139, 69, 19, 0.15); border-radius: 4px; box-shadow: 1px 1px 0px rgba(0,0,0,0.05);"><span style="color: #555; font-size: 0.95rem; font-weight:bold;">${key}</span>${display}</div>`; 
        }
    }
    document.getElementById('cs-stats').innerHTML = statsHtml;

    // --- INVENTORY RENDERING ---
    let invHtml = ``;
    if (currentInvTab === 'Cards') {
        const catMap = {
            humanoid: { icon: "👤", color: "#4488ff" },
            beast: { icon: "🐾", color: "#44aa44" },
            monster: { icon: "👹", color: "#aa44ff" },
            undead: { icon: "💀", color: "#aa0000" }
        };
        const immMap = { 
            fire: "🔥", ice: "❄️", lightning: "⚡", arcane: "✨", 
            void: "🌌", holy: "☀️", dark: "💀" 
        };

        // 🌟 SANITIZE UNLOCKED CARDS TO REMOVE "GHOST" ENTRIES
        const validBestiaryNames = new Set(enemyBestiary.map(e => e.name));
        unlockedCards = unlockedCards.filter(name => validBestiaryNames.has(name));
        localStorage.setItem('unlockedCards', JSON.stringify(unlockedCards));

        // 🌟 SETUP SUB-TABS
        let subTabContainer = document.getElementById('sub-inv-tabs');
        let subFilters = new Set(['All']);
        enemyBestiary.filter(e => unlockedCards.includes(e.name)).forEach(e => subFilters.add(e.category || 'monster'));

        subTabContainer.style.display = 'flex';
        subTabContainer.innerHTML = Array.from(subFilters).map(s => `
            <div class="inv-tab ${currentInvSubTab === s ? 'active' : ''}" 
                 onclick="setInvSubTab('${s}')" 
                 style="font-size: 0.75rem;">
                 ${s.charAt(0).toUpperCase() + s.slice(1)}
            </div>
        `).join('');

        // 🌟 FILTER AND SORT
        let sortedBestiary = [...enemyBestiary]
            .filter(e => currentInvSubTab === 'All' || (e.category || 'monster') === currentInvSubTab)
            .sort((a, b) => a.exp - b.exp);

        let grid = document.getElementById('cs-inv');
        grid.className = 'card-grid'; 

        sortedBestiary.forEach(enemy => {
            let isUnlocked = unlockedCards.includes(enemy.name);

            // Get correct portrait index
            let pIdx = window.ccgPortraitIndices[enemy.name] || 0;
            // 🌟 FIX: Force Webp format
            let portraitFile = enemy.portraits[pIdx] ? enemy.portraits[pIdx].replace('.png', '.webp') : 'card_back.webp';
            let portrait = isUnlocked ? window.getSpriteDataUrl(portraitFile) : window.getSpriteDataUrl('card_back.webp');

            let name = isUnlocked ? enemy.name : "???";

            // Tooltip logic with detailed attacks
            let titleAttr = "";
            if (isUnlocked) {
                let lines = [];
                if (enemy.desc) lines.push(enemy.desc.replace(/\.\s+/g, '.\n'));

                // Detailed Attack Breakdown
                let atkBreakdown = [];
                if (enemy.meleeDmgMax > 0) atkBreakdown.push(`Melee: ${enemy.meleeDmgMin}-${enemy.meleeDmgMax}${enemy.meleeEffect && enemy.meleeEffect !== "None" ? ' (' + enemy.meleeEffect + ')' : ''}`);
                if (enemy.rangedDmgMax > 0) atkBreakdown.push(`Ranged: ${enemy.rangedDmgMin}-${enemy.rangedDmgMax}${enemy.rangedEffect && enemy.rangedEffect !== "None" ? ' (' + enemy.rangedEffect + ')' : ''}`);
                if (enemy.magicDmgMax > 0) atkBreakdown.push(`Magic: ${enemy.magicDmgMin}-${enemy.magicDmgMax}${enemy.magicEffect && enemy.magicEffect !== "None" ? ' (' + enemy.magicEffect + ')' : ''}`);

                if (atkBreakdown.length > 0) lines.push("\n" + atkBreakdown.join('\n'));

                let tooltipContent = `${enemy.name}:\n${lines.join('\n')}`;
                titleAttr = `title="${tooltipContent.replace(/"/g, '&quot;')}"`;
            }

            // ATK type and value
            let atkIcon = "⚔️";
            let atkVal = enemy.meleeDmgMax || 0;
            if (enemy.magicDmgMax > 0) {
                atkIcon = "✨";
                atkVal = enemy.magicDmgMax;
            } else if (enemy.rangedDmgMax > 0) {
                atkIcon = "🏹";
                atkVal = enemy.rangedDmgMax;
            }

            let stats = isUnlocked ? `
                <div style="display:flex; justify-content:center; align-items:center; gap:4px; flex-wrap:wrap;">
                    <span style="display:inline-flex; align-items:center;">${atkIcon} ${atkVal}</span>
                    <span>|</span>
                    <span>HP: ${enemy.hpMax}</span>
                    ${enemy.canMagic ? '<span>|</span><span>SP: ' + (enemy.level * 20 + 20) + '</span>' : ''}
                </div>` : "???";

            let acBadge = isUnlocked ? `
                <div style="position: relative; width: 32px; height: 32px; background-image: url('assets/ui_shield.webp?v=${GAME_VERSION}'); background-size: contain; background-repeat: no-repeat; display: flex; align-items: center; justify-content: center; margin: 0 auto 4px auto;">
                    <span style="font-size: 0.75rem; font-weight: bold; color: #fff; text-shadow: 1px 1px 1px #000; position: relative; top: -2px;">${Math.abs(enemy.ac || 0)}</span>
                </div>` : "";

            let cat = catMap[enemy.category] || { icon: "❓", color: "#666" };
            let catBadge = isUnlocked ? `<div class="ccg-category" style="color:${cat.color}">${cat.icon}</div>` : "";

            let lvl = enemy.level || 1;
            let lvlColor = (lvl >= 20) ? "#ffd700" : (lvl >= 10 ? "#c0c0c0" : "#cd7f32");
            let lvlBadge = isUnlocked ? `<div class="ccg-level" style="background-color:${lvlColor};">${lvl}</div>` : "";

            let immBadges = "";
            if (isUnlocked && enemy.immunities) {
                immBadges = `<div class="ccg-immunities">`;
                enemy.immunities.forEach(type => {
                    let sym = immMap[type] || "🛡️";
                    let label = type.charAt(0).toUpperCase() + type.slice(1);
                    immBadges += `<div class="ccg-immunity" title="Immune to: ${label}">${sym}</div>`;
                });
                immBadges += `</div>`;
            }

            let infBadges = "";
            let potentialInflictions = getPotentialAilments(enemy);
            if (isUnlocked && potentialInflictions.length > 0) {
                infBadges = `<div class="ccg-inflictions">`;
                potentialInflictions.forEach(type => {
                    let sym = AILMENT_ICONS[type] || "⚔️";
                    infBadges += `<div class="ccg-infliction" title="Inflicts: ${type}">${sym}</div>`;
                });
                infBadges += `</div>`;
            }

            let flippable = (isUnlocked && enemy.portraits && enemy.portraits.length > 1) ? `<div class="flippable-indicator"></div>` : "";

            invHtml += `
                <div class="ccg-card">
                    <div class="ccg-header">
                        ${catBadge}
                        <div class="ccg-card-title" ${titleAttr}>${name}</div>
                        ${lvlBadge}
                    </div>
                    ${immBadges}
                    ${infBadges}

                    <div class="ccg-card-img" style="background-image: url('${portrait}');" onclick="window.toggleEnemyPortrait(this, '${enemy.name}')">
                        ${flippable}
                    </div>
                    <div class="ccg-card-stats">
                        ${acBadge}
                        ${stats}
                    </div>
                </div>
            `;
        });

        // Add Summary Card (Always show total count for clarity)
        let foundCount = unlockedCards.length;
        let totalCount = enemyBestiary.length;

        invHtml += `
            <div class="ccg-card" style="background: #e8dcc4; border-color: #5a2e0e; color: #111; justify-content: center; text-align: center; cursor: default;">
                <div style="font-weight: bold; font-size: 1.1rem; color: #5a2e0e;">Collection</div>
                <div style="font-size: 2.2rem; font-weight: bold; margin: 10px 0;">${foundCount}/${totalCount}</div>
                <div style="font-size: 0.9rem; color: #555; font-style: italic;">Total Cards</div>
            </div>
        `;
    }

	else if (currentInvTab === 'Quest') {
        document.getElementById('cs-inv').className = 'inv-grid';
        let subTabContainer = document.getElementById('sub-inv-tabs');
        subTabContainer.style.display = 'flex';
        subTabContainer.innerHTML = ['All', 'Messages', 'Objects'].map(s => `
            <div class="inv-tab ${currentInvSubTab === s ? 'active' : ''}" 
                 onclick="setInvSubTab('${s}')" 
                 style="font-size: 0.75rem;">
                 ${s}
            </div>
        `).join('');

        let questGroups = {};
        questInventory.forEach((item, idx) => {
            if (!item || !item.isQuestItem) return;

            // Filtering Logic
            if (currentInvSubTab !== 'All') {
                let isMsg = ['letter',
							'journal',
							'note',
							'parchment',
							'diary',
							'plans',
							'decree',
							'fragments',
							'frosted note',
							'scripture',
							'records',
							'log',
							'manuscript',
							'inscription',
							'tablet',
							'warning',
							'writing',
							'lament',
							'book',
							'scrawl',
							'ledger',
							'slab',
							'notes',
							'scroll',
							'sheet',
							'map',
							'orders',
							'confession',
							'missive',
							'vow'].includes(item.type);
                if (currentInvSubTab === 'Messages' && !isMsg) return;
                if (currentInvSubTab === 'Objects' && isMsg) return;
            }

            if (!questGroups[item.title]) questGroups[item.title] = [];
            let isAlreadyInGroup = questGroups[item.title].some(existing => existing.part === item.part);
            if (!isAlreadyInGroup) questGroups[item.title].push({ ...item, invIdx: idx });
        });

        Object.keys(questGroups).forEach(title => {
            let parts = questGroups[title].sort((a, b) => (parseInt(a.part) || 0) - (parseInt(b.part) || 0));
            let lowestPart = parts[0]; 
            let iconFile = lowestPart.itemType ? `item_quest_${lowestPart.itemType}.webp` : `message_${lowestPart.type}.webp`;

            // 🌟 FIX: Force icon to center and scale correctly, using the atlas-aware helper
            let iconPath = window.getSpriteDataUrl(iconFile);

            invHtml += `
                <div class="item-slot" onclick="openQuestModal(${lowestPart.invIdx}, true)" style="background:#000; cursor:pointer;">
                    <div class="item-icon" style="background-image: url('${iconPath}'); background-position: center; background-size: contain; background-repeat: no-repeat; width: 100%; height: 100%;"></div>
                    ${parts.length > 1 ? `<div class="item-qty">x${parts.length}</div>` : ''}
                </div>`;
        });
    } else {
        document.getElementById('cs-inv').className = 'inv-grid';
        let subTabContainer = document.getElementById('sub-inv-tabs');
        let subFilters = new Set(['All']);
        sharedInventory.forEach(item => {
            if (item && !item.isQuestItem) { 
                let iData = itemDB[typeof item === 'string' ? item : item.id];
                if (iData && (currentInvTab === 'All' || iData.tab === currentInvTab)) {
                    if (iData.subType) subFilters.add(iData.subType);
                    else if (iData.slot === 'Ring') subFilters.add('Ring');
                }
            }
        });
        if ((currentInvTab === 'Weapon' || currentInvTab === 'Armor') && subFilters.size > 1) {
            subTabContainer.style.display = 'flex';
            subTabContainer.innerHTML = Array.from(subFilters).map(s => `<div class="inv-tab ${currentInvSubTab === s ? 'active' : ''}" onclick="setInvSubTab('${s}')" style="font-size: 0.75rem;">${s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</div>`).join('');
        } else { subTabContainer.style.display = 'none'; }

        sharedInventory.forEach((item, idx) => {
            if (!item || item.isQuestItem) return;
            let iData = itemDB[typeof item === 'string' ? item : item.id];
            if (iData && (currentInvTab === 'All' || iData.tab === currentInvTab) && (currentInvSubTab === 'All' || iData.subType === currentInvSubTab)) {
                invHtml += buildItemSlot(item, 'EMPTY', `equip:${idx}`);
            }
        });
        if (currentInvTab !== 'All') { for(let i=0; i<80; i++) invHtml += `<div class="item-slot empty"></div>`; }
    }
    document.getElementById('cs-inv').innerHTML = invHtml;
    let goldEl = document.getElementById('cs-gold');
    goldEl.innerText = `Party Gold: ${sharedGold}`;
    goldEl.style.marginLeft = 'auto'; 

	// UI ACTIVE EFFECTS SCANNER
    let effectCategories = {
        'magicBoost': { label: 'Spell Power', val: 0, items:[], color: '#0044aa' },
        'healBoost': { label: 'Healing Power', val: 0, items:[], color: '#00aa00' },
        'offBoost': { label: 'Destruction Magic', val: 0, items:[], color: '#aa0000' },
        'magicResistance': { label: 'Magic Resistance', val: 0, items:[], color: '#aa44ff' },
		'drawsAggro': { label: 'Target Attraction', val: 0, items:[], color: '#cc5500' }, 
        'STR': { label: 'STR', val: 0, items:[], color: '#5a2e0e' },
        'DEX': { label: 'DEX', val: 0, items:[], color: '#5a2e0e' },
        'CON': { label: 'CON', val: 0, items:[], color: '#5a2e0e' },
        'INT': { label: 'INT', val: 0, items:[], color: '#5a2e0e' },
        'WIS': { label: 'WIS', val: 0, items:[], color: '#5a2e0e' },
        'CHA': { label: 'CHA', val: 0, items:[], color: '#5a2e0e' },
        'LUK': { label: 'LUK', val: 0, items:[], color: '#5a2e0e' },
        'hpRegen': { label: 'HP Regen', val: 0, items:[], color: '#cc0000', isRegen: true },
        'mpRegen': { label: 'SP Regen', val: 0, items:[], color: '#0044aa', isRegen: true }
    };
    let specialEffects = [];

    ['Weapon', 'Offhand', 'Body', 'Helmet', 'Gloves', 'Boots', 'Ring1', 'Ring2', 'Ammo'].forEach(slot => {
        let itemId = c.equipped[slot];
        if (itemId) {
            let id = typeof itemId === 'object' ? itemId.id : itemId;
            let item = itemDB[id];
            if (item) {
				['magicBoost', 'healBoost', 'offBoost'].forEach(prop => {
                    if (item[prop]) {
                        let boost = Math.round((item[prop] - 1) * 100);
                        effectCategories[prop].val += boost;
                        effectCategories[prop].items.push(`${item.name} (+${boost}%)`);
                    }
                });
                if (item.magicResistance) {
                    let boost = Math.round(item.magicResistance * 100);
                    effectCategories['magicResistance'].val += boost;
                    effectCategories['magicResistance'].items.push(`${item.name} (+${boost}%)`);
                }
                ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA', 'LUK'].forEach(stat => {
                    if (item[stat]) {
                        effectCategories[stat].val += item[stat];
                        let sign = item[stat] > 0 ? '+' : '';
                        effectCategories[stat].items.push(`${item.name} (${sign}${item[stat]})`);
                    }
                });
                if (item.drawsAggro) {
                    let aggroPct = item.drawsAggro * 10;
                    effectCategories['drawsAggro'].val += aggroPct;
                    effectCategories['drawsAggro'].items.push(`${item.name} (+${aggroPct}%)`);
                }
                ['hpRegen', 'mpRegen'].forEach(reg => {
                    if (item[reg]) {
                        effectCategories[reg].val += item[reg];
                        let text = item[reg] >= 1 ? `${item[reg]}/step` : `1/${Math.round(1/item[reg])} steps`;
                        effectCategories[reg].items.push(`${item.name} (+${text})`);
                    }
                });
                let specialMap = {
                    preventSpin: 'Immune to Spinner Traps',
                    resistAoE: 'Resists AoE Damage',
                    isBeacon: 'Beacon Teleportation',
                    permanentSong: 'Permanent Songs',
                    permanentLight: 'Permanent Light',
                    levitation: 'Levitation'
                };
                Object.keys(specialMap).forEach(sp => {
                    if (item[sp]) {
                        let existing = specialEffects.find(s => s.prop === sp);
                        if (existing) existing.items.push(item.name);
                        else specialEffects.push({ prop: sp, label: specialMap[sp], items: [item.name] });
                    }
                });
            }
        }
    });

    let effectsHtml = '';
    Object.values(effectCategories).forEach(cat => {
        if (cat.val !== 0) {
            let label = cat.label;
            let color = cat.color;

            // 🌟 DYNAMIC LABEL: Change "SP Regen" to "Song Regen" for Bards
            if (cat.label === 'SP Regen' && c.class === 'Bard') {
                label = 'Song Regen';
                color = '#cc5500';
            }

            let sign = cat.val > 0 ? '+' : '';
            let displayVal = `${sign}${cat.val}`;
            if (!cat.isRegen &&['Spell Power', 'Healing Power', 'Destruction Magic', 'Magic Resistance', 'Target Attraction'].includes(cat.label)) {
                displayVal += '%';
            }
            if (cat.isRegen) {
                displayVal = cat.val >= 1 ? `+${cat.val}/step` : `+1/${Math.round(1/cat.val)} steps`;
            }
            let tooltip = cat.items.join('&#10;');
            let bgColor = cat.val > 0 ? 'rgba(255,255,255,0.6)' : 'rgba(255,0,0,0.1)';
            effectsHtml += `<div style="font-size: 0.85rem; padding: 4px 8px; background: ${bgColor}; border: 1px solid rgba(0,0,0,0.15); border-radius: 4px; cursor: help; color: ${color}; font-weight: bold; box-shadow: 1px 1px 0 rgba(0,0,0,0.05);" title="Source(s):&#10;${tooltip}">${label}: ${displayVal}</div>`;
        }
    });
    specialEffects.forEach(sp => {
        let tooltip = sp.items.join('&#10;');
        effectsHtml += `<div style="font-size: 0.85rem; padding: 4px 8px; background: rgba(139,101,8,0.1); border: 1px solid rgba(139,101,8,0.3); border-radius: 4px; cursor: help; color: #8b6508; font-weight: bold; box-shadow: 1px 1px 0 rgba(0,0,0,0.05);" title="Source(s):&#10;${tooltip}">${sp.label}</div>`;
    });
    if (effectsHtml === '') effectsHtml = `<div style="font-size: 0.9rem; color: #888; font-style: italic; padding: 4px;">No active equipment effects.</div>`;
    let effectsContainer = document.getElementById('cs-active-effects');
    if (effectsContainer) effectsContainer.innerHTML = `<div style="width: 100%; font-size: 0.8rem; color: #666; font-weight: bold; border-bottom: 1px dashed rgba(139, 69, 19, 0.3); padding-bottom: 2px; margin-bottom: 4px;">ACTIVE EQUIPMENT EFFECTS</div>` + effectsHtml;

    let spellBtn = document.getElementById('btn-explore-spellbook');
    if (Array.of('Mage', 'Healer', 'Paladin', 'Bard').includes(c.class) && !c.isSummon) {
        spellBtn.style.display = 'block';
        spellBtn.innerHTML = c.class === 'Bard' ? '<span style="position: relative; top: -5px;">🎵 Songbook</span>' : '<span style="position: relative; top: -5px;">📖 Spellbook</span>';
    } else {
        spellBtn.style.display = 'none';
    }

    document.getElementById('char-modal').style.display = 'flex';
}

// ==========================================
// 🎵 MASTER AUDIO & BGM ENGINE
// ==========================================
const spellAudioCache = {};
window.activeSpellAudios = {}; 

const bgmAudioCache = {};
window.currentBgmId = null;
window.currentBgmAudio = null;

// --- SPELL & BARD SONG CONTROLLER ---
window.playSpellAudio = function(spellId, loop = false, casterIndex = null) {
    let isBardSong = spellId.startsWith('b_');

    // 🌟 Respect SFX toggle for non-song magic casting sounds
    if (!isBardSong && !window.isSfxEnabled()) {
        return;
    }

    // 🌟 Standardize key to 'b_song_' so it satisfies startsWith('b_') checks
    let audioKey = (isBardSong && casterIndex !== null) ? `b_song_${casterIndex}` : spellId;

    if (window.activeSpellAudios[audioKey]) {
        window.fadeOutAudio(window.activeSpellAudios[audioKey], true);
    }

    if (isBardSong) {
        window.fadeOutBgm();
    }

    let soundToPlay = new Audio(`assets/audio/${spellId}.ogg`);

    // 🌟 Only Bard songs should actively loop; standard magic is a one-shot casting SFX
    soundToPlay.loop = isBardSong ? loop : false;

    soundToPlay.onended = () => {
        // Only cleanup if this is the active instance
        if (window.activeSpellAudios[audioKey] === soundToPlay) {
            delete window.activeSpellAudios[audioKey];

            // Only resume Map BGM if a Bard song ended and NO OTHER Bard songs are playing
            let anySongPlaying = Object.keys(window.activeSpellAudios).some(id => id.startsWith('b_song_'));
            if (!anySongPlaying && isBardSong) {
                window.resumeMapBgm();
            }
        }
    };

    soundToPlay.volume = 0.5;
    window.activeSpellAudios[audioKey] = soundToPlay;
    soundToPlay.play().catch(err => console.warn(`Audio blocked: ${spellId}`, err));
};

window.isMusicEnabled = function() {
    return localStorage.getItem('audio_music') !== 'false';
};

window.isSfxEnabled = function() {
    return localStorage.getItem('audio_sfx') !== 'false';
};

// --- BGM CONTROLLER ---
window.playBgm = function(bgmId, loop = true) {
    if (!window.isMusicEnabled()) {
        window.fadeOutBgm();
        return;
    }
    if (!bgmId) return;

    if (window.currentBgmId === bgmId && window.currentBgmAudio) {
        if (!window.currentBgmAudio.paused) return; 
        window.currentBgmAudio.volume = 0;
        window.currentBgmAudio.play().catch(e => console.warn(e));
        window.fadeInAudio(window.currentBgmAudio, 0.3);
        return;
    }

    if (window.currentBgmAudio) window.fadeOutAudio(window.currentBgmAudio, true);

    window.currentBgmId = bgmId;

    if (!bgmAudioCache[bgmId]) {
        bgmAudioCache[bgmId] = new Audio(`assets/audio/${bgmId}.ogg`);
    }

    let newBgm = bgmAudioCache[bgmId];
    if (newBgm.fadeInterval) { clearInterval(newBgm.fadeInterval); newBgm.fadeInterval = null; }

    newBgm.volume = 0; 
    newBgm.loop = loop;  
    window.currentBgmAudio = newBgm;

    newBgm.play().then(() => {
        window.fadeInAudio(newBgm, 0.3);
    }).catch(err => {
        const startBgmOnClick = () => {
            if (window.currentBgmId === bgmId && window.isMusicEnabled()) {
                newBgm.volume = 0;
                newBgm.play();
                window.fadeInAudio(newBgm, 0.3);
            }
            document.removeEventListener('click', startBgmOnClick);
        };
        document.addEventListener('click', startBgmOnClick);
    });
};

window.fadeOutBgm = function() {
    if (window.currentBgmAudio && !window.currentBgmAudio.paused) {
        // False = Do not reset time! It pauses the track so it resumes perfectly.
        window.fadeOutAudio(window.currentBgmAudio, false); 
    }
};

window.resumeMapBgm = function() {
    // 1. Guard against playing Map BGM during combat or victory screen
    if (window.gameState === 'PRE_COMBAT' || window.gameState === 'COMBAT' || window.gameState === 'VICTORY') return;

    // 2. 🌟 NEW: Guard against playing Map BGM if in a Silence zone!
    if (window.isSilence(player.x, player.y)) return;

    // 3. Guard against playing Map BGM if a Bard song is currently running
    let bardSongPlaying = Object.keys(window.activeSpellAudios).some(id => id.startsWith('b_'));
    if (bardSongPlaying) return;

    // 4. All clear! Resume the track!
    let mapBgm = typeof worldMaps !== 'undefined' && worldMaps[currentMapId] ? worldMaps[currentMapId].bgm : null;
    if (mapBgm) window.playBgm(mapBgm);
};

// --- AUDIO FADE HELPERS ---
window.fadeOutAudio = function(audio, resetTime = true) {
    if (!audio || audio.paused) return;
    if (audio.fadeInterval) clearInterval(audio.fadeInterval);
    
    let step = audio.volume / 20; 
    audio.fadeInterval = setInterval(() => {
        if (audio.volume - step > 0.01) {
            audio.volume -= step;
        } else {
            audio.volume = 0;
            audio.pause();
            if (resetTime) audio.currentTime = 0;
            clearInterval(audio.fadeInterval);
            audio.fadeInterval = null;
        }
    }, 50); 
};

window.fadeInAudio = function(audio, targetVol) {
    if (!audio) return;
    if (audio.fadeInterval) clearInterval(audio.fadeInterval);
    
    audio.volume = 0;
    let step = targetVol / 20;
    audio.fadeInterval = setInterval(() => {
        if (audio.volume + step < targetVol) {
            audio.volume += step;
        } else {
            audio.volume = targetVol;
            clearInterval(audio.fadeInterval);
            audio.fadeInterval = null;
        }
    }, 50);
};
// ==========================================

function playBellSound() {
    if (!window.isSfxEnabled()) return;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(880, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 1.5);
    gain.gain.setValueAtTime(1, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
    osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 1.5);
    const osc2 = audioCtx.createOscillator(), gain2 = audioCtx.createGain();
    osc2.type = 'sine'; osc2.frequency.setValueAtTime(1200, audioCtx.currentTime); gain2.gain.setValueAtTime(0.4, audioCtx.currentTime); gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.0);
    osc2.connect(gain2); gain2.connect(audioCtx.destination); osc2.start(); osc2.stop(audioCtx.currentTime + 1.0);
}

function playCoinSound() {
    if (!window.isSfxEnabled()) return;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    function playPing(delay, freq, type) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const t = audioCtx.currentTime + delay;

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.95, t + 0.3);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.01); 
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3); 

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(t);
        osc.stop(t + 0.3);
    }

    playPing(0, 4500, 'sine');
    playPing(0.02, 6000, 'triangle');
    playPing(0.05, 5000, 'sine');
}

window.stopBardSongs = function(casterIndex) {
    // 1. Remove combat buffs (songs)
    party.forEach(p => {
        if (p.combatBuffs) {
            p.combatBuffs = p.combatBuffs.filter(b => !(b.isSong && b.casterIndex === casterIndex));
        }
    });

    // 2. Remove exploration effects
    window.partyEffects = window.partyEffects.filter(e => !(e.isSong && e.casterIndex === casterIndex));

    // 3. Stop specific Bard audio channel using standardized key
    let audioKey = `b_song_${casterIndex}`;
    if (window.activeSpellAudios[audioKey]) {
        window.fadeOutAudio(window.activeSpellAudios[audioKey], true);
        delete window.activeSpellAudios[audioKey];
    }

    let anySongPlaying = Object.keys(window.activeSpellAudios).some(id => id.startsWith('b_song_'));
    if (!anySongPlaying) {
        window.resumeMapBgm();
    }
    updateEffectsUI();
};


document.getElementById('btn-close-modal').addEventListener('click', () => { document.getElementById('char-modal').style.display = 'none'; activeModalCharIndex = null; });

document.getElementById('btn-prev-char').addEventListener('click', () => {
    let nextIdx = activeModalCharIndex;

    // Loop until we find a non-Empty slot
    do {
        nextIdx = (nextIdx - 1 + party.length) % party.length;
    } while (party[nextIdx].name === "Empty");

    openCharSheet(nextIdx);
});

document.getElementById('btn-next-char').addEventListener('click', () => {
    let nextIdx = activeModalCharIndex;

    // Loop until we find a non-Empty slot
    do {
        nextIdx = (nextIdx + 1) % party.length;
    } while (party[nextIdx].name === "Empty");

    openCharSheet(nextIdx);
});

document.getElementById('btn-bigmap-zoom-in').addEventListener('click', () => {
    bigMapZoom = Math.min(bigMapZoom + 0.25, 2.5); // Range 1.0 to 2.5
    window.drawBigMap();
});

document.getElementById('btn-bigmap-zoom-out').addEventListener('click', () => {
    bigMapZoom = Math.max(bigMapZoom - 0.25, 1.0);
    window.drawBigMap();
});

// Reset zoom when opening the map
document.getElementById('btn-mm-full').addEventListener('click', () => {
    // 🌟 Set default zoom based on current theme
    if (worldMaps[currentMapId] && worldMaps[currentMapId].theme === 'wilderness') {
        bigMapZoom = 3; // Example: Set Wildlands to be zoomed out (0.5)
    } else {
        bigMapZoom = 1.0; // Cities/Dungeons default to 1.0
    }

    document.getElementById('full-map-modal').style.display = 'flex';
    window.drawBigMap();
});

/* ================= INPUT BINDS ================= */
document.getElementById('btn-forward').addEventListener('click', () => move(1));
document.getElementById('btn-backward').addEventListener('click', () => move(-1));
document.getElementById('btn-turn-left').addEventListener('click', () => turn(3));
document.getElementById('btn-turn-right').addEventListener('click', () => turn(1));
document.getElementById('btn-interact').addEventListener('click', interact);
document.getElementById('btn-mm-zoom-in').addEventListener('click', () => {
    // Max zoom in is 48px per cell
    if (typeof minimapCellSize !== 'undefined') {
        minimapCellSize = Math.min(48, minimapCellSize + 4);
        if (typeof update === 'function') update();
    }
});

document.getElementById('btn-mm-zoom-out').addEventListener('click', () => {
    // Max zoom out is 8px per cell (Huge map overview!)
    if (typeof minimapCellSize !== 'undefined') {
        minimapCellSize = Math.max(8, minimapCellSize - 4);
        if (typeof update === 'function') update();
    }
});

// 🗺️ Open Full Map
document.getElementById('btn-mm-full').addEventListener('click', () => {
    document.getElementById('full-map-modal').style.display = 'flex';
    window.drawBigMap();
});

// ❌ Close Full Map
document.getElementById('btn-close-big-map').addEventListener('click', () => {
    document.getElementById('full-map-modal').style.display = 'none';
});

// We define validKeys globally so the event listener doesn't choke!
const validKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'e', ' ', 'Enter', 'Escape'];

document.addEventListener('keydown', (e) => {
    // 🌟 FIX: Ignore game keypresses if typing in any text input or textarea
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    // Only intercept keys that belong to the game
    // 🌟 FIX: We add F8 and F9 to the allowed keys so the code doesn't 'return' early
    const isGameKey = validKeys.includes(e.key) || e.key === 'F8' || e.key === 'F9';

    if (isGameKey) {
        if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault();
    } else {
        return;
    }

    if (e.key === 'F8') {
        e.preventDefault();
        window.quickSave();
        return;
    }
    if (e.key === 'F9') {
        e.preventDefault();
        window.quickLoad();
        return;
    }

    if (document.getElementById('char-modal').style.display === 'flex') {
        if (e.key === 'Escape') document.getElementById('btn-close-modal').click();
        return;
    }

    if (document.getElementById('shop-modal').style.display === 'flex') {
        if (e.key === 'Escape') document.getElementById('btn-sm-leave').click();
        return;
    }

    // 🗺️ Allow Escape to close the Big Map
    if (document.getElementById('full-map-modal').style.display === 'flex') {
        if (e.key === 'Escape') document.getElementById('btn-close-big-map').click();
        return;
    }

    if (window.gameState === 'VICTORY') {
        if (e.key === ' ' || e.key === 'Enter') {
            document.getElementById('btn-victory-continue').click();
        }
        return;
    }

    if (window.gameState === 'EXPLORE') {
        if (e.key === 'ArrowUp' || e.key === 'w') move(1);
        if (e.key === 'ArrowDown' || e.key === 's') move(-1);
        if (e.key === 'ArrowLeft' || e.key === 'a') turn(3);
        if (e.key === 'ArrowRight' || e.key === 'd') turn(1);
        if (e.key === 'e' || e.key === ' ' || e.key === 'Enter') interact();		
    }

    if (window.gameState === 'HOUSE') {
        if (e.key === 'ArrowDown' || e.key === 's') move(-1);        
        if (e.key === 'e' || e.key === ' ' || e.key === 'Enter') interact();
    }
});

function updateEffectsUI() {
    let col = document.getElementById('party-effects-col');
    if (!col) return;
    col.innerHTML = '';

    // 1. Draw Global Exploratory Effects (Light, etc.)
    window.partyEffects.forEach(effect => {
        // 🌟 PATCH: Resolve icon via Atlas using getSpriteDataUrl
        let iconPath = window.getSpriteDataUrl(effect.icon);
        col.innerHTML += `
            <div class="effect-icon-box" title="${effect.name}\nDuration: ${effect.duration}">
                <div class="effect-icon" style="background-image: url('${iconPath}');"></div>
                <div class="effect-duration">${effect.duration > 99 ? '99+' : effect.duration}</div>
            </div>`;
    });

    // 2. Aggregate and Draw Combat Buffs & Songs
    let activeBuffs = {};
    party.forEach(p => {
        if (p.name !== "Empty" && p.hp > 0 && p.combatBuffs) {
            p.combatBuffs.forEach(b => {
                // Track the buff with the longest remaining duration
                if (b.id && b.icon) {
                    if (!activeBuffs[b.id] || activeBuffs[b.id].duration < b.duration) {
                        activeBuffs[b.id] = { ...b }; 
                    }
                }
            });
        }
    });

    // Check if a Bard has a permanent song ring equipped
    let hasPermSong = party.some(p => p.hp > 0 && (p.equipped.Ring1 === 'ring_bard' || p.equipped.Ring2 === 'ring_bard'));

    Object.values(activeBuffs).forEach(effect => {
        let durText = (effect.isSong && hasPermSong) ? '∞' : effect.duration;
        let borderColor = effect.isSong ? '#cc5500' : '#00aa00'; // Orange for Songs, Green for Spells

        // 🌟 PATCH: Resolve icon via Atlas using getSpriteDataUrl
        let iconPath = window.getSpriteDataUrl(effect.icon);

        col.innerHTML += `
            <div class="effect-icon-box" style="border-color: ${borderColor};" title="${effect.name}\nDuration: ${durText}">
                <div class="effect-icon" style="background-image: url('${iconPath}');"></div>
                <div class="effect-duration" style="color: ${borderColor}; font-weight: bold; text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;">${durText}</div>
            </div>`;
    });
}


function tickTime() {
    window.gameTurnCounter++; // 🌟 Increment turn counter every step

    // 1. Passive Regen (HP and MP) with Fractional Accumulators!
    party.forEach(p => {
        if (p.name !== "Empty" && p.hp > 0) {
            let hpRegen = 0, mpRegen = 0;

            // 🌟 AILMENT EXPLORATION DAMAGE & DECAY
            if (p.ailments.includes('Poison')) {
                let dmg = Math.max(1, Math.floor(p.maxHp * 0.05));
                // 🌟 FIX: Floor HP before subtracting damage to prevent fractional ghosts
                p.hp = Math.max(0, Math.floor(p.hp) - dmg); 
                logMsg(`<span style="color:#00aa00;">${p.name} suffers ${dmg} poison damage!</span>`);
            }
            if (p.ailments.includes('Disease')) {
                let dmg = Math.max(1, Math.floor(p.maxHp * 0.02));
                // 🌟 FIX: Floor HP before subtracting damage
                p.hp = Math.max(0, Math.floor(p.hp) - dmg);
                logMsg(`<span style="color:#8b6508;">${p.name} suffers ${dmg} disease damage!</span>`);
            }

            // 🌟 NEW: Check for death after DOT application
            if (p.hp <= 0) {
                p.hp = 0;
                logMsg(`<span style="color:#aa0000; font-weight:bold;">${p.name} has succumbed to their afflictions!</span>`);
            }

            // 🌟 NEW: Thawing Out!
            if (p.ailments.includes('Frozen')) {
                // Failsafe in case they were frozen before this patch
                if (typeof p.frozenSteps === 'undefined') p.frozenSteps = 10; 

                p.frozenSteps -= 1;

                if (p.frozenSteps <= 0) {
                    // Filter out 'Frozen', leaving any other ailments intact!
                    p.ailments = p.ailments.filter(a => a !== 'Frozen');
                    logMsg(`<span style="color:#00ffff; font-weight:bold;">The ice cracks and shatters... ${p.name} has thawed out!</span>`);
                }
            }

            Array.of('Ring1', 'Ring2').forEach(slot => {
                let r = p.equipped[slot];
                if (r) {
                    let rId = typeof r === 'object' ? r.id : r;
                    if (itemDB[rId].hpRegen) hpRegen += itemDB[rId].hpRegen;
                    if (itemDB[rId].mpRegen) mpRegen += itemDB[rId].mpRegen;
                }
            });

            // 🌟 DISEASE BLOCKS REGEN
            if (p.ailments.includes('Disease')) {
                hpRegen = 0;
            }

            // Handle HP Fractions
            if (hpRegen > 0) {
                p.hpFraction = (p.hpFraction || 0) + hpRegen;
                if (p.hpFraction >= 1) {
                    let healAmount = Math.floor(p.hpFraction);
                    p.hp = Math.min(p.maxHp, p.hp + healAmount);
                    p.hpFraction -= healAmount; // Keep any leftover decimal
                }
            }

            // Handle MP Fractions
            if (mpRegen > 0) {
                p.mpFraction = (p.mpFraction || 0) + mpRegen;
                if (p.mpFraction >= 1) {
                    let healAmount = Math.floor(p.mpFraction);
                    p.mp = Math.min(p.maxMp, p.mp + healAmount);
                    p.mpFraction -= healAmount; // Keep any leftover decimal
                }
            }
        }
    });

    if (typeof renderParty === 'function') renderParty();

    if (window.partyEffects.length === 0) return;

	// 2. Darkness Fizzle check during passive time
    if (window.isDark(player.x, player.y)) {
        let lightEffect = window.partyEffects.find(e => e.type === 'light');
        if (lightEffect) {
            logMsg(`<span style="color:#aa0000; font-weight:bold;">Your ${lightEffect.name} fizzles out!</span>`);
            window.partyEffects = window.partyEffects.filter(e => e.type !== 'light');
            updateEffectsUI();
        }
    }

    // 3. Existing Light/Song Decay (Torch/Spell)
    let hasPermLight = party.some(p => p.hp > 0 && (p.equipped.Ring1 === 'ring_light' || p.equipped.Ring2 === 'ring_light'));
    let hasPermSong = party.some(p => p.hp > 0 && (p.equipped.Ring1 === 'ring_bard' || p.equipped.Ring2 === 'ring_bard'));

    for (let i = window.partyEffects.length - 1; i >= 0; i--) {
        let effect = window.partyEffects[i];

        // Skip decaying if protected!
        if (effect.type === 'light' && hasPermLight) continue; 
        
		let bard = party[effect.casterIndex];
		let hasPermSong = bard && (bard.equipped.Ring1 === 'ring_bard' || bard.equipped.Ring2 === 'ring_bard');
		if (effect.type === 'song' && hasPermSong) continue; 		

        effect.duration--;
        if (effect.duration <= 0) {
            logMsg(`<span style="color:#aa0000;">The ${effect.name} has expired.</span>`);
            window.partyEffects.splice(i, 1);
        }
    }
    updateEffectsUI();
}

if (typeof update === 'function') { update(); }

/* ================= SHOP SYSTEM ================= */
let activeShop = null;
let shopMode = 'buy'; 
let currentShopTab = 'All'; 

function getShopProbability(itemLevel, townLevel) {
    let diff = itemLevel - townLevel;
    if (diff <= -3) return 0.05;
    if (diff === -2) return 0.10;
    if (diff === -1) return 0.20;
    if (diff === 0) return 0.30;
    if (diff === 1) return 0.20;
    if (diff === 2) return 0.10;
    if (diff === 3) return 0.05;
    return 0; 
}

function shopAcceptsItem(shopType, item) {
    if (shopType === 'armoury') {
        if (!['Weapon', 'Body', 'Helmet', 'Gloves', 'Boots', 'Offhand'].includes(item.slot)) return false;
        let blockedTypes =['bronze', 'bronze_weapon', 'mage_armor', 'mage_weapon', 'ranged', 'instrument'];
        if (blockedTypes.includes(item.subType)) return false;
        return true;
    }
    
    if (shopType === 'potion_maker') {
        if (item.slot !== 'Consumable' || item.isAmmo) return false;
        let iconName = item.icon || item.iconM || "";
        if (!iconName.includes("item_potion")) return false;
        
        return true;
    }
	
	if (shopType === 'instrument_shop') {
        let allowedSubTypes = ['instrument', 'bronze', 'bronze_weapon', 'bronze_shield'];
        return allowedSubTypes.includes(item.subType);
    }
	
    if (shopType === 'spell_shop') {
        let allowedSubTypes =['mage_armor', 'mage_weapon'];
        return allowedSubTypes.includes(item.subType) || item.slot === 'Ring';
    }
    	
    if (shopType === 'bowyer') {
        return item.subType === 'ranged' || item.isAmmo === true;
    }
		
    if (shopType === 'general_store') {        
        if (item.slot !== 'Consumable' || item.isAmmo) return false;        
        let iconName = item.icon || item.iconM || "";
        if (iconName.includes("item_potion")) return false;
        
        return true;
    }
	
    if (shopType === 'tavern') {
        if (item.slot !== 'Consumable' || item.isAmmo) return false;
        
        let iconName = item.icon || item.iconM || "";
        // Only accept things that are explicitly food or drinks!
        if (iconName.includes("food") || iconName.includes("drink")) return true;
        
        return false;
    }
	
    return true; // Default fallback accepts everything
}

function generateShopStock(shopEnt) {
    shopEnt.inventory = [];
    let townLevel = worldMaps[currentMapId].townLevel || 1; 
    let multiplier = shopEnt.stockMultiplier !== undefined ? shopEnt.stockMultiplier : 2.5;

    for (let itemId in itemDB) {
        // 🌟 EXCLUSION LOGIC: Skip Legendary Items
        if (legendaryItems.includes(itemId)) continue;

        let item = itemDB[itemId];

        // Ask the Master Rulebook if this item is allowed here
        if (!shopAcceptsItem(shopEnt.shopType, item)) continue;

        // Multiply the bell-curve probability!
        let prob = getShopProbability(item.level || 1, townLevel) * multiplier;
        if (Math.random() < prob) {
            // 🌟 Use centralized quantity logic (isShop = true)
            let qty = window.getLootQuantity(itemId, true);
            shopEnt.inventory.push({ id: itemId, qty: qty }); 
        }
    }

    // Sort items by Level, then by Value
    shopEnt.inventory.sort((a, b) => {
        let idA = typeof a === 'string' ? a : a.id;
        let idB = typeof b === 'string' ? b : b.id;
        return (itemDB[idA].level - itemDB[idB].level) || (itemDB[idA].value - itemDB[idB].value);
    });
}


window.setShopTab = function(tabName) {
    currentShopTab = tabName;
    document.querySelectorAll('#shop-tabs .inv-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('sm-tab-' + tabName)?.classList.add('active');
    window.renderShopMenu(); 
};

// 🌟 NEW: Ailment pricing mapped perfectly to your potion values!
const AILMENT_COSTS = {
    "Poison": 15, "Disease": 25, "Confusion": 40, "Sleep": 60,
    "Madness": 85, "Blindness": 120, "Frozen": 160, "Paralysis": 200
};

// 🌟 MASSIVE THEMATIC NAME DATABASE
const nameDB = {
	"Human": {
		"m": ["Alden", "Garrick", "Jorn", "Rolan", "Kael", "Perrin", "Orik", "Bram", "Cael", "Tav", "Kester", "Vane", "Torin", "Balian", "Castor", "Dane", "Ewan", "Falk", "Galen", "Halett", "Ivor", "Jace", "Kellan", "Lucian", "Merrick", "Barnaby", "Colm", "Drake", "Emil", "Gideon", "Hadley", "Jareth", "Kendrick", "Lachlan", "Magnus", "Nolan", "Orson", "Quentin", "Rowan", "Soren", "Titus", "Ulric", "Vance", "Wyatt", "Zane", "Alaric", "Bastian", "Corbin", "Damon", "Gareth"],
		"f": ["Dara", "Fiora", "Lyra", "Sila", "Mire", "Nyx", "Alys", "Bryn", "Cassia", "Delia", "Elen", "Faye", "Gwen", "Isolde", "Jeyne", "Kora", "Lirael", "Maeve", "Nola", "Orla", "Quin", "Rina", "Sybil", "Tessa", "Adela", "Beatrice", "Clara", "Diana", "Elena", "Freya", "Giselle", "Hazel", "Johanna", "Keira", "Lorelei", "Matilda", "Nora", "Ophelia", "Phoebe", "Rosalind", "Sabine", "Thea", "Una", "Vivienne", "Willa", "Xenia", "Yvaine", "Zelde"]
	},
	"Elf": {
		"m": ["Aelrond", "Faenor", "Theren", "Iliyar", "Sylas", "Elandorr", "Lorien", "Fenian", "Caron", "Alatar", "Beiro", "Carric", "Erdan", "Heian", "Iannis", "Laucian", "Mindartis", "Paelias", "Quarion", "Riardon", "Soveliss", "Thamior", "Varis", "Zhoron", "Aelion", "Brambor", "Caelen", "Denthir", "Elidor", "Faelar", "Gildor", "Halas", "Ithil", "Kelvyn", "Lorian", "Mithral", "Naeris", "Orophin", "Peredhel", "Quenar", "Rilian", "Silvan", "Tilion", "Valandil", "Yavanna", "Zaphir", "Amras", "Beleg", "Caranthir"],
		"f": ["Caelynn", "Elenya", "Lia", "Sariel", "Naivara", "Faen", "Ilma", "Shava", "Anastrianna", "Antinua", "Birel", "Felosial", "Ielenia", "Keyleth", "Leshanna", "Meriele", "Mialee", "Quelenna", "Silaqui", "Theirastra", "Thia", "Vadania", "Valanthe", "Xanaphia", "Yael", "Aelis", "Belenos", "Celebrian", "Elwing", "Fionn", "Glauriel", "Ithilien", "Luthien", "Morwen", "Nimloth", "Nimrodel", "Finduilas", "Galadriel", "Idril", "Melian", "Nienna", "Rian", "Tarie", "Varda", "Yavannild", "Amarië", "Eärwen", "Irimë", "Miriel", "Nerdanel"]
	},
	"Dwarf": {
		"m": ["Brundir", "Kildrak", "Orsik", "Baern", "Eberk", "Traubon", "Ulfgar", "Adrik", "Brottor", "Dain", "Darrak", "Delg", "Einkil", "Fargrim", "Flint", "Gardain", "Harbek", "Morgran", "Orin", "Rangrim", "Rurik", "Taklinn", "Thoradin", "Tordek", "Vondal", "Walin", "Thili", "Qili", "Thoran", "Boin", "Cloin", "Bifur", "Bofur", "Bombar", "Dari", "Nuri", "Uori", "Thrar", "Threin", "Azaghâl", "Barin", "Gamli", "Hunding", "Mjoll", "Thar", "Ulf", "Varn", "Zar"],
		"f": ["Amber", "Diesa", "Eldeth", "Finellen", "Gunnloda", "Riswynn", "Mardred", "Gurdis", "Artin", "Audhild", "Bardryn", "Dagnal", "Falkrunn", "Helja", "Hlin", "Kathra", "Kristryd", "Ilde", "Liftrasa", "Sannl", "Torbera", "Torgga", "Vistra", "Dagnab", "Ruzza", "Dis", "Dhís", "Berta", "Gilda", "Katha", "Mora", "Sif", "Thora", "Valka", "Astrid", "Bambi", "Dagmar", "Freydis", "Greta", "Helga", "Ingrid", "Karin", "Liv", "Matilda", "Olga", "Ragnhild", "Sigrid", "Tyra", "Ulrika"]
	},
	"Halfling": {
		"m": ["Cade", "Garret", "Lyle", "Osborn", "Roscoe", "Wellby", "Alton", "Ander", "Corrin", "Eldon", "Errich", "Galder", "Lindal", "Merric", "Nedrick", "Oribar", "Pim", "Quincy", "Reed", "Sanbal", "Tealeaf", "Ulmo", "Vandar", "Xander", "Barnian", "Caspian", "Drugo", "Elmer", "Ferdinand", "Giles", "Hob", "Jasper", "Marmaduke", "Norbert", "Pip", "Rollo", "Samwise", "Tobias", "Wilfred", "Amos", "Bungo", "Cotman", "Falco", "Gerontius", "Hamfast", "Otho", "Ponto", "Tolman"],
		"f": ["Bree", "Callie", "Cora", "Euphemia", "Jillian", "Vani", "Lidda", "Merla", "Andry", "Charmaine", "Eida", "Kithri", "Lavinia", "Penny", "Nedda", "Paela", "Portia", "Robyn", "Rose", "Seraphina", "Shaena", "Trym", "Verna", "Wella", "Zira", "Belladonna", "Daisy", "Eglantine", "Goldilocks", "Lavender", "Marigold", "Pearl", "Rosemary", "Ruby", "Salvia", "Tansy", "Amaranth", "Camellia", "Diamond", "Emerald", "Gilly", "Lobelia", "May", "Pansy", "Peony", "Poppy", "Primrose", "Violet"],
	},
	"Vibrant": {
		"m": ["Lyrien", "Crescendo", "Harmon", "Timbre", "Canto", "Forte", "Chord", "Alto", "Rhythm", "Arpeggio", "Brio", "Clef", "Dorian", "Etude", "Falsetto", "Hymn", "Legato", "Motif", "Octave", "Presto", "Riff", "Solfege", "Tenor", "Vibrato", "Waltz", "Aria", "Bass", "Bolero", "Carillon", "Chime", "Clave", "Contrapunt", "Crotale", "Diapason", "Drone", "Gong", "Interval", "Largo", "Lute", "Maestro", "Modulation", "Pandean", "Plectrum", "Resonant", "Staccato", "Tabor", "Tympan", "Verse", "Zither"],
		"f": ["Melody", "Cadence", "Sonata", "Viola", "Octavia", "Rhapsody", "Lyric", "Allegra", "Bell", "Cantata", "Caprice", "Celesta", "Chanson", "Cleo", "Dissonance", "Echo", "Elegy", "Harmony", "Harper", "Lyrica", "Madrigal", "Minuet", "Muse", "Piper", "Symphony", "Allemande", "Bagatelle", "Barcarolle", "Cavatina", "Chorale", "Cymbal", "Fanfare", "Fioritura", "Galliard", "Impromptu", "Kithara", "Litany", "Mélodie", "Nocturne", "Ocarina", "Pavan", "Prelude", "Sarabande", "Siren", "Sonatina", "Tambour", "Toccata", "Tutti", "Virelai", "Zingara"]
	}
};

window.generateNewCharacter = function(race, charClass, level, forcedGender = null, forcedName = null) {
    const genders = ["m", "f"];
    const gender = forcedGender || genders[Math.floor(Math.random() * genders.length)];
    const rCap = (typeof racialCaps !== 'undefined' && racialCaps[race]) ? racialCaps[race] : { STR: 18, DEX: 18, CON: 18, INT: 18, WIS: 18, CHA: 18, LUK: 18 };
    const rollStat = (max) => Math.floor(Math.random() * (max - 7)) + 8;

    let charStats = { STR: rollStat(rCap.STR), DEX: rollStat(rCap.DEX), CON: rollStat(rCap.CON), INT: rollStat(rCap.INT), WIS: rollStat(rCap.WIS), CHA: rollStat(rCap.CHA), LUK: rollStat(rCap.LUK) };
    const boostStat = (stat) => { let b = Math.floor(Math.random() * 3) + 1; charStats[stat] = Math.min(rCap[stat], charStats[stat] + b); };

    if (charClass === "Warrior") { boostStat('STR'); boostStat('CON'); }
    if (charClass === "Mage")    { boostStat('INT'); }
    if (charClass === "Healer")  { boostStat('WIS'); }
    if (charClass === "Rogue")   { boostStat('DEX'); boostStat('LUK'); }
    if (charClass === "Paladin") { boostStat('STR'); boostStat('CHA'); }
    if (charClass === "Bard")    { boostStat('CHA'); boostStat('DEX'); }

    let charName = forcedName;
    if (!charName) {
        let nameList = (nameDB[race] && nameDB[race][gender]) ? nameDB[race][gender] : ["Adventurer"];
        charName = nameList[Math.floor(Math.random() * nameList.length)];
    }

    let recruit = { name: charName, race: race, class: charClass, gender: gender, level: level, xp: 0, hp: 0, maxHp: 0, mp: 0, maxMp: 0, stats: charStats, baseAc: 0, equipped: { Weapon: null, Offhand: null, Body: null, Helmet: null, Gloves: null, Boots: null, Ammo: null, Ring1: null, Ring2: null }, isDefending: false, spells: [], ailments: [] };

    let hpBase = 0, hpLvlScale = 0, hpConScale = 1;
    let mpBase = 0, mpLvlScale = 0, mpStatScale = 0;

    if (charClass === "Warrior") { 
        hpBase = -8; hpLvlScale = 24; 
        recruit.equipped.Weapon = "sword_short"; recruit.equipped.Body = "armor_leather"; 
    }
    else if (charClass === "Paladin") { 
        hpBase = -10; hpLvlScale = 23; 
        mpBase = 0; mpLvlScale = 4; mpStatScale = 0.8;
        recruit.equipped.Weapon = "sword_short"; recruit.equipped.Body = "armor_ringmail"; 
    }
    else if (charClass === "Rogue") { 
        hpBase = -10; hpLvlScale = 20; 
        recruit.equipped.Weapon = "dagger_iron"; recruit.equipped.Body = "armor_leather"; 
    }
    else if (charClass === "Bard") { 
        hpBase = -10; hpLvlScale = 18; 
        recruit.maxMp = level;
        recruit.equipped.Offhand = "lute"; recruit.equipped.Weapon = (race === "Vibrant" ? "dagger_bronze" : "dagger_iron"); recruit.equipped.Body = (race === "Vibrant" ? "armor_bronze" : "armor_leather"); 
    }
    else if (charClass === "Mage") { 
        hpBase = -15; hpLvlScale = 14; 
        mpBase = 2; mpLvlScale = 5; mpStatScale = 1.5;
        recruit.equipped.Weapon = "wand_wooden"; recruit.equipped.Body = "armor_robes"; 
    }
    else if (charClass === "Healer") { 
        hpBase = -12; hpLvlScale = 16; 
        mpBase = 2; mpLvlScale = 5; mpStatScale = 1.5;
        recruit.equipped.Weapon = "staff_oak"; recruit.equipped.Body = "armor_robes"; 
    }

    recruit.maxHp = Math.max(15, Math.floor(hpBase + (level * hpLvlScale) + (charStats.CON * hpConScale)));

    if (charClass === "Paladin") {
        recruit.maxMp = Math.floor(mpBase + (level * mpLvlScale) + (charStats.WIS * mpStatScale));
    } else if (charClass === "Healer") {
        recruit.maxMp = Math.floor(mpBase + (level * mpLvlScale) + (charStats.WIS * mpStatScale));
    } else if (charClass === "Mage") {
        recruit.maxMp = Math.floor(mpBase + (level * mpLvlScale) + (charStats.INT * mpStatScale));
    } else if (charClass !== "Bard") {
        recruit.maxMp = 0;
    }

    recruit.hp = recruit.maxHp;
    recruit.mp = recruit.maxMp;

    return recruit;
};


window.generateRandomParty = function() {
    const races = ["Human", "Elf", "Dwarf", "Halfling", "Vibrant"];
    const isAllowed = (race, charClass) => {
        if (charClass === "Bard") return true;
        if (race === "Vibrant") return charClass === "Bard";
        if (charClass === "Paladin") return race === "Human";
        if (charClass === "Warrior") return race !== "Halfling";
        if (charClass === "Healer") return ["Human", "Elf", "Halfling"].includes(race);
        return true;
    };

    let newParty = [];
    let slots = [
        { cls: "Paladin", race: null }, // Random Paladin
        { cls: "Warrior", race: null }, // Random Warrior
        { cls: "Bard", race: "Vibrant" }, // Vibrant Bard
        { cls: "Rogue", race: null }, // Random Rogue
        { cls: "Mage", race: null }, // Random Mage
        { cls: "Healer", race: null } // Random Healer
    ];

    slots.forEach(slot => {
        let race = slot.race;
        if (!race) {
            let possibleRaces = races.filter(r => isAllowed(r, slot.cls));
            race = possibleRaces[Math.floor(Math.random() * possibleRaces.length)];
        }
        newParty.push(window.generateNewCharacter(race, slot.cls, 1));
    });

    return newParty;
};


window.generateRecruits = function(shopEnt) {
    shopEnt.recruits = [];
    let townLevel = worldMaps[currentMapId].townLevel || 1;
    let races = ["Human", "Elf", "Dwarf", "Halfling", "Vibrant"];
    let classes = ["Warrior", "Paladin", "Rogue", "Bard", "Mage", "Healer"];
    let genders = ["m", "f"];

    // 🌟 STRICT RULES ENGINE
    const isAllowed = (race, charClass) => {
        if (charClass === "Bard") return true; // Everyone can be a Bard
        if (race === "Vibrant") return charClass === "Bard"; // Vibrant MUST be Bard
        if (charClass === "Paladin") return race === "Human"; // Paladin MUST be Human
        if (charClass === "Warrior") return race !== "Halfling"; // Warrior cannot be Halfling
        if (charClass === "Healer") return ["Human", "Elf", "Halfling"].includes(race); // Dwarf/Vibrant cannot be Healer
        return true; // Mage and Rogue are open to all allowed
    };

    let generatedCombos = new Set();
    let generatedNames = new Set();

    function buildRecruit(race, charClass, gender, level) {
        let nameList = (nameDB[race] && nameDB[race][gender]) ? nameDB[race][gender] : ["Adventurer"];
        let charName;
        let nameAttempts = 0;
        do { 
            charName = nameList[Math.floor(Math.random() * nameList.length)]; 
            nameAttempts++; 
            if(nameAttempts > 50) charName += " " + Math.floor(Math.random() * 1000); 
        } while (generatedNames.has(charName));
        generatedNames.add(charName);

        return window.generateNewCharacter(race, charClass, level, gender, charName);
    }

    // Pass 1: Mandatory Classes
    let mandatoryClasses = ["Warrior", "Paladin", "Rogue", "Mage", "Healer"];
    mandatoryClasses.forEach(cls => {
        let race, gender, comboKey;
        let attempts = 0;
        do {
            race = races[Math.floor(Math.random() * races.length)];
            gender = genders[Math.floor(Math.random() * genders.length)];
            comboKey = `${race}_${cls}_${gender}`;
            attempts++;
        } while ((!isAllowed(race, cls) || generatedCombos.has(comboKey)) && attempts < 200);

        generatedCombos.add(comboKey);
        shopEnt.recruits.push(buildRecruit(race, cls, gender, Math.max(1, townLevel - 1)));
    });

    // Pass 2: Vibrant Bard
    let vBardAttempts = 0;
    do {
        let g = genders[Math.floor(Math.random() * genders.length)];
        let key = `Vibrant_Bard_${g}`;
        if (!generatedCombos.has(key)) {
            generatedCombos.add(key);
            shopEnt.recruits.push(buildRecruit("Vibrant", "Bard", g, Math.max(1, townLevel - 1)));
            break;
        }
        vBardAttempts++;
    } while (vBardAttempts < 10);

    // Pass 3: Fill Remaining
    for (let i = shopEnt.recruits.length; i < 18; i++) {
        let race, charClass, gender, comboKey;
        let attempts = 0;
        do {
            race = races[Math.floor(Math.random() * races.length)];
            charClass = classes[Math.floor(Math.random() * classes.length)];
            gender = genders[Math.floor(Math.random() * genders.length)];
            comboKey = `${race}_${charClass}_${gender}`;
            attempts++;
        } while ((!isAllowed(race, charClass) || generatedCombos.has(comboKey)) && attempts < 500);

        if (!generatedCombos.has(comboKey)) {
            generatedCombos.add(comboKey);
            let lvl = Math.max(1, townLevel - (Math.random() < 0.5 ? 2 : 3));
            shopEnt.recruits.push(buildRecruit(race, charClass, gender, lvl));
        }
    }
};


window.openShop = function(shopEnt) {
    activeShop = shopEnt;
    shopMode = 'buy';

    // 🌟 CHECK EXPIRATION: Regenerate if no inventory or if turn count expired
    const isExpired = !activeShop.inventory || (activeShop.expiryTurn && window.gameTurnCounter >= activeShop.expiryTurn);
    const isRecruitsExpired = activeShop.shopType === 'guild_hall' && (!activeShop.recruits || (activeShop.expiryTurn && window.gameTurnCounter >= activeShop.expiryTurn));

    if (activeShop.shopType === 'guild_hall' && isRecruitsExpired) {
        generateRecruits(activeShop);
        activeShop.expiryTurn = window.gameTurnCounter + 1000;
    } 
    else if (activeShop.shopType !== 'healer' && activeShop.shopType !== 'guild_hall' && isExpired) {
        generateShopStock(activeShop);
        activeShop.expiryTurn = window.gameTurnCounter + 1000;
    }

    document.getElementById('sm-name').innerText = shopEnt.name;
    // 🌟 FIX: Force webp format for custom shop interiors
    let interiorFile = shopEnt.interior ? shopEnt.interior.replace('.png', '.webp') : 'shop_interior_generic.webp';
    document.getElementById('sm-image').style.backgroundImage = `url('assets/${interiorFile}?v=${GAME_VERSION}')`;

    let welcomeMsg = shopEnt.welcomeMsg;
    if (!welcomeMsg && typeof SHOP_CFG !== 'undefined' && SHOP_CFG[shopEnt.shopType] && SHOP_CFG[shopEnt.shopType].welcomeMsg) {
        welcomeMsg = SHOP_CFG[shopEnt.shopType].welcomeMsg;
    }
    if (!welcomeMsg) welcomeMsg = "Welcome, traveler! Have a look at my wares.";

    document.getElementById('sm-welcome').innerText = `"${welcomeMsg}"`;

    // 🌟 FIX: Reset the shop tab so Guild Halls don't open to a blank "All" tab!
    if (activeShop.shopType === 'guild_hall') {
        currentShopTab = 'LevelUp';
        document.querySelectorAll('#shop-tabs .inv-tab').forEach(t => t.classList.remove('active'));
        document.getElementById('sm-tab-LevelUp')?.classList.add('active');
    } else {
        currentShopTab = 'All';
        document.querySelectorAll('#shop-tabs .inv-tab').forEach(t => t.classList.remove('active'));
        document.getElementById('sm-tab-All')?.classList.add('active');
    }

    // 🌟 FIX: Maintain EXPLORE state so the game canvas stays active/visible behind the modal
    window.gameState = 'EXPLORE'; 
    document.getElementById('shop-modal').style.display = 'flex';

    // 🌟 FIX: Force render immediately so content appears on the first click
    window.renderShopMenu();
    updateUIState();
};


window.closeGuildInspector = function() {
    document.getElementById('guild-inspector-modal').style.display = 'none';
};

window.openGuildInspector = function(char, actionLabel, canAction, actionCallback) {
    document.getElementById('gi-name').innerText = char.name;

    // 🌟 FIX: Pass null for lookupName and char.name as displayName to fix the 'undefined' overlay title
    const displayName = char.name.replace(/'/g, "\\'");
    document.getElementById('gi-subtitle').innerHTML = `Level ${char.level} <span style="cursor: pointer; color: #0044aa; border-bottom: 1px dashed #0044aa;" onclick="window.showClassInfo('${char.race}', '${char.class}', null, '${displayName}')">${char.race} ${char.class} ℹ️</span>`;

    let pPath = window.getCharPortrait(char);
    let pUrl = char.isSummon ? window.getSpriteDataUrl(pPath) : pPath;
    let portraitDiv = document.getElementById('gi-portrait');

    let imgTest = new Image();
    imgTest.onload = function() { 
        portraitDiv.innerHTML = ''; 
        portraitDiv.style.backgroundImage = `url('${pUrl}')`; 
        portraitDiv.style.backgroundSize = 'contain'; 
        portraitDiv.style.backgroundPosition = 'center center'; 
        portraitDiv.style.backgroundRepeat = 'no-repeat';         
    };
    imgTest.onerror = function() { 
        portraitDiv.style.backgroundImage = 'none'; 
        portraitDiv.innerHTML = '<span style="color:#888;">[ NO PORTRAIT ]</span>'; 
    };
    imgTest.src = pUrl;

    function buildReadOnlyItemSlot(invObj, expectedSlotName) {
        let genericFile = "";
        if (expectedSlotName === 'HELM') genericFile = "slot_helmet.webp";
        else if (expectedSlotName === 'BODY') genericFile = "slot_body.webp";
        else if (expectedSlotName === 'GLOV') genericFile = "slot_gloves.webp";
        else if (expectedSlotName === 'BOOT') genericFile = "slot_boots.webp";
        else if (expectedSlotName === 'WEAP') genericFile = "slot_weapon.webp";
        else if (expectedSlotName === 'OFFH') genericFile = (char.class === 'Bard') ? "slot_instrument.webp" : "slot_offhand.webp";
        else if (expectedSlotName === 'AMMO') genericFile = "slot_ammo.webp";
        else if (expectedSlotName === 'RING') genericFile = "slot_ring.webp";

        if (!invObj) {
            let placeholderHtml = genericFile ? `<div class="item-icon placeholder-icon" style="background-image: url('assets/${genericFile}?v=${GAME_VERSION}');"></div>` : "";
            return `<div class="item-slot empty" style="cursor:default;">${placeholderHtml}</div>`;
        }
        let itemId = typeof invObj === 'string' ? invObj : invObj.id;
        let qty = typeof invObj === 'object' ? invObj.qty : 1;
        let item = itemDB[itemId];
        if (!item) return `<div class="item-slot empty" style="cursor:default;"></div>`;
        let genderExt = char.gender ? char.gender.toLowerCase() : 'm';
        let iconFile = item.icon; 
        if (item.iconM && item.iconF) iconFile = genderExt === 'f' ? item.iconF : item.iconM;
        let imgPath = `assets/${iconFile}?v=${GAME_VERSION}`;
        let qtyHtml = (qty > 1) ? `<div class="item-qty">x${qty}</div>` : '';
        return `<div class="item-slot" style="cursor:default;"><div class="item-icon" style="background-image: url('${imgPath}');"></div>${qtyHtml}</div>`;
    }

    let eq = char.equipped;
    let showAmmo = char.class === 'Rogue';
    let showOffhand = char.class !== 'Mage' && char.class !== 'Healer';

    document.getElementById('gi-eq-ammo').innerHTML = showAmmo ? buildReadOnlyItemSlot(eq.Ammo, 'AMMO') : '';
    document.getElementById('gi-eq-top').innerHTML = buildReadOnlyItemSlot(eq.Helmet, 'HELM');
    document.getElementById('gi-eq-left').innerHTML = buildReadOnlyItemSlot(eq.Body, 'BODY') + buildReadOnlyItemSlot(eq.Weapon, 'WEAP');

    let rightHtml = buildReadOnlyItemSlot(eq.Gloves, 'GLOV');
    if (showOffhand) rightHtml += buildReadOnlyItemSlot(eq.Offhand, 'OFFH');
    document.getElementById('gi-eq-right').innerHTML = rightHtml;

    document.getElementById('gi-eq-bottom').innerHTML = buildReadOnlyItemSlot(eq.Boots, 'BOOT');
    document.getElementById('gi-eq-ring1').innerHTML = buildReadOnlyItemSlot(eq.Ring1, 'RING');
    document.getElementById('gi-eq-ring2').innerHTML = buildReadOnlyItemSlot(eq.Ring2, 'RING');

    let weapId = char.equipped.Weapon;
    let wMin = 1, wMax = 4, isRanged = false, ammoMult = 1.0;

    if (weapId && itemDB[weapId]) { 
        wMin = itemDB[weapId].minDmg || 1; 
        wMax = itemDB[weapId].maxDmg || 4; 
        isRanged = itemDB[weapId].requiresAmmo;

        if (isRanged && char.equipped.Ammo) {
            let ammoId = typeof char.equipped.Ammo === 'object' ? char.equipped.Ammo.id : char.equipped.Ammo;
            if (itemDB[ammoId] && itemDB[ammoId].dmgMult) {
                ammoMult = itemDB[ammoId].dmgMult;
            }
        }
    }

    let statBonus = Math.floor(getStat(char, isRanged ? 'DEX' : 'STR') / 3);
    let lvlBonus = Math.floor(char.level / 2);
    let dmgMult = (1 + (char.level / 15));
    let calcMin = Math.floor((wMin + statBonus + lvlBonus) * dmgMult * ammoMult);
    let calcMax = Math.floor((wMax + statBonus + lvlBonus) * dmgMult * ammoMult);
    let numAttacks = 1;
    if (['Warrior', 'Paladin', 'Rogue', 'Bard'].includes(char.class) && !isRanged) {
        numAttacks += Math.floor(char.level / 7);
    }
    let strikeStr = numAttacks > 1 ? ` <span style="color:#00aa00; font-size:0.9rem;">(x${numAttacks})</span>` : "";

    let totalAc = char.baseAc || 0;['Body', 'Helmet', 'Gloves', 'Boots', 'Offhand'].forEach(s => {
        let id = char.equipped[s];
        if (id && itemDB[id] && itemDB[id].ac) totalAc += itemDB[id].ac;
    });

    let nextXp = window.getXpCost(char.level);
    let xpPct = Math.min(100, Math.max(0, (char.xp / nextXp) * 100));
    let baseTotalXp = window.getBaseXp(char.level);
    let displayXp = baseTotalXp + char.xp;
    let displayNextXp = baseTotalXp + nextXp;

    let statsHtml = `
        <div style="grid-column: span 3; background: rgba(139, 69, 19, 0.05); border: 2px solid rgba(139, 69, 19, 0.2); border-radius: 6px; padding: 8px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 8px; box-shadow: inset 0 0 10px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-around; border-bottom: 1px dashed rgba(139, 69, 19, 0.3); padding-bottom: 8px;">
                <div style="text-align: center; width: 33%;"><div style="font-size: 0.8rem; color: #666; font-weight:bold;">HP</div><div style="color: #cc0000; font-weight: bold; font-size:1.2rem;">${char.hp} / ${char.maxHp}</div></div>
                <div style="text-align: center; width: 33%; visibility: ${char.maxMp > 0 ? 'visible' : 'hidden'};"><div style="font-size: 0.8rem; color: #666; font-weight:bold;">SP</div><div style="color: #0044aa; font-weight: bold; font-size:1.2rem;">${char.mp} / ${char.maxMp}</div></div>
                <div style="text-align: center; width: 33%; cursor: help;" title="XP ${displayXp} / ${displayNextXp} to reach Level ${char.level + 1}">
                    <div style="font-size: 0.8rem; color: #666; font-weight:bold;">XP</div>
                    <div style="color: #5a2e0e; font-weight: bold; font-size:1.2rem;">${displayXp}</div>
                    <div style="width: 70%; height: 4px; background: #222; border: 1px solid #000; margin: 2px auto 0 auto; border-radius: 2px;">
                        <div style="width: ${xpPct}%; height: 100%; background: #00cc00; transition: width 0.3s;"></div>
                    </div>
                </div>
            </div>
            <div style="display: flex; justify-content: space-around; padding-top: 2px;">
                <div style="text-align: center;"><div style="font-size: 0.8rem; color: #666; font-weight:bold;">DMG</div><div style="color: #111; font-weight: bold; font-size:1.2rem;">${calcMin}-${calcMax}${strikeStr}</div></div>
                <div style="text-align: center;"><div style="font-size: 0.8rem; color: #666; font-weight:bold;">ARMOR (AC)</div><div style="color: #111; font-weight: bold; font-size:1.2rem;">${totalAc}</div></div>
            </div>
        </div>
    `;

    for (let[key, val] of Object.entries(char.stats)) { 
        let eff = getStat(char, key);
        let display = (eff > val) ? `<span style="color:#00aa00; font-weight:bold;">${eff}</span>` : (eff < val) ? `<span style="color:#aa0000; font-weight:bold;">${eff}</span>` : `<span style="font-weight:bold; color:#221100;">${val}</span>`;
        statsHtml += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background: rgba(255,255,255,0.4); border: 1px solid rgba(139, 69, 19, 0.15); border-radius: 4px; box-shadow: 1px 1px 0px rgba(0,0,0,0.05);">
                <span style="color: #555; font-size: 0.95rem; font-weight:bold;">${key}</span> ${display}
            </div>`; 
    }

    document.getElementById('gi-stats').innerHTML = statsHtml;

    let btnBox = document.getElementById('gi-action-buttons');
    btnBox.innerHTML = '';

    // Level Up Button
    let actionBtn = document.createElement('button');
    actionBtn.innerText = actionLabel;
    actionBtn.style.flex = "1.5";
    actionBtn.style.height = "60px";
    if (canAction) {
        actionBtn.style.background = "#44aa44";
        actionBtn.style.color = "#fff";
        actionBtn.style.borderColor = "#006600";
        actionBtn.onclick = () => { actionCallback(); closeGuildInspector(); };
    } else {
        actionBtn.disabled = true;
        actionBtn.style.background = "#444";
        actionBtn.style.color = "#888";
    }
    btnBox.appendChild(actionBtn);

    // Rename Button
    let renameBtn = document.createElement('button');
    renameBtn.innerText = "Rename";
    renameBtn.style.flex = "1";
    renameBtn.style.height = "60px";
    renameBtn.style.background = "#225588";
    renameBtn.style.color = "#fff";
    renameBtn.onclick = () => {
        let newName = prompt("Enter new name for " + char.name, char.name);
        if (newName && newName.trim().length > 0) {
            char.name = newName.trim();
            document.getElementById('gi-name').innerText = char.name;
            renderParty();
            if (typeof update === 'function') update();
        }
    };
    btnBox.appendChild(renameBtn);

    // Cancel Button
    let cancelBtn = document.createElement('button');
    cancelBtn.innerText = "Cancel";
    cancelBtn.style.flex = "1";
    cancelBtn.style.height = "60px";
    cancelBtn.style.background = "#555";
    cancelBtn.style.color = "#fff";
    cancelBtn.onclick = closeGuildInspector;
    btnBox.appendChild(cancelBtn);

    document.getElementById('guild-inspector-modal').style.display = 'flex';
};

window.renderShopMenu = function() {
    if (!activeShop) return;

    // 🌟 NEW: Enforce party requirements to leave Guild Hall
    const leaveBtn = document.getElementById('btn-sm-leave');
    if (activeShop.shopType === 'guild_hall') {
        const hasAliveMember = party.some(p => p.name !== "Empty" && p.hp > 0 && !p.isSummon);
        leaveBtn.disabled = !hasAliveMember;
    } else {
        leaveBtn.disabled = false;
    }

    document.getElementById('sm-gold').innerText = sharedGold;
    let grid = document.getElementById('sm-grid');
    grid.innerHTML = '';

    // 🌟 FIX: Reset display states at the start of every render
    document.getElementById('sm-grid').style.display = 'grid';
    document.getElementById('sm-game-container').style.display = 'none';

	// 🌟 NEW: Update the Expiry Timer
    const timerEl = document.getElementById('sm-expiry-timer');
    if (timerEl) {
        if (activeShop.expiryTurn) {
            let turnsLeft = Math.max(0, activeShop.expiryTurn - window.gameTurnCounter);
            timerEl.innerText = `Stock refreshes in ${turnsLeft} turn${turnsLeft === 1 ? '' : 's'}`;
        } else {
            timerEl.innerText = "";
        }
    }

    let btnBuy = document.getElementById('btn-sm-buy');
    let btnSell = document.getElementById('btn-sm-sell');
    let modeTitle = document.getElementById('sm-mode-title');
    let shopTabs = document.getElementById('shop-tabs');

	// ==========================================
    // 🌟 SPECIAL HEALER SERVICE MENU
    // ==========================================
    if (activeShop.shopType === 'healer') {
        btnBuy.style.display = 'none';  
        btnSell.style.display = 'none'; 
        shopTabs.style.display = 'none'; 
        modeTitle.innerText = "Available Services";

        let servicesOffered = 0;

        // 🌟 UPDATED: Accepts imageUrl directly, which can be an Atlas DataURL or a standard file URL
        const addServiceCard = (title, cost, imageUrl, isPortrait, onPurchase) => {
            servicesOffered++;
            let canAfford = sharedGold >= cost;
            let card = document.createElement('div');
            card.className = `sm-item-card ${canAfford ? '' : 'disabled'}`;
            let radius = isPortrait ? '50%' : '4px'; 
            card.innerHTML = `
                <div class="sm-item-icon" style="background-image:url('${imageUrl}'); border-radius: ${radius};"></div>
                <div class="sm-item-details">
                    <div class="sm-item-name">${title}</div>
                    <div class="sm-item-price">Cost: ${cost} G</div>
                </div>
            `;
            card.onclick = () => {
                if (canAfford) {
                    sharedGold -= cost;
                    onPurchase();
                    playCoinSound();
                    logMsg(`<span style="color:#00aa00;">${title} successful.</span>`);
                    window.renderShopMenu();
                    renderParty();
                }
            };
            grid.appendChild(card);
        };

        party.forEach((char) => {
            if (char.name === "Empty") return;

            // 🌟 FIXED: Retrieve the portrait using your atlas-aware system
            // getCharPortrait returns the filename, getSpriteDataUrl converts it to a usable URL
            let pFilename = window.getCharPortrait(char);
            let portraitUrl = window.getSpriteDataUrl(pFilename);

            if (char.hp <= 0) {
                let cost = 2500 + char.maxHp;
                addServiceCard(`Resurrect ${char.name}`, cost, portraitUrl, true, () => {
                    char.hp = char.maxHp;
					char.mp = char.maxMp;
                    char.ailments =[]; 
                });
            } else {
                // 1. CURE AILMENTS
                if (char.ailments && char.ailments.length > 0) {
                    char.ailments.forEach(ailment => {
                        let cost = AILMENT_COSTS[ailment] || 50;
                        addServiceCard(`Cure ${ailment}: ${char.name}`, cost, portraitUrl, true, () => {
                            char.ailments = char.ailments.filter(a => a !== ailment);
                        });
                    });
                }

                // 2. HEAL HP
                if (char.hp < char.maxHp) {
                    let missingHp = char.maxHp - char.hp;
                    addServiceCard(`Heal ${char.name} (${missingHp} HP)`, missingHp, portraitUrl, true, () => {
                        char.hp = char.maxHp;
                    });
                }

                // 3. REPLENISH SP
                if (char.maxMp > 0 && char.mp < char.maxMp) {
                    let missingMp = char.maxMp - char.mp;
                    addServiceCard(`Replenish SP ${char.name} (${missingMp} SP)`, missingMp, portraitUrl, true, () => {
                        char.mp = char.maxMp;
                    });
                }
            }
        });

        if (servicesOffered === 0) grid.innerHTML = `<div style="color:#555; text-align:center; padding:20px; font-style:italic;">Your party is in perfect health and high spirits. The Light smiles upon you.</div>`;
        return;
    }

    // ==========================================
    // 🌟 ADVENTURER'S GUILD MENU
    // ==========================================
    if (activeShop.shopType === 'guild_hall') {
        btnSell.style.display = 'none'; btnBuy.style.display = 'none';
        shopTabs.style.display = 'flex';

        // 🌟 BULLETPROOF TAB HIDING
        // Forcibly hide every single tab inside the container first
        Array.from(shopTabs.children).forEach(tab => tab.style.display = 'none');
		// Then reveal ONLY the three Guild tabs
		['sm-tab-LevelUp', 'sm-tab-Barracks', 'sm-tab-Recruit'].forEach(id => { 
            let el = document.getElementById(id); 
            if(el) el.style.display = 'block'; 
        });

        // 🌟 NEW: Class Styling Configuration
        const classStyleMap = {
            "Warrior": { color: "#a52a2a", icon: "&#59773;" }, // Sword
            "Paladin": { color: "#8b6508", icon: "&#60054;" }, // Shield
            "Rogue":   { color: "#2e8b57", icon: "&#59768;" }, // Bow
            "Mage":    { color: "#0044aa", icon: "&#59830;" }, // Magic
            "Healer":  { color: "#008000", icon: "&#59898;" }, // Heart
            "Bard":    { color: "#cc5500", icon: "&#59899;" }  // Spark/Note
        };

        // Helper to draw character cards safely
        const addGuildCard = (char, title, desc, canAction, actionLabel, onClick) => {
            let card = document.createElement('div');
            // 🌟 Make card always clickable so we can inspect them!
            card.className = `sm-item-card`; 
            card.style.position = 'relative'; // 🌟 Allow absolute icon positioning
            let raceStr = char.race.toLowerCase(); let classStr = char.class.toLowerCase(); let genderStr = char.gender ? char.gender.toLowerCase() : "m";
            let iconFile = `portrait_${raceStr}_${classStr}_${genderStr}.webp?v=${GAME_VERSION}`;

            let clsStyle = classStyleMap[char.class] || { color: "#555", icon: "" };
            let coloredTitle = title.replace(char.class, `<span style="color: ${clsStyle.color}; font-weight: bold;">${char.class}</span>`);

            card.innerHTML = `
                <div class="sm-item-icon" style="background-image:url('assets/${iconFile}'); border-radius: 50%; background-color:#000;"></div>
                <div class="sm-item-details">
                    <div class="sm-item-name">${coloredTitle}</div>
                    <div class="sm-item-price" style="${canAction ? 'color:#006600;' : 'color:#aa0000;'}">${desc}</div>
                </div>
                <div style="position: absolute; bottom: 4px; right: 8px; font-family: 'RPG Awesome'; font-size: 1.2rem; color: ${clsStyle.color}; opacity: 0.6; pointer-events: none;">
                    ${clsStyle.icon}
                </div>
            `;
            // 🌟 Open the inspector!
            card.onclick = () => { openGuildInspector(char, actionLabel, canAction, onClick); };
            grid.appendChild(card);
        };

        if (currentShopTab === 'LevelUp') {
            modeTitle.innerText = "Train Party Members";


            party.forEach(char => {
                if (char.name === "Empty" || char.isSummon) return; // 🌟 FILTERED SUMMONS

                let xpNeeded = window.getXpCost(char.level); 
                // 🌟 FIX: Block dead characters from leveling up!
                let isDead = char.hp <= 0;
                let canLevel = char.xp >= xpNeeded && !isDead;

                // 🌟 NEW: Cumulative XP Display
                let baseTotalXp = window.getBaseXp(char.level);
                let displayXp = baseTotalXp + char.xp;
                let displayNextXp = baseTotalXp + xpNeeded;

                // Let's make the "Ready" message a bit cleaner since total numbers are high now!
                let desc;
                if (isDead) {
                    desc = `Cannot train while dead!`;
                } else if (canLevel) {
                    desc = `Ready to Level Up!`;
                } else {
                    desc = `XP: ${displayXp} / ${displayNextXp}`;
                }

                addGuildCard(char, `${char.name} (Lvl ${char.level} ${char.class})`, desc, canLevel, "⬆️ Level Up", () => {
                    char.xp -= xpNeeded; // Deducts the exact cost, letting you keep the overflow!

                    // 1. Increment Level
                    char.level++;

                    // 2. Class-Aware Stat Gain
					let statKeys = Object.keys(char.stats);
					// Filter stats that are "Primary" based on class
					let primaryStats = [];
					if (char.class === "Warrior") primaryStats = ['STR', 'CON'];
					else if (char.class === "Mage") primaryStats = ['INT'];
					else if (char.class === "Healer") primaryStats = ['WIS'];
					else if (char.class === "Rogue") primaryStats = ['DEX', 'LUK'];
					else if (char.class === "Paladin") primaryStats = ['STR', 'CHA'];
					else if (char.class === "Bard") primaryStats = ['CHA', 'DEX'];

					// 70% chance to roll a primary stat, 30% chance for a random stat
					let rStat;
					if (Math.random() < 0.7 && primaryStats.length > 0) {
						rStat = primaryStats[Math.floor(Math.random() * primaryStats.length)];
					} else {
						rStat = statKeys[Math.floor(Math.random() * statKeys.length)];
					}
					char.stats[rStat]++;

                    // 3. Snapshot current totals for the UI summary
                    let oldMaxHp = char.maxHp;
                    let oldMaxMp = char.maxMp;

                    // 4. RUN FORMULA: This applies the new level-based scaling
                    recalculatePartyStats();

                    // 🌟 FULL HEAL ON LEVEL UP
                    char.hp = char.maxHp;
                    char.mp = char.maxMp;

                    // 5. Calculate gains for the UI
                    let hpGain = char.maxHp - oldMaxHp;
                    let mpGain = char.maxMp - oldMaxMp;

                    // 6. Check for Multi-Strike Milestone
                    let isMartial = ['Warrior', 'Paladin', 'Rogue', 'Bard'].includes(char.class);
                    let gainedStrike = isMartial && (char.level % 7 === 0);

					let logExtra = ""; 

					// 🌟 NEW: Check for unlocked spells/songs!
                    let unlockedSpells = Object.values(spellDB).filter(s => s.classReq === char.class && s.levelReq === char.level);
                    let spellAlert = "";
                    let isBard = char.class === 'Bard';
                    let alertColor = isBard ? '#cc5500' : '#0044aa';

                    if (unlockedSpells.length > 0) {
                        // 🌟 FIXED: Iterate and list ALL spells learned
                        let spellNames = unlockedSpells.map(s => s.name).join(', ');
                        let alertPrefix = isBard ? (unlockedSpells.length > 1 ? '🎵 NEW SONGS' : '🎵 NEW SONG') : (unlockedSpells.length > 1 ? '🌟 NEW SPELLS' : '🌟 NEW SPELL');
                        spellAlert = `\n${alertPrefix}: ${spellNames}!\n`;
                        logExtra += ` <span style="color:${alertColor};">Learned ${spellNames}!</span>`;
                    }

                    // (Update the summary to include the spellAlert)
                    let summary = `*** LEVEL UP! ***\n\n${char.name} reached Level ${char.level}!\n\n`;
                    summary += `+${hpGain} Max HP\n`;

                    if (mpGain > 0) summary += `+${mpGain} Max SP\n`;
                    summary += `+1 ${rStat} (Now ${char.stats[rStat]})\n`;
                    if (gainedStrike) summary += `\n🌟 NEW ABILITY: Extra Strike!\n${char.name} can now attack an additional time per turn!`;
                    summary += spellAlert; // Inject the text!

                    playCoinSound(); 

                    // 🌟 7. POPULATE THE CUSTOM PARCHMENT MODAL
                    document.getElementById('lu-name').innerText = char.name;
                    document.getElementById('lu-subtitle').innerText = `Reached Level ${char.level}!`;

                    let raceStr = char.race.toLowerCase(); 
                    let classStr = char.class.toLowerCase(); 
                    let genderStr = char.gender ? char.gender.toLowerCase() : "m";
                    let portraitPath = `assets/portrait_${raceStr}_${classStr}_${genderStr}.webp?v=${GAME_VERSION}`;

                    let pDiv = document.getElementById('lu-portrait');
                    pDiv.style.backgroundImage = `url('${portraitPath}')`;
                    pDiv.style.backgroundSize = 'contain';
                    pDiv.style.backgroundPosition = 'center center';
                    pDiv.style.backgroundRepeat = 'no-repeat';                    

                    // Build the inner HTML for the stats section
                    let statsHtml = `<div style="color: #aa0000; font-weight: bold;">+${hpGain} Max HP <span style="font-size:1.1rem; color:#666;">(Now ${char.maxHp})</span></div>`;

                    if (mpGain > 0) {
                        let resName = char.class === 'Bard' ? 'Max Songs' : 'Max SP';
                        let resColor = char.class === 'Bard' ? '#cc5500' : '#0044aa';
                        statsHtml += `<div style="color: ${resColor}; font-weight: bold;">+${mpGain} ${resName} <span style="font-size:1.1rem; color:#666;">(Now ${char.maxMp})</span></div>`;
                    }

                    // 🌟 NEW: Added Stat Display Row
                    statsHtml += `<div style="color: #5a2e0e; font-weight: bold; margin-top: 5px;">+1 ${rStat} <span style="font-size:1.1rem; color:#666;">(Now ${char.stats[rStat]})</span></div>`;

                    if (gainedStrike) {
                        statsHtml += `<div style="color: #006600; font-weight: bold; margin-top: 15px; font-size: 1.2rem; background: rgba(0,0,0,0.05); padding: 5px; border: 1px dashed #006600;">🌟 EXTRA STRIKE GAINED! 🌟</div>`;
                    }

                    if (spellAlert !== "") {
                        statsHtml += `<div style="color: ${alertColor}; font-weight: bold; margin-top: 15px; font-size: 1.2rem; background: rgba(0,0,0,0.05); padding: 5px; border: 1px dashed ${alertColor};">${spellAlert.replace(/\n/g, '<br>')}</div>`;
                    }

                    document.getElementById('lu-stats').innerHTML = statsHtml;

                    // Show the modal!
                    document.getElementById('levelup-modal').style.display = 'flex';

                    // Log it in the background
                    logMsg(`<span style="color:#00aa00; font-weight:bold;">${char.name} reached Level ${char.level}! +${hpGain} HP, +1 ${rStat}.${logExtra}</span>`);

                    window.renderShopMenu(); renderParty();
                });
            });
        }

        else if (currentShopTab === 'Barracks') {
            modeTitle.innerText = "Manage Active Party";
            let activeCount = party.filter(c => c.name !== "Empty" && !c.isSummon).length; // 🌟 FILTERED SUMMONS

            // Draw Active Roster
            party.forEach((char, idx) => {
                if (char.name === "Empty" || char.isSummon) return; // 🌟 FILTERED SUMMONS
                let canBench = activeCount > 1; // Can't bench your last member!
                let desc = canBench ? "Currently in Party" : "Cannot bench last member";
                addGuildCard(char, `${char.name} (Active)`, desc, canBench, "🛌 Bench Character", () => {
                    guildRoster.push(char);
                    party[idx] = { name: "Empty", race: "None", class: "Guest", gender: "n", hp: 0, maxHp: 0, mp: 0, maxMp: 0, level: 0, xp: 0, stats: {}, baseAc: 0, equipped: { Weapon: null, Offhand: null, Body: null, Helmet: null, Gloves: null, Boots: null, Ammo: null }, isDefending: false, spells:[], ailments: [] };
                    playCoinSound(); window.renderShopMenu(); renderParty();
                });
            });

            // Draw Benched Roster
            guildRoster.forEach((char, idx) => {
                if (char.isSummon) return; // 🌟 FILTERED SUMMONS
                let canAdd = activeCount < 6;
                let desc = canAdd ? "Waiting in Barracks" : "Party is full!";
                addGuildCard(char, `${char.name} (Benched)`, desc, canAdd, "⚔️ Add to Party", () => {
                    let emptyIdx = party.findIndex(c => c.name === "Empty");
                    if (emptyIdx !== -1) {
                        party[emptyIdx] = char;
                        guildRoster.splice(idx, 1);
                        playCoinSound(); window.renderShopMenu(); renderParty();
                    }
                });
            });
        } 
        else if (currentShopTab === 'Recruit') {
            modeTitle.innerText = "Hire New Adventurers";
            if (activeShop.recruits.length === 0) grid.innerHTML = `<div style="text-align:center; padding:20px; color:#555; font-style:italic;">No new recruits available at this time.</div>`;
            else {
                // 1. Sort recruits by Level descending
                activeShop.recruits.sort((a, b) => b.level - a.level);

                activeShop.recruits.forEach((char, idx) => {
                    let hireCost = char.level * 100;
                    let canAfford = sharedGold >= hireCost;
                    let desc = canAfford ? `Cost: ${hireCost} G` : `Not enough Gold (${hireCost} G)`;

                    // 2. Prepare dynamic styling to shrink the info text if it's long
                    // We split the Name and Info text to maintain Name font-size but shrink the Info font-size
                    let charCard = document.createElement('div');
                    charCard.className = `sm-item-card`;
                    charCard.style.position = 'relative'; // 🌟 Allow absolute icon positioning
                    let raceStr = char.race.toLowerCase(); let classStr = char.class.toLowerCase(); let genderStr = char.gender ? char.gender.toLowerCase() : "m";
                    let iconFile = `portrait_${raceStr}_${classStr}_${genderStr}.webp?v=${GAME_VERSION}`;

                    let clsStyle = classStyleMap[char.class] || { color: "#555", icon: "" };

                    charCard.innerHTML = `
                        <div class="sm-item-icon" style="background-image:url('assets/${iconFile}'); border-radius: 50%; background-color:#000;"></div>
                        <div class="sm-item-details">
                            <div class="sm-item-name" style="display: flex; align-items: baseline; gap: 5px;">
                                <span>${char.name}</span>
                                <span style="font-size: 0.8rem; font-weight: normal; color: #555; white-space: nowrap;">(Lvl ${char.level} ${char.race} <span style="color: ${clsStyle.color}; font-weight: bold;">${char.class}</span>)</span>
                            </div>
                            <div class="sm-item-price" style="${canAfford ? 'color:#006600;' : 'color:#aa0000;'}">${desc}</div>
                        </div>
                        <div style="position: absolute; bottom: 4px; right: 8px; font-family: 'RPG Awesome'; font-size: 1.2rem; color: ${clsStyle.color}; opacity: 0.6; pointer-events: none;">
                            ${clsStyle.icon}
                        </div>
                    `;
                    charCard.onclick = () => { openGuildInspector(char, `🤝 Hire (${hireCost} G)`, canAfford, () => {
                        sharedGold -= hireCost;

                        // 🌟 DYNAMIC HIRE LOGIC: Party first, then Barracks
                        let emptyIdx = party.findIndex(c => c.name === "Empty");
                        if (emptyIdx !== -1) {
                            party[emptyIdx] = char;
                            logMsg(`Hired ${char.name}. They have joined your party!`);
                        } else {
                            guildRoster.push(char);
                            logMsg(`Hired ${char.name}. They are waiting in the Barracks.`);
                        }

                        activeShop.recruits.splice(idx, 1);
                        playCoinSound();
                        window.renderShopMenu();
                        renderParty(); // 🌟 Ensure roster UI is updated
                    }); };
                    grid.appendChild(charCard);
                });
            }
        }
        return; // 🛑 EXIT EARLY! Do not render normal item shop logic!
    }

    // ==========================================
    // 🛒 NORMAL SHOP MENU (Armoury, Potions, etc.)
    // ==========================================

    // Restore normal buttons
    btnBuy.style.display = 'block';  
    btnSell.style.display = 'block';
    shopTabs.style.display = 'flex';

    // 🌟 Hide Guild tabs, show normal tabs conceptually
    ['LevelUp', 'Barracks', 'Recruit'].forEach(id => { let el = document.getElementById('sm-tab-'+id); if(el) el.style.display = 'none'; });

    // 🌟 Enable Game Tab ONLY in Tavern
    let isTavern = activeShop.shopType === 'tavern';
    document.getElementById('sm-tab-Game').style.display = isTavern ? 'block' : 'none';

    if (isTavern && currentShopTab === 'Game') {
        modeTitle.innerText = "Chance Encounter Cards";
        document.getElementById('sm-grid').style.display = 'none';
        document.getElementById('sm-game-container').style.display = 'flex';
        document.getElementById('game-stake').max = (worldMaps[currentMapId].townLevel || 1) * 100;
        return; 
    } else {
        document.getElementById('sm-grid').style.display = 'grid';
        document.getElementById('sm-game-container').style.display = 'none';
    }

    let hasWeapons = false, hasArmor = false, hasConsumables = false, hasInstruments = false, hasAmmo = false;

    // 1. Check tab visibility safely based on the current mode
    if (shopMode === 'buy') {
        btnBuy.innerText = "🛒 Buy Items";
        btnBuy?.classList.add('active'); btnSell.classList.remove('active');
        modeTitle.innerText = "Items for Sale";

        hasWeapons = activeShop.inventory.some(i => { let id = typeof i === 'string' ? i : (i ? i.id : null); return id && itemDB[id] && itemDB[id].tab === 'Weapon'; });
        hasArmor = activeShop.inventory.some(i => { let id = typeof i === 'string' ? i : (i ? i.id : null); return id && itemDB[id] && itemDB[id].tab === 'Armor'; });
        hasConsumables = activeShop.inventory.some(i => { let id = typeof i === 'string' ? i : (i ? i.id : null); return id && itemDB[id] && itemDB[id].tab === 'Consumable'; });
        hasInstruments = activeShop.inventory.some(i => { let id = typeof i === 'string' ? i : (i ? i.id : null); return id && itemDB[id] && itemDB[id].tab === 'Instrument'; });
        hasAmmo = activeShop.inventory.some(i => { let id = typeof i === 'string' ? i : (i ? i.id : null); return id && itemDB[id] && itemDB[id].tab === 'Ammo'; });
    } else if (shopMode === 'sell') {
        btnBuy.innerText = "🛒 Buy Items";
        btnSell?.classList.add('active'); btnBuy.classList.remove('active');
        modeTitle.innerText = "Your Inventory";

        hasWeapons = sharedInventory.some(i => { let id = typeof i === 'string' ? i : (i ? i.id : null); return id && itemDB[id] && itemDB[id].tab === 'Weapon' && shopAcceptsItem(activeShop.shopType, itemDB[id]); });
        hasArmor = sharedInventory.some(i => { let id = typeof i === 'string' ? i : (i ? i.id : null); return id && itemDB[id] && itemDB[id].tab === 'Armor' && shopAcceptsItem(activeShop.shopType, itemDB[id]); });
        hasConsumables = sharedInventory.some(i => { let id = typeof i === 'string' ? i : (i ? i.id : null); return id && itemDB[id] && itemDB[id].tab === 'Consumable' && shopAcceptsItem(activeShop.shopType, itemDB[id]); });
        hasInstruments = sharedInventory.some(i => { let id = typeof i === 'string' ? i : (i ? i.id : null); return id && itemDB[id] && itemDB[id].tab === 'Instrument' && shopAcceptsItem(activeShop.shopType, itemDB[id]); });
        hasAmmo = sharedInventory.some(i => { let id = typeof i === 'string' ? i : (i ? i.id : null); return id && itemDB[id] && itemDB[id].tab === 'Ammo' && shopAcceptsItem(activeShop.shopType, itemDB[id]); });
    }

    // 2. Hide/Show Tabs
    document.getElementById('sm-tab-Weapon').style.display = hasWeapons ? 'block' : 'none';
    document.getElementById('sm-tab-Armor').style.display = hasArmor ? 'block' : 'none';
    document.getElementById('sm-tab-Consumable').style.display = hasConsumables ? 'block' : 'none';

    let instTab = document.getElementById('sm-tab-Instrument');
    if (instTab) instTab.style.display = hasInstruments ? 'block' : 'none';

    let ammoTab = document.getElementById('sm-tab-Ammo');
    if (ammoTab) ammoTab.style.display = hasAmmo ? 'block' : 'none';

    if (currentShopTab !== 'All' && document.getElementById('sm-tab-' + currentShopTab).style.display === 'none') {
        currentShopTab = 'All';
        document.querySelectorAll('#shop-tabs .inv-tab').forEach(t => t.classList.remove('active'));
        document.getElementById('sm-tab-All')?.classList.add('active');
    }

    // 3. Render the specific items to the grid
    let itemsShown = 0;

    if (shopMode === 'buy') {

        // 🌟 NEW: INJECT TAVERN GOSSIP SERVICE
        if (activeShop.shopType === 'tavern' && (currentShopTab === 'All' || currentShopTab === 'Consumable')) {
            itemsShown++;
            let gossipCost = 10;
            let canAfford = sharedGold >= gossipCost;

            let card = document.createElement('div');
            card.className = `sm-item-card ${canAfford ? '' : 'disabled'}`; 
            card.innerHTML = `
                <div class="sm-item-icon" style="background-image:url('${window.getSpriteDataUrl('item_drink_ale.webp')}'); border-radius: 50%; border: 2px solid #fada5e;"></div>
                <div class="sm-item-details">
                    <div class="sm-item-name">Buy a Round of Drinks (Gossip)</div>
                    <div class="sm-item-price" style="${canAfford ? '' : 'color:#aa0000;'}">Cost: ${gossipCost} G</div>
                </div>
            `;
            card.onclick = () => { 
                if (canAfford) {
                    sharedGold -= gossipCost;
                    document.getElementById('sm-gold').innerText = sharedGold;
                    playCoinSound();

                    // 🎲 Generate Gossip!

                    // 1. Find all valid Dungeons in the world
                    let dungeonKeys = Object.keys(worldMaps).filter(k => worldMaps[k].theme === 'dungeon');
                    let randDungKey = dungeonKeys.length > 0 ? dungeonKeys[Math.floor(Math.random() * dungeonKeys.length)] : currentMapId;
                    let dungData = worldMaps[randDungKey];

                    let dName = dungData.name;
                    let dLvl = dungData.level || 1;

                    // 2. Find enemies appropriate for this dungeon's level
                    let validEnemies = enemyBestiary.filter(e => e.level >= Math.max(1, dLvl - 1) && e.level <= dLvl + 2);
                    if (validEnemies.length === 0) validEnemies = enemyBestiary; // Failsafe

                    // 🌟 Extract the chosen enemy AND its category!
                    let chosenEnemy = validEnemies[Math.floor(Math.random() * validEnemies.length)];
                    let enemyName = chosenEnemy.name;
                    let pluralEnemy = enemyName.endsWith('s') ? enemyName : enemyName + 's';
                    let category = chosenEnemy.category || "monster";

                    let locStr = dName;

                    // 3. 🌟 GENERIC RUMORS (Applies to all enemy types)
                    let rumors =[
                        `A guard told me he barely escaped some ${pluralEnemy} in ${dName} yesterday...`,
                        `They say ${locStr} is swarming with ${pluralEnemy}. Watch your step!`,
                        `Keep your weapons sharp if you're heading to ${locStr}. The ${pluralEnemy} are particularly vicious right now.`,
                        `An adventurer came in here last night shaking like a leaf. Said ${dName} is crawling with ${pluralEnemy}.`,
                        `We lost a good courier to a mob of ${pluralEnemy} near ${dName} just three days ago.`,
                        `Old Pete swears he saw a massive horde of ${pluralEnemy} creeping around ${locStr}.`,
                        `If you're delving into ${dName}, keep an ear out for ${pluralEnemy}. You'll usually hear them before you see them.`,
                        `I had to patch up a mercenary this morning. ${pluralEnemy} chewed up his armor pretty bad over at ${locStr}.`,
                        `Make sure your healer has plenty of mana. The ${pluralEnemy} roaming ${locStr} take no prisoners.`,
                        `I wouldn't set foot in ${dName} right now for all the gold in the realm. Too many ${pluralEnemy} for my liking.`
                    ];

                    // 4. 🌟 SPECIFIC RUMORS (Applies based on Bestiary category)
                    if (category === 'beast' || category === 'monster') {
                        rumors.push(
                            `I've heard there's a nasty pack of ${pluralEnemy} lurking down on ${locStr}.`,
                            `Did you hear? Someone found a nest of ${pluralEnemy} down in ${dName}.`,
                            `Don't let your torches go out in ${locStr}... that's when the hungry ${pluralEnemy} strike.`,
                            `You didn't hear this from me, but some scavengers stirred up a den of ${pluralEnemy} deep inside ${dName}.`,
                            `Some fools went looking for quick treasure in ${dName}. Only thing they found were hungry ${pluralEnemy}.`,
                            `Rumor has it a particularly nasty breed of ${pluralEnemy} has claimed ${dName} as their hunting ground.`
                        );
                    } else if (category === 'humanoid') {
                        rumors.push(
                            `I've heard a rough gang of ${pluralEnemy} set up a hideout down on ${locStr}.`,
                            `Did you hear? Someone stumbled into a camp of ${pluralEnemy} down in ${dName}.`,
                            `Don't flash your gold around ${locStr}... that's when the ${pluralEnemy} try to ambush you.`,
                            `You didn't hear this from me, but those ${pluralEnemy} have been stockpiling stolen loot deep inside ${dName}.`,
                            `Some fools went looking for a fight in ${dName}. They got captured by a band of ${pluralEnemy}.`,
                            `Rumor has it a well-armed syndicate of ${pluralEnemy} has claimed ${dName} as their territory.`
                        );
                    } else if (category === 'undead') {
                        rumors.push(
                            `They say an unholy curse is raising a horde of ${pluralEnemy} down on ${locStr}.`,
                            `Did you hear? A tomb of ${pluralEnemy} was disturbed down in ${dName}.`,
                            `Don't let your torches go out in ${locStr}... the ${pluralEnemy} hate the light.`,
                            `You didn't hear this from me, but dark magic is animating ${pluralEnemy} deep inside ${dName}.`,
                            `A cleric tried to cleanse ${dName} last week. The ${pluralEnemy} chased him right back out.`,
                            `Rumor has it the restless spirits of ${dName} are manifesting as ${pluralEnemy}.`
                        );
                    }

                    let rumor = rumors[Math.floor(Math.random() * rumors.length)];

                    // 🗣️ Make the Barkeep speak it in the UI!
                    document.getElementById('sm-welcome').innerText = `"${rumor}"`;
                    document.getElementById('sm-welcome').style.color = "#0044aa"; 

                    // Log it for when they leave the shop
                    logMsg(`<span style="color:#8b6508; font-weight:bold; font-style:italic;">The barkeep leans in... "${rumor}"</span>`);
                    window.renderShopMenu(); // Refresh affordable items
                }
            };
            grid.appendChild(card);
        }

        activeShop.inventory.forEach((invObj, idx) => {
			if (!invObj) return; 
			let itemId = typeof invObj === 'string' ? invObj : invObj.id;
			let item = itemDB[itemId];
			if (!item) return; 

			if (currentShopTab !== 'All' && item.tab !== currentShopTab) return;
			itemsShown++;

			let qty = typeof invObj === 'object' ? invObj.qty : 1;
			let price = item.value;
			let canAfford = sharedGold >= price;
			let qtyStr = qty > 1 ? ` (x${qty})` : '';

			// Resolve via Atlas or File
			let iconFile = item.icon || item.iconM;
			let iconPath = window.getSpriteDataUrl(iconFile);

			let card = document.createElement('div');
			card.className = `sm-item-card`; 
			card.innerHTML = `
				<div class="sm-item-icon" style="background-image:url('${iconPath}');"></div>
				<div class="sm-item-details">
					<div class="sm-item-name">${item.name}${qtyStr}</div>
					<div class="sm-item-price" style="${canAfford ? '' : 'color:#aa0000;'}">Cost: ${price} G</div>
				</div>
			`;
			card.onclick = () => { openItemModal(`shopbuy:${idx}`); };
			grid.appendChild(card);
		});

    } else if (shopMode === 'sell') {
        sharedInventory.forEach((invObj, idx) => {
            if (!invObj) return;

            let itemId = typeof invObj === 'string' ? invObj : invObj.id;
            let item = itemDB[itemId];
            if (!item) return;

            if (!shopAcceptsItem(activeShop.shopType, item)) return;
            if (currentInvTab !== 'All' && item.tab !== currentInvTab) return;
            itemsShown++;

            let qty = typeof invObj === 'object' ? invObj.qty : 1;
            let sellPrice = Math.max(1, Math.floor(item.value * 0.5));
            let qtyStr = qty > 1 ? ` (x${qty})` : '';

            // Resolve via Atlas or File
            let iconFile = item.icon || item.iconM;
            let iconPath = window.getSpriteDataUrl(iconFile);

            let card = document.createElement('div');
            card.className = 'sm-item-card';
            card.innerHTML = `
                <div class="sm-item-icon" style="background-image:url('${iconPath}');"></div>
                <div class="sm-item-details">
                    <div class="sm-item-name">${item.name}${qtyStr}</div>
                    <div class="sm-item-price sell">Sell: ${sellPrice} G</div>
                </div>
            `;
            card.onclick = () => openItemModal(`shopsell:${idx}`);
            grid.appendChild(card);
        });
    }

    if (itemsShown === 0) {
        let msg = shopMode === 'buy' ? 
            `No ${currentShopTab !== 'All' ? currentShopTab + 's' : 'Items'} available here.` : 
            `You have no ${currentShopTab !== 'All' ? currentShopTab + 's' : 'items'} that this shop wants to buy.`;
        grid.innerHTML = `<div style="color:#555; text-align:center; padding:20px; font-style:italic;">${msg}</div>`;
    }
};


// Map the HTML Buttons (Reset to 'All' when switching between buy/sell!)
document.getElementById('btn-sm-buy').onclick = () => { shopMode = 'buy'; window.setShopTab('All'); };
document.getElementById('btn-sm-sell').onclick = () => { shopMode = 'sell'; window.setShopTab('All'); };
document.getElementById('btn-sm-leave').onclick = () => {
    activeShop = null;
    player.dir = (player.dir + 2) % 4;
    document.getElementById('shop-modal').style.display = 'none';
    logMsg("You step back out into the street.");
    if(typeof update === 'function') update(); 
};

// ==========================================
// 🕳️ DUNGEON TRAP ENGINE
// ==========================================

window.promptTrapDisarm = function(trap) {
    // 🌟 Darkness Restriction
    if (window.isDark(player.x, player.y)) {
        logMsg("It is too dark to safely inspect or disarm any traps.");
        return;
    }

    // 🌟 Update Title
    document.querySelector('#chest-modal h2').innerText = "Who disarms the trap?";
	document.getElementById('chest-modal-cancel-btn').innerText = "Don't touch the trap";

    let listDiv = document.getElementById('cm-list'); 
    listDiv.innerHTML = '';

    // 🌟 Sort: Rogues who are conscious move to the front
    let eligibleMembers = party
        .map((p, index) => ({ p, index }))
        .filter(item => item.p.name !== "Empty" && item.p.hp > 0)
        .sort((a, b) => {
            const aIsRogue = a.p.class === 'Rogue';
            const bIsRogue = b.p.class === 'Rogue';
            return bIsRogue - aIsRogue;
        });

    eligibleMembers.forEach((member) => {
        let p = member.p;
        let idx = member.index;
        let isRogue = p.class === 'Rogue';

        let btn = document.createElement('div');
        btn.className = 'sm-item-card';
        btn.style.width = '100%';
        btn.style.boxSizing = 'border-box';
        btn.style.margin = '0';
        btn.style.padding = '10px 15px';
        btn.style.justifyContent = 'space-between';

        // 🌟 Visual Highlight for Rogues
        btn.style.border = isRogue ? '2px solid #8b6508' : '1px solid rgba(139, 69, 19, 0.3)';
        btn.style.fontWeight = isRogue ? 'bold' : 'normal';

        let effDex = window.getEffectiveStat(getStat(p, 'DEX'));
        let portrait = window.getCharPortrait(p);

        btn.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <div class="bf-sprite" style="width: 48px; height: 48px; background-image: url('${portrait}'); background-size: contain; background-position: center bottom; background-repeat: no-repeat; border-radius: 50%; border: 2px solid #5a2e0e; background-color: #000;"></div>
                <div style="display: flex; flex-direction: column;">
                    <div style="font-size:1.3rem; color:#5a2e0e;">${isRogue ? '★ ' : ''}${p.name}</div>
                    <div style="color:#5a2e0e; font-size:0.95rem;">Effective DEX: ${effDex}</div>
                </div>
            </div>
            <div style="font-size:1.5rem;">⚠️</div>
        `;

        btn.onclick = () => {
            document.getElementById('chest-modal').style.display = 'none';

            // 🌟 Use the TRAP_DATABASE for the description
            const trapData = TRAP_DATABASE[trap.trapLevel] || { name: "Unknown mechanism" };

            // 🌟 Calculate roll using Effective Stat + Class Bonus for Rogues
            let rogueBonus = isRogue ? 5 : 0;
            let disarmRoll = Math.floor(Math.random() * 20) + effDex + rogueBonus;
            let difficulty = trap.trapLevel * 2;

            if (disarmRoll > difficulty) {
                logMsg(`<span style="color:#00aa00;">${p.name} disarmed the trap! It was a ${trapData.name} trap.</span>`);
                trap.state = 'disarmed'; 
                window.syncEntityPersistence(); // <--- ADDED: Save state immediately!
            } else {
                logMsg(`<span style="color:#aa0000;">${p.name} triggered the trap!</span>`);
                window.triggerChestTrap(trap.trapLevel, idx);
                trap.state = 'triggered';
                window.syncEntityPersistence(); // <--- ADDED: Save state immediately!
            }
            if(typeof update === 'function') update();
        };
        listDiv.appendChild(btn);
    });

    document.getElementById('chest-modal').style.display = 'flex';
};


window.promptChestOpener = function(fX, fY, chestIndex) {
    let listDiv = document.getElementById('cm-list');
    listDiv.innerHTML = '';
	// 🌟 RESET TITLE EXPLICITLY
    document.querySelector('#chest-modal h2').innerText = "Who opens the chest?";
	document.getElementById('chest-modal-cancel-btn').innerText = "Leave it closed";

    // 🌟 Sort: Conscious Rogues to the top
    let eligibleMembers = party
        .map((p, index) => ({ p, index }))
        .filter(item => item.p.name !== "Empty" && item.p.hp > 0)
        .sort((a, b) => {
            const aIsRogue = a.p.class === 'Rogue';
            const bIsRogue = b.p.class === 'Rogue';
            return bIsRogue - aIsRogue; // Rogues first
        });

    eligibleMembers.forEach((member) => {
        let p = member.p;
        let idx = member.index;
        let isRogue = p.class === 'Rogue';

        let btn = document.createElement('div');
        btn.className = 'sm-item-card';
        btn.style.width = '100%';
        btn.style.boxSizing = 'border-box';
        btn.style.margin = '0';
        btn.style.padding = '10px 15px';
        btn.style.justifyContent = 'space-between';

        // 🌟 Visual Highlight for Rogues
        btn.style.border = isRogue ? '2px solid #8b6508' : '1px solid rgba(139, 69, 19, 0.3)';
        btn.style.fontWeight = isRogue ? 'bold' : 'normal';

        // Effective Dexterity display
        let effDex = window.getEffectiveStat(getStat(p, 'DEX'));
        let portrait = window.getCharPortrait(p);

        btn.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <div class="bf-sprite" style="width: 48px; height: 48px; background-image: url('${portrait}'); background-size: contain; background-position: center bottom; background-repeat: no-repeat; border-radius: 50%; border: 2px solid #5a2e0e; background-color: #000;"></div>
                <div style="display: flex; flex-direction: column;">
                    <div style="font-size:1.3rem; color:#5a2e0e;">${isRogue ? '★ ' : ''}${p.name}</div>
                    <div style="color:#5a2e0e; font-size:0.95rem;">Effective DEX: ${effDex}</div>
                </div>
            </div>
            <div style="font-size:1.5rem;">🗝️</div>
        `;

        btn.onclick = () => {
            document.getElementById('chest-modal').style.display = 'none';
            window.executeChestOpen(idx, fX, fY, chestIndex);
        };
        listDiv.appendChild(btn);
    });

    document.getElementById('chest-modal').style.display = 'flex';
};

window.executeChestOpen = function(openerIndex, fX, fY, chestIndex) {
    let ent = entities[chestIndex];
    if (!ent || ent.state !== 'closed') return; 

    ent.state = 'open'; // Persist the state change
    window.syncEntityPersistence(); // <--- ADDED: Save state immediately!

    let dLvl = typeof dungeonLevel !== 'undefined' ? dungeonLevel : 1;
    let opener = party[openerIndex];

    // 🌟 1. CHECK FOR TRAPS (25% Base Chance)
    let isTrapped = Math.random() < 0.25;
    if (isTrapped) {
        // 🌟 NEW: Unified Scaling for Chest Trap Disarming
        let effDex = window.getEffectiveStat(getStat(opener, 'DEX'));
        let effLuk = window.getEffectiveStat(getStat(opener, 'LUK'));
        let statTotal = effDex + effLuk;
        let rogueBonus = (opener.class === 'Rogue') ? 0.20 : 0; // 20% flat boost for Rogues

        // Rogues cap at 90% success now (with bonus), others cap at 40%
        let disarmChance = (opener.class === 'Rogue') 
            ? Math.min(0.90, (statTotal / 80) + rogueBonus) 
            : Math.min(0.40, (statTotal / 200));

        if (Math.random() < disarmChance) {
            logMsg(`<span style="color:#00aa00; font-style:italic;">${opener.name} detects and carefully disarms a trap on the chest!</span>`);
        } else {
            window.triggerChestTrap(dLvl, openerIndex);
        }
    }

    // 🌟 2. ROLL FOR LOOT
    let goldFound = 0; let itemFound = null; let itemQty = 1;
    if (Math.random() >= 0.4) {
        goldFound = Math.floor(Math.random() * (dLvl * 5)) + 1;
        if (Math.random() < 0.4) {
            itemFound = generateLootDrop(dLvl);
            // 🌟 FIXED: Dynamically check the itemDB for the isAmmo property
            if (itemFound && itemDB[itemFound] && itemDB[itemFound].isAmmo === true) {
                itemQty = Math.floor(Math.random() * 9) + 2; 
            }
        }
    }

    sharedGold += goldFound; 
    let txt = goldFound > 0 ? `${opener.name} opens the chest and finds ${goldFound} Gold!` : `${opener.name} opens the chest... but it is empty!`;
    if (itemFound) {
        let wasAdded = addLootToInventory(itemFound, itemQty);
        let itemName = itemQty > 1 ? `${itemQty} ${itemDB[itemFound].name}s` : `a ${itemDB[itemFound].name}`;

        if (wasAdded) { txt = `${opener.name} opens the chest and finds ${goldFound} Gold and ${itemName}!`; } 
        else { txt += ` Found ${itemName}, but Party Inventory is full!`; }
    }
    logMsg(txt); 
    if(typeof update === 'function') update();
};



// ==========================================
// 🕳️ DUNGEON TRAP ENGINE
// ==========================================
window.triggerChestTrap = function(dLvl, openerIndex) {
    // 1. Calculate the trap level
    let r = Math.random();
    let trapLevel = Math.max(1, Math.min(10, Math.ceil(dLvl + (r < 0.5 ? 0 : (r < 0.8 ? 1 : 2)))));

    // 2. Fetch data from DB
    const trapData = TRAP_DATABASE[trapLevel];
    let opener = party[openerIndex];
    if (!opener || opener.hp <= 0) return; 

    let logStr = `<span style="color:#aa0000; font-weight:bold;">IT'S A ${trapData.name.toUpperCase()} TRAP!</span>`;
    let baseDmg = Math.floor((Math.random() * 4 + 4) * dLvl);
    let finalDmg = Math.floor(baseDmg * trapData.dmgMult);

	window.playSfx('trap_trigger.ogg'); // 🌟 PLAY TRAP SFX

    // 🌟 Helper Processor
    const processVictim = (char, dmg, ailment, isInstant) => {
        let dexDodge = window.getEffectiveStat(getStat(opener, 'DEX'));
		let lukDodge = window.getEffectiveStat(getStat(opener, 'LUK'));
		let dodgeChance = dexDodge + Math.floor(lukDodge / 2);

        if (Math.random() * 100 < dodgeChance) {
            logStr += `<br><span style="color:#00aa00;">- ${char.name} nimbly dodges!</span>`;
            return;
        }

        if (isInstant && Math.random() < 0.5) {
            char.hp = 0;
            logStr += `<br><span style="color:#8b0000; font-weight:bold;">- ${char.name} is instantly slain!</span>`;
            return;
        }

        if (dmg > 0) {
            char.hp = Math.max(0, char.hp - dmg);
            logStr += `<br><span style="color:#aa0000;">- ${char.name} takes ${dmg} damage!</span>`;
        }

        if (char.hp > 0 && ailment) {
            if (!char.ailments.includes(ailment)) {
                char.ailments.push(ailment);
                if (ailment === 'Frozen') char.frozenSteps = 10;
                logStr += `<br><span style="color:#aa44ff;">- ${char.name} is afflicted with ${ailment}!</span>`;
            }
        }
    };

    // 3. Execution logic based on trap type
    if (trapLevel === 3 || trapLevel === 5 || trapLevel === 6 || trapLevel === 8 || trapLevel === 9) {
        // Group traps (affecting multiple people)
        party.slice(0, 4).forEach(p => { if (p.name !== "Empty" && p.hp > 0) processVictim(p, finalDmg, trapData.ailment, trapData.instantDeath); });
    } else {
        // Single target traps
        processVictim(opener, finalDmg, trapData.ailment, trapData.instantDeath);
    }

    logMsg(logStr);
    renderParty();
};


/**
 * 🗺️ DONJON MAP PARSER
 * Converts 5e Random Dungeon Generator JSON into game-compatible formats.
 */
window.parseDonjonMap = function(data) {
    const { cell_bit, cells, rooms } = data;

    // 1. Convert to 0/1 grid
    let rawGrid = cells.map(row => 
        row.map(c => ((c & cell_bit.block) || (c & cell_bit.perimeter) ? 1 : 0))
    );

    // 2. Find bounding box
    let minR = cells.length, maxR = 0, minC = cells[0].length, maxC = 0;
    cells.forEach((row, r) => {
        row.forEach((cell, c) => {
            if (cell !== 0) {
                if (r < minR) minR = r;
                if (r > maxR) maxR = r;
                if (c < minC) minC = c;
                if (c > maxC) maxC = c;
            }
        });
    });

    // 3. Force 29x29 square
    const SIZE = 29; 
    const map = Array.from({ length: SIZE }, () => Array(SIZE).fill(1));

    // 🌟 CONFIGURABLE OFFSETS: 
    // Adjust these by 0 or 1 until the dungeon sits perfectly centered.
    const xOffset = 1; // Shifting X by 1 moves the dungeon right
    const yOffset = 0; // Shifting Y by 0 keeps the current height alignment

    // 4. Stamp into map
    for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
            let targetY = (r - minR) + yOffset; 
            let targetX = (c - minC) + xOffset;

            if (targetY >= 0 && targetY < SIZE && targetX >= 0 && targetX < SIZE) {
                map[targetY][targetX] = rawGrid[r][c];
            }
        }
    }

    // 5. Force Perimeter Walls
    for (let i = 0; i < SIZE; i++) {
        map[0][i] = 1; map[SIZE - 1][i] = 1;
        map[i][0] = 1; map[i][SIZE - 1] = 1;
    }

    // 6. Parse Entities with same offsets
    const doors = [];
    const entities = [];
    const doorKeywords = ['archway', 'portcullis', 'door', 'locked'];

    rooms.forEach(room => {
        if (!room) return;

        let ox = (room.col - minC) + xOffset;
        let oy = (room.row - minR) + yOffset;

        if (room.doors) {
            for (let dir in room.doors) {
                room.doors[dir].forEach(d => {
                    const lowerDesc = (d.desc || "").toLowerCase();
                    if (doorKeywords.some(key => lowerDesc.includes(key))) {
                        doors.push({ 
                            x: (d.col - minC) + xOffset, 
                            y: (d.row - minR) + yOffset, 
                            axis: (dir === 'east' || dir === 'west') ? 'x' : 'y', // 🌟 FIX: Aligned Donjon JSON to match new logic!
                            type: 'wooden', 
                            state: 'closed' 
                        });
                    }
                });
            }
        }

        if (room.contents && room.contents.detail && room.contents.detail.hidden_treasure) {
            entities.push({ x: ox, y: oy, type: 'chest', state: 'closed' });
        }
    });

    return { map, doors, entities };
};

window.convertImageToMap = function(img) {
    console.log("--- Executing Automatic Pixel-to-Map Scan ---");
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false; // 🌟 FIX: Prevent blurry edge artifacts from creating fake doors
    ctx.drawImage(img, 0, 0);

    const gridWidth = img.width;
    const gridHeight = img.height;

    const grid = [];
    const doors = [];

    // 🌟 OPTIMIZATION: Pull all image data at once instead of per-pixel
    const imgData = ctx.getImageData(0, 0, gridWidth, gridHeight);
    const data = imgData.data;

    // PASS 1: Build the grid
    for (let y = 0; y < gridHeight; y++) {
        grid[y] = [];
        for (let x = 0; x < gridWidth; x++) {
            const index = (y * gridWidth + x) * 4;
            const r = data[index], g = data[index+1], b = data[index+2], a = data[index+3];

            // Ignore fully transparent pixels
            if (a < 128) {
                grid[y][x] = 0;
                continue;
            }

            // WALL: Dark/Black (Darker than 100)
            if (r < 100 && g < 100 && b < 100) {
                grid[y][x] = 1;
            } 
            // 🌟 DOOR: Grey (Broadened range: 80-180 to catch slight color shifts)
            else if (r >= 80 && r <= 180 && g >= 80 && g <= 180 && b >= 80 && b <= 180) {
                grid[y][x] = 0;
                doors.push({ x, y, type: 'wooden', state: 'closed' });
            } 
            else {
                grid[y][x] = 0;
            }
        }
    }

    // PASS 2: Determine Axis based on neighboring walls
    doors.forEach(d => {
        const x = d.x, y = d.y;
        const left = (x > 0) ? grid[y][x-1] : 0;
        const right = (x < gridWidth - 1) ? grid[y][x+1] : 0;
        const up = (y > 0) ? grid[y-1][x] : 0;
        const down = (y < gridHeight - 1) ? grid[y+1][x] : 0;

        if (left === 1 && right === 1) {
            d.axis = 'y'; 
        } else if (up === 1 && down === 1) {
            d.axis = 'x';
        } else {
            d.axis = 'x'; 
        }
    });

    return { map: grid, doors: doors };
};

async function loadExternalMapData(mapId) {
    const mapConfig = worldMaps[mapId];
    if (!mapConfig) return;

    // 🌟 Helper to re-apply any entities loaded from a save file after map generation
    const applySavedData = () => {
        if (window.savedDynamicData && window.savedDynamicData[mapId]) {
            if (window.savedDynamicData[mapId].entities) mapConfig.entities = window.savedDynamicData[mapId].entities;

            // 🌟 FIX: Only override mapConfig.doors if saved data actually HAS doors. 
            // Prevents a bug where an old save file with an empty doors array deletes newly generated doors!
            if (window.savedDynamicData[mapId].doors && window.savedDynamicData[mapId].doors.length > 0) {
                mapConfig.doors = window.savedDynamicData[mapId].doors;
            }
        }

        // 🌟 SCRUB COLLECTED QUEST ITEMS AND MESSAGES
        // This ensures that even if stale dynamicData is applied, items in your inventory stay off the map!
        if (mapConfig.entities) {
            mapConfig.entities = mapConfig.entities.filter(ent => {
                if (ent.type === 'quest') {
                    let inQuest = questInventory.some(i => i && i.isQuestItem && i.itemType === ent.itemType);
                    let inShared = sharedInventory.some(i => i && i.isQuestItem && i.itemType === ent.itemType);
                    return !inQuest && !inShared;
                } else if (ent.type === 'message') {
                    let inQuest = questInventory.some(i => i && i.isQuestItem && i.title === ent.desc && i.type === ent.msgType && i.part === ent.part);
                    let inShared = sharedInventory.some(i => i && i.isQuestItem && i.title === ent.desc && i.type === ent.msgType && i.part === ent.part);
                    return !inQuest && !inShared;
                }
                return true;
            });

            // Sync back to dynamic data just in case
            if (window.savedDynamicData && window.savedDynamicData[mapId]) {
                window.savedDynamicData[mapId].entities = mapConfig.entities;
            }
        }
    };

    if (mapConfig.map && mapConfig.map.length > 0) {
        applySavedData();
        return;
    }

    console.log(`[MapLoader] Attempting PNG import for: ${mapId}`);
    const pngResult = await tryLoadPNG(mapId, mapConfig);

    if (pngResult) {
        applySavedData();
        // 🌟 CRITICAL: Use the mapConfig.map dimensions to force the grid creation
        discoveredMaps[mapId] = discoveredMaps[mapId] || Array.from({ length: mapConfig.map.length }, () => Array(mapConfig.map[0].length).fill(0));
        discoveredMap = discoveredMaps[mapId]; // Update the global pointer

        if (typeof update === 'function') update(); 
        return;
    }

    if (mapConfig.useExternalMap) {
        try {
            const response = await fetch(mapConfig.useExternalMap);
            const jsonData = await response.json();
            const parsed = window.parseDonjonMap(jsonData);
            mapConfig.map = parsed.map;
            mapConfig.doors = parsed.doors;
            mapConfig.entities = parsed.entities;

            applySavedData(); // Overwrite defaults with saved data!

            // 🌟 INIT DISCOVERY HERE
            if (!discoveredMaps[mapId]) {
                discoveredMaps[mapId] = Array.from({ length: mapConfig.map.length }, () => Array(mapConfig.map[0].length).fill(0));
            }
            discoveredMap = discoveredMaps[mapId];

            delete mapConfig.useExternalMap;
            if (typeof update === 'function') update();
        } catch (err) {
            console.error("[MapLoader] Critical error:", err);
        }
    } else {
        applySavedData();
    }
}

function tryLoadPNG(mapId, mapConfig) {
    return new Promise((resolve) => {
        const img = new Image();
        const imgPath = `assets/maps/${mapId}.png?v=${GAME_VERSION}`;

        img.onload = () => {

            const parsed = window.convertImageToMap(img);
            mapConfig.map = parsed.map;
            mapConfig.doors = parsed.doors;
            resolve(true);
        };

        img.onerror = () => {
            console.log(`[MapLoader] Image failed to load at ${imgPath}. Check file path/name.`);
            resolve(false);
        };

        img.src = imgPath;
    });
}

async function initializeGame() {      
    if (!window.atlasesLoaded) {
        console.log("Waiting for atlases to finish preloading...");
        await window.preloadAllAtlasesPromise;
    }

    await loadExternalMapData(currentMapId);
    const mapData = worldMaps[currentMapId];

    if (!mapData || !mapData.map || mapData.map.length === 0) {
        console.error(`[initializeGame] Map Data for ${currentMapId} not found or invalid!`);
        const btn = document.getElementById('btn-start-game');
        if(btn) { btn.disabled = false; btn.innerText = "New Game"; }
        alert("Critical Error: Map configuration failed to load. Check that your map image or data exists.");
        return Promise.reject("Map missing");
    }

    // 1. Bind globals
    map = mapData.map;
    entities = mapData.entities || [];

    // 2. Fix/Initialize Discovery Array
    if (!discoveredMaps) discoveredMaps = {};
    const needsInit = !discoveredMaps[currentMapId] || 
                      discoveredMaps[currentMapId].length !== map.length || 
                      discoveredMaps[currentMapId][0].length !== map[0].length;

    if (needsInit) {
        discoveredMaps[currentMapId] = Array.from({ length: map.length }, () => 
            Array(map[0].length).fill(0)
        );
    }
    discoveredMap = discoveredMaps[currentMapId]; 

    // 3. Sync Entities
    syncEntitiesToGrid(map, entities);

    doors = mapData.doors || [];
    dungeonLevel = mapData.level;
    WALL_TYPE_NAME = mapData.wallName;

    // 4. Update UI
    window.refreshBanner();
    window.preloadEnemiesForLevel(dungeonLevel);   
    updateUIState();

    // 5. Final render
    return new Promise((resolve) => {
        if (mapData.theme === 'dungeon') {
            window.preloadDungeonAssets(mapData.wallName, () => {
                if (typeof update === 'function') update();
                resolve();
            });
        } else {
            if (typeof update === 'function') update();
            resolve();
        }
    });
}


const bigMapLegend = document.getElementById('big-map-legend-box');
if (bigMapLegend) {
    bigMapLegend.addEventListener('click', (e) => {
        console.log("Legend clicked!"); // DEBUG

        const item = e.target.closest('.legend-item');
        if (!item) return;

        const name = item.dataset.name;
        const canTravel = item.dataset.travel === 'true';

        console.log("Detected click on:", name, "Can travel:", canTravel); // DEBUG

        if (name && canTravel) {
            window.tryFastTravel(name);
        } else if (name && !canTravel) {
            console.log("Fast travel conditions not met for:", name);
        }
    });
}

window.dungeonGuardians = {}; 

window.tryTriggerGuardedEntrance = function(ent) {
    const tId = ent.targetMap;
    const cfg = worldMaps[tId];

    // 🌟 UPDATED: Only trigger guardian if we are coming from the wilderness!
    const isGuardian = cfg && cfg.theme === 'dungeon' && !window.dungeonGuardians[tId]?.defeated && worldMaps[currentMapId].theme === 'wilderness';
    const isGatekeeper = cfg && cfg.theme === 'town' && cfg.gatekeeper && !window.townGatekeepersDefeated.includes(tId);

    if (!isGuardian && !isGatekeeper) {
        loadMap(tId, ent.spawnX, ent.spawnY, ent.spawnDir);
        return;
    }

    window.preCombatPos = { x: player.x, y: player.y };

    let enemyName = isGuardian ? window.dungeonGuardians[tId]?.data.name : cfg.gatekeeper;
    let customName = isGatekeeper ? cfg.gatekeeperName : null; 

    if (isGuardian && !window.dungeonGuardians[tId]) {
        let guardianLvl = (cfg.level || 1) + 2;
        let candidates = enemyBestiary.filter(e => e.level === guardianLvl);
        if (candidates.length === 0) candidates = enemyBestiary;
        let data = candidates[Math.floor(Math.random() * candidates.length)];
        initCombat(data.name);
        window.dungeonGuardians[tId] = { data, horde: [...window.combatState.enemies], defeated: false };
    } else if (isGuardian) {
        window.combatState.enemies = [...window.dungeonGuardians[tId].horde];
        initCombat(window.dungeonGuardians[tId].data.name);
    } else {
        initCombat(enemyName, customName); 
    }

    window.activeGuardianId = isGuardian ? tId : null;
    window.activeGatekeeperId = isGatekeeper ? tId : null;
    window.isGuardianEncounter = true;

    if (isGatekeeper) {
        logMsg(`<span style="color:#aa0000; font-weight:bold;">${cfg.gatekeeperName}:</span> ${cfg.gatekeeperDesc}`);
    } else {
        let enemyCounts = {};
        window.combatState.enemies.forEach(e => enemyCounts[e.data.name] = (enemyCounts[e.data.name] || 0) + 1);
        let desc = Object.entries(enemyCounts).map(([n, c]) => c > 1 ? `${c} ${n}s` : `an ${n}`).join(' and ');
        logMsg(`${ent.name} is guarded by ${desc}!`);
    }

    let btnFlee = document.getElementById('btn-pre-flee');
    let btnFight = document.getElementById('btn-start-combat');

    btnFlee.innerText = "🏃 Retreat";
    btnFight.innerText = isGatekeeper ? `⚔️ Fight ${cfg.gatekeeperName}` : "⚔️ Engage";

    btnFlee.onclick = () => {
        window.gameState = 'EXPLORE';
        window.isGuardianEncounter = false;
        window.activeGatekeeperId = null;
        window.activeGuardianId = null; // 🌟 CLEARED HERE TO PREVENT FALSE VICTORIES ON OTHER FIGHTS
        window.resumeMapBgm();
        if (window.preCombatPos) { player.x = window.preCombatPos.x; player.y = window.preCombatPos.y; }
        updateUIState();
        if (typeof update === 'function') update();
    };

    btnFight.onclick = () => {
        if (isGatekeeper) {
            window.townGatekeepersDefeated.push(tId);
            localStorage.setItem('townGatekeepersDefeated', JSON.stringify(window.townGatekeepersDefeated));
        }

        window.gameState = 'COMBAT';
        updateUIState();

        // 🌟 DYNAMIC LOG
        if (isGatekeeper) {
             logMsg(`<span class="log-combat">Combat!</span> ${cfg.gatekeeperName} attacks!`);
        } else {
             logMsg(`<span class="log-combat">Combat!</span> The guardian attacks!`);
        }

        startCombatRound();
    };
};


function compileMapFromEntities(mapData) {
    // 1. Get the existing map or a default size
    let grid = (mapData.map && mapData.map.length > 0) 
               ? mapData.map 
               : Array.from({ length: 30 }, () => Array(30).fill(0));

    // 2. Loop through entities
    if (mapData.entities) {
        mapData.entities.forEach(ent => {
            // Ensure we use the actual grid dimensions
            if (ent.y >= 0 && ent.y < grid.length && ent.x >= 0 && ent.x < grid[0].length) {
                if (ent.type === 'town_footprint') {
                    grid[ent.y][ent.x] = 2; // City Wall
                } 
                else if (ent.type === 'dungeon_entrance') {
                    grid[ent.y][ent.x] = 3; // Dungeon Entrance
                }
            } else {
                console.warn(`Entity ${ent.name} is out of bounds at ${ent.x}, ${ent.y}`);
            }
        });
    }
    return grid;
}

function syncEntitiesToGrid(mapGrid, entityList) {
    if (!entityList) return;

    entityList.forEach(ent => {
        // Determine which coordinates to stamp
        let rX = ent.wallX !== undefined ? ent.wallX : ent.x;
        let rY = ent.wallY !== undefined ? ent.wallY : ent.y;

        // Bounds checking
        if (rY >= 0 && rY < mapGrid.length && rX >= 0 && rX < mapGrid[0].length) {

            // Only stamp if it's a structural footprint
            if (ent.type === 'town_footprint') {
                mapGrid[rY][rX] = 2; // Sets the tile to a City Wall
            } 
            else if (ent.type === 'dungeon_entrance') {
                mapGrid[rY][rX] = 3; // Sets the tile to a Dungeon Entrance
            }
            // 🌟 FIX: Mark dungeon_gate as a wall (1) so the renderer processes the tile
            else if (ent.type === 'dungeon_gate') {
                mapGrid[rY][rX] = 1; 
            }
        }
    });
}

window.triggerForgeInteraction = function(ent) {
    const requiredItems = ['fork_earth', 'fork_gale', 'fork_flow', 'fork_ember', 'fork_dark', 'fork_aether', 'fork_blood', 'key_forge'];

    // 🌟 FIX: Check BOTH inventories for quest items since they migrate!
    let heldItems = questInventory.filter(i => i && i.isQuestItem).map(i => i.itemType)
        .concat(sharedInventory.filter(i => i && i.isQuestItem).map(i => i.itemType));

    let missingItems = requiredItems.filter(type => !heldItems.includes(type));

    if (missingItems.length > 0) {
        logMsg("The forge remains silent and cold. It seems to be waiting for a key and seven distinct harmonic forks.");
        return;
    }

    // Modal Setup
    document.querySelector('#chest-modal h2').innerText = "Who will unlock the Harmonic Forge?";
    document.getElementById('chest-modal-cancel-btn').innerText = "Back away";
    let listDiv = document.getElementById('cm-list'); 
    listDiv.innerHTML = '';

    // 🌟 FIX: Iterate the FULL party array so indices (0-5) are consistent
    party.forEach((p, i) => {
        const isAlive = (p.name !== "Empty" && p.hp > 0);
        const isVibrantBard = (p.race === 'Vibrant' && p.class === 'Bard');

        let btn = document.createElement('div');
        btn.className = 'sm-item-card';
        btn.style.width = '100%'; btn.style.margin = '0'; btn.style.padding = '10px 15px';

        // 🌟 Visual feedback for dead/empty slots
        if (!isAlive) {
            btn.style.opacity = "0.5";
            btn.style.filter = "grayscale(1)";
            btn.style.cursor = "not-allowed";
        } else {
            btn.style.border = isVibrantBard ? '2px solid #fada5e' : '1px solid rgba(139, 69, 19, 0.3)';
        }

        let portrait = window.getCharPortrait(p);

        btn.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="width: 48px; height: 48px; background-image: url('${portrait}'); background-size: contain; background-repeat: no-repeat; border-radius: 50%; background-color:#000;"></div>
                <div style="font-size:1.3rem; color:${isAlive ? '#5a2e0e' : '#666'};">${isAlive && isVibrantBard ? '★ ' : ''}${p.name}</div>
            </div>
        `;

        if (isAlive) {
            btn.onclick = () => {
                document.getElementById('chest-modal').style.display = 'none';
                window.executeForgeUnlock(i, ent); // Pass the TRUE index i
            };
        }
        listDiv.appendChild(btn);
    });

    document.getElementById('chest-modal').style.display = 'flex';
};

window.checkPartyDefeat = function() {
    const aliveMembers = party.filter(p => p.name !== "Empty" && p.hp > 0 && !p.isSummon);

    // Debug logging to track exactly why/when it triggers
    console.log("Defeat Check triggered. Alive members:", aliveMembers.length);

    if (aliveMembers.length === 0) {
        logMsg("Your entire party has fallen...");
        window.showGameOver();
        return true; // Returns true if party is defeated
    }
    return false;
};

window.executeForgeUnlock = function(openerIndex, ent) {
    let opener = party[openerIndex];
    let isVibrantBard = (opener.race === 'Vibrant' && opener.class === 'Bard');

    if (!isVibrantBard) {
        logMsg(`<span style="color:#aa0000; font-weight:bold;">${opener.name} attempts to touch the Forge, but the Harmonic energy tears them apart!</span>`);
        opener.hp = 0;
        renderParty();
        return;
    }

    // Success Logic
    logMsg(`<span style="color:#00aa00; font-weight:bold;">${opener.name} strikes a chord with the tuning forks! The Forge hums, consumes the items, and yields... The Silent Baton! As you pick up the Baton, the forge appears to shudder and crumbles into dust.</span>`);

    // 1. Remove Old Quest Items from questInventory
    const questItemTypes = ['fork_earth', 'fork_gale', 'fork_flow', 'fork_ember', 'fork_dark', 'fork_aether', 'fork_blood', 'key_forge'];
    for(let i = questInventory.length - 1; i >= 0; i--) {
        if (questInventory[i] && questItemTypes.includes(questInventory[i].itemType)) {
            questInventory.splice(i, 1);
        }
    }

    // 2. Manually construct the Baton object
    let baton = { 
        id: 'quest_item', 
        qty: 1, 
        isQuestItem: true, 
        itemType: 'silent_baton', 
        content: `A legendary weapon against the Lyre-Wight, forged by ${opener.name} from the pieces of the seven harmonic tuning forks.`, 
        title: "The Silent Baton", 
        type: 'quest', 
        location: "White Palace Forge" 
    };

    // 3. Add Baton to Quest Inventory and get the index
    questInventory.push(baton);
    let idx = questInventory.length - 1;

    // 4. Trigger Modal immediately (using 'true' for questInventory)
    window.openQuestModal(idx, true);

    // 5. Remove entity from map
    entities = entities.filter(e => e !== ent);

    // 6. PERSISTENCE FIX
    if (worldMaps[currentMapId]) {
        worldMaps[currentMapId].entities = entities;
        if (window.savedDynamicData && window.savedDynamicData[currentMapId]) {
            window.savedDynamicData[currentMapId].entities = entities;
        }
    }

    if(typeof update === 'function') update();
};


// ==========================================
// 💾 SAVE / LOAD ENGINE
// ==========================================

window.saveGame = async function() {
    // 1. SYNC CURRENT MAP BEFORE SAVING
    window.syncEntityPersistence();

    // Check if we were in fullscreen before the save process began
    const wasFullscreen = !!document.fullscreenElement;

    // Compile dynamically changed variables for all maps
    let dynamicData = {};
    for (let key in worldMaps) {
        if (window.savedDynamicData && window.savedDynamicData[key]) {
            dynamicData[key] = {
                entities: window.savedDynamicData[key].entities,
                doors: window.savedDynamicData[key].doors
            };
        } else if (worldMaps[key].entities || worldMaps[key].doors) {
            dynamicData[key] = {
                entities: worldMaps[key].entities,
                doors: worldMaps[key].doors
            };
        }
    }

    let saveData = {
        version: GAME_VERSION,
        gameTurnCounter: window.gameTurnCounter,
        currentMapId: currentMapId,
        player: player,
        sharedGold: sharedGold,
        sharedInventory: sharedInventory,
        questInventory: questInventory, // 🌟 FIXED: Now saving the quest inventory!
        party: party,
        guildRoster: guildRoster,
        unlockedCards: unlockedCards,
        townGatekeepersDefeated: window.townGatekeepersDefeated,
        dungeonGuardians: window.dungeonGuardians,
        partyEffects: window.partyEffects,
        discoveredMaps: discoveredMaps,
        dynamicData: dynamicData,
        lastVisitedTown: window.lastVisitedTown,
        lastTownSpawn: window.lastTownSpawn,
        dungeonLevel: typeof dungeonLevel !== 'undefined' ? dungeonLevel : 1,
        settings: {
            graphics: parseInt(localStorage.getItem('lyrewight_graphics') || "0"),
            music: localStorage.getItem('audio_music') !== 'false',
            sfx: localStorage.getItem('audio_sfx') !== 'false',
            fullscreen: wasFullscreen,
            combatSpeed: window.combatSpeedMultiplier
        }
    };

    // 2. Validate compression
    const jsonString = JSON.stringify(saveData);
    const compressed = LZString.compressToUTF16(jsonString);

    if (!compressed || compressed.length === 0) {
        logMsg("<span style='color:#aa0000; font-weight:bold;'>Save Error: Data compression failed. File not written.</span>");
        return;
    }

    // 🌟 NEW: Extracted the fallback Blob download into a reliable helper function
    const fallbackDownload = () => {
        try {
            const blob = new Blob([compressed], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            let downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", url);
            downloadAnchorNode.setAttribute("download", "lyrewight_save_" + Date.now() + ".json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();

            // 🌟 Delay revocation to ensure the browser has time to start the download
            setTimeout(() => URL.revokeObjectURL(url), 5000);

            logMsg("<span style='color:#00aa00; font-weight:bold;'>Game Saved Successfully.</span>");
        } catch (err) {
            console.error("Download save failed:", err);
            logMsg("<span style='color:#aa0000; font-weight:bold;'>Save Error: Download failed.</span>");
        } finally {
            if (wasFullscreen) window.enterFullScreen();
        }
    };

    // 3. Robust File Writing
    // 🌟 FIX: Detect Electron. FileSystemWritableFileStream is often blocked by Electron's security policy,
    // resulting in the OS creating a blank file before throwing an error. We skip the picker if in Electron.
    const isElectron = navigator.userAgent.toLowerCase().includes('electron');

    if ('showSaveFilePicker' in window && !isElectron) {
        let fileHandle;
        try {
            fileHandle = await window.showSaveFilePicker({
                suggestedName: `lyrewight_save_${Date.now()}.json`,
                types: [{ description: 'JSON Save File', accept: { 'application/json': ['.json'] } }],
            });

            const writable = await fileHandle.createWritable();
            await writable.write(compressed);
            await writable.close();

            logMsg("<span style='color:#00aa00; font-weight:bold;'>Game Saved Successfully.</span>");
            if (wasFullscreen) window.enterFullScreen();

        } catch (err) { 
            if (err.name !== 'AbortError') {
                console.warn("SaveFilePicker failed, attempting fallback...", err);
                // 🌟 FIX: If the picker fails to write (creates a 0-byte file), seamlessly fire the fallback!
                fallbackDownload();
            } else {
                if (wasFullscreen) window.enterFullScreen();
            }
        }
    } else {
        // Fallback for older browsers and Electron executables using the standard Blob
        fallbackDownload();
    }
};


window.quickSave = function() {
    if (window.gameState !== 'EXPLORE' && window.gameState !== 'HOUSE') {
        logMsg("<span style='color:#aa0000;'>You can only quicksave while safely exploring.</span>");
        return;
    }

    // 🌟 SYNC CURRENT MAP BEFORE SAVING
    window.syncEntityPersistence();

    let dynamicData = {};
    for (let key in worldMaps) {
        // 🌟 FIX: Pull from savedDynamicData to preserve unvisited map states
        if (window.savedDynamicData && window.savedDynamicData[key]) {
            dynamicData[key] = { 
                entities: window.savedDynamicData[key].entities, 
                doors: window.savedDynamicData[key].doors 
            };
        } else if (worldMaps[key].entities || worldMaps[key].doors) {
            dynamicData[key] = { 
                entities: worldMaps[key].entities, 
                doors: worldMaps[key].doors 
            };
        }
    }

    let saveData = {
        version: GAME_VERSION,
		gameTurnCounter: window.gameTurnCounter,
        currentMapId: currentMapId,
        player: player,
        sharedGold: sharedGold,
        sharedInventory: sharedInventory,
        questInventory: questInventory, // 🌟 FIXED: Now saving the quest inventory!
        party: party,
        guildRoster: guildRoster,
        unlockedCards: unlockedCards,
        townGatekeepersDefeated: window.townGatekeepersDefeated,
        dungeonGuardians: window.dungeonGuardians,
        partyEffects: window.partyEffects,
        discoveredMaps: discoveredMaps,
        dynamicData: dynamicData,
        lastVisitedTown: window.lastVisitedTown,
        lastTownSpawn: window.lastTownSpawn,
        dungeonLevel: typeof dungeonLevel !== 'undefined' ? dungeonLevel : 1,
        // 🌟 ADDED: Persist Audio/Gfx settings
        settings: {
            graphics: parseInt(localStorage.getItem('lyrewight_graphics') || "0"),
            music: localStorage.getItem('audio_music') !== 'false',
            sfx: localStorage.getItem('audio_sfx') !== 'false'
        }
    };

    let compressed = LZString.compressToUTF16(JSON.stringify(saveData));
    localStorage.setItem('lyrewight_quicksave', compressed);
    logMsg("<span style='color:#00aa00; font-weight:bold;'>Quicksaved! (F8)<br>Press F9 to Quickload<br>Don't forget to do a full save before you quit!<br>Quicksave doesn't create a loadable save file!</span>");
};


window.loadGame = async function(file) {
    const loadingOverlay = document.getElementById('global-loading-screen');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            let rawData = e.target.result;
            let saveData;

            if (rawData.startsWith('{')) {
                saveData = JSON.parse(rawData);
            } else {
                let decompressed = LZString.decompressFromUTF16(rawData);
                if (!decompressed) throw new Error("Decompression failed");
                saveData = JSON.parse(decompressed);
            }

            if (!saveData.player || !saveData.currentMapId) {
                throw new Error("Invalid save file structure.");
            }

            // 1. Restore core state
            console.log("Restoring core state...");
            window.gameState = 'EXPLORE'; 
            window.combatState.enemies = []; 
			window.gameTurnCounter = saveData.gameTurnCounter || 0;
            currentMapId = saveData.currentMapId;
            player.x = saveData.player.x;
            player.y = saveData.player.y;
            player.dir = saveData.player.dir;
            sharedGold = saveData.sharedGold;

            // 2. Reconstruct arrays
            console.log("Restoring party and inventory...");

            // --- 🌟 QUEST & INVENTORY MIGRATION ENGINE ---
            questInventory.length = 0;
            if (saveData.questInventory) {
                saveData.questInventory.forEach(q => questInventory.push(q));
            }

            for (let i = 0; i < 100; i++) {
                let item = (saveData.sharedInventory && saveData.sharedInventory[i]) ? saveData.sharedInventory[i] : null;
                if (item) {
                    if (item.isQuestItem) {
                        // Prevent duplicate quest items during migration
                        if (!questInventory.some(q => q.title === item.title && q.part === item.part)) {
                            questInventory.push(item);
                        }
                        item = null; // Free up the slot in sharedInventory
                    } else {
                        let id = typeof item === 'string' ? item : item.id;
                        // Purge items that no longer exist in the game database
                        if (!itemDB || !itemDB[id]) {
                            item = null;
                        }
                    }
                }
                sharedInventory[i] = item;
            }
            // ----------------------------------------------

            party.length = 0; 
            saveData.party.forEach(p => {
                // 🌟 REPAIR LEGACY SUMMONS MISSING ENEMYDATA
                if (p.isSummon && !p.enemyData && typeof enemyBestiary !== 'undefined') {
                    p.enemyData = enemyBestiary.find(e => e.name === p.name) || 
                                  enemyBestiary.find(e => e.level === p.level && e.hpMax === p.maxHp) ||
                                  enemyBestiary.find(e => e.level === p.level) ||
                                  enemyBestiary[0];
                }
                party.push(p);
            });

			// Load Settings
            if (saveData.settings) {
                // 🌟 FIX: Pass 'false' to suppress update() until the map is loaded below
                window.applyGraphicsSetting(saveData.settings.graphics, true, false);
                localStorage.setItem('audio_music', saveData.settings.music);
                localStorage.setItem('audio_sfx', saveData.settings.sfx);
                window.combatSpeedMultiplier = saveData.settings.combatSpeed !== undefined ? saveData.settings.combatSpeed : 1.0;
                localStorage.setItem('lyrewight_combatSpeed', window.combatSpeedMultiplier);

                 // 🌟 TRIGGER THE RESTORATION
                if (saveData.settings.fullscreen) {
                    window.armFullscreenRestoration();
                }

                // Update UI toggles
                const musicToggle = document.getElementById('music-toggle');
                const sfxToggle = document.getElementById('sfx-toggle');
                const gfxSelect = document.getElementById('graphics-select');
                const speedSlider = document.getElementById('combat-speed-slider');

                if (musicToggle) musicToggle.checked = saveData.settings.music;
                if (sfxToggle) sfxToggle.checked = saveData.settings.sfx;
                if (gfxSelect) gfxSelect.value = saveData.settings.graphics;
                if (speedSlider) speedSlider.value = 200 - (window.combatSpeedMultiplier * 100);
            }

            // Restore globals
            discoveredMaps = saveData.discoveredMaps || {}; 
            guildRoster = saveData.guildRoster || [];

            // 🌟 REPAIR LEGACY SUMMONS IN BARRACKS
            guildRoster.forEach(p => {
                if (p.isSummon && !p.enemyData && typeof enemyBestiary !== 'undefined') {
                    p.enemyData = enemyBestiary.find(e => e.name === p.name) || 
                                  enemyBestiary.find(e => e.level === p.level && e.hpMax === p.maxHp) ||
                                  enemyBestiary.find(e => e.level === p.level) ||
                                  enemyBestiary[0];
                }
            });

            unlockedCards = saveData.unlockedCards || [];
            localStorage.setItem('unlockedCards', JSON.stringify(unlockedCards));

            window.townGatekeepersDefeated = saveData.townGatekeepersDefeated || [];
            localStorage.setItem('townGatekeepersDefeated', JSON.stringify(window.townGatekeepersDefeated));

            window.dungeonGuardians = saveData.dungeonGuardians || {};
            window.partyEffects = saveData.partyEffects || [];
            window.savedDynamicData = saveData.dynamicData || {};
            window.lastVisitedTown = saveData.lastVisitedTown || 'barrowtown';
            window.lastTownSpawn = saveData.lastTownSpawn || { x: 6, y: 10, dir: 0 };

            // 3. Re-initialize maps and engine
            console.log("Initializing map engine...");
            await initializeGame(); 

            // 4. RESET MODAL STATE
            activeModalCharIndex = null;
            document.getElementById('char-modal').style.display = 'none';
            document.getElementById('options-modal').style.display = 'none';

            document.getElementById('start-screen').style.display = 'none';

            // 5. Refresh UI components
            console.log("Refreshing UI components...");
            renderParty(); 
            updateEffectsUI(); 
            window.refreshBanner(); 

            if (typeof update === 'function') {
                update(); 
            }

            if (window.currentBgmAudio) window.fadeOutAudio(window.currentBgmAudio, true);
            if (window.isMusicEnabled() && worldMaps[currentMapId].bgm) {
                window.playBgm(worldMaps[currentMapId].bgm);
            }

            // 🌟 SUCCESS MESSAGE
            if (saveData.settings && saveData.settings.fullscreen) {
                logMsg("<span style='color:#00aa00; font-weight:bold;'>Game Loaded Successfully. Click anywhere to restore full screen.</span>");
            } else {
                logMsg("<span style='color:#00aa00; font-weight:bold;'>Game Loaded Successfully.</span>");
            }
            console.log("Load process complete.");
            if (loadingOverlay) loadingOverlay.style.display = 'none';

        } catch(err) {
            console.error("CRITICAL LOAD ERROR:", err);
            alert("Failed to load save file. Check console for details.");
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        }
    };
    reader.readAsText(file);
};


window.quickLoad = async function() {
    let compressed = localStorage.getItem('lyrewight_quicksave');
    if (!compressed) {
        logMsg("<span style='color:#aa0000;'>No quicksave found.</span>");
        return;
    }

    const loadingOverlay = document.getElementById('global-loading-screen');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';

    try {
        let decompressed = LZString.decompressFromUTF16(compressed);
        let saveData = JSON.parse(decompressed);

        window.gameState = 'EXPLORE'; // 🌟 FIX: Force explore mode 
        window.combatState.enemies = []; // 🌟 FIX: Clear combat state
		window.gameTurnCounter = saveData.gameTurnCounter || 0; 
        currentMapId = saveData.currentMapId;
        player.x = saveData.player.x;
        player.y = saveData.player.y;
        player.dir = saveData.player.dir;
        sharedGold = saveData.sharedGold;

        // --- 🌟 QUEST & INVENTORY MIGRATION ENGINE ---
        questInventory.length = 0;
        if (saveData.questInventory) {
            saveData.questInventory.forEach(q => questInventory.push(q));
        }

        for (let i = 0; i < 100; i++) {
            let item = (saveData.sharedInventory && saveData.sharedInventory[i]) ? saveData.sharedInventory[i] : null;
            if (item) {
                if (item.isQuestItem) {
                    if (!questInventory.some(q => q.title === item.title && q.part === item.part)) {
                        questInventory.push(item);
                    }
                    item = null; // Free up the slot in sharedInventory
                } else {
                    let id = typeof item === 'string' ? item : item.id;
                    // Purge items that no longer exist in the game database
                    if (!itemDB || !itemDB[id]) {
                        item = null;
                    }
                }
            }
            sharedInventory[i] = item;
        }
        // ----------------------------------------------

        // 🌟 BUG FIX: Completely rebuild the array dynamically instead of looping by boot length!
        party.length = 0; 
        saveData.party.forEach(p => {
            // 🌟 REPAIR LEGACY SUMMONS MISSING ENEMYDATA
            if (p.isSummon && !p.enemyData && typeof enemyBestiary !== 'undefined') {
                p.enemyData = enemyBestiary.find(e => e.name === p.name) || 
                              enemyBestiary.find(e => e.level === p.level && e.hpMax === p.maxHp) ||
                              enemyBestiary.find(e => e.level === p.level) ||
                              enemyBestiary[0];
            }
            party.push(p);
        });

		// Load Settings
        if (saveData.settings) {
            window.applyGraphicsSetting(saveData.settings.graphics, true);
            localStorage.setItem('audio_music', saveData.settings.music);
            localStorage.setItem('audio_sfx', saveData.settings.sfx);
            window.combatSpeedMultiplier = saveData.settings.combatSpeed !== undefined ? saveData.settings.combatSpeed : 1.0;
            localStorage.setItem('lyrewight_combatSpeed', window.combatSpeedMultiplier);

            const musicToggle = document.getElementById('music-toggle');
            const sfxToggle = document.getElementById('sfx-toggle');
            const gfxSelect = document.getElementById('graphics-select');
            const speedSlider = document.getElementById('combat-speed-slider');

            if (musicToggle) musicToggle.checked = saveData.settings.music;
            if (sfxToggle) sfxToggle.checked = saveData.settings.sfx;
            if (gfxSelect) gfxSelect.value = saveData.settings.graphics;
            if (speedSlider) speedSlider.value = 200 - (window.combatSpeedMultiplier * 100);
        }

        guildRoster = saveData.guildRoster || [];

        // 🌟 REPAIR LEGACY SUMMONS IN BARRACKS
        guildRoster.forEach(p => {
            if (p.isSummon && !p.enemyData && typeof enemyBestiary !== 'undefined') {
                p.enemyData = enemyBestiary.find(e => e.name === p.name) || 
                              enemyBestiary.find(e => e.level === p.level && e.hpMax === p.maxHp) ||
                              enemyBestiary.find(e => e.level === p.level) ||
                              enemyBestiary[0];
            }
        });

        unlockedCards = saveData.unlockedCards || [];
        window.townGatekeepersDefeated = saveData.townGatekeepersDefeated || [];
        window.dungeonGuardians = saveData.dungeonGuardians || {};
        window.partyEffects = saveData.partyEffects || [];
        discoveredMaps = saveData.discoveredMaps || {}; 
        window.savedDynamicData = saveData.dynamicData || {};

        await initializeGame();
        renderParty();
        updateEffectsUI();
        window.refreshBanner();
        logMsg("<span style='color:#00aa00; font-weight:bold;'>Quickloaded successfully (F9).</span>");
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    } catch (err) {
        console.error("Quickload failed", err);
        logMsg("<span style='color:#aa0000;'>Failed to load quicksave.</span>");
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }
};


window.applyGraphicsSetting = function(qualityLevel, persist = true, shouldUpdate = true) {
    const resolutions = [
        { w: 1920, h: 854 },
        { w: 1440, h: 640 },
        { w: 1280, h: 570 },
        { w: 960, h: 427 }
    ];

    const canvas = document.getElementById('view-canvas');
    const res = resolutions[qualityLevel];

    if (canvas) {
        canvas.width = res.w;
        canvas.height = res.h;
        // Re-enable smoothing after canvas resize resets the context state
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
    }

    if (persist) {
        localStorage.setItem('lyrewight_graphics', qualityLevel);
    }

    // Immediately trigger a redraw only if requested
    if (shouldUpdate && typeof update === 'function') update();
};

// ==========================================
// 📺 FULLSCREEN ENGINE
// ==========================================
window.toggleFullScreen = function() {
    // 🌟 Detect iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIOS) {
        logMsg("<span style='color:#aa44ff;'>iOS Safari does not support Full Screen mode. To play in true Full Screen, tap the 'Share' button in Safari and select 'Add to Home Screen'.</span>");
        return;
    }

    if (!document.fullscreenElement && !document.mozFullScreenElement && 
        !document.webkitFullscreenElement && !document.msFullscreenElement) {

        // Enter Fullscreen
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    } else {
        // Exit Fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
};


window.enterFullScreen = function() {
    if (!document.fullscreenElement && !document.mozFullScreenElement && 
        !document.webkitFullscreenElement && !document.msFullscreenElement) {

        let promise;
        if (document.documentElement.requestFullscreen) {
            promise = document.documentElement.requestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            promise = document.documentElement.msRequestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            promise = document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            promise = document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }

        if (promise) {
            promise.catch(err => {
                console.error(`Fullscreen request failed: ${err.message} (${err.name})`);
            });
        }
    }
};


window.armFullscreenRestoration = function() {
    // We use a named function so we can clean it up effectively
    const restoreHandler = () => {
        console.log("Attempting to restore Fullscreen...");

        // The delay is critical. It allows the browser to settle focus 
        // after the file picker / modal has fully closed.
        setTimeout(() => {
            window.enterFullScreen();
            // Once the action is triggered, clean up
            document.removeEventListener('click', restoreHandler);
        }, 150); 
    };

    // Attach to the document body to catch clicks anywhere
    document.addEventListener('click', restoreHandler);
};

window.applyStartingGear = function(startMode) {
    // 1. Clear existing inventory
    sharedInventory.fill(null);

    // 2. Set Gold based on mode
    sharedGold = (startMode === 'guild') ? 1000 : 115;

    // 3. Apply items
    sharedInventory[0] = { id: "potion_hp_1", qty: 2 };
    sharedInventory[1] = { id: "potion_mp_1", qty: 2 };
    sharedInventory[2] = { id: "potion_cure_1", qty: 1 };
	sharedInventory[3] = { id: "potion_cure_2", qty: 1 };
	sharedInventory[4] = { id: "potion_cure_6", qty: 1 };	
    sharedInventory[5] = { id: "torch", qty: 3 };
    sharedInventory[6] = { id: "sword_short", qty: 1 }; 
	sharedInventory[7] = { id: "bow_short_wood", qty: 1 }; 	
	sharedInventory[8] = { id: "arrow_iron", qty: 20 }; 		
    sharedInventory[9] = { id: "gem_quartz", qty: 1 }; 
    sharedInventory[10] = { id: "food_cheese", qty: 3 }; 
    sharedInventory[11] = { id: "drink_water", qty: 2 }; 
	
	//questInventory.push({ 
		//id: 'quest_item', 
        //qty: 1, 
        //isQuestItem: true, 
        //itemType: 'silent_baton', 
        //content: "A legendary weapon against the Lyre-Wight, injected for testing.", 
        //title: "The Silent Baton", 
        //type: 'quest', 
        //location: "Starting Gear" 
    //});
	
	// 🌟 DEBUG: Inject Harmonic Forge Quest Items
    const debugQuestItems = [
        'fork_earth', 'fork_gale', 'fork_flow', 'fork_ember', 
        'fork_dark', 'fork_aether', 'fork_blood', 'key_forge'
    ];
	
	//debugQuestItems.forEach(type => {
        //questInventory.push({ 
            //id: 'quest_item', 
            //qty: 1, 
            //isQuestItem: true, 
            //itemType: type, 
            //content: `Harmonic component ${type} injected for testing.`, 
            //title: `Harmonic Item: ${type}`, 
            //type: 'quest', 
            //location: "Debug Injection" 
        //});
    //});
	
};

window.playIntroSequence = async function(startMode = 'vaults') {
    window.gameStartMode = startMode;
    const introScreen = document.getElementById('intro-screen');
    const introBgContainer = document.getElementById('intro-bg-container');
    const introBg = document.getElementById('intro-bg');
    const introText = document.getElementById('intro-text');
    const btnSkip = document.getElementById('btn-skip-intro');

    introScreen.style.display = 'flex';

    // Play intro music (non-looping)
    window.playBgm('theme_intro', false); 

    const introSleep = ms => new Promise(r => setTimeout(r, ms));

    const slides = [
        {
            text: [
                "The world was sung into existence.", 
				"Every mountain, river, and soul vibrates with the primal melody of Creation.",
                "Or at least, it did."
            ],
            image: "intro_1.webp",
            duration: 14000
        },
        {
            text: [
				"For centuries, silence has been creeping from the edges of the map.",
				"It is not the silence of peace, but the silence of the Lyre-Wight."
			],
            image: "intro_2.webp",
            duration: 19000
        },
        {
            text: [
				"Once a virtuoso of unparalleled grace, she fell into the abyss between notes...", 
				"...and emerged as an abomination of bone and bronze.",
				"Her voice a razor that shreds the soul and unravels the fabric of reality."
			],
            image: "intro_3.webp",
            duration: 18000
        },
        {
            text: [
			"Her song is nearing its Final Note.", 
			"When she sings it, the world will cease to vibrate...",
			"It will simply... stop."
			],
            image: "intro_4.webp",
            duration: 17000
        },
        {
            text: [
			"The cities have fallen into isolation.", 
			"Their gates barred by horrors that serve her symphony.", 
			"The Wildlands are overrun with villains, beasts and monsters.",
			"The citizens of the realm are disappearing."
			],
            image: "intro_5.webp",
            duration: 25000
        },
        {
            text: [
			"But there is a glimmer of hope...", 
			"The Vibrants — the living constructs of resonant bronze — have reappeared.", 
			"Their very existence a counter-frequency to the Lyre-Wight’s rot."
			],
            image: "intro_6.webp",
            duration: 20000
        },
        {
            text: ["A party of heroes has assembled.", 
			"The Bard's instruments are tuned.",
			"The world’s last song is about to begin."
			],
            image: "intro_7.webp", 
            duration: 12000
        }
    ];

    let isStarted = false;

    const finishIntro = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (isStarted) return;
        isStarted = true;

        window.fadeOutBgm();

        // 🌟 CHANGE: Do not hide introScreen immediately. Show Loading text!
        const btnSkip = document.getElementById('btn-skip-intro');
        if (btnSkip) btnSkip.style.display = 'none';

        const introBgContainer = document.getElementById('intro-bg-container');
        if (introBgContainer) introBgContainer.style.opacity = 0; 

        const introText = document.getElementById('intro-text');
        if (introText) {
            introText.innerHTML = "Loading Realm...";
            introText.style.opacity = 1;
        }

        // 🌟 RESET ALL PROGRESS DATA ON NEW GAME START
        unlockedCards = [];
        localStorage.setItem('unlockedCards', JSON.stringify(unlockedCards));
        window.townGatekeepersDefeated = [];
        localStorage.setItem('townGatekeepersDefeated', JSON.stringify(window.townGatekeepersDefeated));
        window.dungeonGuardians = {};   
        window.applyStartingGear(window.gameStartMode);

        // 🌟 FIX: Populate the global party array depending on the start mode
        party.length = 0; // Clear it out completely

        if (window.gameStartMode === 'guild') {
            currentMapId = "barrowtown";
            player.x = 19; player.y = 11; player.dir = 1;
            sharedGold = 1000;
        } else {
            // Generate full party for vaults start and commit it to the global scope
            let newParty = window.generateRandomParty();
            newParty.forEach(p => party.push(p));
        }

        window.cleanPartyRoster(); // Pad with Empty slots if needed
        recalculatePartyStats(); // Ensure HP/MP correctly scales based on the now-populated array

        try {
            await initializeGame();

            // 🌟 NEW: If Guild start, auto-open the Guild Hall menu!
            if (window.gameStartMode === 'guild') {
                let guildEnt = entities.find(e => e.type === 'shop' && e.shopType === 'guild_hall');
                if (guildEnt) {
                    window.openShop(guildEnt);
                }
            }

            if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
            if (window.isMusicEnabled() && worldMaps[currentMapId].bgm) {
                window.playBgm(worldMaps[currentMapId].bgm);
            }

            // 🌟 FINALLY hide the intro screen
            const introScreen = document.getElementById('intro-screen');
            if (introScreen) introScreen.style.display = 'none';
        } catch (err) {
            console.error("Failed to start game:", err);
            const btnStart = document.getElementById('btn-start-game');
            if (btnStart) {
                btnStart.disabled = false;
                btnStart.innerText = "Start at Vaults";
            }
            const btnGuild = document.getElementById('btn-start-guild');
            if (btnGuild) {
                btnGuild.disabled = false;
                btnGuild.innerText = "Start at Guild";
                btnGuild.style.display = 'block';
            }
            document.getElementById('intro-screen').style.display = 'none';
            document.getElementById('start-screen').style.display = 'flex';
        }
    };


    btnSkip.onclick = finishIntro;
    introScreen.onclick = (e) => {
        // Allow clicking the final button, but treat clicks outside it as "skip" 
        // only if the button hasn't been added yet.
        if (isStarted) return;
    };

    // Small delay before starting
    await introSleep(1000);

    for (let i = 0; i < slides.length; i++) {
        if (isStarted) break;
        const slide = slides[i];
        const textSegments = Array.isArray(slide.text) ? slide.text : [slide.text];

        introBg.style.backgroundImage = `url('assets/${slide.image}?v=${GAME_VERSION}')`;
        introBg.classList.remove('intro-image-anim');
        void introBg.offsetWidth; 
        introBg.classList.add('intro-image-anim');
        introBgContainer.style.opacity = 1;

        let segmentDuration = (slide.duration - 1500) / textSegments.length;

        for (let t = 0; t < textSegments.length; t++) {
            introText.innerHTML = textSegments[t];
            introText.style.opacity = 1;

            await introSleep(segmentDuration);
            if (isStarted) break;

            if (t < textSegments.length - 1) {
                introText.style.opacity = 0;
                await introSleep(300);
            }
        }

        if (!isStarted) {
            introText.style.opacity = 0;
            await introSleep(300);
        }
    }

    if (!isStarted) {
        // Visual Sequence finished. Keep final image visible.
        btnSkip.style.display = 'none';
        introText.innerText = ""; 

        const btnStartGame = document.createElement('button');
        btnStartGame.innerText = "Start Curse of the Lyre-Wight";
        btnStartGame.style.cssText = "width: 400px; height: 60px; background: #44aa44; color: #fff; border: 4px solid #006600; font-weight: bold; cursor: pointer; font-size: 1.2rem; z-index: 5;";

        introScreen.appendChild(btnStartGame);

        // Listen for end of audio OR user button click
        if (window.currentBgmAudio) {
            window.currentBgmAudio.onended = finishIntro;
        }
        btnStartGame.onclick = finishIntro;
    }
};

window.initializeGameListeners = function() {
    document.addEventListener('click', function autoFsHandler() {
        if (window.shouldAutoFullscreen) {
            window.toggleFullScreen();
            window.shouldAutoFullscreen = false;
        }
    }, { once: true }); // 'once' ensures it only tries this one time, immediately after a load

    const musicToggle = document.getElementById('music-toggle');
    const sfxToggle = document.getElementById('sfx-toggle');	
	const speedSlider = document.getElementById('combat-speed-slider');

    if (speedSlider) {
        speedSlider.value = 200 - (window.combatSpeedMultiplier * 100);
        speedSlider.addEventListener('input', (e) => {
            let val = parseInt(e.target.value);
            // Translate 0-200 slider (left slow, right fast) into 2.0 to 0.0 multiplier
            window.combatSpeedMultiplier = (200 - val) / 100;
            localStorage.setItem('lyrewight_combatSpeed', window.combatSpeedMultiplier);
        });
    }

    musicToggle.checked = window.isMusicEnabled();
    sfxToggle.checked = window.isSfxEnabled();

    musicToggle.addEventListener('change', (e) => {
        localStorage.setItem('audio_music', e.target.checked);
        if (!e.target.checked) window.fadeOutBgm();
        else window.resumeMapBgm();
    });

    sfxToggle.addEventListener('change', (e) => {
        localStorage.setItem('audio_sfx', e.target.checked);
    });

    const gfxSelect = document.getElementById('graphics-select');
    const savedGfx = localStorage.getItem('lyrewight_graphics') || "0";

    gfxSelect.value = savedGfx;
    window.applyGraphicsSetting(parseInt(savedGfx), false);

    gfxSelect.addEventListener('change', (e) => {
        window.applyGraphicsSetting(parseInt(e.target.value));
    });

    const btnStart = document.getElementById('btn-start-game');
    if (btnStart) {
        btnStart.addEventListener('click', async () => {
            if (btnStart.disabled) return;
            btnStart.disabled = true;
            btnStart.innerText = "Entering..."; 

            const btnGuild = document.getElementById('btn-start-guild');
            if (btnGuild) btnGuild.style.display = 'none';

            // Hide start screen immediately
            document.getElementById('start-screen').style.display = 'none';
            if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

            // Trigger the new Intro Sequence!
            window.playIntroSequence('vaults');
        });
    }

    const btnStartGuild = document.getElementById('btn-start-guild');
    if (btnStartGuild) {
        btnStartGuild.addEventListener('click', async () => {
            if (btnStartGuild.disabled) return;
            btnStartGuild.disabled = true;
            btnStartGuild.innerText = "Entering..."; 

            if (btnStart) btnStart.style.display = 'none';

            // Hide start screen immediately
            document.getElementById('start-screen').style.display = 'none';
            if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

            // Trigger the new Intro Sequence!
            window.playIntroSequence('guild');
        });
    }

    const btnLoad = document.getElementById('btn-load-game');
    if (btnLoad) {
        btnLoad.addEventListener('click', () => {
            if (btnStart && btnStart.disabled) return;
            document.getElementById('load-file-input').click();
        });
    }

    const btnOptsLoad = document.getElementById('btn-opts-load');
    if (btnOptsLoad) {
        btnOptsLoad.addEventListener('click', () => {
            document.getElementById('load-file-input').click();
            document.getElementById('options-modal').style.display = 'none';
        });
    }

    const loadInput = document.getElementById('load-file-input');
    if (loadInput) {
        loadInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                window.loadGame(e.target.files[0]);
                e.target.value = ''; 
            }
        });
    }

    const btnSave = document.getElementById('btn-save-game');
    if (btnSave) {
        btnSave.addEventListener('click', () => {
            if (window.gameState !== 'EXPLORE') {
                alert("You can only save the game while safely exploring.");
                return;
            }
            window.saveGame();
        });
    }

    const btnOpts = document.getElementById('btn-options');
    if (btnOpts) {
        btnOpts.addEventListener('click', () => {
            document.getElementById('options-modal').style.display = 'flex';
        });
    }

    const btnOptsClose = document.getElementById('btn-opts-close');
    if (btnOptsClose) {
        btnOptsClose.addEventListener('click', () => {
            document.getElementById('options-modal').style.display = 'none';
        });
    }

    const btnOptsSave = document.getElementById('btn-opts-save');
    if (btnOptsSave) {
        btnOptsSave.addEventListener('click', () => {
            if (window.gameState !== 'EXPLORE' && window.gameState !== 'HOUSE') {
                alert("You can only save the game while safely exploring.");
                return;
            }
            window.saveGame();
            document.getElementById('options-modal').style.display = 'none';
        });
    }

    const btnOptsRestart = document.getElementById('btn-opts-restart');
    if (btnOptsRestart) {
        btnOptsRestart.addEventListener('click', () => {
            if (confirm("Are you sure you want to restart? All unsaved progress will be lost.")) {
                window.restartGame();
            }
        });
    }

    const btnStartFullscreen = document.getElementById('btn-start-fullscreen');
    if (btnStartFullscreen) {
        btnStartFullscreen.addEventListener('click', () => {
            window.toggleFullScreen();
        });
    }

    const btnOptsFullscreen = document.getElementById('btn-opts-fullscreen');
    if (btnOptsFullscreen) {
        btnOptsFullscreen.addEventListener('click', () => {
            window.toggleFullScreen();
        });
    }
};


// Initialize listeners immediately
window.initializeGameListeners();


