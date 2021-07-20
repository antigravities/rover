let regices = [
    /^https?\:\/\/(?:store\.steampowered\.com|steamdb\.info|steamcommunity\.com)\/app\/(\d{1,6})/, // Steam Store, Steam Community, SteamDB
    /^https?\:\/\/s\.team\/a\/(\d{1,6})\/?$/, // s.team
    /^(\d{1,6})$/ // plain appID
];

module.exports = function parseApp(appString){
    let appid = -1;

    for( let regex of regices ){
        let res = regex.exec(appString);

        if( res == null ) continue;

        appid = parseInt(res[1]);
        break;
    }

    return appid;
}