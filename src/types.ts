import { IElementInternals } from 'element-internals-polyfill';

export type Constructor<T = {}> = new (...args: any[]) => T;

export interface FormControlInterface {
  checked?: boolean;
  internals: IElementInternals;
  touched: boolean;
  validationTarget: HTMLElement;
  value: any;
  connectedCallback(): void;
  formResetCallback(): void;
  valueChangedCallback(value: any): void;
}

export interface ValidatonObject {
  key: string;
  message?: string;
  valid: boolean;
}

export interface Validator {
  attribute: string;
  key?: string;
  message: string;
  callback(instance: HTMLElement, value: any): boolean;
}
