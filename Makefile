test:
	node --trace-deprecation --loader ts-node/esm node_modules/.bin/mocha --require ts-node/register --extensions ts test/**/*.ts
 
.PHONY: test