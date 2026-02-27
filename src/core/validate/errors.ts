// @awa-component: VAL-ValidateCommand

export class ValidateError extends Error {
  constructor(
    message: string,
    public code: 'FILE_READ_ERROR' | 'INVALID_CONFIG' | 'GLOB_ERROR'
  ) {
    super(message);
    this.name = 'ValidateError';
  }
}
