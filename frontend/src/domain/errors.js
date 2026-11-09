export class ValidationError extends Error {
  constructor(errors) {
    super('Hay campos con errores');
    this.errors = errors;
  }
}
