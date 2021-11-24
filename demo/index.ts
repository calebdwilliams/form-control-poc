import 'element-internals-polyfill';
import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { FormControlMixin, submit } from "../src";
import {
  requiredValidator,
  minLengthValidator,
  maxLengthValidator,
  programmaticValidator,
  patternValidator
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

abstract class LegacyFormControl extends FormControlMixin(LitElement) {
  static get formControlValidators() {
    return [
      requiredValidator,
      programmaticValidator,
      maxLengthValidator,
      minLengthValidator,
      patternValidator
    ];
  }

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Number, attribute: 'minlength' })
  minLength: number;

  @property({ type: Number, attribute: 'maxlength' })
  maxLength: number;

  @property({ type: String, reflect: true })
  pattern: string;

  constructor() {
    super();
    this.addEventListener('keydown', this.onKeydown);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.onKeydown);
  }

  private onKeydown = (event: KeyboardEvent): void => {
    if (event.code === 'Enter') {
      if (this.form) {
        submit(this.form);
      }
    }
  }
}

@customElement('legacy-demo')
class Demo extends LegacyFormControl {
  static styles = commonSheet;

  @query('input')
  validationTarget: HTMLInputElement;

  render() {
    return html`<label for="control"><slot></slot></label>
    <input
      aria-describedby="hint"
      id="control"
      .minLength="${live(this.minLength)}"
      ?required="${this.required}"
      .value="${live(this.value)}"
      @input="${this.onInput}"
    >
    <span id="hint">${this.showError ? this.validationMessage : 'Value must end with the string "lit"'}</span>`;
  }

  onInput({ target }: Event & { target: HTMLInputElement }) {
    this.value = target.value;
  }
}
