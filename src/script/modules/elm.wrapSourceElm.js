import createElement from "./elm.createElement.js";
import {updateDropDownWidth} from "./event.listeners.js";

export default function wrapSourceElement(src, config)
{

    let 
        /**
         * @var {HTMLElement} src 
         */
        parentNode =   src.parentNode,
        dropdown= createElement("div", {
            class: 'jsuggest'
        }),
        falseGroup= createElement("div", {
            class: 'false-input-container',
        }),
/*         falseClear= createElement("span", {//con bootstrap
            class: 'input-group-text cursor-pointer',
            style: {cursor: 'pointer'},
            html: '&times;',
        }), */
/*         falseClear= createElement("a", {//clear con css y rotatte
            href:"JavaScript:Void(0);",
            class:"clear",
            tabindex:"0",
            role:"button"
        }), */
/*         falseClear= createElement("input", {//clear con input reset. No se lleva bien con boostrap
            type: 'reset',
            class:"clear",
            tabindex:"0",
            value: 'X'
        }),  */       
        falseInput= createElement("input", {
            class: 'false-input form-control',
            placeholder: config.placeholder,
            type: 'search',
        }),

        dropdowncontent= createElement("div", {
            class: 'dropdown-content',
        }),
        container= createElement("div", {
            class: 'autocomplete',
        }),
        /**
         * dropdown input HTMLElement
         * @type {HTMLElement}
         */
        realInput = createElement('input', {
            placeholder: config.searchPlaceholder.replace("minLength", config.minLen),
            class: 'real-input form-control',
            tabindex:-1,
            autocomplete:"off",
            autocorrect: "off",
            autocapitalize: "off",
            spellcheck: "false",
            type: 'search',
            role: "textbox"
        })

    //bypass html5 validation to false input
    falseInput.required= src.required
    src.required= false

    container.style.display= 'none'

    falseGroup.appendChild(falseInput)
    //set custom width
    if(config.width){
        createElement(falseInput, {
            style: {width: config.width}
        })

    }


    src.style.display= 'none'
    dropdowncontent.style.display= 'none'
    dropdown.appendChild(src)
    dropdown.appendChild(falseGroup)
    dropdowncontent.appendChild(realInput)
    dropdowncontent.appendChild(container)
    dropdown.appendChild(dropdowncontent)
    parentNode.appendChild(dropdown)
    
    src.setAttribute("data-jsuggest", 'true');

    window.addEventListener('load', function() {//prevent scroll bar
        updateDropDownWidth(falseInput, dropdowncontent);
    });

    window.addEventListener('resize', function() {//prevent scroll bar
        updateDropDownWidth(falseInput, dropdowncontent);
    });

    return {
        src: src,
        copy:(src.nodeName.toLowerCase()==='select')? src.innerHTML : src.value,
        container: container,
        dropdown: dropdown,
        dropdowncontent: dropdowncontent,
        falseClear: null,
        falseInput: falseInput,
        parentNode: parentNode,
        realInput:realInput,
    }
}