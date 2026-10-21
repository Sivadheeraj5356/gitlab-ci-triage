const assert = require('assert');
const { analyzeLog } = require('./app.js');

const dependency = analyzeLog('npm error ERESOLVE unable to resolve dependency tree\n503 Service Unavailable');
assert.equal(dependency.type, 'Dependency or install failure');
assert.ok(dependency.confidence >= 70);

const docker = analyzeLog('Cannot connect to the Docker daemon at unix:///var/run/docker.sock');
assert.equal(docker.type, 'Docker or runner failure');

const unknown = analyzeLog('plain checkout complete');
assert.equal(unknown.type, 'Needs manual review');

console.log('3 tests passed');
