import { IElementInternals } from 'element-internals-polyfill';
import { Constructor, FormControlInterface, Validator } from './types';

export function FormControlMixin<T extends Constructor<HTMLElement>>(SuperClass: T) {
  class FormControl extends SuperClass {
    static get formAssociated() {
      return true;
    }

    static get formControlValidators(): Validator[] {
      return [];
    }

    static get observedAttributes(): string[] {
      const validatorAttributes = this.formControlValidators
        .map(validator => validator.attribute);
      // @ts-ignore
      const observedAttributes = super.observedAttributes || [];
      const attributeSet = new Set([...observedAttributes, ...validatorAttributes])
      return [...attributeSet];
    }

    static getValidator(attribute: string): Validator {
      return this.formControlValidators.find(validator =>
        validator.attribute === attribute
      );
    }

    internals = this.attachInternals() as unknown as IElementInternals;
    touched = false;
    validationTarget: HTMLElement;
    value: any = '';

    get form(): HTMLFormElement {
      return this.internals.form;
    }

    get validationMessage(): string {
      return this.internals.validationMessage;
    }

    get validity(): ValidityState {
      return this.internals.validity;
    }

    constructor(...args: any[]) {
      super(...args);
      this.addEventListener('focus', this.___onFocus);

      const proto = this.constructor as typeof FormControl;
      proto.formControlValidators.forEach(validator => {
        if (!proto.observedAttributes.includes(validator.attribute)) {
          proto.observedAttributes.push(validator.attribute);
        }
      });
    }

    disconnectedCallback() {
      // @ts-ignore
      if (super.disconnectedCallback) {
        // @ts-ignore
        super.disconnectedCallback();
      }
      this.removeEventListener('focus', this.___onFocus);
    }

    attributeChangedCallback(name, oldValue, newValue): void {
      // @ts-ignore
      if (super.attributeChangedCallback) {
        // @ts-ignore
        super.attributeChangedCallback(name, oldValue, newValue);
      }
      const proto = this.constructor as typeof FormControl;
      const validator = proto.getValidator(name);

      if (validator) {
        this.___validate(this.value);
      }
      console.trace(name, this.hasAttribute(name));
    }

    connectedCallback() {
      /** @ts-ignore */
      if (super.connectedCallback) {
        /** @ts-ignore */
        super.connectedCallback();
      }
      this.___formControlInit();
      this.___validate(this.value);
    }

    ___formControlInit() {
      let value: any = '';
      let set;
      let get;

      // const hasValue = this.hasOwnProperty('value');
      const hasChecked = this.hasOwnProperty('checked');

      if (this.hasOwnProperty('value')) {
        const descriptor = Object.getOwnPropertyDescriptor(this, 'value');
        set = descriptor.set;
        get = descriptor.get;
      }

      Object.defineProperty(this, 'value', {
        get() {
          if (get) {
            return get.call(this);
          }
          return value;
        },
        set(newValue) {
          value = newValue;
          if (hasChecked && this.checked || !hasChecked) {
            value = newValue;
            this.___setValue(newValue)
          }
          if (set) {
            set.call(this, [newValue]);
          }
          if (this.requestUpdate) {
            this.requestUpdate();
          }
        }
      });

      if (hasChecked) {
        const descriptor = Object.getOwnPropertyDescriptor(this, 'checked');
        let get = descriptor.get;
        let set = descriptor.set;

        // @ts-ignore
        let checked = this.checked;
        Object.defineProperty(this, 'checked', {
          get() {
            if (get) {
              return get.call(this);
            }
            return checked;
          },
          set(newChecked) {
            if (newChecked) {
              this.___setValue(this.value);
            } else {
              this.___setValue(null);
            }
            if (set) {
              set.call(this, [newChecked]);
            }
            checked = newChecked;
            if (this.requestUpdate) {
              this.requestUpdate();
            }
          }
        });
      }
    }

    formResetCallback() {
      /** @ts-ignore */
      if (this.hasOwnProperty('checked') && this.checked === true) {
        /** @ts-ignore */
        this.checked = false;
      } else {
        this.value = '';
      }
      this.touched = false;
    }

    valueChangedCallback(value: any): void {}

    ___onFocus() {
      this.touched = true;
    }

    ___setValue(value: any) {
      this.internals.setFormValue(value);
      if (this.valueChangedCallback) {
        this.valueChangedCallback(value);
      }
      this.___validate(value);
    }

    ___validate(value: any) {
      const proto = this.constructor as typeof FormControl;
      proto.formControlValidators
        .forEach(validator => {
          const { message , callback } = validator;
          const key = validator.key || 'customError';
          const valid = callback(this, value);

          if (valid) {
            this.internals.setValidity({
              [key]: false
            });
          } else if (valid === false) {
            let validationMessage;
            if (message instanceof Function) {
              validationMessage = message(this, value);
            } else if (this.validityCallback) {
              validationMessage = this.validityCallback(key);
            }
            if (this.validationTarget) {
              this.internals.setValidity({
                [key]: true
              }, validationMessage || message, this.validationTarget);
            } else {
              setTimeout(() => {
                this.internals.setValidity({
                  [key]: true
                }, validationMessage || message, this.validationTarget);
              });
            }
          }
        });
    }

    validityCallback(validationKey: string): string|void {

    }
  }


  return FormControl as Constructor<FormControlInterface> & T;
}
