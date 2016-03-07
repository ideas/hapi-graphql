'use strict';

const Hapi = require('hapi');
const Lab = require('lab');
const QueryString = require('querystring');

// Load internal modules
const HapiGraphql = require('..');
const StubSchema = require('../test-doubles/stubs/schema');

// Test shortcuts
const lab = exports.lab = Lab.script();
const expect = Lab.assertions.expect;

function urlString(params) {
  let string = '/graphql';

  if (params) {
    string += ('?' + QueryString.stringify(params));
  }

  return string;
}

lab.describe('Plugin', () => {
  lab.describe('GET functionality', () => {
    lab.it('allows GET with query param', { plan: 1 }, () => {
      const server = new Hapi.Server();
      server.connection();

      const plugins = [
        { register: StubSchema },
        { register: HapiGraphql, options: { query: { schema: 'stubs/schema' } } }
      ];

      return server.register(plugins)
        .then(() => server.initialize())
        .then(() => {
          const url = urlString({
            query: '{test}'
          });

          return server.inject(url);
        })
        .then((response) => {
          expect(response.payload).to.equal('{"data":{"test":"Hello World"}}');
        });
    });
  });

  lab.describe('POST functionality', () => {
    lab.it('allows POST with JSON encoding', { plan: 1 }, () => {
      const server = new Hapi.Server();
      server.connection();

      const plugins = [
        { register: StubSchema },
        { register: HapiGraphql, options: { query: { schema: 'stubs/schema' } } }
      ];

      return server.register(plugins)
        .then(() => server.initialize())
        .then(() => {
          const url = urlString();
          const payload = { query: '{test}' };

          return server.inject({ method: 'POST', url, payload });
        })
        .then((response) => {
          expect(response.payload).to.equal('{"data":{"test":"Hello World"}}');
        });
    });
  });
});
