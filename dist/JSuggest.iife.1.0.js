var JSuggest = (function () {
    'use strict';

    let env=(function(ua){
        let isMobileDevice=  /Android|webOS|iPhone|iPad|BlackBerry|Windows Phone|Opera Mini|IEMobile|Mobile/i.test(ua),
        isMobileFirefox=  isMobileDevice &&  ua.indexOf("Firefox"),
        keyUpEventName = isMobileFirefox ? "input" : "keyup";
        return {
            ua:ua,
            isMobileDevice:isMobileDevice,
            isMobileFirefox:isMobileFirefox,
            keyUpEventName:keyUpEventName,   
        }
    })(navigator.userAgent);

    /**
     * @todo jsdoc
     * @var {JSON} vars
     * @var {JSuggest} vars.instance Current instance
     * @var {XMLHttpRequest|null} vars.req Current request if any
     * @var {boolean} vars.isOpen suggest is open
     * @var {int} vars.selected selected item
     * @var {int} vars.keypressCounter control redrawing autocomplete multiple times after the last key press
     * @var {function|undefined} vars.debounceTimer timeout
     * @var {array} vars.items timeout
     */
    let vars={
        req:null,
        isOpen:null,
        selected:null,
        keypressCounter:0,
        debounceTimer:undefined, 
        items:[]
    };

    /**
     * @constant {Object} config
     */
    let config= {
        /**  Sets the width of the container */
        width: null,
        /**
         * Fetch static file, inline JSON Api array Object:  JSuggest(selector, {fetch: ...})<br>
         * @prop {JsonApiManager|JSON} fetch As JSON value: {data: JsonApiManager, filter:filterCallback|null, sortFn:sortFnCallback|}
         */
        fetch:null,
        /**
        * Fetch from url:
        * JSuggest.(selector, urlToFetchData)
        * JSuggest.(selector, {path: urlToFetchData, method: 'post'})
        */
        path: null,
        method: 'POST',
        debounceWaitMs: 300,
        minLen: 3,
        noResults: "No result found...",
        placeholder: '',
        searchPlaceholder: "minLength caracteres para buscar ...",
        showOnFocus: false,
        disabled: false,/**container is Enabled/disabled*/
    };

    /**
     * @param {JSON|null} opt 
     * @param {HTMLInputElement|HTMLSelectElement} src 
     */
    function setConfig(opt, src) {
        let key, found, ret={};

        for(key in config){//config in argguments || dataset
            ret[key]= config[key];
            if((found = src.getAttribute('data-'+key))){
                ret[key]= found;
            }
            if(opt && opt.hasOwnProperty(key)) ret[key]= opt[key];
        }
        return ret;
    }

    /**
     * Basic create/modify HTMLElement
     * @param {string|HTMLElement} e String to createElement or HTMLElement to modify  
     * @param  {Object} [a] attrinbutes
     * @return HTMLElement
     */
    function createElement$1(e, a) {
        let i, j;
        if(typeof e === "string") return createElement$1(document.createElement(e), a)
        if (a && "[object Object]" === Object.prototype.toString.call(a)) {
            for (i in a){
                if (i in e){
                    if("style" === i){
                        for (j in a[i]){
                            e.style[j] = a[i][j];
                        }
                    }else {
                        e[i] = a[i];
                    }
                }else if ("html" === i){
                    e.innerHTML = a[i];
                }else if("textcontent" === i){
                    e.textContent = a[i];
                }else {
                    e.setAttribute(i, a[i]);
                }
            }
        }
        return e;
    }

    /**
     * @this {JSuggest}
     */
    function clearItems() 
    {
        this.vars.items.length=0;
        this.vars.keypressCounter++;
        this.vars.selected = undefined;
        while (this.elms.container.firstChild) {
            this.elms.container.removeChild(this.elms.container.lastChild);
        }
        this.elms.falseInput.tabIndex= 0;
        this.elms.realInput.tabIndex = -1;
        this.elms.container.style.display='none';
        this.vars.isOpen=false;
    }

    /**
     * Clear view and autocomplete state
     * @this {JSuggest}
     */
    function clearValues(){
        let src= this.elms.src;
        createElement$1(this.elms.falseInput, {
            value: '',
            title: '',
            idx: ''
        });
        if(src.nodeName.toLowerCase() ==='select'){
            src.options.length = 0;
        }else {/**is input*/
        src.value = '';
        src.title= '';
        }
        clearItems.call(this);
    }

    /**
     * Initailize or reset false input
     * @param {HTMLElement} f   False input
     * @param {HTMLSelectElement|HTMLInputElement} el  Source element
     */
    function setFalseInput(f,el)
    {
        let sel, type = el.nodeName.toLowerCase();
        if(type === 'select'){
            if(!el.options.length) return;
            sel = el.options.selectedIndex;
            createElement$1(f, {value: el.options[sel].text, title: el.options[sel].value + ' ' + el.options[sel].text });
            f.value= el.options[sel].text;
        }else if(type === 'input'){
            createElement$1(f, {value: el.value, title: el.title + ' ' + el.value });
            f.value= el.value;
        }
    }

    //#####    Singleton     ####
    /**
     *  Add && set JsonApiSpec instances
     */
    var suggestCache = (function() {
        let
            cache= this,
            instances = {},
            templates={};

        /**
         * Save JSuggest instance by HTMLFormElement id 
         * @param {string} id HTMLFormElement data-randid
         * @param {JSuggest} ins instance
         */
        function addInstance(id, ins){
            instances[id]= ins;
        }

        /**
         * Add JsonApiSpec template to render item toString
         * @param {string} type
         * @param {CallableFunction} callback
         */
        function addTemplate(type, callback){
            templates[type]= callback;
            return cache
        }

        /**
         * Get JsonApiSpec template if exists, else, use default toString method
         * @param {JsonApiSpec} spec
         * @return {function|null}
         */
        function getTemplate(spec){
            return (templates.hasOwnProperty(spec.type)) ? new templates[spec.type](spec) : null;
        }

        /**
         * Get JSuggest instance from HTMLFormElement (input|select) if exits
         * @param {string|HTMLFormElement} e
         * @return {null|JSuggest}
         */
        function getInstance(e)
        {
            let elm;

            if(!e) return null

            if(typeof e === "string")
            {
                return instances.hasOwnProperty(e)? instances[e] : null
            }
            else if(e.nodeType)
            {
                if(e.classList.contains('jsuggest-false-input')){
                    elm= e.parentNode.parentNode.querySelector('[data-jsuggest]');
                }else if(e.dataset.jsuggest)
                {
                    elm= e;
                }
                if(elm){
                    return getInstance(elm.dataset.randid)
                }
            }
            return null
        }
        return { // public interface
            addInstance: addInstance,
            getInstance: getInstance,
            addTemplate: addTemplate,
            getTemplate: getTemplate
        };
    })();

    /**
     * @param {JsonApiSpec} spec
     * @param {int} index
     * @return {HTMLElement}
     */
    function renderItem(spec, index) {
        let el,
            ret= spec.toString(),
            tpl= suggestCache.getTemplate(spec)    
        ;
        
        /**
         * @type {HTMLElement}
         */
        el= createElement$1('div', {
            idx: spec.get('id'),
            'data-index': index,
            tabIndex:-1
        });

        if(tpl){
            return tpl.getItem(el, index)
        }else {
            el.appendChild(document.createTextNode(ret));
            return el
        }
    }

    /**
     * @this {JSuggest}
     */
    function updateSelected() {
        let vars= this.vars,
            elms= this.elms,
            l$1= l.realInputBlurListener.bind(this),
            sel;

        elms.container.childNodes.forEach(function (el) {
            el.classList.remove('selected');
            if(el.getAttribute('idx')===vars.selected.get('id')){
                el.classList.add('selected');
                sel= el;
            }

        });

        elms.realInput.removeEventListener("blur", l$1);
        if(sel) sel.focus();
        elms.realInput.addEventListener("blur", l$1);
        elms.realInput.focus();
    }

    /**
     * Redraw the autocomplete div element with suggestions
     * @this {JSuggest}
     */
     function update() {
        let
            container= this.elms.container,
            vars= this.vars,
            config= this.config,
            itemClickListener= l.itemClickListener.bind(this),
            fragment = document.createDocumentFragment(),
            div;

        container.style.display='block';

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
                clearItems.call(this);
                return;
            }
        }else {
            updateSelected.call(this);
        }
        this.vars.isOpen=true;
    }

    /**
     * Filter static [JsonApiSpec] defined in options argument.
     * @param config
     * @param {string} text
     * @return {JsonApiManager}
     */
    function filter(config, text)
    {
        let data,i,defaults={
            /**
             * @param {JsonApiSpec} spec
             * @param txt
             */        
            filterCb: (spec, txt)=>{//true if found
            return spec.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,"").indexOf(txt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,""))!==-1;
            },
            /**
            * @param {JsonApiSpec} a
            * @param {JsonApiSpec} b
            */
            sortCb: function(a, b) {
            return a.toString().localeCompare(b.toString());//ASC
            }
        };

        data= (function (f,d) {
                return {
                    parsed: Array.isArray(f) ? [...f] : [...f.data],
                    filterCb: f.hasOwnProperty('filterCb') ? f.filterCb:d.filterCb,
                    sortCb: f.hasOwnProperty('sortCb') ? f.sortCb:d.sortCb
                };
          })(config.fetch, defaults);

          i=data.parsed.length;

        while (i--) {
            data.parsed[i];
            if(!data.filterCb(data.parsed[i], text)) data.parsed.splice(i, 1);
        }

        data.parsed.sort(fetch.sortCb);   

        return data.parsed;
    }

    /** 
     * Clear debouncing timer if assigned 
     * @this {JSuggest}
     * */
    function clearDebounceTimer() {
        if (this.vars.debounceTimer) window.clearTimeout(this.vars.debounceTimer);
    }

    /**
     * @param {int} trigger
     * @this {JSuggest}
     */
    function startFetch(trigger/*1== Focus, 0== other input Keyboard */) 
    {
        // if multiple keys were pressed, before we get update from server,
        // this may cause redrawing our autocomplete multiple times after the last key press.
        // to avoid this, the number of times keyboard was pressed will be
        // saved and checked before redraw our autocomplete box.
        let val= this.elms.realInput.value,
        that= this,
        savedKeypressCounter= ++this.vars.keypressCounter;

        if (val.length >= that.config.minLen || trigger === 1 /* Focus */) {

            clearDebounceTimer.call(that);

            that.vars.debounceTimer = window.setTimeout(function () 
            {
                /**
                 * fetchCallback
                 * @param {JsonApiSpec[]} JsonApiArr
                 */
                let fetchCallback= function (JsonApiArr) {
                    if (that.vars.keypressCounter === savedKeypressCounter && JsonApiArr) {
                        that.vars.items=JsonApiArr;
                        that.vars.selected = JsonApiArr.length? JsonApiArr[0] : undefined;
                        update.call(that);
                    }
                };

                if(that.config.path){
                    fetchXhr.call(that, val, fetchCallback , 0 /* Keyboard */);
                }else if(that.config.fetch){
                    that.vars.items= filter(that.config, val);
                    that.vars.selected=that.vars.items.length? that.vars.items[0]: undefined;
                    update.call(that);
                }else {
                    console.log('Nada que buscar');
                }
            }, trigger === 0 /* Keyboard */ ? that.config.debounceWaitMs : 300);
        }
        else {
            clearItems.call(that);
        }
    }

    /**
     * xhttp
     * @param text
     * @param fetchCallback
     * @this {JSuggest}
     */
    function fetchXhr(text, fetchCallback, trigger) {
        let
            path = this.config.path,
            res, jam, xhr
        ;

        // abort request while typing
        try {this.vars.req.abort(); } catch(e){}

        this.vars.req = xhr =  new XMLHttpRequest();//new request

        //responseType='json' ante una excepción sólo devuelve status y statusText
        //lo malo. En dev te resta información
        //lo bueno. En prod no muestra errores internos

        xhr.responseType='json';

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                res= xhr.response;
                //para debug comentar xhr.responseType='json' y descomentar aquí
                //  res= xhr.response.hasOwnProperty('data')? xhr.response : JSON.parse(xhr.response),
                jam= new JsonApiManager(res.data, res.included);
                fetchCallback(jam.getParsed());
            } else {
                //para debug, descomentar aquí y arriba
                // if(window.JError){
                //     JError(xhr).show()
                // }else{
                alert(`Error ${xhr.status} : ${xhr.statusText}`);
                // }
            }
        };

        if(this.config.method === 'GET') //set queryString
        {
            xhr.open('GET', path+`?term=${text.toLowerCase()}`);
            xhr.send();
        }else {
            xhr.open('POST', path);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.send(`term=${text.toLowerCase()}`);
        }
    }

    /**
     * @param {JsonApiSpec} spec
     * @this {JSuggest}
     */
    function setItemValue(spec) 
    {
        let tpl, e, val,
        elms= this.elms,
        src= elms.src,
        vars= this.vars,
        type= src.nodeName.toLowerCase()
        ;

            if(!(spec instanceof JsonApiSpec)){
                throw new Error ('Invalid argument. expected instance of JsonApiSpec, got ' + typeof spec)
            }else {
                val= spec.toString();
            }

            if(vars.selected!== spec) vars.selected= spec;

            tpl= suggestCache.getTemplate(spec);


            e= createElement$1(elms.falseInput, {
                value: val,
                title: val + '. ' + spec.id,
                idx: spec.id
            });

            if(tpl){
                tpl.setInput(e);
            }

            if(type === 'select'){
                src.length = 0;
                src.appendChild(createElement$1('option', {
                    value: spec.id,
                    text: val,
                    selected: 'selected'
                }));
            }else if(type === 'input'){
                createElement$1(src, {
                    value: spec.id,
                    title: val + '. ' + spec.id
                });
            }
        }

    /**
     * @this {JSuggest}
     */
    function selectPrev() {
        let vars= this.vars,
        i;
        if (vars.items.length < 1) {
            vars.selected = undefined;
        }
        else {
            if (vars.selected === vars.items[0]) {
                vars.selected = vars.items[vars.items.length - 1];
            }
            else {
                for (i = vars.items.length - 1; i > 0; i--) {
                    if (vars.selected === vars.items[i] || i === 1) {
                        vars.selected = vars.items[i - 1];
                        break;
                    }
                }
            }
        }
    }

    /**
     * Select the next item in suggestions
     *
     * @this {JSuggest}
     */
    function selectNext() {
        let vars = this.vars;

        if (vars.items.length < 1) {
            vars.selected = undefined;
        }
        if (!vars.selected || vars.selected === vars.items[vars.items.length - 1]) {
            vars.selected = vars.items[0];
            return;
        }
        for (let i = 0; i < (vars.items.length - 1); i++) {
            if (vars.selected === vars.items[i]) {
                vars.selected = vars.items[i + 1];
                break;
            }
        }
    }

    var l = {
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
                    activeElem.blur();
                }
                else {
                    //no items, return
                    if (!disp || this.vars.items.length < 1) {
                        return;
                    }
                    //set this.selected
                    if (keyCode === 38 /* Up */) {
                        selectPrev.call(this);
                    } else {
                        selectNext.call(this);/* 40 down */
                    }
                    updateSelected.call(this);
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
                    setItemValue.call(this, this.vars.selected, this.elms.container.querySelector('.selected'));
                    clearItems.call(this);
                    activeElem.blur();
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
            this.vars.selected = this.vars.items[ev.currentTarget.getAttribute('data-index')];
            setItemValue.call(this, this.vars.selected, ev.currentTarget);
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
                    that.elms.dropdowncontent.style.display='none';
                }
            }, 200);
        },
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
            clearValues.call(this);
            createElement$1(this.elms.falseInput, {
                value: '',
                title: '',
                idx: ''
            });

            clearItems.call(this);
        },
        /**
         * @param {Event} ev
         * @this JSuggest
         * @returns void
         */
        falseInputFocusListener: function(ev) 
        {
            createElement$1(this.elms.dropdowncontent, {style: {display:'block'}, tabIndex: -1});
            createElement$1(this.elms.realInput, {value: ''}).focus();
            this.elms.falseInput.tabIndex= -1;
            // Para redimensionar
            updateDropDownWidth(this.elms.falseInput, this.elms.dropdowncontent);
        },

        /**
         * @param {Event} ev
         * @this JSuggest
         * @returns void
         */
        falseInputChangeListener: function(ev) {
            let el= ev.currentTarget;
            if(el.value===''){
                el.setAttribute('title', '');
                el.setAttribute('idx', '');
                this.elms.src.length=0;
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
                src.innerHTML = cp;
            }else {/**is input*/
                src.value = cp;
                src.title= '';
            }
            setFalseInput(this.elms.falseInput, src);
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

    function updateDropDownWidth(falseInput, dropdowncontent)
    {
        let rect= falseInput.getBoundingClientRect();
        dropdowncontent.style.width=  rect.width+'px';
    }

    function wrapSourceElement(src, config)
    {

        let 
            /**
             * @var {HTMLElement} src 
             */
            parentNode =   src.parentNode,
            dropdown= createElement$1("div", {
                class: 'jsuggest'
            }),
            falseGroup= createElement$1("div", {
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
            falseInput= createElement$1("input", {
                class: 'false-input form-control',
                placeholder: config.placeholder,
                type: 'search',
            }),

            dropdowncontent= createElement$1("div", {
                class: 'dropdown-content',
            }),
            container= createElement$1("div", {
                class: 'autocomplete',
            }),
            /**
             * dropdown input HTMLElement
             * @type {HTMLElement}
             */
            realInput = createElement$1('input', {
                placeholder: config.searchPlaceholder.replace("minLength", config.minLen),
                class: 'real-input form-control',
                tabindex:-1,
                autocomplete:"off",
                autocorrect: "off",
                autocapitalize: "off",
                spellcheck: "false",
                type: 'search',
                role: "textbox"
            });

        //bypass html5 validation to false input
        falseInput.required= src.required;
        src.required= false;

        container.style.display= 'none';

        falseGroup.appendChild(falseInput);
        //set custom width
        if(config.width){
            createElement$1(falseInput, {
                style: {width: config.width}
            });

        }


        src.style.display= 'none';
        dropdowncontent.style.display= 'none';
        dropdown.appendChild(src);
        dropdown.appendChild(falseGroup);
        dropdowncontent.appendChild(realInput);
        dropdowncontent.appendChild(container);
        dropdown.appendChild(dropdowncontent);
        parentNode.appendChild(dropdown);
        
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

    /**
     * Clear view and autocomplete state
     * @this {jsuggest}
     */
    function disable() {
        this.elms.falseInput.disabled = true;
        this.elms.falseInput.removeEventListener('focus', l.falseInputFocusListener);
    }

    /**
     * Clear view and autocomplete state
     * @this {JSuggest}
     */
    function enable() 
    {
        this.elms.falseInput.disabled = false;
        this.elms.falseInput.addEventListener('focus', l.falseInputFocusListener.bind(this));
    }

    /**
     * Clear view and autocomplete state
     * @this {JSuggest}
     */
    function syncAttributes() {
        let val,
        type= this.elms.src.nodeName.toLowerCase(),
        disabled= this.config.disabled= this.elms.src.disabled;

        if(type === 'select'){
            if(this.elms.src.selectedIndex>-1){
                val= this.elms.src[this.elms.src.selectedIndex].value;
            }else {
                val = '';
            }
        }else {//type === 'input'
            val = this.elms.src.value;
        }

        if(val===''){
            this.elms.falseInput.value = '';
        }

        if (disabled) {
            if (this.vars.isOpen) {
                clearItems.call(this);
            }
            disable.call(this);
        } else {
            enable.call(this);
        }
    }

    /**
     * Observe hidden field to enable/disable false input if required
     */
    function observeMutations()
    {
        let el= this.elms.src,
            that= this,
            nodeobserver= new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.attributeName === "disabled") {
                        if(el.disabled){
                            disable.call(that);
                            clearValues.call(that);
                        }else {
                            enable.call(that);
                        }
                    }
                });
            });
            
        nodeobserver.observe(el, {
            attributes: true
        });
    }

    /**
     * @this {JSuggest}
     * @param {*} selector 
     * @param {*} opt 
     * @returns 
     */
    function setup(selector, opt)
    {
        let src= null;
        if ( !selector ) {
            throw new Error("You must supply either a HTMLInputElement, HTMLSelectElement or a CSS3 selector string.");
        } else if (typeof selector === 'string'){
            src = document.querySelector(selector);
        }else if ( selector.nodeType ){
            if(selector.getAttribute("data-jsuggest")){//already a jsuggest element
                return false;
            }
            src= selector;
        }
        if (!src) throw new Error("JSuggest element not found.");
        if (!/^(?:input|select)$/i.test(src.nodeName.toLowerCase())) throw new Error("The element is not a HTMLInputElement or HTMLSelectElement.");
        src.setAttribute('data-randid', Math.random().toString(36).slice(2));
        this.config= setConfig(opt, src);
        
        this.vars=Object.assign({}, vars, {});
     /*    {
            req:null,
            isOpen:null,
            selected:null,
            keypressCounter:0,
            debounceTimer:undefined, 
            items:[]
        }; */

        this.elms= wrapSourceElement(src, this.config);

        setFalseInput(this.elms.falseInput, src);
        syncAttributes.call(this);
        observeMutations.call(this);
        return true;
    }

    /**
     * @this {JSuggest}
     */
    function bindEvents() 
    {
        let elms= this.elms,
            li={};
        for (let i in l) {
            li[i]= l[i].bind(this);
         }

        // add event handlers
        elms.container.addEventListener("focus", li.containerFocusListener);
        if(elms.hasOwnProperty('falseClear') && elms.falseClear) elms.falseClear.addEventListener("click", li.falseClearClickListener);
        elms.falseInput.addEventListener('search', li.falseClearClickListener);//nuevo
        elms.falseInput.addEventListener('focus', li.falseInputFocusListener);
        elms.falseInput.addEventListener('change', li.falseInputChangeListener);
        elms.realInput.addEventListener("keydown", li.realInputKeydownListener);
        elms.realInput.addEventListener(env.keyUpEventName, li.realInputKeyupListener);
        elms.realInput.addEventListener("blur", li.realInputBlurListener);
        elms.realInput.addEventListener("focus", li.realInputFocusListener);
        elms.container.addEventListener('focus', li.containerFocusListener);
        elms.container.addEventListener('containerMousedown', li.containerMousedownListener);
        
    }

    /**
     * @this {JSuggest}
     */
    function destroy()
    {

        this.elms.realInput.removeEventListener("focus", l.realInputFocusListener);
        this.elms.realInput.removeEventListener("keydown", l.realInputKeydownListener);
        this.elms.realInput.removeEventListener(this.vars.keyUpEventName, l.realInputKeyupListener);
        this.elms.realInput.removeEventListener("blur", l.realInputBlurListener);
        this.elms.container.removeEventListener('focus', l.containerFocusListener);
        this.elms.container.removeEventListener('mousedown', l.containerMousedownListener);
        if(this.elms.hasOwnProperty('falseClear') && this.elms.falseClear) this.elms.falseClear.removeEventListener('click', l.falseClearClickListener);
        this.elms.falseInput.removeEventListener('search', l.falseClearClickListener);//nuevo

        //window.removeEventListener("resize", resizeEventHandler);//@todo
       // document.removeEventListener("scroll", scrollEventHandler, true);//@todo
        clearDebounceTimer.call(this);
        clearItems.call(this);
    }

    /**
     * Clear view and autocomplete state
     * @this {JSuggest}
     */
    function focus() 
    {
        l.falseInputFocusListener.call(this);
    }

    /**
    *
    * @param {Object} data
    * @this {JSuggest} 
    */
    function setSourceValue(data){
       let src= this.elms.src,
       type = src.nodeName.toLowerCase();

       if(type === 'select'){
        src.length = 0;
        src.appendChild(createElement('option', {
               value: data.id,
               text: data.value,
               selected: 'selected'
           }));
       }else if(type === 'input'){
           createElement(src, {
               value: data.id,
               title: data.value + '. ' + data.id
           });
       }
    }

    /**
     * @this {JSuggest} 
     * @param {JsonApiSpec} spec
     */
    function setValue(spec){

       if(!(spec instanceof JsonApiSpec)){
           throw new Error ('Invalid argument. expected instance of JsonApiSpec, got ' + typeof spec)
       }
       if(this.vars.selected!== spec) this.vars.selected= spec;

        let tpl= suggestCache.getTemplate(spec).
            e= createElement$1(this.elms.falseInput,
            {
                value: spec.toString(),
                title: spec.toString() + '. ' + spec.id,
                idx: spec.id
            }
        );

        if(tpl){
           tpl.setInput(e);
       }

       setSourceValue.call(this, {id: spec.id, value: spec.toString()});
    }

    /**
     * @param {HTMLInputElement|HTMLSelectElement} elm 
     * @param {HTMLInputElement|HTMLSelectElement} cp 
     * @returns void
     */
    function copy (elm){
        let that=suggestCache.get(elm);

        if(!that) return;
        let val, id, spec,
            src= that.getSource(),
            type = src.nodeName.toLowerCase();

        if(type === 'select'){
            if(src.selectedIndex>-1){
                val= src[src.selectedIndex].innerHTML;
                id= src[src.selectedIndex].value;
            }else {
                val = '';
            }
        }else {//type === 'input'
            val = src.value;
            id= src.value;
        }
        if(val==='') return
        spec={
            id: id,
            attributes: {
                name: val
            },
            type: src.dataset.specType
        };
        sessionStorage.setItem(elm.name+'.spec', JSON.stringify(spec));
    }

    /**
     * @param {HTMLInputElement|HTMLSelectElement} elm 
     * @param {HTMLInputElement|HTMLSelectElement} cp 
     * @returns void
     */
    function paste (elm){
            let
            spec= sessionStorage.getItem(elm.name+'.spec'),
            that=suggestCache.get(elm),
            jas
        ;
        if(spec && that){
            jas= new JsonApiSpec(JSON.parse(spec));
            jas.toString= ()=> jas.attributes.name;
            that.setValue(new JsonApiSpec(JSON.parse(spec)));
        }
    }

    /**
     * Create a suggest from request or from JSON file|inline data
     * @constructor
     * @param {String|Object} selector
     * @param {null|Object} opt
     *  <script>
     * import response from './organisations.json' assert { type: 'json' };
     *
     * //create a JsonApiManager instance from file
     * let jam = (new JsonApiManager(response.data, response.included||null)).getParsed();
     *
     *
     * const testElm= document.querySelector('.testElement')
     *
     *  //create JSuggest instance with fetch argument
     *  let test= new JSuggest(testElm, {fetch:jam});
     *
     * </script>

     */
    function JSuggest (selector, opt)
    {
        if (!(this instanceof JSuggest)) return new JSuggest(selector, opt)

        if(!setup.call(this, selector, opt)) return;
        bindEvents.call(this);
        suggestCache.addInstance(this.elms.src.dataset.randid, this);
    }

    JSuggest.prototype.destroy= function(){
        destroy.call(this); 
        return this
    };

    JSuggest.prototype.focus= function(){
        focus.bind(this); 
        return this
    };
    JSuggest.prototype.disable= function(){
        disable.call(this); 
        return this
    };
    JSuggest.prototype.enable= function(){
        enable.call(this); 
        return this
    };
    JSuggest.prototype.clearItems= function(){
        clearItems.call(this); 
        return this
    };
    JSuggest.prototype.clearValues= function(){
        clearValues.call(this); 
        return this
    };
    /**
     * @param {JsonApiSpec} spec
     */
    JSuggest.prototype.setValue= function(spec){
        setValue.call(this, spec); 
        return this
    };

    JSuggest.prototype.update= function(){
        update.call(this); 
        return this
    };

    JSuggest.prototype.getInstance= function(el){
        return JSuggest.cache.getInstance(el)
    };

    JSuggest.prototype.getSource= function(){
        return this.elms.source;
    };

    JSuggest.cache= suggestCache;
    JSuggest.copy= copy;
    JSuggest.paste= paste;

    window.JSuggest= JSuggest;

    return JSuggest;

})();
