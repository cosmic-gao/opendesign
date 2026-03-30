import type { WebContainerConfig, ValidationError, ValidationResult } from './types';

export function validate<VNode, CSSProperties>(
  config: WebContainerConfig<VNode, CSSProperties>
): ValidationResult {
  const errors: ValidationError[] = [];

  if (config.autoBoot !== undefined && typeof config.autoBoot !== 'boolean') {
    errors.push({
      field: 'autoBoot',
      message: 'autoBoot must be a boolean',
      value: config.autoBoot,
    });
  }

  if (config.autoMount !== undefined && typeof config.autoMount !== 'boolean') {
    errors.push({
      field: 'autoMount',
      message: 'autoMount must be a boolean',
      value: config.autoMount,
    });
  }

  if (config.enableExit !== undefined && typeof config.enableExit !== 'boolean') {
    errors.push({
      field: 'enableExit',
      message: 'enableExit must be a boolean',
      value: config.enableExit,
    });
  }

  if (config.files !== undefined && typeof config.files !== 'object') {
    errors.push({
      field: 'files',
      message: 'files must be an object (FileTree)',
      value: config.files,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
