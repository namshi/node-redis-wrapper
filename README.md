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
const redis = require('node-redis-wrapper')

redis.del('some-key').then(...).catch(...)

// or with async/await

await redis.del('some-key')
```
