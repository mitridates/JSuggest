 import listeners from "./event.listeners.js";
 import clearItems from './item.clearItems.js';
 import renderItem from "./item.render.js";
 import  updateSelected from "./item.updateSelected.js";

 /**
 * Redraw the autocomplete div element with suggestions
 * @this {JSuggest}
 */
 export default function update() {
    let
        container= this.elms.container,
        vars= this.vars,
        config= this.config,
        itemClickListener= listeners.itemClickListener.bind(this),
        fragment = document.createDocumentFragment(),
        div;

    container.style.display='block'

    // delete all children from autocomplete DOM container
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    vars.items.forEach(function (item, index) {
        div = renderItem(item, index);
        if (div) {
            div.addEventListener("click", itemClickListener);
            fragment.appendChild(div);
        }
    });

    container.appendChild(fragment);
    if (vars.items.length < 1) {
        if (config.noResults) {
            let empty = document.createElement("div");
            empty.className = "empty";
            empty.textContent = config.noResults;
            container.appendChild(empty);
        } else {
            clearItems.call(this)
            return;
        }
    }else{
        updateSelected.call(this)
    }
    this.vars.isOpen=true
}