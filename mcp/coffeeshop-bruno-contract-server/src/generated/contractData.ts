import type { ContractSnapshot } from "../types.js";

export const currentSnapshot: ContractSnapshot = {
  "snapshotVersion": "sha-6229667",
  "generatedAt": "2026-06-29T15:19:02.096Z",
  "repoRoot": "/home/runner/work/CoffeeShopBackend/CoffeeShopBackend",
  "brunoRoot": "/home/runner/work/CoffeeShopBackend/CoffeeShopBackend/bruno",
  "endpointCount": 2,
  "endpoints": [
    {
      "name": "me",
      "group": "user",
      "method": "GET",
      "path": "users/me",
      "url": "{{base_url}}users/me",
      "auth": "inherit",
      "file": "bruno/user/me.yml",
      "bodyType": null,
      "bodyExample": null,
      "assertions": [
        {
          "expression": "res.status",
          "operator": "eq",
          "value": "200"
        }
      ],
      "runtimeScripts": [],
      "environmentVariables": [
        "base_url"
      ],
      "sourceFiles": [],
      "requestDtoNames": [],
      "requestFields": [],
      "responseDtoNames": [],
      "responseFields": [],
      "requestModelId": null,
      "responseModelId": null,
      "interactionHints": [
        "This endpoint uses auth strategy 'inherit'.",
        "Bruno assertions define expected success behavior.",
        "Bruno does not explicitly document a response model for this endpoint."
      ]
    },
    {
      "name": "login",
      "group": "user",
      "method": "POST",
      "path": "users/login",
      "url": "{{base_url}}users/login",
      "auth": "inherit",
      "file": "bruno/user/login.yml",
      "bodyType": "json",
      "bodyExample": {
        "email": "{{email}}",
        "password": "{{password}}",
        "device_id": "{{device_id}}"
      },
      "assertions": [
        {
          "expression": "res.status",
          "operator": "eq",
          "value": "200"
        }
      ],
      "runtimeScripts": [
        {
          "type": "after-response",
          "code": "const body = res.body;\nif (!body?.token) {\n  throw new Error(\"Login response does not contain token\");\n}\nbru.setVar(\"token\", body.token);"
        }
      ],
      "environmentVariables": [
        "base_url",
        "device_id",
        "email",
        "password"
      ],
      "sourceFiles": [],
      "requestDtoNames": [],
      "requestFields": [
        "device_id",
        "email",
        "password"
      ],
      "responseDtoNames": [],
      "responseFields": [],
      "requestModelId": "POST_users_login_request",
      "responseModelId": null,
      "interactionHints": [
        "This endpoint uses auth strategy 'inherit'.",
        "Bruno provides a structured request example for this endpoint.",
        "Bruno runtime scripts encode post-request behavior.",
        "Bruno assertions define expected success behavior.",
        "Bruno does not explicitly document a response model for this endpoint."
      ]
    }
  ],
  "modelCount": 1,
  "models": [
    {
      "id": "POST_users_login_request",
      "name": "POST users/login request",
      "kind": "request",
      "endpointKey": "POST users/login",
      "method": "POST",
      "path": "users/login",
      "source": "bruno",
      "fieldCount": 3,
      "dtoNames": [],
      "fields": [
        "device_id",
        "email",
        "password"
      ],
      "example": {
        "email": "{{email}}",
        "password": "{{password}}",
        "device_id": "{{device_id}}"
      },
      "brunoFile": "bruno/user/login.yml",
      "sourceFiles": [],
      "notes": []
    }
  ],
  "environments": [
    {
      "name": "dev",
      "file": "bruno/environments/dev.yml",
      "variables": [
        {
          "name": "base_url",
          "value": ""
        },
        {
          "name": "email",
          "value": "jorge@mrht.dev"
        },
        {
          "name": "password",
          "value": "123456"
        },
        {
          "name": "device_id",
          "value": "8ebe14ee-26a6-481c-8add-15741530e5e1"
        },
        {
          "name": "token",
          "value": ""
        }
      ]
    },
    {
      "name": "localhost",
      "file": "bruno/environments/localhost.yml",
      "variables": [
        {
          "name": "base_url",
          "value": "http://127.0.0.1:8080/"
        },
        {
          "name": "email",
          "value": "jorge@mrht.dev"
        },
        {
          "name": "password",
          "value": "123456"
        },
        {
          "name": "device_id",
          "value": "8ebe14ee-26a6-481c-8add-15741530e5e1"
        },
        {
          "name": "token",
          "value": ""
        }
      ]
    }
  ],
  "authProfile": {
    "collectionAuth": "bearer",
    "folderAuth": [
      {
        "group": "user",
        "auth": "inherit"
      }
    ],
    "authSourceFiles": [],
    "payloadSecurityFiles": []
  }
} as ContractSnapshot;

