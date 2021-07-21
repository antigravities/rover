require("dotenv").config();

const fetch = require("node-fetch");
const { MongoClient } = require("mongodb");
const Discord = require("discord.js");
const Steam = require("steam-user");

const mongo = new MongoClient(process.env.MONGO_URL);
const commands = require("./commands");
const discord = new Discord.Client({ intents: ['GUILDS', 'GUILD_MESSAGES'] });
const steam = new Steam({
    enablePicsCache: true
});

let db;

let steamReady = false;

async function scanApps(){
    let colApps = db.collection("apps");

    let apps = [];

    await colApps.find({
        $or: [
            { updated: null },
            {
                updated: {
                    $lt: new Date(new Date()-3600000)
                }
            }
        ]
    }).sort({ updated: 1 }).limit(500).forEach(app => apps.push(app));

    apps = apps.filter(i => i.users && i.users.length > 0);
    console.log("Fetching apps", apps);

    if( apps.length < 1 ){
        console.log("No apps to fetch. Nothing to do.");
        return;
    }

    let res = await (await fetch(`https://store.steampowered.com/api/appdetails?appids=${apps.map(i => i._id).join(",")}&filters=price_overview`)).json();
    
    try {
        await new Promise((resolve, reject) => {
            console.log("Waiting for Steam...");
            let dateStarted = Date.now();
            while( ! steamReady || Date.now() - dateStarted > 15000 ){ }
            if( ! steamReady ) reject();
            else resolve();
        });
    } catch(e) {
        console.log("Steam timeout, trying again later...");
    }

    let updatedApps = {};

    for( let app of apps ){
        if( ! res[app._id] || ! res[app._id].success ) continue;

        if( res[app._id].data && res[app._id].data.price_overview && res[app._id].data.price_overview.discount_percent !== app.discount_percent ){
            app.discount_percent = res[app._id].data.price_overview.discount_percent;

            if( app.discount_percent > 0 ){
                updatedApps[app._id] = res[app._id];
                updatedApps[app._id].users = app.users;
            }
        }
    }

    for( let app of apps ){
        console.log("Updating app ", app);

        await colApps.updateOne({ _id: app._id }, {
            $set: {
                discount_percent: app.discount_percent,
                updated: new Date()
            }
        });
    }

    await new Promise((resolve, reject) => {
        steam.getProductInfo(Object.keys(updatedApps).map(i => parseInt(i)), [], (err, apps) => {
            if( err ) reject(err);

            for( let app of Object.keys(apps) ) {
                if( apps[app] && apps[app].appinfo && apps[app].appinfo.common && apps[app].appinfo.common.name ){
                    updatedApps[app].name = apps[app].appinfo.common.name;
                }
            }

            resolve();
        });
    });

    let messagesToSend = {};

    for( let app of Object.keys(updatedApps) ) {
        let newMessage = "**" + updatedApps[app].name + "** is now " + updatedApps[app].data.price_overview.discount_percent + "% off on Steam! <https://s.team/a/" + app + ">"

        for( let user of updatedApps[app].users ){
            if( ! messagesToSend[user] ) messagesToSend[user] = [ newMessage ];
            else {
                if( messagesToSend[user][messagesToSend[user].length-1]+newMessage.length+1 > 1000 ){
                    messagesToSend[user].push(newMessage);
                } else {
                    messagesToSend[user][messagesToSend[user].length-1] += "\n" + newMessage;
                }
            }
        }
    }

    for( let userID of Object.keys(messagesToSend) ){
        let user = await discord.users.fetch(userID);
        if( user == null ) {
            console.log("Could not find user", userID);
            continue;
        }

        for( let message of messagesToSend[userID] ){
            try {
                await user.send(message);
            } catch(e) {
                console.log("Could not send message to ", user.id, ":", e);
            }
        }
    }

    console.log("Notified users about apps", Object.keys(updatedApps));
}

(async () => {
    await mongo.connect();
    db = mongo.db(process.env.MONGO_DB);

    discord.on("ready", async () => {
        console.log(`Logged in as ${discord.user.tag}.`);

        for( let command in commands ){
            process.stdout.write(`Registering ${commands[command].data.name}... `)
            
            try {
                await discord.application.commands.create(commands[command].data);
                process.stdout.write(`done.\n`);
            } catch(e){
                process.stdout.write(`error! ${e}\n`);
            }
        }
    });

    discord.on("interactionCreate", async interaction => {
        if( ! interaction.isCommand() || ! commands[interaction.commandName] ) return;

        await commands[interaction.commandName].callback(interaction, db);
    });

    steam.on("loggedOn", () => {
        steamReady = true;
    });

    steam.on("loggedOff", () => {
        steamReady = false;
    });

    setInterval(scanApps, 300000);

    discord.login(process.env.DISCORD_TOKEN);
    steam.logOn();
})();