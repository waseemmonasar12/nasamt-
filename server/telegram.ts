/**
 * Telegram Bot Integration for «نسمة شتاء»
 * Token: 8728211577:AAHJ1F2B7W0ffZN_Mpn1ETUVKnSdGa5cNg0
 * Owner Chat ID: 8607243024
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8728211577:AAHJ1F2B7W0ffZN_Mpn1ETUVKnSdGa5cNg0';
const DEFAULT_OWNER_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8607243024';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Dynamic state tracking
let currentOwnerChatId = DEFAULT_OWNER_CHAT_ID;
let isChatActivated = false;
let hasLoggedStartNotice = false;
let lastFailureReason = '';

export interface TelegramBotInfo {
  botUsername: string;
  botUrl: string;
  chatId: string;
  isActivated: boolean;
  lastFailureReason?: string;
}

export function getTelegramBotInfo(): TelegramBotInfo {
  return {
    botUsername: 'nasamatshtabot',
    botUrl: 'https://t.me/nasamatshtabot',
    chatId: currentOwnerChatId,
    isActivated: isChatActivated,
    lastFailureReason,
  };
}

export function setTelegramOwnerChatId(newChatId: string) {
  currentOwnerChatId = String(newChatId).trim();
  isChatActivated = true;
  lastFailureReason = '';
}

interface SendMessageOptions {
  chatId?: string | number;
  text: string;
  parse_mode?: 'HTML' | 'MarkdownV2' | 'Markdown';
  force?: boolean;
}

export async function sendTelegramMessage(options: SendMessageOptions): Promise<boolean> {
  const targetChatId = options.chatId || currentOwnerChatId;
  if (!BOT_TOKEN || !targetChatId) {
    return false;
  }

  // If the chat has not been activated yet by the user sending /start,
  // skip background notifications to prevent spamming Telegram with 400 errors.
  // We only send if force is true (e.g. manual test) or if the chat is verified.
  if (!isChatActivated && !options.force && String(targetChatId) === String(currentOwnerChatId)) {
    return false;
  }

  try {
    const res = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: options.text,
        parse_mode: options.parse_mode || 'HTML',
      }),
      // Abort after 8 seconds to never hang request
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const errText = await res.text();
      let description = errText;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.description) description = parsed.description;
      } catch {}

      // Handle Telegram "chat not found" or "bot can't initiate conversation" gracefully
      if (res.status === 400 && (description.includes('chat not found') || description.includes("can't initiate conversation"))) {
        isChatActivated = false;
        lastFailureReason = 'waiting_user_start';
        if (!hasLoggedStartNotice) {
          hasLoggedStartNotice = true;
          console.log(
            `[Telegram Bot] Notice: Chat ID ${targetChatId} has not yet initiated a conversation with @nasamatshtabot.\n` +
            `👉 Open https://t.me/nasamatshtabot in Telegram and press Start (/start) to activate instant notifications.`
          );
        }
        return false;
      }

      lastFailureReason = description;
      console.warn('[Telegram] Could not deliver message:', res.status, description);
      return false;
    }

    isChatActivated = true;
    lastFailureReason = '';
    return true;
  } catch (err) {
    console.warn('[Telegram] Network error sending message:', (err as Error).message);
    return false;
  }
}

// Shortcut helper for admin notifications
export async function notifyAdmin(message: string, force = false): Promise<boolean> {
  return sendTelegramMessage({
    chatId: currentOwnerChatId,
    text: message,
    parse_mode: 'HTML',
    force,
  });
}

// Telegram Bot Polling Runner for remote commands
let isPolling = false;
let lastUpdateId = 0;

export function startTelegramBotPolling(dbHandler: {
  getStats: () => any;
  getPosts: () => any[];
  createPost?: (data: any) => any;
  deletePost?: (id: string) => boolean;
  togglePublish?: (id: string) => any;
  getComments?: () => any[];
  deleteComment?: (id: string) => boolean;
  getSecurityLogs: () => any[];
  createBackup: () => any;
  verifyAdminPassword?: (pwd: string) => boolean;
}) {
  if (isPolling) return;
  isPolling = true;

  console.log('[Telegram Bot] Starting polling worker for @nasamatshtabot...');

  async function poll() {
    while (isPolling) {
      try {
        const url = `${TELEGRAM_API_URL}/getUpdates?offset=${lastUpdateId + 1}&timeout=20`;
        const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
        if (!res.ok) {
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }

        const data = (await res.json()) as { ok: boolean; result: any[] };
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            lastUpdateId = Math.max(lastUpdateId, update.update_id);
            if (update.message && update.message.text) {
              await handleIncomingMessage(update.message, dbHandler);
            }
          }
        }
      } catch {
        // Sleep on error to prevent hot spin
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  poll().catch((e) => console.error('[Telegram Polling Fatal]', e));
}

async function handleIncomingMessage(
  message: { chat: { id: number | string }; text: string; from?: { first_name?: string } },
  db: {
    getStats: () => any;
    getPosts: () => any[];
    createPost?: (data: any) => any;
    deletePost?: (id: string) => boolean;
    togglePublish?: (id: string) => any;
    getComments?: () => any[];
    deleteComment?: (id: string) => boolean;
    getSecurityLogs: () => any[];
    createBackup: () => any;
    verifyAdminPassword?: (pwd: string) => boolean;
  }
) {
  const chatId = String(message.chat.id);
  const text = (message.text || '').trim();
  const [cmd, ...args] = text.split(' ');
  const senderName = message.from?.first_name || 'صاحب الموقع';

  // Check if sender matches current or default owner chat ID
  const isOwner = chatId === String(currentOwnerChatId) || chatId === String(DEFAULT_OWNER_CHAT_ID);

  // Allow connecting via admin password if different chat ID
  if (!isOwner) {
    if (cmd.toLowerCase() === '/login' || cmd.toLowerCase() === '/connect') {
      const password = args.join(' ').trim();
      if (password && (password === 'نسمة شتاء' || (db.verifyAdminPassword && db.verifyAdminPassword(password)))) {
        setTelegramOwnerChatId(chatId);
        await sendTelegramMessage({
          chatId,
          text:
            `❄️ <b>تم التحقق وتأكيد هويتك بنجاح!</b>\n` +
            `مرحباً بك يا <b>${senderName}</b>. تم ربط حسابك كمالك رسمي لموقع «نسمة شتاء».\n` +
            `ستصلك الآن جميع الإشعارات الفورية والأمان هنا مباشرة.\n\n` +
            `أرسل <b>/help</b> لاستعراض لوحة التحكم.`,
          parse_mode: 'HTML',
          force: true,
        });
        return;
      } else {
        await sendTelegramMessage({
          chatId,
          text:
            `⛔ <b>كلمة المرور غير صحيحة.</b>\n` +
            `لربط حسابك كمالك للموقع، أرسل: <code>/login كلمة_المرور</code>`,
          parse_mode: 'HTML',
          force: true,
        });
        return;
      }
    }

    // Unauthenticated attempt
    console.warn(`[Telegram Security] Unlinked contact from chat ID: ${chatId}`);
    await sendTelegramMessage({
      chatId,
      text:
        `❄️ <b>مرحباً بك في بوت «نسمة شتاء».</b>\n\n` +
        `هذا البوت مخصص لمتابعة وإدارة موقع «نسمة شتاء».\n` +
        `إذا كنت صاحب الموقع وترغب في ربط هذا الحساب لاستلام التنبيهات، أرسل:\n` +
        `<code>/login كلمة_مرور_الموقع</code>`,
      parse_mode: 'HTML',
      force: true,
    });
    return;
  }

  // Sender is confirmed owner: Activate chat!
  isChatActivated = true;
  currentOwnerChatId = chatId;

  switch (cmd.toLowerCase()) {
    case '/start':
    case '/help': {
      const helpMsg =
        `❄️ <b>أهلاً بك يا صاحب «نسمة شتاء» في ملاذك الرقمي</b> ❄️\n\n` +
        `تم ربط حسابك وتفعيل الإشعارات الحية بنجاح 🟢\n` +
        `يمكنك التحكم بموقعك بالكامل وجلب كافة البيانات من هنا مباشرة:\n\n` +
        `📊 <b>/stats</b> — عرض إحصائيات الموقع الحية (الزوار، المشاهدات، الإعجابات)\n` +
        `✍️ <b>/posts</b> — قائمة بجميع الكتابات وحالتها ومعرفاتها\n` +
        `📖 <b>/getpost [معرف_التدوينة]</b> — قراءة المحتوى الكامل لأي تدوينة\n` +
        `🔒 <b>/write [العنوان] | [المحتوى]</b> — تدوين خاطرة سرية في عالمك الخاص\n` +
        `🌍 <b>/publish [العنوان] | [المحتوى]</b> — نشر تدوينة عامة للزوار في الموقع\n` +
        `🔄 <b>/toggle [معرف_التدوينة]</b> — تحويل التدوينة بين عامة وخاصة\n` +
        `🗑️ <b>/delete [معرف_التدوينة]</b> — حذف تدوينة نهائياً\n` +
        `💬 <b>/comments</b> — عرض أحدث تعليقات الزوار\n` +
        `🔐 <b>/security</b> — سجل محاولات الدخول وحالة الأمان\n` +
        `💾 <b>/backup</b> — إنشاء نسخة احتياطية فورية للموقع\n` +
        `👥 <b>/visits</b> — تفاصيل حركة الزوار الأخيرة\n` +
        `ℹ️ <b>/info</b> — معلومات النظام وحالة الخادم\n\n` +
        `<i>كل زيارة أو تعليق جديد سيصلك إشعاره فوراً هنا!</i>`;
      await sendTelegramMessage({ chatId, text: helpMsg, parse_mode: 'HTML', force: true });
      break;
    }

    case '/stats': {
      const stats = db.getStats();
      const msg =
        `📊 <b>إحصائيات «نسمة شتاء» المباشرة:</b>\n\n` +
        `👤 إجمالي الزيارات المسجلة: <b>${stats.totalVisitors}</b>\n` +
        `👁️ إجمالي مشاهدات المقالات: <b>${stats.totalViews}</b>\n` +
        `✍️ إجمالي الكتابات: <b>${stats.totalPosts}</b>\n` +
        `🔒 كتابات خاصة في عالمك السري: <b>${stats.privatePostsCount}</b>\n` +
        `🌍 كتابات منشورة للعامة: <b>${stats.publicPostsCount}</b>\n` +
        `📝 مسودات غير مكتملة: <b>${stats.draftsCount}</b>\n` +
        `❤️ إجمالي الإعجابات: <b>${stats.totalLikes}</b>\n` +
        `💬 إجمالي تعليقات الزوار: <b>${stats.totalComments}</b>\n\n` +
        `🕒 تم التحديث: <code>${new Date().toLocaleTimeString('ar-EG')}</code>`;
      await sendTelegramMessage({ chatId, text: msg, parse_mode: 'HTML', force: true });
      break;
    }

    case '/posts': {
      const posts = db.getPosts();
      if (!posts || posts.length === 0) {
        await sendTelegramMessage({ chatId, text: '✍️ لا توجد كتابات حالياً في الموقع.', parse_mode: 'HTML', force: true });
        return;
      }
      let listMsg = `📚 <b>أحدث كتاباتك في «نسمة شتاء» (${posts.length}):</b>\n\n`;
      posts.slice(0, 15).forEach((p, idx) => {
        const status = p.isPublic ? '🌍 عامة' : '🔒 خاصة';
        listMsg += `${idx + 1}. <b>${p.title}</b>\n   🏷️ [${p.category}] — ${status}\n   🆔 <code>${p.id}</code>\n   👁️ ${p.viewsCount} | ❤️ ${p.likesCount}\n\n`;
      });
      listMsg += `<i>لقراءة تدوينة أرسل: <code>/getpost معرف_التدوينة</code></i>`;
      await sendTelegramMessage({ chatId, text: listMsg, parse_mode: 'HTML', force: true });
      break;
    }

    case '/getpost': {
      const targetId = args[0]?.trim();
      if (!targetId) {
        await sendTelegramMessage({
          chatId,
          text: 'يرجى إرسال معرف التدوينة بعد الأمر، مثال:\n<code>/getpost post-123456</code>\n(يمكنك معرفة المعرفات عبر إرسال /posts)',
          parse_mode: 'HTML',
          force: true,
        });
        return;
      }
      const posts = db.getPosts();
      const post = posts.find((p) => p.id === targetId || p.title.toLowerCase().includes(targetId.toLowerCase()));
      if (!post) {
        await sendTelegramMessage({ chatId, text: `❌ لم يتم العثور على تدوينة بالمعرف: <code>${targetId}</code>`, parse_mode: 'HTML', force: true });
        return;
      }
      const status = post.isPublic ? '🌍 منشورة للعامة' : '🔒 خاصة في عالمك السري';
      const postDetail =
        `📖 <b>${post.title}</b>\n` +
        `الحالة: <b>${status}</b> | التصنيف: <b>${post.category}</b>\n` +
        `المشاهدات: <b>${post.viewsCount}</b> | الإعجابات: <b>${post.likesCount}</b>\n\n` +
        `<b>المحتوى:</b>\n` +
        `${post.content}\n\n` +
        `🆔 المعرف: <code>${post.id}</code>`;
      await sendTelegramMessage({ chatId, text: postDetail, parse_mode: 'HTML', force: true });
      break;
    }

    case '/write': {
      const rawContent = args.join(' ').trim();
      if (!rawContent || !rawContent.includes('|')) {
        await sendTelegramMessage({
          chatId,
          text:
            `📝 <b>طريقة كتابة تدوينة سرية:</b>\n` +
            `أرسل: <code>/write العنوان | المحتوى</code>\n\n` +
            `مثال:\n` +
            `<code>/write شتاء هادئ | هذا نص الخاطرة السرية...</code>`,
          parse_mode: 'HTML',
          force: true,
        });
        return;
      }
      const [titlePart, ...contentParts] = rawContent.split('|');
      const title = titlePart.trim();
      const content = contentParts.join('|').trim();

      if (db.createPost) {
        const created = db.createPost({
          title,
          content,
          category: 'خواطر',
          isPublic: false,
          isDraft: false,
        });
        await sendTelegramMessage({
          chatId,
          text:
            `🔒 <b>تم حفظ التدوينة السرية بنجاح!</b>\n\n` +
            `• العنوان: <b>${created.title}</b>\n` +
            `• الحالة: <b>خاصة بعالمك السري فقط 🔒</b>\n` +
            `• المعرف: <code>${created.id}</code>`,
          parse_mode: 'HTML',
          force: true,
        });
      }
      break;
    }

    case '/publish': {
      const rawContent = args.join(' ').trim();
      if (!rawContent || !rawContent.includes('|')) {
        await sendTelegramMessage({
          chatId,
          text:
            `🌍 <b>طريقة نشر تدوينة عامة للزوار:</b>\n` +
            `أرسل: <code>/publish العنوان | المحتوى</code>\n\n` +
            `مثال:\n` +
            `<code>/publish ليلة بيضاء | نص التدوينة المنشورة للجميع...</code>`,
          parse_mode: 'HTML',
          force: true,
        });
        return;
      }
      const [titlePart, ...contentParts] = rawContent.split('|');
      const title = titlePart.trim();
      const content = contentParts.join('|').trim();

      if (db.createPost) {
        const created = db.createPost({
          title,
          content,
          category: 'خواطر',
          isPublic: true,
          isDraft: false,
        });
        await sendTelegramMessage({
          chatId,
          text:
            `🌍 <b>تم نشر التدوينة على الموقع بنجاح!</b>\n\n` +
            `• العنوان: <b>${created.title}</b>\n` +
            `• الحالة: <b>منشورة للعامة 🌍</b>\n` +
            `• المعرف: <code>${created.id}</code>\n\n` +
            `يمكن للزوار الآن قراءتها وإبداء الإعجاب والتعليق.`,
          parse_mode: 'HTML',
          force: true,
        });
      }
      break;
    }

    case '/toggle': {
      const targetId = args[0]?.trim();
      if (!targetId || !db.togglePublish) {
        await sendTelegramMessage({
          chatId,
          text: 'أرسل معرف التدوينة لتبديل حالتها:\n<code>/toggle معرف_التدوينة</code>',
          parse_mode: 'HTML',
          force: true,
        });
        return;
      }
      const updated = db.togglePublish(targetId);
      if (updated) {
        const status = updated.isPublic ? '🌍 عامة (منشورة للزوار)' : '🔒 خاصة (في عالمك السري فقط)';
        await sendTelegramMessage({
          chatId,
          text: `🔄 <b>تم تغيير حالة التدوينة بنجاح:</b>\n<b>${updated.title}</b>\nالحالة الجديدة: ${status}`,
          parse_mode: 'HTML',
          force: true,
        });
      } else {
        await sendTelegramMessage({ chatId, text: '❌ لم يتم العثور على التدوينة بهذا المعرف.', parse_mode: 'HTML', force: true });
      }
      break;
    }

    case '/delete': {
      const targetId = args[0]?.trim();
      if (!targetId || !db.deletePost) {
        await sendTelegramMessage({
          chatId,
          text: 'أرسل معرف التدوينة لحذفها:\n<code>/delete معرف_التدوينة</code>',
          parse_mode: 'HTML',
          force: true,
        });
        return;
      }
      const success = db.deletePost(targetId);
      if (success) {
        await sendTelegramMessage({ chatId, text: `🗑️ <b>تم حذف التدوينة بنجاح.</b>`, parse_mode: 'HTML', force: true });
      } else {
        await sendTelegramMessage({ chatId, text: '❌ لم يتم العثور على تدوينة بهذا المعرف.', parse_mode: 'HTML', force: true });
      }
      break;
    }

    case '/comments': {
      const comments = db.getComments ? db.getComments() : [];
      if (!comments || comments.length === 0) {
        await sendTelegramMessage({ chatId, text: '💬 لا توجد تعليقات حتى الآن.', parse_mode: 'HTML', force: true });
        return;
      }
      let comMsg = `💬 <b>أحدث تعليقات الزوار (${comments.length}):</b>\n\n`;
      comments.slice(0, 10).forEach((c: any, idx: number) => {
        comMsg += `${idx + 1}. <b>${c.authorName}</b> على «${c.postTitle || 'تدوينة'}»:\n   "${c.content}"\n   🕒 ${new Date(c.createdAt).toLocaleString('ar-EG')}\n\n`;
      });
      await sendTelegramMessage({ chatId, text: comMsg, parse_mode: 'HTML', force: true });
      break;
    }

    case '/security': {
      const logs = db.getSecurityLogs();
      let secMsg = `🔐 <b>سجل أمان الموقع (آخر محاولات تسجيل الدخول):</b>\n\n`;
      if (!logs || logs.length === 0) {
        secMsg += `لا توجد محاولات تسجيل دخول مسجلة حتى الآن.`;
      } else {
        logs.slice(0, 8).forEach((log) => {
          const icon = log.success ? '✅ ناجحة' : '❌ فاشلة';
          secMsg += `${icon} — <code>${log.timestamp}</code>\n` +
                    `👤 المستخدم: <b>${log.username}</b>\n` +
                    `🌐 IP: <code>${log.ip}</code>\n` +
                    `💻 المتصفح: ${log.userAgent.slice(0, 40)}...\n\n`;
        });
      }
      await sendTelegramMessage({ chatId, text: secMsg, parse_mode: 'HTML', force: true });
      break;
    }

    case '/backup': {
      try {
        const backup = db.createBackup();
        const backupMsg =
          `💾 <b>تم إنشاء نسخة احتياطية بنجاح!</b>\n\n` +
          `📁 اسم الملف: <code>${backup.filename}</code>\n` +
          `📦 عدد التدوينات: <b>${backup.postsCount}</b>\n` +
          `🔒 حالة التشفير: <b>مشفرة (AES-256)</b>\n` +
          `🕒 التاريخ: <code>${backup.createdAt}</code>\n\n` +
          `يمكنك استعادتها أو تنزيلها من لوحة التحكم في أي وقت.`;
        await sendTelegramMessage({ chatId, text: backupMsg, parse_mode: 'HTML', force: true });
      } catch (err) {
        await sendTelegramMessage({
          chatId,
          text: `❌ فشل إنشاء النسخة الاحتياطية: ${(err as Error).message}`,
          parse_mode: 'HTML',
          force: true,
        });
      }
      break;
    }

    case '/visits': {
      const stats = db.getStats();
      const visitMsg =
        `👥 <b>تفاصيل حركة زوار الموقع:</b>\n\n` +
        `👤 الزيارات النشطة اليوم: <b>${stats.totalVisitors}</b>\n` +
        `🔥 أكثر المقالات قراءة:\n` +
        (stats.popularPosts && stats.popularPosts.length > 0
          ? stats.popularPosts.map((p: any) => `• <b>${p.title}</b> (${p.views} مشاهدة)`).join('\n')
          : 'لا توجد مشاهدات بعد') +
        `\n\n<i>الموقع محمي، ولا يمكن لأي زائر الوصول إلى كتاباتك الخاصة أو لوحة الإدارة.</i>`;
      await sendTelegramMessage({ chatId, text: visitMsg, parse_mode: 'HTML', force: true });
      break;
    }

    case '/info': {
      const infoMsg =
        `❄️ <b>معلومات نظام «نسمة شتاء»:</b>\n` +
        `• الحالة: يعمل باستقرار 🟢\n` +
        `• المنفذ: 3000\n` +
        `• التشفير: PBKDF2 + AES-256-GCM\n` +
        `• مساحة التخزين: محلية آمنة ومزامنة\n` +
        `• التنبيهات: تيليجرام نشط على المحادثة: <code>${currentOwnerChatId}</code>`;
      await sendTelegramMessage({ chatId, text: infoMsg, parse_mode: 'HTML', force: true });
      break;
    }

    default: {
      await sendTelegramMessage({
        chatId,
        text: `❄️ أهلاً بك. الأمر غير معروف.\nأرسل <b>/help</b> لرؤية قائمة الأوامر المتاحة.`,
        parse_mode: 'HTML',
        force: true,
      });
      break;
    }
  }
}

