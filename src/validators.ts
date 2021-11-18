import { Validator } from './index';

export interface RequiredHost extends HTMLElement {
  required: boolean;
}

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

