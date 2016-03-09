# hapi-graphql

[![npm](https://img.shields.io/npm/v/@ideapod/hapi-graphql.svg)](https://www.npmjs.com/package/@ideapod/hapi-graphql)
[![Build Status](https://travis-ci.org/ideas/hapi-graphql.svg?branch=master)](https://travis-ci.org/ideas/hapi-graphql)
[![Dependency Status](https://david-dm.org/ideas/hapi-graphql.svg)](https://david-dm.org/ideas/hapi-graphql)

GraphQL plugin for hapi.

## Installation

```sh
npm install --save @ideapod/hapi-graphql
```

## Configuration

The plugin accepts an `options` object where:
  - `query`: Query configuration object.
    - `schema`: Name of the plugin which contains the GraphQL schema. Required. Plugin has to expose the `GraphQLSchema` schema instance from [`graphql-js`](https://github.com/graphql/graphql-js) under the `schema` property.
    - `rootValue`: A value to pass as the rootValue to the `graphql()` function from [`graphql-js`](https://github.com/graphql/graphql-js).
    - `pretty`: If `true`, any JSON response will be pretty-printed.
  - `route`: Route configuration object.
    - `path`: Path of the GraphQL endpoint. Defaults to `/graphql`.
    - `config`: Additional [route options](https://github.com/hapijs/hapi/blob/master/API.md#route-options).

```javascript
const plugin = {
  register: HapiGraphQL,
  options: {
    query: {
      schema: 'src/graphql/schema',
      rootValue: {},
      pretty: false
    },
    route: {
      path: '/graphql',
      config: {}
    }
  }
};
```

## Usage

### Registration

The plugin can be registered as a hapi plugin. Example:

```javascript
const Hapi = require('hapi');
const HapiGraphQL = require('@ideapod/hapi-graphql');

const server = new Hapi.Server();
server.connection();

const plugin = {
  register: HapiGraphQL,
  options: {
    query: {
      schema: 'src/graphql/schema'
    }
  }
};

server.register(plugin, (err) => {
  // ...
});
```
