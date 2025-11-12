import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appAlphanumeric]'
})
export class AlphanumericDirective {
  // If true, allow spaces as well as letters and numbers
  @Input('appAlphanumeric') allowSpaces = false;

  constructor(private el: ElementRef<HTMLInputElement | HTMLTextAreaElement>, private renderer: Renderer2) {}

  private get invalidRegex(): RegExp {
    return this.allowSpaces ? /[^a-zA-Z0-9 ]+/g : /[^a-zA-Z0-9]+/g;
  }

  @HostListener('input', ['$event']) onInput(event: Event) {
    const input = this.el.nativeElement as HTMLInputElement | HTMLTextAreaElement;
    const old = input.value || '';
    let cleaned = old.replace(this.invalidRegex, '');

    // enforce maxlength if present on the element
    try {
      const max = input.maxLength;
      if (typeof max === 'number' && max > 0) {
        if (cleaned.length > max) cleaned = cleaned.slice(0, max);
      }
    } catch (e) {
      // ignore
    }

    if (cleaned !== old) {
      // set value and dispatch input event so ngModel/formControl picks up the change
      this.renderer.setProperty(input, 'value', cleaned);
      const ev = new Event('input', { bubbles: true });
      input.dispatchEvent(ev);
    }
  }

  // Prevent typing characters that are invalid (optional UX improvement)
  @HostListener('keypress', ['$event']) onKeyPress(event: KeyboardEvent) {
    const ch = event.key;
    // allow control keys
    if (ch.length > 1) return;
    const regex = this.invalidRegex;
    if (regex.test(ch)) {
      event.preventDefault();
      return;
    }

    // enforce maxlength during typing: if element has maxlength and there's no selection replacing text,
    // prevent further typing when the max would be exceeded
    try {
      const input = this.el.nativeElement as HTMLInputElement | HTMLTextAreaElement;
      const max = input.maxLength;
      const selStart = input.selectionStart ?? 0;
      const selEnd = input.selectionEnd ?? 0;
      const selectionLength = selEnd - selStart;
      if (typeof max === 'number' && max > 0) {
        if ((input.value.length - selectionLength) >= max) {
          event.preventDefault();
        }
      }
    } catch (e) {
      // ignore
    }
  }
}
