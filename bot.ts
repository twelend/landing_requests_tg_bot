require('dotenv').config()
const TgApi = require('node-telegram-bot-api')
const TOKEN = process.env.TG_TOKEN
const fs = require('fs')

const bot = new TgApi(TOKEN, {
    polling: true
})

const loadRequestesFromFile = () => {
    try {
        return JSON.parse(fs.readFileSync('requestsInProcess.json', 'utf-8'))
    } catch (error) {
        return {}
    }
}

const saveRequestsInProcess = (data) => {
    fs.writeFileSync('requestsInProcess.json', JSON.stringify(data, null, 2), 'utf8');
};

const requestsInProcess = loadRequestesFromFile();

const start = () => {
    bot.on('text', async (msg) => {
        const chatId = msg.chat.id
        if (msg.text === '/start') {
            await bot.sendMessage(chatId, 'Привет, я бот-рекрутер. Сейчас расскажу как со мной работать.\n\nВ момент когда приходит заявка одному из операторов необходимо нажать кнопку \n"⏰ Взять в работу ⏰"\n\nВы увидите текст "⏳Заявка №<номер заявки> обрабатывается⏳"\n<i>Это сделано для того, чтобы другие операторы не обрабатывали одну заявку повторно</i> \n\nЕсли заявка выполнена, нажмите "✅ Завершить заявку ✅"')
        }
    })

    bot.on('callback_query', async (msg) => {
        const chatId = msg.message.chat.id;
        const messageId = msg.message.message_id;
        const messageText = msg.message.text;

        const phoneRegex = /Связаться:\s*([+]?\d[\d\s-()]*\d)/;
        const phoneMatch = messageText.match(phoneRegex);
        const phone = phoneMatch ? phoneMatch[1].trim() : 'неизвестный номер';

        const requestNum = msg.data.split('_')[1];

        if (msg.data.startsWith('/inprocess_')) {
            requestsInProcess[requestNum] = msg.from.id;
            saveRequestsInProcess(requestsInProcess);
            const inlineKeyboard = {
                inline_keyboard: [
                    [
                        { text: '✅ Завершить заявку ✅', callback_data: `/completed_${requestNum}` },
                    ],
                ],
            };

            await bot.editMessageText(`⏳@${msg.from.username} взял заявку #${requestNum} в обработку⏳\n\n${msg.message.text}`, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: JSON.stringify(inlineKeyboard),
            });
        } else if (msg.data.startsWith('/completed_')) {
            if (requestsInProcess[requestNum] === msg.from.id) {
                await bot.deleteMessage(chatId, messageId);
                await bot.sendMessage(chatId, `✅ Заявка #${requestNum} обработана✅
Данные заявки:
    Номер телефона клиента: 
        ${phone}
    Имя клиента: ${msg.message.text.split('\n')[4].split('-')[1]}
    Заявка подана:
        Дата: ${msg.message.text.split('\n')[7].split('-')[1].trim().split(' ')[0]}
        Время: ${msg.message.text.split('\n')[7].split('-')[1].trim().split(' ')[1]}
    Кто обрабатывал: @${msg.from.username}
    `);
                delete requestsInProcess[requestNum];
                saveRequestsInProcess(requestsInProcess)
            } else {
                await bot.answerCallbackQuery(msg.id, {
                    text: 'Вы не обрабатываете эту заявку',
                    show_alert: true
                }
                );
            }
        }
    });
}


start()