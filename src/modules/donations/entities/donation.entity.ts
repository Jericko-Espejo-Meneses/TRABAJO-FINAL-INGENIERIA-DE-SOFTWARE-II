export class Foundation {
  id: string;
  name: string;
  cause: string;
  description: string;
  logoUrl: string;
  totalRaised: number;
}

export class Donation {
  id: string;
  orderId: string;
  userId: string;
  foundationId: string;
  foundationName: string;
  orderTotal: number;
  percentage: number; // Ej: 3%
  donationAmount: number;
  mealsEquivalent: number; // Platos nutritivos generados (1 plato cada $2.50)
  createdAt: Date;
}
