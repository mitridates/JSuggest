/**
 * Basic create/modify HTMLElement
 * @param {string|HTMLElement} e String to createElement or HTMLElement to modify  
 * @param  {Object} [a] attrinbutes
 * @return HTMLElement
 */
export default function createElement(e, a) {
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