
module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {
        // possible options are listed at:
        // https://jasmine.github.io/api/edge/Configuration.html
      },
    },
    jasmineHtmlReporter: {
      suppressAll: true // removes the duplicated traces
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/xss-demo-app'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' }
      ]
    },
    reporters: ['progress', 'kjhtml'],
    customLaunchers: {
      // the XSS Demo App is being developed in an lxc container
      // this seems to cause trouble with app armor sand boxing
      // on the other hand, additional sandboxing is less necessary when already running in a container
      ChromiumHeadlessContainerized: {
        base: 'ChromiumHeadless',
        flags: ['--no-sandbox']
      }
    },
    browsers: ['ChromiumHeadlessContainerized'],
    restartOnFileChange: true
  });
};
