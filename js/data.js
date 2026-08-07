// js/data.js
// /mnt/AppPool/lyrewight1_app/src/update_maps.sh

let currentMapId = "vaults_1";
const player = { x: 7, y: 19, dir: 0 }; // Change 0 to 0 (North), 1 (East), 2 (South), or 3 (West)

//let currentMapId = "the_lair_1";
//const player = { x: 7, y: 11, dir: 3 }; 

//let currentMapId = "white_palace_5";
//const player = { x: 23, y: 29, dir: 0 }; 

const sharedInventory = new Array(100).fill(null);
const questInventory = []; // 🌟 NEW: Separate unlimited quest storage
let sharedGold = 0;

const spellDB = {
    // === 🔮 MAGE SPELLS (Levels 1 - 30) ===
    "m_1": { name: "Arcane Dart", classReq: "Mage", levelReq: 1, type: "damage", element: "arcane", target: "enemy", mpCost: 4, minDmg: 4, maxDmg: 8, combatUsable: true, exploreUsable: false, maxRange: 4, magical: true },
    "m_2": { name: "Spark", classReq: "Mage", levelReq: 2, type: "damage", element: "lightning", target: "enemy", mpCost: 6, minDmg: 6, maxDmg: 12, combatUsable: true, exploreUsable: false, maxRange: 4, magical: true },
	"m_2b": { name: "Summon", classReq: "Mage", levelReq: 2, type: "summon", target: "party", mpCost: 6, combatUsable: true, exploreUsable: true, magical: true },
    "m_3": { name: "Frostbite", classReq: "Mage", levelReq: 3, type: "damage", element: "ice", target: "enemy", mpCost: 8, minDmg: 8, maxDmg: 16, combatUsable: true, exploreUsable: false, maxRange: 4, magical: true },
    "m_4": { name: "Mage Light", classReq: "Mage", levelReq: 4, type: "light", target: "party", mpCost: 10, lightRadius: 4, duration: 250, combatUsable: false, exploreUsable: true, magical: true },
    "m_5": { name: "Fireball", classReq: "Mage", levelReq: 5, type: "damage", element: "fire", target: "enemy", mpCost: 12, minDmg: 15, maxDmg: 25, combatUsable: true, exploreUsable: false, maxRange: 5, magical: true },
    "m_6": { name: "Arcane Wave", classReq: "Mage", levelReq: 6, type: "damage", element: "arcane", target: "all_enemies", mpCost: 15, minDmg: 8, maxDmg: 14, combatUsable: true, exploreUsable: false, maxRange: 4 , magical: true},
    "m_7": { name: "Ice Lance", classReq: "Mage", levelReq: 7, type: "damage", element: "ice", target: "enemy", mpCost: 16, minDmg: 17, maxDmg: 35, combatUsable: true, exploreUsable: false, maxRange: 5 },
    "m_8": { name: "Lightning Bolt", classReq: "Mage", levelReq: 8, type: "damage", element: "lightning", target: "enemy", mpCost: 18, minDmg: 25, maxDmg: 45, combatUsable: true, exploreUsable: false, maxRange: 5, magical: true },
    "m_9": { name: "Scorching Ray", classReq: "Mage", levelReq: 9, type: "damage", element: "fire", target: "enemy", mpCost: 20, minDmg: 30, maxDmg: 55, combatUsable: true, exploreUsable: false, maxRange: 6, magical: true },
    "m_10": { name: "Blizzard", classReq: "Mage", levelReq: 10, type: "damage", element: "ice", target: "all_enemies", mpCost: 22, minDmg: 15, maxDmg: 25, combatUsable: true, exploreUsable: false, maxRange: 5, magical: true },
    "m_11": { name: "Void Strike", classReq: "Mage", levelReq: 11, type: "damage", element: "void", target: "enemy", mpCost: 25, minDmg: 40, maxDmg: 70, combatUsable: true, exploreUsable: false, maxRange: 6, magical: true },
    "m_12": { name: "Chain Lightning", classReq: "Mage", levelReq: 12, type: "damage", element: "lightning", target: "all_enemies", mpCost: 45, minDmg: 20, maxDmg: 35, combatUsable: true, exploreUsable: false, maxRange: 5, magical: true },
    "m_13": { name: "Portal to Barrowtown", classReq: "Mage", levelReq: 13, type: "teleport", target: "party", mpCost: 25, combatUsable: false, exploreUsable: true, magical: true },
    "m_14": { name: "Fireblast", classReq: "Mage", levelReq: 14, type: "damage", element: "fire", target: "enemy", mpCost: 30, minDmg: 55, maxDmg: 90, combatUsable: true, exploreUsable: false, maxRange: 6, magical: true },
    "m_15": { name: "Meteor", classReq: "Mage", levelReq: 15, type: "damage", element: "fire", target: "enemy", mpCost: 35, minDmg: 70, maxDmg: 120, combatUsable: true, exploreUsable: false, maxRange: 7, magical: true },
    "m_16": { name: "Inferno", classReq: "Mage", levelReq: 16, type: "damage", element: "fire", target: "all_enemies", mpCost: 37, minDmg: 35, maxDmg: 55, combatUsable: true, exploreUsable: false, maxRange: 6, magical: true },
    "m_17": { name: "Glacial Spike", classReq: "Mage", levelReq: 17, type: "damage", element: "ice", target: "enemy", mpCost: 40, minDmg: 85, maxDmg: 140, combatUsable: true, exploreUsable: false, maxRange: 7, magical: true },
    "m_18": { name: "Arcane Barrage", classReq: "Mage", levelReq: 18, type: "damage", element: "arcane", target: "all_enemies", mpCost: 42, minDmg: 45, maxDmg: 70, combatUsable: true, exploreUsable: false, maxRange: 6, magical: true },
    "m_19": { name: "Disintegrate", classReq: "Mage", levelReq: 19, type: "damage", element: "arcane", target: "enemy", mpCost: 45, minDmg: 110, maxDmg: 180, combatUsable: true, exploreUsable: false, maxRange: 7, magical: true },
    "m_20": { name: "Gravity Well", classReq: "Mage", levelReq: 20, type: "damage", element: "void", target: "all_enemies", mpCost: 50, minDmg: 60, maxDmg: 90, combatUsable: true, exploreUsable: false, maxRange: 6, magical: true },
    "m_21": { name: "Sunfire Ray", classReq: "Mage", levelReq: 21, type: "damage", element: "holy", target: "enemy", mpCost: 55, minDmg: 140, maxDmg: 220, combatUsable: true, exploreUsable: false, maxRange: 8, magical: true },
    "m_22": { name: "Meteor Swarm", classReq: "Mage", levelReq: 22, type: "damage", element: "fire", target: "all_enemies", mpCost: 60, minDmg: 80, maxDmg: 120, combatUsable: true, exploreUsable: false, maxRange: 7, magical: true },
    "m_23": { name: "Absolute Zero", classReq: "Mage", levelReq: 23, type: "damage", element: "ice", target: "enemy", mpCost: 65, minDmg: 170, maxDmg: 260, combatUsable: true, exploreUsable: false, maxRange: 8, magical: true },
    "m_24": { name: "Supernova", classReq: "Mage", levelReq: 24, type: "damage", element: "fire", target: "all_enemies", mpCost: 70, minDmg: 100, maxDmg: 150, combatUsable: true, exploreUsable: false, maxRange: 7, magical: true },
    "m_25": { name: "Black Hole", classReq: "Mage", levelReq: 25, type: "damage", element: "void", target: "enemy", mpCost: 75, minDmg: 210, maxDmg: 320, combatUsable: true, exploreUsable: false, maxRange: 8, magical: true },
    "m_26": { name: "Comet Strike", classReq: "Mage", levelReq: 26, type: "damage", element: "ice", target: "all_enemies", mpCost: 80, minDmg: 130, maxDmg: 190, combatUsable: true, exploreUsable: false, maxRange: 8, magical: true },
    "m_27": { name: "Reality Rend", classReq: "Mage", levelReq: 27, type: "damage", element: "void", target: "enemy", mpCost: 85, minDmg: 260, maxDmg: 400, combatUsable: true, exploreUsable: false, maxRange: 9, magical: true },
    "m_28": { name: "Cataclysm", classReq: "Mage", levelReq: 28, type: "damage", element: "void", target: "all_enemies", mpCost: 90, minDmg: 170, maxDmg: 240, combatUsable: true, exploreUsable: false, maxRange: 8, magical: true },
    "m_29": { name: "Power Word: Kill", classReq: "Mage", levelReq: 29, type: "damage", element: "dark", target: "enemy", mpCost: 100, minDmg: 350, maxDmg: 550, combatUsable: true, exploreUsable: false, maxRange: 9, magical: true },
    "m_30": { name: "Wish", classReq: "Mage", levelReq: 30, type: "siphon_mp", element: "arcane", target: "all_enemies", mpCost: 0, minDmg: 50, maxDmg: 100, combatUsable: true, exploreUsable: false, maxRange: 9, magical: true },

    // === 🌿 HEALER SPELLS (Levels 1 - 30) ===
    "h_1": { name: "Minor Heal", classReq: "Healer", levelReq: 1, type: "heal", target: "ally", mpCost: 5, healAmount: 25, combatUsable: true, exploreUsable: true, magical: true },
    "h_11": { name: "Awaken", classReq: "Healer", levelReq: 2, type: "cure", target: "ally", mpCost: 5, cures: ["Sleep"], combatUsable: true, exploreUsable: true, magical: true },
	"h_3": { name: "Cure Poison", classReq: "Healer", levelReq: 3, type: "cure", target: "ally", mpCost: 5, cures: ["Poison"], combatUsable: true, exploreUsable: true, magical: true },
	"h_6": { name: "Cure Disease", classReq: "Healer", levelReq: 4, type: "cure", target: "ally", mpCost: 6, cures: ["Disease"], combatUsable: true, exploreUsable: true, magical: true },
	"h_8": { name: "Clarity", classReq: "Healer", levelReq: 5, type: "cure", target: "ally", mpCost: 7, cures:["Confusion", "Madness", "Blindness"], combatUsable: true, exploreUsable: true, magical: true },
	"h_13": { name: "Unbind", classReq: "Healer", levelReq: 6, type: "cure", target: "ally", mpCost: 8, cures:["Paralysis", "Frozen"], combatUsable: true, exploreUsable: true, magical: true },	
	"h_2": { name: "Holy Smite", classReq: "Healer", levelReq: 7, type: "damage", element: "holy", target: "enemy", mpCost: 6, minDmg: 4, maxDmg: 10, combatUsable: true, exploreUsable: false, maxRange: 4, magical: true },    
    "h_4": { name: "Siphon Life", classReq: "Healer", levelReq: 8, type: "siphon_hp", element: "dark", target: "enemy", mpCost: 10, minDmg: 8, maxDmg: 16, combatUsable: true, exploreUsable: false, maxRange: 4, magical: true },
    "h_5": { name: "Heal", classReq: "Healer", levelReq: 9, type: "heal", target: "ally", mpCost: 14, healAmount: 80, combatUsable: true, exploreUsable: true, magical: true },    
    "h_7": { name: "Holy Light", classReq: "Healer", levelReq: 10, type: "light", target: "party", mpCost: 8, lightRadius: 4, duration: 250, combatUsable: false, exploreUsable: true, magical: true },    
    "h_9": { name: "Siphon Spirit", classReq: "Healer", levelReq: 11, type: "siphon_mp", element: "dark", target: "enemy", mpCost: 0, minDmg: 10, maxDmg: 20, combatUsable: true, exploreUsable: false, maxRange: 5, magical: true }, 
    "h_10": { name: "Major Heal", classReq: "Healer", levelReq: 12, type: "heal", target: "ally", mpCost: 20, healAmount: 150, combatUsable: true, exploreUsable: true, magical: true },    
    "h_12": { name: "Divine Strike", classReq: "Healer", levelReq: 13, type: "damage", element: "holy", target: "enemy", mpCost: 22, minDmg: 35, maxDmg: 60, combatUsable: true, exploreUsable: false, maxRange: 5, magical: true },    
    "h_14": { name: "Inflict Plague", classReq: "Healer", levelReq: 14, type: "damage", element: "dark", target: "all_enemies", mpCost: 25, minDmg: 20, maxDmg: 40, combatUsable: true, exploreUsable: false, maxRange: 5, magical: true },
    "h_15": { name: "Purify", classReq: "Healer", levelReq: 15, type: "cure_all", target: "ally", mpCost: 10, combatUsable: true, exploreUsable: true, magical: true },
    "h_16": { name: "Mass Heal", classReq: "Healer", levelReq: 16, type: "party_heal", target: "party", mpCost: 30, healAmount: 120, combatUsable: true, exploreUsable: true, magical: true },
    "h_17": { name: "Holy Word", classReq: "Healer", levelReq: 17, type: "damage", element: "holy", target: "all_enemies", mpCost: 35, minDmg: 40, maxDmg: 65, combatUsable: true, exploreUsable: false, maxRange: 6, magical: true },
    "h_18": { name: "Resurrect", classReq: "Healer", levelReq: 18, type: "revive", target: "ally", mpCost: 50, healAmount: 100, combatUsable: true, exploreUsable: true, magical: true },
    "h_19": { name: "Siphon Soul", classReq: "Healer", levelReq: 19, type: "siphon_hp", element: "dark", target: "enemy", mpCost: 25, minDmg: 60, maxDmg: 100, combatUsable: true, exploreUsable: false, maxRange: 6, magical: true },
    "h_20": { name: "Grand Heal", classReq: "Healer", levelReq: 20, type: "heal", target: "ally", mpCost: 35, healAmount: 400, combatUsable: true, exploreUsable: true, magical: true },
    "h_21": { name: "Celestial Ray", classReq: "Healer", levelReq: 21, type: "damage", element: "holy", target: "enemy", mpCost: 40, minDmg: 90, maxDmg: 150, combatUsable: true, exploreUsable: false, maxRange: 7, magical: true },
    "h_22": { name: "Divine Wrath", classReq: "Healer", levelReq: 22, type: "damage", element: "holy", target: "all_enemies", mpCost: 45, minDmg: 65, maxDmg: 100, combatUsable: true, exploreUsable: false, maxRange: 7, magical: true },
    "h_23": { name: "Supreme Heal", classReq: "Healer", levelReq: 23, type: "heal", target: "ally", mpCost: 45, healAmount: 800, combatUsable: true, exploreUsable: true, magical: true },
    "h_24": { name: "Siphon Essence", classReq: "Healer", levelReq: 24, type: "siphon_mp", element: "dark", target: "enemy", mpCost: 0, minDmg: 40, maxDmg: 80, combatUsable: true, exploreUsable: false, maxRange: 7, magical: true },
    "h_25": { name: "Grand Mass Heal", classReq: "Healer", levelReq: 25, type: "party_heal", target: "party", mpCost: 55, healAmount: 350, combatUsable: true, exploreUsable: true, magical: true },
    "h_26": { name: "Heavenly Strike", classReq: "Healer", levelReq: 26, type: "damage", element: "holy", target: "enemy", mpCost: 55, minDmg: 160, maxDmg: 250, combatUsable: true, exploreUsable: false, maxRange: 8, magical: true },
    "h_27": { name: "Mass Purify", classReq: "Healer", levelReq: 27, type: "cure_all", target: "party", mpCost: 60, combatUsable: true, exploreUsable: true, magical: true },
    "h_28": { name: "Hand of God", classReq: "Healer", levelReq: 28, type: "damage", element: "holy", target: "all_enemies", mpCost: 75, minDmg: 110, maxDmg: 170, combatUsable: true, exploreUsable: false, maxRange: 8, magical: true },
    "h_29": { name: "True Resurrection", classReq: "Healer", levelReq: 29, type: "revive", target: "ally", mpCost: 75, healAmount: 9999, combatUsable: true, exploreUsable: true, magical: true },
    "h_30": { name: "Miracle", classReq: "Healer", levelReq: 30, type: "party_heal", target: "party", mpCost: 100, healAmount: 9999, combatUsable: true, exploreUsable: true, magical: true },
	
	// === 🛡️ PALADIN SPELLS ===
    "p_3": { name: "Divine Heart", classReq: "Paladin", levelReq: 3, type: "heal", target: "ally", mpCost: 10, healAmount: 40, combatUsable: true, exploreUsable: false, magical: true },
    "p_6": { name: "Holy Cause", classReq: "Paladin", levelReq: 6, type: "damage", element: "holy", target: "enemy", mpCost: 12, minDmg: 15, maxDmg: 30, combatUsable: true, exploreUsable: false, maxRange: 2, magical: true, cures: ["Poison", "Disease", "Paralysis", "Sleep", "Madness", "Confusion", "Blindness", "Frozen"] }, 
    "p_10": { name: "Cleansing Touch", classReq: "Paladin", levelReq: 10, type: "cure_one", target: "ally", mpCost: 20, combatUsable: true, exploreUsable: false, magical: true },
    "p_15": { name: "Aura of Valor", classReq: "Paladin", levelReq: 15, type: "party_heal", target: "party", mpCost: 35, healAmount: 80, combatUsable: true, exploreUsable: false, magical: true },
	"p_20": { name: "Holy Inspiration", classReq: "Paladin", levelReq: 20, type: "buff", buffType: "undeadDmg", target: "ally", mpCost: 40, duration: 2, combatUsable: true, exploreUsable: false, magical: true },
    "p_25": { name: "Crusader's Speech", classReq: "Paladin", levelReq: 25, type: "party_buff", buffType: "undeadDmg", target: "party", mpCost: 80, duration: 2, combatUsable: true, exploreUsable: false, magical: true },
    "p_30": { name: "Aegis of Light", classReq: "Paladin", levelReq: 30, type: "party_buff", buffType: "undeadResist", target: "party", mpCost: 120, duration: 3, combatUsable: true, exploreUsable: false, magical: true },
	
	// === 🎵 BARD SONGS ===
    "b_1": { name: "Song of Vigor", classReq: "Bard", levelReq: 1, type: "party_buff", buffType: "inspiration", target: "party", mpCost: 1, duration: 2, combatUsable: true, exploreUsable: false, magical: false },
    "b_3": { name: "Lullaby", classReq: "Bard", levelReq: 3, type: "inflict_ailment", ailment: "Sleep", target: "all_enemies", mpCost: 1, combatUsable: true, exploreUsable: false, magical: false },
    "b_6": { name: "Taunting Shanty", classReq: "Bard", levelReq: 6, type: "buff", buffType: "taunt", target: "self", mpCost: 1, duration: 1, combatUsable: true, exploreUsable: false, magical: false },
    "b_9": { name: "Dirge of Shadows", classReq: "Bard", levelReq: 9, type: "damage", element: "void", target: "all_enemies", mpCost: 2, minDmg: 15, maxDmg: 30, combatUsable: true, exploreUsable: false, maxRange: 5, magical: false },
    "b_12": { name: "March of the Swift", classReq: "Bard", levelReq: 12, type: "party_buff", buffType: "haste", target: "party", mpCost: 2, duration: 0, combatUsable: true, exploreUsable: false, magical: false },
    "b_15": { name: "Cacophony", classReq: "Bard", levelReq: 15, type: "damage", element: "arcane", target: "all_enemies", mpCost: 2, minDmg: 35, maxDmg: 60, combatUsable: true, exploreUsable: false, maxRange: 6, magical: false },
    "b_18": { name: "Anthem of Resilience", classReq: "Bard", levelReq: 18, type: "party_buff", buffType: "resist_magic", target: "party", mpCost: 3, duration: -2, combatUsable: true, exploreUsable: false, magical: false },
    "b_21": { name: "Siren's Call", classReq: "Bard", levelReq: 21, type: "inflict_ailment", ailment: "Madness", target: "all_enemies", mpCost: 3, combatUsable: true, exploreUsable: false, magical: false },
    "b_23": { name: "Requiem of the Fallen", classReq: "Bard", levelReq: 23, type: "party_revive", target: "party", mpCost: 4, healAmount: 250, combatUsable: true, exploreUsable: true, magical: false },
    "b_25": { name: "Aegis of the Maestro", classReq: "Bard", levelReq: 25, type: "party_buff", buffType: "wight_ward", target: "party", mpCost: 5, duration: -4, combatUsable: true, exploreUsable: false, magical: false }
	
};

let party = [];
let guildRoster =[];

// Initialize the Fog of War for ALL maps
let discoveredMaps = {}; 
for (let key in worldMaps) {
    // 🌟 FIX: Safety check to prevent errors on unloaded external maps
    if (worldMaps[key].map && worldMaps[key].map.length > 0) {
        discoveredMaps[key] = worldMaps[key].map.map(row => row.map(() => 0));
    }
}

// 🌟 ACTIVE GAME STATE VARIABLES (Now using 'let' so we can change them!)
let map = []; 
let discoveredMap = [];
let entities = worldMaps[currentMapId].entities;
let doors = worldMaps[currentMapId].doors;
let dungeonLevel = worldMaps[currentMapId].level;
let WALL_TYPE_NAME = worldMaps[currentMapId].wallName;

const dx =[0, 1, 0, -1];
const dy = [-1, 0, 1, 0];

function getConBonus(con, scale) {
    if (con <= 18) {
        return con * scale;
    } else {
        // First 18 points provide standard bonus
        // Points above 18 provide double the bonus
        return (18 * scale) + ((con - 18) * (scale * 2));
    }
}

// ==========================================
// 🛠️ DYNAMIC PARTY STAT INITIALIZATION
// ==========================================
function recalculatePartyStats() {
    party.forEach(char => {
        if (char.name === "Empty") return;
        // 🌟 FIX: Skip summoned creatures so their stats remain intact
        if (char.isSummon) return;

        let lvl = char.level || 1;
        let con = char.stats.CON || 10;
        let int = char.stats.INT || 10;
        let wis = char.stats.WIS || 10;
        let cha = char.stats.CHA || 10;

        // 🌟 RE-BALANCED FORMULA
        let hpBase = 0, hpLvlScale = 0, hpConScale = 1;
        let mpBase = 0, mpLvlScale = 0, mpStatScale = 0;

        if (char.class === "Warrior") { 
            hpBase = -8; hpLvlScale = 24; 
        }
        else if (char.class === "Paladin") { 
            hpBase = -10; hpLvlScale = 23; 
            mpBase = 0; mpLvlScale = 4; mpStatScale = 0.8;
        }
        else if (char.class === "Rogue") { 
            hpBase = -10; hpLvlScale = 20; 
        }
        else if (char.class === "Bard") { 
            hpBase = -10; hpLvlScale = 18; 
            char.maxMp = lvl; // Bard Songs scaling
        }
        else if (char.class === "Healer") { 
            hpBase = -12; hpLvlScale = 16; 
            mpBase = 2; mpLvlScale = 5; mpStatScale = 1.5;
        }
        else if (char.class === "Mage") { 
            hpBase = -15; hpLvlScale = 14; 
            mpBase = 2; mpLvlScale = 5; mpStatScale = 1.5; 
        }

        // Apply HP Formula
        char.maxHp = Math.max(15, Math.floor(hpBase + (lvl * hpLvlScale) + (con * hpConScale)));

        // Apply SP Formula (Only if not already set by the Bard override)
        if (char.class === "Paladin") {
            char.maxMp = Math.floor(mpBase + (lvl * mpLvlScale) + (wis * mpStatScale));
        } else if (char.class === "Healer") {
            char.maxMp = Math.floor(mpBase + (lvl * mpLvlScale) + (wis * mpStatScale));
        } else if (char.class === "Mage") {
            char.maxMp = Math.floor(mpBase + (lvl * mpLvlScale) + (int * mpStatScale));
        } else if (char.class !== "Bard") {
            char.maxMp = 0;
        }

        // 🌟 FIX: Removed aggressive legacy auto-heal that resurrected dead members!
        // We now solely ensure current HP/MP doesn't exceed the newly scaled maximums.
        if (char.hp > char.maxHp) char.hp = char.maxHp;
        if (char.mp > char.maxMp) char.mp = char.maxMp;
    });
}

// Run this immediately when data.js loads!
recalculatePartyStats();

function getDoor(xA, yA, xB, yB) {
    for (let d of doors) {
        if (d.axis === 'x' && Math.min(xA, xB) === d.x - 1 && Math.max(xA, xB) === d.x && yA === d.y && yB === d.y) return d;
        if (d.axis === 'y' && Math.min(yA, yB) === d.y - 1 && Math.max(yA, yB) === d.y && xA === d.x && xB === d.x) return d;
    }
    return null;
}