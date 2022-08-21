require("dotenv").config();
const axios = require("axios").default;
const Web3 = require("web3");
const Datastore = require("nedb");
const db = new Datastore({ filename: "users.db", autoload: true });

const web3 = new Web3(process.env.TEST_WS_RPC);

// const tokenAddresses = ["0xd738179146f354f1ee576f449eca6f7cb4ece210"];
const tokenLookUp = { "0xd738179146f354f1ee576f449eca6f7cb4ece210": "USDC" };
// const tokenLookUp = {
//     "0x2791bca1f2de4661ed88a30c99a7a9449aa84174": "USDC",
//     "0xc2132d05d31c914a87c6611c10748aeb04b58e8f": "USDT",
//     "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063": "DAI",
//     "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619": "WETH",
//     "0x45c32fa6df82ead1e2ef74d17b76547eddfaff89": "FRAX",
//     "0x2e1ad108ff1d8c782fcbbb89aad783ac49586756": "TUSD",
//     "0xa3fa99a148fa48d14ed51d610c367c61876997f1": "MAI",
// };

const subscription = web3.eth
    .subscribe(
        "logs",
        {
            address: Object.keys(tokenLookUp),
        },
        (err, res) => {
            if (err) console.log("Error : ", err);
            else {
                // console.log(res);
            }
        }
    )
    .on("connected", () => console.log("Connected !"))
    .on("data", log => {
        // console.log("Data : ", log);
        const token = log.address.toLowerCase();
        const sender = web3.eth.abi.decodeParameter("address", log.topics[1]);
        const receiver = web3.eth.abi.decodeParameter("address", log.topics[2]).toLowerCase();
        const amount = web3.utils.fromWei(log.data, "ether");
        const tx = log.transactionHash;

        // console.log("Token : ", tokenLookUp[token]);
        // console.log("Sender : ", sender);
        // console.log("Receiver : ", receiver);
        // console.log("Amount : ", amount);

        db.findOne({ wallet: receiver }, function (err, doc) {
            if (!err && doc && doc.telegramId) {
                console.log(doc.telegramId);

                const amountText = String(amount).replace(".", "%5C.");

                axios
                    .get(
                        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${doc.telegramId}&parse_mode=MarkdownV2&text=*Credit*%0A%0ASender%20%3A%20${sender}%0A%0A*%5C%2B${amountText}%20${tokenLookUp[token]}*%0A%5BPolygonScan%5D(https%3A%2F%2Fpolygonscan.com%2Ftx%2F${tx})`
                    )
                    .then(res => console.log("Result :", res.data))
                    .catch(err => console.log("Error :", err.data));
            }
        });
        db.findOne({ wallet: sender }, function (err, doc) {
            if (!err && doc && doc.telegramId) {
                console.log(doc.telegramId);

                const amountText = String(amount).replace(".", "%5C.");

                axios
                    .get(
                        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${doc.telegramId}&parse_mode=MarkdownV2&text=*Debit*%0A%0ASender%20%3A%20${sender}%0A%0A*%5C-${amountText}%20${tokenLookUp[token]}*%0A%5BPolygonScan%5D(https%3A%2F%2Fpolygonscan.com%2Ftx%2F${tx}`
                    )
                    .then(res => console.log("Result :", res.data))
                    .catch(err => console.log("Error :", err.data));
            }
        });
    });
