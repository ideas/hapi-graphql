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
    string += (`?${QueryString.stringify(params)}`);
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

    lab.it('allows GET with variable values', { plan: 1 }, () => {
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
            query: 'query helloWho($who: String){ test(who: $who) }',
            variables: JSON.stringify({ who: 'Dolly' })
          });

          return server.inject(url);
        })
        .then((response) => {
          expect(response.payload).to.equal('{"data":{"test":"Hello Dolly"}}');
        });
    });

    lab.it('allows GET with operation name', { plan: 1 }, () => {
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
            query: `
              query helloYou { test(who: "You"), ...shared }
              query helloWorld { test(who: "World"), ...shared }
              query helloDolly { test(who: "Dolly"), ...shared }
              fragment shared on QueryRoot {
                shared: test(who: "Everyone")
              }
            `,
            operationName: 'helloWorld'
          });

          return server.inject(url);
        })
        .then((response) => {
          expect(response.result).to.deep.equal({
            data: {
              test: 'Hello World',
              shared: 'Hello Everyone'
            }
          }, { prototype: false });
        });
    });

    lab.it('reports validation errors', { plan: 2 }, () => {
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
            query: '{ test, unknownOne, unknownTwo }'
          });

          return server.inject(url);
        })
        .then((response) => {
          expect(response.statusCode).to.equal(400);
          expect(response.result).to.deep.equal({
            errors: [
              {
                message: 'Cannot query field "unknownOne" on type "QueryRoot".',
                locations: [{ line: 1, column: 9 }]
              },
              {
                message: 'Cannot query field "unknownTwo" on type "QueryRoot".',
                locations: [{ line: 1, column: 21 }]
              }
            ]
          }, { prototype: false });
        });
    });

    lab.it('errors when missing operation name', { plan: 2 }, () => {
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
            query: `
              query TestQuery { test }
              mutation TestMutation { writeTest { test } }
            `
          });

          return server.inject(url);
        })
        .then((response) => {
          expect(response.statusCode).to.equal(400);
          expect(response.result).to.deep.equal({
            errors: [
              { message: 'Must provide operation name if query contains multiple operations.' }
            ]
          }, { prototype: false });
        });
    });

    lab.it('errors when sending a mutation via GET', { plan: 2 }, () => {
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
            query: 'mutation TestMutation { writeTest { test } }'
          });

          return server.inject(url);
        })
        .then((response) => {
          expect(response.statusCode).to.equal(405);
          expect(response.result.message).to.equal(
            'Can only perform a mutation operation from a POST request.'
          );
        });
    });

    lab.it('errors when selecting a mutation within a GET', { plan: 2 }, () => {
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
            operationName: 'TestMutation',
            query: `
              query TestQuery { test }
              mutation TestMutation { writeTest { test } }
            `
          });

          return server.inject(url);
        })
        .then((response) => {
          expect(response.statusCode).to.equal(405);
          expect(response.result.message).to.equal(
            'Can only perform a mutation operation from a POST request.'
          );
        });
    });

    lab.it('allows a mutation to exist within a GET', { plan: 2 }, () => {
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
            operationName: 'TestQuery',
            query: `
              mutation TestMutation { writeTest { test } }
              query TestQuery { test }
            `
          });

          return server.inject(url);
        })
        .then((response) => {
          expect(response.statusCode).to.equal(200);
          expect(response.result).to.deep.equal({
            data: {
              test: 'Hello World'
            }
          }, { prototype: false });
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
