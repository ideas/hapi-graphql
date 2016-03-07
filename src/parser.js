'use strict';

// Load external modules
const Stream = require('stream');

exports.parse = function (request) {
  return new Promise((resolve, reject) => {
    if (request.payload instanceof Stream) {
      let data = '';
      request.payload.on('data', chunk => data += chunk);
      request.payload.on('end', () => {
        resolve(request.mime === 'application/graphql' ? { query: data } : JSON.parse(data));
      });
    } else {
      resolve('{}');
    }
  });
};
