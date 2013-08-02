# strophe.customheaders.js

strophe.customheaders.js is a plugin to set custom headers on all the XHR traffic sent by a `Strophe.Connection`

## Usage

```javascript
var conn = new Strophe.Connection(url);
conn.customHeaders = {
  'X-Special-Header': 'Something'
};
```
