#!/bin/sh

set -eu

if [ "$#" -gt 0 ]; then
    exec "$@"
fi

exec ./CoffeeShop serve --env production --hostname 0.0.0.0 --port "${PORT:-8080}"
