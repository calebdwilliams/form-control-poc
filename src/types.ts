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
  validityCallback(validationKey: string): string|void;
}

export interface Validator {
  attribute?: string;
  key?: string;
  message: string | ((instance: any, value: any) => string);
  callback(instance: HTMLElement, value: any): boolean;
}

export interface IControlHost {
  attributeChangedCallback?(name: string, oldValue: any, newValue: any): void;
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  checked?: boolean;
  disabled?: boolean;
}
