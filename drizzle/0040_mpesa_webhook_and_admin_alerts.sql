CREATE TABLE `mpesaWebhookLog` (
  `id` int AUTO_INCREMENT NOT NULL,
  `callbackType` enum('stk','stk_timeout','stk_query','c2b_validation','c2b_confirmation') NOT NULL,
  `checkoutRequestId` varchar(255),
  `resultCode` int,
  `resultDesc` varchar(512),
  `httpStatus` int NOT NULL,
  `outcome` enum(
    'received',
    'signature_rejected',
    'invalid_payload',
    'duplicate_idempotency',
    'payment_not_found',
    'payment_completed',
    'payment_failed',
    'already_finalized',
    'persist_error',
    'acknowledged',
    'error'
  ) NOT NULL,
  `paymentId` int,
  `enrollmentId` int,
  `amountCents` int,
  `mpesaReceiptNumber` varchar(64),
  `errorMessage` text,
  `payloadSnippet` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `mpesaWebhookLog_id` PRIMARY KEY(`id`)
);

CREATE INDEX `idx_mpesa_webhook_checkout` ON `mpesaWebhookLog` (`checkoutRequestId`);
CREATE INDEX `idx_mpesa_webhook_created` ON `mpesaWebhookLog` (`createdAt`);
CREATE INDEX `idx_mpesa_webhook_outcome` ON `mpesaWebhookLog` (`outcome`);

CREATE TABLE `adminAlertDispatches` (
  `id` int AUTO_INCREMENT NOT NULL,
  `ruleKey` varchar(64) NOT NULL,
  `channel` enum('email','sms') NOT NULL DEFAULT 'email',
  `recipient` varchar(320) NOT NULL,
  `subject` varchar(255),
  `bodySnippet` text,
  `metricValue` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `adminAlertDispatches_id` PRIMARY KEY(`id`)
);

CREATE INDEX `idx_admin_alert_rule_created` ON `adminAlertDispatches` (`ruleKey`, `createdAt`);
