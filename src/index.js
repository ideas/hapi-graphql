'use strict';

// Load external modules
const Boom = require('boom');
const GraphQL = require('graphql');

// Load internal modules
const Parser = require('./parser');
const Validator = require('./validator');

function getGraphQLParams(request, payload) {
  payload = payload || {};

  const query = request.query.query || payload.query;

  let variables = request.query.variables || payload.variables;
  if (variables && typeof variables === 'string') {
    try {
      variables = JSON.parse(variables);
    }
    catch (error) {
      throw Boom.badRequest('Variables are invalid JSON.');
    }
  }

  const operationName = request.query.operationName || payload.operationName;

  return { query, variables, operationName };
};

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
        const response = Parser.parse(request)
          .then((payload) => {
            const params = getGraphQLParams(request, payload);
            return GraphQL.graphql(schema, params.query, {}, params.variables, params.operationName);
          });

        reply(response);
      }
    };

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
