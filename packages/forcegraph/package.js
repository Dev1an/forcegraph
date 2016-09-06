Package.describe({
  name: 'devian:forcegraph',
  version: '0.0.4',
  // Brief, one-line summary of the package.
  summary: 'A forcegraph that visualizes nodes and messages between these nodes',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/Dev1an/forcegraph',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.3.2.4');
  api.use(['ecmascript', 'tracker', 'templating']);
  api.mainModule('forcegraph.js', 'client');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('devian:forcegraph');
  api.mainModule('forcegraph-tests.js');
});

Npm.depends({
  d3: "3.5.17"
});