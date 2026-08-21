import { handleStart } from './handlers/startHandler.js';
import { handleMessage } from './handlers/messageHandler.js';

import {
  handleAdminsCallback,
} from './handlers/activeAdminsHandler.js';

export default {
  async fetch(
    request,
    env,
    ctx,
  ) {
    if (
      request.method !== 'POST'
    ) {
      return new Response(
        'AdminX Bot is running.',
        {
          status: 200,
        },
      );
    }

    try {
      const update =
        await request.json();

      if (update.callback_query) {
        await handleAdminsCallback(
          update.callback_query,
          env,
        );

        return new Response('OK');
      }

      if (!update.message) {
        return new Response('OK');
      }

      const message =
        update.message;

      if (
        message.text === '/start'
      ) {
        await handleStart(
          message,
          env,
        );
      } else if (
        message.text
      ) {
        await handleMessage(
          message,
          env,
          ctx,
        );
      }

      return new Response('OK');
    } catch (error) {
      console.error(
        'BOT ERROR:',
        error,
      );

      return new Response(
        'Internal Server Error',
        {
          status: 500,
        },
      );
    }
  },
};
