module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '../',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    files: [
      'node_modules/jquery/dist/jquery.js',
      'node_modules/angular/angular.js',
      'node_modules/angular-sanitize/angular-sanitize.js',
      'node_modules/angular-ui-bootstrap/ui-bootstrap-tpls.js',
      'node_modules/angular-translate/dist/angular-translate.js',
      'node_modules/angular-translate-loader-static-files/angular-translate-loader-static-files.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'node_modules/openlayers/build/ol-custom.js',
      'src/anol/anol.js',
      'src/anol/helper.js',
      'src/anol/layer.js',
      'src/anol/layer/basewms.js',
      'src/anol/layer/feature.js',
      'src/anol/layer/staticgeojson.js',
      'src/anol/**/*.js',
      'src/modules/module.js',
      'src/modules/**/module.js',
      'src/modules/**/*.js',
      'test/spec/**/*.js',
      'src/modules/**/*.html'
    ],

    // list of files to exclude
    exclude: [

    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
        "src/modules/**/*.html": ["ng-html2js"]
    },

    ngHtml2JsPreprocessor: {
        // the name of the Angular module to create
        moduleName: "mocked-templates"
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // Start these browsers, currently installed from us:
    // - Chrome
    // - Firefox
    // - Safari (only Mac)
    // - PhantomJS
    browsers: ['PhantomJS'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true
  });
};