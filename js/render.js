// js/render.js

const REQUIRED_FONTS = ["Almendra", "Eagle Lake", "Parisienne"];
async function preLoadGameFonts() {
    for (const font of REQUIRED_FONTS) {
        try {
            await document.fonts.load(`bold 20px '${font}'`);
            console.log(`Font loaded: ${font}`);
        } catch (e) {
            console.warn(`Font load failed: ${font}`);
        }
    }
}
preLoadGameFonts();

const viewCanvas = document.getElementById('view-canvas');

// 🌟 OPTIMIZED: Removed { willReadFrequently: true } from all rendering contexts. 
// That flag forces the browser to use Software Rendering instead of the GPU, which completely destroyed performance on older systems!
const ctx = viewCanvas.getContext('2d');
const mmCanvas = document.getElementById('minimap-canvas');
const mctx = mmCanvas.getContext('2d');
const bmCanvas = document.getElementById('big-map-canvas');
const bctx = bmCanvas.getContext('2d');
const treeBuffer = document.createElement('canvas');
const treeCtx = treeBuffer.getContext('2d');

const CEILING_DARKNESS = 0.3; 
const SPRITE_SCALE = 0.6; 
const SPRITE_Y_OFFSET = 0.25; 
const O = 1; 
let minimapCellSize = 24; 

let currentLoadedCount = 0;
let totalAssetsToLoad = 0; // 🌟 DYNAMIC TRACKING

window.onAssetLoaded = function() {
    currentLoadedCount++;

    let percent = totalAssetsToLoad > 0 ? Math.floor((currentLoadedCount / totalAssetsToLoad) * 100) : 0;
    let loadingText = `Loading... ${Math.min(100, percent)}%`;

    let btn = document.getElementById('btn-start-game');
    let btnGuild = document.getElementById('btn-start-guild');

    if (currentLoadedCount < totalAssetsToLoad) {
        if (btn) btn.innerText = loadingText;
        if (btnGuild) btnGuild.innerText = loadingText;
    } else if (totalAssetsToLoad > 0) {
        if (window.atlasesLoaded) {
            if (btn && btn.innerText.includes("Loading")) {
                btn.innerText = "Start at Vaults"; 
                btn.disabled = false;
            }
            if (btnGuild && btnGuild.innerText.includes("Loading")) {
                btnGuild.innerText = "Start at Guild";
                btnGuild.disabled = false;
            }
        } else {
            if (btn) btn.innerText = "Loading Atlases...";
            if (btnGuild) btnGuild.innerText = "Loading Atlases...";
        }
    }

    // 🌟 ONLY update if the game has actually started (start-screen is hidden)
    let startScreen = document.getElementById('start-screen');
    if (!startScreen || startScreen.style.display === 'none') {
        if (typeof update === 'function') update();
    }
};


const forgeImg = new Image();
totalAssetsToLoad++;
forgeImg.onload = window.onAssetLoaded;
forgeImg.onerror = window.onAssetLoaded;
forgeImg.src = `assets/quest_harmonic_forge.webp?v=${GAME_VERSION}`;

window.getTrapHtml = function(color, iconSizeString) {
    // This uses an SVG that will perfectly fill the square defined by iconSizeString
    return `
        <div class="legend-color" style="${iconSizeString} display:flex; justify-content:center; align-items:center; background:transparent; border:none;">
            <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                <polygon points="50,10 95,90 5,90" fill="${color}" />
            </svg>
        </div>
    `;
};

let isPollingForAssets = false;

window.ensureAssetsAreDrawn = function() {
    if (isPollingForAssets) return;
    isPollingForAssets = true;

    const poll = () => {
        // Force an update
        if (typeof update === 'function') update();

        // 🌟 CHECK: Are the required textures actually loaded?
        const slug = getWallSlug(WALL_TYPE_NAME);
        const cache = dungeonTextureCache[slug];
        let allLoaded = true;

        if (cache) {
            // Check if every image in the cache has a width > 0
            ['wall', 'floor', 'ceil'].forEach(type => {
                cache[type].forEach(img => { if (!img.complete || img.width === 0) allLoaded = false; });
            });
        }

        if (!allLoaded) {
            requestAnimationFrame(poll); // Keep redrawing until all are loaded
        } else {
            isPollingForAssets = false; // Done!
        }
    };

    requestAnimationFrame(poll);
};

const DOOR_TYPES = {
    'wooden': { cropT: 0.00, cropB: 0.08, cropS: 0.00, holeL: 0.32, holeR: 0.68, holeT: 0.13 }
};
ctx.imageSmoothingEnabled = true;
mctx.imageSmoothingEnabled = false;

/* ================= ASSET LOADER ================= */
const TOWN_HOUSE_CFG = {
    'a': { roofP: 0.02, ridgeFront: 0.00, ridgeSide: 0.00, shadowH: 0.00 },
    'b': { roofP: 0.02, ridgeFront: 0.00, ridgeSide: 0.00, shadowH: 0.00 }, 
    'c': { roofP: 0.02, ridgeFront: 0.00, ridgeSide: 0.00, shadowH: 0.00 }, 
    'd': { roofP: 0.02, ridgeFront: 0.00, ridgeSide: 0.00, shadowH: 0.00 },
    'e': { roofP: 0.02, ridgeFront: 0.00, ridgeSide: 0.00, shadowH: 0.00 },
    'f': { roofP: 0.02, ridgeFront: 0.00, ridgeSide: 0.00, shadowH: 0.00 }
};

const SHOP_CFG = {
    'armoury': { exterior: 'shop_front_armoury.webp', roofP: 0.02, ridgeFront: 0.00, ridgeSide: 0.00, shadowH: 0.00, desc: "There is a small note indicating this shop buys and sells weapons and armour.", welcomeMsg: "Welcome to the forge. Keep your hands off the displays unless you're buying.", textY: 0.320 },
    'healer': { exterior: 'shop_front_healer.webp', roofP: 0.02, ridgeFront: 0.00, ridgeSide: 0.00, shadowH: 0.00, desc: "A carved sign by the entrance indicates that this establishment provides healing services.", welcomeMsg: "The light embraces you. How may we ease your suffering?", textY: 0.295 },
    'potion_maker': { exterior: 'shop_front_potion_maker.webp', roofP: 0.02, ridgeFront: 0.00, ridgeSide: 0.00, shadowH: 0.00, desc: "A small painted sign depicts a bubbling flask.", welcomeMsg: "Welcome to the apothecary! Step inside, but please don't touch the brewing cauldrons.", textY: 0.34 },
	'instrument_shop': { exterior: 'shop_front_instrument.webp', roofP: 0.02, ridgeFront: 0.00, ridgeSide: 0.00, shadowH: 0.00, desc: "The wooden door is decorated with beautifully carved instruments.", welcomeMsg: "Welcome! We sell the finest instruments and resonant bronze armor in the realm.", textY: 0.315 },
    'spell_shop': { exterior: 'shop_front_spell_shop.webp', roofP: 0.02, ridgeFront: 0.00, ridgeSide: 0.00, shadowH: 0.00, desc: "A glowing mystical sign depicting a starry wand.", welcomeMsg: "Greetings, seeker of the arcane. Browse my mystical wares.", textY: 0.315 },	
    'bowyer': { exterior: 'shop_front_bowyer.webp', roofP: 0.02, ridgeFront: 0.00, ridgeSide: 0.00, shadowH: 0.00, desc: "A wooden sign displays a carved longbow.", welcomeMsg: "Need a new bow or some fresh arrows?", textY: 0.315 },	
    'general_store': { exterior: 'shop_front_general_store.webp', roofP: 0.02, ridgeFront: 0.00, ridgeSide: 0.00, shadowH: 0.00, desc: "A sign shows a stuffed backpack and a lantern.", welcomeMsg: "Welcome! Need rations or a light?", textY: 0.315 },
    'tavern': { exterior: 'shop_front_tavern.webp', roofP: 0.02, ridgeFront: 0.00, ridgeSide: 0.00, shadowH: 0.00, desc: "A wooden sign depicts a foaming mug of ale.", welcomeMsg: "Pull up a chair and have a drink!", textY: 0.315 },
    'guild_hall': { exterior: 'shop_front_guild.webp', roofP: 0.02, ridgeFront: 0.00, ridgeSide: 0.00, shadowH: 0.00, desc: "Banners displaying crossed swords hang by the entrance.", welcomeMsg: "Welcome to the Guild! Looking to train or recruit?", textY: 0.315 }
};

const townHouseTypes = Object.keys(TOWN_HOUSE_CFG); 
const shopTypes = Object.keys(SHOP_CFG);
const cityGateTypes = ['a','b','c','d','e','f','g','h']; 
const cityGateTextures = {};
cityGateTypes.forEach(t => cityGateTextures[t] =[]);

document.getElementById('btn-start-game').disabled = true;

const wallTextures = [];
const floorTextures = [];
const ceilTextures = [];

const dungeonTextureCache = {};

// Helper to format filenames
function getWallSlug(name) {
    // 🌟 FIX: Safely fallback if wallName is undefined
    if (!name) return 'generic';
    return name.toLowerCase().replace(/\s+/g, '-');
}

window.preloadDungeonAssets = function(wallName, onReady) {
    const slug = getWallSlug(wallName);

    if (dungeonTextureCache[slug]) {
        if (onReady) onReady();
        return;
    }

    dungeonTextureCache[slug] = { wall: [], floor: [], ceil: [] };
    let dLoadedCount = 0;
    const totalToLoad = 30; 
    totalAssetsToLoad += totalToLoad; 

    ['wall', 'floor', 'ceil'].forEach(type => {
        for (let i = 0; i < 10; i++) {
            let filename = `dungeon-${slug}-${type}${i}`;
            let sprite = window.getDungeonAtlasSprite(filename);

            if (sprite) {
                let c = document.createElement('canvas');
                c.width = sprite.frame.w; 
                c.height = sprite.frame.h;
                c.getContext('2d').drawImage(sprite.image, sprite.frame.x, sprite.frame.y, sprite.frame.w, sprite.frame.h, 0, 0, sprite.frame.w, sprite.frame.h);
                dungeonTextureCache[slug][type].push(c);
            } else {
                // Fallback: Create blank canvas to prevent rendering errors
                let c = document.createElement('canvas');
                c.width = 64; c.height = 64;
                dungeonTextureCache[slug][type].push(c);
            }
            dLoadedCount++;
            window.onAssetLoaded();
        }
    });

    if (onReady) onReady();
};

const townFloorTextures = [];
const transCanvases = {};
const chestCanvases = []; 
const doorCanvases = { 'wooden':[] }; 
const enemyCanvases = {}; 
const townWallTextures = {}; 
townHouseTypes.forEach(t => townWallTextures[t] = []);
const shopFrontImgs = {};
const shopCanvases = {}; 
const dungeonWallTextures = { 'a': [], 'b': [], 'c': [], 'd': [], 'e': [], 'f': [], 'g': [], 'h': [], 'i': [] };
const globalDungeonGates = {};
cityGateTypes.forEach(t => cityGateTextures[t] = []);

// 🌟 NEW: City Atlas Fetchers for Rendering
window.getTownFloorTexture = function(idx) {
    if (!townFloorTextures[idx] || townFloorTextures[idx].width === 64) {
        let filename = `town-floor${idx}`;
        let sprite = window.getCityAtlasSprite(filename);
        if (sprite && sprite.image.complete && sprite.image.width > 0) {
            let c = document.createElement('canvas');
            c.width = sprite.frame.w; c.height = sprite.frame.h;
            c.getContext('2d').drawImage(sprite.image, sprite.frame.x, sprite.frame.y, sprite.frame.w, sprite.frame.h, 0, 0, sprite.frame.w, sprite.frame.h);
            townFloorTextures[idx] = c;
        } else {
            if (!townFloorTextures[idx]) {
                let c = document.createElement('canvas');
                c.width = 64; c.height = 64;
                townFloorTextures[idx] = c;
            }
        }
    }
    return townFloorTextures[idx];
};

window.getTownWallTexture = function(type, idx) {
    if (!townWallTextures[type]) townWallTextures[type] = [];
    if (!townWallTextures[type][idx] || townWallTextures[type][idx].width === 64) {
        let filename = `town-house-type-${type}${idx}`;
        let sprite = window.getCityAtlasSprite(filename);
        if (sprite && sprite.image.complete && sprite.image.width > 0) {
            let c = document.createElement('canvas');
            c.width = sprite.frame.w; c.height = sprite.frame.h;
            c.getContext('2d').drawImage(sprite.image, sprite.frame.x, sprite.frame.y, sprite.frame.w, sprite.frame.h, 0, 0, sprite.frame.w, sprite.frame.h);
            townWallTextures[type][idx] = c;
        } else {
            if (!townWallTextures[type][idx]) {
                let c = document.createElement('canvas');
                c.width = 64; c.height = 64;
                townWallTextures[type][idx] = c;
            }
        }
    }
    return townWallTextures[type][idx];
};

window.getCityGateTexture = function(type, idx) {
    if (!cityGateTextures[type]) cityGateTextures[type] = [];
    if (!cityGateTextures[type][idx] || cityGateTextures[type][idx].width === 64) {
        let filename = `city-gate-type-${type}${idx}`;
        let sprite = window.getCityAtlasSprite(filename);
        if (sprite && sprite.image.complete && sprite.image.width > 0) {
            let c = document.createElement('canvas');
            c.width = sprite.frame.w; c.height = sprite.frame.h;
            c.getContext('2d').drawImage(sprite.image, sprite.frame.x, sprite.frame.y, sprite.frame.w, sprite.frame.h, 0, 0, sprite.frame.w, sprite.frame.h);
            cityGateTextures[type][idx] = c;
        } else {
            if (!cityGateTextures[type][idx]) {
                let c = document.createElement('canvas');
                c.width = 64; c.height = 64;
                cityGateTextures[type][idx] = c;
            }
        }
    }
    return cityGateTextures[type][idx];
};

window.getWildCityWallTexture = function(style, idx) {
    if (!wildCityWallTextures[style]) wildCityWallTextures[style] = [];
    if (!wildCityWallTextures[style][idx] || wildCityWallTextures[style][idx].width === 64) {
        let filename = `wild_city_wall_type_${style}${idx}`;
        let sprite = window.getCityAtlasSprite(filename);
        if (sprite && sprite.image.complete && sprite.image.width > 0) {
            let c = document.createElement('canvas');
            c.width = sprite.frame.w; c.height = sprite.frame.h;
            c.getContext('2d').drawImage(sprite.image, sprite.frame.x, sprite.frame.y, sprite.frame.w, sprite.frame.h, 0, 0, sprite.frame.w, sprite.frame.h);
            wildCityWallTextures[style][idx] = c;
        } else {
            if (!wildCityWallTextures[style][idx]) {
                let c = document.createElement('canvas');
                c.width = 64; c.height = 64;
                wildCityWallTextures[style][idx] = c;
            }
        }
    }
    return wildCityWallTextures[style][idx];
};

window.getWildFloorTexture = function(idx) {
    if (!wildFloorTextures[idx] || wildFloorTextures[idx].width === 64) {
        let filename = `wild-floor-type-a${idx}`;
        let sprite = window.getCityAtlasSprite(filename) || window.getDungeonAtlasSprite(filename);
        if (sprite && sprite.image.complete && sprite.image.width > 0) {
            let c = document.createElement('canvas');
            c.width = sprite.frame.w; c.height = sprite.frame.h;
            c.getContext('2d').drawImage(sprite.image, sprite.frame.x, sprite.frame.y, sprite.frame.w, sprite.frame.h, 0, 0, sprite.frame.w, sprite.frame.h);
            wildFloorTextures[idx] = c;
        } else {
            if (!wildFloorTextures[idx]) {
                let c = document.createElement('canvas');
                c.width = 64; c.height = 64;
                wildFloorTextures[idx] = c;
            }
        }
    }
    return wildFloorTextures[idx];
};

const uniqueShopExteriors = new Set();
for (let key in worldMaps) {
    if (worldMaps[key].entities) {
        worldMaps[key].entities.forEach(ent => {
            if (ent.type === 'shop') {
                uniqueShopExteriors.add(ent.exterior || (SHOP_CFG[ent.shopType] ? SHOP_CFG[ent.shopType].exterior : 'shop_front_generic.webp'));
            }
        });
    }
}
shopTypes.forEach(type => uniqueShopExteriors.add(SHOP_CFG[type].exterior));
uniqueShopExteriors.delete(null);
uniqueShopExteriors.delete(undefined);

const WILD_TREE_COUNT = 11; 
const wildTreeImgs =[];
const wildFloorTextures = []; 

for (let i = 0; i < WILD_TREE_COUNT; i++) {
    totalAssetsToLoad++;
    let img = new Image(); 
    img.onload = window.onAssetLoaded; 
    img.onerror = window.onAssetLoaded; 
    img.src = `assets/wild_tree${i}.webp?v=${GAME_VERSION}`; 
    wildTreeImgs.push(img);
}

const WILD_WALL_COUNT = 80;
const wildCityWallTextures = { 'a': [], 'b': [], 'c': [], 'd': [], 'e': [], 'f': [], 'g': [], 'h': [] };
const WALL_STYLES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

totalAssetsToLoad++;
const wildGrassImg = new Image(); 
wildGrassImg.onload = window.onAssetLoaded; 
wildGrassImg.onerror = window.onAssetLoaded;
wildGrassImg.src = `assets/wild_grass.webp?v=${GAME_VERSION}`; 

uniqueShopExteriors.forEach(extFile => {
    totalAssetsToLoad++;
    let img = new Image();
    img.onload = window.onAssetLoaded;
    img.onerror = window.onAssetLoaded;
    img.src = `assets/${extFile}?v=${GAME_VERSION}`;
    shopFrontImgs[extFile] = img;
});

let paperPat = null, hatchPat = null;

totalAssetsToLoad++;
const mmPaperImg = new Image(); 
mmPaperImg.onload = () => { paperPat = mctx.createPattern(mmPaperImg, 'repeat'); window.onAssetLoaded(); };
mmPaperImg.onerror = window.onAssetLoaded; 
mmPaperImg.src = `assets/mm_paper.webp?v=${GAME_VERSION}`;

totalAssetsToLoad++;
const mmHatchImg = new Image(); 
mmHatchImg.onload = () => { hatchPat = mctx.createPattern(mmHatchImg, 'repeat'); window.onAssetLoaded(); };
mmHatchImg.onerror = window.onAssetLoaded; 
mmHatchImg.src = `assets/mm_crosshatch.webp?v=${GAME_VERSION}`;


for (let i = 0; i < 10; i++) {
    totalAssetsToLoad++;
    let wfImg = new Image();
    wfImg.onload = window.onAssetLoaded;
    wfImg.onerror = window.onAssetLoaded;
    wfImg.src = `assets/wild-floor-type-a${i}.webp?v=` + GAME_VERSION;
    wildFloorTextures.push(wfImg);

    totalAssetsToLoad++;
    let chImg = new Image();
    chImg.onload = () => {
        let c = document.createElement('canvas');
        c.width = chImg.width;
        c.height = chImg.height;
        c.getContext('2d').drawImage(chImg, 0, 0);
        chestCanvases[i] = c;
        window.onAssetLoaded();
    };
    chImg.onerror = () => {
        chestCanvases[i] = document.createElement('canvas');
        window.onAssetLoaded();
    };
    chImg.src = `assets/wooden_chest${i}.webp?v=` + GAME_VERSION;

    totalAssetsToLoad++;
    let dcImg = new Image();
    dcImg.onload = () => {
        let c = document.createElement('canvas');
        c.width = dcImg.width;
        c.height = dcImg.height;
        c.getContext('2d').drawImage(dcImg, 0, 0);
        doorCanvases['wooden'][i] = c;
        window.onAssetLoaded();
    };
    dcImg.onerror = () => {
        doorCanvases['wooden'][i] = document.createElement('canvas');
        window.onAssetLoaded();
    };
    dcImg.src = `assets/wooden_door_closed${i}.webp?v=` + GAME_VERSION;
}

function getMaxSight() {
    if (window.isDark(player.x, player.y)) return 1;

    if (typeof worldMaps !== 'undefined' && worldMaps[currentMapId] && worldMaps[currentMapId].theme !== 'dungeon') {
        return 7;
    }
    if (typeof worldMaps !== 'undefined' && worldMaps[currentMapId] && worldMaps[currentMapId].isLit) {
        return 24;
    }
    let sight = 2; 
    if (typeof window.partyEffects !== 'undefined') {
        let torch = window.partyEffects.find(e => e.type === 'light');
        if (torch) sight += torch.power;
    }    
    return Math.min(sight, 24); 
}

let transitionFiles =['env_ladder_up.webp', 'env_grate_down.webp'];
transitionFiles.forEach(file => {
    totalAssetsToLoad++;
    let tImg = new Image(); 
    tImg.onload = () => { 
        let c = document.createElement('canvas'); c.width = tImg.width; c.height = tImg.height; 
        c.getContext('2d').drawImage(tImg, 0, 0); 
        transCanvases[file] = c; window.onAssetLoaded(); 
    };
    tImg.onerror = () => { transCanvases[file] = document.createElement('canvas'); window.onAssetLoaded(); };
    tImg.src = `assets/${file}?v=` + GAME_VERSION;
});

window.preloadEnemiesForLevel = function(level) {
    // 🌟 PATCH: This function no longer needs to load external images.
    // The Bestiary Atlas is already preloaded globally by loadBestiaryAtlases() in game.js.
    // We do nothing here to prevent 404 errors.
};

const loadedEnemyPortraits = new Set();

function getHashIdx(mX, mY, prime1, prime2) { return Math.abs(mX * prime1 + mY * prime2) % 10; }

function getTownHouseType(mX, mY) {
    let checkerboard = Math.abs(mX + mY) % 2; 
    let pool = townHouseTypes.filter((_, idx) => idx % 2 === checkerboard);
    let rawHash = Math.abs(mX * 137 + mY * 149);
    let hashIdx = Math.floor(rawHash / 10) % pool.length;
    return pool[hashIdx];
}

async function ensureFontLoaded(font) {
    if (document.fonts) {
        try {
            await document.fonts.load(`bold 20px ${font}`);
        } catch(e) { console.warn("Font failed to load", e); }
    }
}


function getShopTexture(ent) {
    // 🌟 FIX: Use wallX/wallY if available, otherwise use x/y to ensure unique keys
    let posX = ent.wallX !== undefined ? ent.wallX : ent.x;
    let posY = ent.wallY !== undefined ? ent.wallY : ent.y;
    let key = "shop_" + currentMapId + "_" + posX + "," + posY;

    if (dungeonTextureCache[key]) return dungeonTextureCache[key];

    // 🌟 DYNAMIC PATCH: Intercept the filename and force .webp if the data is stale
    let rawExterior = ent.exterior || (SHOP_CFG[ent.shopType] ? SHOP_CFG[ent.shopType].exterior : 'shop_front_generic.webp');
    let extFile = rawExterior.replace('.png', '.webp');

    let baseImg = shopFrontImgs[extFile];

    // 🌟 FIX: Dynamically load custom shop exteriors if they aren't preloaded!
    if (!baseImg) {
        let img = new Image();
        shopFrontImgs[extFile] = img; // Set immediately to prevent multiple fetches

        img.onload = () => { 
            console.log("Successfully loaded shop texture:", extFile);
            if (typeof update === 'function') update(); 
        };

        img.onerror = () => { 
            console.error("FATAL: Could not load shop texture at:", extFile);
        };

        img.src = `assets/${extFile}?v=${GAME_VERSION}`;
        return null; // Return null while it loads
    }

    if (!baseImg.complete || baseImg.width === 0) return null;

    let c = document.createElement('canvas');
    c.width = baseImg.width;
    c.height = baseImg.height;
    let ctx = c.getContext('2d');
    ctx.drawImage(baseImg, 0, 0);


    // 🌟 SYNCHRONOUS RENDERING: Draw text immediately so the texture is complete for the first render frame
    let fontFamily = ent.fontFamily || (SHOP_CFG[ent.shopType] && SHOP_CFG[ent.shopType].fontFamily) || "'Georgia', serif";

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let fontSizeMult = ent.fontSizeMult !== undefined ? ent.fontSizeMult : (SHOP_CFG[ent.shopType] && SHOP_CFG[ent.shopType].fontSizeMult !== undefined ? SHOP_CFG[ent.shopType].fontSizeMult : 0.045);
    let fontSize = Math.floor(c.width * fontSizeMult);
    ctx.font = `bold ${fontSize}px ${fontFamily}`;

    let xPercentage = ent.textX !== undefined ? ent.textX : (SHOP_CFG[ent.shopType] && SHOP_CFG[ent.shopType].textX !== undefined ? SHOP_CFG[ent.shopType].textX : 0.5);
    let yPercentage = ent.textY !== undefined ? ent.textY : (SHOP_CFG[ent.shopType] && SHOP_CFG[ent.shopType].textY !== undefined ? SHOP_CFG[ent.shopType].textY : 0.315);

    let textX = c.width * xPercentage;
    let textY = c.height * yPercentage;

    let textColor = ent.textColor || (SHOP_CFG[ent.shopType] && SHOP_CFG[ent.shopType].textColor) || "#221100";
    let shadowColor = ent.shadowColor || (SHOP_CFG[ent.shopType] && SHOP_CFG[ent.shopType].shadowColor) || "rgba(0, 0, 0, 0.8)";
    let highlightColor = ent.highlightColor || (SHOP_CFG[ent.shopType] && SHOP_CFG[ent.shopType].highlightColor) || "rgba(255, 255, 255, 0.4)";
    let rawText = ent.signText || ent.name,
        lines = rawText.split(/<br\s*\/?>/i),
        lineHeight = fontSize * 1.15,
        totalHeight = (lines.length - 1) * lineHeight,
        startY = textY - (totalHeight / 2);

    lines.forEach((line, index) => {
        let currentY = startY + (index * lineHeight);
        if (highlightColor !== 'none') {
            let hX = ent.highlightX !== undefined ? ent.highlightX : -1;
            let hY = ent.highlightY !== undefined ? ent.highlightY : -1;
            ctx.fillStyle = highlightColor;
            ctx.fillText(line.trim(), textX + hX, currentY + hY);
        }
        if (shadowColor !== 'none') {
            let sX = ent.shadowX !== undefined ? ent.shadowX : 1;
            let sY = ent.shadowY !== undefined ? ent.shadowY : 1;
            ctx.fillStyle = shadowColor;
            ctx.fillText(line.trim(), textX + sX, currentY + sY);
        }
        ctx.fillStyle = textColor;
        ctx.fillText(line.trim(), textX, currentY);
    });

    dungeonTextureCache[key] = c;
    return c;
}

function isVisionBlocked(mX, mY) {
    let isWild = typeof worldMaps !== 'undefined' && worldMaps[currentMapId] && worldMaps[currentMapId].theme === 'wilderness';
    let cellVal;
    if (!map[mY] || map[mY][mX] === undefined) { if (!isWild) return true; let hash = Math.abs(mX * 137 + mY * 149) % 100; cellVal = hash < 20 ? 1 : 0; } else cellVal = map[mY][mX];
    if (isWild) return cellVal >= 2; 
    return cellVal >= 1; 
}

window.getGlobalDungeonWall = function(style, idx) {
    if (!dungeonWallTextures[style]) dungeonWallTextures[style] = [];
    let c = dungeonWallTextures[style][idx];

    // Lazy-load the texture from the atlas if missing or if it was previously set to the blank 64x64 fallback
    if (!c || c.width === 64) {
        let filename = `dungeon-wall-type-${style}${idx}`;
        let sprite = window.getDungeonAtlasSprite(filename);

        if (sprite && sprite.image.complete && sprite.image.width > 0) {
            c = document.createElement('canvas');
            c.width = sprite.frame.w;
            c.height = sprite.frame.h;
            c.getContext('2d').drawImage(sprite.image, sprite.frame.x, sprite.frame.y, sprite.frame.w, sprite.frame.h, 0, 0, sprite.frame.w, sprite.frame.h);
            dungeonWallTextures[style][idx] = c;
        } else {
            if (!c) {
                c = document.createElement('canvas');
                c.width = 64; c.height = 64;
                dungeonWallTextures[style][idx] = c;
            }
        }
    }
    return c;
};

window.getGlobalDungeonGate = function(type, idx) {
    if (!globalDungeonGates[type]) globalDungeonGates[type] = [];
    let c = globalDungeonGates[type][idx];

    // Lazy-load the texture from the atlas if missing or if it was previously set to the blank 64x64 fallback
    if (!c || c.width === 64) {
        let filename = `dungeon-gate-style-${type}${idx}`;
        let sprite = window.getDungeonAtlasSprite(filename);

        if (sprite && sprite.image.complete && sprite.image.width > 0) {
            c = document.createElement('canvas');
            c.width = sprite.frame.w;
            c.height = sprite.frame.h;
            c.getContext('2d').drawImage(sprite.image, sprite.frame.x, sprite.frame.y, sprite.frame.w, sprite.frame.h, 0, 0, sprite.frame.w, sprite.frame.h);
            globalDungeonGates[type][idx] = c;
        } else {
            if (!c) {
                c = document.createElement('canvas');
                c.width = 64; c.height = 64;
                globalDungeonGates[type][idx] = c;
            }
        }
    }
    return c;
};



function getWallTexture(mX, mY) { 
    if (!map[mY] || map[mY][mX] === undefined) return wallTextures[0] || new Image();

    // 1. Entity logic (Check this FIRST)
    if (typeof entities !== 'undefined') {
        let wallEnt = entities.find(e => (e.wallX === mX && e.wallY === mY) || (e.x === mX && e.y === mY));
        if (wallEnt) {
            if (wallEnt.type === 'shop') return getShopTexture(wallEnt);
            if (wallEnt.type === 'dungeon_gate') {
                let type = wallEnt.gateType || 'a';
                return window.getGlobalDungeonGate(type, getHashIdx(mX, mY, 227, 233) % 10);
            }
            if (wallEnt.type === 'transition' && wallEnt.gateType) {
                return window.getCityGateTexture(wallEnt.gateType, getHashIdx(mX, mY, 227, 233));
            }
        }
    }

    // 2. Wilderness / Town logic
    if (worldMaps[currentMapId].theme === 'wilderness') { 
        if (map[mY][mX] === 2) {
            let ent = entities.find(e => e.type === 'town_footprint' && (e.wallX ?? e.x) === mX && (e.wallY ?? e.y) === mY);
            let style = (ent && ent.wallStyle && wildCityWallTextures[ent.wallStyle]) ? ent.wallStyle : 'a';
            return window.getWildCityWallTexture(style, getHashIdx(mX, mY, 137, 149));
        }
        if (map[mY][mX] === 3) {
            let ent = entities.find(e => e.type === 'dungeon_entrance' && (e.x === mX && e.y === mY));
            let style = (ent && ent.wallStyle) ? ent.wallStyle : 'a';
            return window.getGlobalDungeonWall(style, getHashIdx(mX, mY, 137, 149) % 10);
        }
    }

    if (worldMaps[currentMapId].theme === 'town') { 
        let type = getTownHouseType(mX, mY), varIdx = getHashIdx(mX, mY, 173, 191); 
        return window.getTownWallTexture(type, varIdx); 
    }

    // 3. Fallback to dungeon/generic wall textures
    const slug = getWallSlug(WALL_TYPE_NAME);
    const cacheKey = getHashIdx(mX, mY, 137, 149);

    if (dungeonTextureCache[slug] && dungeonTextureCache[slug].wall[cacheKey]) {
        return dungeonTextureCache[slug].wall[cacheKey];
    }

    // Final fallback to global atlas-backed dungeonWallTextures
    if (dungeonWallTextures[WALL_TYPE_NAME]) {
        return window.getGlobalDungeonWall(WALL_TYPE_NAME, cacheKey % 10);
    }
    return wallTextures[cacheKey] || wallTextures[0] || new Image();
}


function getFloorTexture(mX, mY) { 
    if (!map[mY] || map[mY][mX] === undefined) { 
        return (worldMaps[currentMapId].theme === 'wilderness' ? window.getWildFloorTexture(getHashIdx(mX, mY, 173, 191)) : floorTextures[0]) || new Image(); 
    } 
    if (worldMaps[currentMapId].theme === 'wilderness') return window.getWildFloorTexture(getHashIdx(mX, mY, 173, 191)) || new Image();
    if (worldMaps[currentMapId].theme === 'town') return window.getTownFloorTexture(getHashIdx(mX, mY, 173, 191));

    const slug = getWallSlug(WALL_TYPE_NAME);
    const cacheKey = getHashIdx(mX, mY, 173, 191);

    if (dungeonTextureCache[slug] && dungeonTextureCache[slug].floor[cacheKey]) {
        return dungeonTextureCache[slug].floor[cacheKey];
    }

    return floorTextures[cacheKey] || floorTextures[0] || new Image();
}

function getCeilTexture(mX, mY) {
    if (!map[mY] || map[mY][mX] === undefined) return ceilTextures[0] || new Image();

    const slug = getWallSlug(WALL_TYPE_NAME);
    const cacheKey = getHashIdx(mX, mY, 193, 197);

    if (dungeonTextureCache[slug] && dungeonTextureCache[slug].ceil[cacheKey]) {
        return dungeonTextureCache[slug].ceil[cacheKey];
    }

    return ceilTextures[cacheKey] || ceilTextures[0] || new Image();
}

function getTownHouseCfg(mX, mY) {
    if (typeof entities !== 'undefined') {
        let shopEnt = entities.find(e => e.type === 'shop' && e.wallX === mX && e.wallY === mY);
        if (shopEnt && SHOP_CFG[shopEnt.shopType]) return SHOP_CFG[shopEnt.shopType];
    }
    return TOWN_HOUSE_CFG[getTownHouseType(mX, mY)];
}

function getChestTexture(mX, mY) {
    return chestCanvases[getHashIdx(mX, mY, 211, 223)];
}

function getDoorAsset(mX, mY, typeStr) {
    if (!DOOR_TYPES[typeStr] || !doorCanvases[typeStr]) return {
        tex: null,
        cfg: null
    };
    let idx = getHashIdx(mX, mY, 227, 233);
    return {
        tex: doorCanvases[typeStr][idx],
        cfg: DOOR_TYPES[typeStr]
    };
}

function getDoor(xA, yA, xB, yB) {
    for (let d of doors) {
        // 🌟 FIX: Treat doors as full tiles! Check if the target tile (xB, yB) is a door.
        if (xB === d.x && yB === d.y) {
            // Check if we are approaching along the correct axis.
            // If axis is 'x', the door blocks X-axis movement (so y doesn't change).
            if (d.axis === 'x' && yA === d.y) return d;
            if (d.axis === 'y' && xA === d.x) return d;
        }
    }
    return null;
}

/* ================= FIELD OF VISION ================= */
function revealMap(x, y) { if (discoveredMap[y] !== undefined && discoveredMap[y][x] !== undefined) discoveredMap[y][x] = 1; }

function calculateFOV() {
    revealMap(player.x, player.y);
    // 🌟 Darkness: Only reveal current tile
    if (window.isDark(player.x, player.y)) return;

    for (let direction = 0; direction < 4; direction++) {
        let leftDir = (direction + 3) % 4, rightDir = (direction + 1) % 4;
        for (let d = 1; d <= getMaxSight(); d++) {
            let pX = player.x + dx[direction] * (d-1), pY = player.y + dy[direction] * (d-1);
            let cX = player.x + dx[direction] * d, cY = player.y + dy[direction] * d;
            let bDoor = typeof getDoor === 'function' ? getDoor(pX, pY, cX, cY) : null;

            // 🌟 FIX: Reveal the tile BEFORE breaking so the door actually paints on the minimap
            if (d <= 6) {
                revealMap(cX, cY);
                if (!bDoor || bDoor.state !== 'closed') {
                    revealMap(cX + dx[leftDir], cY + dy[leftDir]);
                    revealMap(cX + dx[rightDir], cY + dy[rightDir]);
                }
            }
            if (bDoor && bDoor.state === 'closed') break; 
            if (isVisionBlocked(cX, cY)) break; 
        }
    }
}

/* ================= 3D MATH & RENDERING ================= */
window.walkOffset = 0;
function getRect(depth) {
    const h = viewCanvas.height, w = h * 1.15;
    const scales =[2.2, 0.87, 0.53, 0.32, 0.18, 0.12, 0.08, 0.05, 0.03, 0.02, 0.01, 0.007, 0.005, 0.003, 0.002, 0.001, 0.0007, 0.0005, 0.0003, 0.0002, 0.0001, 0.00008, 0.00005, 0.00003, 0.00001];
    const s = scales[depth] || 0.00001;
    return { x: Math.round(viewCanvas.width / 2 - (w * s) / 2), y: Math.round(viewCanvas.height / 2 - (h * s) / 2), w: Math.round(w * s), h: Math.round(h * s) };
}

function drawSideWall(tex, xStart, xEnd, yTopStart, yTopEnd, yBotStart, yBotEnd, texStartX, texEndX, isOpenDoor = false, cfg = null, fillNear, fillFar, townCfg = null) {
    let width = Math.round(xEnd - xStart); if (width === 0 || !tex || !tex.width) return;
    let dir = width > 0 ? 1 : -1, absWidth = Math.abs(width), texW = tex.width, texH = tex.height;
    let grad = null; if (fillNear && fillFar) { grad = ctx.createLinearGradient(xStart, 0, xEnd, 0); grad.addColorStop(0, fillNear); grad.addColorStop(1, fillFar); }
    let cT = (cfg && cfg.cropT) ? cfg.cropT : 0, cB = (cfg && cfg.cropB) ? cfg.cropB : 0, sY = texH * cT, sH = texH * (1 - cT - cB);

    // 🌟 OPTIMIZED: Step size of 2 halves the amount of computationally expensive drawImage operations
    const STEP = 2;
    for (let i = 0; i <= absWidth; i += STEP) {
        let p = i / absWidth;
        let curX = xStart + (i * dir);
        let nextX = xStart + Math.min(i + STEP, absWidth) * dir;

        let drawLeft = Math.min(curX, nextX);
        let drawWidth = Math.abs(nextX - curX);

        let dX = drawLeft;
        let dW = drawWidth + 1; // +1 to prevent gaps, intentionally matching original 1px overlap

        let curYTop = yTopStart + (yTopEnd - yTopStart) * p, 
            curYBot = yBotStart + (yBotEnd - yBotStart) * p, 
            totalH = curYBot - curYTop, 
            texX = Math.max(0, Math.min(texW - 1, Math.floor(texStartX + (texEndX - texStartX) * p))); 

        if (isOpenDoor && cfg && p > cfg.holeL && p < cfg.holeR) {
            let topSliceH = totalH * cfg.holeT;
            if (townCfg) {
                let roofP = townCfg.roofP, ridgeY = curYTop + totalH * townCfg.ridgeSide, eaveY = curYTop + totalH * roofP;
                if (topSliceH > totalH * roofP) { 
                    ctx.drawImage(tex, texX, sY, 1, sH * roofP, dX, ridgeY - 1, dW, (eaveY - ridgeY) + 2); 
                    let wallH_ratio = (topSliceH - totalH * roofP) / (totalH * (1 - roofP)); 
                    ctx.drawImage(tex, texX, sY + sH * roofP, 1, sH * (1 - roofP) * wallH_ratio, dX, eaveY - 1, dW, topSliceH - (totalH * roofP) + 2); 
                } else { 
                    let roofH_ratio = topSliceH / (totalH * roofP); 
                    ctx.drawImage(tex, texX, sY, 1, sH * roofP * roofH_ratio, dX, ridgeY - 1, dW, (eaveY - ridgeY) * roofH_ratio + 2); 
                }
            } else ctx.drawImage(tex, texX, sY, 1, sH * cfg.holeT, dX, curYTop - 1, dW, topSliceH + 1);
            if (grad) { ctx.fillStyle = grad; ctx.fillRect(dX, townCfg ? curYTop + totalH * townCfg.ridgeSide - 1 : curYTop - 1, dW, topSliceH + 1); } continue; 
        }
        if (townCfg) {
            let roofP = townCfg.roofP, ridgeY = curYTop + totalH * townCfg.ridgeSide, eaveY = curYTop + totalH * roofP;
            ctx.drawImage(tex, texX, sY, 1, sH * roofP, dX, ridgeY - 1, dW, (eaveY - ridgeY) + 2); 
            ctx.drawImage(tex, texX, sY + sH * roofP, 1, sH * (1 - roofP), dX, eaveY - 1, dW, (curYBot - eaveY) + 2);
            if (grad) { ctx.fillStyle = grad; ctx.fillRect(dX, ridgeY - 1, dW, (curYBot - ridgeY) + 2); } 
            ctx.fillStyle = `rgba(0,0,0,0.3)`; 
            ctx.fillRect(dX, eaveY - 1, dW, totalH * townCfg.shadowH);
        } else { 
            ctx.drawImage(tex, texX, sY, 1, sH, dX, curYTop - 1, dW, (curYBot - curYTop) + 2); 
            if (grad) { ctx.fillStyle = grad; ctx.fillRect(dX, curYTop - 1, dW, (curYBot - curYTop) + 2); } 
        }
    }
}

function drawHorizontalTrapezoid(tex, xNearLeft, xNearRight, xFarLeft, xFarRight, yNear, yFar, fillNear, fillFar, srcY, srcH) {
    let height = yFar - yNear;
    if (Math.abs(height) < 0.1 || !tex || !tex.width) return;

    srcY = srcY || 0;
    srcH = srcH || tex.height;

    let absHeight = Math.abs(height);
    let prevY = Math.floor(yNear);

    let grad = null;
    if (fillNear && fillFar) {
        grad = ctx.createLinearGradient(0, yNear, 0, yFar);
        grad.addColorStop(0, fillNear);
        grad.addColorStop(1, fillFar);
    }

    // 🌟 OPTIMIZED: Step size of 2 halves the amount of computationally expensive drawImage operations
    const STEP = 2;
    for (let i = 0; i < absHeight; i += STEP) {
        let p = i / absHeight;
        let drawH = Math.min(STEP, absHeight - i);
        let nextP = (i + drawH) / absHeight;

        let curXLeft = xNearLeft + (xFarLeft - xNearLeft) * p;
        let curXRight = xNearRight + (xFarRight - xNearRight) * p;

        let nextY = Math.floor(yNear + (nextP * height));
        let curY = prevY; 
        let stripH = Math.max(1, nextY - curY);

        let curWidth = (xNearRight + (xFarRight - xNearRight) * p) - curXLeft;
        let texY = srcY + (p * srcH);

        ctx.drawImage(tex, 0, texY, tex.width, 1, Math.floor(curXLeft), curY, Math.ceil(curWidth) + 1, stripH + 1);

        if (grad) {
            ctx.fillStyle = grad;
            ctx.fillRect(Math.floor(curXLeft), curY, Math.ceil(curWidth) + 1, stripH + 1);
        }

        prevY = nextY;
    }
}



function getForgeTexture(ent) {
    // 1. If not loaded, return null immediately so it doesn't draw a broken wall
    if (!forgeImg.complete || forgeImg.width === 0) return null;

    let posX = ent.wallX !== undefined ? ent.wallX : ent.x;
    let posY = ent.wallY !== undefined ? ent.wallY : ent.y;
    let key = "forge_" + currentMapId + "_" + posX + "," + posY;

    if (dungeonTextureCache[key]) return dungeonTextureCache[key];

    // 2. Create the canvas
    let c = document.createElement('canvas');
    c.width = forgeImg.width;
    c.height = forgeImg.height;
    let ctx = c.getContext('2d');

    // 3. Draw the image
    ctx.drawImage(forgeImg, 0, 0);

    dungeonTextureCache[key] = c;
    return c;
}

function getTextureForWallAt(mX, mY) { 
    if (!map[mY] || map[mY][mX] === undefined) return wallTextures[0] || new Image();

    const slug = getWallSlug(WALL_TYPE_NAME); 
    const cacheKey = getHashIdx(mX, mY, 137, 149);

    // 1. Entity logic (Check this FIRST)
    if (typeof entities !== 'undefined') {
        let wallEnt = entities.find(e => (e.wallX === mX && e.wallY === mY) || (e.x === mX && e.y === mY));
        if (wallEnt) {
            if (wallEnt.type === 'shop') return getShopTexture(wallEnt);

            if (wallEnt.type === 'forge_interaction') {
                return (forgeImg && forgeImg.width > 0) ? forgeImg : (wallTextures[0] || new Image());
            }

            if (wallEnt.type === 'dungeon_gate') {
                let type = wallEnt.gateType || 'a';
                return window.getGlobalDungeonGate(type, getHashIdx(mX, mY, 227, 233) % 10);
            }
            if (wallEnt.type === 'transition' && wallEnt.gateType) {
                return window.getCityGateTexture(wallEnt.gateType, getHashIdx(mX, mY, 227, 233));
            }
        }
    }

    // 2. Wilderness / Town logic
    if (worldMaps[currentMapId].theme === 'wilderness') { 
        if (map[mY][mX] === 2) {
            let ent = entities.find(e => e.type === 'town_footprint' && (e.wallX ?? e.x) === mX && (e.wallY ?? e.y) === mY);
            let style = (ent && ent.wallStyle && wildCityWallTextures[ent.wallStyle]) ? ent.wallStyle : 'a';
            return window.getWildCityWallTexture(style, getHashIdx(mX, mY, 137, 149));
        }
        if (map[mY][mX] === 3) {
            let ent = entities.find(e => e.type === 'dungeon_entrance' && (e.x === mX && e.y === mY));
            let style = (ent && ent.wallStyle) ? ent.wallStyle : 'a';
            return window.getGlobalDungeonWall(style, getHashIdx(mX, mY, 137, 149) % 10);
        }
    }

    if (worldMaps[currentMapId].theme === 'town') { 
        let type = getTownHouseType(mX, mY), varIdx = getHashIdx(mX, mY, 173, 191); 
        return window.getTownWallTexture(type, varIdx); 
    }

    // 3. Fallback to dungeon/generic wall textures
    if (dungeonTextureCache[slug] && dungeonTextureCache[slug].wall[cacheKey]) {
        return dungeonTextureCache[slug].wall[cacheKey];
    }

    if (dungeonWallTextures[WALL_TYPE_NAME]) {
        return window.getGlobalDungeonWall(WALL_TYPE_NAME, cacheKey % 10);
    }
    return wallTextures[cacheKey] || wallTextures[0] || new Image();
}


function drawView() {
    ctx.imageSmoothingEnabled = true;
    let hasSky = worldMaps[currentMapId].hasSky;
    if (hasSky) {
        let skyGrad = ctx.createLinearGradient(0, 0, 0, viewCanvas.height / 2);
        skyGrad.addColorStop(0, worldMaps[currentMapId].theme === 'wilderness' ? '#2A5298' : '#1E3A5F');
        skyGrad.addColorStop(1, worldMaps[currentMapId].theme === 'wilderness' ? '#8AB6D6' : '#6688AA');
        ctx.fillStyle = skyGrad;
    } else ctx.fillStyle = '#050403';
    ctx.fillRect(0, 0, viewCanvas.width, viewCanvas.height / 2);
    let baseDirtColor = hasSky ? '#4a443d' : '#0a0806',
        horizonColor = hasSky ? (worldMaps[currentMapId].theme === 'wilderness' ? '#8AB6D6' : '#6688AA') : '#050403';
    let floorGrad = ctx.createLinearGradient(0, viewCanvas.height / 2, 0, (viewCanvas.height / 2) + (viewCanvas.height * 0.15));
    floorGrad.addColorStop(0, horizonColor);
    floorGrad.addColorStop(1, baseDirtColor);
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, viewCanvas.height / 2, viewCanvas.width, viewCanvas.height / 2);
    let maxVisible = getMaxSight();
    if (typeof window.gameState !== 'undefined' && window.gameState === 'COMBAT') maxVisible = Math.max(getMaxSight(), typeof window.combatState !== 'undefined' ? window.combatState.distance + 1 : getMaxSight());
    for (let d = maxVisible; d > 0; d--) {
        let tpX = player.x + dx[player.dir] * (d - 1),
            tpY = player.y + dy[player.dir] * (d - 1),
            tcX = player.x + dx[player.dir] * d,
            tcY = player.y + dy[player.dir] * d;
        if (getDoor(tpX, tpY, tcX, tcY)?.state === 'closed') {
            maxVisible = d;
            break;
        }
    }

    // Store Y coordinates to ensure seamless connection between trapezoids
    let prevCeilY = 0;
    let prevFloorY = viewCanvas.height;

    const leftDir = (player.dir + 3) % 4,
        rightDir = (player.dir + 1) % 4;
    let minD = window.walkOffset > 0 ? 0 : 1;
    for (let d = maxVisible; d >= minD; d--) {
        let rect = getRect(d),
            pRect = getRect(d - 1),
            cX = player.x + dx[player.dir] * (d - 1),
            cY = player.y + dy[player.dir] * (d - 1),
            fX = player.x + dx[player.dir] * d,
            fY = player.y + dy[player.dir] * d;
        let fogRGB = hasSky ? (worldMaps[currentMapId].theme === 'wilderness' ? '138,182,214' : '102,136,170') : '0,0,0';
        let sAlphaFar = Math.min(1.0, (d / getMaxSight()) * 0.85),
            sAlphaNear = Math.min(1.0, ((d - 1) / getMaxSight()) * 0.85),
            cAlphaFar = Math.min(1.0, sAlphaFar + CEILING_DARKNESS),
            cAlphaNear = Math.min(1.0, sAlphaNear + CEILING_DARKNESS);
        let fogFar = `rgba(${fogRGB},${sAlphaFar})`,
            fogNear = `rgba(${fogRGB},${sAlphaNear})`,
            ceilFogFar = `rgba(${fogRGB},${cAlphaFar})`,
            ceilFogNear = `rgba(${fogRGB},${cAlphaNear})`;

        // Ensure seamless continuity: 
        // Use the bottom of the previous ceiling/floor as the top of the next one
        const drawFloorAndCeil = (mX, mY, offset) => { 
			let pL = pRect.x + (pRect.w * offset), pR = pL + pRect.w;
			let fL = rect.x + (rect.w * offset), fR = fL + rect.w; 

			// Fetch the specific textures for this coordinate
			let fTex = getFloorTexture(mX, mY);
			let cTex = getCeilTexture(mX, mY);

			// Calculate tiling based on depth 'd'
			// Adjust 0.5 to make stones look smaller/larger
			let textureRepeat = 0.5; 
			let srcY = (d * textureRepeat * fTex.height) % fTex.height;
			let srcH = fTex.height * textureRepeat;

			if (!hasSky) {
				// Ceiling mapping
				drawHorizontalTrapezoid(cTex, pL, pR, fL, fR, pRect.y, rect.y, ceilFogNear, ceilFogFar);
			}

			// Draw the floor slice with the calculated offsets
			drawHorizontalTrapezoid(
				fTex, 
				pL, pR, fL, fR, 
				pRect.y + pRect.h, rect.y + rect.h, 
				fogNear, fogFar, 
				srcY, srcH
			);
		};

		const drawFrontWall = (mX, mY, originX, originY, offset) => {
			let isTown = worldMaps[currentMapId].theme === 'town',
				isWild = worldMaps[currentMapId].theme === 'wilderness',
				cellVal = (!map[mY] || map[mY][mX] === undefined) ? (isWild && Math.abs(mX * 137 + mY * 149) % 100 < 20 ? 1 : 0) : map[mY][mX];
			let fL = rect.x + (rect.w * offset);

			let wallEnt = entities.find(e => (e.wallX === mX && e.wallY === mY) || (e.x === mX && e.y === mY));

			// 🌟 FIX: Ensure forge_interaction is explicitly identified
			let isWallEntity = wallEnt && (
				wallEnt.type === 'shop' || 
				wallEnt.type === 'dungeon_gate' || 
				(wallEnt.type === 'transition' && wallEnt.wallX) || 
				wallEnt.type === 'forge_interaction' 
			);

			if (isWild && cellVal === 1 && !wallEnt) {
				let depthOffset = 1.0,
					pL = pRect.x + (pRect.w * offset),
					midW = pRect.w + (rect.w - pRect.w) * depthOffset,
					midH = pRect.h + (rect.h - pRect.h) * depthOffset,
					midY = pRect.y + (rect.y - pRect.y) * depthOffset,
					midL = pL + (fL - pL) * depthOffset,
					sprW = midW * 1.5,
					sprH = midH * 1.5,
					sprX = midL + (midW - sprW) / 2,
					sprY = midY + midH - sprH + (midH * 0.15),
					treeImg = wildTreeImgs[Math.abs(mX * 31 + mY * 89) % WILD_TREE_COUNT];
				if (treeImg && treeImg.complete && sprW > 0 && sprH > 0) {
					const safeW = Math.max(1, Math.floor(sprW)),
						safeH = Math.max(1, Math.floor(sprH));
					treeBuffer.width = safeW;
					treeBuffer.height = safeH;
					treeCtx.clearRect(0, 0, safeW, safeH);
					treeCtx.drawImage(treeImg, 0, 0, safeW, safeH);
					let fogAlpha = Math.max(0, sAlphaNear + (sAlphaFar - sAlphaNear) * depthOffset);
					treeCtx.globalCompositeOperation = 'source-atop';
					treeCtx.fillStyle = `rgba(${fogRGB}, ${fogAlpha})`;
					treeCtx.fillRect(0, 0, safeW, safeH);
					treeCtx.globalCompositeOperation = 'source-over';
					ctx.drawImage(treeBuffer, sprX, sprY, safeW, safeH);
				}
				return;
			}

			let dObj = typeof getDoor === 'function' ? getDoor(originX, originY, mX, mY) : null,
				dX = fL - O,
				dY = rect.y - O,
				dW = rect.w + (O * 2),
				dH = rect.h + (O * 2),
				hCfg = isTown ? getTownHouseCfg(mX, mY) : null,
				roofP = isTown ? hCfg.roofP : 0,
				ridgeY = isTown ? dY + dH * hCfg.ridgeFront : dY,
				eaveY = isTown ? dY + dH * roofP : dY;

			const drawTex = (tex, sX, sY, sW, sH, dX, dY, dW, dH) => {
				if (isTown) {
					let sliceH = dH, maxRoofH = dH * roofP;
					if (sliceH > maxRoofH) {
						ctx.drawImage(tex, sX, sY, sW, sH * roofP, dX, ridgeY, dW, eaveY - ridgeY);
						ctx.drawImage(tex, sX, sY + sH * roofP, sW, sH * (1 - roofP) * ((sliceH - maxRoofH) / (dH * (1 - roofP))), dX, eaveY, dW, sliceH - maxRoofH);
					} else ctx.drawImage(tex, sX, sY, sW, sH * roofP * (sliceH / maxRoofH), dX, ridgeY, dW, (eaveY - ridgeY) * (sliceH / maxRoofH));
				} else ctx.drawImage(tex, sX, sY, sW, sH, dX, dY, dW, dH);
			};

			if ((cellVal >= 1) || (dObj && dObj.state === 'closed') || isWallEntity) {
				let wTex = getTextureForWallAt(mX, mY); 
				if (wTex && wTex.width > 0) drawTex(wTex, 0, 0, wTex.width, wTex.height, dX, dY, dW, dH);

				if (dObj && dObj.state === 'closed') {
					let dAst = getDoorAsset(mX, mY, dObj.type);
					if (dAst && dAst.tex) {
						let cT = dAst.cfg.cropT || 0;
						let cB = dAst.cfg.cropB || 0;
						let sY = dAst.tex.height * cT;
						let sH = dAst.tex.height * (1 - cT - cB);
						drawTex(dAst.tex, 0, sY, dAst.tex.width, sH, dX, dY, dW, dH);
					}
				}

				ctx.fillStyle = fogFar;
				if (isTown) {
					ctx.fillRect(dX, ridgeY, dW, eaveY - ridgeY);
					ctx.fillRect(dX, eaveY, dW, dH * (1 - roofP));
					ctx.fillStyle = 'rgba(0,0,0,0.3)';
					ctx.fillRect(dX, eaveY, dW, dH * hCfg.shadowH);
				} else ctx.fillRect(dX, dY, dW, dH);
			} 
			else if (dObj && dObj.state === 'open') {
				let wTex = getTextureForWallAt(mX, mY),
					dAst = getDoorAsset(mX, mY, dObj.type);
				if (wTex && wTex.width > 0 && dAst.cfg) {
					const drawHoleObj = (tex, tW, tH, useCrop) => {
						if (!tex || tex.width === 0) return;
						let cT = useCrop ? (dAst.cfg.cropT || 0) : 0,
							cB = useCrop ? (dAst.cfg.cropB || 0) : 0,
							sY = tH * cT,
							sH = tH * (1 - cT - cB);

						drawTex(tex, 0, sY, tW * dAst.cfg.holeL, sH, dX, dY, rect.w * dAst.cfg.holeL + O, dH);
						drawTex(tex, tW * dAst.cfg.holeR, sY, tW * (1 - dAst.cfg.holeR), sH, fL + (rect.w * dAst.cfg.holeR) - O, dY, rect.w * (1 - dAst.cfg.holeR) + O, dH);
						drawTex(tex, tW * dAst.cfg.holeL, sY, tW * (dAst.cfg.holeR - dAst.cfg.holeL), sH * dAst.cfg.holeT, fL + (rect.w * dAst.cfg.holeL) - O, dY, rect.w * (dAst.cfg.holeR - dAst.cfg.holeL) + (O * 2), rect.h * dAst.cfg.holeT + O);
					};

					drawHoleObj(wTex, wTex.width, wTex.height, false);                    

					if (dAst.tex) drawHoleObj(dAst.tex, dAst.tex.width, dAst.tex.height, true);

					ctx.fillStyle = fogFar;
					ctx.fillRect(dX, dY, dW, dH);
				}
			}
		};

		const doSideWall = (chkX, chkY, originX, originY, offset, isRight) => {
            let outerVal = map[chkY] ? map[chkY][chkX] : 0,
                innerVal = map[originY] ? map[originY][originX] : 0,
                isGate = entities.some(e => e.type === 'dungeon_gate' && (e.wallX === chkX && e.wallY === chkY)),
                isOuterWall = (worldMaps[currentMapId].theme === 'wilderness' ? outerVal >= 2 : outerVal >= 1) || isGate,
                isInnerWall = worldMaps[currentMapId].theme === 'wilderness' ? innerVal >= 2 : innerVal >= 1,
                door = typeof getDoor === 'function' ? getDoor(originX, originY, chkX, chkY) : null;

            if ((!isOuterWall && !door) || isInnerWall) return;

            let targetX = chkX, targetY = chkY,
                pStart = pRect.x + (pRect.w * offset),
                fStart = rect.x + (rect.w * offset),
                townCfg = worldMaps[currentMapId].theme === 'town' ? getTownHouseCfg(targetX, targetY) : null;

            // 🌟 FORCE: Use our robust texture fetcher
            let tex = getTextureForWallAt(targetX, targetY);

            let flipTex = isRight; 
            let texS = flipTex ? (tex ? tex.width : 512) : 0,
                texE = flipTex ? 0 : (tex ? tex.width : 512);

            // 🌟 FIX: Treat gates as solid walls when viewing from the side
            if (isGate) {
                 drawSideWall(tex, pStart, fStart, pRect.y - O, rect.y + O, pRect.y + pRect.h + O, rect.y + rect.h - O, texS, texE, false, null, fogNear, fogFar, townCfg);
            } else if (!door || door.state === 'closed') {
                drawSideWall(tex, pStart, fStart, pRect.y - O, rect.y + O, pRect.y + pRect.h + O, rect.y + rect.h - O, texS, texE, false, null, fogNear, fogFar, townCfg);
                if (door && door.state === 'closed') {
                    let dAst = getDoorAsset(targetX, targetY, door.type);
                    if (dAst && dAst.tex) drawSideWall(dAst.tex, pStart, fStart, pRect.y - O, rect.y + O, pRect.y + pRect.h + O, rect.y + rect.h - O, flipTex ? dAst.tex.width : 0, flipTex ? 0 : dAst.tex.width, false, dAst.cfg, fogNear, fogFar, null);
                }
            } else if (door && door.state === 'open') {
                let dAst = getDoorAsset(targetX, targetY, door.type);
                drawSideWall(tex, pStart, fStart, pRect.y - O, rect.y + O, pRect.y + pRect.h + O, rect.y + rect.h - O, texS, texE, true, dAst.cfg, null, null, townCfg);
                if (dAst && dAst.tex) drawSideWall(dAst.tex, pStart, fStart, pRect.y - O, rect.y + O, pRect.y + pRect.h + O, rect.y + rect.h - O, flipTex ? dAst.tex.width : 0, flipTex ? 0 : dAst.tex.width, true, dAst.cfg, fogNear, fogFar, null);
            }
        };

        let maxSide = Math.min(25, Math.ceil((viewCanvas.width / 2) / rect.w) + 1);
        for (let i = maxSide; i >= 1; i--) {
            drawFloorAndCeil(cX + dx[leftDir] * i, cY + dy[leftDir] * i, -i);
            drawFloorAndCeil(cX + dx[rightDir] * i, cY + dy[rightDir] * i, i);
        }
        drawFloorAndCeil(cX, cY, 0);
        for (let i = maxSide; i >= 1; i--) {
            drawFrontWall(fX + dx[leftDir] * i, fY + dy[leftDir] * i, cX + dx[leftDir] * i, cY + dy[leftDir] * i, -i);
            drawFrontWall(fX + dx[rightDir] * i, fY + dy[rightDir] * i, cX + dx[rightDir] * i, cY + dy[rightDir] * i, i);
        }
        drawFrontWall(fX, fY, cX, cY, 0);

		// 🌟 FIX: Render side walls for ALL depths, not just the immediate tile
        // We use the same 'i' loop logic we used for floors/ceilings
        for (let i = maxSide; i >= 1; i--) {
            // Left Wall
            doSideWall(
                cX + dx[leftDir] * i, 
                cY + dy[leftDir] * i, 
                cX + dx[leftDir] * (i - 1), 
                cY + dy[leftDir] * (i - 1), 
                -i, 
                false
            );
            // Right Wall
            doSideWall(
                cX + dx[rightDir] * i, 
                cY + dy[rightDir] * i, 
                cX + dx[rightDir] * (i - 1), 
                cY + dy[rightDir] * (i - 1), 
                i, 
                true
            );
        }

        // 🌟 This maintains the logic for the immediate walls
        doSideWall(cX + dx[leftDir], cY + dy[leftDir], cX, cY, 0, false);
        doSideWall(cX + dx[rightDir], cY + dy[rightDir], cX, cY, 1, true);


        for (let i = 1; i <= maxSide; i++) {
            doSideWall(cX + dx[leftDir] * (i + 1), cY + dy[leftDir] * (i + 1), cX + dx[leftDir] * i, cY + dy[leftDir] * i, -i, false);
            doSideWall(cX + dx[rightDir] * (i + 1), cY + dy[rightDir] * (i + 1), cX + dx[rightDir] * i, cY + dy[rightDir] * i, i + 1, true);
        }
        ctx.filter = hasSky ? 'none' : `brightness(${Math.max(0, 1.0 - sAlphaFar)})`;

		// 🌟 UPDATED: Render Enemy in Combat
		if (typeof window.gameState !== 'undefined' && window.gameState === 'COMBAT' && typeof window.combatState !== 'undefined' && d === window.combatState.distance) {
			let safePort = window.combatState.activePortrait ? window.combatState.activePortrait.replace('.png', '.webp') : null;
			let sprite = window.getAtlasSprite(safePort);

			if (sprite && sprite.image.complete) {
				let sprH = rect.h * 0.95,
					sprW = sprH,
					sprX = rect.x + (rect.w - sprW) / 2,
					sprY = rect.y + rect.h - sprH;
				ctx.drawImage(sprite.image, sprite.frame.x, sprite.frame.y, sprite.frame.w, sprite.frame.h, sprX, sprY, sprW, sprH);
			}
		} 
		// 🌟 UPDATED: Render Entities (Chests, Enemies, etc.)
		else if (typeof entities !== 'undefined') {
			const drawEnts = (mX, mY, offset) => {
				if (!map[mY] || map[mY][mX] === undefined) return;
				let fL = rect.x + (rect.w * offset),
					pL = pRect.x + (pRect.w * offset);
				entities.forEach(ent => {
					if (ent.x === mX && ent.y === mY) {
						let sprW = rect.w * SPRITE_SCALE,
							sprH = rect.h * SPRITE_SCALE,
							sprX = fL + (rect.w - sprW) / 2;
						if (ent.type === 'chest' && ent.state === 'closed') {
							let cCanvas = getChestTexture(mX, mY);
							if (cCanvas && cCanvas.width > 0) ctx.drawImage(cCanvas, sprX, rect.y + rect.h - sprH + (sprH * SPRITE_Y_OFFSET), sprW, sprH);
						} else if (ent.type === 'enemy') {
							let eData = enemyBestiary.find(e => e.name === ent.name);
							if (eData) {
								let portraitStr = eData.portraits[Math.abs(mX * 73 + mY * 89) % eData.portraits.length].replace('.png', '.webp');
								let sprite = window.getAtlasSprite(portraitStr);
								if (sprite && sprite.image.complete) {
									ctx.drawImage(sprite.image, sprite.frame.x, sprite.frame.y, sprite.frame.w, sprite.frame.h, sprX, rect.y + rect.h - sprH, sprW, sprH);
								}
							}
						} else if (ent.type === 'transition' && !ent.wallX) {
							// 🌟 DYNAMIC TRANSITION ASSET RESOLVER
                            let tType = ent.transitionType || 'a';
                            let tDir = ent.direction || 'up';
                            let tKey = `transition-${tDir}-${tType}.webp`;

                            // Load on demand if not cached
                            if (!transCanvases[tKey]) {
                                let tImg = new Image();
                                tImg.src = `assets/${tKey}?v=${GAME_VERSION}`;
                                tImg.onload = () => { 
                                    let c = document.createElement('canvas'); c.width = tImg.width; c.height = tImg.height; 
                                    c.getContext('2d').drawImage(tImg, 0, 0); 
                                    transCanvases[tKey] = c;
                                };
                                transCanvases[tKey] = document.createElement('canvas'); // Placeholder
                            }

							let tCanvas = transCanvases[tKey];

							if (tCanvas && tCanvas.width > 0) {
								if (tDir === 'up') {
									// LADDER LOGIC
									let midW = (pRect.w + rect.w) / 2,
										midH = (pRect.h + rect.h) / 2,
										midY = (pRect.y + rect.y) / 2,
										midL = (pL + fL) / 2,
										ladH = midH * 1.0,
										ladW = ladH * (tCanvas.width / tCanvas.height),
										ladX = midL + (midW - ladW) / 2;
									ctx.drawImage(tCanvas, ladX, midY, ladW, ladH);
								} else {
									// GRATE LOGIC
									let xShift = 0.15; 
									let yShift = 0.20;
									let floorY = rect.y + rect.h;
									let sprW = rect.w * 0.7;
									let sprH = rect.h * 0.2; 
									let sprX = fL + (xShift * rect.w);
									let sprY = (floorY - sprH) + (yShift * rect.h);

									let buf = document.createElement('canvas');
									buf.width = tCanvas.width;
									buf.height = tCanvas.height;
									let bctx = buf.getContext('2d');
									bctx.drawImage(tCanvas, 0, 0);
									bctx.globalCompositeOperation = 'source-atop';
									bctx.fillStyle = fogFar; 
									bctx.fillRect(0, 0, buf.width, buf.height);
									bctx.globalCompositeOperation = 'source-over';
									ctx.drawImage(buf, sprX, sprY, sprW, sprH);
								}
							}
						}
                    }
                });
            };
            for (let i = maxSide; i >= 1; i--) {
                drawEnts(cX + dx[leftDir] * i, cY + dy[leftDir] * i, -i);
                drawEnts(cX + dx[rightDir] * i, cY + dy[rightDir] * i, i);
            }
            drawEnts(cX, cY, 0);
        }
        ctx.filter = 'none';
    }
}


// 🛡️ Master Shop Icon Dictionary & Colors
const SHOP_COLORS = {
    'armoury': '#ffd700', 'bowyer': '#8b4513', 'tavern': '#ff8c00',
    'healer': '#ff4444', 'spell_shop': '#9370db', 'gem_trader': '#00ffff',
    'potion_maker': '#32cd32', 'instrument_shop': '#ff69b4',
    'guild_hall': '#dc143c', 'temple': '#ffffff',
	'gate': '#777777',
	'dungeon_entrance': '#6a0dad',
	'forge_interaction': '#808080'
};

function drawShopIcon(ctx, type, x, y, w, h) {
    ctx.beginPath();
    if (type === 'armoury') {
        ctx.moveTo(x, y); ctx.lineTo(x+w, y); ctx.lineTo(x+w, y+h*0.4);
        ctx.bezierCurveTo(x+w, y+h*0.8, x+w*0.5, y+h, x+w*0.5, y+h);
        ctx.bezierCurveTo(x+w*0.5, y+h, x, y+h*0.8, x, y+h*0.4); ctx.lineTo(x, y);
    } else if (type === 'bowyer') {
        ctx.moveTo(x+w*0.3, y); ctx.quadraticCurveTo(x+w*1.1, y+h*0.5, x+w*0.3, y+h); // Bow Arc
        ctx.moveTo(x+w*0.3, y); ctx.lineTo(x+w*0.3, y+h); // String
    } else if (type === 'tavern') {
        ctx.rect(x+w*0.2, y+h*0.2, w*0.5, h*0.8); // Mug body
        ctx.moveTo(x+w*0.7, y+h*0.3); ctx.lineTo(x+w*0.9, y+h*0.3); ctx.lineTo(x+w*0.9, y+h*0.7); ctx.lineTo(x+w*0.7, y+h*0.7); // Handle
    } else if (type === 'healer') {
        let th = w*0.3;
        ctx.rect(x+w/2-th/2, y+h*0.1, th, h*0.8); ctx.rect(x+w*0.1, y+h/2-th/2, w*0.8, th); // Cross
    } else if (type === 'spell_shop') {
        for (let i = 0; i < 10; i++) { // 5-Pointed Star
            let a = Math.PI * 2 * i / 10 - Math.PI / 2;
            let r = (i % 2 === 0) ? w/2 : w/4;
            if (i===0) ctx.moveTo(x+w/2 + Math.cos(a)*r, y+h/2 + Math.sin(a)*r);
            else ctx.lineTo(x+w/2 + Math.cos(a)*r, y+h/2 + Math.sin(a)*r);
        }
    } else if (type === 'gem_trader') {
        ctx.moveTo(x+w/2, y+h*0.1); ctx.lineTo(x+w*0.9, y+h*0.5); ctx.lineTo(x+w/2, y+h*0.9); ctx.lineTo(x+w*0.1, y+h*0.5); // Diamond
    } else if (type === 'potion_maker') {
        ctx.moveTo(x+w*0.4, y+h*0.1); ctx.lineTo(x+w*0.6, y+h*0.1); ctx.lineTo(x+w*0.6, y+h*0.4); 
        ctx.lineTo(x+w*0.9, y+h*0.9); ctx.lineTo(x+w*0.1, y+h*0.9); ctx.lineTo(x+w*0.4, y+h*0.4); // Flask
    } else if (type === 'instrument_shop') {
        ctx.arc(x+w*0.3, y+h*0.75, w*0.25, 0, Math.PI*2); // Music Note
        ctx.moveTo(x+w*0.55, y+h*0.75); ctx.lineTo(x+w*0.55, y+h*0.1); ctx.lineTo(x+w*0.95, y+h*0.3); ctx.lineTo(x+w*0.95, y+h*0.5); ctx.lineTo(x+w*0.55, y+h*0.3);
    } else if (type === 'guild_hall') {
        ctx.moveTo(x+w*0.2, y+h*0.1); ctx.lineTo(x+w*0.2, y+h*0.9); // Pole
        ctx.moveTo(x+w*0.2, y+h*0.1); ctx.lineTo(x+w*0.9, y+h*0.35); ctx.lineTo(x+w*0.2, y+h*0.6); // Flag
    } else if (type === 'temple') {
        ctx.moveTo(x+w*0.1, y+h*0.4); ctx.lineTo(x+w*0.5, y+h*0.1); ctx.lineTo(x+w*0.9, y+h*0.4); // Roof
        ctx.rect(x+w*0.2, y+h*0.4, w*0.15, h*0.5); ctx.rect(x+w*0.65, y+h*0.4, w*0.15, h*0.5); // Pillars
    } else if (type === 'dungeon_entrance') {
        ctx.moveTo(x+w*0.2, y+h*0.9);
        ctx.lineTo(x+w*0.2, y+h*0.3);
        ctx.bezierCurveTo(x+w*0.2, y, x+w*0.8, y, x+w*0.8, y+h*0.3);
        ctx.lineTo(x+w*0.8, y+h*0.9);
        ctx.lineTo(x+w*0.5, y+h*0.5);
	} else if (type === 'gate') {        
        ctx.moveTo(x+w*0.2, y+h); ctx.lineTo(x+w*0.2, y+h*0.4);
        ctx.arc(x+w*0.5, y+h*0.4, w*0.3, Math.PI, 0);
        ctx.lineTo(x+w*0.8, y+h);
	} else if (type === 'forge_interaction') { 
        // 🌟 Anvil Icon Drawing
        ctx.moveTo(x+w*0.2, y+h*0.3); ctx.lineTo(x+w*0.8, y+h*0.3); // Top face
        ctx.lineTo(x+w*0.7, y+h*0.6); ctx.lineTo(x+w*0.3, y+h*0.6); ctx.closePath(); // Base
        ctx.moveTo(x+w*0.35, y+h*0.6); ctx.lineTo(x+w*0.35, y+h*0.8); // Leg left
        ctx.moveTo(x+w*0.65, y+h*0.6); ctx.lineTo(x+w*0.65, y+h*0.8); // Leg right
    } else {
        ctx.arc(x+w/2, y+h/2, w/2, 0, Math.PI*2); // Fallback circle
    }
    ctx.closePath();
}

// 🖼️ Generates a tiny invisible canvas image to use directly in the HTML Legend!
const shopIconCache = {};
function getShopIconDataURL(type) {
    if (shopIconCache[type]) return shopIconCache[type];
    let c = document.createElement('canvas'); c.width = 32; c.height = 32;
    let ctx = c.getContext('2d');
    ctx.fillStyle = SHOP_COLORS[type] || '#ffd700';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    drawShopIcon(ctx, type, 4, 4, 24, 24);
    ctx.fill(); ctx.stroke();
    shopIconCache[type] = c.toDataURL();
    return shopIconCache[type];
}

function drawMinimap() {
    const config = worldMaps[currentMapId];

    // 🛡️ GUARD: If map data isn't ready, don't try to draw anything!
    if (!config || !config.map || !config.map[0]) {
        return; 
    }

    // Use local references from config, not globals, to ensure stability
    const map = config.map;
    const discoveredMap = discoveredMaps[currentMapId];

    if (!discoveredMap || !discoveredMap[0]) return; 

    mctx.imageSmoothingEnabled = false;

    const cellSize = minimapCellSize;
    const viewW = mmCanvas.width;
    const viewH = mmCanvas.height;
    const cx = viewW / 2;
    const cy = viewH / 2;

    const px = (player.x * cellSize) + (cellSize / 2);
    const py = (player.y * cellSize) + (cellSize / 2);

    const camX = px - (viewW / 2);
    const camY = py - (viewH / 2);

    if (paperPat) {
        mctx.fillStyle = paperPat;
        mctx.fillRect(0, 0, viewW, viewH);
    } else {
        mctx.clearRect(0, 0, viewW, viewH);
    }


    mctx.strokeStyle = 'rgba(0,0,0,0.1)';
    mctx.lineWidth = 1;
    mctx.beginPath();
    for (let x = 0; x <= map[0].length; x++) {
        mctx.moveTo(x * cellSize - camX, 0 - camY);
        mctx.lineTo(x * cellSize - camX, map.length * cellSize - camY);
    }
    for (let y = 0; y <= map.length; y++) {
        mctx.moveTo(0 - camX, y * cellSize - camY);
        mctx.lineTo(map[0].length * cellSize - camX, y * cellSize - camY);
    }
    mctx.stroke();

    let legendItems = { wall: false, cityWall: false, dungeonEntrance: false, doorC: false, doorO: false, chestC: false, chestO: false, enemy: false, transition: false, shops: {}, gates: {}, dungeons: {}, forges: {}, trapActive: false, trapTriggered: false, trapDisarmed: false, trapDoor: false, message: false, quest: false };

    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            if (discoveredMap[y][x] === 1 && map[y][x] >= 1) {
                legendItems.wall = true;

                let drawX = x * cellSize - camX;
                let drawY = y * cellSize - camY;

                if (map[y][x] === 2) {
                    mctx.fillStyle = '#888888';
                    mctx.fillRect(drawX, drawY, cellSize, cellSize);
                    legendItems.cityWall = true;
				} else if (map[y][x] === 3) { 
					mctx.fillStyle = '#444444';
					mctx.fillRect(drawX, drawY, cellSize, cellSize);
                    legendItems.dungeonEntrance = true;
                } else {
                    if (worldMaps[currentMapId].theme === 'wilderness') {
                        mctx.fillStyle = '#2d4c1e';
                        mctx.fillRect(drawX, drawY, cellSize, cellSize);
                    }
                    if (hatchPat) {
                        let dynamicScale = cellSize / 96; 
                        hatchPat.setTransform(new DOMMatrix().scale(dynamicScale, dynamicScale));
                        mctx.globalCompositeOperation = 'multiply'; 
                        mctx.fillStyle = hatchPat;
                    } else {
                        mctx.fillStyle = '#443322'; 
                    }
                    mctx.fillRect(drawX, drawY, cellSize, cellSize);
                    mctx.globalCompositeOperation = 'source-over';
                }
            }
        }
    }

    if (typeof entities !== 'undefined') {
        entities.forEach(ent => {
            let isWallFeature = ent.type === 'shop' || ent.type === 'dungeon_gate' || (ent.type === 'transition' && ent.gateType);
            let rX = ent.wallX !== undefined ? ent.wallX : ent.x;
            let rY = ent.wallY !== undefined ? ent.wallY : ent.y;

            if (isWallFeature && discoveredMap[rY] && discoveredMap[rY][rX] === 1) {
                mctx.fillStyle = '#666666';
                mctx.fillRect(rX * cellSize - camX, rY * cellSize - camY, cellSize, cellSize);
            }
        });
    }


    mctx.strokeStyle = '#111';
    mctx.lineWidth = 3;
    mctx.lineCap = 'square';

    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            if (discoveredMap[y][x] === 1 && map[y][x] >= 1) {
                let dX = x * cellSize - camX;
                let dY = y * cellSize - camY;

                if (y === 0 || map[y-1][x] < 1) { mctx.beginPath(); mctx.moveTo(dX, dY); mctx.lineTo(dX+cellSize, dY); mctx.stroke(); } 
                if (y === map.length-1 || map[y+1][x] < 1) { mctx.beginPath(); mctx.moveTo(dX, dY+cellSize); mctx.lineTo(dX+cellSize, dY+cellSize); mctx.stroke(); } 
                if (x === 0 || map[y][x-1] < 1) { mctx.beginPath(); mctx.moveTo(dX, dY); mctx.lineTo(dX, dY+cellSize); mctx.stroke(); } 
                if (x === map[y].length-1 || map[y][x+1] < 1) { mctx.beginPath(); mctx.moveTo(dX+cellSize, dY); mctx.lineTo(dX+cellSize, dY+cellSize); mctx.stroke(); } 
            }
        }
    }

    if (typeof doors !== 'undefined') {
        doors.forEach(d => {
            let isVis = false;
            // Check visibility based on the axis of the door
            if (d.axis === 'x') { if (discoveredMap[d.y] && (discoveredMap[d.y][d.x-1] || discoveredMap[d.y][d.x])) isVis = true; }
            else { if (discoveredMap[d.y-1] && (discoveredMap[d.y-1][d.x] || discoveredMap[d.y][d.x])) isVis = true; }

            if (isVis) {
                // Determine color
                mctx.fillStyle = (d.state === 'closed') ? '#8b4513' : '#deb887';

                // 🌟 FIX: Render precisely in the center of the cell to match 3D rendering
                const lineWidth = Math.max(2, cellSize * 0.2);
                if (d.axis === 'x') {
                    // Vertical door line in the center of the cell
                    mctx.fillRect((d.x * cellSize) + (cellSize / 2) - (lineWidth / 2) - camX, (d.y * cellSize) - camY, lineWidth, cellSize);
                } else {
                    // Horizontal door line in the center of the cell
                    mctx.fillRect((d.x * cellSize) - camX, (d.y * cellSize) + (cellSize / 2) - (lineWidth / 2) - camY, cellSize, lineWidth);
                }
            }
        });
    }

    if (typeof entities !== 'undefined') {
        entities.forEach(ent => {
            let rX = ent.wallX !== undefined ? ent.wallX : ent.x;
            let rY = ent.wallY !== undefined ? ent.wallY : ent.y;

            if (discoveredMap[rY] && discoveredMap[rY][rX] === 1) {
                // 🌟 Standard Icon Size (50%)
                let eS = cellSize * 0.5;
                let margin = (cellSize - eS) / 2;
                let eX = rX * cellSize + margin - camX;
                let eY = rY * cellSize + margin - camY;

                if (ent.type === 'message' && ent.isDetected) {
                    legendItems.message = true;
                    mctx.fillStyle = '#fada5e';
                    mctx.fillRect(eX, eY, eS, eS);
                    mctx.strokeStyle = '#000';
                    mctx.lineWidth = 1;
                    mctx.strokeRect(eX, eY, eS, eS);

                    mctx.fillStyle = '#000';
                    mctx.textAlign = 'center';
                    mctx.textBaseline = 'middle';
                    mctx.font = `bold ${eS * 0.8}px Arial`;
                    mctx.fillText('?', eX + eS/2, eY + eS/2 + 1);
                }
                else if (ent.type === 'quest' && ent.isDetected) {
                    legendItems.quest = true;
                    mctx.fillStyle = '#FFD700';
                    mctx.strokeStyle = '#000';
                    mctx.lineWidth = 2;
                    mctx.textAlign = 'center';
                    mctx.textBaseline = 'middle';
                    mctx.font = `bold ${cellSize * 0.8}px Arial`;
                    mctx.strokeText('★', rX * cellSize + cellSize/2 - camX, rY * cellSize + cellSize/2 - camY + 2);
                    mctx.fillText('★', rX * cellSize + cellSize/2 - camX, rY * cellSize + cellSize/2 - camY + 2);
                }
                else if (ent.type === 'chest') {
                    if (ent.state === 'closed') { mctx.fillStyle = '#fada5e'; legendItems.chestC = true; } 
                    else { mctx.fillStyle = '#8b6508'; legendItems.chestO = true; } 
                    mctx.fillRect(eX, eY, eS, eS);
                    mctx.strokeRect(eX, eY, eS, eS); 
                } 
                else if (ent.type === 'enemy') {
                    mctx.fillStyle = '#cc0000'; legendItems.enemy = true;
                    mctx.beginPath(); mctx.arc(eX + eS/2, eY + eS/2, eS/2, 0, Math.PI*2); mctx.fill(); mctx.stroke();
                }
                else if (ent.type === 'shop') {
                    legendItems.shops[ent.name] = ent.shopType;
					mctx.fillStyle = '#fdfbf7';
                    mctx.fillStyle = SHOP_COLORS[ent.shopType] || '#ffd700'; 
                    drawShopIcon(mctx, ent.shopType, eX, eY, eS, eS);
                    mctx.fill(); mctx.stroke();
                }
                else if (ent.type === 'dungeon_gate') {
                    legendItems.dungeons[ent.name] = 'dungeon_entrance'; 
					mctx.fillStyle = '#fdfbf7';
                    mctx.fillStyle = SHOP_COLORS['dungeon_entrance']; 
                    drawShopIcon(mctx, 'dungeon_entrance', eX, eY, eS, eS);
                    mctx.fill(); mctx.stroke();
                }												
				else if (ent.type === 'forge_interaction') {
					legendItems.forges[ent.name || 'The Harmonic Forge'] = ent.type;

                    // 🌟 Forge Override: Larger Size (95%)
                    let forgeS = cellSize * 0.95;
                    let forgeMargin = (cellSize - forgeS) / 2;
                    let fx = rX * cellSize + forgeMargin - camX;
                    let fy = rY * cellSize + forgeMargin - camY;

                    mctx.fillStyle = SHOP_COLORS['forge_interaction'] || '#808080';
                    drawShopIcon(mctx, 'forge_interaction', fx, fy, forgeS, forgeS);
                    mctx.fill(); mctx.stroke();
				}	
				else if (ent.type === 'spinner' && ent.isDetected) {
					legendItems.spinner = true;
					let drawX = (ent.x * cellSize) - camX;
					let drawY = (ent.y * cellSize) - camY;
					mctx.fillStyle = '#ff00ff';
					mctx.beginPath();
					mctx.arc(drawX + cellSize/2, drawY + cellSize/2, cellSize*0.3, 0, Math.PI*2);
					mctx.fill();
					mctx.stroke();
				}	
				else if (ent.type === 'darkness') {
					if (ent.isDetected) {
						legendItems.darkness = true;
						mctx.fillStyle = '#111111'; 
						mctx.strokeStyle = '#333333';
						let drawX = ent.x * cellSize - camX;
						let drawY = ent.y * cellSize - camY;
						mctx.fillRect(drawX, drawY, cellSize, cellSize);
						mctx.strokeRect(drawX, drawY, cellSize, cellSize);
					 }
				}	

				else if (ent.type === 'anti_magic') {
					if (ent.isDetected) {
						legendItems.antiMagic = true;
						mctx.fillStyle = 'rgba(75, 0, 130, 0.7)';
						mctx.strokeStyle = '#fff';
						mctx.fillRect(ent.x * cellSize - camX, ent.y * cellSize - camY, cellSize, cellSize);
						mctx.strokeRect(ent.x * cellSize - camX, ent.y * cellSize - camY, cellSize, cellSize);
					}
				}

				else if (ent.type === 'silence') {
					if (ent.isDetected) {
						legendItems.silence = true;
						mctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
						mctx.strokeStyle = '#fff';
						mctx.fillRect(ent.x * cellSize - camX, ent.y * cellSize - camY, cellSize, cellSize);
						mctx.strokeRect(ent.x * cellSize - camX, ent.y * cellSize - camY, cellSize, cellSize);
					}
				}

				else if (ent.type === 'trap_door') {
					if (ent.isDetected) {
						legendItems.trapDoor = true;						
						mctx.fillStyle = '#5d4037'; 
						mctx.fillRect(ent.x * cellSize - camX, ent.y * cellSize - camY, cellSize, cellSize);
						mctx.fillStyle = '#4488ff';
						mctx.fillRect(ent.x * cellSize + cellSize*0.25 - camX, ent.y * cellSize + cellSize*0.25 - camY, cellSize*0.5, cellSize*0.5);
						return; 
					}
				}

				else if (ent.type === 'teleporter' && ent.isDetected) {
					legendItems.teleporter = true;
					mctx.fillStyle = '#00ffff';
					mctx.fillRect(ent.x * cellSize - camX, ent.y * cellSize - camY, cellSize, cellSize);
				}
				else if (ent.type === 'trap' && ent.isDetected) {
					let state = ent.state || 'active'; 
					if (state === 'active') legendItems.trapActive = true;
					else if (state === 'triggered') legendItems.trapTriggered = true;
					else if (state === 'disarmed') legendItems.trapDisarmed = true;

					let rX = ent.wallX !== undefined ? ent.wallX : ent.x;
					let rY = ent.wallY !== undefined ? ent.wallY : ent.y;

					let drawX = rX * cellSize + (cellSize * 0.25) - camX;
					let drawY = rY * cellSize + (cellSize * 0.25) - camY;
					let s = cellSize * 0.5; 

					if (state === 'active') mctx.fillStyle = '#aa0000';
					else if (state === 'triggered') mctx.fillStyle = '#555555';
					else if (state === 'disarmed') mctx.fillStyle = '#00aa00';

					mctx.beginPath();
					mctx.moveTo(drawX + s/2, drawY + s*0.2);
					mctx.lineTo(drawX + s*0.8, drawY + s*0.8);
					mctx.lineTo(drawX + s*0.2, drawY + s*0.8);
					mctx.fill();
					mctx.stroke();
				}
                else if (ent.type === 'transition') {
                    if (ent.wallX) {
                        legendItems.gates[ent.name] = 'gate'; 
						mctx.fillStyle = '#fdfbf7';
                        mctx.fillStyle = SHOP_COLORS['gate'] || '#777777'; 
                        drawShopIcon(mctx, 'gate', eX, eY, eS, eS);
                        mctx.fill(); mctx.stroke();
                    } else {
                        legendItems.transition = true;
                        mctx.fillStyle = '#4488ff';
                        mctx.fillRect(eX, eY, eS, eS);
                        mctx.strokeStyle = '#fff';
                        mctx.strokeRect(eX, eY, eS, eS);
                        mctx.fillStyle = '#000';
                        mctx.fillRect(eX + eS*0.25, eY + eS*0.25, eS*0.5, eS*0.5);
                    }
                }
            }
        });
    }

    // 🌟 UPDATED: Render Player with High-Contrast Direction Indicator
    mctx.fillStyle = '#4488ff'; 
    mctx.strokeStyle = '#000'; 
    mctx.lineWidth = 1.5;
    mctx.beginPath(); 
    mctx.arc(cx, cy, cellSize / 2.5, 0, Math.PI * 2); 
    mctx.fill(); 
    mctx.stroke();

    let pointerLen = cellSize * 0.75;
    mctx.lineCap = 'round';

    // Outer black outline to ensure it's visible on any background
    mctx.strokeStyle = '#000'; 
    mctx.lineWidth = 4.5; 
    mctx.beginPath(); 
    mctx.moveTo(cx, cy);
    mctx.lineTo(cx + dx[player.dir] * pointerLen, cy + dy[player.dir] * pointerLen); 
    mctx.stroke();

    // Inner bright white pointer
    mctx.strokeStyle = '#ffffff'; 
    mctx.lineWidth = 2.0; 
    mctx.beginPath(); 
    mctx.moveTo(cx, cy);
    mctx.lineTo(cx + dx[player.dir] * pointerLen, cy + dy[player.dir] * pointerLen); 
    mctx.stroke();

    let smallIconSize = "width: 8px; height: 8px; flex-shrink: 0;"; 

    let itemStyle = "font-size: 0.65rem; line-height: 1.0; margin-bottom: 1px;"; 
    let legHtml = '';
    let isWild = typeof worldMaps !== 'undefined' && worldMaps[currentMapId].theme === 'wilderness';
    let wallStyle = isWild 
        ? `background: #2d4c1e url('assets/mm_crosshatch.webp') center / 50px; background-blend-mode: multiply;` 
        : `background: transparent url('assets/mm_crosshatch.webp') center / 50px; mix-blend-mode: multiply;`;

    if (legendItems.wall) legHtml += `<div class="legend-item" style="${itemStyle}"><div class="legend-color" style="${smallIconSize} ${wallStyle}"></div>${typeof WALL_TYPE_NAME !== 'undefined' ? WALL_TYPE_NAME : 'Wall'}</div>`;
    if (legendItems.cityWall) legHtml += `<div class="legend-item" style="${itemStyle}"><div class="legend-color" style="${smallIconSize} background:#888888;"></div>City Walls</div>`;
    if (legendItems.dungeonEntrance) legHtml += `<div class="legend-item" style="${itemStyle}"><div class="legend-color" style="${smallIconSize} background:#444444;"></div>Dungeon Walls</div>`;
    if (legendItems.doorC) legHtml += `<div class="legend-item" style="${itemStyle}"><div class="legend-color" style="${smallIconSize} background:#8b4513;"></div>Closed Door</div>`;
    if (legendItems.doorO) legHtml += `<div class="legend-item" style="${itemStyle}"><div class="legend-color" style="${smallIconSize} background:#deb887;"></div>Open Door</div>`;
    if (legendItems.chestC) legHtml += `<div class="legend-item" style="${itemStyle}"><div class="legend-color" style="${smallIconSize} background:#fada5e;"></div>Loot</div>`;
    if (legendItems.chestO) legHtml += `<div class="legend-item" style="${itemStyle}"><div class="legend-color" style="${smallIconSize} background:#8b6508;"></div>Looted</div>`;
    if (legendItems.enemy) legHtml += `<div class="legend-item" style="${itemStyle}"><div class="legend-color" style="${smallIconSize} background:#cc0000; border-radius:50%;"></div>Monster</div>`; 
    if (legendItems.transition) legHtml += `<div class="legend-item" style="${itemStyle}"><div class="legend-color" style="${smallIconSize} background:#4488ff; border: 1px solid #fff; display:flex; justify-content:center; align-items:center;"><div style="width:50%; height:50%; background:#000;"></div></div>Stairs/Ladder</div>`;
	if (legendItems.spinner) legHtml += `<div class="legend-item" style="${itemStyle}"><div class="legend-color" style="${smallIconSize} background:#ff00ff; border-radius:50%;"></div>Spinner</div>`;
	if (legendItems.teleporter) legHtml += `<div class="legend-item" style="${itemStyle}"><div class="legend-color" style="${smallIconSize} background:#00ffff;"></div>Teleporter</div>`;
	if (legendItems.trapActive) 
		legHtml += `<div class="legend-item" style="${itemStyle}">${window.getTrapHtml('#aa0000', smallIconSize)} Trap</div>`;
	if (legendItems.trapTriggered) 
		legHtml += `<div class="legend-item" style="${itemStyle}">${window.getTrapHtml('#555555', smallIconSize)} Trap (triggered)</div>`;
	if (legendItems.trapDisarmed) 
		legHtml += `<div class="legend-item" style="${itemStyle}">${window.getTrapHtml('#00aa00', smallIconSize)} Trap (disarmed)</div>`;
	if (legendItems.darkness) legHtml += `<div class="legend-item" style="${itemStyle}"><div class="legend-color" style="${smallIconSize} background:#111111; border:1px solid #333;"></div>Darkness</div>`;
	if (legendItems.antiMagic) legHtml += `<div class="legend-item" style="${itemStyle}"><div class="legend-color" style="${smallIconSize} background:rgba(75, 0, 130, 0.7); border:1px solid #fff;"></div>Anti-Magic</div>`;
	if (legendItems.silence) legHtml += `<div class="legend-item" style="${itemStyle}"><div class="legend-color" style="${smallIconSize} background:rgba(100, 100, 100, 0.7); border:1px solid #fff;"></div>Silence</div>`;
	if (legendItems.trapDoor) legHtml += `<div class="legend-item" style="${itemStyle}"><div class="legend-color" style="${smallIconSize} background:#5d4037; border: 1px solid #4488ff;"><div style="width:50%; height:50%; background:#4488ff; margin:25%;"></div></div>Trap Door</div>`;
	if (legendItems.message) legHtml += `<div class="legend-item" style="${itemStyle}"><div class="legend-color" style="${smallIconSize} background:#fada5e; border:1px solid #000; color:#000; display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:7px;">?</div>Unknown</div>`;
    if (legendItems.quest) legHtml += `<div class="legend-item" style="${itemStyle}"><div class="legend-color" style="${smallIconSize} background:transparent; color:#FFD700; text-shadow: 1px 1px 1px #000; font-size:12px; display:flex; justify-content:center; align-items:center;">★</div>Quest Item</div>`;

    Object.keys(legendItems.shops).forEach(name => {
		let iconUrl = getShopIconDataURL(legendItems.shops[name]);
		legHtml += `<div class="legend-item" style="${itemStyle}"><div class="legend-color" style="${smallIconSize} background:url('${iconUrl}') center/contain no-repeat; border:none;"></div>${name}</div>`;
	});

	Object.keys(legendItems.gates).forEach(name => {
		let iconUrl = getShopIconDataURL('gate');
		legHtml += `<div class="legend-item" style="${itemStyle}"><div class="legend-color" style="${smallIconSize} background:url('${iconUrl}') center/contain no-repeat; border:none;"></div>${name}</div>`;
	});

	Object.keys(legendItems.dungeons).forEach(name => {
		let iconUrl = getShopIconDataURL('dungeon_entrance');
		legHtml += `<div class="legend-item" style="${itemStyle}"><div class="legend-color" style="${smallIconSize} background:url('${iconUrl}') center/contain no-repeat; border:none;"></div>${name}</div>`;
	});

	Object.keys(legendItems.forges).forEach(name => {
		let iconUrl = getShopIconDataURL('forge_interaction');
        // 🌟 FIX: Use the standard .legend-item class and .legend-color class.
        // We override the size using a specific inline style that is applied AFTER the class.
		legHtml += `
            <div class="legend-item" style="${itemStyle}">
                <div class="legend-color" style="width: 14px; height: 14px; background: url('${iconUrl}') center/contain no-repeat; border: none;"></div>
                ${name}
            </div>`;
	});

    let legEl = document.getElementById('minimap-legend-box');
    if(legEl) {
        legEl.style.gap = "0px";
        legEl.innerHTML = legHtml;
    }
}


function renderParty() {
    const listEl = document.getElementById('party-list');

    // 🌟 NEW: Class Styling Configuration mapped for the Roster
    const classStyleMap = {
        "Warrior": { color: "#a52a2a", icon: "&#59773;" }, // Sword
        "Paladin": { color: "#8b6508", icon: "&#60054;" }, // Shield
        "Rogue":   { color: "#2e8b57", icon: "&#59768;" }, // Bow
        "Mage":    { color: "#0044aa", icon: "&#59830;" }, // Magic
        "Healer":  { color: "#008000", icon: "&#59898;" }, // Heart
        "Bard":    { color: "#cc5500", icon: "&#59899;" }, // Spark/Note
        "Summon":  { color: "#aa44ff", icon: "&#xe9a5;" }  // Default Summon (Monster/Dragon)
    };

    // 🌟 UPDATED: Widened the final column (1.5fr) to fit the text + icon gracefully
    listEl.innerHTML = `
        <div class="roster-header" style="grid-template-columns: 20px 30px 4fr 1fr 2.5fr 2.5fr 1.5fr;">
            <div></div><div class="col-num">#</div>
            <div style="padding-left: 60px;">NAME</div><div class="col-ac">AC</div>
            <div style="text-align:center;">HP</div><div style="text-align:center;">SP</div>
            <div class="col-cl">CLS</div>
        </div>`;

    party.forEach((char, index) => {
        const charEl = document.createElement('div');
        charEl.dataset.index = index;
        // 🌟 Ensure rows maintain the exact same column structure as the header
        charEl.style.gridTemplateColumns = "20px 30px 4fr 1fr 2.5fr 2.5fr 1.5fr";

        if (char.name !== "Empty") {
            charEl.draggable = true; 
            charEl.addEventListener('dragstart', handleDragStart); 
            charEl.addEventListener('dragover', handleDragOver); 
            charEl.addEventListener('drop', handleDrop);
            charEl.addEventListener('dragenter', handleDragEnter); 
            charEl.addEventListener('dragleave', handleDragLeave);
            charEl.addEventListener('dragend', handleDragEnd);

            charEl.addEventListener('click', (e) => { 
                if(e.target.closest('.reorder-arrows')) return; 
                if (window.gameState === 'COMBAT') return; 
                openCharSheet(index); 
            });

            // 🌟 Updated Portrait Logic using the class we created in the last step
            let pPath = window.getCharPortrait(char);
            let pUrl = char.isSummon ? window.getSpriteDataUrl(pPath) : `${pPath}?v=${GAME_VERSION}`;
            let portraitSpan = `<span class="roster-portrait" style="background-image: url('${pUrl}');"></span>`;

            let arrowsHtml = `<div class="reorder-arrows"><div onclick="movePartyMember(event, ${index}, -1)">▲</div><div onclick="movePartyMember(event, ${index}, 1)">▼</div></div>`;
            let defClass = char.isDefending ? 'char-defending' : '';
            charEl.className = `character clickable-char ${defClass} ` + (char.race === 'Vibrant' ? 'vibrant' : '');

            let totalAc = char.baseAc || 0;
            ['Body', 'Helmet', 'Gloves', 'Boots', 'Offhand', 'Ring1', 'Ring2'].forEach(s => {
                let id = char.equipped[s];
                if (id && typeof itemDB !== 'undefined' && itemDB[id] && itemDB[id].ac) totalAc += itemDB[id].ac;
            });
			if (char.isSummon && char.enemyData) totalAc = -Math.abs(char.enemyData.ac || 0);

            let hpPct = Math.max(0, (char.hp / char.maxHp) * 100);
            let hpColor = hpPct <= 20 ? '#cc0000' : (hpPct <= 50 ? '#ffcc00' : '#00cc00');
            let hasSp = char.maxMp > 0;
            let spPct = hasSp ? Math.max(0, (char.mp / char.maxMp) * 100) : 0;
            let resLabel = char.class === 'Bard' ? 'Songs' : 'SP';
            let resColor = char.class === 'Bard' ? '#cc5500' : '#0044aa';
            let spHtml = hasSp ? `<div class="roster-bar-bg" title="${resLabel}: ${char.mp}/${char.maxMp}"><div class="roster-bar-fill" style="width:${spPct}%; background:${resColor};"></div><span class="roster-bar-text">${char.mp}/${char.maxMp}</span></div>` : ``;
            let aIcon = char.ailments && char.ailments.length > 0 ? `<span style="font-size: 0.9rem; margin-right: 4px;" title="${char.ailments.join(', ')}">${AILMENT_ICONS[char.ailments[0]] || '❓'}</span>` : '';

            // 🌟 NEW: Format the Class string with correct colors and RPG Awesome icons
            // Make a copy so we don't accidentally mutate the global classStyleMap!
            let clsStyle = { ...(classStyleMap[char.class] || { color: "#5a2e0e", icon: "" }) };

            // 🌟 DYNAMIC SUMMON ICONS BASED ON CATEGORY
            if (char.isSummon && char.enemyData) {
				let cat = char.enemyData.category || "monster";
				
				if (cat === "humanoid") {
					clsStyle.icon = "&#xea48;"; 
					clsStyle.color = "#4488ff";
				} else if (cat === "beast") {
					clsStyle.icon = "&#xea32;"; 
					clsStyle.color = "#44aa44";
				} else if (cat === "undead") {
					clsStyle.icon = "&#xe98c;"; 
					clsStyle.color = "#aa0000";
				} else {
					clsStyle.icon = "&#xe9a2;"; 
					clsStyle.color = "#aa44ff";
				}
			}

            let clHtml = `<span style="color: ${clsStyle.color};">${char.class.substring(0, 2)} <span style="font-family: 'RPG Awesome'; font-weight: normal; font-size: 1.2rem; vertical-align: middle;">${clsStyle.icon}</span></span>`;

            charEl.innerHTML = `
                ${arrowsHtml}
                <div class="col-num">${index+1}</div>
                <div class="col-name">${portraitSpan}${aIcon}${char.name}</div>
                <div class="col-ac">${totalAc}</div>
                <div class="col-bar">
                    <div class="roster-bar-bg" title="HP: ${char.hp}/${char.maxHp}">
                        <div class="roster-bar-fill" style="width:${hpPct}%; background:${hpColor};"></div>
                        <span class="roster-bar-text">${char.hp}/${char.maxHp}</span>
                    </div>
                </div>
                <div class="col-bar">${spHtml}</div>
                <div class="col-cl">${clHtml}</div>
            `;
        } else {
            charEl.draggable = false;
            charEl.className = 'character';
            charEl.innerHTML = `
                <div></div>
                <div class="col-num">${index+1}</div>
                <div class="col-name" style="color:rgba(34,17,0,0.5);">(Empty)</div>
                <div class="col-ac">-</div>
                <div class="col-bar"><div class="roster-bar-bg"><span class="roster-bar-text" style="color:#555;">- / -</span></div></div>
                <div class="col-bar"></div>
                <div class="col-cl">-</div>
            `;
        }
        listEl.appendChild(charEl);
    });
}


let dragStartIndex = null;
function handleDragStart(e) { dragStartIndex = parseInt(this.dataset.index); this.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/html', this.innerHTML); }
function handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; return false; }
function handleDragEnter(e) { this.classList.add('drag-over'); }
function handleDragLeave(e) { this.classList.remove('drag-over'); }
function handleDragEnd(e) { this.classList.remove('dragging'); document.querySelectorAll('.character').forEach(c => c.classList.remove('drag-over')); }
function handleDrop(e) { e.stopPropagation(); let dropIndex = parseInt(this.dataset.index); if (dragStartIndex !== dropIndex) { let temp = party[dragStartIndex]; party[dragStartIndex] = party[dropIndex]; party[dropIndex] = temp; renderParty(); } return false; }

window.movePartyMember = function(e, index, direction) { 
    e.stopPropagation(); 
    let newIndex = index + direction; 
    
    if (newIndex >= 0 && newIndex < party.length) { 
        if (party[newIndex].name === "Empty") return; 
        
        let temp = party[index]; 
        party[index] = party[newIndex]; 
        party[newIndex] = temp; 
        renderParty(); 
    } 
}

function update() {
    calculateFOV();

    // 🌟 Trigger message discovery check BEFORE rendering
    if (typeof window.checkMessageDiscovery === 'function') {
        window.checkMessageDiscovery();
    }

    drawView();
    drawMinimap();

    if (typeof checkInteractable === 'function') {
        checkInteractable();
    }
}

let bigMapZoom = 1.5;

window.renderBigMapCanvas = function() {
    const config = worldMaps[currentMapId];
    if (!config) return null;

    // 🌟 Update Title
    let displayLvl = config.townLevel !== undefined ? config.townLevel : (currentMapId === 'wilderness' ? window.getDynamicLevel() : dungeonLevel);
    let titleEl = document.getElementById('big-map-title');
    if (titleEl) {
        titleEl.innerHTML = `${config.name} <span id="big-map-level" style="font-size: 1.2rem; color: #5a2e0e;">(Lvl ${displayLvl})</span>`;
    }

    // 1. Initialize data locally
    let map = config.map && config.map.length > 0 ? config.map : Array.from({ length: 30 }, () => Array(30).fill(0));

    // 2. Ensure discovery data exists
    if (!discoveredMaps[currentMapId] || discoveredMaps[currentMapId].length === 0 || !discoveredMaps[currentMapId][0]) {
        discoveredMaps[currentMapId] = Array.from({ length: map.length }, () => Array(map[0].length).fill(0));
    }
    let discoveredMap = discoveredMaps[currentMapId];

    // 3. Set a large fixed resolution
    bmCanvas.width = 1200;
    bmCanvas.height = 1200;

    bctx.imageSmoothingEnabled = false;
    bctx.clearRect(0, 0, bmCanvas.width, bmCanvas.height);

    // Calculate scaling
    const baseCellSize = Math.floor(Math.min(bmCanvas.width / map[0].length, bmCanvas.height / map.length));
    const cellSize = baseCellSize * bigMapZoom; 

    let mapPixelW = map[0].length * cellSize;
    let mapPixelH = map.length * cellSize;

    let offsetX, offsetY;

    if (bigMapZoom === 1.0) {
        offsetX = (bmCanvas.width - mapPixelW) / 2;
        offsetY = (bmCanvas.height - mapPixelH) / 2;
    } else {
        let playerPixelX = (player.x * cellSize) + (cellSize / 2);
        let playerPixelY = (player.y * cellSize) + (cellSize / 2);

        offsetX = (bmCanvas.width / 2) - playerPixelX;
        offsetY = (bmCanvas.height / 2) - playerPixelY;

        if (mapPixelW > bmCanvas.width) {
            offsetX = Math.min(0, Math.max(bmCanvas.width - mapPixelW, offsetX));
        } else {
            offsetX = (bmCanvas.width - mapPixelW) / 2;
        }

        if (mapPixelH > bmCanvas.height) {
            offsetY = Math.min(0, Math.max(bmCanvas.height - mapPixelH, offsetY));
        } else {
            offsetY = (bmCanvas.height - mapPixelH) / 2;
        }
    }

    let legendItems = { wall: false, cityWall: false, dungeonEntrance: false, doorC: false, doorO: false, chestC: false, chestO: false, enemy: false, transition: false, shops: {}, gates: {}, dungeons: {}, forges: {}, trapActive: false, trapTriggered: false, trapDisarmed: false, trapDoor: false, message: false, quest: false };

    // 4. Draw Tile Backgrounds
    bctx.strokeStyle = 'rgba(0,0,0,0.1)'; 
    bctx.lineWidth = 1;

    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            let isDiscovered = (discoveredMap[y] && discoveredMap[y][x] === 1);
            let drawX = offsetX + x * cellSize;
            let drawY = offsetY + y * cellSize;

            if (isDiscovered) {
                if (map[y][x] === 0) {
                    bctx.fillStyle = 'rgba(255, 255, 255, 0.15)'; 
                    bctx.fillRect(drawX, drawY, cellSize, cellSize);
                }

                bctx.strokeRect(drawX, drawY, cellSize, cellSize);

                if (map[y][x] >= 1) {
                    legendItems.wall = true;
                    if (map[y][x] === 2) {
                        bctx.fillStyle = '#888888';
                        bctx.fillRect(drawX, drawY, cellSize, cellSize);
                        legendItems.cityWall = true;
                    } else if (map[y][x] === 3) { 
                        bctx.fillStyle = '#444444';
                        bctx.fillRect(drawX, drawY, cellSize, cellSize);
                        legendItems.dungeonEntrance = true;
                    } else {
                        if (config.theme === 'wilderness') {
                            bctx.fillStyle = '#2d4c1e';
                            bctx.fillRect(drawX, drawY, cellSize, cellSize);
                        }
                        if (hatchPat) {
                            let dynamicScale = cellSize / 96; 
                            hatchPat.setTransform(new DOMMatrix().scale(dynamicScale, dynamicScale));
                            bctx.globalCompositeOperation = 'multiply'; 
                            bctx.fillStyle = hatchPat;
                        } else {
                            bctx.fillStyle = '#443322'; 
                        }
                        bctx.fillRect(drawX, drawY, cellSize, cellSize);
                        bctx.globalCompositeOperation = 'source-over';
                    }
                }
            } 
        }
    }

    // 5. Draw Walls Borders
    bctx.strokeStyle = '#111'; bctx.lineWidth = Math.max(1, cellSize * 0.1); bctx.lineCap = 'square';
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            if (discoveredMap[y] && discoveredMap[y][x] === 1) {
                if (map[y][x] >= 1) {
                    let dX = offsetX + x * cellSize;
                    let dY = offsetY + y * cellSize;

                    let tDisc = y === 0 || (discoveredMap[y-1] && discoveredMap[y-1][x] === 1);
                    let bDisc = y === map.length-1 || (discoveredMap[y+1] && discoveredMap[y+1][x] === 1);
                    let lDisc = x === 0 || discoveredMap[y][x-1] === 1;
                    let rDisc = x === map[y].length-1 || discoveredMap[y][x+1] === 1;

                    if ((y === 0 || map[y-1][x] < 1) && tDisc) { bctx.beginPath(); bctx.moveTo(dX, dY); bctx.lineTo(dX+cellSize, dY); bctx.stroke(); } 
                    if ((y === map.length-1 || map[y+1][x] < 1) && bDisc) { bctx.beginPath(); bctx.moveTo(dX, dY+cellSize); bctx.lineTo(dX+cellSize, dY+cellSize); bctx.stroke(); } 
                    if ((x === 0 || map[y][x-1] < 1) && lDisc) { bctx.beginPath(); bctx.moveTo(dX, dY); bctx.lineTo(dX, dY+cellSize); bctx.stroke(); } 
                    if ((x === map[y].length-1 || map[y][x+1] < 1) && rDisc) { bctx.beginPath(); bctx.moveTo(dX+cellSize, dY); bctx.lineTo(dX+cellSize, dY+cellSize); bctx.stroke(); } 
                }
            }
        }
    }

    // 6. Draw Doors
    if (typeof doors !== 'undefined') {
        doors.forEach(d => {
            let isVis = false;
            if (d.axis === 'x') { if (discoveredMap[d.y] && (discoveredMap[d.y][d.x-1] || discoveredMap[d.y][d.x])) isVis = true; }
            else { if (discoveredMap[d.y-1] && (discoveredMap[d.y-1][d.x] || discoveredMap[d.y][d.x])) isVis = true; }

            if (isVis) {
                bctx.fillStyle = (d.state === 'closed') ? '#8b4513' : '#deb887';

                // 🌟 FIX: Render precisely in the center of the cell to match 3D rendering
                const lineWidth = Math.max(2, cellSize * 0.2);
                if (d.axis === 'x') {
                    // Vertical door line
                    bctx.fillRect(offsetX + (d.x * cellSize) + (cellSize / 2) - (lineWidth / 2), offsetY + (d.y * cellSize), lineWidth, cellSize);
                } else {
                    // Horizontal door line
                    bctx.fillRect(offsetX + (d.x * cellSize), offsetY + (d.y * cellSize) + (cellSize / 2) - (lineWidth / 2), cellSize, lineWidth);
                }
            }
        });
    }


    // 7. Draw Entities
    if (typeof entities !== 'undefined') {
        entities.forEach(ent => {
            let rX = ent.wallX !== undefined ? ent.wallX : ent.x;
            let rY = ent.wallY !== undefined ? ent.wallY : ent.y;
            if (discoveredMap[rY] && discoveredMap[rY][rX] === 1) {
                let eX = offsetX + (rX * cellSize), eY = offsetY + (rY * cellSize), eS = cellSize;

                // SHOP/GATE/FORGE ICON DRAWING
                if (ent.type === 'shop' || ent.type === 'dungeon_gate' || ent.type === 'forge_interaction' || (ent.type === 'transition' && ent.wallX)) {
                    let type = ent.shopType || (ent.type === 'dungeon_gate' ? 'dungeon_entrance' : (ent.type === 'forge_interaction' ? 'forge_interaction' : 'gate'));

                    if (ent.type === 'shop') legendItems.shops[ent.name] = type;
                    else if (ent.type === 'dungeon_gate') legendItems.dungeons[ent.name] = type;
                    else if (ent.type === 'forge_interaction') legendItems.forges[ent.name || 'The Harmonic Forge'] = type;
                    else legendItems.gates[ent.name] = type;

                    bctx.fillStyle = SHOP_COLORS[type] || '#ffd700';
                    drawShopIcon(bctx, type, eX, eY, eS, eS);
                    bctx.fill(); bctx.stroke();
                }
                // EVERYTHING ELSE
                else {
                    if (ent.type === 'message' && ent.isDetected) {
                        legendItems.message = true;
                        bctx.fillStyle = '#fada5e';
                        bctx.fillRect(eX + eS*0.25, eY + eS*0.25, eS*0.5, eS*0.5);
                        bctx.strokeStyle = '#000';
                        bctx.lineWidth = 1;
                        bctx.strokeRect(eX + eS*0.25, eY + eS*0.25, eS*0.5, eS*0.5);

                        bctx.fillStyle = '#000';
                        bctx.textAlign = 'center';
                        bctx.textBaseline = 'middle';
                        bctx.font = `bold ${eS * 0.4}px Arial`;
                        bctx.fillText('?', eX + eS/2, eY + eS/2 + 1);
                    }
                    else if (ent.type === 'quest' && ent.isDetected) {
                        legendItems.quest = true;
                        bctx.fillStyle = '#FFD700';
                        bctx.strokeStyle = '#000';
                        bctx.lineWidth = 2;
                        bctx.textAlign = 'center';
                        bctx.textBaseline = 'middle';
                        bctx.font = `bold ${eS * 0.8}px Arial`;
                        bctx.strokeText('★', eX + eS/2, eY + eS/2 + 2);
                        bctx.fillText('★', eX + eS/2, eY + eS/2 + 2);
                    }
                    else if (ent.type === 'chest') {
                        if (ent.state === 'closed') { bctx.fillStyle = '#fada5e'; legendItems.chestC = true; } 
                        else { bctx.fillStyle = '#8b6508'; legendItems.chestO = true; } 
                        bctx.fillRect(eX + eS*0.25, eY + eS*0.25, eS*0.5, eS*0.5);
                        bctx.strokeRect(eX + eS*0.25, eY + eS*0.25, eS*0.5, eS*0.5); 
                    } 
                    else if (ent.type === 'enemy') {
                        bctx.fillStyle = '#cc0000'; legendItems.enemy = true;
                        bctx.beginPath(); bctx.arc(eX + eS/2, eY + eS/2, eS/3, 0, Math.PI*2); bctx.fill(); bctx.stroke();
                    }
                    else if (ent.type === 'transition') {
						legendItems.transition = true;
                        bctx.fillStyle = '#4488ff'; bctx.fillRect(eX+eS*0.25, eY+eS*0.25, eS*0.5, eS*0.5);
                        bctx.strokeStyle = '#fff'; bctx.strokeRect(eX+eS*0.25, eY+eS*0.25, eS*0.5, eS*0.5);
                    }
                    else if (ent.type === 'spinner' && ent.isDetected) {
                        legendItems.spinner = true;
                        bctx.fillStyle = '#ff00ff';
                        bctx.beginPath(); bctx.arc(eX + eS/2, eY + eS/2, eS*0.3, 0, Math.PI*2); bctx.fill(); bctx.stroke();
                    }
                    else if (ent.type === 'darkness' && ent.isDetected) {
                        legendItems.darkness = true;
                        bctx.fillStyle = '#111111'; bctx.strokeStyle = '#333333';
                        bctx.fillRect(eX, eY, eS, eS); bctx.strokeRect(eX, eY, eS, eS);
                    }
                    else if (ent.type === 'anti_magic' && ent.isDetected) {
                        legendItems.antiMagic = true;
                        bctx.fillStyle = 'rgba(75, 0, 130, 0.7)'; bctx.strokeStyle = '#fff';
                        bctx.fillRect(eX, eY, eS, eS); bctx.strokeRect(eX, eY, eS, eS);
                    }
                    else if (ent.type === 'silence' && ent.isDetected) {
                        legendItems.silence = true;
                        bctx.fillStyle = 'rgba(100, 100, 100, 0.7)'; bctx.strokeStyle = '#fff';
                        bctx.fillRect(eX, eY, eS, eS); bctx.strokeRect(eX, eY, eS, eS);
                    }
                    else if (ent.type === 'trap_door' && ent.isDetected) {
                        legendItems.trapDoor = true;                        
                        bctx.fillStyle = '#5d4037'; bctx.fillRect(eX, eY, eS, eS);
                        bctx.fillStyle = '#4488ff'; bctx.fillRect(eX + eS*0.25, eY + eS*0.25, eS*0.5, eS*0.5);
						return;
                    }
                    else if (ent.type === 'teleporter' && ent.isDetected) {
                        legendItems.teleporter = true;
                        bctx.fillStyle = '#00ffff';
                        bctx.fillRect(eX, eY, eS, eS);

                        if (ent.destX !== undefined && ent.destY !== undefined) {
                            bctx.beginPath();
                            bctx.strokeStyle = '#00ffff';
                            bctx.lineWidth = 2;
                            bctx.moveTo(eX + eS / 2, eY + eS / 2);
                            bctx.lineTo(offsetX + (ent.destX * cellSize) + (cellSize / 2), 
                                        offsetY + (ent.destY * cellSize) + (cellSize / 2));
                            bctx.stroke();
                        }
                    }
                    else if (ent.type === 'trap' && ent.isDetected) {
                        if (ent.state === 'active') legendItems.trapActive = true;
                        else if (ent.state === 'triggered') legendItems.trapTriggered = true;
                        else if (ent.state === 'disarmed') legendItems.trapDisarmed = true;

                        if (ent.state === 'active') bctx.fillStyle = '#aa0000';
                        else if (ent.state === 'triggered') bctx.fillStyle = '#555555';
                        else if (ent.state === 'disarmed') bctx.fillStyle = '#00aa00';

                        bctx.beginPath();
                        bctx.moveTo(eX + eS*0.5, eY + eS*0.2);
                        bctx.lineTo(eX + eS*0.8, eY + eS*0.8);
                        bctx.lineTo(eX + eS*0.2, eY + eS*0.8);
                        bctx.fill(); bctx.stroke();
                    }
                }
            }
        });
    }

    // 7. Hover Highlight
    if (window.highlightedPoint) {
        bctx.strokeStyle = '#000000';
        bctx.lineWidth = 8;
        bctx.beginPath();
        bctx.arc(offsetX + (window.highlightedPoint.x * cellSize) + cellSize/2, offsetY + (window.highlightedPoint.y * cellSize) + cellSize/2, cellSize, 0, Math.PI * 2);
        bctx.stroke();
    }

    // 🌟 UPDATED: Apply the same high-contrast direction indicator to the Full Map!
    let px = offsetX + (player.x * cellSize) + (cellSize / 2);
    let py = offsetY + (player.y * cellSize) + (cellSize / 2);
    let pRadius = Math.max(3, cellSize / 2.5);

    bctx.fillStyle = '#4488ff'; 
    bctx.strokeStyle = '#000';
    bctx.lineWidth = 1.5;
    bctx.beginPath(); 
    bctx.arc(px, py, pRadius, 0, Math.PI * 2); 
    bctx.fill(); 
    bctx.stroke();

    let pointerLen = Math.max(5, cellSize * 0.75);
    bctx.lineCap = 'round';

    // Black Outline
    bctx.strokeStyle = '#000';
    bctx.lineWidth = 4.5;
    bctx.beginPath();
    bctx.moveTo(px, py);
    bctx.lineTo(px + dx[player.dir] * pointerLen, py + dy[player.dir] * pointerLen);
    bctx.stroke();

    // White Inner Line
    bctx.strokeStyle = '#fff';
    bctx.lineWidth = 2.0;
    bctx.beginPath();
    bctx.moveTo(px, py);
    bctx.lineTo(px + dx[player.dir] * pointerLen, py + dy[player.dir] * pointerLen);
    bctx.stroke();

    return legendItems;
};


window.renderBigMapLegend = function(legendItems) {
    if (!legendItems) return;

    let iconSize = "width: 24px; height: 24px; flex-shrink: 0;"; 
    let legHtml = '';
    let isWild = typeof worldMaps !== 'undefined' && worldMaps[currentMapId].theme === 'wilderness';
    let wallStyle = isWild ? `background: #2d4c1e url('assets/mm_crosshatch.webp') center / 50px; background-blend-mode: multiply;` : `background: transparent url('assets/mm_crosshatch.webp') center / 50px; mix-blend-mode: multiply;`;

    // Helper for hover effects
    const addListeners = (x, y) => `onmouseover="window.highlightMapPoint(${x}, ${y}, true)" onmouseout="window.highlightMapPoint(${x}, ${y}, false)"`;

    // 1. Render Static/Non-Interactive Legend Items
    if (legendItems.wall) legHtml += `<div class="legend-item"><div class="legend-color" style="${iconSize} ${wallStyle}"></div>${typeof WALL_TYPE_NAME !== 'undefined' ? WALL_TYPE_NAME : 'Wall'}</div>`;
    if (legendItems.cityWall) legHtml += `<div class="legend-item"><div class="legend-color" style="${iconSize} background:#888888;"></div>City Walls</div>`;
    if (legendItems.dungeonEntrance) legHtml += `<div class="legend-item"><div class="legend-color" style="${iconSize} background:#444444;"></div>Dungeon Walls</div>`;
    if (legendItems.doorC) legHtml += `<div class="legend-item"><div class="legend-color" style="${iconSize} background:#8b4513;"></div>Closed Door</div>`;
    if (legendItems.doorO) legHtml += `<div class="legend-item"><div class="legend-color" style="${iconSize} background:#deb887;"></div>Open Door</div>`;
    if (legendItems.chestC) legHtml += `<div class="legend-item"><div class="legend-color" style="${iconSize} background:#fada5e;"></div>Loot</div>`;
    if (legendItems.chestO) legHtml += `<div class="legend-item"><div class="legend-color" style="${iconSize} background:#8b6508;"></div>Looted</div>`;
    if (legendItems.enemy) legHtml += `<div class="legend-item"><div class="legend-color" style="${iconSize} background:#cc0000; border-radius:50%;"></div>Monster</div>`; 
    if (legendItems.transition) legHtml += `<div class="legend-item"><div class="legend-color" style="${iconSize} background:#4488ff; border: 2px solid #fff; display:flex; justify-content:center; align-items:center;"><div style="width:50%; height:50%; background:#000;"></div></div>Stairs/Ladder</div>`;
    if (legendItems.spinner) legHtml += `<div class="legend-item"><div class="legend-color" style="${iconSize} background:#ff00ff; border-radius:50%;"></div>Spinner</div>`;
    if (legendItems.teleporter) legHtml += `<div class="legend-item"><div class="legend-color" style="${iconSize} background:#00ffff;"></div>Teleporter</div>`;
    if (legendItems.trapActive) legHtml += `<div class="legend-item" style="${iconSize}">${window.getTrapHtml('#aa0000', iconSize)} Trap</div>`;
    if (legendItems.trapTriggered) legHtml += `<div class="legend-item" style="${iconSize}">${window.getTrapHtml('#555555', iconSize)} Trap (triggered)</div>`;
    if (legendItems.trapDisarmed) legHtml += `<div class="legend-item" style="${iconSize}">${window.getTrapHtml('#00aa00', iconSize)} Trap (disarmed)</div>`;
    if (legendItems.darkness) legHtml += `<div class="legend-item"><div class="legend-color" style="${iconSize} background:#111111; border:1px solid #333;"></div>Darkness</div>`;
    if (legendItems.antiMagic) legHtml += `<div class="legend-item"><div class="legend-color" style="${iconSize} background:rgba(75, 0, 130, 0.7); border:1px solid #fff;"></div>Anti-Magic</div>`;
    if (legendItems.silence) legHtml += `<div class="legend-item"><div class="legend-color" style="${iconSize} background:rgba(100, 100, 100, 0.7); border:1px solid #fff;"></div>Silence</div>`;
    if (legendItems.trapDoor) { legHtml += `<div class="legend-item"><div class="legend-color" style="${iconSize} background:#5d4037; border: 1px solid #4488ff; display:flex; justify-content:center; align-items:center;"><div style="width:50%; height:50%; background:#4488ff;"></div></div>Trap Door</div>`; }
    if (legendItems.message) legHtml += `<div class="legend-item"><div class="legend-color" style="${iconSize} background:#fada5e; border:1px solid #000; color:#000; display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:16px;">?</div>Unknown</div>`;

    // 🌟 Added Quest Item legend entry
    if (legendItems.quest) legHtml += `<div class="legend-item"><div class="legend-color" style="${iconSize} background:transparent; color:#FFD700; text-shadow: 1px 1px 1px #000; font-size:20px; display:flex; justify-content:center; align-items:center;">★</div>Quest Item</div>`;

    // 2. Render Interactive Entities (Only if Discovered!)
    if (typeof entities !== 'undefined' && typeof discoveredMap !== 'undefined') {
        entities.forEach(ent => {
            let rX = ent.wallX !== undefined ? ent.wallX : ent.x;
            let rY = ent.wallY !== undefined ? ent.wallY : ent.y;

            // Only add if discovered on the map
            if (discoveredMap[rY] && discoveredMap[rY][rX] === 1) {
                if (ent.type === 'shop' || ent.type === 'dungeon_gate' || ent.type === 'forge_interaction' || (ent.type === 'transition' && ent.wallX)) {
                    let type = ent.shopType || (ent.type === 'dungeon_gate' ? 'dungeon_entrance' : (ent.type === 'forge_interaction' ? 'forge_interaction' : 'gate'));
                    let name = ent.name || ent.desc;
                    let iconUrl = getShopIconDataURL(type);
                    let canTravel = window.canFastTravelTo(name);

                    legHtml += `
                        <div class="legend-item" ${addListeners(rX, rY)} data-name="${name.replace(/'/g, '&#39;')}" data-travel="${canTravel}" style="cursor: ${canTravel ? 'pointer' : 'default'}; padding: 4px; color: ${canTravel ? '#006600' : '#333'};">
                            <div class="legend-color" style="${iconSize} background:url('${iconUrl}') center/contain no-repeat; border:none;"></div>
                            ${name} ${canTravel ? '' : ''}
                        </div>`;
                }
            }
        });
    }

    document.getElementById('big-map-legend-box').innerHTML = legHtml || `<div style="padding:10px; color:#555; font-style:italic;">No locations discovered.</div>`;
};


window.drawBigMap = function() {
    let legendItems = window.renderBigMapCanvas();
    if(legendItems) {
        window.renderBigMapLegend(legendItems);
    }
};

window.highlightMapPoint = function(x, y, isHovering) {
    window.highlightedPoint = isHovering ? { x, y } : null;
    window.renderBigMapCanvas(); // ONLY refresh the map, not the legend HTML
};


window.isAnimating = false;

const animCanvas = document.createElement('canvas');
animCanvas.id = 'anim-canvas';
animCanvas.style.position = 'absolute'; 
animCanvas.style.top = '0'; 
animCanvas.style.left = '0';
animCanvas.style.width = '100%'; 
animCanvas.style.height = '100%';
animCanvas.style.pointerEvents = 'none'; 
animCanvas.style.display = 'none'; 
animCanvas.style.zIndex = '5'; 

let container = document.getElementById('canvas-container');
if(container) { 
    container.style.position = 'relative'; 
    container.appendChild(animCanvas); 
}

const actx = animCanvas.getContext('2d');
actx.imageSmoothingEnabled = true;

window.animateView = function(type, stateUpdateCallback) {
    window.isAnimating = true;
    const w = viewCanvas.width;
    const h = viewCanvas.height;
    
    animCanvas.width = w; animCanvas.height = h;
    const oldFrame = document.createElement('canvas');
    oldFrame.width = w; oldFrame.height = h;
    oldFrame.getContext('2d').drawImage(viewCanvas, 0, 0);
    
    animCanvas.style.display = 'block';
    stateUpdateCallback(); 
    
    let startTime = performance.now();
    const duration = 250; 
    
    function animFrame(now) {
        let elapsed = now - startTime;
        let progress = Math.min(elapsed / duration, 1.0);
        
        let ease = 1 - Math.pow(1 - progress, 3); 
        
        actx.clearRect(0, 0, w, h);

        if (type === 'turnRight') {
            actx.fillStyle = '#050403'; actx.fillRect(0, 0, w, h);
            actx.drawImage(oldFrame, -w * ease, 0); 
            actx.drawImage(viewCanvas, w - w * ease, 0);
        } 
        else if (type === 'turnLeft') {
            actx.fillStyle = '#050403'; actx.fillRect(0, 0, w, h);
            actx.drawImage(oldFrame, w * ease, 0); 
            actx.drawImage(viewCanvas, -w + w * ease, 0);
        } 
        else if (type === 'forward') {
            actx.drawImage(viewCanvas, 0, 0);
            
            let scale = 1 + (ease * 0.1); 
            let dx = (w - (w * scale)) / 2;
            let dy = (h - (h * scale)) / 2;
            
            actx.globalAlpha = 1.0 - ease;
            actx.drawImage(oldFrame, dx, dy, w * scale, h * scale);
            actx.globalAlpha = 1.0;
        } 
        else if (type === 'backward') {
            actx.drawImage(oldFrame, 0, 0);
            
            let scale = 0.5 + (ease * 0.5); 
            let dx = (w - (w * scale)) / 2;
            let dy = (h - (h * scale)) / 2;
            
            actx.globalAlpha = ease;
            actx.drawImage(viewCanvas, dx, dy, w * scale, h * scale);
            actx.globalAlpha = 1.0;
        }
        
        if (progress < 1.0) {
            requestAnimationFrame(animFrame);
        } else { 
            animCanvas.style.display = 'none'; 
            window.isAnimating = false; 
            
            // 🌟 NEW: The animation is done. Was there a queued key press? Execute it instantly!
            if (typeof window.queuedAction === 'function') {
                let nextAction = window.queuedAction;
                window.queuedAction = null; // Clear the buffer
                nextAction(); // Run the stored move/turn!
            }
        }
    }
    requestAnimationFrame(animFrame);
};

window.highlightedPoint = null;

window.highlightMapPoint = function(x, y, isHovering) {
    if (isHovering) {
        window.highlightedPoint = { x, y };
    } else {
        window.highlightedPoint = null;
    }

    // Only refresh the drawing, NOT the legend HTML
    window.renderBigMapCanvas();
};