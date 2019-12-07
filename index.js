const { spawn } = require('child_process');
let toolsPath = './osu-tools';

module.exports = {
    PERCENT_COMBO: '--percent-combo',
    RULESET: '--ruleset',
    MISSES: '--misses',
    OUTPUT: '--output',
    ACC: '--accuracy',
    COMBO: '--combo',
    GOODS: '--goods',
    MEHS: '--mehs',
    MOD: '--mod',

    CATCH: 'catch',
    TAIKO: 'taiko',
    MANIA: 'mania',
    OSU: 'osu',

    setPath(path) {
        toolsPath = path;
    },

    difficulty(path, options = []) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            const calculator = spawn('dotnet', [`${toolsPath}/PerformanceCalculator.dll`, 'difficulty', path].concat(options));
            calculator.stdout.on('data', (data) => { chunks.push(data.toString()); });
            calculator.stderr.on('data', (data) => reject(data.toString()));
            calculator.on('exit', (code) => {
                const data = chunks.join('');
                const values = [...data.matchAll(/((?:\d|,)+(\.\d+)?)/gm)].map(match => match[1]);
                resolve({
                    ruleset: /^Ruleset:\s(.+)/gm.exec(data)[1],
                    title: /^[\│\║\�](\d+.+?)[\│\║\�]/gm.exec(data)[1].trim(),
                    beatmap_id: values[0],
                    stars: values[values.length - 6],
                    aim: values[values.length - 5],
                    speed: values[values.length - 4],
                    max_combo: values[values.length - 3],
                    ar: values[values.length - 2],
                    od: values[values.length - 1],
                });
            });
        });
    },

    performance(path, options = []) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            const calculator = spawn('dotnet', [`${toolsPath}/PerformanceCalculator.dll`, 'performance', path].concat(options));
            calculator.stdout.on('data', (data) => { chunks.push(data.toString()); });
            calculator.stderr.on('data', (data) => reject(data.toString()));
            calculator.on('exit', (code) => {
                const data = chunks.join('').replace(/\r/g, '').split('\n\n').filter(string => string.length);
                resolve(data.map(single => {
                    return {
                        path: /^(.*)$/m.exec(single)[1],
                        player: /^Player\s+:\s(.+)/gm.exec(single)[1],
                        mods: /^Mods\s+:\s(.+)/gm.exec(single)[1].split(', '),
                        accuracy: Number(/^Accuracy\s+:\s(-?\d+(\.\d+)?)$/gm.exec(single)[1]),
                        speed: Number(/^Speed\s+:\s(-?\d+(\.\d+)?)/gm.exec(single)[1]),
                        aim: Number(/^Aim\s+:\s(-?\d+(\.\d+)?)/gm.exec(single)[1]),
                        od: Number(/^OD\s+:\s(-?\d+(\.\d+)?)/gm.exec(single)[1]),
                        ar: Number(/^AR\s+:\s(-?\d+(\.\d+)?)/gm.exec(single)[1]),
                        max_combo: Number(/^Max Combo\s+:\s(-?\d+(\.\d+)?)/gm.exec(single)[1]),
                        pp: Number(/^pp\s+:\s(-?\d+(\.\d+)?)/gm.exec(single)[1])
                    };
                }));
            });
        });
    },

    profile(apiKey, user, options = []) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            const calculator = spawn('dotnet', [`${toolsPath}/PerformanceCalculator.dll`, 'profile', user, apiKey].concat(options));
            calculator.stdout.on('data', (data) => { chunks.push(data.toString()); });
            calculator.stderr.on('data', (data) => reject(data.toString()));
            calculator.on('exit', (code) => {
                const data = chunks.join('');
                const matches = [...data.matchAll(/^[\│\║\�]([^\│\║\�]+)[\│\║\�]([^\│\║\�]+)[\│\║\�]([^\│\║\�]+)[\│\║\�]([^\│\║\�]+)[\│\║\�]([^\│\║\�]+)[\│\║\�]/gm)];
                const profile = {
                    user: /User:\s+(.+)/gm.exec(data)[1],
                    live_pp: /Live PP:\s+(.+)/gm.exec(data)[1],
                    local_pp: /Local PP:\s+(.+)/gm.exec(data)[1],
                    plays: []
                };
                for (let i = 1; i < matches.length; i++) {
                    const matched = /(\d+) - (.+)/gm.exec(matches[i][1]);
                    profile.plays.push({
                        beatmap_id: matched[1],
                        beatmap: matched[2].trim(),
                        live_pp: Number(matches[i][2].replace(',', '')),
                        local_pp: Number(matches[i][3].replace(',', '')),
                        pp_change: Number(matches[i][4].replace(',', '')),
                        position_change: Number(matches[i][5].replace(',', ''))
                    });
                }
                resolve(profile);
            });
        });
    },

    simulate(path, options = [], mode = 'osu') {
        return new Promise((resolve, reject) => {
            const chunks = [];
            const calculator = spawn('dotnet', [`${toolsPath}/PerformanceCalculator.dll`, 'simulate', mode, path].concat(options));
            calculator.stdout.on('data', (data) => chunks.push(data.toString()));
            calculator.stderr.on('data', (data) => {
                console.log(data.toString());
                reject(data.toString());
            });
            calculator.on('exit', (code) => {
                const data = chunks.join('');
                console.log(`DATA: ${data}`);
                const simulated = {
                    title: /^(.*)$/m.exec(data)[1],
                    accuracy_achieved: Number(/^Accuracy\s+:\s(\d+(\.\d+)?)%/gm.exec(data)[1]),
                    combo: Number(/^Combo\s+:\s(-?\d+(\.\d+)?).+/gm.exec(data)[1]),
                    great: Number(/^Great\s+:\s(-?\d+(\.\d+)?)/gm.exec(data)[1]),
                    good: Number(/^Good\s+:\s(-?\d+(\.\d+)?)/gm.exec(data)[1]),
                    meh: Number(/^Meh\s+:\s(-?\d+(\.\d+)?)/gm.exec(data)[1]),
                    miss: Number(/^Miss\s+:\s(-?\d+(\.\d+)?)/gm.exec(data)[1]),
                    mods: /^Mods\s+:\s(.+)/gm.exec(data)[1].split(', '),
                    aim: /^Aim/gm.test(data) ? Number(/^Aim\s+:\s(-?\d+(\.\d+)?)/gm.exec(data)[1]) : NaN,
                    speed: /^Speed/gm.test(data) ? Number(/^Speed\s+:\s(-?\d+(\.\d+)?)/gm.exec(data)[1]) : NaN,
                    accuracy: /^Accuracy/gm.test(data) ? Number(/^Accuracy\s+:\s(-?\d+(\.\d+)?)$/gm.exec(data)[1]) : NaN,
                    od: /^OD/gm.test(data) ? Number(/^OD\s+:\s(-?\d+(\.\d+)?)/gm.exec(data)[1]) : NaN,
                    ar: /^AR/gm.test(data) ? Number(/^AR\s+:\s(-?\d+(\.\d+)?)/gm.exec(data)[1]) : NaN,
                    max_combo: /^Max Combo/gm.test(data) ? Number(/^Max Combo\s+:\s(-?\d+(\.\d+)?)/gm.exec(data)[1]) : NaN,
                    pp: /^pp/gm.test(data) ? Number(/^pp\s+:\s(-?\d+(\.\d+)?)/gm.exec(data)[1]) : NaN
                };
                resolve(simulated);
            });
        });
    }
};