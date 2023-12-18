require('dotenv/config');
const {Client, IntentsBitField } = require('discord.js');
const {Configuration, OpenAIApi} = require('openai');

// give our bot access to Server, Server Messages and Message Contents
// initialize bot instance
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds, 
        IntentsBitField.Flags.GuildMessages, 
        IntentsBitField.Flags.MessageContent, 
    ]
})

// event listener for when bot is running
client.on('ready', () => {
    console.log("The bot is online!");
})

// api vars
const configuration = new Configuration({
    apiKey: process.env.API_KEY,
})
const openai = new OpenAIApi(configuration);

// event listener for when a message is sent in the server 
client.on('messageCreate', async (message) => {
    
    // checks for if we send a message or not
    if (message.author.bot) return;
    if (message.channel.id !== process.env.CHANNEL_ID) return;
    if (!message.content.startsWith('!ai')) return;

    // store conversation log
    let conversationLog = [{ role: 'system', content: "You are a friendly but sarcastic chatbot." }];

    // make it look like we are typing in the channel to respond
    await message.channel.sendTyping();

    // fetch previous messages in the channel
    let prevMessages = await message.channel.messages.fetch({ limit: 15 });
    prevMessages.reverse();
    prevMessages.forEach((msg) => {
        if (!message.content.startsWith('!ai')) return;
        if (msg.author.id !== client.user.id && message.author.bot) return;
        if (msg.author.id !== message.author.id) return;

        conversationLog.push({
            role: 'user',
            content: msg.content,
        })
    })

    // make out call to openai
    const result = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: conversationLog,
    })

    message.reply(result.data.choices[0].message);
})

client.login(process.env.TOKEN);