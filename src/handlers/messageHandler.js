import { sendMessage } from '../api/telegram.js';
import { getMainMenuKeyboard, MAIN_MENU_BUTTONS } from '../keyboards/mainMenu.js';
import { LINKS } from '../config/links.js';
import { TRUST_MESSAGE } from '../messages/trust.js';
import { ABOUT_MESSAGE } from '../messages/about.js';

export async function handleMessage(message, env) {
  const text = message.text;
  const chatId = message.chat.id;

  if (text === MAIN_MENU_BUTTONS.CHANNEL) {
    await sendMessage(
      chatId,
      '📢 کانال اصلی AdminX:',
      env,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'ورود به کانال',
                url: LINKS.MAIN_CHANNEL,
              },
            ],
          ],
        },
      },
    );
    return;
  }

  if (text === MAIN_MENU_BUTTONS.TRUST) {
    await sendMessage(chatId, TRUST_MESSAGE, env, {
      reply_markup: getMainMenuKeyboard(),
    });
    return;
  }

  if (text === MAIN_MENU_BUTTONS.SUPPORT) {
    await sendMessage(
      chatId,
      '💬 <b>پشتیبانی AdminX</b>\n\nیکی از راه‌های ارتباطی زیر را انتخاب کنید:',
      env,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '👨‍💻 پشتیبانی آموزش',
                url: LINKS.EDUCATION_ADMIN,
              },
            ],
            [
              {
                text: '👑 مدیریت ارشد',
                url: LINKS.OWNER_ADMIN,
              },
            ],
          ],
        },
      },
    );
    return;
  }

  if (text === MAIN_MENU_BUTTONS.ABOUT) {
    await sendMessage(chatId, ABOUT_MESSAGE, env, {
      reply_markup: getMainMenuKeyboard(),
    });
    return;
  }

  if (text === MAIN_MENU_BUTTONS.SUGGESTIONS) {
    await sendMessage(
      chatId,
      '📮 <b>صندوق انتقادات و پیشنهادات</b>\n\nبرای ارسال نظر، پیشنهاد یا انتقاد خود وارد صندوق زیر شوید.',
      env,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '📮 ورود به صندوق',
                url: LINKS.SUGGESTIONS,
              },
            ],
          ],
        },
      },
    );
  }
}
