export class Restaurant {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  rating: number;
  reviewsCount: number;
  deliveryTimeMinutes: number;
  deliveryFee: number;
  priceLevel: '$' | '$$' | '$$$';
  category: string;
  dietaryTags: string[];
  address: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number | null;
  phone: string;
  isHealthyCertified: boolean;
  isOpen: boolean;
  createdAt: Date;
}
