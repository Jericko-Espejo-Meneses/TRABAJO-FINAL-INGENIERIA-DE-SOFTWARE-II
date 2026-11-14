import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import DishCard from './components/restaurants/DishCard';
import { toDish } from './domain/mappers';

describe('Disponibilidad del plato en el catálogo', () => {
  it.each([[false, 5, true], [true, 0, true], [true, 3, false]])(
    'disponibilidad %s y stock %i', (isAvailable, stock, disabled) => {
      const dish = toDish({ id: 'dish', name: 'Bowl', stock, isAvailable, price: 12 });
      const html = renderToStaticMarkup(<DishCard dish={dish} onAdd={() => {}} />);
      expect(/<button[^>]*disabled/.test(html)).toBe(disabled);
      expect(html).toContain(disabled ? 'No disponible' : 'Agregar al carrito');
    });
});
