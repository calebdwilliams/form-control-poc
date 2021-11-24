import 'construct-style-sheets-polyfill';

const commonSheet = new CSSStyleSheet();

commonSheet.replace(`:host {
  display: flex;
  flex-flow: column;
  font-family: Helvetica, Arial, sans-serif;
  font-size: 16px;
  gap: 4px;
}
label {
  font-weight: 600;
}
span {
  font-size: 14px;
}
input {
  border-radius: 4px;
  border: 1px solid #121212;
  font-size: 16px;
  padding: 4px;
}
/** Default invalid state */
:host(:--show-error) input {
  border-color: red;
}
:host(:--show-error) span {
  color: red;
}

/** Polyfilled invalid state */
:host([state--show-error]) input {
  border-color: red;
}
:host([state--show-error]) span {
  color: red;
}
`);

export { commonSheet };
