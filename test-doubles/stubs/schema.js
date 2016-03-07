'use strict';

const GraphQL = require('graphql');

exports.register = function (server, options, next) {
  const QueryRootType = new GraphQL.GraphQLObjectType({
    name: 'QueryRoot',
    fields: {
      test: {
        type: GraphQL.GraphQLString,
        args: {
          who: {
            type: GraphQL.GraphQLString
          }
        },
        resolve: (source, args) => 'Hello ' + (args.who || 'World')
      },
      thrower: {
        type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString),
        resolve: () => { throw new Error('Throws!'); }
      }
    }
  });

  const TestSchema = new GraphQL.GraphQLSchema({
    query: QueryRootType,
    mutation: new GraphQL.GraphQLObjectType({
      name: 'MutationRoot',
      fields: {
        writeTest: {
          type: QueryRootType,
          resolve: () => ({})
        }
      }
    })
  });

  server.expose('schema', TestSchema);

  next();
};

exports.register.attributes = {
  name: 'stubs/schema'
};
