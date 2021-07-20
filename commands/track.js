const parseApp = require("../util/parseApp");

module.exports = {
    data: {
        name: "track",
        description: "Track prices for an app.",
        options: [
            {
                name: 'app',
                type: 'STRING',
                description: 'The Store page of the app to track, i.e. https://store.steampowered.com/app/439720/Unending_Galaxy',
                required: true
            }
        ]
    },
    callback: async (interaction, db) => {
        let appOption = interaction.options.getString("app");

        if( ! appOption ) {
            return await interaction.reply("Could not find a valid page in your request. Check your spelling, or enter a raw AppID.");
        }
        
        let appid = parseApp(appOption);

        if( appid == -1 ){
            return await interaction.reply("Could not find a valid page in your request. Check your spelling, or enter a raw AppID.");
        }

        let apps = db.collection("apps");

        await apps.updateOne({ _id: appid }, {
            $addToSet: {
                users: interaction.user.id
            }
        },
        { upsert: true });

        await interaction.reply(`You'll now receive notifications about discounts for https://store.steampowered.com/app/${appid}. To unsubscribe, use the \`/untrack\` command.`);
    }
}