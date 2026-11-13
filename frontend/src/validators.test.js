import { describe, expect, it } from 'vitest';
import { BIO_MAX, isEmail, validateLogin, validateProfile, validateRegister } from './utils/validators';
import { formatMoney } from './utils/format';

describe('Validaciones de formularios', () => {
  it('acepta correos válidos y rechaza los incompletos', () => {
    expect(isEmail('demo@healthyexpress.com')).toBe(true);
    expect(isEmail('demo@healthyexpress')).toBe(false);
    expect(isEmail(undefined)).toBe(false);
  });

  it('el login exige correo válido y contraseña', () => {
    expect(validateLogin({ email: 'demo@healthyexpress.com', password: 'Demo1234' })).toEqual({});
    expect(validateLogin({ email: 'x', password: '' })).toEqual({
      email: 'Ingresa un correo válido',
      password: 'Ingresa tu contraseña',
    });
  });

  it('el registro exige 8 caracteres y que las contraseñas coincidan', () => {
    const base = { name: 'Rodrigo', email: 'demo@healthyexpress.com', password: 'Demo1234', confirm: 'Demo1234' };
    expect(validateRegister(base)).toEqual({});
    expect(validateRegister({ ...base, password: 'corta', confirm: 'corta' }).password).toBe('Mínimo 8 caracteres');
    expect(validateRegister({ ...base, confirm: 'otra' }).confirm).toBe('Las contraseñas no coinciden');
  });

  it('el perfil limita la biografía a BIO_MAX caracteres', () => {
    expect(validateProfile({ name: 'Rodrigo', bio: 'a'.repeat(BIO_MAX) })).toEqual({});
    expect(validateProfile({ name: 'Rodrigo', bio: 'a'.repeat(BIO_MAX + 1) }).bio).toBeDefined();
    expect(validateProfile({ name: '  ', bio: '' }).name).toBe('El nombre no puede estar vacío');
  });
});

describe('Formato de montos', () => {
  it('muestra soles con dos decimales', () => {
    expect(formatMoney(50)).toBe('S/ 50.00');
    expect(formatMoney(1.5)).toBe('S/ 1.50');
  });
});
