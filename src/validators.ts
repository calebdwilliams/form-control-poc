import { Validator } from './index';

export interface RequiredHost extends HTMLElement {
  required: boolean;
};

export const requiredValidator: Validator = {
  attribute: 'required',
  key: 'valueMissing',
  message: 'You must include a value',
  callback(instance: RequiredHost, value: any): boolean {
    let valid = true;

    if (instance.required && !value) {
      valid = false;
    }

    return valid;
  }
};

export interface ProgramaticValidatorHost extends HTMLElement {
  error: string;
};

export const programaticValidator: Validator = {
  attribute: 'error',
  message(instance: ProgramaticValidatorHost, value: string): string {
    return `${instance.error} ${value}`;
  },
  callback(instance: ProgramaticValidatorHost): boolean {
    return !instance.error;
  }
};


export const minLengthValidator: Validator = {
  attribute: 'minlength',
  key: 'rangeUnderflow',
  message(instance, value) {
    return `Value must be at least ${instance.minLength} characters long`;
  },
  callback(instance: HTMLElement & { minLength: number }, value) {
    if (!!value && instance.minLength > value.length) {
      return false;
    }
    return true;
  }
};

export const maxLengthValidator: Validator = {
  attribute: 'maxlength',
  key: 'rangeOverflow',
  message(instance) {
    return `Value must not be more than ${instance.minLength} characters long`;
  },
  callback(instance: HTMLElement & { maxLength: number }, value) {
    if (!!value && instance.maxLength <= value.length) {
      return false;
    }
    return true;
  }
};

export const patternValidator: Validator = {
  attribute: 'pattern',
  key: 'patternMismatch',
  message(instance) {
    return `The value does not match the required format`;
  },
  callback(instance: HTMLElement & { pattern: string }, value) {
    const regExp = new RegExp(instance.pattern);
    return !!regExp.exec(value);
  }
};
