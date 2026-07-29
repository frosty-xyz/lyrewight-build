// js/items.js

const itemDB = {
    // === ⚔️ WEAPONS ===
    // 🟠 Vibrant (Resonant Bronze) Weapons (Levels 1 - 30)
    
    // DAGGERS (Fast, Low Dmg, High LUK/Crit themes later)
    "dagger_bronze": { name: "Bronze Dagger", slot: "Weapon", subType: "bronze_weapon", tab: "Weapon", level: 1, minDmg: 1, maxDmg: 4, value: 10, icon: "item_dagger_bronze.webp" },
	"sword_bronze": { name: "Bronze Sword", slot: "Weapon", subType: "bronze_weapon", tab: "Weapon", level: 2, minDmg: 2, maxDmg: 6, value: 25, icon: "item_sword_bronze.webp" },
	"mace_bronze": { name: "Bronze Mace", slot: "Weapon", subType: "bronze_weapon", tab: "Weapon", level: 3, minDmg: 3, maxDmg: 8, value: 45, icon: "item_mace_bronze.webp" },
	"spear_bronze": { name: "Bronze Partisan", slot: "Weapon", subType: "bronze_weapon", tab: "Weapon", level: 4, minDmg: 3, maxDmg: 10, value: 80, icon: "item_spear_bronze.webp" },
	"dagger_chime": { name: "Chime Dagger", slot: "Weapon", subType: "bronze_weapon", tab: "Weapon", level: 6, minDmg: 4, maxDmg: 12, value: 150, icon: "item_dagger_chime.webp" },
	"sword_brass": { name: "Brass Scimitar", slot: "Weapon", subType: "bronze_weapon", tab: "Weapon", level: 8, minDmg: 5, maxDmg: 14, value: 250, icon: "item_sword_brass.webp" },
	"mace_bell": { name: "Bell-Strike Mace", slot: "Weapon", subType: "bronze_weapon", tab: "Weapon", level: 9, minDmg: 5, maxDmg: 16, value: 300, icon: "item_mace_bell.webp" },
    "whip_copper": { name: "Copper Chain-Whip", slot: "Weapon", subType: "bronze_weapon", tab: "Weapon", level: 10, minDmg: 6, maxDmg: 18, value: 350, icon: "item_whip_copper.webp" },
	"dagger_harmonic": { name: "Harmonic Dirk", slot: "Weapon", subType: "bronze_weapon", tab: "Weapon", level: 12, minDmg: 7, maxDmg: 20, value: 500, icon: "item_dagger_harmonic.webp" },
	"sword_echo": { name: "Echoing Blade", slot: "Weapon", subType: "bronze_weapon", tab: "Weapon", level: 15, minDmg: 8, maxDmg: 22, value: 800, icon: "item_sword_echo.webp" },
	"mace_gong": { name: "Temple Gong Hammer", slot: "Weapon", subType: "bronze_weapon", tab: "Weapon", level: 17, minDmg: 9, maxDmg: 24, value: 1000, icon: "item_mace_gong.webp" },
	"glaive_singer": { name: "Singer's Glaive", slot: "Weapon", subType: "bronze_weapon", tab: "Weapon", level: 18, minDmg: 9, maxDmg: 26, value: 1400, icon: "item_glaive_singer.webp" },
    "dagger_gilded": { name: "Gilded Stiletto", slot: "Weapon", subType: "bronze_weapon", tab: "Weapon", level: 19, minDmg: 10, maxDmg: 28, value: 1200, icon: "item_dagger_gilded.webp" },
    "sword_valkyrie": { name: "Valkyrie Sabre", slot: "Weapon", subType: "bronze_weapon", tab: "Weapon", level: 20, minDmg: 11, maxDmg: 33, value: 2500, icon: "item_sword_valkyrie.webp" },
	"mace_resonance": { name: "Resonant Crusher", slot: "Weapon", subType: "bronze_weapon", tab: "Weapon", level: 21, minDmg: 12, maxDmg: 35, value: 3500, icon: "item_mace_resonance.webp" },
	"chakram_golden": { name: "Golden Chakram", slot: "Weapon", subType: "bronze_weapon", tab: "Weapon", level: 22, minDmg: 12, maxDmg: 38, value: 4000, icon: "item_chakram_golden.webp" },	
	"dagger_sunstone": { name: "Sunstone Dagger", slot: "Weapon", subType: "bronze_weapon", tab: "Weapon", level: 23, minDmg: 13, maxDmg: 40, value: 4500, icon: "item_dagger_sunstone.webp" },
	"sword_dawn": { name: "Blade of Dawn", slot: "Weapon", subType: "bronze_weapon", tab: "Weapon", level: 25, minDmg: 14, maxDmg: 42, value: 8000, icon: "item_sword_dawn.webp" },
	"mace_quake": { name: "Earthquake Maul", slot: "Weapon", subType: "bronze_weapon", tab: "Weapon", level: 28, minDmg: 15, maxDmg: 45, value: 8500, icon: "item_mace_quake.webp" },
	"halberd_solar": { name: "Solar Halberd", slot: "Weapon", subType: "bronze_weapon", tab: "Weapon", level: 30, minDmg: 16, maxDmg: 48, value: 9000, icon: "item_halberd_solar.webp" },
    
    // === 🗡️ LIGHT WEAPONS (Levels 1 - 30) ===    
    "dagger_iron": { name: "Iron Dagger", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 1, minDmg: 1, maxDmg: 4, value: 20, icon: "item_dagger_iron.webp" }, 
	"sword_short": { name: "Iron Shortsword", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 2, minDmg: 1, maxDmg: 5, value: 30, icon: "item_sword_short.webp" },
    "dagger_steel": { name: "Steel Dagger", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 3, minDmg: 2, maxDmg: 5, value: 50, icon: "item_dagger_steel.webp" },
	"sword_short_steel": { name: "Steel Shortsword", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 4, minDmg: 2, maxDmg: 6, value: 80, icon: "item_sword_short_steel.webp" },
	"sickle_iron": { name: "Iron Sickle", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 5, minDmg: 3, maxDmg: 7, value: 100, icon: "item_sickle_iron.webp" },
	"dagger_silver": { name: "Silver Dagger", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 6, minDmg: 3, maxDmg: 8, value: 120, icon: "item_dagger_silver.webp" },
    "sword_gladius": { name: "Silvered Gladius", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 7, minDmg: 4, maxDmg: 8, value: 180, icon: "item_sword_gladius.webp" },
	"dagger_dirk": { name: "Assassin's Dirk", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 8, minDmg: 4, maxDmg: 9, value: 250, icon: "item_dagger_dirk.webp" },
	"sword_cutlass": { name: "Steel Cutlass", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 9, minDmg: 4, maxDmg: 10, value: 320, icon: "item_sword_cutlass.webp" },
	"claws_steel": { name: "Steel Claws", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 10, minDmg: 5, maxDmg: 11, value: 380, icon: "item_claws_steel.webp" },
	"dagger_mithril": { name: "Mithril Dagger", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 11, minDmg: 5, maxDmg: 12, value: 450, icon: "item_dagger_mithril.webp" },
	"sword_short_mithril": { name: "Mithril Shortsword", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 12, minDmg: 6, maxDmg: 13, value: 600, icon: "item_sword_short_mithril.webp" },
	"rapier_duelist": { name: "Duelist's Rapier", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 13, minDmg: 6, maxDmg: 14, value: 700, icon: "item_rapier_duelist.webp" },
	"dagger_obsidian": { name: "Obsidian Shiv", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 14, minDmg: 7, maxDmg: 15, value: 800, icon: "item_dagger_obsidian.webp" },
	"sword_saber": { name: "Runed Saber", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 15, minDmg: 7, maxDmg: 16, value: 1000, icon: "item_sword_saber.webp" },
    "sword_wakizashi": { name: "Wakizashi", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 16, minDmg: 8, maxDmg: 17, value: 1150, icon: "item_sword_wakizashi.webp" },
	"dagger_venom": { name: "Venom-Crest Dagger", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 17, minDmg: 8, maxDmg: 18, value: 1300, icon: "item_dagger_venom.webp" },
    "sword_shadow": { name: "Shadow Blade", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 18, minDmg: 9, maxDmg: 19, value: 1600, icon: "item_sword_shadow.webp" },
	"dagger_adamantite": { name: "Adamantite Dagger", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 19, minDmg: 9, maxDmg: 18, value: 2200, icon: "item_dagger_adamantite.webp" },
	"sword_short_adamantite": { name: "Adamantite Shortsword", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 20, minDmg: 10, maxDmg: 20, value: 2800, icon: "item_sword_short_adamantite.webp" },
	"katar_assassin": { name: "Assassin's Katar", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 21, minDmg: 10, maxDmg: 22, value: 3100, icon: "item_katar_assassin.webp" },
	"dagger_voidglass": { name: "Void-Glass Stiletto", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 22, minDmg: 11, maxDmg: 24, value: 3600, icon: "item_dagger_voidglass.webp" },
	"sword_kris": { name: "Crystalline Shortsword", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 23, minDmg: 11, maxDmg: 26, value: 4500, icon: "item_sword_kris.webp" },
    "unique_whisper": { name: "The Whisper", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 24, minDmg: 12, maxDmg: 28, value: 5500, icon: "item_unique_whisper.webp" },	
    "dagger_meteorite": { name: "Meteorite Dagger", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 25, minDmg: 13, maxDmg: 30, value: 6000, icon: "item_dagger_meteorite.webp" },
	"unique_nightfang": { name: "The Nightfang", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 26, minDmg: 13, maxDmg: 32, value: 6500, icon: "item_unique_nightfang.webp" },
	"sword_dragonfang": { name: "Dragonfang Blade", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 278, minDmg: 14, maxDmg: 34, value: 7500, icon: "item_sword_dragonfang.webp" },
	"unique_needle": { name: "The Bone Needle", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 28, minDmg: 14, maxDmg: 36, value: 8800, icon: "item_unique_needle.webp" },
	"unique_soulthief": { name: "The Soul-Thief", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 29, minDmg: 15, maxDmg: 38, value: 9500, icon: "item_unique_soulthief.webp" },
	"unique_eclipse": { name: "The Eclipse", slot: "Weapon", subType: "light_weapon", tab: "Weapon", level: 30, minDmg: 16, maxDmg: 40, value: 12000, icon: "item_unique_eclipse.webp" },
	
    // === 🪓 HEAVY WEAPONS (Levels 1 - 30) ===    
	"mace_iron": { name: "Iron Mace", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 1, minDmg: 2, maxDmg: 7, value: 25, icon: "item_mace_iron.webp" },	
	"axe_iron": { name: "Iron Battleaxe", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 1, minDmg: 2, maxDmg: 8, value: 35, icon: "item_axe_iron.webp" },
	"sword_long": { name: "Iron Longsword", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 2, minDmg: 2, maxDmg: 9, value: 65, icon: "item_sword_long.webp" },
	"pike_iron": { name: "Iron Pike", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 3, minDmg: 3, maxDmg: 10, value: 50, icon: "item_pike_iron.webp" },
	"morningstar_steel": { name: "Steel Morningstar", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 4, minDmg: 3, maxDmg: 11, value: 90, icon: "item_morningstar_steel.webp" },
	"sword_bastard_steel": { name: "Steel Bastard Sword", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 5, minDmg: 3, maxDmg: 12, value: 120, icon: "item_sword_bastard_steel.webp" },
	"axe_great_steel": { name: "Steel Greataxe", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 6, minDmg: 4, maxDmg: 13, value: 160, icon: "item_axe_great_steel.webp" },       
	"halberd_steel": { name: "Steel Halberd", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 7, minDmg: 4, maxDmg: 14, value: 200, icon: "item_halberd_steel.webp" },
	"hammer_war_silver": { name: "Silver Warhammer", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 8, minDmg: 5, maxDmg: 15, value: 240, icon: "item_hammer_war_silver.webp" },
	"sword_great_silver": { name: "Silver Greatsword", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 9, minDmg: 5, maxDmg: 16, value: 280, icon: "item_sword_great_silver.webp" },   
	"axe_cleaver_silver": { name: "Silver Cleaver", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 10, minDmg: 6, maxDmg: 17, value: 350, icon: "item_axe_cleaver_silver.webp" },
	"glaive_silver": { name: "Silver Glaive", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 11, minDmg: 6, maxDmg: 18, value: 420, icon: "item_glaive_silver.webp" },
	"maul_titanium": { name: "Titanium Maul", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 12, minDmg: 7, maxDmg: 20, value: 650, icon: "item_maul_titanium.webp" },
	"sword_claymore_titanium": { name: "Titanium Claymore", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 13, minDmg: 7, maxDmg: 21, value: 750, icon: "item_sword_claymore_titanium.webp" },
	"axe_broad_titanium": { name: "Titanium Broadaxe", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 14, minDmg: 8, maxDmg: 21, value: 850, icon: "item_axe_broad_titanium.webp" },
	"poleaxe_titanium": { name: "Titanium Poleaxe", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 15, minDmg: 8, maxDmg: 22, value: 1000, icon: "item_poleaxe_titanium.webp" },
	"hammer_skull_obsidian": { name: "Obsidian Skullcrusher", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 16, minDmg: 9, maxDmg: 24, value: 1250, icon: "item_hammer_skull_obsidian.webp" },
	"sword_long_obsidian": { name: "Obsidian Longsword", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 17, minDmg: 10, maxDmg: 25, value: 1400, icon: "item_sword_long_obsidian.webp" },
	"axe_executioner_voidglass": { name: "Voidglass Executioner", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 18, minDmg: 11, maxDmg: 26, value: 2000, icon: "item_axe_executioner_voidglass.webp" },
	"hammer_war_adamantite": { name: "Adamantite Warhammer", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 19, minDmg: 12, maxDmg: 27, value: 2600, icon: "item_hammer_war_adamantite.webp" },
	"sword_great_adamantite": { name: "Adamantite Greatsword", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 20, minDmg: 12, maxDmg: 29, value: 2900, icon: "item_sword_great_adamantite.webp" },
	"scythe_adamantite": { name: "Adamantite Scythe", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 21, minDmg: 13, maxDmg: 31, value: 3400, icon: "item_scythe_adamantite.webp" },
	"axe_great_adamantite": { name: "Adamantite Greataxe", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 22, minDmg: 14, maxDmg: 34, value: 4000, icon: "item_axe_great_adamantite.webp" },
	"unique_earthshaker": { name: "The Earthshaker", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 23, minDmg: 15, maxDmg: 36, value: 5000, icon: "item_unique_earthshaker.webp" },
	"sword_zweihander_meteorite": { name: "Meteorite Zweihander", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 24, minDmg: 16, maxDmg: 38, value: 5800, icon: "item_sword_zweihander_meteorite.webp" },
	"unique_titans_reach": { name: "Titan's Reach", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 25, minDmg: 16, maxDmg: 41, value: 6000, icon: "item_unique_titans_reach.webp" },
	"maul_meteorite": { name: "Meteorite Maul", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 26, minDmg: 16, maxDmg: 45, value: 6800, icon: "item_maul_meteorite.webp" },
	"axe_war_dragonbone": { name: "Dragonbone Waraxe", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 27, minDmg: 17, maxDmg: 49, value: 7800, icon: "item_axe_war_dragonbone.webp" },
	"unique_blooddrinker": { name: "Blood-Drinker", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 28, minDmg: 18, maxDmg: 52, value: 8500, icon: "item_unique_blooddrinker.webp" },
	"unique_oblivion": { name: "Oblivion Edge", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 29, minDmg: 19, maxDmg: 55, value: 10000, icon: "item_unique_oblivion.webp" },
    "unique_worldbreaker": { name: "The Worldbreaker", slot: "Weapon", subType: "heavy_weapon", tab: "Weapon", level: 30, minDmg: 20, maxDmg: 60, value: 13500, icon: "item_unique_worldbreaker.webp" },    
        
    // === 🪄 MAGE WEAPONS (Levels 1 - 30) ===
    
    // STAFFS (Higher Maximum Damage)
    "staff_oak": { name: "Oak Staff", slot: "Weapon", subType: "mage_weapon", tab: "Weapon", level: 1, minDmg: 1, maxDmg: 4, value: 15, healBoost : 1.05, icon: "item_staff_oak.webp" },
    "staff_ash": { name: "Ashwood Staff", slot: "Weapon", subType: "mage_weapon", tab: "Weapon", level: 4, minDmg: 2, maxDmg: 8, value: 85, healBoost : 1.1, icon: "item_staff_ash.webp" },
    "staff_gnarled": { name: "Gnarled Root Staff", slot: "Weapon", subType: "mage_weapon", tab: "Weapon", level: 8, minDmg: 3, maxDmg: 12, healBoost : 1.15, value: 250, icon: "item_staff_gnarled.webp" },
    "staff_crystal": { name: "Crystal Spire Staff", slot: "Weapon", subType: "mage_weapon", tab: "Weapon", level: 11, minDmg: 4, maxDmg: 16, healBoost : 1.2, value: 500, icon: "item_staff_crystal.webp" },
    "staff_bone": { name: "Necromancer's Bone Staff", slot: "Weapon", subType: "mage_weapon", tab: "Weapon", level: 14, minDmg: 6, maxDmg: 20, healBoost : 1.25, value: 850, icon: "item_staff_bone.webp" },
    "staff_obsidian": { name: "Obsidian Pillar", slot: "Weapon", subType: "mage_weapon", tab: "Weapon", level: 18, minDmg: 8, maxDmg: 24, healBoost : 1.3, value: 1500, icon: "item_staff_obsidian.webp" },
    "staff_jade": { name: "Serpent Jade Staff", slot: "Weapon", subType: "mage_weapon", tab: "Weapon", level: 21, minDmg: 10, maxDmg: 28, healBoost : 1.35, value: 2700, icon: "item_staff_jade.webp" },
    "staff_voidglass": { name: "Voidglass Staff", slot: "Weapon", subType: "mage_weapon", tab: "Weapon", level: 24, minDmg: 12, maxDmg: 32, healBoost : 1.4, value: 4200, icon: "item_staff_voidglass.webp" },    
	"staff_astral": { name: "Astral Staff", slot: "Weapon", subType: "mage_weapon", tab: "Weapon", level: 27, minDmg: 14, maxDmg: 36, healBoost : 1.45, value: 6800, icon: "item_staff_astral.webp" },
    "staff_elderwood": { name: "Elderwood Branch", slot: "Weapon", subType: "mage_weapon", tab: "Weapon", level: 30, minDmg: 17, maxDmg: 40, healBoost : 1.5, value: 10000, icon: "item_staff_elderwood.webp" },

    // WANDS (Consistent, Tighter Damage Spread)
    "wand_wooden": { name: "Carved Wooden Wand", slot: "Weapon", subType: "mage_weapon", tab: "Weapon", level: 2, minDmg: 1, maxDmg: 5, offBoost : 1.05, value: 30, icon: "item_wand_wooden.webp" },
    "wand_magic": { name: "Apprentice Wand", slot: "Weapon", subType: "mage_weapon", tab: "Weapon", level: 5, minDmg: 2, maxDmg: 7, offBoost : 1.1, value: 110, icon: "item_wand_magic.webp" },
    "wand_silver": { name: "Silver Wand", slot: "Weapon", subType: "mage_weapon", tab: "Weapon", level: 9, minDmg: 4, maxDmg: 9, offBoost : 1.15, value: 300, icon: "item_wand_silver.webp" },
    "wand_quartz": { name: "Quartz-Tipped Wand", slot: "Weapon", subType: "mage_weapon", tab: "Weapon", level: 13, minDmg: 5, maxDmg: 12, offBoost : 1.2, value: 650, icon: "item_wand_quartz.webp" },
    "wand_mithril": { name: "Mithril Wand", slot: "Weapon", subType: "mage_weapon", tab: "Weapon", level: 16, minDmg: 6, maxDmg: 15, offBoost : 1.25, value: 1100, icon: "item_wand_mithril.webp" },
    "wand_shadow": { name: "Shadow-Weaver Wand", slot: "Weapon", subType: "mage_weapon", tab: "Weapon", level: 19, minDmg: 8, maxDmg: 18, offBoost : 1.3, value: 1800, icon: "item_wand_shadow.webp" },
    "wand_adamantite": { name: "Adamantite Wand", slot: "Weapon", subType: "mage_weapon", tab: "Weapon", level: 23, minDmg: 10, maxDmg: 22, offBoost : 1.35, value: 3400, icon: "item_wand_adamantite.webp" },
    "wand_fulcrum": { name: "Fulcrum Wand", slot: "Weapon", subType: "mage_weapon", tab: "Weapon", level: 26, minDmg: 12, maxDmg: 25, offBoost : 1.4, value: 5500, icon: "item_wand_fulcrum.webp" },
    "wand_dragonbone": { name: "Dragonbone Wand", slot: "Weapon", subType: "mage_weapon", tab: "Weapon", level: 28, minDmg: 14, maxDmg: 28, offBoost : 1.45, value: 8000, icon: "item_wand_dragonbone.webp" },
    "wand_celestial": { name: "Celestial Wand", slot: "Weapon", subType: "mage_weapon", tab: "Weapon", level: 30, minDmg: 16, maxDmg: 32, offBoost : 1.5, value: 11500, icon: "item_wand_celestial.webp" },
    
    // === 🏹 RANGED WEAPONS (Levels 1 - 30) ===

    // BOWS & LONGBOWS (Reliable, Good Range)
    "bow_short_wood": { name: "Wooden Shortbow", slot: "Weapon", subType: "ranged", tab: "Weapon", level: 1, minDmg: 1, maxDmg: 5, value: 15, icon: "item_bow_short_wood.webp", requiresAmmo: "arrow", maxRange: 4 },
    "bow_long_wood": { name: "Wooden Longbow", slot: "Weapon", subType: "ranged", tab: "Weapon", level: 3, minDmg: 2, maxDmg: 10, value: 50, icon: "item_bow_long_wood.webp", requiresAmmo: "arrow", maxRange: 5 },
    "bow_recurve_bone": { name: "Bone Recurve Bow", slot: "Weapon", subType: "ranged", tab: "Weapon", level: 9, minDmg: 8, maxDmg: 24, value: 280, icon: "item_bow_recurve_bone.webp", requiresAmmo: "arrow", maxRange: 6 },
    "bow_elven_mithril": { name: "Elven Mithril Bow", slot: "Weapon", subType: "ranged", tab: "Weapon", level: 18, minDmg: 16, maxDmg: 40, value: 1500, icon: "item_bow_elven_mithril.webp", requiresAmmo: "arrow", maxRange: 7 },
    "bow_dragon_horn": { name: "Dragon-Horn Greatbow", slot: "Weapon", subType: "ranged", tab: "Weapon", level: 28, minDmg: 35, maxDmg: 70, value: 7500, icon: "item_bow_dragon_horn.webp", requiresAmmo: "arrow", maxRange: 9 },

    // CROSSBOWS (Slower to load traditionally, but very high base damage)
    "crossbow_light": { name: "Light Crossbow", slot: "Weapon", subType: "ranged", tab: "Weapon", level: 4, minDmg: 3, maxDmg: 12, value: 90, icon: "item_crossbow_light.webp", requiresAmmo: "bolt", maxRange: 3 },
    "crossbow_heavy_iron": { name: "Heavy Iron Crossbow", slot: "Weapon", subType: "ranged", tab: "Weapon", level: 11, minDmg: 12, maxDmg: 30, value: 450, icon: "item_crossbow_heavy_iron.webp", requiresAmmo: "bolt", maxRange: 4 },
    "crossbow_repeating": { name: "Repeating Steel Crossbow", slot: "Weapon", subType: "ranged", tab: "Weapon", level: 19, minDmg: 18, maxDmg: 48, value: 2100, icon: "item_crossbow_repeating.webp", requiresAmmo: "bolt", maxRange: 5 },
    "crossbow_adamantite": { name: "Adamantite Crossbow", slot: "Weapon", subType: "ranged", tab: "Weapon", level: 26, minDmg: 30, maxDmg: 60, value: 6200, icon: "item_crossbow_adamantite.webp", requiresAmmo: "bolt", maxRange: 7 },

    // SLINGS (Short range, but utilizes cheap/plentiful ammo)
    "sling_leather": { name: "Leather Sling", slot: "Weapon", subType: "ranged", tab: "Weapon", level: 1, minDmg: 1, maxDmg: 4, value: 10, icon: "item_sling_leather.webp", requiresAmmo: "stone", maxRange: 2 },
    "sling_hunter": { name: "Hunter's Braided Sling", slot: "Weapon", subType: "ranged", tab: "Weapon", level: 7, minDmg: 6, maxDmg: 18, value: 180, icon: "item_sling_hunter.webp", requiresAmmo: "stone", maxRange: 3 },
    "sling_giantsbane": { name: "Giantsbane Sling", slot: "Weapon", subType: "ranged", tab: "Weapon", level: 16, minDmg: 14, maxDmg: 30, value: 1050, icon: "item_sling_giantsbane.webp", requiresAmmo: "stone", maxRange: 4 },

    // THROWING WEAPONS (No ammo required - abstract set of blades/axes)
    "throwing_knives_iron": { name: "Iron Throwing Knives", slot: "Weapon", subType: "ranged", tab: "Weapon", level: 5, minDmg: 3, maxDmg: 8, value: 120, icon: "item_throwing_knives_iron.webp", maxRange: 2 },
    "javelin_steel": { name: "Steel Javelin", slot: "Weapon", subType: "ranged", tab: "Weapon", level: 10, minDmg: 15, maxDmg: 45, value: 380, icon: "item_javelin_steel.webp", maxRange: 3 },
    "darts_shadow": { name: "Shadow-Strike Darts", slot: "Weapon", subType: "ranged", tab: "Weapon", level: 21, minDmg: 35, maxDmg: 85, value: 2800, icon: "item_darts_shadow.webp", maxRange: 4 },
    "throwing_axe_meteorite": { name: "Meteorite Throwing Axe", slot: "Weapon", subType: "ranged", tab: "Weapon", level: 27, minDmg: 50, maxDmg: 140, value: 6800, icon: "item_throwing_axe_meteorite.webp", maxRange: 5 },

    // BOOMERANGS (No ammo required - returning weapons)
    "boomerang_wood": { name: "Hardwood Boomerang", slot: "Weapon", subType: "ranged", tab: "Weapon", level: 6, minDmg: 10, maxDmg: 25, value: 150, icon: "item_boomerang_wood.webp", maxRange: 3 },
    "boomerang_steel": { name: "Edged Steel Boomerang", slot: "Weapon", subType: "ranged", tab: "Weapon", level: 14, minDmg: 20, maxDmg: 60, value: 800, icon: "item_boomerang_steel.webp", maxRange: 4 },

    // MAGICAL EXPLOSIVES (No ammo required - infinite magical satchels)
    "bomb_satchel_fire": { name: "Satchel of Fire Bombs", slot: "Weapon", subType: "ranged", tab: "Weapon", level: 15, minDmg: 25, maxDmg: 70, value: 950, icon: "item_bomb_satchel_fire.webp", maxRange: 2 },
    "bomb_void_sphere": { name: "Void-Core Sphere Bomb", slot: "Weapon", subType: "ranged", tab: "Weapon", level: 30, minDmg: 100, maxDmg: 250, value: 12500, icon: "item_bomb_void_sphere.webp", maxRange: 3 },

// === 🛡️ OFFHAND ===
    
    // INSTRUMENTS (Bards - Offhand buffs/magic)
    "lute": { name: "Wooden Lute", slot: "Offhand", subType: "instrument", tab: "Instrument", level: 1, duration: 0, value: 25, icon: "item_lute.webp" }, 
    "flute_reed": { name: "Reed Flute", slot: "Offhand", subType: "instrument", tab: "Instrument", level: 4, duration: 1, value: 80, icon: "item_flute_reed.webp" }, 
    "tambourine_brass": { name: "Brass Tambourine", slot: "Offhand", subType: "instrument", tab: "Instrument", level: 7, duration: 2, value: 200, icon: "item_tambourine_brass.webp" }, 
    "lyre_silver": { name: "Silver Lyre", slot: "Offhand", subType: "instrument", tab: "Instrument", level: 10, duration: 3, value: 400, icon: "item_lyre_silver.webp" }, 
    "mandolin_ivory": { name: "Ivory Mandolin", slot: "Offhand", subType: "instrument", tab: "Instrument", level: 14, duration: 4, value: 750, icon: "item_mandolin_ivory.webp" }, 
    "harp_golden": { name: "Golden Harp", slot: "Offhand", subType: "instrument", tab: "Instrument", level: 18, duration: 5, value: 1500, icon: "item_harp_golden.webp" }, 
    "panpipes_crystal": { name: "Crystal Panpipes", slot: "Offhand", subType: "instrument", tab: "Instrument", level: 22, duration: 6, value: 3000, icon: "item_panpipes_crystal.webp" }, 
    "ocarina_obsidian": { name: "Obsidian Ocarina", slot: "Offhand", subType: "instrument", tab: "Instrument", level: 25, duration: 7, value: 5000, icon: "item_ocarina_obsidian.webp" }, 
    "chimes_celestial": { name: "Celestial Chimes", slot: "Offhand", subType: "instrument", tab: "Instrument", level: 28, duration: 8, value: 8500, icon: "item_chimes_celestial.webp" }, 
    "unique_lyre_wight": { name: "The Wight-Song Lyre", slot: "Offhand", subType: "instrument", tab: "Instrument", level: 30, duration: 10, value: 15000, icon: "item_unique_lyre_wight.webp" },

    // LIGHT SHIELDS (Rogues, Bards, Warriors, Paladins - Lower AC, highly mobile)
    "shield_wood": { name: "Wooden Shield", slot: "Offhand", subType: "light_shield", tab: "Armor", level: 1, ac: -1, value: 10, icon: "item_shield_wood.webp" },
    "shield_hide": { name: "Thick Hide Shield", slot: "Offhand", subType: "light_shield", tab: "Armor", level: 4, ac: -2, value: 60, icon: "item_shield_hide.webp" },
    "shield_buckler_steel": { name: "Steel Buckler", slot: "Offhand", subType: "light_shield", tab: "Armor", level: 8, ac: -3, value: 200, icon: "item_shield_buckler_steel.webp" },
    "shield_targe_silver": { name: "Silver Targe", slot: "Offhand", subType: "light_shield", tab: "Armor", level: 12, ac: -4, value: 500, icon: "item_shield_targe_silver.webp" },
    "shield_heater_mithril": { name: "Mithril Heater Shield", slot: "Offhand", subType: "light_shield", tab: "Armor", level: 16, ac: -5, value: 1000, icon: "item_shield_heater_mithril.webp" },
    "shield_obsidian": { name: "Obsidian Disk", slot: "Offhand", subType: "light_shield", tab: "Armor", level: 19, ac: -6, value: 1800, icon: "item_shield_obsidian.webp" },
    "shield_voidglass": { name: "Voidglass Buckler", slot: "Offhand", subType: "light_shield", tab: "Armor", level: 23, ac: -7, value: 3200, icon: "item_shield_voidglass.webp" },
    "shield_adamantite": { name: "Adamantite Targe", slot: "Offhand", subType: "light_shield", tab: "Armor", level: 26, ac: -8, value: 5500, icon: "item_shield_adamantite.webp" },
    "shield_dragonscale": { name: "Dragonscale Shield", slot: "Offhand", subType: "light_shield", tab: "Armor", level: 28, ac: -9, value: 8000, icon: "item_shield_dragonscale.webp" },
    "unique_aegis_dawn": { name: "Aegis of the Dawn", slot: "Offhand", subType: "light_shield", tab: "Armor", level: 30, ac: -11, value: 12500, icon: "item_unique_aegis_dawn.webp" },

    // HEAVY SHIELDS (Warriors, Paladins - High AC, lower mobility)
    "shield_iron_tower": { name: "Iron Tower Shield", slot: "Offhand", subType: "heavy_shield", tab: "Armor", level: 2, ac: -3, value: 40, icon: "item_shield_iron_tower.webp" },
    "shield_kite": { name: "Steel Kite Shield", slot: "Offhand", subType: "heavy_shield", tab: "Armor", level: 5, ac: -4, value: 110, icon: "item_shield_kite.webp" },
    "shield_silver_pavise": { name: "Silver Pavise", slot: "Offhand", subType: "heavy_shield", tab: "Armor", level: 9, ac: -5, value: 280, icon: "item_shield_silver_pavise.webp" },
    "shield_titanium_wall": { name: "Titanium Wall Shield", slot: "Offhand", subType: "heavy_shield", tab: "Armor", level: 13, ac: -6, value: 650, icon: "item_shield_titanium_wall.webp" },
    "shield_bone_great": { name: "Bone Greatshield", slot: "Offhand", subType: "heavy_shield", tab: "Armor", level: 16, ac: -8, value: 1200, icon: "item_shield_bone_great.webp" },
    "shield_obsidian_tower": { name: "Obsidian Tower Shield", slot: "Offhand", subType: "heavy_shield", tab: "Armor", level: 20, ac: -10, value: 2400, icon: "item_shield_obsidian_tower.webp" },
    "shield_adamantite_bulwark": { name: "Adamantite Bulwark", slot: "Offhand", subType: "heavy_shield", tab: "Armor", level: 24, ac: -12, value: 4500, icon: "item_shield_adamantite_bulwark.webp" },
    "shield_aster_shield": { name: "Aster Shield", slot: "Offhand", subType: "heavy_shield", tab: "Armor", level: 27, ac: -14, value: 7000, icon: "item_shield_aster.webp" },
    "shield_dragonbone_wall": { name: "Dragonbone Wall Shield", slot: "Offhand", subType: "heavy_shield", tab: "Armor", level: 29, ac: -16, value: 9800, icon: "item_shield_dragonbone_wall.webp" },
    "unique_immovable_object": { name: "The Immovable Object", slot: "Offhand", subType: "heavy_shield", tab: "Armor", level: 30, ac: -18, value: 14500, icon: "item_unique_immovable_object.webp" },
       
    // === 👕 ARMOR (BODY) ===    
    // MAGE ARMOR (Mages, Healers)
    "armor_robes": { name: "Cloth Vestments", slot: "Body", subType: "mage_armor", tab: "Armor", level: 1, ac: -1, magicResistance : 0.03, value: 8, iconM: "item_armor_robes_m.webp", iconF: "item_armor_robes_f.webp" },
    "armor_tunic_linen": { name: "Linen Tunic", slot: "Body", subType: "mage_armor", tab: "Armor", level: 4, ac: -1, magicResistance : 0.06, value: 45, iconM: "item_armor_tunic_linen_m.webp", iconF: "item_armor_tunic_linen_f.webp" },
    "armor_robes_velvet": { name: "Velvet Robes", slot: "Body", subType: "mage_armor", tab: "Armor", level: 8, ac: -2, magicResistance : 0.1, value: 120, iconM: "item_armor_robes_velvet_m.webp", iconF: "item_armor_robes_velvet_f.webp" },
    "armor_tunic_silk": { name: "Silk Tunic", slot: "Body", subType: "mage_armor", tab: "Armor", level: 11, ac: -2, magicResistance : 0.13, value: 300, iconM: "item_armor_tunic_silk_m.webp", iconF: "item_armor_tunic_silk_f.webp" },
    "armor_robes_samite": { name: "Samite Robes", slot: "Body", subType: "mage_armor", tab: "Armor", level: 15, ac: -3, magicResistance : 0.16, value: 700, iconM: "item_armor_robes_samite_m.webp", iconF: "item_armor_robes_samite_f.webp" },
    "armor_tunic_spidersilk": { name: "Spidersilk Tunic", slot: "Body", subType: "mage_armor", tab: "Armor", level: 18, ac: -3, magicResistance : 0.2, value: 1200, iconM: "item_armor_tunic_spidersilk_m.webp", iconF: "item_armor_tunic_spidersilk_f.webp" },
    "armor_robes_moonweave": { name: "Moonweave Robes", slot: "Body", subType: "mage_armor", tab: "Armor", level: 22, ac: -4, magicResistance : 0.23, value: 2500, iconM: "item_armor_robes_moonweave_m.webp", iconF: "item_armor_robes_moonweave_f.webp" },
    "armor_tunic_spellthread": { name: "Spellthread Tunic", slot: "Body", subType: "mage_armor", tab: "Armor", level: 25, ac: -4, magicResistance : 0.26, value: 4000, iconM: "item_armor_tunic_spellthread_m.webp", iconF: "item_armor_tunic_spellthread_f.webp" },
    "armor_robes_starspun": { name: "Star-Spun Robes", slot: "Body", subType: "mage_armor", tab: "Armor", level: 28, ac: -5, magicResistance : 0.3, value: 7000, iconM: "item_armor_robes_starspun_m.webp", iconF: "item_armor_robes_starspun_f.webp" },
    "unique_mantle_archon": { name: "Archon's Mantle", slot: "Body", subType: "mage_armor", tab: "Armor", level: 30, ac: -6, magicResistance : 0.35, value: 10000, iconM: "item_unique_mantle_archon_m.webp", iconF: "item_unique_mantle_archon_f.webp" },

    // LIGHT ARMOR (Rogues, Bards, Warriors, Paladins - Good balance of AC and mobility)
    "armor_leather": { name: "Leather Armor", slot: "Body", subType: "light", tab: "Armor", level: 1, ac: -2, value: 15, iconM: "item_armor_leather_m.webp", iconF: "item_armor_leather_f.webp" },
    "armor_studded": { name: "Studded Leather", slot: "Body", subType: "light", tab: "Armor", level: 4, ac: -3, value: 75, iconM: "item_armor_studded_m.webp", iconF: "item_armor_studded_f.webp" },
    "armor_boiled_hide": { name: "Boiled Hide", slot: "Body", subType: "light", tab: "Armor", level: 8, ac: -4, value: 180, iconM: "item_armor_boiled_hide_m.webp", iconF: "item_armor_boiled_hide_f.webp" },
    "armor_brigandine": { name: "Steel Brigandine", slot: "Body", subType: "light", tab: "Armor", level: 11, ac: -5, value: 400, iconM: "item_armor_brigandine_m.webp", iconF: "item_armor_brigandine_f.webp" },
    "armor_trollhide": { name: "Trollhide Armor", slot: "Body", subType: "light", tab: "Armor", level: 15, ac: -6, value: 850, iconM: "item_armor_trollhide_m.webp", iconF: "item_armor_trollhide_f.webp" },
    "armor_mithril_shirt": { name: "Mithril Chain-Shirt", slot: "Body", subType: "light", tab: "Armor", level: 18, ac: -7, value: 1600, iconM: "item_armor_mithril_shirt_m.webp", iconF: "item_armor_mithril_shirt_f.webp" },
    "armor_shadow_leather": { name: "Shadow-Leather", slot: "Body", subType: "light", tab: "Armor", level: 22, ac: -8, value: 3000, iconM: "item_armor_shadow_leather_m.webp", iconF: "item_armor_shadow_leather_f.webp" },
    "armor_adamantite_scales": { name: "Adamantite Scale", slot: "Body", subType: "light", tab: "Armor", level: 25, ac: -9, value: 5200, iconM: "item_armor_adamantite_scales_m.webp", iconF: "item_armor_adamantite_scales_f.webp" },
    "armor_dragonhide": { name: "Dragonhide Tunic", slot: "Body", subType: "light", tab: "Armor", level: 28, ac: -10, value: 8500, iconM: "item_armor_dragonhide_m.webp", iconF: "item_armor_dragonhide_f.webp" },
    "unique_night_wind": { name: "Mantle of the Night Wind", slot: "Body", subType: "light", tab: "Armor", level: 30, ac: -12, value: 13000, iconM: "item_unique_night_wind_m.webp", iconF: "item_unique_night_wind_f.webp" },

    // HEAVY ARMOR (Warriors, Paladins - Massive AC, heavily restrictive)
    "armor_ringmail": { name: "Iron Ringmail", slot: "Body", subType: "heavy", tab: "Armor", level: 2, ac: -4, value: 40, iconM: "item_armor_ringmail_m.webp", iconF: "item_armor_ringmail_f.webp" },
    "armor_chain": { name: "Steel Chainmail", slot: "Body", subType: "heavy", tab: "Armor", level: 5, ac: -6, value: 120, iconM: "item_armor_chain_m.webp", iconF: "item_armor_chain_f.webp" },
    "armor_splint": { name: "Splint Mail", slot: "Body", subType: "heavy", tab: "Armor", level: 9, ac: -8, value: 300, iconM: "item_armor_splint_m.webp", iconF: "item_armor_splint_f.webp" },
    "armor_half_plate": { name: "Steel Half-Plate", slot: "Body", subType: "heavy", tab: "Armor", level: 13, ac: -10, value: 750, iconM: "item_armor_half_plate_m.webp", iconF: "item_armor_half_plate_f.webp" },
    "armor_full_plate_silver": { name: "Silvered Full Plate", slot: "Body", subType: "heavy", tab: "Armor", level: 16, ac: -12, value: 1400, iconM: "item_armor_full_plate_silver_m.webp", iconF: "item_armor_full_plate_silver_f.webp" },
    "armor_obsidian_carapace": { name: "Obsidian Carapace", slot: "Body", subType: "heavy", tab: "Armor", level: 20, ac: -14, value: 2800, iconM: "item_armor_obsidian_carapace_m.webp", iconF: "item_armor_obsidian_carapace_f.webp" },
    "armor_adamantite_plate": { name: "Adamantite Plate", slot: "Body", subType: "heavy", tab: "Armor", level: 24, ac: -16, value: 5500, iconM: "item_armor_adamantite_plate_m.webp", iconF: "item_armor_adamantite_plate_f.webp" },
    "armor_meteorite_juggernaut": { name: "Meteorite Juggernaut", slot: "Body", subType: "heavy", tab: "Armor", level: 27, ac: -18, value: 8200, iconM: "item_armor_meteorite_juggernaut_m.webp", iconF: "item_armor_meteorite_juggernaut_f.webp" },
    "armor_dragonbone_mail": { name: "Dragonbone Mail", slot: "Body", subType: "heavy", tab: "Armor", level: 29, ac: -20, value: 11500, iconM: "item_armor_dragonbone_mail_m.webp", iconF: "item_armor_dragonbone_mail_f.webp" },
    "unique_indomitable": { name: "The Indomitable", slot: "Body", subType: "heavy", tab: "Armor", level: 30, ac: -22, value: 16000, iconM: "item_unique_indomitable_m.webp", iconF: "item_unique_indomitable_f.webp" },

    // BRONZE ARMOR (Vibrants Only - Resonant metals that balance weight and protection)
    "armor_bronze": { name: "Bronze Breastplate", slot: "Body", subType: "bronze", tab: "Armor", level: 2, ac: -3, value: 50, iconM: "item_armor_bronze_m.webp", iconF: "item_armor_bronze_f.webp" },
    "armor_harmonic_cuirass": { name: "Harmonic Cuirass", slot: "Body", subType: "bronze", tab: "Armor", level: 8, ac: -7, drawsAggro: 5, value: 380, iconM: "item_armor_harmonic_cuirass_m.webp", iconF: "item_armor_harmonic_cuirass_f.webp" },
    "armor_gilded_sun": { name: "Gilded Sun-Plate", slot: "Body", subType: "bronze", tab: "Armor", level: 15, ac: -11, drawsAggro: 10, value: 1800, iconM: "item_armor_gilded_sun_m.webp", iconF: "item_armor_gilded_sun_f.webp" },
    "armor_symphony_carapace": { name: "Symphony Carapace", slot: "Body", subType: "bronze", tab: "Armor", level: 22, ac: -15, drawsAggro: 20, value: 6400, iconM: "item_armor_symphony_carapace_m.webp", iconF: "item_armor_symphony_carapace_f.webp" },
    "unique_aegis_lyrewight": { name: "Aegis of the Lyre-Wight", slot: "Body", subType: "bronze", tab: "Armor", level: 30, ac: -21, drawsAggro: 35, value: 18000, iconM: "item_unique_aegis_lyrewight_m.webp", iconF: "item_unique_aegis_lyrewight_f.webp" },
    
    // === 🧢 ARMOR (HELMET) ===
    // MAGE HEADGEAR (Mages, Healers - Very low AC)
    "hat_mage": { name: "Apprentice Cap", slot: "Helmet", subType: "mage_armor", tab: "Armor", level: 1, ac: 0, magicResistance: 0.03, value: 8, icon: "item_hat_mage.webp" },
    "cowl_mage": { name: "Mystic Cowl", slot: "Helmet", subType: "mage_armor", tab: "Armor", level: 4, ac: -1, magicResistance: 0.05, INT: 1, value: 45, icon: "item_cowl_mage.webp" },
    "hood_velvet": { name: "Velvet Hood", slot: "Helmet", subType: "mage_armor", tab: "Armor", level: 8, ac: -1, magicResistance: 0.1, WIS: 1, value: 120, icon: "item_hood_velvet.webp" },
    "circlet_silk": { name: "Silk Circlet", slot: "Helmet", subType: "mage_armor", tab: "Armor", level: 11, ac: -2, magicResistance: 0.13, INT: 1, value: 300, icon: "item_circlet_silk.webp" },
    "hood_samite": { name: "Samite Hood", slot: "Helmet", subType: "mage_armor", tab: "Armor", level: 15, ac: -2, magicResistance: 0.13, WIS: 1, INT: 1, value: 700, icon: "item_hood_samite.webp" },
    "cowl_spidersilk": { name: "Spidersilk Cowl", slot: "Helmet", subType: "mage_armor", tab: "Armor", level: 18, ac: -3, magicResistance: 0.16, WIS: 1, INT: 1, value: 1200, icon: "item_cowl_spidersilk.webp" },
    "hood_moonweave": { name: "Moonweave Hood", slot: "Helmet", subType: "mage_armor", tab: "Armor", level: 22, ac: -3, magicResistance: 0.16, WIS: 1, INT: 1, value: 2500, icon: "item_hood_moonweave.webp" },
    "turban_spellthread": { name: "Spellthread Turban", slot: "Helmet", subType: "mage_armor", tab: "Armor", level: 25, ac: -4, magicResistance: 0.2, WIS: 1, INT: 1, value: 4000, icon: "item_turban_spellthread.webp" },
    "halo_starspun": { name: "Star-Spun Halo", slot: "Helmet", subType: "mage_armor", tab: "Armor", level: 28, ac: -4, magicResistance: 0.23, WIS: 1, INT: 1, value: 7000, icon: "item_halo_starspun.webp" },
    "unique_crown_archon": { name: "Archon's Crown", slot: "Helmet", subType: "mage_armor", tab: "Armor", level: 30, ac: -5, magicResistance: 0.25, WIS: 2, INT: 2, value: 10000, icon: "item_unique_crown_archon.webp" },	
	
    // LIGHT HELMETS (Rogues, Bards, Warriors, Paladins - Good balance of AC and mobility)
    "helm_leather": { name: "Leather Hood", slot: "Helmet", subType: "light", tab: "Armor", level: 1, ac: -1, value: 6, icon: "item_helm_leather.webp" },
    "helm_studded": { name: "Studded Cap", slot: "Helmet", subType: "light", tab: "Armor", level: 4, ac: -1, LUK: 1, value: 35, icon: "item_helm_studded.webp" },
    "helm_boiled_hide": { name: "Boiled Hide Helm", slot: "Helmet", subType: "light", tab: "Armor", level: 8, ac: -2, LUK: 1, value: 90, icon: "item_helm_boiled_hide.webp" },
    "helm_brigandine": { name: "Brigandine Coif", slot: "Helmet", subType: "light", tab: "Armor", level: 11, ac: -2, LUK: 1, value: 200, icon: "item_helm_brigandine.webp" },
    "helm_trollhide": { name: "Trollhide Mask", slot: "Helmet", subType: "light", tab: "Armor", level: 15, ac: -3, LUK: 2, value: 500, icon: "item_helm_trollhide.webp" },
    "helm_mithril": { name: "Mithril Coif", slot: "Helmet", subType: "light", tab: "Armor", level: 18, ac: -4, LUK: 2, value: 1000, icon: "item_helm_mithril.webp" },
    "helm_shadow_leather": { name: "Shadow-Leather Hood", slot: "Helmet", subType: "light", tab: "Armor", level: 22, ac: -5, LUK: 2, value: 1800, icon: "item_helm_shadow_leather.webp" },
    "helm_adamantite_scale": { name: "Adamantite Scale Helm", slot: "Helmet", subType: "light", tab: "Armor", level: 25, ac: -6, LUK: 3, value: 3500, icon: "item_helm_adamantite_scale.webp" },
    "helm_dragonhide": { name: "Dragonhide Visor", slot: "Helmet", subType: "light", tab: "Armor", level: 28, ac: -7, LUK: 3, value: 6000, icon: "item_helm_dragonhide.webp" },
    "unique_cowl_night_wind": { name: "Cowl of the Night Wind", slot: "Helmet", subType: "light", tab: "Armor", level: 30, ac: -9, LUK: 4, value: 9500, icon: "item_unique_cowl_night_wind.webp" },
	
    // HEAVY HELMETS (Warriors, Paladins - Massive AC, heavily restrictive)
    "helm_iron": { name: "Iron Helmet", slot: "Helmet", subType: "heavy", tab: "Armor", level: 2, ac: -2, value: 18, icon: "item_helm_iron.webp" },
    "helm_chain_steel": { name: "Steel Chain Coif", slot: "Helmet", subType: "heavy", tab: "Armor", level: 5, ac: -3, value: 50, icon: "item_helm_chain_steel.webp" },
    "helm_splint": { name: "Splint Bascinet", slot: "Helmet", subType: "heavy", tab: "Armor", level: 9, ac: -4, STR: 1, value: 120, icon: "item_helm_splint.webp" },
    "helm_plate_steel": { name: "Steel Armet", slot: "Helmet", subType: "heavy", tab: "Armor", level: 13, ac: -5, STR: 1, value: 280, icon: "item_helm_plate_steel.webp" },
    "helm_great_silver": { name: "Silvered Greathelm", slot: "Helmet", subType: "heavy", tab: "Armor", level: 16, ac: -6, STR: 1, value: 600, icon: "item_helm_great_silver.webp" },
    "helm_obsidian_visor": { name: "Obsidian Visor", slot: "Helmet", subType: "heavy", tab: "Armor", level: 20, ac: -7, STR: 2, value: 1200, icon: "item_helm_obsidian_visor.webp" },
    "helm_adamantite_great": { name: "Adamantite Greathelm", slot: "Helmet", subType: "heavy", tab: "Armor", level: 24, ac: -9, STR: 2, value: 2500, icon: "item_helm_adamantite_great.webp" },
    "helm_meteorite_juggernaut": { name: "Meteorite Juggernaut Helm", slot: "Helmet", subType: "heavy", tab: "Armor", level: 27, ac: -11, STR: 2, value: 4800, icon: "item_helm_meteorite_juggernaut.webp" },
    "helm_dragonbone": { name: "Dragonbone Helm", slot: "Helmet", subType: "heavy", tab: "Armor", level: 29, ac: -13, STR: 2, value: 7200, icon: "item_helm_dragonbone.webp" },
    "unique_helm_indomitable": { name: "Helm of the Indomitable", slot: "Helmet", subType: "heavy", tab: "Armor", level: 30, ac: -15, STR: 3, value: 11500, icon: "item_unique_helm_indomitable.webp" },	
	
    // BRONZE HELMETS (Vibrants Only - Resonant metals, milestone upgrades)
    "helm_bronze": { name: "Bronze Helm", slot: "Helmet", subType: "bronze", tab: "Armor", level: 2, ac: -2, value: 20, icon: "item_helm_bronze.webp" },
    "helm_harmonic": { name: "Harmonic Helm", slot: "Helmet", subType: "bronze", tab: "Armor", level: 8, ac: -4, CHA: 1, value: 180, icon: "item_helm_harmonic.webp" },
    "helm_gilded_sun": { name: "Gilded Sun-Helm", slot: "Helmet", subType: "bronze", tab: "Armor", level: 15, ac: -6, CHA: 1, DEX: 1, value: 1000, icon: "item_helm_gilded_sun.webp" },
    "helm_symphony": { name: "Symphony Crown", slot: "Helmet", subType: "bronze", tab: "Armor", level: 22, ac: -9, CHA: 2, DEX: 1, value: 3500, icon: "item_helm_symphony.webp" },
    "unique_crown_lyrewight": { name: "Crown of the Lyre-Wight", slot: "Helmet", subType: "bronze", tab: "Armor", level: 30, ac: -12, CHA: 2, DEX: 2, value: 11000, icon: "item_unique_crown_lyrewight.webp" },
    
    // === 🧤 ARMOR (GLOVES) ===
   // MAGE GLOVES (Mages, Healers - Very low AC, but heavily boosts spell power!)
    "gloves_mage": { name: "Apprentice Gloves", slot: "Gloves", subType: "mage_armor", tab: "Armor", level: 1, ac: 0, magicBoost: 1.03, value: 5, icon: "item_gloves_mage.webp" },
    "gloves_mystic": { name: "Mystic Gloves", slot: "Gloves", subType: "mage_armor", tab: "Armor", level: 4, ac: 0, magicBoost: 1.06, value: 25, icon: "item_gloves_mystic.webp" },
    "gloves_velvet": { name: "Velvet Gloves", slot: "Gloves", subType: "mage_armor", tab: "Armor", level: 8, ac: -1, magicBoost: 1.1, value: 80, icon: "item_gloves_velvet.webp" },
    "gloves_silk": { name: "Silk Gloves", slot: "Gloves", subType: "mage_armor", tab: "Armor", level: 11, ac: -1, magicBoost: 1.13, value: 180, icon: "item_gloves_silk.webp" },
    "gloves_samite": { name: "Samite Gloves", slot: "Gloves", subType: "mage_armor", tab: "Armor", level: 15, ac: -2, magicBoost: 1.16, value: 400, icon: "item_gloves_samite.webp" },
    "gloves_spidersilk": { name: "Spidersilk Gloves", slot: "Gloves", subType: "mage_armor", tab: "Armor", level: 18, ac: -2, magicBoost: 1.2, value: 800, icon: "item_gloves_spidersilk.webp" },
    "gloves_moonweave": { name: "Moonweave Gloves", slot: "Gloves", subType: "mage_armor", tab: "Armor", level: 22, ac: -3, magicBoost: 1.23, value: 1500, icon: "item_gloves_moonweave.webp" },
    "gloves_spellthread": { name: "Spellthread Gloves", slot: "Gloves", subType: "mage_armor", tab: "Armor", level: 25, ac: -3, magicBoost: 1.26, value: 2800, icon: "item_gloves_spellthread.webp" },
    "gloves_starspun": { name: "Star-Spun Gloves", slot: "Gloves", subType: "mage_armor", tab: "Armor", level: 28, ac: -4, magicBoost: 1.3, value: 5000, icon: "item_gloves_starspun.webp" },
    "unique_wraps_archon": { name: "Archon's Wraps", slot: "Gloves", subType: "mage_armor", tab: "Armor", level: 30, ac: -5, magicBoost: 1.35, value: 8000, icon: "item_unique_wraps_archon.webp" },
	
    // LIGHT GLOVES (Rogues, Bards, Warriors, Paladins - Moderate AC)
    "gloves_leather": { name: "Leather Gloves", slot: "Gloves", subType: "light", tab: "Armor", level: 1, ac: -1, value: 5, icon: "item_gloves_leather.webp" },
    "gloves_studded": { name: "Studded Gloves", slot: "Gloves", subType: "light", tab: "Armor", level: 4, ac: -1, DEX: 1,  value: 25, icon: "item_gloves_studded.webp" },
    "gloves_boiled_hide": { name: "Boiled Hide Bracers", slot: "Gloves", subType: "light", tab: "Armor", level: 8, ac: -2, DEX: 1, value: 70, icon: "item_gloves_boiled_hide.webp" },
    "gloves_brigandine": { name: "Steel-Plated Gloves", slot: "Gloves", subType: "light", tab: "Armor", level: 11, ac: -2, DEX: 1, CON:1, value: 160, icon: "item_gloves_brigandine.webp" },
    "gloves_trollhide": { name: "Trollhide Grips", slot: "Gloves", subType: "light", tab: "Armor", level: 15, ac: -3, DEX: 1, CON:1, value: 380, icon: "item_gloves_trollhide.webp" },
    "gloves_mithril": { name: "Mithril Chain-Gloves", slot: "Gloves", subType: "light", tab: "Armor", level: 18, ac: -3, DEX: 2, CON:1, value: 750, icon: "item_gloves_mithril.webp" },
    "gloves_shadow_leather": { name: "Shadow-Leather Gloves", slot: "Gloves", subType: "light", tab: "Armor", level: 22, ac: -4, DEX: 2, CON:1, value: 1400, icon: "item_gloves_shadow_leather.webp" },
    "gloves_adamantite_scale": { name: "Adamantite Scale Bracers", slot: "Gloves", subType: "light", tab: "Armor", level: 25, ac: -4, DEX: 2, CON:2, value: 2800, icon: "item_gloves_adamantite_scale.webp" },
    "gloves_dragonhide": { name: "Dragonhide Grips", slot: "Gloves", subType: "light", tab: "Armor", level: 28, ac: -5, DEX: 2, CON:2, value: 4500, icon: "item_gloves_dragonhide.webp" },
    "unique_grasps_night_wind": { name: "Grasps of the Night Wind", slot: "Gloves", subType: "light", tab: "Armor", level: 30, ac: -6, DEX: 2, CON:2, value: 7500, icon: "item_unique_grasps_night_wind.webp" },

    // HEAVY GLOVES (Warriors, Paladins - High AC, heavy)
    "gloves_iron": { name: "Iron Gauntlets", slot: "Gloves", subType: "heavy", tab: "Armor", level: 2, ac: -2, value: 25, icon: "item_gloves_iron.webp" },
    "gloves_chain_steel": { name: "Steel Chain-Mitts", slot: "Gloves", subType: "heavy", tab: "Armor", level: 5, ac: -3, value: 75, icon: "item_gloves_chain_steel.webp" },
    "gloves_splint": { name: "Splint Vambraces", slot: "Gloves", subType: "heavy", tab: "Armor", level: 9, ac: -4, value: 180, icon: "item_gloves_splint.webp" },
    "gloves_plate_steel": { name: "Steel Gauntlets", slot: "Gloves", subType: "heavy", tab: "Armor", level: 13, ac: -5, value: 420, icon: "item_gloves_plate_steel.webp" },
    "gloves_great_silver": { name: "Silvered Gauntlets", slot: "Gloves", subType: "heavy", tab: "Armor", level: 16, ac: -6, value: 850, icon: "item_gloves_great_silver.webp" },
    "gloves_obsidian": { name: "Obsidian Vambraces", slot: "Gloves", subType: "heavy", tab: "Armor", level: 20, ac: -7, value: 1700, icon: "item_gloves_obsidian.webp" },
    "gloves_adamantite_great": { name: "Adamantite Gauntlets", slot: "Gloves", subType: "heavy", tab: "Armor", level: 24, ac: -9, value: 3400, icon: "item_gloves_adamantite_great.webp" },
    "gloves_meteorite_juggernaut": { name: "Meteorite Fists", slot: "Gloves", subType: "heavy", tab: "Armor", level: 27, ac: -11, value: 5500, icon: "item_gloves_meteorite_juggernaut.webp" },
    "gloves_dragonbone": { name: "Dragonbone Gauntlets", slot: "Gloves", subType: "heavy", tab: "Armor", level: 29, ac: -13, value: 8200, icon: "item_gloves_dragonbone.webp" },
    "unique_gauntlets_indomitable": { name: "Gauntlets of the Indomitable", slot: "Gloves", subType: "heavy", tab: "Armor", level: 30, ac: -15, value: 12000, icon: "item_unique_gauntlets_indomitable.webp" },

    // BRONZE GLOVES (Vibrants Only - Resonant metals, milestone upgrades)
    "gloves_bronze": { name: "Bronze Gauntlets", slot: "Gloves", subType: "bronze", tab: "Armor", level: 2, ac: -1, value: 15, icon: "item_gloves_bronze.webp" },
    "gloves_harmonic": { name: "Harmonic Bracers", slot: "Gloves", subType: "bronze", tab: "Armor", level: 8, ac: -3, STR: 1, value: 150, icon: "item_gloves_harmonic.webp" },
    "gloves_gilded_sun": { name: "Gilded Sun-Grips", slot: "Gloves", subType: "bronze", tab: "Armor", level: 15, ac: -5, STR: 2, value: 800, icon: "item_gloves_gilded_sun.webp" },
    "gloves_symphony": { name: "Symphony Gauntlets", slot: "Gloves", subType: "bronze", tab: "Armor", level: 22, ac: -7, STR: 3, value: 2800, icon: "item_gloves_symphony.webp" },
    "unique_grasps_lyrewight": { name: "Grasps of the Lyre-Wight", slot: "Gloves", subType: "bronze", tab: "Armor", level: 30, ac: -10, STR: 4, value: 8500, icon: "item_unique_grasps_lyrewight.webp" },
    
    // === 👢 ARMOR (BOOTS) ===
    // MAGE BOOTS (Mages, Healers - Very low AC)
    "shoes_mage": { name: "Apprentice Shoes", slot: "Boots", subType: "mage_armor", tab: "Armor", level: 1, ac: 0, magicBoost : 1.01, value: 6, icon: "item_shoes_mage.webp" },
    "shoes_mystic": { name: "Mystic Shoes", slot: "Boots", subType: "mage_armor", tab: "Armor", level: 4, ac: 0, magicBoost : 1.03, value: 25, icon: "item_shoes_mystic.webp" },
    "boots_velvet": { name: "Velvet Boots", slot: "Boots", subType: "mage_armor", tab: "Armor", level: 8, ac: -1, magicBoost : 1.05, value: 80, icon: "item_boots_velvet.webp" },
    "shoes_silk": { name: "Silk Slippers", slot: "Boots", subType: "mage_armor", tab: "Armor", level: 11, ac: -1, magicBoost : 1.07, DEX: 1, value: 180, icon: "item_shoes_silk.webp" },
    "boots_samite": { name: "Samite Boots", slot: "Boots", subType: "mage_armor", tab: "Armor", level: 15, ac: -2, magicBoost : 1.10, DEX: 1, value: 400, icon: "item_boots_samite.webp" },
    "boots_spidersilk": { name: "Spidersilk Boots", slot: "Boots", subType: "mage_armor", tab: "Armor", level: 18, ac: -2, magicBoost : 1.13, DEX: 1, value: 800, icon: "item_boots_spidersilk.webp" },
    "shoes_moonweave": { name: "Moonweave Shoes", slot: "Boots", subType: "mage_armor", tab: "Armor", level: 22, ac: -3, magicBoost : 1.15, DEX: 2, value: 1500, icon: "item_shoes_moonweave.webp" },
    "boots_spellthread": { name: "Spellthread Boots", slot: "Boots", subType: "mage_armor", tab: "Armor", level: 25, ac: -3, magicBoost : 1.17, DEX: 2, value: 2800, icon: "item_boots_spellthread.webp" },
    "boots_starspun": { name: "Star-Spun Boots", slot: "Boots", subType: "mage_armor", tab: "Armor", level: 28, ac: -4, magicBoost : 1.2, DEX: 2, value: 5000, icon: "item_boots_starspun.webp" },
    "unique_treads_archon": { name: "Archon's Treads", slot: "Boots", subType: "mage_armor", tab: "Armor", level: 30, ac: -5, magicBoost : 1.23, DEX: 2, value: 8000, icon: "item_unique_treads_archon.webp" },

    // LIGHT BOOTS (Rogues, Bards, Warriors, Paladins - Moderate AC)
    "boots_leather": { name: "Leather Boots", slot: "Boots", subType: "light", tab: "Armor", level: 1, ac: -1, value: 7, icon: "item_boots_leather.webp" },
    "boots_studded": { name: "Studded Boots", slot: "Boots", subType: "light", tab: "Armor", level: 4, ac: -1, STR:1, value: 25, icon: "item_boots_studded.webp" },
    "boots_boiled_hide": { name: "Boiled Hide Boots", slot: "Boots", subType: "light", tab: "Armor", level: 8, ac: -2, STR: 1, value: 70, icon: "item_boots_boiled_hide.webp" },
    "boots_brigandine": { name: "Steel-Plated Boots", slot: "Boots", subType: "light", tab: "Armor", level: 11, ac: -2, STR: 1, LUK: 1, value: 160, icon: "item_boots_brigandine.webp" },
    "boots_trollhide": { name: "Trollhide Boots", slot: "Boots", subType: "light", tab: "Armor", level: 15, ac: -3, STR: 1, LUK: 1, value: 380, icon: "item_boots_trollhide.webp" },
    "boots_mithril": { name: "Mithril Chain-Boots", slot: "Boots", subType: "light", tab: "Armor", level: 18, ac: -3, STR: 2, LUK: 1, value: 750, icon: "item_boots_mithril.webp" },
    "boots_shadow_leather": { name: "Shadow-Leather Boots", slot: "Boots", subType: "light", tab: "Armor", level: 22, ac: -4, STR: 2, LUK: 1, value: 1400, icon: "item_boots_shadow_leather.webp" },
    "boots_adamantite_scale": { name: "Adamantite Scale Boots", slot: "Boots", subType: "light", tab: "Armor", level: 25, ac: -4, STR: 2, LUK: 2, value: 2800, icon: "item_boots_adamantite_scale.webp" },
    "boots_dragonhide": { name: "Dragonhide Boots", slot: "Boots", subType: "light", tab: "Armor", level: 28, ac: -5, STR: 2, LUK: 2, value: 4500, icon: "item_boots_dragonhide.webp" },
    "unique_striders_night_wind": { name: "Striders of the Night Wind", slot: "Boots", subType: "light", tab: "Armor", level: 30, ac: -6, STR: 2, LUK: 2, value: 7500, icon: "item_unique_striders_night_wind.webp" },

    // HEAVY BOOTS (Warriors, Paladins - High AC, heavy)
    "boots_iron": { name: "Iron Greaves", slot: "Boots", subType: "heavy", tab: "Armor", level: 3, ac: -2, value: 30, icon: "item_boots_iron.webp" },
    "boots_chain_steel": { name: "Steel Chain-Boots", slot: "Boots", subType: "heavy", tab: "Armor", level: 5, ac: -3, value: 75, icon: "item_boots_chain_steel.webp" },
    "boots_splint": { name: "Splint Greaves", slot: "Boots", subType: "heavy", tab: "Armor", level: 9, ac: -4, CON: 1, value: 180, icon: "item_boots_splint.webp" },
    "boots_plate_steel": { name: "Steel Sabatons", slot: "Boots", subType: "heavy", tab: "Armor", level: 13, ac: -5, CON: 1, value: 420, icon: "item_boots_plate_steel.webp" },
    "boots_great_silver": { name: "Silvered Sabatons", slot: "Boots", subType: "heavy", tab: "Armor", level: 16, ac: -6, CON: 1, value: 850, icon: "item_boots_great_silver.webp" },
    "boots_obsidian": { name: "Obsidian Greaves", slot: "Boots", subType: "heavy", tab: "Armor", level: 20, ac: -7, CON: 2, value: 1700, icon: "item_boots_obsidian.webp" },
    "boots_adamantite_great": { name: "Adamantite Sabatons", slot: "Boots", subType: "heavy", tab: "Armor", level: 24, ac: -9, CON: 2, value: 3400, icon: "item_boots_adamantite_great.webp" },
    "boots_meteorite_juggernaut": { name: "Meteorite Treads", slot: "Boots", subType: "heavy", tab: "Armor", level: 27, ac: -11, CON: 3, value: 5500, icon: "item_boots_meteorite_juggernaut.webp" },
    "boots_dragonbone": { name: "Dragonbone Sabatons", slot: "Boots", subType: "heavy", tab: "Armor", level: 29, ac: -13, CON: 3, value: 8200, icon: "item_boots_dragonbone.webp" },
    "unique_sabatons_indomitable": { name: "Sabatons of the Indomitable", slot: "Boots", subType: "heavy", tab: "Armor", level: 30, ac: -15, CON: 4, value: 12000, icon: "item_unique_sabatons_indomitable.webp" },

    // BRONZE BOOTS (Vibrants Only - Resonant metals, milestone upgrades)
    "boots_bronze": { name: "Bronze Boots", slot: "Boots", subType: "bronze", tab: "Armor", level: 2, ac: -1, value: 18, icon: "item_boots_bronze.webp" },
    "boots_harmonic": { name: "Harmonic Sabatons", slot: "Boots", subType: "bronze", tab: "Armor", level: 8, ac: -3, CON: 1, value: 150, icon: "item_boots_harmonic.webp" },
    "boots_gilded_sun": { name: "Gilded Sun-Boots", slot: "Boots", subType: "bronze", tab: "Armor", level: 15, ac: -5, CON: 2, value: 800, icon: "item_boots_gilded_sun.webp" },
    "boots_symphony": { name: "Symphony Greaves", slot: "Boots", subType: "bronze", tab: "Armor", level: 22, ac: -7, CON: 3, value: 2800, icon: "item_boots_symphony.webp" },
    "unique_treads_lyrewight": { name: "Treads of the Lyre-Wight", slot: "Boots", subType: "bronze", tab: "Armor", level: 30, ac: -10, CON: 3, value: 8500, icon: "item_unique_treads_lyrewight.webp" },
               
	// === 🧪 HEALING POTIONS (10 Levels, up to Lvl 30) ===
    "potion_hp_1": { name: "Minor Health Potion", slot: "Consumable", tab: "Consumable", level: 1, hpHeal: 25, value: 10, icon: "item_potion_hp1.webp", stackable: true },
    "potion_hp_2": { name: "Health Potion", slot: "Consumable", tab: "Consumable", level: 3, hpHeal: 50, value: 25, icon: "item_potion_hp2.webp", stackable: true },
    "potion_hp_3": { name: "Potent Health Potion", slot: "Consumable", tab: "Consumable", level: 6, hpHeal: 100, value: 60, icon: "item_potion_hp3.webp", stackable: true },
    "potion_hp_4": { name: "Greater Health Potion", slot: "Consumable", tab: "Consumable", level: 9, hpHeal: 200, value: 120, icon: "item_potion_hp4.webp", stackable: true },
    "potion_hp_5": { name: "Major Health Potion", slot: "Consumable", tab: "Consumable", level: 12, hpHeal: 350, value: 220, icon: "item_potion_hp5.webp", stackable: true },
    "potion_hp_6": { name: "Grand Health Potion", slot: "Consumable", tab: "Consumable", level: 16, hpHeal: 500, value: 350, icon: "item_potion_hp6.webp", stackable: true },
    "potion_hp_7": { name: "Supreme Health Potion", slot: "Consumable", tab: "Consumable", level: 20, hpHeal: 750, value: 550, icon: "item_potion_hp7.webp", stackable: true },
    "potion_hp_8": { name: "Ultimate Health Potion", slot: "Consumable", tab: "Consumable", level: 24, hpHeal: 1000, value: 800, icon: "item_potion_hp8.webp", stackable: true },
    "potion_hp_9": { name: "Elixir of Health", slot: "Consumable", tab: "Consumable", level: 27, hpHeal: 9999, value: 1500, icon: "item_potion_hp9.webp", stackable: true },
    "potion_hp_10": { name: "Tears of the Goddess", slot: "Consumable", tab: "Consumable", level: 30, hpHeal: 9999, resurrect: true, value: 5000, icon: "item_potion_hp10.webp", stackable: true },

    // === 🌌 RESTORATION POTIONS (SP/MP) (10 Levels, up to Lvl 30) ===
    "potion_mp_1": { name: "Minor Mana Potion", slot: "Consumable", tab: "Consumable", level: 1, mpHeal: 30, value: 15, icon: "item_potion_mp1.webp", stackable: true },
    "potion_mp_2": { name: "Mana Potion", slot: "Consumable", tab: "Consumable", level: 4, mpHeal: 60, value: 40, icon: "item_potion_mp2.webp", stackable: true },
    "potion_mp_3": { name: "Potent Mana Potion", slot: "Consumable", tab: "Consumable", level: 7, mpHeal: 120, value: 90, icon: "item_potion_mp3.webp", stackable: true },
    "potion_mp_4": { name: "Greater Mana Potion", slot: "Consumable", tab: "Consumable", level: 10, mpHeal: 180, value: 180, icon: "item_potion_mp4.webp", stackable: true },
    "potion_mp_5": { name: "Major Mana Potion", slot: "Consumable", tab: "Consumable", level: 13, mpHeal: 300, value: 350, icon: "item_potion_mp5.webp", stackable: true },
    // Levels 6-10 heal BOTH HP and MP!
    "potion_rejuv_1": { name: "Rejuvenation", slot: "Consumable", tab: "Consumable", level: 16, hpHeal: 200, mpHeal: 150, value: 600, icon: "item_potion_rejuv1.webp", stackable: true },
    "potion_rejuv_2": { name: "Grand Rejuvenation", slot: "Consumable", tab: "Consumable", level: 19, hpHeal: 400, mpHeal: 300, value: 1000, icon: "item_potion_rejuv2.webp", stackable: true },
    "potion_rejuv_3": { name: "Supreme Rejuvenation", slot: "Consumable", tab: "Consumable", level: 23, hpHeal: 700, mpHeal: 500, value: 1800, icon: "item_potion_rejuv3.webp", stackable: true },
    "potion_rejuv_4": { name: "Ultimate Rejuvenation", slot: "Consumable", tab: "Consumable", level: 27, hpHeal: 1200, mpHeal: 800, value: 3000, icon: "item_potion_rejuv4.webp", stackable: true },
    "potion_rejuv_5": { name: "Elixir of the Cosmos", slot: "Consumable", tab: "Consumable", level: 30, hpHeal: 9999, mpHeal: 9999, curesAll: true, value: 7500, icon: "item_potion_rejuv5.webp", stackable: true },

    // === 🌿 CURE POTIONS (10 Levels, up to Lvl 20) ===
    "potion_cure_4": { name: "Awakening Salts", slot: "Consumable", tab: "Consumable", level: 1, cures: ["Sleep"], value: 15, icon: "item_potion_cure4.webp", stackable: true },
	"potion_cure_7": { name: "Thawing Draught", slot: "Consumable", tab: "Consumable", level: 2, cures: ["Frozen"], value: 20, icon: "item_potion_cure7.webp", stackable: true },
	"potion_cure_2": { name: "Cure Disease", slot: "Consumable", tab: "Consumable", level: 2, cures: ["Disease"], value: 25, icon: "item_potion_cure2.webp", stackable: true },
	"potion_cure_1": { name: "Cure Poison", slot: "Consumable", tab: "Consumable", level: 2, cures: ["Poison"], value: 30, icon: "item_potion_cure1.webp", stackable: true },    
	"potion_cure_3": { name: "Tonic of Clarity", slot: "Consumable", tab: "Consumable", level: 3, cures: ["Confusion"], value: 35, icon: "item_potion_cure3.webp", stackable: true },	
	"potion_cure_6": { name: "Cure Blindness", slot: "Consumable", tab: "Consumable", level: 4, cures: ["Blindness"], value: 50, icon: "item_potion_cure6.webp", stackable: true },
	"potion_cure_5": { name: "Potion of Sanity", slot: "Consumable", tab: "Consumable", level: 4, cures: ["Madness"], value: 55, icon: "item_potion_cure5.webp", stackable: true },    
	"potion_cure_8": { name: "Unbinding Salve", slot: "Consumable", tab: "Consumable", level: 5, cures: ["Paralysis"], value: 75, icon: "item_potion_cure8.webp", stackable: true },        
    "potion_cure_9": { name: "Panacea Extract", slot: "Consumable", tab: "Consumable", level: 10, cures: ["Poison", "Disease", "Blindness", "Confusion"], value: 400, icon: "item_potion_cure9.webp", stackable: true },
    "potion_cure_10": { name: "Universal Panacea", slot: "Consumable", tab: "Consumable", level: 15, curesAll: true, value: 800, icon: "item_potion_cure10.webp", stackable: true },

    // === 🕯️ LIGHT SOURCES ===
    "torch": { name: "Torch", slot: "Consumable", tab: "Consumable", level: 1, lightRadius: 2, duration: 100, value: 5, icon: "item_torch.webp", stackable: true },
    "lantern_oil": { name: "Oil Lantern", slot: "Consumable", tab: "Consumable", level: 5, lightRadius: 3, duration: 150, value: 35, icon: "item_lantern_oil.webp", stackable: true },
    "orb_glowstone": { name: "Glowstone Orb", slot: "Consumable", tab: "Consumable", level: 10, lightRadius: 4, duration: 250, value: 120, icon: "item_orb_glowstone.webp", stackable: true },
    "beacon_starfire": { name: "Starfire Beacon", slot: "Consumable", tab: "Consumable", level: 15, lightRadius: 5, duration: 400, value: 450, icon: "item_beacon_starfire.webp", stackable: true },
		
    // === 🍞 NORMAL FOOD & DRINK (Levels 1 - 15) ===
    "food_apple": { name: "Fresh Apple", slot: "Consumable", tab: "Consumable", level: 1, hpHeal: 2, value: 1, icon: "item_food_apple.webp", stackable: true },    
    "food_cheese": { name: "Wedge of Cheese", slot: "Consumable", tab: "Consumable", level: 1, hpHeal: 3, value: 2, icon: "item_food_cheese.webp", stackable: true },
    "food_bread": { name: "Loaf of Bread", slot: "Consumable", tab: "Consumable", level: 2, hpHeal: 5, value: 4, icon: "item_food_bread.webp", stackable: true },    
    "food_jerky": { name: "Dried Meat", slot: "Consumable", tab: "Consumable", level: 4, hpHeal: 7, value: 12, icon: "item_food_jerky.webp", stackable: true },    
    "food_wheel": { name: "Wheel of Cheese", slot: "Consumable", tab: "Consumable", level: 7, hpHeal: 10, value: 35, icon: "item_food_wheel.webp", stackable: true },    
    "food_ham": { name: "Smoked Ham", slot: "Consumable", tab: "Consumable", level: 11, hpHeal: 14, value: 85, icon: "item_food_ham.webp", stackable: true },    
    "food_pie": { name: "Meat Pie", slot: "Consumable", tab: "Consumable", level: 14, hpHeal: 18, value: 165, icon: "item_food_pie.webp", stackable: true },
    "food_pot_pie": { name: "Pot Pie", slot: "Consumable", tab: "Consumable", level: 15, hpHeal: 20, value: 190, icon: "item_food_pot_pie.webp", stackable: true },
	
	"drink_water": { name: "Flask of Water", slot: "Consumable", tab: "Consumable", level: 1, songHeal: 1, value: 1, icon: "item_drink_water.webp", stackable: true },
    "drink_milk": { name: "Bottle of Milk", slot: "Consumable", tab: "Consumable", level: 3, songHeal: 2, value: 6, icon: "item_drink_milk.webp", stackable: true },
    "drink_ale": { name: "Bottle of Ale", slot: "Consumable", tab: "Consumable", level: 5, songHeal: 3, value: 18, icon: "item_drink_ale.webp", stackable: true },
    "drink_wine": { name: "Common Wine", slot: "Consumable", tab: "Consumable", level: 9, songHeal: 4, value: 50, icon: "item_drink_wine.webp", stackable: true },
    "drink_mead": { name: "Spiced Mead", slot: "Consumable", tab: "Consumable", level: 13, songHeal: 5, value: 130, icon: "item_drink_mead.webp", stackable: true },
    "drink_vintage": { name: "Vintage Wine", slot: "Consumable", tab: "Consumable", level: 15, songHeal: 8, value: 200, icon: "item_drink_vintage.webp", stackable: true },
    
	
    // === 🏹 AMMUNITION (Levels 1 - 25) ===
    // ARROWS (For Bows - Balanced Damage Multipliers)
    "arrow_iron": { name: "Iron Arrow", slot: "Ammo", tab: "Ammo", level: 1, value: 1, icon: "item_arrow_iron.webp", stackable: true, isAmmo: true, ammoType: "arrow", dmgMult: 1.0 },
    "arrow_steel": { name: "Steel Arrow", slot: "Ammo", tab: "Ammo", level: 3, value: 3, icon: "item_arrow_steel.webp", stackable: true, isAmmo: true, ammoType: "arrow", dmgMult: 1.1 },
    "arrow_silver": { name: "Silver Arrow", slot: "Ammo", tab: "Ammo", level: 5, value: 8, icon: "item_arrow_silver.webp", stackable: true, isAmmo: true, ammoType: "arrow", dmgMult: 1.2 },
    "arrow_mithril": { name: "Mithril Arrow", slot: "Ammo", tab: "Ammo", level: 8, value: 15, icon: "item_arrow_mithril.webp", stackable: true, isAmmo: true, ammoType: "arrow", dmgMult: 1.3 },
    "arrow_obsidian": { name: "Obsidian Arrow", slot: "Ammo", tab: "Ammo", level: 11, value: 25, icon: "item_arrow_obsidian.webp", stackable: true, isAmmo: true, ammoType: "arrow", dmgMult: 1.4 },
    "arrow_voidglass": { name: "Voidglass Arrow", slot: "Ammo", tab: "Ammo", level: 14, value: 40, icon: "item_arrow_voidglass.webp", stackable: true, isAmmo: true, ammoType: "arrow", dmgMult: 1.5 },
    "arrow_adamantite": { name: "Adamantite Arrow", slot: "Ammo", tab: "Ammo", level: 17, value: 60, icon: "item_arrow_adamantite.webp", stackable: true, isAmmo: true, ammoType: "arrow", dmgMult: 1.7 },
    "arrow_meteorite": { name: "Meteorite Arrow", slot: "Ammo", tab: "Ammo", level: 20, value: 90, icon: "item_arrow_meteorite.webp", stackable: true, isAmmo: true, ammoType: "arrow", dmgMult: 1.9 },
    "arrow_dragonbone": { name: "Dragonbone Arrow", slot: "Ammo", tab: "Ammo", level: 23, value: 130, icon: "item_arrow_dragonbone.webp", stackable: true, isAmmo: true, ammoType: "arrow", dmgMult: 2.1 },
    "arrow_celestial": { name: "Celestial Arrow", slot: "Ammo", tab: "Ammo", level: 25, value: 180, icon: "item_arrow_celestial.webp", stackable: true, isAmmo: true, ammoType: "arrow", dmgMult: 2.4 },

    // BOLTS (For Crossbows - Highest Damage Multipliers)
    "bolt_iron": { name: "Iron Bolt", slot: "Ammo", tab: "Ammo", level: 1, value: 2, icon: "item_bolt_iron.webp", stackable: true, isAmmo: true, ammoType: "bolt", dmgMult: 1.1 },
    "bolt_steel": { name: "Steel Bolt", slot: "Ammo", tab: "Ammo", level: 3, value: 4, icon: "item_bolt_steel.webp", stackable: true, isAmmo: true, ammoType: "bolt", dmgMult: 1.2 },
    "bolt_silver": { name: "Silver Bolt", slot: "Ammo", tab: "Ammo", level: 5, value: 10, icon: "item_bolt_silver.webp", stackable: true, isAmmo: true, ammoType: "bolt", dmgMult: 1.3 },
    "bolt_mithril": { name: "Mithril Bolt", slot: "Ammo", tab: "Ammo", level: 8, value: 18, icon: "item_bolt_mithril.webp", stackable: true, isAmmo: true, ammoType: "bolt", dmgMult: 1.4 },
    "bolt_obsidian": { name: "Obsidian Bolt", slot: "Ammo", tab: "Ammo", level: 11, value: 30, icon: "item_bolt_obsidian.webp", stackable: true, isAmmo: true, ammoType: "bolt", dmgMult: 1.5 },
    "bolt_voidglass": { name: "Voidglass Bolt", slot: "Ammo", tab: "Ammo", level: 14, value: 48, icon: "item_bolt_voidglass.webp", stackable: true, isAmmo: true, ammoType: "bolt", dmgMult: 1.6 },
    "bolt_adamantite": { name: "Adamantite Bolt", slot: "Ammo", tab: "Ammo", level: 17, value: 72, icon: "item_bolt_adamantite.webp", stackable: true, isAmmo: true, ammoType: "bolt", dmgMult: 1.8 },
    "bolt_meteorite": { name: "Meteorite Bolt", slot: "Ammo", tab: "Ammo", level: 20, value: 105, icon: "item_bolt_meteorite.webp", stackable: true, isAmmo: true, ammoType: "bolt", dmgMult: 2.0 },
    "bolt_dragonbone": { name: "Dragonbone Bolt", slot: "Ammo", tab: "Ammo", level: 23, value: 150, icon: "item_bolt_dragonbone.webp", stackable: true, isAmmo: true, ammoType: "bolt", dmgMult: 2.3 },
    "bolt_celestial": { name: "Celestial Bolt", slot: "Ammo", tab: "Ammo", level: 25, value: 210, icon: "item_bolt_celestial.webp", stackable: true, isAmmo: true, ammoType: "bolt", dmgMult: 2.6 },

    // SLING STONES (For Slings - Very cheap, lower multipliers early on)
    "stone_river": { name: "River Stone", slot: "Ammo", tab: "Ammo", level: 1, value: 1, icon: "item_stone_river.webp", stackable: true, isAmmo: true, ammoType: "stone", dmgMult: 1.0 },
    "stone_iron": { name: "Iron Bullet", slot: "Ammo", tab: "Ammo", level: 3, value: 2, icon: "item_stone_iron.webp", stackable: true, isAmmo: true, ammoType: "stone", dmgMult: 1.05 },
    "stone_steel": { name: "Steel Bullet", slot: "Ammo", tab: "Ammo", level: 5, value: 5, icon: "item_stone_steel.webp", stackable: true, isAmmo: true, ammoType: "stone", dmgMult: 1.1 },
    "stone_silver": { name: "Silver Bullet", slot: "Ammo", tab: "Ammo", level: 8, value: 10, icon: "item_stone_silver.webp", stackable: true, isAmmo: true, ammoType: "stone", dmgMult: 1.15 },
    "stone_mithril": { name: "Mithril Bullet", slot: "Ammo", tab: "Ammo", level: 11, value: 18, icon: "item_stone_mithril.webp", stackable: true, isAmmo: true, ammoType: "stone", dmgMult: 1.25 },
    "stone_obsidian": { name: "Obsidian Sphere", slot: "Ammo", tab: "Ammo", level: 14, value: 30, icon: "item_stone_obsidian.webp", stackable: true, isAmmo: true, ammoType: "stone", dmgMult: 1.35 },
    "stone_voidglass": { name: "Voidglass Orb", slot: "Ammo", tab: "Ammo", level: 17, value: 45, icon: "item_stone_voidglass.webp", stackable: true, isAmmo: true, ammoType: "stone", dmgMult: 1.45 },
    "stone_adamantite": { name: "Adamantite Bullet", slot: "Ammo", tab: "Ammo", level: 20, value: 65, icon: "item_stone_adamantite.webp", stackable: true, isAmmo: true, ammoType: "stone", dmgMult: 1.6 },
    "stone_meteorite": { name: "Meteorite Sphere", slot: "Ammo", tab: "Ammo", level: 23, value: 95, icon: "item_stone_meteorite.webp", stackable: true, isAmmo: true, ammoType: "stone", dmgMult: 1.8 },
    "stone_celestial": { name: "Celestial Orb", slot: "Ammo", tab: "Ammo", level: 25, value: 140, icon: "item_stone_celestial.webp", stackable: true, isAmmo: true, ammoType: "stone", dmgMult: 2.1 },
    
    // === 💎 GEMS & VALUABLES ===
    // Note: slot is "Consumable" so the engine knows it belongs in the inventory but CANNOT be equipped as armor/weapons.
    
    // Levels 1-5
    "gem_quartz": { name: "Quartz", slot: "Consumable", tab: "Consumable", level: 1, value: 30, icon: "item_gem_quartz.webp", stackable: true },
    "gem_agate": { name: "Agate", slot: "Consumable", tab: "Consumable", level: 2, value: 80, icon: "item_gem_agate.webp", stackable: true },
    "gem_fluorite": { name: "Fluorite", slot: "Consumable", tab: "Consumable", level: 3, value: 150, icon: "item_gem_fluorite.webp", stackable: true },
    "gem_moonstone": { name: "Moonstone", slot: "Consumable", tab: "Consumable", level: 4, value: 200, icon: "item_gem_moonstone.webp", stackable: true },
    "gem_topaz": { name: "Topaz", slot: "Consumable", tab: "Consumable", level: 5, value: 300, icon: "item_gem_topaz.webp", stackable: true },
    
    // Levels 6-10
    "gem_amethyst": { name: "Amethyst", slot: "Consumable", tab: "Consumable", level: 6, value: 380, icon: "item_gem_amethyst.webp", stackable: true },
    "gem_garnet": { name: "Garnet", slot: "Consumable", tab: "Consumable", level: 7, value: 450, icon: "item_gem_garnet.webp", stackable: true },
    "gem_onyx": { name: "Onyx", slot: "Consumable", tab: "Consumable", level: 8, value: 550, icon: "item_gem_onyx.webp", stackable: true },
    "gem_jade": { name: "Jade", slot: "Consumable", tab: "Consumable", level: 9, value: 650, icon: "item_gem_jade.webp", stackable: true },
    "gem_lapis": { name: "Lapis Lazuli", slot: "Consumable", tab: "Consumable", level: 10, value: 750, icon: "item_gem_lapis.webp", stackable: true },
    
    // Levels 11-15
    "gem_peridot": { name: "Peridot", slot: "Consumable", tab: "Consumable", level: 11, value: 850, icon: "item_gem_peridot.webp", stackable: true },
    "gem_pearl": { name: "Pearl", slot: "Consumable", tab: "Consumable", level: 12, value: 1000, icon: "item_gem_pearl.webp", stackable: true },
    "gem_aquamarine": { name: "Aquamarine", slot: "Consumable", tab: "Consumable", level: 13, value: 1150, icon: "item_gem_aquamarine.webp", stackable: true },
    "gem_spinel": { name: "Spinel", slot: "Consumable", tab: "Consumable", level: 14, value: 1300, icon: "item_gem_spinel.webp", stackable: true },
    "gem_zircon": { name: "Zircon", slot: "Consumable", tab: "Consumable", level: 15, value: 1500, icon: "item_gem_zircon.webp", stackable: true },
    
    // Levels 16-20
    "gem_opal": { name: "Opal", slot: "Consumable", tab: "Consumable", level: 16, value: 1750, icon: "item_gem_opal.webp", stackable: true },
    "gem_bloodstone": { name: "Bloodstone", slot: "Consumable", tab: "Consumable", level: 17, value: 2000, icon: "item_gem_bloodstone.webp", stackable: true },
    "gem_tanzanite": { name: "Tanzanite", slot: "Consumable", tab: "Consumable", level: 18, value: 2300, icon: "item_gem_tanzanite.webp", stackable: true },
    "gem_malachite": { name: "Malachite", slot: "Consumable", tab: "Consumable", level: 19, value: 2600, icon: "item_gem_malachite.webp", stackable: true },
    "gem_citrine": { name: "Citrine", slot: "Consumable", tab: "Consumable", level: 20, value: 3000, icon: "item_gem_citrine.webp", stackable: true },
    
    // Levels 21-25
    "gem_fire_opal": { name: "Fire Opal", slot: "Consumable", tab: "Consumable", level: 21, value: 3500, icon: "item_gem_fire_opal.webp", stackable: true },
    "gem_emerald": { name: "Emerald", slot: "Consumable", tab: "Consumable", level: 22, value: 4000, icon: "item_gem_emerald.webp", stackable: true },
    "gem_sapphire": { name: "Sapphire", slot: "Consumable", tab: "Consumable", level: 23, value: 4600, icon: "item_gem_sapphire.webp", stackable: true },
    "gem_ruby": { name: "Ruby", slot: "Consumable", tab: "Consumable", level: 24, value: 5200, icon: "item_gem_ruby.webp", stackable: true },
    "gem_black_pearl": { name: "Black Pearl", slot: "Consumable", tab: "Consumable", level: 25, value: 5900, icon: "item_gem_black_pearl.webp", stackable: true },
    
    // Levels 26-30
    "gem_alexandrite": { name: "Alexandrite", slot: "Consumable", tab: "Consumable", level: 26, value: 6600, icon: "item_gem_alexandrite.webp", stackable: true },
    "gem_star_sapphire": { name: "Star Sapphire", slot: "Consumable", tab: "Consumable", level: 27, value: 7400, icon: "item_gem_star_sapphire.webp", stackable: true },
    "gem_flawless_ruby": { name: "Flawless Ruby", slot: "Consumable", tab: "Consumable", level: 28, value: 8200, icon: "item_gem_flawless_ruby.webp", stackable: true },
    "gem_diamond": { name: "Perfect Diamond", slot: "Consumable", tab: "Consumable", level: 29, value: 9000, icon: "item_gem_diamond.webp", stackable: true },
    "gem_pink_star": { name: "Pink Star Diamond", slot: "Consumable", tab: "Consumable", level: 30, value: 10000, icon: "item_gem_pink_star.webp", stackable: true },
	
	// === 💍 RINGS (Utility & Attributes) ===
    // Rings of Armour (Bonus AC)
    "ring_protection_1": { name: "Ring of Protection", slot: "Ring", tab: "Armor", level: 5, ac: -1, value: 500, icon: "item_ring_protection_1.webp" },
    "ring_protection_2": { name: "Ring of Defense", slot: "Ring", tab: "Armor", level: 10, ac: -2, value: 1500, icon: "item_ring_protection_2.webp" },
    "ring_protection_3": { name: "Ring of the Aegis", slot: "Ring", tab: "Armor", level: 15, ac: -3, value: 2500, icon: "item_ring_protection_3.webp" },

    // Rings of Health (Passive HP Regen)
    "ring_regen_1": { name: "Ring of Mending", slot: "Ring", tab: "Armor", level: 8, hpRegen: 0.1, value: 800, icon: "item_ring_regen_1.webp" },
    "ring_regen_2": { name: "Ring of Regeneration", slot: "Ring", tab: "Armor", level: 16, hpRegen: 0.5, value: 2500, icon: "item_ring_regen_2.webp" },
    "ring_regen_3": { name: "Ring of the Troll", slot: "Ring", tab: "Armor", level: 26, hpRegen: 1, value: 6000, icon: "item_ring_regen_3.webp" },

    // Rings of Magic (Passive SP Regen)
    "ring_magic_1": { name: "Ring of Focus", slot: "Ring", tab: "Armor", level: 8, mpRegen: 0.1, reqClass:['Mage', 'Healer'], value: 800, icon: "item_ring_magic_1.webp" },
    "ring_magic_2": { name: "Ring of Brilliance", slot: "Ring", tab: "Armor", level: 16, mpRegen: 0.5, reqClass: ['Mage', 'Healer'], value: 2500, icon: "item_ring_magic_2.webp" },
    "ring_magic_3": { name: "Ring of the Archmage", slot: "Ring", tab: "Armor", level: 26, mpRegen: 1, reqClass: ['Mage', 'Healer'], value: 6000, icon: "item_ring_magic_3.webp" },

    // Unique Utility Rings
    "ring_stability": { name: "Ring of Stability", slot: "Ring", tab: "Armor", level: 2, preventSpin: true, value: 100, icon: "item_ring_stability.webp" },
    "ring_dragon": { name: "Wyrmward Ring", slot: "Ring", tab: "Armor", level: 18, resistAoE: true, value: 3500, icon: "item_ring_dragon.webp" },
    "ring_beacon": { name: "Beacon Ring", slot: "Ring", tab: "Armor", level: 14, isBeacon: true, value: 2000, icon: "item_ring_beacon.webp" },
    "ring_bard": { name: "Maestro's Band", slot: "Ring", tab: "Armor", level: 8, mpRegen: 0.05, permanentSong: true, reqClass: ['Bard'], value: 1500, icon: "item_ring_bard.webp" },
    "ring_light": { name: "Ring of the Luminary", slot: "Ring", tab: "Armor", level: 10, permanentLight: true, value: 1200, icon: "item_ring_light.webp" },
    "ring_levitation": { name: "Ring of Levitation", slot: "Ring", tab: "Armor", level: 12, levitation: true, value: 1500, icon: "item_ring_levitation.webp" },

    // Stat Rings (+1, +2, +3)
    "ring_str_1": { name: "Ring of Brawn +1", slot: "Ring", tab: "Armor", level: 4, STR: 1, value: 400, icon: "item_ring_str_1.webp" },
    "ring_str_2": { name: "Ring of Might +2", slot: "Ring", tab: "Armor", level: 12, STR: 2, value: 1200, icon: "item_ring_str_2.webp" },
    "ring_str_3": { name: "Ring of the Giant +3", slot: "Ring", tab: "Armor", level: 20, STR: 3, value: 3500, icon: "item_ring_str_3.webp" },
    
    "ring_dex_1": { name: "Ring of Agility +1", slot: "Ring", tab: "Armor", level: 4, DEX: 1, value: 400, icon: "item_ring_dex_1.webp" },
    "ring_dex_2": { name: "Ring of Swiftness +2", slot: "Ring", tab: "Armor", level: 12, DEX: 2, value: 1200, icon: "item_ring_dex_2.webp" },
    "ring_dex_3": { name: "Ring of the Wind +3", slot: "Ring", tab: "Armor", level: 20, DEX: 3, value: 3500, icon: "item_ring_dex_3.webp" },
    
    "ring_con_1": { name: "Ring of Vigor +1", slot: "Ring", tab: "Armor", level: 4, CON: 1, value: 400, icon: "item_ring_con_1.webp" },
    "ring_con_2": { name: "Ring of Fortitude +2", slot: "Ring", tab: "Armor", level: 12, CON: 2, value: 1200, icon: "item_ring_con_2.webp" },
    "ring_con_3": { name: "Ring of the Colossus +3", slot: "Ring", tab: "Armor", level: 20, CON: 3, value: 3500, icon: "item_ring_con_3.webp" },
    
    "ring_int_1": { name: "Ring of Intellect +1", slot: "Ring", tab: "Armor", level: 4, INT: 1, value: 400, icon: "item_ring_int_1.webp" },
    "ring_int_2": { name: "Ring of Logic +2", slot: "Ring", tab: "Armor", level: 12, INT: 2, value: 1200, icon: "item_ring_int_2.webp" },
    "ring_int_3": { name: "Ring of the Sage +3", slot: "Ring", tab: "Armor", level: 20, INT: 3, value: 3500, icon: "item_ring_int_3.webp" },
    
    "ring_wis_1": { name: "Ring of Insight +1", slot: "Ring", tab: "Armor", level: 4, WIS: 1, value: 400, icon: "item_ring_wis_1.webp" },
    "ring_wis_2": { name: "Ring of Clarity +2", slot: "Ring", tab: "Armor", level: 12, WIS: 2, value: 1200, icon: "item_ring_wis_2.webp" },
    "ring_wis_3": { name: "Ring of the Prophet +3", slot: "Ring", tab: "Armor", level: 20, WIS: 3, value: 3500, icon: "item_ring_wis_3.webp" },
    
    "ring_cha_1": { name: "Ring of Charm +1", slot: "Ring", tab: "Armor", level: 4, CHA: 1, value: 400, icon: "item_ring_cha_1.webp" },
    "ring_cha_2": { name: "Ring of Presence +2", slot: "Ring", tab: "Armor", level: 12, CHA: 2, value: 1200, icon: "item_ring_cha_2.webp" },
    "ring_cha_3": { name: "Ring of the Sovereign +3", slot: "Ring", tab: "Armor", level: 20, CHA: 3, value: 3500, icon: "item_ring_cha_3.webp" },
    
    "ring_luk_1": { name: "Ring of Fortune +1", slot: "Ring", tab: "Armor", level: 4, LUK: 1, value: 400, icon: "item_ring_luk_1.webp" },
    "ring_luk_2": { name: "Ring of Chance +2", slot: "Ring", tab: "Armor", level: 12, LUK: 2, value: 1200, icon: "item_ring_luk_2.webp" },
    "ring_luk_3": { name: "Ring of Destiny +3", slot: "Ring", tab: "Armor", level: 20, LUK: 3, value: 3500, icon: "item_ring_luk_3.webp" },
	
	"quest_silent_baton": {
    name: "The Silent Baton",
    tab: "Quest",
    slot: "Quest",
    icon: "item_quest_silent_baton.webp", 
    level: 24, // Matches the forge level
    isQuestItem: true
}
	
};

// Simple Loot Generator based on dungeon level
function generateLootDrop(level) {
    let possibleLoot = Object.keys(itemDB).filter(key => itemDB[key].level <= level);
    if (possibleLoot.length === 0) return null;
    return possibleLoot[Math.floor(Math.random() * possibleLoot.length)];
}