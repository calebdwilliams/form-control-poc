import { IElementInternals } from 'element-internals-polyfill';

export type Constructor<T = {}> = new (...args: any[]) => T;

export interface FormControlInterface {
  checked?: boolean;
  connectedCallback(): void;
  formResetCallback(): void;
  internals: IElementInternals;
  value: any;
}

export function FormControlMixin<T extends Constructor<HTMLElement>>(SuperClass: T) {
  class FormControl extends SuperClass {
    static get formAssociated() {
      return true;
    }

    internals = this.attachInternals();

    value: any = '';

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
          console.log(hasChecked, this.localName)
          if (hasChecked && this.checked || !hasChecked) {
            value = newValue;
            this.internals.setFormValue(newValue);
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
              this.internals.setFormValue(this.value);
            } else {
              this.internals.setFormValue(null);
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
      this.value = '';
    }
  }

  return FormControl as Constructor<FormControlInterface> & T;
}
