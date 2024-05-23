
/**
 * Select the next item in suggestions
 *
 * @this {JSuggest}
 */
export default function selectNext() {
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