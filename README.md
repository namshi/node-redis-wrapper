# node-redis-wrapper

A small, promise-based, pooled wrapper for the `redis` module:
we re-use the same code across a bunch of modules, hence this
abstraction.

## Usage

Given a confg object such as:

```
host: redis
port: 6379
pool:
  max: 20
  min: 2
  acquireTimeoutMillis: 3000
```

You can then start using redis with:

``` js
const redis = require('node-redis-wrapper')(config)

redis.del('some-key').then(...).catch(...)

// or with async/await

await redis.del('some-key')
```

## Custom constructor

If you want to control how the redis client is created (eg. to use [redis-sentinel](https://www.npmjs.com/package/redis-sentinel) & the likes), you can just specify a `createClient` function in the config:

``` js
let config = {...}

config.createClient = function() {
  require('redis-sentinel').createClient(...options...)
}

const redis = require('node-redis-wrapper')(config)
```
