const postcss = require('rollup-plugin-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

module.exports = {
  rollup(config, options) {
    config.plugins.push(
      postcss({
        plugins: [
          autoprefixer(),
          cssnano({
            preset: 'default'
          })
        ],
        use: ['sass'],
        inject: false,
        // only write out CSS for the first bundle (avoids pointless extra files):
        extract: true,
        modules: true
      })
    );
    return config;
  }
};
