// @awa-component: CHK-CheckCommand

export class CheckError extends Error {
  constructor(
    message: string,
    public code: 'FILE_READ_ERROR' | 'INVALID_CONFIG' | 'GLOB_ERROR'
  ) {
    super(message);
    this.name = 'CheckError';
  }
}
