import { css } from 'lit';

export const commonSheet = css`:host {
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
:host(:invalid[touched]) input,
:host([internals-invalid][touched]) input {
  border-color: red;
}
:host(:invalid[touched]:not(:focus-within)) span,
:host([internals-invalid][touched]:not(:focus-within)) span {
  color: red;
}
`;
