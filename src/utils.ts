export const submit = (form: HTMLFormElement): void => {
  if (!form.reportValidity()) {
    return;
  } else {
    const submitEvent = new Event('submit', {
      cancelable: true
    });
    form.dispatchEvent(submitEvent);
    if (!submitEvent.defaultPrevented) {
      form.submit();
    }
  }
};
