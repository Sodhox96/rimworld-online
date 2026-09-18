import { ItemType } from '../types';

// Caravan trade mechanics
export interface TradeContract {
  id: string;
  traderId: string;
  contractType: 'supply' | 'demand';
  requiredItem: ItemType;
  requiredAmount: number;
  paymentItem: ItemType;
  paymentAmount: number;
  frequency: 'weekly' | 'monthly' | 'one_time';
  isActive: boolean;
  createdAt: Date;
}

// Caravan event types
export type CaravanEventType = 
  | 'ambush'
  | 'escort'
  | 'raid'
  | 'delivery';

// Caravan system data
export interface CaravanRoute {
  id: string;
  origin: string; // Player ID or base name
  destination: string;
  routePath: { x: number; y: number }[];
  cargo: { item: ItemType; amount: number }[];
  estimatedTravelTime: number; // in minutes
  riskLevel: number; // 0-100
  status: 'pending' | 'in_transit' | 'delivered' | 'failed';
  eventType?: CaravanEventType;
}

// Market system for contracts
export interface MarketplaceListing {
  id: string;
  item: ItemType;
  quantity: number;
  price: number;
  sellerId: string;
  listingType: 'buy' | 'sell';
  createdAt: Date;
}

// Contract-based trade orders
export const CONTRACT_SYSTEM = {
  defaultWeeklyPayment: 100,
  defaultCargoCapacity: 500,
  riskMultiplier: {
    high: 1.5,
    medium: 1.0,
    low: 0.7
  }
};