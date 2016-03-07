
/*
Copyright (c) 2014, Groupon, Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions
are met:

Redistributions of source code must retain the above copyright notice,
this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright
notice, this list of conditions and the following disclaimer in the
documentation and/or other materials provided with the distribution.

Neither the name of GROUPON nor the names of its contributors may be
used to endorse or promote products derived from this software without
specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var WELCOME_MESSAGE, _nodeModulePaths, _resolveFilename, collectPublicMethods, collectPublicMethodsDeep, config, exportToContext, getBrowser, getConfig, getMethods, path, prepareRequireExtensions, ref, ref1;

WELCOME_MESSAGE = "WebDriver repl!\nMethods are available in scope. Try: navigateTo('http://google.com')\nType `.methods` to see what's available.";

ref = require('module'), _resolveFilename = ref._resolveFilename, _nodeModulePaths = ref._nodeModulePaths;

path = require('path');

ref1 = require('testium-core'), getConfig = ref1.getConfig, getBrowser = ref1.getBrowser;

config = getConfig();

collectPublicMethods = function(obj) {
  var method, methods, prop;
  methods = [];
  for (prop in obj) {
    method = obj[prop];
    if (typeof method === 'function' && prop[0] !== '_') {
      methods.push(prop);
    }
  }
  return methods;
};

collectPublicMethodsDeep = function(obj) {
  var proto;
  if (obj == null) {
    return [];
  }
  proto = Object.getPrototypeOf(obj);
  return collectPublicMethods(obj).concat(collectPublicMethodsDeep(proto));
};

getMethods = function(browser) {
  var methods;
  methods = collectPublicMethodsDeep(browser);
  return methods.sort().join(', ');
};

exportToContext = function(browser, context) {
  var methods;
  context.browser = browser;
  context.assert = browser.assert;
  methods = collectPublicMethodsDeep(browser);
  return methods.forEach(function(method) {
    return context[method] = browser[method].bind(browser);
  });
};

prepareRequireExtensions = function(pretendModule, replModule) {
  var COFFEE, REDUX, coffeeModule;
  REDUX = /coffee-script-redux(?:\/lib)?\/repl(?:\.js)?$/;
  if (REDUX.test(replModule)) {
    coffeeModule = _resolveFilename('coffee-script-redux/register', pretendModule, false);
    require(coffeeModule);
  }
  COFFEE = /coffee-script(?:\/lib)?\/repl(?:\.js)?$/;
  if (COFFEE.test(replModule)) {
    coffeeModule = _resolveFilename('coffee-script/register', pretendModule, false);
    return require(coffeeModule);
  }
};

module.exports = function() {
  var Repl, browserName, pretendFilename, pretendModule, replModule;
  browserName = config.browser;
  console.error("Preparing " + browserName + "...");
  pretendFilename = path.resolve(config.root, 'repl');
  pretendModule = {
    filename: pretendFilename,
    paths: _nodeModulePaths(pretendFilename)
  };
  replModule = _resolveFilename(config.repl.module, pretendModule, false);
  prepareRequireExtensions(pretendModule, replModule);
  Repl = require(replModule);
  return getBrowser({
    useApp: false
  }).done(function(browser) {
    var closeBrowser, startRepl;
    closeBrowser = function() {
      return browser.close(function(error) {
        if (error == null) {
          return;
        }
        error.message = error.message + " (while closing browser)";
        throw error;
      });
    };
    startRepl = function() {
      var repl;
      repl = Repl.start({
        prompt: browserName + "> "
      });
      exportToContext(browser, repl.context);
      repl.on('exit', function() {
        return browser.close(function() {
          return process.exit(0);
        });
      });
      return repl.defineCommand('methods', {
        help: 'List available methods',
        action: function() {
          repl.outputStream.write(getMethods(browser));
          return repl.displayPrompt();
        }
      });
    };
    process.on('exit', closeBrowser);
    process.on('uncaughtException', function(error) {
      closeBrowser();
      throw error;
    });
    console.error(WELCOME_MESSAGE);
    return startRepl(browser);
  });
};
