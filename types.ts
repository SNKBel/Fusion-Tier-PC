export enum Rarity {
  COMMON = 'Common',
  RARE = 'Rare',
  LEGENDARY = 'Legendary',
}

export enum Tag {
  ATTACK = 'Attack',
  DEFENSE = 'Defense',
  UTILITY = 'Utility',
  PVP = 'PvP',
  WILDCARD = 'Wildcard',
}

export interface NodeDef {
  id: number;
  rarity: Rarity;
  tag: Tag;
  x: number; // Grid coordinate X (0-100 scale or similar)
  y: number; // Grid coordinate Y
  parents: number[]; // IDs of parent nodes
}

export interface Stat {
  name: string;
  value: number;
  isPercent: boolean;
}

export interface Soul {
  id: string; // UUID
  name: string;
  rarity: Rarity;
  tags: Tag[]; // Can have multiple tags
  imageUrl: string;
  statsLvl1: Stat[];
  statsLvl2: Stat[];
  statsLvl3: Stat[];
}

export interface TreeState {
  nodeLevels: Record<number, number>; // NodeID -> Level
  equippedSouls: Record<number, string>; // NodeID -> SoulID
  soulLevels: Record<number, 1 | 2 | 3>; // NodeID -> Soul Level (1, 2, or 3)
}

export interface Preset {
  id: number;
  name: string;
  state: TreeState;
}

export const TAG_COLORS = {
  [Tag.ATTACK]: 'text-red-400',
  [Tag.DEFENSE]: 'text-blue-400',
  [Tag.UTILITY]: 'text-green-400',
  [Tag.PVP]: 'text-purple-400',
  [Tag.WILDCARD]: 'text-yellow-400',
};

export const RARITY_COLORS = {
  [Rarity.COMMON]: 'text-gray-300 border-gray-500',
  [Rarity.RARE]: 'text-cyan-400 border-cyan-500',
  [Rarity.LEGENDARY]: 'text-yellow-500 border-yellow-600',
};