import { CartItem } from '../../cart/entities/cart-item.entity';
import { Donation } from '../../donations/entities/donation.entity';
import { NutritionalInfo } from '../../menus/entities/menu-item.entity';

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  ON_THE_WAY = 'ON_THE_WAY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface DeliveryAddress {
  street: string;
  city: string;
  reference?: string;
  notes?: string;
}

export interface OrderTrackingStep {
  status: OrderStatus;
  label: string;
  timestamp: Date;
  completed: boolean;
  description: string;
}

export interface OrderTracking {
  currentStatus: OrderStatus;
  progressPercentage: number;
  estimatedDeliveryTimeMinutes: number;
  driverName?: string;
  driverPhone?: string;
  vehiclePlate?: string;
  currentCoordinates?: { lat: number; lng: number };
  timeline: OrderTrackingStep[];
}

export class Order {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  totalNutrition: NutritionalInfo;
  deliveryAddress: DeliveryAddress;
  contactPhone: string;
  status: OrderStatus;
  paymentId?: string;
  donationId?: string;
  donation?: Donation;
  tracking: OrderTracking;
  createdAt: Date;
  updatedAt: Date;
}
