(function(window,  JsonApiManager, JsonApiSpec, undefined) {
    'use strict';

    //#####    Singleton     ####
    /**
     *  Add && set JsonApiSpec instances
     */
    let JSuggestCache = (function() {
        let
            instances = {},
            templates={};

        function add(id, ins){
            instances[id]= ins
        }

        /**
         * @param {string} type
         * @param {CallableFunction} callback
         */
        function addTemplate(type, callback){
            templates[type]= callback
            return JSuggestCache
        }

        /**
         * @param {JsonApiSpec} spec
         * @return {JSuggestFormatter|null}
         */
        function getTemplate(spec){
            return (templates.hasOwnProperty(spec.type)) ? new templates[spec.type](spec) : null;
        }

        /**
         * @param {string|HTMLFormElement} e
         * @return {null|JSuggest}
         */
        function get(e)
        {
            let elm

            if(!e) return null

            if(typeof e === "string")
            {
                return instances.hasOwnProperty(e)? instances[e] : null
            }
            else if(e.nodeType)
            {
                if(e.classList.contains('jsuggest-false-input')){
                    elm= e.parentNode.parentNode.querySelector('[data-jsuggest]')
                }else if(e.dataset.jsuggest)
                {
                    elm= e
                }
                if(elm){
                    return get(elm.dataset.randid)
                }
            }
            return null
        }
        return { // public interface
            add: add,
            get: get,
            addTemplate: addTemplate,
            getTemplate: getTemplate
        };
    })();

    /**
     * Modified version of Kraaden autocomplete
     * https://github.com/kraaden/autocomplete
     * Copyright (c) 2016 Denys Krasnoshchok
     * MIT License
     */
    let
        /**
         * Temporizador de rebote
         */
        debounceTimer,
        _req,
        rinputs = /^(?:input|select)$/i,
        isMobileDevice =  /Android|webOS|iPhone|iPad|BlackBerry|Windows Phone|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent),
        isMobileFirefox= isMobileDevice &&  navigator.userAgent.indexOf("Firefox"),
        // 'keyup' event will not be fired on Mobile Firefox, so we have to use 'input' event instead
        keyUpEventName = isMobileFirefox ? "input" : "keyup",

        /**
         * Basic create/modify HTMLElement
         * @param {string|HTMLElement} e
         * @param  {Object} [a]
         * @return HTMLElement
         */
        createElement= function(e, a) {
            let i, j;
            if(typeof e === "string") return createElement(document.createElement(e), a)
            if (a && "[object Object]" === Object.prototype.toString.call(a)) {
                for (i in a){
                    if (i in e){
                        if("style" === i){
                            for (j in a[i]){
                                e.style[j] = a[i][j];
                            }
                        }else{
                            e[i] = a[i];
                        }
                    }else if ("html" === i){
                        e.innerHTML = a[i];
                    }else if("textcontent" === i){
                        e.textContent = a[i];
                    }else{
                        e.setAttribute(i, a[i]);
                    }
                }
            }
            return e;
        }
    ;

    //########  EVENTS  ########//
    /**
     * @param {Event} ev
     * @this JSuggest
     */
    function keydownEventHandler(ev) {
        let disp= !!this.nodes.container.firstChild,
            activeElem= document.activeElement,
            keyCode = ev.which || ev.keyCode || 0
        ;

        if (keyCode === 38 /* Up */ || keyCode === 40 /* Down */ || keyCode === 27 /* Esc */) {
            if (keyCode === 27 /* Esc */) {
                this.clear();
                activeElem.blur()
            }
            else {
                //no items, return
                if (!disp || this.items.length < 1) {
                    return;
                }
                //set this.selected
                if (keyCode === 38 /* Up */) {
                    selectPrev.call(this)
                } else {
                    selectNext.call(this);/* 40 down */
                }
                styleSelected.call(this)
            }
            ev.preventDefault();
            if (disp) {
                ev.stopPropagation();
            }
            return;
        }
        if (keyCode === 13 /* Enter */) {
            if (this.selected)
            {
                this.setValue(this.selected, this.nodes.container.querySelector('.selected'))
                this.clear();
                activeElem.blur()
            }
            ev.preventDefault();
            ev.stopPropagation();
        }

    }

    /**
     * Ignore keyup keycodes and Fetch data if keycode is letter or number
     * @param {Event} ev
     * @this JSuggest
     */
    function keyupEventHandler(ev)
    {
        let keyCode = ev.which || ev.keyCode || 0,
            ignore = [38 /* Up */, 13 /* Enter */, 27 /* Esc */, 39 /* Right */, 37 /* Left */, 16 /* Shift */, 17 /* Ctrl */, 18 /* Alt */, 20 /* CapsLock */, 91 /* WindowsKey */, 9 /* Tab */];

        if(ignore.indexOf(keyCode)!== -1) return

        if (keyCode >= 112 /* F1 */ && keyCode <= 123 /* F12 */) {
            return;
        }
        // the down key is used to open autocomplete
        if (keyCode === 40 /* Down */ && !!this.nodes.container.firstChild) {
            return;
        }

        startFetch.call(this, 0 /* Keyboard */);
    }
    /**
     * The currentTarget read-only property of the Event interface identifies the current target for the event,
     * as the event traverses the DOM. It always refers to the element to which the event handler has been attached,
     * as opposed to Event.target, which identifies the element on which the event occurred and which may be its descendant.
     * @this JSuggest
     * @param {Event} ev
     */
    function itemClickEventHandler(ev)
    {
        this.selected = this.items[ev.currentTarget.getAttribute('data-index')]
        this.setValue(this.selected, ev.currentTarget)
        this.clear();
        ev.preventDefault();
        ev.stopPropagation();
    }
    /**
     * @param {Event} ev
     */
    function containerMousedownEventHandler(ev) {
        ev.stopPropagation();
        ev.preventDefault();
    }
    /**
     * @this JSuggest
     */
    function blurEventHandler() {
        let n= this.nodes,
            self = this;
        // we need to delay clear, because when we click on an item, blur will be called before click and remove items from DOM
        //emit('blur', input)
        setTimeout(function () {
            if (document.activeElement !== n.realInput) {
                self.clear();
                n.dropdowncontent.style.display='none'
            }
        }, 200);
    }
    // /**
    //  * @param {Event} ev
    //  * @this JSuggest
    //  */
    // function resizeEventHandler(ev) {
    //     if (!!this.nodes.container.parentNode)  this.update()
    // }
    /**
     * @param {Event} ev
     * @this JSuggest
     */
    function realInputFocusEventHandler(ev) {
        if (this.config.showOnFocus) {
            startFetch.call(this,1 /* Focus */);
        }
    }
    /**
     * @param {Event} ev
     * @this JSuggest
     */
    function falseClearClickEventHandler(ev) {
        this.clearValues()
        createElement(this.nodes.falseInput, {
            value: '',
            title: '',
            idx: ''
        })

        this.clear();
    }
    /**
     * @param {Event} ev
     * @this JSuggest
     */
    function falseInputFocusEventHandler(ev) {
        let n = this.nodes;
        createElement(n.dropdowncontent, {style: {display:'block'}, tabIndex: -1})
        createElement(n.realInput, {value: ''}).focus()
        n.falseInput.tabIndex= -1
        // Para redimensionar
        // n.dropdowncontent.style.width= '90%'
    }

    /**
     * Para borrar los valores jsuggest en un formulario no vale con el.value=''
     * Necesita document.querySelector('.jsuggest-false-input).dispatchEvent(new Event('change', {cancelable: true}));
     * No consigo que lanzar el evento change de otra manera
     * @param {Event} ev
     * @this JSuggest
     */
    function falseInputChangeEventHandler(ev) {
        let el= ev.currentTarget
        if(el.value===''){
            el.setAttribute('title', '')
            el.setAttribute('idx', '')
            this.nodeElement.length=0
        }
    }

    /**
     * @param {Event} ev
     * @this JSuggest
     */
    function formResetEventHandler(ev) {
        restoreCopy.call(this)
        setFalseInputOnInit(this.nodes.falseInput, this.nodeElement)
    }
    /**
     * @param {Event} ev
     * @this JSuggest
     */
    function containerFocusEventHandler(ev) {
        this.nodes.realInput.focus();//prevent scroll
    }

    let
        setFalseInputOnInit= function(f,el){
            let sel, type = el.nodeName.toLowerCase()
            if(type === 'select'){
                sel = el.options.selectedIndex
                createElement(f, {value: el.options[sel].text, title: el.options[sel].value + ' ' + el.options[sel].text })
                f.value= el.options[sel].text
            }else if(type === 'input'){
                createElement(f, {value: el.value, title: el.title + ' ' + el.value })
                f.value= el.value
            }
        },
        /**
         *
         * @param {string|HTMLSelectElement|HTMLInputElement} el
         * @param {Object} data
         */
        setNodeElementValue = function(el, data){
            let type = el.nodeName.toLowerCase()

            if(type === 'select'){
                el.length = 0
                el.appendChild(createElement('option', {
                    value: data.id,
                    text: data.value,
                    selected: 'selected'
                }))
            }else if(type === 'input'){
                createElement(el, {
                    value: data.id,
                    title: data.value + '. ' + data.id
                })
            }
        },
        /**
         *
         * @param {JsonApiSpec} spec
         * @param {int} index
         * @return {HTMLElement}
         */
        renderItem = function (spec, index) {
            let
                ret= spec.toString(),
                tpl= JSuggestCache.getTemplate(spec),
            el
            ;
            //todo hacer un evento para modificar retornar div con formatos...
            /**
             * @type {Element}
             */
            el= createElement('div', {
                // 'data-jsuggest': JSON.stringify(spec),
                // html:  html,
                idx: spec.get('id'),
                'data-index': index,
                tabIndex:-1
            })

            if(tpl){
                return tpl.getItem(el, index)
            }else{
                el.appendChild(document.createTextNode(ret))
                return el
            }
        },
        /** Clear debouncing timer if assigned */
        clearDebounceTimer = function() {
            if (debounceTimer) window.clearTimeout(debounceTimer)
        },

        /**
         * xhttp
         * @param text
         * @param fetchCallback
         */
        fetchXhr= function (text, fetchCallback) {
            let
                path = this.config.path,
                res, jam, xhr
            ;

            // abort request while typing
            try {_req.abort(); } catch(e){}
            //new request
            _req = xhr =  new XMLHttpRequest()
            //responseType='json' ante una excepción sólo devuelve status y statusText
            //lo malo. En dev te resta información
            //lo bueno. En prod no muestra errores internos
            xhr.responseType='json'

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    res= xhr.response
                    //para debug comentar xhr.responseType='json' y descomentar aquí
                    //  res= xhr.response.hasOwnProperty('data')? xhr.response : JSON.parse(xhr.response),
                    jam= new JsonApiManager(res.data, res.included)
                    fetchCallback(jam.getParsed());
                } else {
                    //para debug, descomentar aquí y arriba
                    // if(window.JError){
                    //     JError(xhr).show()
                    // }else{
                    alert(`Error ${xhr.status} : ${xhr.statusText}`)
                    // }_re
                }
            };

            if(this.config.method === 'GET') //set queryString
            {
                xhr.open('GET', path+`?term=${text.toLowerCase()}`)
                xhr.send();
            }else{
                xhr.open('POST', path)
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                xhr.send(`term=${text.toLowerCase()}`);
            }
        },

        /**
         * @param {int} trigger
         * @this JSuggest
         */
        startFetch= function(trigger /*1== Focus, 0== other input Keyboard */) {

            // if multiple keys were pressed, before we get update from server,
            // this may cause redrawing our autocomplete multiple times after the last key press.
            // to avoid this, the number of times keyboard was pressed will be
            // saved and checked before redraw our autocomplete box.
            let savedKeypressCounter = ++this.keypressCounter,
                self= this,
                val = this.nodes.realInput.value

            if (val.length >= this.config.minLen || trigger === 1 /* Focus */) {

                clearDebounceTimer();

                debounceTimer = window.setTimeout(function () {
                    /**
                     * fetchCallback
                     * @param {JsonApiSpec[]} JsonApiArr
                     */
                    let fetchCallback= function (JsonApiArr) {
                        if (self.keypressCounter === savedKeypressCounter && JsonApiArr) {
                            self.items= JsonApiArr;
                            self.selected = JsonApiArr.length? JsonApiArr[0] : undefined;
                            self.update()
                        }
                    }

                    fetchXhr.call(self, val, fetchCallback , 0 /* Keyboard */)

                }, trigger === 0 /* Keyboard */ ? self.config.debounceWaitMs : 300);
            }
            else {
                self.clear();
            }
        },
        /**
         * @this JSuggest
         */
        wrapNodeElement= function(){
            let parentNode =   this.nodeElement['parentNode'],
                dropdown= createElement("div", {
                    class: 'jsuggest'
                }),
                falseGroup= createElement("div", {
                    class: 'input-group',
                }),
                falseGroup_append= createElement("div", {
                    class: 'input-group-append',
                }),
                falseClear= createElement("span", {
                    class: 'input-group-text cursor-pointer',
                    html: '&times;',
                }),
                falseInput= createElement("input", {
                    class: 'jsuggest-false-input form-control',
                    type:"text",
                    placeholder: this.config.placeholder
                }),
                dropdowncontent= createElement("div", {
                    class: 'jsuggest-content'
                }),
                container= createElement("div", {
                    class: 'autocomplete',
                }),
                /**
                 * dropdown input HTMLElement
                 * @type {HTMLElement}
                 */
                realInput = createElement('input', {
                    placeholder: this.config.searchPlaceholder.replace("minLength", this.config.minLen),
                    class: 'jsuggest-real-input form-control',
                    tabindex:-1,
                    autocomplete:"off",
                    autocorrect: "off",
                    autocapitalize: "off",
                    spellcheck: "false",
                    role: "textbox"
                })

            //bypass html5 validation to false input
            falseInput.required= this.nodeElement.required
            this.nodeElement.required= false

            container.style.display= 'none'

            //---
            falseGroup.appendChild(falseInput)
            falseGroup_append.appendChild(falseClear)
            falseGroup.appendChild(falseGroup_append)
            //---
            //set custom dropdown width
            if(this.config.width){
                createElement(dropdown, {
                    style: {width: this.config.width}
                })
            }
            //--
            this.nodeElement.style.display= 'none'
            dropdowncontent.style.display= 'none'
            dropdown.appendChild(this.nodeElement)
            dropdown.appendChild(falseGroup)
            dropdowncontent.appendChild(realInput)
            dropdowncontent.appendChild(container)
            dropdown.appendChild(dropdowncontent)
            parentNode.appendChild(dropdown)

            this.nodes= {
                parentNode: parentNode,
                dropdown: dropdown,
                falseInput: falseInput,
                dropdowncontent: dropdowncontent,
                container: container,
                realInput: realInput,
                falseClear: falseClear,
            }

            this.nodeElement.setAttribute("data-jsuggest", 'true');
        },
        /**
         * @this JSuggest
         */
        styleSelected = function () {
            let sel;

            this.nodes.container.childNodes.forEach(function (el) {
                el.classList.remove('selected')
                // removeClass(el, 'selected')
                if(el.getAttribute('idx')===this.selected.get('id')){
                    el.classList.add('selected')
                    sel= el;
                }

            }, this)
            this.nodes.realInput.removeEventListener("blur", this.listeners.realinputblur);
            if(sel) sel.focus()
            this.nodes.realInput.addEventListener("blur", this.listeners.realinputblur);
            this.nodes.realInput.focus()
        },

        /**
         * @this JSuggest
         */
        makeCopy= function(){
            if(this.nodeElement.nodeName.toLowerCase()==='select'){
                this.nodeElementCopy = this.nodeElement.innerHTML
            }else{/**is input*/
                this.nodeElementCopy = this.nodeElement.value
            }
        },
        /**
         * Restaurar valores iniciales
         */
        restoreCopy= function(){
            if(this.nodeElement.nodeName.toLowerCase()==='select'){
                this.nodeElement.innerHTML = this.nodeElementCopy
            }else{/**is input*/
            this.nodeElement.value = this.nodeElementCopy
                this.nodeElement.title= ''
            }
        },
        /**
         * @this JSuggest
         */
        setConfig= function (config) {
            let key, found,
                defaults= {
                    /**  Sets the width of the container */
                    width: null,

                    /**
                     * Data format: [{label: x, value: y}, {...}, ...]
                     * <pre>
                     * Fetch local data:
                     * JSuggest.(selector, {fetch: function(text, updateCallback, inputSource){
                     *     data= ...filterTextFunction(text)
                     *     updateCallback(data)
                     * }})
                     *
                     * Fetch ajax data:
                     * JSuggest.(selector, {fetch: function(text, updateCallback, inputSource){
                     *     ajaxFunction(...).
                     *     onSuccessAjaxFunction(function(response){
                     *      let data = JSON.parse(response.responseText)
                     *          updateCallback(data)
                     *     })
                     * }})
                     *
                     * Fetch ajax data with JSuggest callback:
                     * JSuggest.(selector, {fetch: urlToFetchData, method: 'post'})
                     * JSuggest.(selector, urlToFetchData) // default method POST
                     * </pre>
                     */
                    fetch: null,//function(text, updateCallback, inputSource){... updateCallback(data)}
                    path: null,
                    method: 'POST',
                    debounceWaitMs: 300,
                    minLen: 3,
                    // maxHeight: 180,
                    noResults: "Sin resultados...",
                    placeholder: '',
                    searchPlaceholder: "minLength caracteres para buscar ...",
                    showOnFocus: false,
                    /**show empty msg or nothing*/
                    showNoResultMsg: true,
                    /** Enables/ disables the container */
                    disabled: false,
                };
            //config in argguments || dataset; arguments prefered
            for(key in defaults){
                if((found = this.nodeElement.getAttribute('data-'+key))){
                    defaults[key]= found
                }
                if(config && config.hasOwnProperty(key)) defaults[key]= config[key]
            }
            return defaults
        },
        /**
         * @this JSuggest
         */
        _syncAttributes = function () {
            let val,
                type = this.nodeElement.nodeName.toLowerCase()

            if(type === 'select'){
                if(this.nodeElement.selectedIndex>-1){
                    val= this.nodeElement[this.nodeElement.selectedIndex].value
                }else{
                    val = ''
                }
            }else{//type === 'input'
                val = this.nodeElement.value
            }

            if(val===''){
                this.nodes.falseInput.value = ''
            }

            this.config.disabled = this.nodeElement.disabled

            if (this.config.disabled) {
                if (this._isOpen) {
                    this.clear();
                }
                this.disable();
            } else {
                this.enable();
            }

        },
        /**
         * Observe hidden field to enable/disable false input if required
         * @this JSuggest
         */
        _observeMutations = function () {
            let el= this.nodeElement,
                _this= this,
                nodeobserver= new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.attributeName === "disabled") {
                            el.disabled ? _this.disable().clearValues() : _this.enable()
                        }
                    });
                });
            nodeobserver.observe(el, {
                attributes: true
            });



        },
        /**
         * Select the previous item in suggestions
         */
        selectPrev= function () {
            let i;
            if (this.items.length < 1) {
                this.selected = undefined;
            }
            else {
                if (this.selected === this.items[0]) {
                    this.selected = this.items[this.items.length - 1];
                }
                else {
                    for (i = this.items.length - 1; i > 0; i--) {
                        if (this.selected === this.items[i] || i === 1) {
                            this.selected = this.items[i - 1];
                            break;
                        }
                    }
                }
            }
        },
        /**
         * Select the next item in suggestions
         */
        selectNext= function() {
            if (this.items.length < 1) {
                this.selected = undefined;
            }
            if (!this.selected || this.selected === this.items[this.items.length - 1]) {
                this.selected = this.items[0];
                return;
            }
            for (let i = 0; i < (this.items.length - 1); i++) {
                if (this.selected === this.items[i]) {
                    this.selected = this.items[i + 1];
                    break;
                }
            }
        },
        /**
         * @this JSuggest
         */
        bindEvents= function () {
            let 
                listeners = {
                    //'windowresize': resizeEventHandler.bind(this),
                    //'documentscroll': scrollEventHandler.bind(this),
                    'realinputfocus': realInputFocusEventHandler.bind(this),
                    'falseinputfocus': falseInputFocusEventHandler.bind(this),
                    'falseinputchange': falseInputChangeEventHandler.bind(this),
                    'falseclearclick':  falseClearClickEventHandler.bind(this),
                    'realinputkeydown': keydownEventHandler.bind(this),
                    'realinputkeyup': keyupEventHandler.bind(this),
                    'realinputblur': blurEventHandler.bind(this),
                    'containerfocus': containerFocusEventHandler.bind(this),
                    'containerMousedown': containerMousedownEventHandler.bind(this),
                    'itemClick': itemClickEventHandler.bind(this)
                }
            if(this.nodeElement.form){
                listeners['formReset']= formResetEventHandler.bind(this)
                this.nodeElement.form.addEventListener('reset', listeners.formReset);
            }

            // setup event handlers
            this.nodes.container.addEventListener("focus", listeners.containerfocus);
            this.nodes.falseInput.addEventListener('focus', listeners.falseinputfocus)

            this.nodes.falseInput.addEventListener('change', listeners.falseinputchange)
            this.nodes.realInput.addEventListener("keydown", listeners.realinputkeydown);
            this.nodes.realInput.addEventListener(keyUpEventName, listeners.realinputkeyup);
            this.nodes.realInput.addEventListener("blur", listeners.realinputblur);
            this.nodes.container.addEventListener('focus', listeners.containerfocus)
            this.nodes.container.addEventListener('containerMousedown', listeners.containerMousedown)
            this.nodes.realInput.addEventListener("focus", listeners.realinputfocus);
            this.nodes.falseClear.addEventListener("click", listeners.falseclearclick);


            // window.addEventListener("windowresize", listeners.windowresize);
            // document.addEventListener("scroll", listeners.documentscroll, true);
            this.listeners = listeners

        };

    /**
     * @constructor
     * @param {String|Object} selector
     * @param {Object|null} config
     */
    function JSuggest (selector, config=null)
    {
        if (!(this instanceof JSuggest)) return new JSuggest(selector, config)

        if ( !selector ) {
            throw new Error("You must supply either a HTMLInputElement, HTMLSelectElement or a CSS3 selector string.");
        } else if (typeof selector === 'string'){
            this.nodeElement = document.querySelector(selector)
        }else if ( selector.nodeType ){
            if(selector.getAttribute("data-jsuggest")){
                return;
            }
            this.nodeElement= selector
        }
        if (!this.nodeElement) throw new Error("The element can not be found.");
        if (!rinputs.test(this.nodeElement.nodeName.toLowerCase())) throw new Error("The element is not a HTMLInputElement or HTMLSelectElement.");
        this.nodeElement.setAttribute('data-randid', Math.random().toString(36).slice(2))
        //cloneNode is a live copy so...
        makeCopy.call(this)
        this.config = setConfig.call(this, config)
        this.items= []
        this.keypressCounter= 0
        this.selected= undefined
        wrapNodeElement.call(this)
        bindEvents.call(this)
        setFalseInputOnInit(this.nodes.falseInput, this.nodeElement)
        _syncAttributes.call(this);
        _observeMutations.call(this)
        JSuggestCache.add(this.nodeElement.dataset.randid, this)
    }


    /**
     * This function will remove DOM elements and clear event handlers
     */
    JSuggest.prototype.destroy= function() {
        this.nodes.realInput.removeEventListener("focus", realInputFocusEventHandler);
        this.nodes.realInput.removeEventListener("keydown", keydownEventHandler);
        this.nodes.realInput.removeEventListener(keyUpEventName, keyupEventHandler);
        this.nodes.realInput.removeEventListener("blur", blurEventHandler);
        this.nodes.container.removeEventListener('focus', containerFocusEventHandler)
        this.nodes.container.removeEventListener('mousedown', containerMousedownEventHandler)
        this.nodes.falseClear.removeEventListener('click', falseClearClickEventHandler)
        //window.removeEventListener("resize", resizeEventHandler);
       // document.removeEventListener("scroll", scrollEventHandler, true);
        clearDebounceTimer();
        this.clear();
    }

    JSuggest.prototype.focus = function () {
        falseInputFocusEventHandler.call(this)
        return this;
    }

    JSuggest.prototype.disable = function () {
        this.nodes.falseInput.disabled = true
        this.nodes.falseInput.removeEventListener('focus', this.listeners.falseinputfocus)
        return this;
    }

    JSuggest.prototype.enable = function () {
        this.nodes.falseInput.disabled = false
        this.nodes.falseInput.addEventListener('focus', this.listeners.falseinputfocus)
        return this;
    }

    /**
     *  @param el {HTMLInputElement|string}
     *  @return JSuggest|null
     **/
    JSuggest.prototype.getInstance = function (el) {
        JSuggestCache.get(el)
    }

    /** Clear autocomplete state and hide container */
    JSuggest.prototype.clear = function() {
        let n = this.nodes

        this.items= []
        this.keypressCounter++
        this.selected = undefined
        while (n.container.firstChild) {
            n.container.removeChild(n.container.lastChild);
        }
        n.falseInput.tabIndex= 0
        n.realInput.tabIndex = -1
        n.container.style.display='none'
        this._isOpen=false
    }

    /**
     * Clear view and autocomplete state
     */
    JSuggest.prototype.clearValues= function(){
        createElement(this.nodes.falseInput, {
            value: '',
            title: '',
            idx: ''
        })
        if(this.nodeElement.nodeName.toLowerCase() ==='select'){
            this.nodeElement.options.length = 0
        }else{/**is input*/
            this.nodeElement.value = ''
            this.nodeElement.title= ''
        }
        this.clear()
        return this
    }


    /**
     * @param {JsonApiSpec} spec
     */
    JSuggest.prototype.setValue= function(spec){

        if(!(spec instanceof JsonApiSpec)){
            throw new Error ('Invalid argument. expected instance of JsonApiSpec, got ' + typeof spec)
        }
        if(this.selected!== spec) this.selected= spec

        let tpl= JSuggestCache.getTemplate(spec)


        let e= createElement(this.nodes.falseInput, {
            value: spec.toString(),
            title: spec.toString() + '. ' + spec.id,
            idx: spec.id
        })

        if(tpl){
            tpl.setInput(e)
        }

        setNodeElementValue(this.nodeElement, {id: spec.id, value: spec.toString()})
    }


    /**
     * Redraw the autocomplete div element with suggestions
     */
    JSuggest.prototype.update = function() {
        let
            container= this.nodes.container,
            fragment = document.createDocumentFragment(),
            div;

        container.style.display='block'

        // delete all children from autocomplete DOM container
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        this.items.forEach(function (item, index) {
            div = renderItem.call(this, item, index);
            if (div) {
                div.addEventListener("click", this.listeners.itemClick);
                fragment.appendChild(div);
            }
        }, this);

        container.appendChild(fragment);

        if (this.items.length < 1) {
            if (this.config.noResults) {
                let empty = document.createElement("div");
                empty.className = "empty";
                empty.textContent = this.config.noResults;
                container.appendChild(empty);
            } else {
                this.clear()
                return;
            }
        }else{
           styleSelected.call(this)
        }
        this._isOpen=true
    }

    JSuggest.copy= function (elm){
        let that=JSuggestCache.get(elm)

        if(!that) return;
        let val, id, spec,
            type = that.nodeElement.nodeName.toLowerCase()

        if(type === 'select'){
            if(that.nodeElement.selectedIndex>-1){
                val= that.nodeElement[that.nodeElement.selectedIndex].innerHTML
                id= that.nodeElement[that.nodeElement.selectedIndex].value
            }else{
                val = ''
            }
        }else{//type === 'input'
            val = that.nodeElement.value
            id= that.nodeElement.value
        }
        if(val==='') return
        spec={
            id: id,
            attributes: {
                name: val
            },
            type: that.nodeElement.dataset.specType
        };
        sessionStorage.setItem(elm.name+'.spec', JSON.stringify(spec))
    }

    JSuggest.paste= function (elm){
       let
           spec= sessionStorage.getItem(elm.name+'.spec'),
           that=JSuggestCache.get(elm),
           jas
       ;
        if(spec && that){
           jas= new JsonApiSpec(JSON.parse(spec))
           jas.toString= ()=> jas.attributes.name;
           that.setValue(new JsonApiSpec(JSON.parse(spec)))
       }
    }


    JSuggest.cache= JSuggestCache
    window.JSuggest = JSuggest;

}(window, JsonApiManager, JsonApiSpec));

