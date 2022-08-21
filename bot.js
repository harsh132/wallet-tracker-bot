const { Telegraf } = require("telegraf");
require("dotenv").config();
const Web3 = require("web3");
const web3 = new Web3();

const Datastore = require("nedb");
const db = new Datastore({ filename: "users.db", autoload: true });

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start(ctx => ctx.reply("Welcome, please enter your wallet address"));
bot.on("text", ctx => {
    console.log(ctx.update.message.from.id);
    if (web3.utils.isAddress(ctx.update.message.text)) {
        db.update(
            { telegramId: ctx.update.message.from.id },
            { wallet: ctx.update.message.text.toLowerCase(), telegramId: ctx.update.message.from.id },
            { upsert: true }
        );
        ctx.reply("Thank you, your wallet address is saved and being monitored on polygon blockchain");
    }
});
bot.launch();
