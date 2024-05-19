import l from "./event.listeners.js";
import { clearDebounceTimer } from "./fetch.js";
import clearItems from "./item.clearItems.js";
/**
 * @this {JSuggest}
 */
export default function destroy()
{

    this.elms.realInput.removeEventListener("focus", l.realInputFocusListener);
    this.elms.realInput.removeEventListener("keydown", l.realInputKeydownListener);
    this.elms.realInput.removeEventListener(this.vars.keyUpEventName, l.realInputKeyupListener);
    this.elms.realInput.removeEventListener("blur", l.realInputBlurListener);
    this.elms.container.removeEventListener('focus', l.containerFocusListener)
    this.elms.container.removeEventListener('mousedown', l.containerMousedownListener)
    if(this.elms.hasOwnProperty('falseClear') && this.elms.falseClear) this.elms.falseClear.removeEventListener('click', l.falseClearClickListener)
    this.elms.falseInput.removeEventListener('search', l.falseClearClickListener);//nuevo

    //window.removeEventListener("resize", resizeEventHandler);//@todo
   // document.removeEventListener("scroll", scrollEventHandler, true);//@todo
    clearDebounceTimer.call(this);
    clearItems.call(this);
}
