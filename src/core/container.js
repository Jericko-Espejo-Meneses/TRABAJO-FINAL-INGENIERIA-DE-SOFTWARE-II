import { config } from './config';
import { HttpClient } from './http/HttpClient';
import { AuthHttpClient } from './http/AuthHttpClient';
import { TokenStorage } from './storage/TokenStorage';
import { HttpAuthService } from '../services/http/HttpAuthService';
import { HttpRestaurantService } from '../services/http/HttpRestaurantService';
import { HttpProfileService } from '../services/http/HttpProfileService';
import { MockAuthService } from '../services/mock/MockAuthService';
import { MockRestaurantService } from '../services/mock/MockRestaurantService';
import { MockProfileService } from '../services/mock/MockProfileService';

// PATRÓN FACTORY: único lugar donde se decide qué implementación se usa.
// Cambiar VITE_USE_MOCK=false conecta toda la app al backend sin tocar componentes.
export function createServices(cfg = config) {
  const tokenStorage = new TokenStorage();
  let services;

  if (cfg.useMock) {
    services = {
      auth: new MockAuthService(tokenStorage),
      restaurants: new MockRestaurantService(),
      profile: new MockProfileService(tokenStorage),
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
      profile: new HttpProfileService(http),
    };
  }

  services.tokenStorage = tokenStorage;
  return services;
}

// PATRÓN SINGLETON: una sola instancia de servicios para toda la aplicación.
let instance;
export const getServices = () => (instance ??= createServices());
