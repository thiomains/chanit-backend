let sequence = BigInt(0);
let lastTimestamp = 0;

function generateId() {
    if (Date.now() === lastTimestamp) {
        sequence++;
    } else {
        sequence = BigInt(0);
    }
    lastTimestamp = Date.now();

    const timestamp = BigInt(Date.now() - 1735689600000);
    const machineId = 0n << 12n;
    return ((timestamp << 22n) | machineId | sequence).toString();
}

module.exports = {generateId};