/**
 * M-Pesa Payment Integration Service
 * MVP uses mock implementation for testing
 * Replace with real implementation when credentials are available
 */

// Use mock implementation for MVP
export { 
  getMpesaAccessToken,
  initiateStkPush,
  queryStk,
  handleMpesaCallback,
  validatePhoneNumber
} from "./mpesa-mock";
