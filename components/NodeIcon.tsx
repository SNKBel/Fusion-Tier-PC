import React from 'react';
import { Tag } from '../types';
import { Shield, Sword, Castle, Swords, Plus } from 'lucide-react';

interface Props {
  tag: Tag;
  className?: string;
  size?: number;
}

export const NodeIcon: React.FC<Props> = ({ tag, className = "", size = 20 }) => {
  switch (tag) {
    case Tag.DEFENSE:
      return <Shield className={className} size={size} />;
    case Tag.ATTACK:
      return <Sword className={className} size={size} />;
    case Tag.UTILITY:
      return <Castle className={className} size={size} />;
    case Tag.PVP:
      return <Swords className={className} size={size} />;
    case Tag.WILDCARD:
      return <Plus className={className} size={size} />;
    default:
      return <div className={className} />;
  }
};