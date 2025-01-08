import React from 'react'

const Request: React.FC = () => {
    const [name, setName] = useState<string>('');
    const [phone, setPhone] = useState<string>('');
    const [check, setCheck] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false)

    const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL as string
    const SERVER_PORT = process.env.NEXT_PUBLIC_SERVER_PORT as string

    const token = process.env.NEXT_PUBLIC_TG_API as string
    const API = `https://api.telegram.org/bot${token}/sendMessage`

    let requestNum: string;
    const sendMessage = async () => {
        const data = new Date();
        const formattedDate = data.toISOString();

        try {
            // get request number
            const numberResponse = await axios.get(`${SERVER_URL}:${SERVER_PORT}/api/number`);
            requestNum = numberResponse.data.number;
            console.log('Request number:', requestNum);

            // Check for missing data
            if (!requestNum || !name || !phone || !formattedDate) {
                console.error('Missing required data:', { requestNum, name, phone, formattedDate });
                throw new Error('Invalid data: Missing required fields');
            }

            // save data
            const requestData = {
                requestNum,
                name,
                phone,
                date: formattedDate,
                operatorId: null,
            };

            console.log('Saving request data:', requestData);


            // Save data to the database
            await axios.post(`${SERVER_URL}:${SERVER_PORT}/api/create`, requestData);


            //  send message to TG channel 

            // here u can change the text of the message and message button
            const text = `‼️ <strong>New request</strong> №${requestNum} ‼️\n<em>Application submission time: <u>${data.toLocaleDateString()} ${data.toLocaleTimeString()}</u></em>\n\n<b>To view the data, click ⏰ Apply for a job ⏰</b>`;
            const inlineKeyboard = {
                inline_keyboard: [
                    [
                        { text: '⏰ Apply for a job ⏰', callback_data: `/inprocess_${requestNum}` },
                    ],
                ],
            };

            console.log('Sending Telegram notification');
            await axios.post(API, {
                chat_id: ,
                text,
                parse_mode: 'HTML',
                reply_markup: JSON.stringify(inlineKeyboard),
            });
            console.log('All operations completed successfully');

        } catch (error) {
            console.error('Error in sendMessage:', error);
            throw error;
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!check) return setError(true)
        else if (phone.length < 18) return setError(true)
        else if (name.length < 1) return setError(true)
        sendMessage()
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                <input type="text" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <div className="">
                    <input id="check" type="checkbox" checked={check} onChange={(e) => setCheck(e.target.checked)} />
                    <label htmlFor="check">I have read the rules</label>
                </div>
                <button type="submit">Submit</button>
            </form>
            {error && <p style={{ color: 'red' }}>Please check your data</p>}
        </div>
    )
}

export default Request