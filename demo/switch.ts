import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { FormControlMixin } from '../src';

@customElement('demo-switch')
export class DemoSwitch extends FormControlMixin(LitElement) {
  static styles = css`
    :host {
      background: ButtonFace;
      border: 1px solid #121212;
      border-radius: 999999px;
      cursor: pointer;
      display: inline-block;
      height: 24px;
      position: relative;
      transition: 0.1s ease-in color;
      width: 48px;
    }
    :host::after {
      aspect-ratio: 1;
      background: #ffffff;
      border: 1px solid #121212;
      border-radius: 50%;
      content: "";
      display: block;
      height: calc(100% - 4px);
      transition: 0.1s ease-in all;
      position: absolute;
        top: 1px;
        left: 1px;
    }
    :host(:not([checked]):hover), :host(:not([checked]):focus) {
      background: #cccccc;
    }
    :host(:not([checked]):active) {
      background: #bbbbbb;
    }
    :host(:hover)::after, :host(:focus)::after {
      background: #f6f6f6;
    }
    :host(:active)::after {
      background: #eeeeee;
    }
    :host([checked]) {
      background: ForestGreen;
    }
    :host([checked]:hover) {
      background: Green;
    }
    :host([checked]:focus) {
      background: Green;
    }
    :host([checked]:active) {
      background: DarkGreen;
    }
    :host(:hover) {

    }
    :host([checked])::after {
      left: calc(100% - 24px);
    }
    @media (prefers-reduced-motion: reduce) {
      :host::after {
        transition: none;
      }
    }`;

  @property({ type: Boolean, reflect: true })
  checked = false;

  @property({ type: String })
  value: string;

  protected firstUpdated(_changedProperties: Map<string | number | symbol, unknown>): void {
    super.firstUpdated(_changedProperties);

    this.addEventListener('click', this.#onClick);
    this.addEventListener('keypress', this.#onKeypress);
    this.setAttribute('role', 'switch');
    this.internals.ariaChecked = this.checked.toString();
    this.setAttribute('tabindex', '0');
  }

  #onClick = (): void => {
    this.checked = !this.checked;
    this.internals.ariaChecked = this.checked.toString();
  }

  #onKeypress = (event: KeyboardEvent): void => {
    if (['Enter', 'Space'].includes(event.code)) {
      this.#onClick();
    }
  }
}
