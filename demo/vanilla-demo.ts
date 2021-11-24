import { FormControlMixin, Validator } from '../src';
import {
  requiredValidator,
  maxLengthValidator,
} from '../src/validators';
import { commonSheet } from './commonStyles';

const vanillaStyles = new CSSStyleSheet();
vanillaStyles.replace(`
:host([required]) .optional {
  display: none;
}`);

const template = document.createElement('template');
template.innerHTML = `<label for="input"><slot>Label text goes here</slot> <span class="optional">(optional)</span></label>
<input id="input">`;

export class VanillaDemo extends FormControlMixin(HTMLElement) {
  static get formControlValidators(): Validator[] {
    return [requiredValidator, maxLengthValidator];
  }

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.adoptedStyleSheets = [commonSheet, vanillaStyles];
    root.append(template.content.cloneNode(true));
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.validationTarget.addEventListener('input', this.#onInput);
  }

  get required(): boolean {
    return this.hasAttribute('required');
  }

  set required(required: boolean) {
    this.toggleAttribute('required', !!required);
  }

  get maxLength(): number {
    return Number(this.getAttribute('maxlength'));
  }

  set maxLength(length: number) {
    if (length > 0) {
      this.setAttribute('maxlength', length.toString());
    } else {
      this.removeAttribute('maxlength');
    }
  }

  get validationTarget(): HTMLInputElement {
    return this.shadowRoot.querySelector('input');
  }

  #onInput = ({ target }: Event & { target: HTMLInputElement}): void => {
    this.value = target.value;
  }

  formResetCallback(): void {
    super.formResetCallback();
    this.validationTarget.value = '';
  }
}

customElements.define('vanilla-demo', VanillaDemo);
