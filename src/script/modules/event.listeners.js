import createElement from "./elm.createElement.js";
import {clearValues}  from './suggest.clear.js';
import clearItems from "./item.clearItems.js";
import setFalseInput from "./elm.setFalseInput.js";
import startFetch from "./fetch.js";
import setItemValue from "./item.setItemValue.js"
import updateSelected from "./item.updateSelected.js";
import selectPrev from "./item.selectPrev.js";
import selectNext from "./item.selectNext.js";
    //########  EVENTS  ########//
export default {
    /**
     * @param {Event} ev
     * @this JSuggest
     * @returns void
     */
     realInputKeydownListener: function(ev){
        let disp= !!this.elms.container.firstChild,
            activeElem= document.activeElement,
            keyCode = ev.which || ev.keyCode || 0
        ;

        if (keyCode === 38 /* Up */ || keyCode === 40 /* Down */ || keyCode === 27 /* Esc */) {
            if (keyCode === 27 /* Esc */) {
                clearItems.call(this);
                activeElem.blur()
            }
            else {
                //no items, return
                if (!disp || this.vars.items.length < 1) {
                    return;
                }
                //set this.selected
                if (keyCode === 38 /* Up */) {
                    selectPrev.call(this)
                } else {
                    selectNext.call(this);/* 40 down */
                }
                updateSelected.call(this)
            }
            ev.preventDefault();
            if (disp) {
                ev.stopPropagation();
            }
            return;
        }
        if (keyCode === 13 /* Enter */) {
            if (this.vars.selected)
            {
                setItemValue.call(this, this.vars.selected, this.elms.container.querySelector('.selected'))
                clearItems.call(this);
                activeElem.blur()
            }
            ev.preventDefault();
            ev.stopPropagation();
        }

    },

    /**
     * Ignore keyup keycodes and Fetch data if keycode is letter or number
     * @param {Event} ev
     * @this JSuggest
     * @returns void
     */
    realInputKeyupListener: function(ev)
    {
        let keyCode = ev.which || ev.keyCode || 0,
            ignore = [38 /* Up */, 13 /* Enter */, 27 /* Esc */, 39 /* Right */, 37 /* Left */, 16 /* Shift */, 17 /* Ctrl */, 18 /* Alt */, 20 /* CapsLock */, 91 /* WindowsKey */, 9 /* Tab */];

        if(ignore.indexOf(keyCode)!== -1) return

        if (keyCode >= 112 /* F1 */ && keyCode <= 123 /* F12 */) {
            return;
        }
        // the down key is used to open autocomplete
        if (keyCode === 40 /* Down */ && !!this.elms.container.firstChild) {
            return;
        }

        startFetch.call(this, 0 /* Keyboard */);
    },
    /**
     * The currentTarget read-only property of the Event interface identifies the current target for the event,
     * as the event traverses the DOM. It always refers to the element to which the event handler has been attached,
     * as opposed to Event.target, which identifies the element on which the event occurred and which may be its descendant.
     * @this JSuggest
     * @param {Event} ev
     * @returns void
     */
    itemClickListener: function(ev)
    {
        this.vars.selected = this.vars.items[ev.currentTarget.getAttribute('data-index')]
        setItemValue(this.vars.selected, ev.currentTarget)
        clearItems.call(this);
        ev.preventDefault();
        ev.stopPropagation();
    },
    /**
     * @param {Event} ev
     * @returns void
     */
    containerMousedownListener: function(ev) {
        ev.stopPropagation();
        ev.preventDefault();
    },
    /**
     * @this JSuggest
     * @returns void
     */
    realInputBlurListener: function() {
        let that= this;
        // we need to delay clear, because when we click on an item, blur will be called before click and remove items from DOM
        setTimeout(function () {
            if (document.activeElement !== that.elms.realInput) {
                clearItems.call(that);
                that.elms.dropdowncontent.style.display='none'
            }
        }, 200);
    },
    // /**@todo 
    //  * @param {Event} ev
    //  * @this JSuggest
    //  */
    // function resizeListener(ev) {
    //     if (!!this.nodes.container.parentNode)  this.update()
    // }
    /**
     * @param {Event} ev
     * @this JSuggest
     * @returns void
     */
    realInputFocusListener: function(ev) {
        if (this.config.showOnFocus) {
            startFetch.call(this, 1 /* Focus */);
        }
    },
    /**
     * @param {Event} ev
     * @this JSuggest
     * @returns void
     */
    falseClearClickListener: function(ev) {
        clearValues.call(this)
        createElement(this.elms.falseInput, {
            value: '',
            title: '',
            idx: ''
        })

        clearItems.call(this);
    },
    /**
     * @param {Event} ev
     * @this JSuggest
     * @returns void
     */
    falseInputFocusListener: function(ev) 
    {
        createElement(this.elms.dropdowncontent, {style: {display:'block'}, tabIndex: -1})
        createElement(this.elms.realInput, {value: ''}).focus()
        this.elms.falseInput.tabIndex= -1
        // Para redimensionar
        // n.dropdowncontent.style.width= '90%'
    },

    /**
     * Para borrar los valores jsuggest en un formulario no vale con el.value=''
     * Necesita document.querySelector('.jsuggest-false-input).dispatchEvent(new Event('change', {cancelable: true}));
     * No consigo que lanzar el evento change de otra manera
     * @param {Event} ev
     * @this JSuggest
     * @returns void
     */
    falseInputChangeListener: function(ev) {
        let el= ev.currentTarget
        if(el.value===''){
            el.setAttribute('title', '')
            el.setAttribute('idx', '')
            this.elms.src.length=0
        }
    },

    /**
     * @param {Event} ev
     * @this JSuggest
     * @returns void
     */
    formResetListener: function(ev) {
        let 
        src= this.elms.src,
        cp= this.elms.copy
        ;
        if(src.nodeName.toLowerCase()==='select')
        {
            src.innerHTML = cp
        }else{/**is input*/
            src.value = cp
            src.title= ''
        }
        setFalseInput(this.elms.falseInput, src)
    },
    /**
     * @param {Event} ev
     * @this JSuggest
     * @returns void
     */
    containerFocusListener: function(ev) {
        this.elms.realInput.focus();//prevent scroll
    }

};
