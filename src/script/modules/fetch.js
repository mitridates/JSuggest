import update from "./suggest.update.js";
import clearItems from "./item.clearItems.js";
import { filter } from "./filter.js";
/** 
 * Clear debouncing timer if assigned 
 * @this {JSuggest}
 * */
export function clearDebounceTimer() {
    if (this.vars.debounceTimer) window.clearTimeout(this.vars.debounceTimer)
}

/**
 * @param {int} trigger
 * @this {JSuggest}
 */
export default function startFetch(trigger/*1== Focus, 0== other input Keyboard */) 
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
                fetchXhr.call(that, val, fetchCallback , 0 /* Keyboard */)
            }else if(that.config.fetch){
                that.vars.items= filter(that.config, val);
                that.vars.selected=that.vars.items.length? that.vars.items[0]: undefined;
                update.call(that);
            }else{
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
export function fetchXhr(text, fetchCallback, trigger) {
    let
        path = this.config.path,
        res, jam, xhr
    ;

    // abort request while typing
    try {this.vars.req.abort(); } catch(e){}

    this.vars.req = xhr =  new XMLHttpRequest()//new request

    //responseType='json' ante una excepción sólo devuelve status y statusText
    //lo malo. En dev te resta información
    //lo bueno. En prod no muestra errores internos

    xhr.responseType='json'

    xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
            res= xhr.response;
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
            // }
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
}