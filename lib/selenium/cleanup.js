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

// Generated by CoffeeScript 2.0.0-beta7
void function () {
  var async, cache$, cleanupChrome, cleanupPhantomJS, existsSync, killProcess, logError, unlinkSync;
  async = require('async');
  logError = require('../log/error');
  cache$ = require('fs');
  unlinkSync = cache$.unlinkSync;
  existsSync = cache$.existsSync;
  module.exports = function (seleniumProcess, proxyProcess, callback) {
    cleanupChrome();
    cleanupPhantomJS();
    return async.parallel([
      function (taskDone) {
        return killProcess('selenium', seleniumProcess, taskDone);
      },
      function (taskDone) {
        return killProcess('proxy', proxyProcess, taskDone);
      }
    ], callback);
  };
  cleanupChrome = function () {
    var error, file;
    file = '' + __dirname + '/../../libpeerconnection.log';
    try {
      if (existsSync(file))
        return unlinkSync(file);
    } catch (e$) {
      error = e$;
      return logError(error);
    }
  };
  cleanupPhantomJS = function () {
    var error, file;
    file = '' + __dirname + '/../../phantomjsdriver.log';
    try {
      if (existsSync(file))
        return unlinkSync(file);
    } catch (e$) {
      error = e$;
      return logError(error);
    }
  };
  killProcess = function (name, proc, callback) {
    var error, exited;
    if (!(null != proc))
      return callback();
    if (proc.killed)
      return callback();
    error = null;
    exited = false;
    proc.on('error', function (err) {
      return error = err;
    });
    proc.on('exit', function () {
      exited = true;
      return callback(error);
    });
    proc.kill('SIGKILL');
    return setTimeout(function () {
      if (!exited)
        return callback(new Error('[testium] failed to cleanup ' + name + ' (pid=' + proc.pid + ') process; check the ' + name + '.log.'));
    }, 2e3);
  };
}.call(this);