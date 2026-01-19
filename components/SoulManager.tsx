import React, { useState, useEffect } from 'react';
import { Soul, Tag, Rarity, Stat } from '../types';
import { X, Plus, Trash2, Upload, Search, Edit, ArrowLeft } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  souls: Soul[];
  onSave: (soul: Soul) => void;
  onDelete: (soulId: string) => void;
}

// Predefined list of stats for the dropdown
const AVAILABLE_STATS = [
  "Absorb",
  "Add HP",
  "Add MP",
  "Add STM",
  "Aging Break",
  "Aging Success",
  "Attack Power",
  "Attack Rating",
  "Block",
  "Critical",
  "Defense",
  "Evade",
  "Experience",
  "Own Item Type",
  "Own Spec",
  "PvP Absorb",
  "PvP Attack Power",
  "PvP Attack Rating",
  "PvP Block",
  "PvP Critical",
  "PvP Defense",
  "PvP Evade",
  "Run Speed"
].sort();

const DEFAULT_STAT: Stat = { name: AVAILABLE_STATS[0], value: 0, isPercent: false };

export const SoulManager: React.FC<Props> = ({ isOpen, onClose, onSave, onDelete, souls }) => {
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // -- Editor State --
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [rarity, setRarity] = useState<Rarity>(Rarity.COMMON);
  const [tags, setTags] = useState<Tag[]>([Tag.ATTACK]);
  const [imageUrl, setImageUrl] = useState('');
  const [statsLvl1, setStatsLvl1] = useState<Stat[]>([{ ...DEFAULT_STAT }]);
  const [statsLvl2, setStatsLvl2] = useState<Stat[]>([{ ...DEFAULT_STAT }]);
  const [statsLvl3, setStatsLvl3] = useState<Stat[]>([{ ...DEFAULT_STAT }]);

  // Reset to list view when opening
  useEffect(() => {
    if (isOpen) {
      setView('list');
      setSearchTerm('');
    }
  }, [isOpen]);

  const startEdit = (soul?: Soul) => {
    if (soul) {
      setEditingId(soul.id);
      setName(soul.name);
      setRarity(soul.rarity);
      setTags(soul.tags);
      setImageUrl(soul.imageUrl);
      setStatsLvl1(soul.statsLvl1);
      setStatsLvl2(soul.statsLvl2);
      setStatsLvl3(soul.statsLvl3);
    } else {
      // Create New
      setEditingId(null);
      setName('');
      setRarity(Rarity.COMMON);
      setTags([Tag.ATTACK]);
      setImageUrl('');
      setStatsLvl1([{ ...DEFAULT_STAT }]);
      setStatsLvl2([{ ...DEFAULT_STAT }]);
      setStatsLvl3([{ ...DEFAULT_STAT }]);
    }
    setView('edit');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateStat = (level: 1 | 2 | 3, index: number, field: keyof Stat, value: any) => {
    const setter = level === 1 ? setStatsLvl1 : level === 2 ? setStatsLvl2 : setStatsLvl3;
    const current = level === 1 ? statsLvl1 : level === 2 ? statsLvl2 : statsLvl3;
    const newStats = [...current];
    newStats[index] = { ...newStats[index], [field]: value };
    setter(newStats);
  };

  const addStatRow = (level: 1 | 2 | 3) => {
    const setter = level === 1 ? setStatsLvl1 : level === 2 ? setStatsLvl2 : setStatsLvl3;
    const current = level === 1 ? statsLvl1 : level === 2 ? statsLvl2 : statsLvl3;
    setter([...current, { ...DEFAULT_STAT }]);
  };

  const removeStatRow = (level: 1 | 2 | 3, index: number) => {
    const setter = level === 1 ? setStatsLvl1 : level === 2 ? setStatsLvl2 : setStatsLvl3;
    const current = level === 1 ? statsLvl1 : level === 2 ? statsLvl2 : statsLvl3;
    if (current.length > 1) {
      setter(current.filter((_, i) => i !== index));
    }
  };

  const handleSave = () => {
    if (!name.trim()) return alert("Name is required");
    const newSoul: Soul = {
      id: editingId || crypto.randomUUID(),
      name,
      rarity,
      tags,
      imageUrl: imageUrl || 'https://picsum.photos/100/100', 
      statsLvl1,
      statsLvl2,
      statsLvl3
    };
    onSave(newSoul);
    setView('list'); // Return to list after save
  };
  
  const handleDelete = (id: string) => {
     if (window.confirm("Are you sure you want to delete this Soul? It will be removed from all nodes.")) {
         onDelete(id);
     }
  };

  const toggleTag = (t: Tag) => {
    if (tags.includes(t)) {
      if (tags.length > 1) setTags(tags.filter(x => x !== t));
    } else {
      setTags([...tags, t]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border-2 border-stone-600 rounded-lg w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-stone-700 flex justify-between items-center bg-stone-900 shrink-0">
             <div className="flex items-center gap-3">
               {view === 'edit' && (
                 <button onClick={() => setView('list')} className="text-stone-400 hover:text-white transition-colors">
                   <ArrowLeft size={20} />
                 </button>
               )}
               <h2 className="text-xl font-game text-yellow-500">
                 {view === 'list' ? 'Soul Management' : (editingId ? 'Edit Soul' : 'Create New Soul')}
               </h2>
             </div>
             <button onClick={onClose} className="text-stone-400 hover:text-white">
               <X size={24} />
             </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
            
            {/* VIEW: LIST */}
            {view === 'list' && (
              <div className="flex-1 flex flex-col p-4 overflow-hidden">
                  <div className="flex gap-4 mb-4 shrink-0">
                      <div className="relative flex-1">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                         <input 
                           value={searchTerm}
                           onChange={e => setSearchTerm(e.target.value)}
                           placeholder="Search souls..."
                           className="w-full bg-stone-900 border border-stone-700 rounded pl-10 pr-4 py-2 text-white focus:border-yellow-600 outline-none placeholder:text-stone-600"
                         />
                      </div>
                      <button onClick={() => startEdit()} className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 font-bold transition-colors">
                         <Plus size={18} /> Create Soul
                      </button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto pr-2 custom-scroll space-y-2">
                       {souls.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(soul => (
                           <div key={soul.id} className="flex items-center justify-between bg-stone-900 p-3 rounded border border-stone-700 hover:border-stone-500 transition-colors group">
                               <div className="flex items-center gap-3">
                                   <img src={soul.imageUrl} alt={soul.name} className="w-12 h-12 rounded object-cover border border-stone-600" />
                                   <div>
                                       <div className={`font-bold ${soul.rarity === Rarity.LEGENDARY ? 'text-yellow-500' : soul.rarity === Rarity.RARE ? 'text-cyan-400' : 'text-white'}`}>{soul.name}</div>
                                       <div className="text-xs text-stone-500 flex gap-2 items-center mt-1">
                                           <span className="bg-stone-800 px-1.5 rounded">{soul.rarity}</span>
                                           <span className="text-stone-600">•</span>
                                           <div className="flex gap-1">
                                               {soul.tags.map(t => <span key={t} className="text-stone-400 italic">{t}</span>)}
                                           </div>
                                       </div>
                                   </div>
                               </div>
                               <div className="flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                   <button 
                                      onClick={() => startEdit(soul)} 
                                      className="p-2 bg-stone-800 hover:bg-blue-900/50 hover:text-blue-400 text-stone-400 rounded border border-stone-600 transition-colors"
                                      title="Edit"
                                   >
                                       <Edit size={16} />
                                   </button>
                                   <button 
                                      onClick={() => handleDelete(soul.id)} 
                                      className="p-2 bg-stone-800 hover:bg-red-900/50 hover:text-red-400 text-stone-400 rounded border border-stone-600 transition-colors"
                                      title="Delete"
                                   >
                                       <Trash2 size={16} />
                                   </button>
                               </div>
                           </div>
                       ))}
                       {souls.length === 0 && <div className="text-center text-stone-500 py-10">No souls found. Create one to get started!</div>}
                   </div>
              </div>
            )}

            {/* VIEW: EDITOR */}
            {view === 'edit' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* Left Column: Metadata */}
                      <div className="lg:col-span-4 space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-stone-400 mb-1">Soul Name</label>
                          <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="w-full bg-stone-900 border border-stone-600 rounded p-2 text-white focus:border-yellow-500 outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-stone-400 mb-1">Rarity</label>
                            <select 
                              value={rarity} 
                              onChange={e => setRarity(e.target.value as Rarity)}
                              className="w-full bg-stone-900 border border-stone-600 rounded p-2 text-white focus:border-yellow-500 outline-none"
                            >
                              {Object.values(Rarity).map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                          
                          <div>
                             <label className="block text-sm font-medium text-stone-400 mb-1">Image</label>
                             <div className="flex items-center gap-2">
                               {imageUrl && <img src={imageUrl} alt="Preview" className="w-10 h-10 object-cover rounded border border-stone-600" />}
                               <label className="cursor-pointer bg-stone-700 hover:bg-stone-600 px-3 py-2 rounded text-xs flex items-center gap-1 text-white transition-colors flex-1 justify-center">
                                 <Upload size={14} /> Upload
                                 <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                               </label>
                             </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-stone-400 mb-2">Tags (Multi-select)</label>
                          <div className="flex flex-wrap gap-2">
                            {Object.values(Tag).map(t => (
                              <button 
                                key={t}
                                onClick={() => toggleTag(t)}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${tags.includes(t) ? 'bg-yellow-600 border-yellow-500 text-white' : 'bg-stone-900 border-stone-700 text-stone-500 hover:border-stone-500'}`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Stats */}
                      <div className="lg:col-span-8 space-y-4">
                        <label className="block text-sm font-medium text-stone-400">Stats Configuration</label>
                        <div className="grid gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scroll">
                           {[1, 2, 3].map((lvl) => (
                              <div key={lvl} className="bg-stone-900/50 p-4 rounded border border-stone-700">
                                <div className="flex justify-between items-center mb-3 border-b border-stone-700 pb-2">
                                  <h4 className="text-sm font-bold text-stone-300">Level {lvl} Stats</h4>
                                  <button onClick={() => addStatRow(lvl as 1|2|3)} className="text-green-500 hover:text-green-400 flex items-center gap-1 text-xs uppercase font-bold">
                                    <Plus size={14} /> Add Stat
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {(lvl === 1 ? statsLvl1 : lvl === 2 ? statsLvl2 : statsLvl3).map((stat, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                      <div className="flex-1">
                                          <select 
                                            value={stat.name}
                                            onChange={e => updateStat(lvl as 1|2|3, idx, 'name', e.target.value)}
                                            className="w-full bg-stone-800 border border-stone-600 rounded px-2 py-1.5 text-xs text-white focus:border-stone-400 outline-none"
                                          >
                                            <option value="" disabled>Select Stat</option>
                                            {AVAILABLE_STATS.map(s => <option key={s} value={s}>{s}</option>)}
                                          </select>
                                      </div>
                                      <div className="w-24 relative">
                                          <input 
                                            type="number" 
                                            placeholder="Val" 
                                            value={stat.value}
                                            onChange={e => updateStat(lvl as 1|2|3, idx, 'value', parseFloat(e.target.value))}
                                            className="w-full bg-stone-800 border border-stone-600 rounded px-2 py-1.5 text-xs text-white focus:border-stone-400 outline-none"
                                          />
                                      </div>
                                      <label className="flex items-center gap-1 cursor-pointer" title="Is Percentage?">
                                         <input 
                                            type="checkbox" 
                                            checked={stat.isPercent}
                                            onChange={e => updateStat(lvl as 1|2|3, idx, 'isPercent', e.target.checked)}
                                            className="rounded bg-stone-800 border-stone-600"
                                         />
                                         <span className="text-xs text-stone-500">%</span>
                                      </label>
                                      <button 
                                        onClick={() => removeStatRow(lvl as 1|2|3, idx)}
                                        className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-red-900/20"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>

                    </div>
                </div>

                {/* Editor Footer */}
                <div className="p-4 border-t border-stone-700 bg-stone-900 flex justify-end gap-3 shrink-0">
                   <button onClick={() => setView('list')} className="px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded text-stone-300 border border-stone-600 transition-colors">Cancel</button>
                   <button onClick={handleSave} className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 rounded text-black font-bold shadow-lg shadow-yellow-900/20 transition-colors">Save Soul</button>
                </div>
              </div>
            )}
        </div>

      </div>
    </div>
  );
};