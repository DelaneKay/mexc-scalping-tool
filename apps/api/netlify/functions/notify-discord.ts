import { Handler } from '@netlify/functions';
import { validateEnv, NotificationPayload } from '@mexc-scalping/shared';

const handler: Handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Validate environment
    const env = validateEnv(process.env);
    
    if (!env.DISCORD_WEBHOOK_URL) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Discord webhook URL not configured' 
        }),
      };
    }

    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Request body is required' 
        }),
      };
    }

    const payload: NotificationPayload = JSON.parse(event.body);

    // Validate payload
    if (!payload.symbol || !payload.state || !payload.timeframe) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields: symbol, state, timeframe' 
        }),
      };
    }

    // Create Discord embed
    const embed = createDiscordEmbed(payload);

    // Send to Discord
    const discordResponse = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });

    if (!discordResponse.ok) {
      throw new Error(`Discord API error: ${discordResponse.status}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Notification sent to Discord',
        timestamp: Date.now(),
      }),
    };
  } catch (error) {
    console.error('Error in notify-discord function:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

function createDiscordEmbed(payload: NotificationPayload) {
  const stateColors: Record<string, number> = {
    'ABOUT_TO_BURST': 0xFFA500, // Orange
    'VOLATILE': 0x800080,       // Purple
    'LOSING_VOL': 0x0000FF,     // Blue
    'NORMAL': 0x808080,         // Gray
  };

  const stateEmojis: Record<string, string> = {
    'ABOUT_TO_BURST': '🚀',
    'VOLATILE': '⚡',
    'LOSING_VOL': '📉',
    'NORMAL': '📊',
  };

  const emoji = stateEmojis[payload.state] || '📊';
  const color = stateColors[payload.state] || 0x808080;

  return {
    title: `${emoji} ${payload.symbol} - ${payload.state}`,
    color,
    fields: [
      {
        name: 'Timeframe',
        value: payload.timeframe,
        inline: true,
      },
      {
        name: 'Burst Score',
        value: `${payload.burstScore.toFixed(1)}/100`,
        inline: true,
      },
      {
        name: 'Volatility Score',
        value: `${payload.volatilityScore.toFixed(1)}/100`,
        inline: true,
      },
      {
        name: 'Volume Surge',
        value: `${payload.volumeSurge.toFixed(2)}x`,
        inline: true,
      },
      {
        name: 'ATR%',
        value: `${payload.atrPercent.toFixed(2)}%`,
        inline: true,
      },
      {
        name: 'Suggested Leverage',
        value: `${payload.leverageSuggestion}x`,
        inline: true,
      },
    ],
    footer: {
      text: 'MEXC Scalping Tool - Signals Only',
    },
    timestamp: new Date(payload.timestamp).toISOString(),
  };
}

export { handler };