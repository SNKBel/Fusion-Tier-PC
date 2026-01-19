import { NodeDef, Rarity, Tag } from './types';

// Approximate grid layout based on description "Tree... 1 top, branches down"
// We use a relative grid 0-12 width, 0-18 height (increased height for spacing)
// Adjusted Y to start at 1.0 (moved up from 1.5)
const LAYOUT = {
    // Root
    1: { x: 6, y: 1.0, parents: [] },
    2: { x: 6, y: 2.5, parents: [1] },
    3: { x: 6, y: 4.0, parents: [2] }, // The Hub

    // Left Upper Branch (Horizontal then down)
    4: { x: 4.5, y: 4.0, parents: [3] },
    5: { x: 3, y: 4.0, parents: [4] },
    6: { x: 1.5, y: 4.0, parents: [5] }, // Corner
    7: { x: 1.5, y: 5.5, parents: [6] },
    8: { x: 1.5, y: 7.0, parents: [7] },
    9: { x: 1.5, y: 8.5, parents: [8] },
    10: { x: 1.5, y: 10.0, parents: [9] },
    11: { x: 1.5, y: 11.5, parents: [10] }, // Bottom Left Corner
    12: { x: 3, y: 11.5, parents: [11] },
    13: { x: 4.5, y: 11.5, parents: [12] },
    14: { x: 4.5, y: 13.0, parents: [13] },
    15: { x: 4.5, y: 14.5, parents: [14] }, // Legendary end

    // Right Upper Branch
    16: { x: 7.5, y: 4.0, parents: [3] },
    17: { x: 9, y: 4.0, parents: [16] },
    18: { x: 10.5, y: 4.0, parents: [17] }, // Corner
    19: { x: 10.5, y: 5.5, parents: [18] },
    20: { x: 10.5, y: 7.0, parents: [19] },
    21: { x: 10.5, y: 8.5, parents: [20] },
    22: { x: 10.5, y: 10.0, parents: [21] },
    23: { x: 10.5, y: 11.5, parents: [22] }, // Bottom Right Corner
    24: { x: 9, y: 11.5, parents: [23] },
    25: { x: 7.5, y: 11.5, parents: [24] },
    26: { x: 7.5, y: 13.0, parents: [25] },
    27: { x: 7.5, y: 14.5, parents: [26] }, // Legendary end

    // Center Down Branch (From Hub 3)
    28: { x: 6, y: 5.5, parents: [3] },
    29: { x: 6, y: 7.0, parents: [28] }, // Legendary Utility
    30: { x: 6, y: 8.5, parents: [29] },
    31: { x: 6, y: 10.0, parents: [30] },
    32: { x: 6, y: 11.5, parents: [31] }, // Cross
    33: { x: 6, y: 13.0, parents: [32] },
    34: { x: 6, y: 14.5, parents: [33] }, // Legendary PvP
};

// Raw Data Mapping
const RAW_NODES = [
    { id: 1, r: Rarity.COMMON, t: Tag.ATTACK },
    { id: 2, r: Rarity.COMMON, t: Tag.DEFENSE },
    { id: 3, r: Rarity.RARE, t: Tag.WILDCARD },
    { id: 4, r: Rarity.COMMON, t: Tag.ATTACK },
    { id: 5, r: Rarity.COMMON, t: Tag.ATTACK },
    { id: 6, r: Rarity.RARE, t: Tag.ATTACK },
    { id: 7, r: Rarity.COMMON, t: Tag.DEFENSE },
    { id: 8, r: Rarity.COMMON, t: Tag.ATTACK },
    { id: 9, r: Rarity.RARE, t: Tag.ATTACK },
    { id: 10, r: Rarity.COMMON, t: Tag.ATTACK },
    { id: 11, r: Rarity.COMMON, t: Tag.DEFENSE },
    { id: 12, r: Rarity.COMMON, t: Tag.UTILITY },
    { id: 13, r: Rarity.COMMON, t: Tag.ATTACK },
    { id: 14, r: Rarity.COMMON, t: Tag.ATTACK },
    { id: 15, r: Rarity.LEGENDARY, t: Tag.ATTACK },
    { id: 16, r: Rarity.COMMON, t: Tag.DEFENSE },
    { id: 17, r: Rarity.COMMON, t: Tag.DEFENSE },
    { id: 18, r: Rarity.RARE, t: Tag.DEFENSE },
    { id: 19, r: Rarity.COMMON, t: Tag.ATTACK },
    { id: 20, r: Rarity.COMMON, t: Tag.DEFENSE },
    { id: 21, r: Rarity.RARE, t: Tag.DEFENSE },
    { id: 22, r: Rarity.COMMON, t: Tag.DEFENSE },
    { id: 23, r: Rarity.COMMON, t: Tag.ATTACK },
    { id: 24, r: Rarity.COMMON, t: Tag.UTILITY },
    { id: 25, r: Rarity.COMMON, t: Tag.DEFENSE },
    { id: 26, r: Rarity.COMMON, t: Tag.DEFENSE },
    { id: 27, r: Rarity.LEGENDARY, t: Tag.DEFENSE },
    { id: 28, r: Rarity.COMMON, t: Tag.UTILITY },
    { id: 29, r: Rarity.LEGENDARY, t: Tag.UTILITY },
    { id: 30, r: Rarity.COMMON, t: Tag.DEFENSE },
    { id: 31, r: Rarity.COMMON, t: Tag.PVP },
    { id: 32, r: Rarity.RARE, t: Tag.PVP },
    { id: 33, r: Rarity.COMMON, t: Tag.PVP },
    { id: 34, r: Rarity.LEGENDARY, t: Tag.PVP },
];

export const NODES: NodeDef[] = RAW_NODES.map(n => ({
    id: n.id,
    rarity: n.r,
    tag: n.t,
    x: LAYOUT[n.id as keyof typeof LAYOUT].x,
    y: LAYOUT[n.id as keyof typeof LAYOUT].y,
    parents: LAYOUT[n.id as keyof typeof LAYOUT].parents,
}));

export const calculateNodeBonus = (baseValue: number, nodeLevel: number, rarity: Rarity): number => {
    if (nodeLevel < 1) return 0;
    
    // Formula: bonus = round(baseValue * (1 + (FACTOR * (level - 1)) / (level + 20)) , 2)
    let factor = 0;
    switch (rarity) {
        case Rarity.LEGENDARY: factor = 5.14; break;
        case Rarity.RARE: factor = 4.46; break;
        case Rarity.COMMON: factor = 2.78; break;
    }

    const multiplier = 1 + (factor * (nodeLevel - 1)) / (nodeLevel + 20);
    const result = baseValue * multiplier;
    
    return Math.round((result + Number.EPSILON) * 100) / 100;
};

export const getCostPerLevel = (rarity: Rarity): number => {
    switch (rarity) {
        case Rarity.COMMON: return 1;
        case Rarity.RARE: return 2;
        case Rarity.LEGENDARY: return 3;
    }
};

export const canEquipSoul = (node: NodeDef, soul: { rarity: Rarity, tags: Tag[] }): boolean => {
    // 1. Rarity Constraint
    // Legendary Soul -> Any Node
    // Rare Soul -> Common or Rare Node
    // Common Soul -> Common Node
    let rarityCheck = false;
    if (soul.rarity === Rarity.LEGENDARY) rarityCheck = true;
    else if (soul.rarity === Rarity.RARE && (node.rarity === Rarity.COMMON || node.rarity === Rarity.RARE)) rarityCheck = true;
    else if (soul.rarity === Rarity.COMMON && node.rarity === Rarity.COMMON) rarityCheck = true;

    if (!rarityCheck) return false;

    // 2. Tag Constraint
    // Soul with Attack Tag -> Attack Node
    // Soul with Defense Tag -> Defense Node
    // ...
    // Wildcard Node -> Any Soul
    
    if (node.tag === Tag.WILDCARD) return true;

    // Does soul have the required tag?
    // Note: Soul can have multiple tags, but needs to match the node's specific tag.
    // Exception: If Soul has Wildcard tag? Prompt implies Soul tags match Node tags directly.
    // "Soul com tag Ataque só pode ir em Node com tag Ataque".
    return soul.tags.includes(node.tag) || soul.tags.includes(Tag.WILDCARD);
};