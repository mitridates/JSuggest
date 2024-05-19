import terser from '@rollup/plugin-terser';
//run rollup -c
export default {
    input: './src/script/main.js',
    output: [
        {
            file: './dist/JSuggest.iife.1.0.js',
            format: 'iife',
            name: 'JSuggest',
            

        },
        {
            file: './dist/JSuggest.iife.1.0.min.js',
            format: 'iife',
            name: 'JSuggest',
            plugins: [terser()]
        }
    ]
}