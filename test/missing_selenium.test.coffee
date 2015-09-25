fs = require 'fs'
{execFile} = require 'child_process'

assert = require 'assertive'
rimraf = require 'rimraf'
{extend} = require 'lodash'

LOG_DIRECTORY = "#{__dirname}/missing_selenium_log"
TEST_FILE = 'test/integration/cookie.test.coffee'

ENV_OVERRIDES = {
  testium_browser: 'firefox'
  testium_selenium__jar: '/tmp/no_such_jar.jar'
  testium_logDirectory: LOG_DIRECTORY
}

describe 'Missing selenium', ->
  before "rm -rf #{LOG_DIRECTORY}", (done) ->
    rimraf LOG_DIRECTORY, done

  before 'run failing test suite', (done) ->
    @timeout 10000
    mocha = execFile './node_modules/.bin/mocha', [ TEST_FILE ], {
      env: extend(ENV_OVERRIDES, process.env)
    }, (err, @stdout, @stderr) =>
      try
        assert.equal 1, mocha.exitCode
        done()
      catch exitCodeError
        console.log "Error: #{err.stack}"
        console.log "stdout: #{@stdout}"
        console.log "stderr: #{@stderr}"
        done exitCodeError

  it 'mentions useful options', ->
    assert.include '$ ./node_modules/.bin/testium --download-selenium', @stdout
    assert.include '[selenium]\njar =', @stdout
