'use strict';

// Load external modules
const Joi = require('joi');

const schema = {
  query: Joi.object({
    schema: Joi.string().required(),
    rootValue: Joi.object(),
    pretty: Joi.boolean()
  }).required(),
  route: Joi.object({
    path: Joi.string().min(2),
    config: Joi.object()
  })
};

const defaults = {
  query: {
    rootValue: {},
    pretty: false
  },
  route: {
    path: '/graphql'
  }
};

exports.validate = function (options) {
  const validation = Joi.validate(options, schema);
  validation.value = Object.assign({}, defaults, validation.value);

  return validation;
};
