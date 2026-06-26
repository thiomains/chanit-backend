const adminProtocols = require("../../adminProtocols");

async function list(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const filters = {};
    if (req.query.admin) filters.admin = req.query.admin;
    if (req.query.action) filters.action = req.query.action;
    if (req.query.target) filters.target = req.query.target;
    filters.page = page;
    filters.limit = limit;
    const result = await adminProtocols.getProtocols(filters);
    res.send(result);
}

async function byUser(req, res) {
    const userId = req.params.userId;
    const result = await adminProtocols.getProtocolsByUser(userId);
    res.send(result);
}

module.exports = { list, byUser };
