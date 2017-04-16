const redis = require('redis');
const _ = require('lodash');
const genericPool = require('generic-pool');

module.exports = function(config) {
  const factory = {
    create: function() {
      return new Promise(function(resolve, reject) {
        console.log('Creating a new redis client');

        let client = redis.createClient({
          host: config.host,
          port: config.port,
          retry_strategy: function(options) {
            if (options.error && options.error.code === 'ECONNREFUSED') {
              return new Error('The server refused the connection');
            }
            if (options.total_retry_time > 5000) {
              return new Error('Retry time exhausted');
            }
            if (options.times_connected > 5) {
              return undefined;
            }

            return 1000;
          }
        });

        client.on('connect', function() {
          resolve(client);
        });

        client.on('error', function(error) {
          return reject(error);
        });
      });
    },
    destroy: function(client) {
      return new Promise(function(resolve) {
        console.log('Destroying a redis client');

        client.on('end', function() {
          resolve();
        });

        client.quit();
      });
    }
  };

  let connections = genericPool.createPool(factory, config.pool);

  /**
   * A function will call the {method} from redis and resolve the response
   */
  function _exec(method, args) {
    return connections.acquire().then(function(client) {
      return new Promise((resolve, reject) => {
        args = _.values(args);

        let cb = (error, result) => {
          if (error) {
            return connections.destroy(client).then(_ => reject(error));

          }

          connections.release(client);
          resolve(result);
        };

        if (method === 'multi' || method === 'batch') {
          return client[method].apply(client, args).exec(cb);
        }

        args.push(cb);
        client[method].apply(client, args);
      });
    });
  }

  /**
   * A proxy function will forward any method call to this module to the
   * _exec method with the same aguments beside the method name.
   */
  function redisProxy(obj) {
    let handler = {
      get(target, propKey) {
        return function() {
          return _exec(propKey, arguments);
        };
      }
    };
    return new Proxy(obj, handler);
  }

  return redisProxy({})
}
