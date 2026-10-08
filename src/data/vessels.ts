import type { Vessel, VesselId } from './types';

export const vessels: Record<VesselId, Vessel> = {
  'espresso-cup': {
    id: 'espresso-cup',
    name: 'filiżanka do espresso',
    capacityMl: 90,
    transparent: false,
  },
  cup: { id: 'cup', name: 'filiżanka', capacityMl: 250, transparent: false },
  'small-glass': { id: 'small-glass', name: 'mała szklanka', capacityMl: 120, transparent: true },
  'low-glass': { id: 'low-glass', name: 'niska szklanka', capacityMl: 300, transparent: true },
  'tall-glass': { id: 'tall-glass', name: 'wysoka szklanka', capacityMl: 400, transparent: true },
  'dessert-glass': { id: 'dessert-glass', name: 'pucharek', capacityMl: 200, transparent: true },
};
