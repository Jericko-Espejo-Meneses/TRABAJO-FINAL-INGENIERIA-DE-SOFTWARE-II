import { createContext, useContext } from 'react';

// Inyección de dependencias: los componentes piden servicios por contexto,
// nunca los instancian (Dependency Inversion).
const ServicesContext = createContext(null);

export const ServicesProvider = ({ services, children }) => (
  <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
);

export const useServices = () => useContext(ServicesContext);
