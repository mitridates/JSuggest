import createElement from "./elm.createElement.js";
/**
 * Initailize or reset false input
 * @param {HTMLElement} f   False input
 * @param {HTMLElement} el  Source element
 */
export default function setFalseInput(f,el)
{
    let sel, type = el.nodeName.toLowerCase()
    if(type === 'select'){
        if(!el.options.length) return;
        sel = el.options.selectedIndex
        createElement(f, {value: el.options[sel].text, title: el.options[sel].value + ' ' + el.options[sel].text })
        f.value= el.options[sel].text
    }else if(type === 'input'){
        createElement(f, {value: el.value, title: el.title + ' ' + el.value })
        f.value= el.value
    }
}
