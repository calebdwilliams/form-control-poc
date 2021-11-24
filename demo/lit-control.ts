import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { FormControlMixin } from "../src";
import {
  requiredValidator,
  programmaticValidator,
} from '../src/validators';
import { commonSheet } from './commonStyles';

@customElement('lit-control')
export class LitControl extends FormControlMixin(LitElement) {
  static styles = commonSheet;

  static get formControlValidators() {
    return [requiredValidator, programmaticValidator];
  }

  @property({ type: String, reflect: true })
  error = '';

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: String })
  value = '';

  @query('input')
  validationTarget: HTMLInputElement;

  render() {
    return html`<label for="input"><slot>Default label</slot></label>
    <input @input="${this.#onInput}" .value="${live(this.value)}">`;
  }

  validityCallback(key: string): string {
    if (key === 'valueMissing') {
      return 'You must include a value for all instances of lit-control';
    }
  }

  #onInput = ({ target }: { target: HTMLInputElement}): void => {
    this.value = target.value;
  }
}
