// This is a server component designed to store the application number on the Next server side application TypeScript.
// In this case, the request number is stored in the request Number variable, which increases with each request.

// After that, this server component is used to send the application number to the Telegram bot.

import { NextRequest, NextResponse } from 'next/server';

// This variable is used to store the application number, first init with 1 or any other number if u want
let requestNumber = 1;

export async function POST(req: NextRequest) {
    const { name, phone } = await req.json(); // Take the data from the request if it needs 
    const currentRequestNum = requestNumber; 
    requestNumber++; // Increase the request number

    // here we send the request number to the Frontend, where it'll be added in the message and send it to Telegram channel
    return NextResponse.json({ requestNum: currentRequestNum });
}

// This method is used when the request method isn't POST
export function GET() {
    return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}