const KEY = 'he-cart';
const EMPTY = Object.freeze({ restaurant: null, items: [], itemCount: 0, subtotal: 0 });

// PATRÓN OBSERVER: el carrito es el "sujeto"; los componentes se suscriben y se
// re-renderizan solo cuando cambia (useSyncExternalStore). Equivale al Carrito del
// diagrama de clases: agregarProducto / eliminarProducto / calcularTotal.
export class CartStore {
  #listeners = new Set();

  constructor(storage = null) {
    this.storage = storage;
    this.state = this.#load();
  }

  subscribe = (listener) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  getSnapshot = () => this.state;

  add(dish, restaurant) {
    const { restaurant: current, items } = this.state;
    if (current && current.id !== restaurant.id) return { ok: false, reason: 'DIFFERENT_RESTAURANT' };
    const line = items.find((i) => i.dish.id === dish.id);
    const next = line
      ? items.map((i) => (i === line ? { ...i, quantity: i.quantity + 1 } : i))
      : [...items, { dish: { id: dish.id, name: dish.name, price: dish.price, calories: dish.calories, emoji: dish.emoji }, quantity: 1 }];
    this.#commit({ id: restaurant.id, name: restaurant.name }, next);
    return { ok: true };
  }

  setQuantity(dishId, quantity) {
    const items = this.state.items
      .map((i) => (i.dish.id === dishId ? { ...i, quantity } : i))
      .filter((i) => i.quantity > 0);
    this.#commit(this.state.restaurant, items);
  }

  remove(dishId) { this.setQuantity(dishId, 0); }
  clear() { this.#commit(null, []); }

  #derive(restaurant, items) {
    if (items.length === 0) return EMPTY;
    const subtotal = items.reduce((sum, i) => sum + i.dish.price * i.quantity, 0);
    return {
      restaurant,
      items,
      itemCount: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: Math.round(subtotal * 100) / 100,
    };
  }

  #commit(restaurant, items) {
    this.state = this.#derive(restaurant, items);
    this.storage?.setItem(KEY, JSON.stringify({ restaurant: this.state.restaurant, items: this.state.items }));
    this.#listeners.forEach((l) => l());
  }

  #load() {
    try {
      const saved = JSON.parse(this.storage?.getItem(KEY));
      return saved ? this.#derive(saved.restaurant, saved.items) : EMPTY;
    } catch {
      return EMPTY;
    }
  }
}
