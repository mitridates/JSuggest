import l from "./event.listeners.js";
/**
 * Clear view and autocomplete state
 * @this {JSuggest}
 */
export default function focus() 
{
    l.falseInputFocusListener.call(this);
}