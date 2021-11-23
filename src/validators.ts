import { Validator } from './index';

export interface RequiredHost extends HTMLElement {
  required: boolean;
};

export const requiredValidator: Validator = {
  attribute: 'required',
  key: 'valueMissing',
  message: 'You must include a value',
  callback(instance: RequiredHost, value: any): boolean {
    if (!instance.hasOwnProperty('required')) {
      console.warn('The requiredValidator does not include property "required" on', instance);
    }
    let valid = true;

    if (instance.required && !value) {
      valid = false;
    }

    return valid;
  }
};

export interface ProgrammaticValidatorHost extends HTMLElement {
  error: string;
};

export const programmaticValidator: Validator = {
  attribute: 'error',
  message(instance: ProgrammaticValidatorHost, value: string): string {
    return `${instance.error} ${value}`;
  },
  callback(instance: ProgrammaticValidatorHost): boolean {
    if (!instance.hasOwnProperty('error')) {
      console.warn('The programmaticValidator does not include property "error" on', instance);
    }
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
    if (!instance.hasOwnProperty('minLength')) {
      console.warn('The minLengthValidator does not include property "minLength" on', instance);
    }
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
    if (!instance.hasOwnProperty('maxLength')) {
      console.warn('The maxLengthValidator does not include property "maxLength" on', instance);
    }
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
    if (!instance.hasOwnProperty('pattern')) {
      console.warn('The patternValidator does not include property "pattern" on', instance);
    }
    const regExp = new RegExp(instance.pattern);
    return !!regExp.exec(value);
  }
};
