import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  NodeDef, Rarity, Tag, Soul, TreeState, 
  RARITY_COLORS, TAG_COLORS, Stat, Preset 
} from './types';
import { NODES, calculateNodeBonus, getCostPerLevel, canEquipSoul } from './constants';
import { NodeIcon } from './components/NodeIcon';
import { SoulManager } from './components/SoulManager';
import { X, Save, Download, RefreshCw, Upload, Database, Settings, ShieldCheck, Sword, Zap, Undo, RotateCcw, FileJson, FolderOpen } from 'lucide-react';
import html2canvas from 'html2canvas';

// Default / Initial Souls 
const INITIAL_SOULS: Soul[] = [
  {
    id: 's1', name: 'Wolf Spirit', rarity: Rarity.COMMON, tags: [Tag.ATTACK], imageUrl: 'https://picsum.photos/id/237/100/100',
    statsLvl1: [{ name: 'Attack Power', value: 10, isPercent: false }],
    statsLvl2: [{ name: 'Attack Power', value: 15, isPercent: false }],
    statsLvl3: [{ name: 'Attack Power', value: 25, isPercent: false }]
  },
  {
    id: 's2', name: 'Turtle Shell', rarity: Rarity.COMMON, tags: [Tag.DEFENSE], imageUrl: 'https://picsum.photos/id/10/100/100',
    statsLvl1: [{ name: 'Defense', value: 5, isPercent: false }],
    statsLvl2: [{ name: 'Defense', value: 8, isPercent: false }],
    statsLvl3: [{ name: 'Defense', value: 12, isPercent: false }]
  },
  {
    id: 's3', name: 'Divine Light', rarity: Rarity.LEGENDARY, tags: [Tag.WILDCARD], imageUrl: 'https://picsum.photos/id/17/100/100',
    statsLvl1: [{ name: 'Experience', value: 5, isPercent: true }],
    statsLvl2: [{ name: 'Experience', value: 7, isPercent: true }],
    statsLvl3: [{ name: 'Experience', value: 10, isPercent: true }]
  }
];

export default function App() {
  // --- STATE ---
  const [souls, setSouls] = useState<Soul[]>(INITIAL_SOULS);
  const [treeState, setTreeState] = useState<TreeState>({
    nodeLevels: {}, // { 1: 0, 2: 0... } default 0
    equippedSouls: {},
    soulLevels: {}
  });
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [isSoulManagerOpen, setIsSoulManagerOpen] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [userFusionLevel, setUserFusionLevel] = useState(100); // User defines this
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Data
  useEffect(() => {
    // Load from LocalStorage
    const savedTree = localStorage.getItem('fts_tree');
    const savedSouls = localStorage.getItem('fts_souls');
    const savedPresets = localStorage.getItem('fts_presets');
    const savedUserLevel = localStorage.getItem('fts_user_level');
    
    if (savedTree) setTreeState(JSON.parse(savedTree));
    if (savedSouls) setSouls(JSON.parse(savedSouls));
    if (savedPresets) setPresets(JSON.parse(savedPresets));
    if (savedUserLevel) setUserFusionLevel(parseInt(savedUserLevel));

    // Init levels to 0 if empty
    setTreeState(prev => {
      const newLevels = { ...prev.nodeLevels };
      NODES.forEach(n => {
        if (newLevels[n.id] === undefined) newLevels[n.id] = 0;
      });
      return { ...prev, nodeLevels: newLevels };
    });
  }, []);

  // Persist Data
  useEffect(() => {
    localStorage.setItem('fts_tree', JSON.stringify(treeState));
    localStorage.setItem('fts_souls', JSON.stringify(souls));
    localStorage.setItem('fts_presets', JSON.stringify(presets));
    localStorage.setItem('fts_user_level', userFusionLevel.toString());
  }, [treeState, souls, presets, userFusionLevel]);

  // --- LOGIC ---

  const getNode = (id: number) => NODES.find(n => n.id === id);

  const usedPoints = NODES.reduce((acc, node) => {
    const lvl = treeState.nodeLevels[node.id] || 0;
    return acc + (lvl * getCostPerLevel(node.rarity));
  }, 0);
  
  const remainingPoints = userFusionLevel - usedPoints;

  const isNodeUnlockable = useCallback((id: number, currentLevels: Record<number, number>) => {
    const node = getNode(id);
    if (!node) return false;
    // Root always unlockable to level 1 if points exist
    if (node.parents.length === 0) return true;
    
    // Check if any parent is > 0
    return node.parents.some(pid => (currentLevels[pid] || 0) > 0);
  }, []);

  const handleLevelChange = (id: number, delta: number) => {
    const node = getNode(id);
    if (!node) return;
    
    const currentLevel = treeState.nodeLevels[id] || 0;
    const cost = getCostPerLevel(node.rarity);
    const newLevel = Math.max(0, currentLevel + delta);
    
    // Check Point Cost for Increment
    if (delta > 0) {
       if (remainingPoints < cost) {
         // Not enough points
         alert("Not enough Fusion Points!");
         return;
       }
       if (currentLevel === 0 && !isNodeUnlockable(id, treeState.nodeLevels)) {
         return; // Locked
       }
    }
    
    // Check Child Logic for Decrement (Cannot set to 0 if it has active children depending on it)
    if (delta < 0 && currentLevel > 0) {
       if (newLevel === 0) {
         const hasActiveChildren = NODES.some(child => 
           child.parents.includes(id) && 
           (treeState.nodeLevels[child.id] || 0) > 0 &&
           // Check if this was the ONLY active parent
           !child.parents.some(p => p !== id && (treeState.nodeLevels[p] || 0) > 0)
         );
         if (hasActiveChildren) {
           alert("Cannot set to 0 because child nodes are active.");
           return;
         }
       }
    }

    setTreeState(prev => ({
      ...prev,
      nodeLevels: { ...prev.nodeLevels, [id]: newLevel }
    }));
  };

  const handleLevelDirectInput = (id: number, val: string) => {
    const intVal = parseInt(val);
    const node = getNode(id);
    if (!node) return;
    const currentLevel = treeState.nodeLevels[id] || 0;

    if (!isNaN(intVal) && intVal >= 0) {
      const delta = intVal - currentLevel;
      if (delta === 0) return;
      
      const costPerLvl = getCostPerLevel(node.rarity);
      const costTotal = delta * costPerLvl;

      // Basic checks
      if (delta > 0) {
        if (remainingPoints < costTotal) {
          alert("Not enough Fusion Points!");
          return;
        }
        if (currentLevel === 0 && !isNodeUnlockable(id, treeState.nodeLevels)) return;
      }
      
      // We don't implement full child-check for direct input for brevity, 
      // but ideally it should follow the same rules as handleLevelChange logic.
      if (intVal === 0 && currentLevel > 0) {
         const hasActiveChildren = NODES.some(child => 
           child.parents.includes(id) && 
           (treeState.nodeLevels[child.id] || 0) > 0 &&
           !child.parents.some(p => p !== id && (treeState.nodeLevels[p] || 0) > 0)
         );
         if (hasActiveChildren) {
           alert("Cannot set to 0 because child nodes are active.");
           return;
         }
      }

      setTreeState(prev => ({
        ...prev,
        nodeLevels: { ...prev.nodeLevels, [id]: intVal }
      }));
    }
  };

  const equipSoul = (nodeId: number, soulId: string) => {
    setTreeState(prev => ({
      ...prev,
      equippedSouls: { ...prev.equippedSouls, [nodeId]: soulId },
      soulLevels: { ...prev.soulLevels, [nodeId]: 1 } // Auto set to lvl 1
    }));
  };

  const unequipSoul = (nodeId: number) => {
    const newState = { ...treeState };
    delete newState.equippedSouls[nodeId];
    delete newState.soulLevels[nodeId];
    setTreeState(newState);
  };

  const setSoulLevel = (nodeId: number, level: 1 | 2 | 3) => {
     setTreeState(prev => ({
       ...prev,
       soulLevels: { ...prev.soulLevels, [nodeId]: level }
     }));
  };

  // --- Soul Manager Handlers ---
  const handleSaveSoul = (soul: Soul) => {
    setSouls(prev => {
      const idx = prev.findIndex(s => s.id === soul.id);
      if (idx >= 0) {
         // Update existing
         const newSouls = [...prev];
         newSouls[idx] = soul;
         return newSouls;
      }
      // Create new
      return [...prev, soul];
    });
  };

  const handleDeleteSoul = (soulId: string) => {
     setSouls(prev => prev.filter(s => s.id !== soulId));
     setTreeState(prev => {
        const newEquipped = { ...prev.equippedSouls };
        const newLevels = { ...prev.soulLevels };
        let changed = false;

        Object.keys(newEquipped).forEach(key => {
           const nodeId = parseInt(key);
           if (newEquipped[nodeId] === soulId) {
             delete newEquipped[nodeId];
             delete newLevels[nodeId];
             changed = true;
           }
        });

        if (!changed) return prev;
        return { ...prev, equippedSouls: newEquipped, soulLevels: newLevels };
     });
  };

  const calculateTotalStats = useMemo(() => {
    const totals: Record<string, number> = {};
    const percentStats: Record<string, boolean> = {};

    Object.entries(treeState.equippedSouls).forEach(([nId, sId]) => {
      const nodeId = parseInt(nId);
      const soul = souls.find(s => s.id === sId);
      const nodeLevel = treeState.nodeLevels[nodeId] || 0;
      const nodeDef = getNode(nodeId);
      const soulLevel = treeState.soulLevels[nodeId] || 1;

      if (!soul || !nodeDef || nodeLevel === 0) return;

      // Get Base Stats for Soul Level
      let stats: Stat[] = [];
      if (soulLevel === 1) stats = soul.statsLvl1;
      else if (soulLevel === 2) stats = soul.statsLvl2;
      else if (soulLevel === 3) stats = soul.statsLvl3;

      stats.forEach(stat => {
        const bonusVal = calculateNodeBonus(stat.value, nodeLevel, nodeDef.rarity);
        const currentVal = totals[stat.name] || 0;
        totals[stat.name] = currentVal + bonusVal;
        percentStats[stat.name] = stat.isPercent;
      });
    });

    return Object.entries(totals).map(([name, val]: [string, number]) => ({
      name,
      value: Math.round(val * 100) / 100,
      isPercent: percentStats[name]
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [treeState, souls]);

  // --- SAVE / EXPORT HANDLERS ---

  const handleExportImage = async () => {
     if (exportRef.current) {
        try {
          // Temporarily show the export container
          exportRef.current.style.display = 'flex';
          const canvas = await html2canvas(exportRef.current, { 
            backgroundColor: '#1c1917',
            width: 1400, // Explicit width for better resolution
            height: 1400,
            scale: 2 // High Res
          });
          exportRef.current.style.display = 'none'; // Hide again

          const link = document.createElement('a');
          link.download = 'fusion-tree-full.png';
          link.href = canvas.toDataURL();
          link.click();
        } catch (e) {
          console.error("Export failed", e);
          alert("Export failed. See console.");
        }
     }
  };

  const handleSaveJSON = () => {
    const data = {
      treeState,
      souls,
      presets,
      userFusionLevel
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fusion-tier-backup-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.treeState) setTreeState(data.treeState);
        if (data.souls) setSouls(data.souls);
        if (data.presets) setPresets(data.presets);
        if (data.userFusionLevel) setUserFusionLevel(data.userFusionLevel);
        alert("Data imported successfully!");
      } catch (err) {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const savePreset = (idx: number) => {
    const newPresets = [...presets];
    // Deep copy state to ensure isolation
    const stateCopy = JSON.parse(JSON.stringify(treeState));
    newPresets[idx] = { id: idx, name: `Preset ${idx + 1}`, state: stateCopy };
    setPresets(newPresets);
    alert(`Preset ${idx + 1} saved!`);
  };

  const loadPreset = (idx: number) => {
    if (presets[idx]) {
      setTreeState(JSON.parse(JSON.stringify(presets[idx].state)));
    } else {
      alert("Slot is empty!");
    }
  };

  // --- RENDERING HELPERS ---

  // Reusable Tree Renderer for both interactive view and static export
  const renderTreeContent = (isStatic = false) => (
    <>
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {NODES.map(node => {
          return node.parents.map(parentId => {
            const parent = NODES.find(n => n.id === parentId);
            if (!parent) return null;
            const x1 = (parent.x / 12) * 100;
            const y1 = (parent.y / 18) * 100; 
            const x2 = (node.x / 12) * 100;
            const y2 = (node.y / 18) * 100; 
            const isUnlocked = (treeState.nodeLevels[node.id] || 0) > 0 && (treeState.nodeLevels[parent.id] || 0) > 0;
            return (
              <line 
                key={`${parent.id}-${node.id}`}
                x1={`${x1}%`} y1={`${y1}%`}
                x2={`${x2}%`} y2={`${y2}%`}
                stroke={isUnlocked ? "#a855f7" : "#57534e"} 
                strokeWidth={isStatic ? "6" : "4"}
              />
            );
          });
        })}
      </svg>
      {NODES.map(node => {
         const level = treeState.nodeLevels[node.id] || 0;
         const soulId = treeState.equippedSouls[node.id];
         const soul = souls.find(s => s.id === soulId);
         const isSelected = !isStatic && selectedNodeId === node.id;
         const soulLvl = treeState.soulLevels[node.id] || 0;
         const left = `${(node.x / 12) * 100}%`;
         const top = `${(node.y / 18) * 100}%`; 

         return (
           <div key={node.id} className="absolute w-14 h-14 -ml-7 -mt-7" style={{ left, top }}>
             {/* Soul Level Dots */}
             {soulId && (
               <div className="absolute -left-4 top-0 flex flex-col gap-1">
                  {[1, 2, 3].map(lvl => (
                    <div 
                      key={lvl}
                      className={`w-3 h-3 rounded-full border border-stone-900 shadow-sm ${!isStatic ? 'cursor-pointer' : ''} ${soulLvl >= lvl ? 'bg-purple-500' : 'bg-stone-600'}`}
                      onClick={(e) => { if(!isStatic) { e.stopPropagation(); setSoulLevel(node.id, lvl as 1|2|3); } }}
                    ></div>
                  ))}
               </div>
             )}
             {/* Node Circle */}
             <div 
               onClick={() => !isStatic && setSelectedNodeId(node.id)}
               className={`w-full h-full rounded-full border-4 flex items-center justify-center relative shadow-lg bg-stone-800 z-10 
                 ${!isStatic ? 'cursor-pointer hover:scale-105 transition-all' : ''}
                 ${isSelected ? 'ring-2 ring-white scale-110' : ''}
                 ${RARITY_COLORS[node.rarity]}
               `}
             >
                {soul ? (
                  <img src={soul.imageUrl} alt={soul.name} className="w-full h-full object-cover rounded-full opacity-90" />
                ) : (
                  <NodeIcon tag={node.tag} className={TAG_COLORS[node.tag]} size={24} />
                )}
                {/* Delete Button (Interactive Only) */}
                {soul && isSelected && !isStatic && (
                   <button 
                     onClick={(e) => { e.stopPropagation(); unequipSoul(node.id); }}
                     className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 shadow-md border border-black z-20 hover:bg-red-500"
                   >
                     <X size={12} />
                   </button>
                )}
             </div>
             {/* Level Badge */}
             <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-black border border-stone-600 rounded px-1 min-w-[24px] text-center z-20 shadow-md">
                <span className={`text-xs font-bold ${level > 0 ? 'text-yellow-400' : 'text-stone-500'}`}>{level}</span>
             </div>
           </div>
         );
      })}
    </>
  );

  const renderStatsContent = () => (
     <div className="space-y-1 text-sm text-stone-300">
       {calculateTotalStats.length === 0 && <p className="text-stone-600 italic">No stats active</p>}
       {calculateTotalStats.map(stat => (
         <div key={stat.name} className="flex justify-between border-b border-stone-700 pb-1 mb-1 last:border-0">
           <span>{stat.name}</span>
           <span className="font-bold text-yellow-500">{stat.value}{stat.isPercent ? '%' : ''}</span>
         </div>
       ))}
     </div>
  );

  // --- RENDER ---
  return (
    <div className="flex flex-col h-screen bg-stone-900 text-stone-200 overflow-hidden">
      
      {/* HEADER */}
      <header className="h-16 bg-stone-950 border-b border-stone-800 flex items-center justify-between px-4 md:px-6 z-20 shadow-md shrink-0">
        <div className="flex items-center gap-4">
           <h1 className="text-xl md:text-2xl font-game text-yellow-600 tracking-wider hidden md:block">Fusion Tier</h1>
        </div>

        {/* PRESETS CENTERED */}
        <div className="flex items-center gap-2">
             <div className="flex gap-2">
                {[0, 1, 2, 3, 4].map(idx => (
                  <div key={idx} className="flex flex-col gap-0.5 items-center">
                     <button 
                       onClick={() => loadPreset(idx)}
                       className={`w-6 h-6 md:w-8 md:h-8 rounded border text-xs font-bold transition-all
                         ${presets[idx] ? 'bg-yellow-900 border-yellow-500 text-yellow-200 hover:bg-yellow-800' : 'bg-stone-800 border-stone-600 text-stone-500 hover:bg-stone-700'}
                       `}
                       title={presets[idx]?.name || "Empty"}
                     >
                       {idx + 1}
                     </button>
                     <button onClick={() => savePreset(idx)} className="text-[9px] text-stone-500 hover:text-white uppercase">Save</button>
                  </div>
                ))}
             </div>
             <div className="w-px h-8 bg-stone-700 mx-2"></div>
             <button 
               onClick={() => setTreeState({ nodeLevels: {}, equippedSouls: {}, soulLevels: {} })}
               className="flex items-center gap-1 px-3 py-1.5 bg-red-900/40 hover:bg-red-900 text-red-300 rounded border border-red-800 text-xs transition-colors"
               title="Reset Tree"
             >
               <RotateCcw size={14} /> <span className="hidden md:inline">Reset</span>
             </button>
        </div>

        {/* ACTIONS RIGHT */}
        <div className="flex gap-2 items-center">
            {/* JSON File Actions */}
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportJSON} />
            <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-stone-800 hover:bg-stone-700 rounded border border-stone-600 text-stone-400" title="Load JSON">
              <FolderOpen size={16} />
            </button>
            <button onClick={handleSaveJSON} className="p-2 bg-stone-800 hover:bg-stone-700 rounded border border-stone-600 text-stone-400" title="Save JSON">
              <FileJson size={16} />
            </button>
            <div className="w-px h-6 bg-stone-700 mx-1"></div>
            
            <button onClick={() => setIsSoulManagerOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 rounded text-xs border border-stone-600 text-stone-300">
               <Database size={14} /> <span className="hidden md:inline">Souls</span>
            </button>
            <button onClick={handleExportImage} className="flex items-center gap-2 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 rounded text-xs border border-stone-600 text-stone-300">
               <Download size={14} /> <span className="hidden md:inline">Img</span>
            </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT CANVAS (TREE) */}
        <div className="flex-1 relative overflow-auto bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-stone-900" ref={canvasRef}>
           
           {/* INFO OVERLAY */}
           <div className="absolute top-4 left-4 z-10 bg-black/70 backdrop-blur-sm p-4 rounded-lg border border-stone-700 text-sm shadow-xl min-w-[220px]">
             <div className="mb-3">
               <label className="block text-xs text-stone-400 uppercase tracking-wide mb-1">Fusion Level</label>
               <input 
                 type="number" 
                 value={userFusionLevel} 
                 onChange={(e) => {
                   const val = parseInt(e.target.value);
                   if (!isNaN(val) && val >= 0) setUserFusionLevel(val);
                 }}
                 className="w-full bg-stone-900 border border-stone-600 rounded p-2 text-yellow-500 font-bold text-lg focus:border-yellow-500 outline-none"
               />
             </div>
             <div className="flex justify-between items-center py-2 border-t border-stone-700">
               <span className="text-stone-400">Points Left:</span>
               <span className={`font-bold text-lg ${remainingPoints < 0 ? 'text-red-500' : 'text-green-400'}`}>{remainingPoints}</span>
             </div>
             <div className="flex justify-between items-center text-xs text-stone-500">
                <span>Points Used:</span>
                <span>{usedPoints}</span>
             </div>
             {selectedNodeId && (
               <div className="mt-2 pt-2 border-t border-stone-700">
                  <span className="text-xs text-stone-500 uppercase">Current Node Cost</span>
                  <div className="font-bold text-white mt-1">{getCostPerLevel(getNode(selectedNodeId)!.rarity)} pts / lvl</div>
               </div>
             )}
           </div>

           {/* TREE VISUALIZATION */}
           <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-[800px] h-[1200px] scale-75 md:scale-100 origin-top transition-transform">
              {renderTreeContent(false)}
           </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="w-80 md:w-96 bg-stone-950 border-l border-stone-800 flex flex-col shadow-2xl z-20 shrink-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* TOTAL STATS BOX */}
            <div className="border border-stone-600 bg-stone-900/50 p-4 rounded-lg">
               <h3 className="text-yellow-500 font-game mb-3 flex items-center gap-2">
                 <ShieldCheck size={18} /> Total Stats
               </h3>
               {renderStatsContent()}
            </div>

            {/* NODE INSPECTOR (Existing logic remains) */}
            {selectedNodeId ? (
              (() => {
                const node = getNode(selectedNodeId)!;
                const level = treeState.nodeLevels[node.id] || 0;
                const equippedSoulId = treeState.equippedSouls[node.id];
                const equippedSoul = souls.find(s => s.id === equippedSoulId);
                const soulLvl = treeState.soulLevels[node.id] || 1;

                let activeStats: {name: string, val: number, total: number}[] = [];
                if (equippedSoul && level > 0) {
                   const stats = soulLvl === 1 ? equippedSoul.statsLvl1 : soulLvl === 2 ? equippedSoul.statsLvl2 : equippedSoul.statsLvl3;
                   activeStats = stats.map(s => ({
                     name: s.name,
                     val: s.value,
                     total: calculateNodeBonus(s.value, level, node.rarity)
                   }));
                }

                const availableSouls = souls.filter(s => {
                   const isEquippedElsewhere = Object.entries(treeState.equippedSouls).some(([nid, sid]) => sid === s.id && parseInt(nid) !== node.id);
                   if (isEquippedElsewhere) return false;
                   return canEquipSoul(node, s);
                }).sort((a, b) => a.name.localeCompare(b.name));

                return (
                  <div className="space-y-4 animate-fade-in">
                     <div className="bg-stone-900 border border-stone-700 p-4 rounded-lg relative">
                        <div className="absolute top-2 right-2 text-[10px] text-red-900">ID: {node.id}</div>
                        <h3 className={`font-game text-lg ${node.rarity === Rarity.LEGENDARY ? 'text-yellow-500' : node.rarity === Rarity.RARE ? 'text-cyan-400' : 'text-white'}`}>
                          {node.rarity} Node
                        </h3>
                        <div className="flex items-center gap-2 text-stone-400 text-sm mb-4">
                          <NodeIcon tag={node.tag} size={14} /> {node.tag}
                        </div>

                        {/* Level Controls */}
                        <div className="flex items-center justify-between bg-black/40 p-2 rounded mb-4">
                           <button onClick={() => handleLevelChange(node.id, -1)} className="w-8 h-8 bg-yellow-700 hover:bg-yellow-600 rounded text-white font-bold flex items-center justify-center">-</button>
                           <input 
                              type="number" 
                              value={level} 
                              onChange={(e) => handleLevelDirectInput(node.id, e.target.value)}
                              className="w-12 bg-transparent text-center font-bold text-xl outline-none"
                            />
                           <button onClick={() => handleLevelChange(node.id, 1)} className="w-8 h-8 bg-green-700 hover:bg-green-600 rounded text-white font-bold flex items-center justify-center">+</button>
                        </div>

                        {/* Active Soul Info */}
                        {equippedSoul ? (
                          <div className="bg-stone-800 p-3 rounded border border-stone-600">
                             <div className="flex gap-3 mb-2">
                               <img src={equippedSoul.imageUrl} className="w-12 h-12 rounded object-cover border border-stone-500" />
                               <div>
                                 <div className="font-bold text-white">{equippedSoul.name}</div>
                                 <div className="text-xs text-yellow-400 font-bold">Level {soulLvl} Active</div>
                               </div>
                             </div>
                             
                             <div className="space-y-1 text-xs mb-3 border-b border-stone-600 pb-2">
                               {activeStats.map((s, idx) => (
                                 <div key={idx} className="flex justify-between">
                                    <span className="text-stone-300">{s.name} <span className="text-stone-500">(Base {s.val})</span></span>
                                    <span className="text-green-400 font-bold text-sm">+{s.total}</span>
                                 </div>
                               ))}
                             </div>
                             
                             <div className="text-xs space-y-1">
                                <div className="font-bold text-yellow-500 mb-1">Base Status</div>
                                {[1, 2, 3].map(lvl => {
                                   const stats = lvl === 1 ? equippedSoul.statsLvl1 : lvl === 2 ? equippedSoul.statsLvl2 : equippedSoul.statsLvl3;
                                   return (
                                     <div key={lvl} className="flex items-start gap-2">
                                        <span className="text-yellow-600 font-bold min-w-[28px]">Lv {lvl}:</span>
                                        <div className="flex flex-col">
                                           {stats.map((stat, i) => (
                                             <span key={i} className="text-stone-400">
                                               {stat.name} <span className="text-yellow-100">{stat.value}{stat.isPercent ? '%' : ''}</span>
                                             </span>
                                           ))}
                                        </div>
                                     </div>
                                   );
                                })}
                             </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 border-2 border-dashed border-stone-700 rounded text-stone-500 text-sm">
                            No Soul Equipped
                          </div>
                        )}
                     </div>

                     {/* Available Souls */}
                     <div className="space-y-2">
                        <h4 className="text-sm font-bold text-stone-400 uppercase tracking-wider">Available Souls</h4>
                        {availableSouls.length === 0 && <p className="text-xs text-stone-600">No compatible souls found.</p>}
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scroll">
                           {availableSouls.map(soul => (
                             <div key={soul.id} className="flex items-center justify-between bg-stone-900 p-2 rounded border border-stone-800 hover:border-stone-500 group transition-colors">
                                <div className="flex items-center gap-2">
                                  <img src={soul.imageUrl} className="w-8 h-8 rounded object-cover opacity-70 group-hover:opacity-100" />
                                  <div className="flex flex-col">
                                    <span className={`text-xs font-bold ${soul.rarity === Rarity.LEGENDARY ? 'text-yellow-500' : soul.rarity === Rarity.RARE ? 'text-cyan-400' : 'text-stone-300'}`}>
                                      {soul.name}
                                    </span>
                                    <span className="text-[10px] text-stone-500 flex gap-1">
                                      {soul.tags.map(t => <span key={t}>{t}</span>)}
                                    </span>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => equipSoul(node.id, soul.id)}
                                  className="text-xs bg-stone-700 hover:bg-green-700 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  Equip
                                </button>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-center mt-20 text-stone-500">
                <div className="mb-4 flex justify-center"><Zap size={48} className="opacity-20" /></div>
                <p>Select a Node on the tree<br/>to view details and equip souls.</p>
              </div>
            )}
          </div>
        </aside>

      </main>

      {/* HIDDEN EXPORT CONTAINER (Static Full Render) */}
      <div 
        ref={exportRef} 
        style={{ 
          display: 'none', 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '1400px', 
          height: '1400px', 
          zIndex: -100, 
          background: '#1c1917',
          flexDirection: 'row'
        }}
      >
          {/* Static Tree */}
          <div style={{ position: 'relative', width: '900px', height: '1400px', background: 'url(https://www.transparenttextures.com/patterns/dark-matter.png) #1c1917' }}>
            {/* Hardcode scale for export to ensure fit */}
            <div style={{ position: 'absolute', top: '50px', left: '50%', transform: 'translateX(-50%) scale(1)', width: '800px', height: '1200px' }}>
              {renderTreeContent(true)}
            </div>
          </div>
          
          {/* Static Stats */}
          <div style={{ width: '500px', padding: '40px', background: '#0c0a09', borderLeft: '2px solid #444' }}>
              <h1 className="text-4xl font-game text-yellow-600 mb-8 border-b border-yellow-800 pb-4">Fusion Tier Build</h1>
              
              <div className="mb-8">
                <h2 className="text-2xl text-stone-400 mb-2">Build Details</h2>
                <div className="text-xl text-stone-200">Fusion Level: <span className="text-yellow-500 font-bold">{userFusionLevel}</span></div>
                <div className="text-xl text-stone-200">Points Used: <span className="text-green-500 font-bold">{usedPoints}</span></div>
              </div>

              <h3 className="text-3xl text-yellow-500 font-game mb-6 flex items-center gap-3">
                 <ShieldCheck size={32} /> Total Stats
              </h3>
              <div className="text-xl space-y-3">
                 {renderStatsContent()}
              </div>

              <div className="mt-10 pt-10 border-t border-stone-800 text-stone-600 text-center">
                 Generated by Fusion Tier Simulator
              </div>
          </div>
      </div>

      {/* Soul Manager Modal */}
      <SoulManager 
        isOpen={isSoulManagerOpen} 
        onClose={() => setIsSoulManagerOpen(false)}
        souls={souls}
        onSave={handleSaveSoul}
        onDelete={handleDeleteSoul}
      />
    </div>
  );
}