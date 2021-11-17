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
  callback(instance: HTMLElement, value: any): ValidatonObject;
}

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
      // @ts-ignore
      return [...observedAttributes, ...validatorAttributes];
    }

    static getValidator(attribute: string): Validator {
      return this.formControlValidators.find(validator =>
        validator.attribute === attribute
      );
    }

    internals = this.attachInternals();
    touched = false;
    validationTarget: HTMLElement;
    value: any = '';

    constructor(...args: any[]) {
      super(...args);
      this.addEventListener('focus', this.___onFocus);

      const proto = this.constructor as typeof FormControl;
      proto.formControlValidators.forEach(validator => {
        console.log(validator.attribute)
        proto.observedAttributes.push(validator.attribute);
      });
      console.log(proto.observedAttributes)
    }

    attributeChangedCallback(name, oldValue, newValue): void {
      const proto = this.constructor as typeof FormControl;
      const validator = proto.getValidator(name);

      if (validator) {
        this.___validate(this.value);
      }

      // @ts-ignore
      if (super.attributeChangedCallback) {
        // @ts-ignore
        super.attributeChangedCallback();
      }
    }

    connectedCallback() {
      /** @ts-ignore */
      if (super.connectedCallback) {
        /** @ts-ignore */
        super.connectedCallback();
      }
      this.___formControlInit();
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
        })
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
        .map(validator =>
          validator.callback(this, value)
        )
        .map(({key, valid, message}) => {
          console.log({valid, key, message})
          if (valid) {
            this.internals.setValidity({
              [key]: false
            });
          } else if (valid === false) {
            this.internals.setValidity({
              [key]: true
            }, message, this.validationTarget);
          }
        });
    }
  }

  return FormControl as Constructor<FormControlInterface> & T;
}
