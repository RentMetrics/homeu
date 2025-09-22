Of course, here is a review of the Straddle API documentation in a Markdown file format suitable for your AI developer. 

```markdown
# Straddle API Documentation

This document provides an overview of the Straddle API, its core concepts, and how to interact with it.

## Introduction

Straddle offers a unified platform for creating modern account-to-account payment experiences. [1] It allows you to onboard and verify customers, connect to their bank accounts, and process payments efficiently. [1] The Straddle API is built on REST principles, featuring resource-oriented URLs, JSON-encoded requests and responses, and standard HTTP methods and status codes for predictable and consistent interactions. [4, 2]

## Core Functionality

Straddle's platform is built around the following core functionalities:

*   **Identity First:** Onboard and verify individual or business customers quickly using Straddle Identity, which includes integrated KYC and watchlist screening. [1]
*   **Powered by Open Banking:** Connect to customer bank accounts through Straddle's "no-code" widget, Bridge, or by using existing tokens from providers like Plaid, MX, and Finicity. [1]
*   **Pay by Bank:** Initiate payments protected by built-in balance confirmation and real-time fraud detection with Watchtower. [1]
*   **Faster Money Movement:** Benefit from 24-hour direct debit funding and multi-rail orchestration across ACH, RTP, and the upcoming FedNow. [1]
*   **Compliant by Default:** Integrated KYC, watchlist screening, and transaction monitoring ensure compliance without significant engineering effort. [1]

## How Straddle Works

The basic workflow of integrating with the Straddle API is as follows:

1.  **Create a Customer:** Use the Straddle API to create a customer profile. Straddle will automatically assess multi-dimensional risk and compliance signals. [1]
2.  **Connect to their Account:** Utilize Bridge, Straddle's drop-in widget, or existing tokens from supported providers to connect the application to the banking network. [1]
3.  **Get a Token:** Upon successful bank account connection, a `paykey` is generated. This secure token links the verified identity to the bank account. [1]
4.  **Pay by Bank:** Use the `paykey` to initiate charges or payouts through the Straddle API, taking advantage of built-in balance verification and fraud prevention. [1]

## Environments

Straddle provides two distinct environments for development and live transactions:

| Environment | Base URL                        | Purpose                  |
|-------------|---------------------------------|--------------------------|
| **Sandbox** | `https://sandbox.straddle.io`   | Testing and development. [5] |
| **Production**| `https://production.straddle.io`| Live transactions. [5]      |

**Important:** You must use the corresponding API keys for each environment. [5] Sandbox keys are for the sandbox environment, and production keys are for the production environment. [5]

## Authentication

Straddle uses Bearer Token authentication with JWT API keys. [5] You need to include your secret API key in the `Authorization` header of every API request. [5]

**Example:**
```bash
curl https://sandbox.straddle.io/v1/customers \
  -H "Authorization: Bearer YOUR_SECRET_API_KEY"
```

You can generate API keys from your Straddle Dashboard under **Developers > API Keys**. [5] Remember to keep your secret keys confidential and secure. [5]

## API Best Practices

To ensure secure and efficient integration, follow these best practices:

*   **HTTPS:** Always use HTTPS for API requests to protect data in transit. [2]
*   **Request-Id:** Include a unique `Request-Id` header in each request to aid in debugging and tracking. [2]
*   **Correlation-Id:** For operations that are part of a larger transaction, use the `Correlation-Id` header. [2]
*   **Error Handling:** Implement robust error handling to gracefully manage different API responses. [2]

## Response Structure

The Straddle API provides consistently structured JSON responses. [4] Successful responses will contain a `data` object with the requested information. [2] Error responses will include an `error` object detailing the issue. [2]

### Meta Information

All responses include a `meta` object with the following standard fields: [4]

*   `api_request_id`: A unique identifier for the request. [4]
*   `api_request_timestamp`: The ISO 8601 timestamp of the request. [4]

For paginated "array" responses, the `meta` object will also contain pagination fields like `page_number`, `page_size`, `total_items`, `sort_order`, and `sort_by`. [4]

## Errors

Straddle utilizes standard HTTP status codes to indicate the success or failure of an API request. Common status codes include:

*   `200 - OK`: The request was successful. [5]
*   `400 - Bad Request`: The request was invalid, likely due to missing or incorrect parameters. [5]
*   `401 - Unauthorized`: No valid API key was provided. [5]
*   `403 - Forbidden`: The API key does not have the necessary permissions. [5]
*   `404 - Not Found`: The requested resource does not exist. [5]
*   `409 - Conflict`: The request conflicts with another request, such as using the same idempotency key. [5]

For more detailed information, you can download the raw OpenAPI specification from the Straddle documentation. [2]
```