import { useCart } from '../cart/CartContext';

// Regla de negocio: un pedido pertenece a un solo restaurante.
export function useAddToCart() {
  const cart = useCart();
  return (dish, restaurant) => {
    const result = cart.add(dish, restaurant);
    if (!result.ok && window.confirm('Tu carrito tiene platos de otro restaurante. ¿Vaciarlo y agregar este plato?')) {
      cart.clear();
      cart.add(dish, restaurant);
    }
  };
}
