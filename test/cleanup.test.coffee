{exec, execFile} = require 'child_process'

assert = require 'assertive'
rimraf = require 'rimraf'
{extend} = require 'lodash'

LOG_DIRECTORY = "#{__dirname}/cleanup_log"
ENV_OVERRIDES =
  testium_logDirectory: LOG_DIRECTORY

MOCHA_NOISE =
  '(node) child_process: options.customFds option is deprecated. Use options.stdio instead.\n'

getNumProcesses = (done) ->
  exec 'ps', (err, stdout, stderr) ->
    return done(err) if err?
    numProcesses = stdout.split('\n').length - 1 # header line
    done null, numProcesses

testFile = ({file, envOverrides, exitCode, outputMatcher, done}) ->
  envOverrides ?= {testium_app: null}
  getNumProcesses (err, numProcessesBefore) ->
    return done(err) if err?
    mocha = execFile './node_modules/.bin/mocha', [ file ], {
      env: extend(envOverrides, ENV_OVERRIDES, process.env)
    }, (err, stdout, stderr) ->
      output = ("#{stdout}\n#{stderr}").replace MOCHA_NOISE, ''
      if outputMatcher
        assert.match 'output does not match matcher', outputMatcher, output

      try
        assert.equal 'mocha exit code', exitCode, mocha.exitCode

        getNumProcesses (err, numProcessesAfter) ->
          return done(err) if err?
          assert.equal 'number of processes before & after', numProcessesBefore, numProcessesAfter
          done()

      catch exitCodeError
        console.error output
        done exitCodeError


describe 'Cleanup test', ->
  before "rm -rf #{LOG_DIRECTORY}", (done) ->
    rimraf LOG_DIRECTORY, done
    return

  it 'cleans up all child apps after exit without any exceptions', (done) ->
    @timeout 10000
    testFile {
      file: 'test/cleanup_happy_test.test.coffee'
      exitCode: 0
      stderrMatcher: /^$/
      done
    }
    return

  it 'cleans up all child apps after uncaught exception', (done) ->
    @timeout 10000
    testFile {
      file: 'test/cleanup_exception_test.test.coffee'
      exitCode: 1
      stderrMatcher: /1 failing/
      done
    }
    return

  it 'cleans up all child apps after child dies', (done) ->
    @timeout 10000
    testFile {
      file: 'test/cleanup_dead_child_test.test.coffee'
      envOverrides:
        testium_app__command: './node_modules/.bin/coffee test/cleanup_dead_child_app.coffee'
        testium_app__port: 1337
      exitCode: 1
      done
    }
    return

  it 'cleans up all child apps if child is non-existent', (done) ->
    @timeout 10000
    testFile {
      file: 'test/cleanup_no_child_test.test.coffee'
      envOverrides:
        testium_app__command: './node_modules/.bin/coffee test/this_can_be_whatever.coffee'
        testium_app__port: 1337
      exitCode: 1
      done
    }
    return
