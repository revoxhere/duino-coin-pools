/* Duino-Coin Kolka algorithms and formulas
For documention about these functions see
https://github.com/revoxhere/duino-coin/blob/useful-tools
2019-2024 Duino-Coin community */

const poolRewards = require("../config/poolRewards.json");
const highestPCdiff = poolRewards["NET"]["difficulty"] * 5.19202;
const highestESPdiff = poolRewards["ESP32"]["difficulty"];
const highestAVRdiff = poolRewards["DUE"]["difficulty"];
const gpuMiningPercentage = poolRewards["EXTREME"]["kolka_decrease_perc"] * 0.01;
const pcMiningPercentage = poolRewards["NET"]["kolka_decrease_perc"] * 0.01;
const espMiningPercentage = poolRewards["ESP32"]["kolka_decrease_perc"] * 0.01;
const avrMiningPercentage = poolRewards["AVR"]["kolka_decrease_perc"] * 0.01;

function V1(hashrate, difficulty, workers, reward_div) {
    let output;

    try {
        output = Math.log(hashrate) / reward_div;
    } catch (err) {
        return 0;
    }

    if (difficulty > highestPCdiff) {
        // GPU, Extreme PC
        output = 2 * (output * Math.pow(gpuMiningPercentage, workers - 1));
    } else if (difficulty > highestESPdiff) {
        // PC
        output = 2 * (output * Math.pow(pcMiningPercentage, workers - 1));
    } else if (difficulty > highestAVRdiff) {
        // ESP
        output = 2 * (output * Math.pow(espMiningPercentage, workers - 1));
    } else {
        // AVR
        output = 2 * (output * Math.pow(avrMiningPercentage, workers - 1));
    }

    return output;
}

function V2(currDiff) {
    switch (currDiff) {
        case "AVR":
            return "MEGA";
        case "MEGA":
            return "ARM";
        case "ARM":
            return "DUE";
        case "DUE":
            return "ESP8266";
        case "ESP8266":
            return "ESP8266H";
        case "ESP8266H":
            return "ESP8266H";

        case "ESP8266N":
            return "ESP8266NH";
        case "ESP8266NH":
            return "ESP8266NH";

        case "ESP32":
            return "ESP32S";
        case "ESP32S":
            return "ESP32S";

        case "LOW":
            return "MEDIUM";
        case "MEDIUM":
            return "NET";
        case "NET":
            return "EXTREME";
        case "EXTREME":
            return "EXTREME";
    }
}

function V2_REVERSE(currDiff) {
    switch (currDiff) {
        case "AVR":
            return "AVR";
        case "MEGA":
            return "AVR";
        case "ARM":
            return "MEGA";
        case "DUE":
            return "ARM";

        case "ESP8266NH":
            return "ESP8266N";
        case "ESP8266N":
            return "ESP8266N";

        case "ESP8266H":
            return "ESP8266";
        case "ESP8266":
            return "ESP8266";

        case "ESP32S":
            return "ESP32"
        case "ESP32":
            return "ESP32";

        case "LOW":
            return "LOW";
        case "MEDIUM":
            return "LOW";
        case "NET":
            return "MEDIUM";
        case "EXTREME":
            return "NET";
    }
}

function V3(sharetime, expectedSharetime, difficulty, hashrate) {
    // Base difficulty calculation from hashrate
    let newDifficulty = Math.floor((hashrate / 100) * expectedSharetime);

    // Determine the deviation from the expected share time
    const deviation = sharetime / expectedSharetime;

    const hashrateScalingFactor = 0.28;

    // Adjust difficulty based on deviation
    if (deviation < 0.9) {
        // If actual share time is significantly lower, increase difficulty more aggressively
        newDifficulty *= (1 + hashrateScalingFactor);
    } else if (deviation > 1.1) {
        // If actual share time is significantly higher, decrease difficulty more aggressively
        newDifficulty *= (1 - hashrateScalingFactor);
    }

    // Apply minimum difficulty constraint
    const minDifficulty = 5000;
    newDifficulty = Math.max(newDifficulty, minDifficulty);

    return parseInt(newDifficulty);
}


function V3_OLD(sharetime, expectedSharetime, difficulty, hashrate) {
    const p = 2 - (sharetime / expectedSharetime);
    let newDifficulty = difficulty;

    if (p < 0.9 || p > 1.1) {
        newDifficulty = difficulty * p;

        if (newDifficulty < 0) {
            newDifficulty = Math.floor(
                                parseInt(difficulty / (Math.abs(p) + 2)
                            ) * 0.9) + 1;
        } else if (newDifficulty === 0) {
            newDifficulty = difficulty * 0.5;
        }
    }

    if (newDifficulty <= 5000) newDifficulty = 5000;

    return parseInt(newDifficulty);
}

function V4(sharetime, expectedTestSharetime) {
    const p = sharetime / expectedTestSharetime;

    if (p > 1.5) {
        return {
            rejected: true,
            penalty: V1(0, sharetime, 0, 0, true),
        };
    } else {
        return {
            rejected: false,
        };
    }
}

module.exports = {
    V1,
    V2,
    V2_REVERSE,
    V3,
    V4,
};
