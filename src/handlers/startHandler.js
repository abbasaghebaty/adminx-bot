import { sendMessage } from '../api/telegram.js';

import { saveUser } from '../database/users.js';

import {
  getMainMenuKeyboard,
} from '../keyboards/mainMenu.js';

import {
  WELCOME_MESSAGE,
} from '../messages/welcome.js';

import {
  cancelAdminRegistration,
} from './adminHandler.js';

export async function handleStart(
  message,
  env,
) {
  await cancelAdminRegistration(
    message,
    env,
  );

  const user = message.from;

  await saveUser(
    env.DB,
    user,
  );

  const text =
    WELCOME_MESSAGE.replace(
      '{firstName}',
      user.first_name ||
        'دوست عزیز',
    );

  await sendMessage(
    message.chat.id,
    text,
    env,
    {
      reply_markup:
        getMainMenuKeyboard(),
    },
  );
}
