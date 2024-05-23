import listeners from "./event.listeners.js";

/**
 * @this {JSuggest}
 */
export default function updateSelected() {
    let vars= this.vars,
        elms= this.elms,
        l= listeners.realInputBlurListener.bind(this),
        sel;

    elms.container.childNodes.forEach(function (el) {
        el.classList.remove('selected')
        if(el.getAttribute('idx')===vars.selected.get('id')){
            el.classList.add('selected')
            sel= el;
        }

    });

    elms.realInput.removeEventListener("blur", l);
    if(sel) sel.focus()
    elms.realInput.addEventListener("blur", l);
    elms.realInput.focus()
}