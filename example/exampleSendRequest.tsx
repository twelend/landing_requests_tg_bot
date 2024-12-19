import React, { useState } from 'react'
import axios from 'axios'

const exampleSendRequest = () => {
    // Here we set the state for name and phone
    const [name, setName] = useState<string>('');
    const [phone, setPhone] = useState<string>('');

    const data = new Date() // current date. Needs for every request
    const [lang, setLang] = useState<'en' | 'ru'>('ru') // set language to 'en' or 'ru'

    // here we go to .env file
    // you can get your token from https://t.me/BotFather and Add it to .env file in ur Next app
    const token = process.env.NEXT_PUBLIC_TG_API as string
    // here API that will send message to ur channel
    const API = `https://api.telegram.org/bot${token}/sendMessage`

    // Function to send message
    const sendMessage = async () => {
        try {
            // here we send the request number to the Next server side application, then add it to variable "requestNum"
            let requestNum;
            await axios.post('/api/send-request', { name, phone }).then(response => requestNum = response.data.requestNum);

            // here just text for the message with request number and other data with inline keyboard
            const text = lang === 'en' ?
                    `‼️ New request #${requestNum} ‼️\n\Name - ${name}\nContact: ${phone}\n\nTime of sending: ${data.toLocaleDateString()} ${data.toLocaleTimeString()}`
                    : `‼️ Новая заявка #${requestNum} ‼️\n\nИмя - ${name}\nСвязаться: ${phone}\n\nВремя подачи заявки: ${data.toLocaleDateString()} ${data.toLocaleTimeString()}`

            const inlineKeyboard = {
                inline_keyboard: [
                    [
                        { text: lang === 'en' ? '⏰ Take in work ⏰' : '⏰ Взять в работу ⏰', callback_data: `/inprocess_${requestNum}` },
                    ],
                ],
            };

            const response = await axios.post(API, {
                chat_id: -1002339056167,
                text,
                reply_markup: JSON.stringify(inlineKeyboard),
            });

            console.log(response);
        } catch (error) {
            console.warn(error);
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        sendMessage()
    };
    return (
        <div>
            <form action="" onSubmit={handleSubmit}>
                <input type="text" placeholder='Имя' onChange={(e) => setName(e.target.value)} />
                <input type="text" placeholder='Телефон' onChange={(e) => setPhone(e.target.value)} />
                <button type='submit'>Отправить</button>
            </form>
        </div>
    )
}

export default exampleSendRequest