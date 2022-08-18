require("dotenv").config();
const axios = require("axios").default;
const Web3 = require("web3");
const Datastore = require("nedb");
const db = new Datastore({ filename: "users.db", autoload: true });

const web3 = new Web3(process.env.TEST_WS_RPC);

const tokenAddresses = ["0xd738179146f354f1ee576f449eca6f7cb4ece210"];
const tokenLookUp = { "0xd738179146f354f1ee576f449eca6f7cb4ece210": "USDC" };

const subscription = web3.eth
    .subscribe(
        "logs",
        {
            address: tokenAddresses,
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

        console.log("Token : ", tokenLookUp[token]);
        console.log("Sender : ", sender);
        console.log("Receiver : ", receiver);
        console.log("Amount : ", amount);

        db.findOne({ wallet: receiver }, function (err, doc) {
            if (!err && doc.telegramId) {
                console.log(doc.telegramId);

                const amountText = String(amount).replace(".", "%5C.");

                axios
                    .get(
                        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${doc.telegramId}&parse_mode=MarkdownV2&text=*Deposit*%0A%0ASender%20%3A%20${sender}%0A%0A*%5C%2B${amountText}%20${tokenLookUp[token]}*`
                    )
                    .then(res => console.log("Result :", res.data))
                    .catch(err => console.log("Error :", err.data));
            }
        });
    });
