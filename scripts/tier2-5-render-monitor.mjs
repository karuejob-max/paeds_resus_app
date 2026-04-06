#!/usr/bin/env node

/**
 * Tier 2.5: Render API Monitoring
 * 
 * Monitors Render deployments and sends alerts to Slack
 * 
 * Usage:
 *   node scripts/tier2-5-render-monitor.mjs
 * 
 * Environment variables:
 *   RENDER_API_TOKEN - Render API token
 *   SLACK_WEBHOOK_URL - Slack webhook for notifications
 */

async function getServices() {
  const token = process.env.RENDER_API_TOKEN;
  if (!token) {
    throw new Error('RENDER_API_TOKEN not set');
  }

  const response = await fetch('https://api.render.com/v1/services', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Render API error: ${response.status}`);
  }

  const data = await response.json();
  return data.services || [];
}

async function getServiceDeployments(serviceId) {
  const token = process.env.RENDER_API_TOKEN;
  if (!token) {
    throw new Error('RENDER_API_TOKEN not set');
  }

  const response = await fetch(`https://api.render.com/v1/services/${serviceId}/deploys`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Render API error: ${response.status}`);
  }

  const data = await response.json();
  return data.deploys || [];
}

async function sendSlackNotification(message, details) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) {
    console.warn('SLACK_WEBHOOK_URL not set, skipping notification');
    return;
  }

  const fields = Object.entries(details).map(([key, value]) => ({
    type: 'mrkdwn',
    text: `*${key}*\n${value}`,
  }));

  const response = await fetch(webhook, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message,
          },
        },
        {
          type: 'section',
          fields,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Slack API error: ${response.status}`);
  }
}

async function monitorDeployments() {
  console.log('[Tier 2.5] Starting Render deployment monitoring...');

  try {
    const services = await getServices();
    console.log(`Found ${services.length} services`);

    for (const service of services) {
      console.log(`Checking service: ${service.name}`);

      const deployments = await getServiceDeployments(service.id);
      if (deployments.length === 0) {
        continue;
      }

      const latestDeploy = deployments[0];
      const isFailure = ['build_failed', 'deploy_failed', 'pre_deploy_failed'].includes(latestDeploy.status);
      const isLive = latestDeploy.status === 'live';

      if (isFailure) {
        await sendSlackNotification(
          `🚨 *Render Deployment Failed*\n${service.name}`,
          {
            'Service': service.name,
            'Status': latestDeploy.status,
            'Deployed': new Date(latestDeploy.updatedAt).toLocaleString(),
          }
        );
      } else if (isLive) {
        console.log(`✅ ${service.name} is live`);
      }
    }

    console.log('[Tier 2.5] Monitoring complete');
  } catch (error) {
    console.error('[Tier 2.5] Monitoring error:', error.message);
    process.exit(1);
  }
}

monitorDeployments();
