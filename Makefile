.PHONY: install test test-watch test-coverage lint build clean

install:
	npm ci

test:
	npm run test

test-watch:
	npm run test:watch

test-coverage:
	npm run test:coverage

lint:
	npm run lint

build:
	npm run build

clean:
	rm -rf node_modules coverage .next
