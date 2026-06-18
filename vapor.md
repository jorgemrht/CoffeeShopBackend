# Vapor Docs

## Run Locally

You can also run the server locally from Xcode for debugging:

1. Open `Package.swift` in Xcode.
2. Select the `CoffeeShop` run target.
3. Run the app from Xcode.

You can also run the server from the terminal:

```bash
swift run CoffeeShop
```

Expected output:

```text
[ NOTICE ] Server started on http://127.0.0.1:8080
```

## When To Use Each Method

Use Docker Compose when you want a production-like local setup with the app and PostgreSQL running together.

Use Xcode when you need breakpoints, step-through debugging, or you are iterating on server code and want a tighter development loop.

Use `swift run CoffeeShop` when you want a lightweight local run from the terminal without opening Xcode.
