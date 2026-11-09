export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v ?? '');

export function validateLogin({ email, password }) {
  const e = {};
  if (!isEmail(email)) e.email = 'Ingresa un correo válido';
  if (!password) e.password = 'Ingresa tu contraseña';
  return e;
}

export function validateRegister({ name, email, password, confirm }) {
  const e = {};
  if (!name?.trim()) e.name = 'Ingresa tu nombre completo';
  if (!isEmail(email)) e.email = 'Correo no válido';
  if ((password ?? '').length < 8) e.password = 'Mínimo 8 caracteres';
  if (confirm !== password) e.confirm = 'Las contraseñas no coinciden';
  return e;
}

export const BIO_MAX = 250;

export function validateProfile({ name, bio }) {
  const e = {};
  if (!name?.trim()) e.name = 'El nombre no puede estar vacío';
  if ((bio ?? '').length > BIO_MAX) e.bio = `Máximo ${BIO_MAX} caracteres`;
  return e;
}
