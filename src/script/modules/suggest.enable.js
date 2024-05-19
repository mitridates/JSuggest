import l from "./event.listeners.js";
/**
 * Clear view and autocomplete state
 * @this {JSuggest}
 */
export default function enable() 
{
    this.elms.falseInput.disabled = false;
    this.elms.falseInput.addEventListener('focus', l.falseInputFocusListener.bind(this));
}