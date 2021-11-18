import 'element-internals-polyfill';
import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { FormControlMixin, Validator } from "../src";
import { requiredValidator } from '../src/validators';

const template = document.createElement('template');
template.innerHTML = `<label for="input"><slot></slot></label>
<input type="text" id="input">`;

class XControl extends FormControlMixin(HTMLElement) {
  static get formControlValidators(): Validator[] {
    return [requiredValidator];
  }

  checked = true;
  required = true;
  value = '';

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.append(template.content.cloneNode(true));
  }

  connectedCallback() {
    super.connectedCallback();
    this.control.addEventListener('input', this.#onInput);
  }

  disconnectedCallback() {
    this.control.removeEventListener('input', this.#onInput);
  }

  get control(): HTMLInputElement {
    return this.shadowRoot.querySelector('input');
  }

  get validationTarget(): HTMLInputElement {
    return this.shadowRoot.querySelector('input');
  }

  #onInput = (event: Event): void => {
    this.value = (event.target as HTMLInputElement).value;
  }

  formResetCallback() {
    super.formResetCallback();
    this.control.value = '';
  }
}

@customElement('lit-control')
export class LitControl extends FormControlMixin(LitElement) {
  static get formControlValidators() {
    return [requiredValidator];
  }

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: String })
  value = '';

  @query('input')
  validationTarget: HTMLInputElement;

  validityCallback(validationKey): string {
    if (validationKey === 'valueMissing') {
      return 'nah';
    }
  }

  render() {
    return html`<input @input="${this.#onInput}" .value="${live(this.value)}">`;
  }

  #onInput = ({ target }: { target: HTMLInputElement}): void => {
    this.value = target.value;
  }
}

customElements.define('x-control', XControl);


