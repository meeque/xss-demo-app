const fs = require('fs');

module.exports = function(config) {

  // static config
  const cfg = {
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-spec-reporter'),
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
    reporters: ['kjhtml', 'spec'],
    customLaunchers: {
      // the XSS Demo App is being developed in an lxc container
      // this seems to cause trouble with app armor sandboxing
      // on the other hand, additional sandboxing is less necessary when already running in a container
      ChromiumHeadlessContainerized: {
        base: 'ChromiumHeadless',
        flags: ['--no-sandbox', '--ignore-certificate-errors']
      }
    },
    browsers: ['ChromiumHeadlessContainerized'],
    restartOnFileChange: true
  };

  // dynamic https config
  // only if X.509 cert is available, see "tls" directory
  {
    let secureContextOptions;
    try {
      secureContextOptions = {
        cert: fs.readFileSync('tls/xss-dev.cert.pem', 'utf8'),
        key: fs.readFileSync('tls/private/xss-dev.key.pem', 'utf8')
      }
    } catch(e) {
      console.error('XSS Demo App: Failed to read xss-dev certificate files at expected location in the project\'s "tls" directory:', e);
    }

    if (secureContextOptions) {
      console.warn('XSS Demo App: Launching Karma test server with TLS config from the project\'s "tls" directory...');
      cfg.protocol = 'https:';
      cfg.httpsServerOptions = secureContextOptions;
    } else {
      console.warn('XSS Demo App: Launching Karma test server without TLS. Some integration tests may fail!');
    }
  }

  config.set(cfg);
};
