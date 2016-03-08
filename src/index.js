'use strict';

// Load external modules
const Boom = require('boom');
const GraphQL = require('graphql');

// Load internal modules
const Parser = require('./parser');
const Validator = require('./validator');

function getGraphQLParams(request, payload) {
  const query = request.query.query || payload.query;

  let variables = request.query.variables || payload.variables;
  if (variables && typeof variables === 'string') {
    try {
      variables = JSON.parse(variables);
    } catch (err) {
      throw Boom.badRequest('Variables are invalid JSON.');
    }
  }

  const operationName = request.query.operationName || payload.operationName;

  return { query, variables, operationName };
}

exports.register = function (server, options, next) {
  const validation = Validator.validate(options);

  if (validation.error) {
    next(validation.error);
    return;
  }

  const route = validation.value.route;
  const query = validation.value.query;

  server.dependency(query.schema, (server, next) => {
    const schema = server.plugins[query.schema].schema;

    function handler(route, options) {
      return function (request, reply) {
        Parser.parse(request)
          .then((payload) => {
            const params = getGraphQLParams(request, payload || {});

            if (!params.query) {
              return Boom.badRequest('Must provide query string.');
            }

            const source = new GraphQL.Source(params.query, 'GraphQL request');

            let documentAST;
            try {
              documentAST = GraphQL.parse(source);
            } catch (err) {
              return { errors: [err] };
            }

            const errors = GraphQL.validate(schema, documentAST);
            if (errors.length > 0) {
              return { errors };
            }

            if (request.method === 'get') {
              const operationAST = GraphQL.getOperationAST(documentAST, params.operationName);
              if (operationAST && operationAST.operation !== 'query') {
                return Boom.methodNotAllowed(
                  `Can only perform a ${operationAST.operation} operation from a POST request.`
                );
              }
            }

            return GraphQL.graphql(
              schema,
              params.query,
              query.rootValue,
              params.variables,
              params.operationName
            );
          })
          .then((result) => {
            if (result.errors) {
              const errors = result.errors.map((error) => {
                if (error.locations) {
                  return { message: error.message, locations: error.locations };
                }

                return { message: error.message };
              });

              reply({ errors }).code(400);
              return;
            }

            reply(result);
          });
      };
    }

    handler.defaults = function (method) {
      if (method === 'post') {
        return {
          payload: {
            output: 'stream'
          }
        };
      }

      return {};
    };

    server.handler('graphql', handler);

    server.route({
      method: ['get', 'post'],
      path: route.path,
      config: route.config,
      handler: {
        graphql: query
      }
    });

    next();
  });

  next();
};

exports.register.attributes = {
  name: 'hapi-graphql'
};
