import 'element-internals-polyfill';

import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { FormControlMixin } from "../src";

const template = document.createElement('template');
template.innerHTML = `<label for="input"><slot></slot></label>
<input type="text" id="input">`;

class XControl extends FormControlMixin(HTMLElement) {
  value = '';
  checked = false

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

  #onInput = (event: Event): void => {
    this.value = (event.target as HTMLInputElement).value;
  }

  formResetCallback(...a) {
    super.formResetCallback();
    this.control.value = '';
  }
}

@customElement('lit-control')
export class LitControl extends FormControlMixin(LitElement) {
  @property({ type: String })
  value = '';

  render() {
    return html`<input @input="${this.#onInput}" .value="${live(this.value)}">`;
  }

  #onInput = ({ target }: { target: HTMLInputElement}): void => {
    this.value = target.value;
  }
}

customElements.define('x-control', XControl);


