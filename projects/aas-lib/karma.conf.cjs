// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine'],
        plugins: [
            require('karma-jasmine'),
            require('karma-chrome-launcher'),
            require('karma-jasmine-html-reporter'),
            require('karma-junit-reporter'),
            require('karma-coverage'),
        ],
        client: {
            jasmine: {
                // you can add configuration options for Jasmine here
                // the possible options are listed at https://jasmine.github.io/api/edge/Configuration.html
                // for example, you can disable the random execution with `random: false`
                // or set a specific seed with `seed: 4321`
            },
        },
        files: [
            { pattern: './src/**/*.ts', type: 'js' },
        ],
        jasmineHtmlReporter: {
            suppressAll: true // removes the duplicated traces
        },
        junitReporter:{
            outputDir: require('path').join(__dirname, '../../reports'),
            outputFile: 'aas-lib.xml',
            useBrowserName: false
        },
        coverageReporter: {
            dir: require('path').join(__dirname, '../../reports/aas-lib'),
            subdir: '.',
            reporters: [
                { type: 'html' },
                { type: 'json-summary' },
                { type: 'cobertura' }
            ]
        },
        reporters: ['progress', 'kjhtml', 'junit'],
        browsers: ['Chrome', 'ChromeHeadlessNoSandbox'],
        customLaunchers: {
          ChromeHeadlessNoSandbox: {
            base: 'ChromeHeadless',
            flags: ['--no-sandbox']
          }
        },
        singleRun: false,
        restartOnFileChange: true
    });
};
