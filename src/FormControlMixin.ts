import { IElementInternals } from 'element-internals-polyfill';
import { Constructor, FormControlInterface, IControlHost, Validator } from './types';

export function FormControlMixin<T extends Constructor<HTMLElement & IControlHost>>(SuperClass: T) {
  class FormControl extends SuperClass {
    /** Wires up control instances to be form associated */
    static get formAssociated() {
      return true;
    }

    /**
     * A list of Validator objects that will be evaluated when a control's form
     * value is modified or optionally when a given attribute changes.
     *
     * When a Validator's callback returns false, the entire form control will
     * be set to an invalid state.
     */
    static get formControlValidators(): Validator[] {
      return [];
    }

    /**
     * Allows the FormControl instance to respond to Validator attributes.
     * For instance, if a given Validator has a `required` attribute, that
     * validator will be evaluated whenever the host's required attribute
     * is updated.
     */
    static get observedAttributes(): string[] {
      const validatorAttributes = this.formControlValidators
        .map(validator => validator.attribute);

      /** @ts-ignore This exits */
      const observedAttributes = super.observedAttributes || [];

      /** Make sure there are no duplicates inside the attributes list */
      const attributeSet = new Set([...observedAttributes, ...validatorAttributes])
      return [...attributeSet];
    }

    /**
     * Return the validator associated with a given attribute. If no
     * Validator is associated with the attribute, it will return null.
     */
    static getValidator(attribute: string): Validator {
      return this.formControlValidators.find(validator =>
        validator.attribute === attribute
      );
    }

    /** The ElementInternals instance for the control. */
    internals = this.attachInternals() as unknown as IElementInternals;

    /** Keep track of if the control has focus */
    focused = false;

    /**
     * Toggles to true whenever the element has been focused. This property
     * will reset whenever the control's formResetCallback is called.
     */
     get touched() {
      return this.hasAttribute('touched');
    }

    set touched(touched) {
      this.toggleAttribute('touched', !!touched);
    }

    /**
     * The element that will receive focus when the control's validity
     * state is reported either by a form submission or via API
     */
    validationTarget: HTMLElement;

    /**
     * The controls' form value. As this property is updated, the form value
     * will be updated. If a given control has a `checked` property, the value
     * will only be set if `checked` is truthy.
     */
    value: any = '';

    /** Return a reference to the control's form */
    get form(): HTMLFormElement {
      return this.internals.form;
    }

    /**
     * Will return true if it is recommended that the control shows an internal
     * error. If using this property, it is wise to listen for 'invalid' events
     * on the element host and call preventDefault on the event. Doing this will
     * prevent browsers from showing a validation popup.
     */
    get showError(): boolean {
      return this.___checkForError();
    }

    /**
     * The validation message shown by a given Validator object. If the control
     * is in a valid state this should be falsy.
     */
    get validationMessage(): string {
      return this.internals.validationMessage;
    }

    /**
     * The element's validity state after evaluating the control's Validators.
     * This property implements the same patterns as the built-in constraint
     * validation strategy.
     */
    get validity(): ValidityState {
      return this.internals.validity;
    }

    /**
     * Exists to control when an error should be displayed
     * @private
     */
     ___forceError = false;

    /**
     * Is set in the constructor, will resolve whenever the validationTarget
     * is ready so `internals.setValidity` can have access to the element
     * and will not throw.
     * @private
     */
    ___ready: Promise<void>;

    constructor(...args: any[]) {
      super(...args);
      this.addEventListener('focus', this.___onFocus);
      this.addEventListener('blur', this.___onBlur);
      this.addEventListener('invalid', this.___onInvalid);

      let tick = 0;
      this.___ready = new Promise((resolve, reject) => {
        const id = setInterval(() => {
          if (tick >= 100) {
            clearInterval(id);
            reject();
          } else if (this.validationTarget) {
            clearInterval(id);
            resolve();
          }
        }, 0);
      })

      /**
       * When the element is constructed we will need to grab a list of all
       * Validators that include an attribute property and push them into the
       * element constructor's observedAttributes array.
       */
      const proto = this.constructor as typeof FormControl;
      proto.formControlValidators.forEach(validator => {
        if (validator.attribute && !proto.observedAttributes.includes(validator.attribute)) {
          proto.observedAttributes.push(validator.attribute);
        }
      });
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) {
        super.disconnectedCallback();
      }
      /**
       * Remove the event listeners that toggles the touched and focused states
       */
      this.removeEventListener('focus', this.___onFocus);
      this.removeEventListener('blur', this.___onBlur);
      this.removeEventListener('invalid', this.___onInvalid);

    }

    attributeChangedCallback(name, oldValue, newValue): void {
      if (super.attributeChangedCallback) {
        super.attributeChangedCallback(name, oldValue, newValue);
      }

      /**
       * Check to see if a Validator is associated with the changed attribute.
       * If one exists, call control's ___validate function which will perform
       * control validation.
       */
      const proto = this.constructor as typeof FormControl;
      const validator = proto.getValidator(name);

      if (validator) {
        this.___validate(this.value);
      }
    }

    connectedCallback() {
      if (super.connectedCallback) {
        super.connectedCallback();
      }

      /** Initialize the form control  and perform initial validation */
      this.___formControlInit();
      this.___validate(this.value);
    }

    /**
     * Initialize the form control
     * @private
     */
    ___formControlInit(): void {
      /** Closed over variable to track value changes */
      let value: any = '';

      /** Value getter reference within the closure */
      let set;

      /** Value setter reference within the closure */
      let get;

      /** Look to see if '`checked'` is on the control's prototype */
      const hasChecked = this.hasOwnProperty('checked');

      /**
       * The FormControlMixin writes the value property on the element host
       * this checks to see if some other object in the prototype chain
       * has a getter/setter for value and saves a reference to those.
       *
       * We do this to make sure that we don't overwrite behavior of an object
       * higher in the chain.
       */
      if (this.hasOwnProperty('value')) {
        const descriptor = Object.getOwnPropertyDescriptor(this, 'value');
        set = descriptor.set;
        get = descriptor.get;
      }

      /** Define the FormControl's value property */
      Object.defineProperty(this, 'value', {
        get() {
          /** If a getter already exists, make sure to call it */
          if (get) {
            return get.call(this);
          }
          return value;
        },
        set(newValue) {
          /** Save a reference to the new value to use later if necessary */
          value = newValue;

          /**
           * If the control has a checked property, make sure that it is
           * truthy before setting the form control value. If it is falsy,
           * remove the form control value.
           */
          if (!hasChecked || hasChecked && this.checked) {
            value = newValue;
            this.___setValue(newValue)
          }

          /** If a setter already exists, make sure to call it */
          if (set) {
            set.call(this, [newValue]);
          }

          /** A requestUpdate call specifically for Lit interactivity */
          if (this.requestUpdate) {
            this.requestUpdate();
          }
        }
      });

      /**
       * If checked already exists on a prototype, we need to monitor
       * for changes to that property to ensure the proper value is set on the
       * control's form.
       */
      if (hasChecked) {
        /**
         * As with value, save a reference to the getter/setter if they already
         * exist in the prototype chain
         */
        const descriptor = Object.getOwnPropertyDescriptor(this, 'checked');
        let get = descriptor.get;
        let set = descriptor.set;

        /** Close over the initial value to use in the new getter/setter */
        let checked = this.checked;

        Object.defineProperty(this, 'checked', {
          get() {
            /** If a getter exists, use it */
            if (get) {
              return get.call(this);
            }
            return checked;
          },
          set(newChecked) {
            if (newChecked) {
              /** If truthy, set the form value to the instance's value */
              this.___setValue(this.value);
            } else {
              /** If falsy, remove the instance's form value */
              this.___setValue(null);
            }

            /** If a setter exists, use it */
            if (set) {
              set.call(this, [newChecked]);
            }

            /** Updated closure value */
            checked = newChecked;

            /** A requestUpdate call specifically for Lit interactivity */
            if (this.requestUpdate) {
              this.requestUpdate();
            }
          }
        });
      }
    }

    /** Reset control state when the form is reset */
    formResetCallback() {
      this.resetFormControl();
    }

    /**
     * A callback for when the controls' form value changes. The value
     * passed to this function should not be confused with the control's
     * value property, this is the value that will appear on the form.
     * In cases where `checked` did not exist on the control's prototype
     * upon initialization, this value and the value property will be identical;
     * in cases where `checked` is present upon initialization, this will be
     * effectively `this.checked && this.value`.
     */
    valueChangedCallback(value: any): void {}

    /**
     * Resets a form control to its initial state
     */
    resetFormControl(): void {
      if (this.hasOwnProperty('checked') && this.checked === true) {
        this.checked = false;
      } else {
        this.value = '';
      }
      this.touched = false;
      this.___forceError = false;
      this.___checkForError();
    }

    /**
     * Check to see if an error should be shown. This method will also
     * update the internals state object with the --show-error state
     * if necessary.
     * @private
     */
    ___checkForError(): boolean {
      if (this.disabled) {
        return false;
      }

      const showError = this.___forceError ||
        (this.touched && !this.validity.valid && !this.focused);

      if (showError) {
        this.internals.states.add('--show-error');
      } else {
        this.internals.states.delete('--show-error');
      }

      return showError;
    }

    /**
     * Set this.touched and this.focused
     * to true when the element is focused
     * @private
     */
    ___onFocus = (): void => {
      this.touched = true;
      this.focused = true;
      this.___requestUpdate();
    }

    /**
     * Reset this.focused on blur
     * @private
     */
    ___onBlur = (): void => {
      this.focused = false;
      /**
       * Set ___forceError to ensure error messages persist until
       * the value is changed.
       */
      if (!this.validity.valid && this.touched) {
        this.___forceError = true;
      }
      this.___requestUpdate();
    }

    /**
     * For the show error state on invalid
     * @private
     */
    ___onInvalid = (): void => {
      this.___forceError = true;
      this.___requestUpdate();
    }

    /**
     * Call Lit's requestUpdate property
     * @private
     */
    ___requestUpdate() {
      this.___checkForError();
      /** @ts-ignore */
      if (this.requestUpdate) {
        /** @ts-ignore */
        this.requestUpdate();
      }
    }

    /**
     * Sets the control's value when updated and invokes the valueChangedCallback
     * for the element. Once the value has been set, invoke the Validators.
     * @private
     */
    ___setValue(value: any): void {
      this.___forceError = false;
      this.internals.setFormValue(value);
      if (this.valueChangedCallback) {
        this.valueChangedCallback(value);
      }
      this.___validate(value);
    }

    /**
     * Call all the Validators on the control
     * @private
     */
    ___validate(value: any): void {
      const proto = this.constructor as typeof FormControl;
      const validity: Partial<Record<keyof ValidityState, boolean>> = {};
      let validationMessage = '';
      let isValid = true;

      proto.formControlValidators
        .forEach(validator => {
          /** Get data off the Validator */
          const { message , callback } = validator;

          /** If a key is not set, use `customError` as a catch-all */
          const key = validator.key || 'customError';

          /** Invoke the Validator callback with the instance and the value */
          const valid = callback(this, value);

          /**
           * Invert the validity because we are setting the new property
           * on the new ValidityState object
           */
          validity[key] = !valid;

          if (valid === false) {
            isValid = false;
            let messageResult: string;

            /**
             * The Validator interfaces allows for the message property
             * to be either a string or a function. If it is a function,
             * we want to get the returned value to use when calling
             * ElementInternals.prototype.setValidity.
             *
             * If the Validator.message is a string, use it directly. However,
             * if a control has a ValidityCallback, it can override the error
             * message for a given validity key.
             */
            if (message instanceof Function) {
              messageResult = message(this, value);
            } else if (this.validityCallback(key)) {
              messageResult = this.validityCallback(key) as string;
            }

            validationMessage = messageResult;
          }
        });

      /**
       * In some cases, the validationTarget might not be rendered
       * at this point, if the validationTarget does exist, proceed
       * with a call to internals.setValidity. If the validationTarget
       * is still not set, we essentially wait a tick until it is there.
       *
       * If the validityTarget does not exist even after the setTimeout,
       * this will throw.
       */
      if (isValid) {
        this.internals.setValidity({});
      } else if (this.validationTarget) {
        this.internals.setValidity(validity, validationMessage, this.validationTarget);
      } else {
        this.___ready
          .then(() => {
            this.internals.setValidity(validity, validationMessage, this.validationTarget);
          })
          .catch(() => {
            console.error('Validation target is not set on element', this);
          });
      }
    }

    /**
     * This method is used to override the controls' validity message
     * for a given Validator key. This has the highest level of priority when
     * setting a validationMessage, so use this method wisely.
     *
     * The returned value will be used as the validationMessage for the given key.
     * @param validationKey {string} - The key that has returned invalid
     */
    validityCallback(validationKey: string): string|void {}
  }


  return FormControl as Constructor<FormControlInterface> & T;
}
