const q = require('daskeyboard-applet');
const childprocess = require('child_process');
const logger = q.logger;

const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function check_keylock(lockkey) {
    const { stdout, stderr } = await exec('xset -display :0.0 q|grep "LED mask"|awk \'{ print $NF }\'');
		if (stderr.trim() !== "") {
			  logger.warn(`Error while executing check_keylock: ${stderr}`);
			  return reject(stderr);
		}; //*/
    return (Number(lockkey) & Number(stdout.trim()))
        ? 1
        : 0;
}

class LockLEDs extends q.DesktopApp {
    constructor() {
        super();
        this.pollingInterval = 1000;
    }

    async run() {
        const state = 0;
        return this.getLockKey()
            .then(key => check_keylock(key))
            .then(state => this.buildSignal(this.getStatusColor(state), state))
            .catch(error => this.buildSignal(this.getOffColor(), error));
    }

    async applyConfig() {
        return this.getLockKey()
            .then(key => check_keylock(key))
            .then(state => state === 1)
            .catch(error => {
                logger.warn(error);
                return false;
            });
    }

    getLockKey() {
        return this.config.lockKey
            ? Promise.resolve(this.config.lockKey)
            : Promise.reject()
    }

    getOnColor() {
        return this.config.onColor
            ? this.config.onColor
            : "#0000FF";
    }

    getOffColor() {
        return this.config.offColor
            ? this.config.offColor
            : "#000000";
    }

    getStatusColor(state) {
        return state === 1
            ? this.getOnColor()
            : this.getOffColor();
    }

    buildSignal(color, state) {
        return new q.Signal({
            points: [
                [new q.Point(color)]
            ],
            name: `Lock state: ${state}`,
        });
    }
}

module.exports = {
	LockLEDs: LockLEDs
};

const lockLEDs = new LockLEDs();
