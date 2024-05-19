
/**
 * @this {JSuggest}
 */
export default function clearItems() 
{
    this.vars.items.length=0;
    this.vars.keypressCounter++
    this.vars.selected = undefined
    while (this.elms.container.firstChild) {
        this.elms.container.removeChild(this.elms.container.lastChild);
    }
    this.elms.falseInput.tabIndex= 0
    this.elms.realInput.tabIndex = -1
    this.elms.container.style.display='none'
    this.vars.isOpen=false
}