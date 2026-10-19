// Contratos (abstracciones). Los componentes dependen de ESTO, no de fetch ni del mock
// (Dependency Inversion). Cada contrato es pequeño y cohesivo (Interface Segregation).
// Mock y Http los implementan y son intercambiables (Liskov).
const notImplemented = (name) => { throw new Error(`${name}() no implementado`); };

export class AuthService {
  login(/* { email, password } */) { return notImplemented('login'); }               // -> { token, user }
  register(/* { name, email, password, address } */) { return notImplemented('register'); } // -> { token, user }
  getCurrentUser() { return notImplemented('getCurrentUser'); }                      // -> user
}

export class RestaurantService {
  search(/* criteria, coords */) { return notImplemented('search'); }                // -> Restaurant[]
  getById(/* id, coords */) { return notImplemented('getById'); }                    // -> { restaurant, menu }
}

export class ProfileService {
  update(/* { name, address, bio } */) { return notImplemented('update'); }          // -> user
}
