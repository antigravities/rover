const parseApp = require("../util/parseApp");

module.exports = {
    data: {
        name: "untrack",
        description: "Stop tracking prices for an app.",
        options: [
            {
                name: 'app',
                type: 'STRING',
                description: 'The page of the app to stop tracking, i.e. https://store.steampowered.com/app/439720/Unending_Galaxy',
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
            $pull: {
                users: interaction.user.id
            }
        },
        { upsert: true });

        await interaction.reply(`You'll no longer receive notifications about that app.`);
    }
}