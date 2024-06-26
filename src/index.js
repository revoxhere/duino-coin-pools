/* Duino-Coin Pool
For documention about these functions see
https://github.com/revoxhere/duino-coin/blob/useful-tools
2019-2024 Duino-Coin community */

const fs = require("fs");
const net = require("net");
const handle = require("./connectionHandler");
const sync = require("./sync");
const { spawn } = require("child_process");
const log = require("./logging");
let { use_ngrok, port, host, autoRestart, guessPort, use_serveo } = require("../config/config.json");

connections = 0;

const getRand = (min, max) => {
    return Math.floor(Math.random() * (max-min) + min);
};

if (guessPort) {
    configFile = require("../config/config.json");
    port = getRand(1000, 9999);
    configFile.port = port;
    fs.writeFileSync(`${__dirname}/../config/config.json`, JSON.stringify(configFile, null, 4), 'utf8');
}

if (use_serveo) {
    serveo = spawn(`ssh`, ["-R", `${port}:localhost:${port}`, "serveo.net"]);

    serveo.stderr.on("data", (data) => {
        log.info(`serveo data: ${data}`);
    });

    serveo.on("error", (err) => {
        log.error(`serveo error: ${err}`);
        process.exit(-1);
    });

    serveo.on("close", (code) => {
        log.error(`serveo exited (code ${code})`);
        process.exit(-1);
    });
}

if (use_ngrok) {
    ngrok = spawn(`ngrok`, ["tcp", "--region", "eu", "2811"]);

    ngrok.stderr.on("data", (data) => {
        log.error(`Ngrok stderr: ${data}`);
        process.exit(-1);
    });

    ngrok.on("error", (err) => {
        log.error(`Ngrok error: ${err}`);
        process.exit(-1);
    });

    ngrok.on("close", (code) => {
        log.error(`Ngrok exited (code ${code})`);
        spawn(`sudo pkill ngrok`);
        process.exit(-1);
    });
}

sync.updatePoolReward();
sync.login();

// require("./dashboard");

const server = net.createServer(handle);
server.listen(port, host, 0, () => {
    log.info(`Server listening on port ${port}\n`);
});

process.once("SIGINT", async () => {
    log.warning(
        "SIGINT detected, closing the server and logging out the pool..."
    );
    await sync.logout();
    server.close();
    process.exit(0);
});

process.once("SIGTERM", async () => {
    log.warning(
        "SIGTERM detected, closing the server and logging out the pool..."
    );
    await sync.logout();
    server.close();
    process.exit(0);
});

setInterval(() => {
    server.getConnections((error, count) => {
        if (!error) {
            connections = count;
            log.info(`Connected clients: ${count}`);
        }
    });
}, 10000);

if (autoRestart > 0) {
    log.info(`Autorestarter enabled (every ${autoRestart} minutes)`);
    setTimeout(function () {
        log.info(`Restarting`);
        if (use_ngrok) ngrok.kill();
        process.exit(1);
    }, autoRestart * 1000 * 60);
}
