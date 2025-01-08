import 'dotenv/config';
import TelegramBot = require("node-telegram-bot-api")
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import db from './db';

const TOKEN = process.env.TG_TOKEN as string;

const bot = new TelegramBot(TOKEN, { polling: true });

const authorizedUsers = new Set<number>();

// Add users with data upload rights
authorizedUsers.add(11111111);
authorizedUsers.add(22222222);

const commands = [
    { command: '/start', description: 'Start a conversation' },
    { command: '/help', description: 'That`s what I can do...' },
];

bot.setMyCommands(commands)
    .then(() => {
        console.log('The bot`s commands have been installed successfully');
    })
    .catch((error: Error) => {
        console.error('Error when installing bot commands:', error);
    });

const loadRequestFromDB = async (requestNum: string) => {
    const client = await db.connect();
    try {
        const res = await client.query('SELECT * FROM requests WHERE request_num = $1', [requestNum]);
        return res.rows[0];
    } finally {
        client.release();
    }
};

const saveRequestToDB = async (requestNum: string, operatorId: number, operator_name: string) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('UPDATE requests SET operator_name = $3, operator_id = $1 WHERE request_num = $2', [operatorId, requestNum, operator_name]);
        await client.query('COMMIT');
    } finally {
        client.release();
    }
};

const completeRequestInDB = async (requestNum: string) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('UPDATE requests SET completed = TRUE WHERE request_num = $1', [requestNum]);
        await client.query('COMMIT');
    } finally {
        client.release();
    }
};

const start = async () => {
    bot.on('callback_query', async (query: any) => {
        const chatId = query.message.chat.id;
        const data = query.data;
        const messageId = query.message.message_id;
        const userId = query.from.id;

        if (data === '/allreq') {
            if (authorizedUsers.has(userId)) {
                await bot.deleteMessage(chatId, messageId);
                await bot.sendMessage(chatId, `⌛The upload has started... Check your private messages!`);
                await getData(query.from.id);
            } else {
                await bot.answerCallbackQuery(query.id, {
                    text: 'You don`t have the rights for this command.',
                    show_alert: true
                });
            }
        } else if (data === '/clearallreq') {
            if (authorizedUsers.has(userId)) {
                await db.query(`ALTER SEQUENCE requests_id_seq RESTART WITH 1`);
                const requests = await db.query(`DELETE FROM requests`);
                return bot.sendMessage(chatId, 'All applications in the database have been cleared, the number of deleted applications is ' + requests.rowCount);
            } else {
                await bot.answerCallbackQuery(query.id, {
                    text: 'You don`t have the rights for this command.',
                    show_alert: true
                });
            }
        }
    });

    const startText = `Hello, I'm ur new bot!🤖`

    bot.on('text', async (msg: any) => {
        const chatId = msg.chat.id;
        // Удаляем упоминание бота из команды
        if (msg.text.startsWith('/')) {
            msg.text = msg.text.split('@')[0];
        }
        if (msg.text === '/start') {
            await bot.sendMessage(chatId, startText);
        }
        if (msg.text === '/help') {
            await bot.sendMessage(chatId, `
                👀See what I can do👀
                \n\nThe *Upload Applications* button - uploads everything that has accumulated in the database to an Excel file
                \nThe *Clear All Applications* button completely deletes everything that has accumulated in the database.
                \n\nCan you ask me, why the fuck should I delete applications?!🤨 And I'll answer you...\n\nIt's simple!🧠 After all the applications have been processed, you upload them and clear the database of applications so that next time you don't upload new data with the old ones..🧐
                `,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: 'Upload Applications', callback_data: '/allreq' }],
                            [{ text: 'Clear All Applications', callback_data: '/clearallreq' }],
                        ]
                    }
                }
            )
            return;
        }
    });

    bot.on('callback_query', async (callbackQuery: any) => {
        const chatId = callbackQuery.message.chat.id;
        const messageId = callbackQuery.message.message_id;
        const requestNum = callbackQuery.data.split('_')[1];

        if (callbackQuery.data.startsWith('/inprocess_')) {
            const request = await loadRequestFromDB(requestNum);

            if (request) {
                if (!request.operator_id) {

                    const inlineKeyboard = {
                        inline_keyboard: [
                            [
                                { text: '✅ Complete the application ✅', callback_data: `/completed_${requestNum}` },
                            ],
                        ],
                    };

                    // Отправляем данные заявки в личные сообщения оператору
                    try {
                        await bot.sendMessage(callbackQuery.from.id, `Application data #${requestNum}:\n\n☎️ \tCustomer's phone number: ${request.phone}\n👤 \tCustomer's name: ${request.name}\n📅 \tApplication submission time: ${request.date}`)
                            .then(async () => {
                                await saveRequestToDB(requestNum, callbackQuery.from.id, callbackQuery.from.username);
                                await bot.editMessageText(`⏳@${callbackQuery.from.username} took the application #${requestNum} for processing⏳`, {
                                    chat_id: chatId,
                                    message_id: messageId,
                                    reply_markup: inlineKeyboard,
                                });
                            });
                    } catch (error) {
                        console.error('Error when sending a message to a personal account:', error);
                        await bot.answerCallbackQuery(callbackQuery.id, {
                            text: 'It is necessary to write to the bot in the personal account',
                            show_alert: true
                        });
                    }
                } else {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: 'Another operator has already accepted this request.',
                        show_alert: true
                    });
                }
            } else {
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: 'The application was not found',
                    show_alert: true
                });
            }
        } else if (callbackQuery.data.startsWith('/completed_')) {
            const request = await loadRequestFromDB(requestNum);

            if (request && request.operator_id == callbackQuery.from.id) {
                await bot.deleteMessage(chatId, messageId);
                await bot.sendMessage(chatId, `✅ Application #${requestNum} has been processed\nWho processed it: @${callbackQuery.from.username}`);
                await completeRequestInDB(requestNum);
            } else {
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: 'You are not processing this application.',
                    show_alert: true
                });
            }
        }
    });
};

async function getData(chatId: number) {
    try {
        // Получение данных с базы
        const requests = await db.query(`SELECT * FROM requests`);
        console.log(requests.rows);
        // Создание эксель файла
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('SUT');
        sheet.columns = [
            { header: 'Id', key: 'id', width: 10 },
            { header: 'Application number', key: 'request_num', width: 10 },
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Phone', key: 'phone', width: 30 },
            { header: 'Application Date', key: 'date', width: 30 },
            { header: 'Operator`s ID', key: 'operator_id', width: 20 },
            { header: 'Operator TG', key: 'operator_name', width: 30 },
        ];

        requests.rows.forEach((item: any) => {
            console.log(item);
            sheet.addRow({
                id: item.id,
                request_num: item.request_num,
                name: item?.name || '',
                phone: item.phone,
                date: item.date,
                operator_id: item.operator_id,
                operator_name: item?.operator_name || '',
            });
        });
        const filename = `Uploading applications.xlsx`;
        await workbook.xlsx.writeFile(filename);

        await bot.sendDocument(chatId, fs.createReadStream(filename), {
            caption: 'Uploading applications',
        });

        fs.unlinkSync(filename); // Удаляем файл после отправки

        await bot.sendMessage(chatId, '⬆All applications in the database have been uploaded to a file⬆', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Clear all applications', callback_data: '/clearallreq' }],
                ]
            }
        });

    } catch (error: any) {
        await bot.sendMessage(chatId, `Error when uploading data: ${error.message}`);
    }
}

start();