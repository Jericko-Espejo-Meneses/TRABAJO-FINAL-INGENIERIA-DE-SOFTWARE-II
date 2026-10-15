import { createContext, useContext, useSyncExternalStore } from 'react';

const CartContext = createContext(null);

export function CartProvider({ store, children }) {
  return <CartContext.Provider value={store}>{children}</CartContext.Provider>;
}

export function useCart() {
  const store = useContext(CartContext);
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return {
    ...state,
    add: (dish, restaurant) => store.add(dish, restaurant),
    setQuantity: (id, q) => store.setQuantity(id, q),
    remove: (id) => store.remove(id),
    clear: () => store.clear(),
  };
}
