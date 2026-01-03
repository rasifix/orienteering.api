test:
	node --trace-deprecation --loader ts-node/esm node_modules/.bin/mocha --extensions ts test/**/*.ts
 
.PHONY: test