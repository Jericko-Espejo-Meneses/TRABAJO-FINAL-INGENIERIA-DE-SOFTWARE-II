import { config } from './config';
import { HttpClient } from './http/HttpClient';
import { AuthHttpClient } from './http/AuthHttpClient';
import { TokenStorage } from './storage/TokenStorage';
import { CheckoutFacade } from '../checkout/CheckoutFacade';
import { HttpAuthService } from '../services/http/HttpAuthService';
import { HttpRestaurantService } from '../services/http/HttpRestaurantService';
import { HttpRecommendationService } from '../services/http/HttpRecommendationService';
import { HttpOrderService } from '../services/http/HttpOrderService';
import { HttpDonationService } from '../services/http/HttpDonationService';
import { MockAuthService } from '../services/mock/MockAuthService';
import { MockRestaurantService } from '../services/mock/MockRestaurantService';
import { MockRecommendationService } from '../services/mock/MockRecommendationService';
import { MockOrderService } from '../services/mock/MockOrderService';
import { MockDonationService } from '../services/mock/MockDonationService';

// PATRÓN FACTORY: único lugar donde se decide qué implementación se usa.
// Cambiar VITE_USE_MOCK=false conecta toda la app al backend sin tocar componentes.
export function createServices(cfg = config) {
  const tokenStorage = new TokenStorage();
  let services;

  if (cfg.useMock) {
    const orders = new MockOrderService(tokenStorage);
    services = {
      auth: new MockAuthService(tokenStorage),
      restaurants: new MockRestaurantService(),
      recommendations: new MockRecommendationService(tokenStorage),
      orders,
      donations: new MockDonationService(tokenStorage),
    };
  } else {
    const http = new AuthHttpClient(
      new HttpClient(cfg.apiUrl),
      tokenStorage,
      () => window.dispatchEvent(new Event('he:unauthorized')),
    );
    services = {
      auth: new HttpAuthService(http),
      restaurants: new HttpRestaurantService(http),
      recommendations: new HttpRecommendationService(http),
      orders: new HttpOrderService(http),
      donations: new HttpDonationService(http),
    };
  }

  services.checkout = new CheckoutFacade({ orders: services.orders, donationPercentage: cfg.donationPercentage });
  services.tokenStorage = tokenStorage;
  return services;
}

// PATRÓN SINGLETON: una sola instancia de servicios para toda la aplicación.
let instance;
export const getServices = () => (instance ??= createServices());
