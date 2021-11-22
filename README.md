# FormControlMixin Proof of Concept

For a demo, either clone and install this project and run `npm start` or [view this Pen](https://codepen.io/calebdwilliams/pen/jOLJNvw?editors=0010).

## Usage

Import the mixin and use it to create a custom element class by passing in your chosen base class as an argument. The mixin has been tested with [`LitElement`](https://lit.dev) and `HTMLElement`. While the mixin might work with other base classes, these have not been tested yet.

This library makes use of the [`ElementInternals`](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals) features. As of the time of writing this document, the features this proof of concept uses are fully supported in Chrome, partially supported in Firefox and being [strongly considered by Webkit](https://mobile.twitter.com/rniwa_dev/status/1459328406789640192).

In order to make these features work in all browsers you will need to include the [`element-internals-polyfill`](https://www.npmjs.com/package/element-internals-polyfill).

```typescript
import { LitElement, html } from 'lit';
import { customElement, query, property } from 'lit/decorators.js'
import { live } from 'lit/directives/live.js';

import { FormControlMixin } from './path/to/mixin';

@customElement('demo-form-control')
class DemoFormControl extends FormControlMixin(LitElement) {
  @property({ type: String })
  value = '';

  render() {
    return html`
      <label for="input"><slot></slot></label>
      <input
        id="input"
        .value="${live(this.value)}"
        @input="${this.#onInput}"
      >
    `;
  }

  #onInput({ target }: { target: HTMLInputElement }): void {
    this.value = target.value;
  }
}
```

Now using this element in an HTML form will participate natively in an HTML form:

```html
<form>
  <demo-form-control
    name="demo"
    value="Hello world"
  >Demo form element</demo-form-control>

  <button type="submit">Submit</button>
</form>

<script>
  const form = document.querySelector('form');
  form.addEventListener('submit', event => {
    /** Prevent the page from reloading */
    event.preventDefault();

    /** Get form data object via built-in API */
    const data = new FormData(event.target);
    console.log('demo-form-control value:', data.get('demo'));
  });
</script>
```

As a matter of course, any component that uses the `FormControlMixin` will have a `value` property that the element will apply to the host form. If the element class also has a `checked` property on the prototype, the element's value will only be applied to the form when `checked` is truthy (this is to emulate behavior of components like radio and checkbox input types).

## Validation

The `FormControlMixin` includes an API for constraint validations and a set of common validators for validity states like required, min length, max length and pattern:

```typescript
import { LitElement, html } from 'lit';
import { customElement, query, property } from 'lit/decorators.js'
import { live } from 'lit/directives/live.js';

import { FormControlMixin } from './path/to/mixin';
import { requiredValidator } from './path/to/mixin/validators';

@customElement('demo-form-control')
class DemoFormControl extends FormControlMixin(LitElement) {
  static formControlValidators = [requiredValidator];

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: String })
  value = '';

  render() {
    return html`
      <label for="input"><slot></slot></label>
      <input
        id="input"
        .value="${live(this.value)}"
        @input="${this.#onInput}"
      >
    `;
  }

  #onInput({ target }: { target: HTMLInputElement }): void {
    this.value = target.value;
  }
}
```

Including the `requiredValidator` above will not implement a `valueMissing` algorithm to the component instance. Note, this does require the element's prototype have a `required` property.

*Note* Every form control element will need a public `validationTarget` which must be a focusable element. In the event a control becomes invalid, this item will be focused on form submit for accessibility purposes. Failure to do so will cause an error to throw. 

### Creating a custom validator

It is possible to create a custom validator object using the `Validator` interface:

```typescript
export interface Validator {
  attribute?: string;
  key?: string;
  message: string | ((instance: any, value: any) => string);
  callback(instance: HTMLElement, value: any): boolean;
}
```

Any given validator will key off an attribute (if present) which it will add to the element's `observedAttributes` array if it is not already present and re-evaluate the validation algorithm on value and validator attribute change. If no `attribute` is present on a validator, it will only be evaluated on value change.

They `key` property is any of the fields in the `ValidityState` object to override on validator change. If `key` is not set, it is assumed to be `customError`.

A validator also includes a message property or callback function. When set to a string, the validator's message will equal the string passed in. If the element is a function, the validation message will be the returned value from the callback. The message callback takes two arguments, the element instance and the control's form value (not the element's value property).

The finally property of the `Validator` interface is the validation callback which takes the same arguments as the validation message callback. When this callback returns `true`, the validator is considered to be in a valid state. When the callback returns `false` the validator is considered to be in an invalid state. 

So, a validator that would key off an `error` attribute to attach a programatic validation to an input might look like this:

```typescript
export const programaticValidator: Validator = {
  attribute: 'error',
  message(instance: HTMLElement & { error: string }): string {
    return instance.error;
  },
  callback(instance: HTMLElement & { error: string }): boolean {
    return !instance.error;
  }
};
```