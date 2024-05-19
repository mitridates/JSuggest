/**
 * @this {JSuggest}
 */
export default function selectPrev() {
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