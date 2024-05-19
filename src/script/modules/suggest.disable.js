import l from "./event.listeners.js";
/**
 * Clear view and autocomplete state
 * @this {jsuggest}
 */
export default function disable() {
    this.elms.falseInput.disabled = true
    this.elms.falseInput.removeEventListener('focus', l.falseInputFocusListener)
}