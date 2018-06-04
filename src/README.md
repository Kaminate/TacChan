# About the source
tacUtils.js is shared between server and client code.
Thus it shouldn't have any Node.js requires.
Client javascript files are bundled together via browserify.

## Installation
> npm install -g browserify
> browserify tacClient.js -o tacClientBundle.js

