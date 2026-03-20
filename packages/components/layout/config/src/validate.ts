import type { LayoutProps } from './layout';
import type { Breakpoint } from './types';

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const EASING_KEYWORDS = ['ease', 'linear', 'ease-in', 'ease-out', 'ease-in-out'];

const NUMERIC_RANGE = {
  min: 1,
  max: 10000,
} as const;

function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

const BREAKPOINT_KEYS: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];

export function validate<VNode, CSSProperties>(props: LayoutProps<VNode, CSSProperties>): ValidationResult {
  const errors: ValidationError[] = [];

  if (props.header) {
    if (props.header.height !== undefined) {
      if (!isInRange(props.header.height, NUMERIC_RANGE.min, NUMERIC_RANGE.max)) {
        errors.push({
          field: 'header.height',
          message: `header.height must be between ${NUMERIC_RANGE.min} and ${NUMERIC_RANGE.max}`,
          value: props.header.height,
        });
      }
    }
  }

  if (props.footer) {
    if (props.footer.height !== undefined) {
      if (!isInRange(props.footer.height, NUMERIC_RANGE.min, NUMERIC_RANGE.max)) {
        errors.push({
          field: 'footer.height',
          message: `footer.height must be between ${NUMERIC_RANGE.min} and ${NUMERIC_RANGE.max}`,
          value: props.footer.height,
        });
      }
    }
  }

  if (props.sidebar) {
    if (props.sidebar.width !== undefined) {
      if (!isInRange(props.sidebar.width, NUMERIC_RANGE.min, NUMERIC_RANGE.max)) {
        errors.push({
          field: 'sidebar.width',
          message: `sidebar.width must be between ${NUMERIC_RANGE.min} and ${NUMERIC_RANGE.max}`,
          value: props.sidebar.width,
        });
      }
    }

    if (props.sidebar.min !== undefined) {
      if (!isInRange(props.sidebar.min, NUMERIC_RANGE.min, NUMERIC_RANGE.max)) {
        errors.push({
          field: 'sidebar.min',
          message: `sidebar.min must be between ${NUMERIC_RANGE.min} and ${NUMERIC_RANGE.max}`,
          value: props.sidebar.min,
        });
      }
    }

    if (
      props.sidebar.width !== undefined &&
      props.sidebar.min !== undefined &&
      props.sidebar.min > props.sidebar.width
    ) {
      errors.push({
        field: 'sidebar.min',
        message: 'sidebar.min must be <= sidebar.width',
        value: props.sidebar.min,
      });
    }
  }

  if (props.animation) {
    if (props.animation.duration !== undefined && props.animation.duration < 0) {
      errors.push({
        field: 'animation.duration',
        message: 'animation.duration must be >= 0',
        value: props.animation.duration,
      });
    }

    if (props.animation.easing !== undefined) {
      const easingValue = props.animation.easing;
      const isValidEasing =
        typeof easingValue === 'string' &&
        (EASING_KEYWORDS.includes(easingValue) || easingValue.startsWith('cubic-bezier(') || easingValue.startsWith('steps('));

      if (!isValidEasing) {
        errors.push({
          field: 'animation.easing',
          message: `animation.easing must be one of: ${EASING_KEYWORDS.join(', ')} or a cubic-bezier()/steps() function`,
          value: props.animation.easing,
        });
      }
    }
  }

  if (props.breakpoints) {
    const values: number[] = [];

    for (const key of BREAKPOINT_KEYS) {
      const value = props.breakpoints[key];
      if (value !== undefined) {
        if (typeof value !== 'number' || value <= 0) {
          errors.push({
            field: `breakpoints.${key}`,
            message: `breakpoints.${key} must be a number > 0`,
            value,
          });
        } else {
          values.push(value);
        }
      }
    }

    for (let i = 1; i < values.length; i++) {
      const current = values[i];
      const previous = values[i - 1];
      if (current !== undefined && previous !== undefined && current <= previous) {
        errors.push({
          field: 'breakpoints',
          message: 'breakpoints values must be in ascending order',
          value: values,
        });
        break;
      }
    }
  }

  if (props.mobileBreakpoint !== undefined) {
    const breakpointValues = Object.values(props.breakpoints ?? {}).filter(
      (v): v is number => typeof v === 'number'
    );

    if (breakpointValues.length > 0) {
      const hasMatch = breakpointValues.some((v) => v === props.mobileBreakpoint);
      if (!hasMatch) {
        errors.push({
          field: 'mobileBreakpoint',
          message: `mobileBreakpoint must match one of breakpoints values: ${breakpointValues.join(', ')}`,
          value: props.mobileBreakpoint,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
