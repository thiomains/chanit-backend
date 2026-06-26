const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { installFakeDb, resetAllCollections, fakeDb } = require('./helpers/fakeDb');

installFakeDb();
const { logAction, getProtocols, getProtocolsByUser } = require('../adminProtocols');

const adminUser = { id: 'admin123', username: 'AdminJoe' };

describe('adminProtocols', () => {
    beforeEach(() => {
        resetAllCollections();
    });

    describe('logAction', () => {
        it('creates a document with all required fields', async () => {
            const doc = await logAction(
                adminUser, 'target456', 'TargetUser', 'ban', 'spamming', '192.168.1.1'
            );

            assert.ok(typeof doc.id === 'string' && doc.id.length > 0);
            assert.strictEqual(doc.adminUserId, 'admin123');
            assert.strictEqual(doc.adminUsername, 'AdminJoe');
            assert.strictEqual(doc.targetUserId, 'target456');
            assert.strictEqual(doc.targetUsername, 'TargetUser');
            assert.strictEqual(doc.action, 'ban');
            assert.strictEqual(doc.reason, 'spamming');
            assert.ok(typeof doc.timestamp === 'number');
            assert.strictEqual(doc.ipAddress, '192.168.1.1');

            const col = fakeDb.collection('adminProtocols');
            const stored = await col.findOne({ id: doc.id });
            assert.ok(stored);
        });

        it('generates unique IDs for each log entry', async () => {
            const doc1 = await logAction(adminUser, 't1', 'u1', 'mute', 'reason1', '1.1.1.1');
            const doc2 = await logAction(adminUser, 't2', 'u2', 'warn', 'reason2', '2.2.2.2');

            assert.notStrictEqual(doc1.id, doc2.id);
        });

        it('sets timestamp within 1000ms of Date.now()', async () => {
            const doc = await logAction(adminUser, 't1', 'u1', 'ban', 'r', '1.1.1.1');

            const delta = Math.abs(doc.timestamp - Date.now());
            assert.ok(delta < 1000, `timestamp delta ${delta}ms exceeds 1000ms limit`);
        });
    });

    describe('getProtocols', () => {
        it('returns { items, total, page, limit } structure', async () => {
            const result = await getProtocols({});

            assert.ok(Array.isArray(result.items));
            assert.strictEqual(typeof result.total, 'number');
            assert.strictEqual(typeof result.page, 'number');
            assert.strictEqual(typeof result.limit, 'number');
            assert.ok('items' in result);
            assert.ok('total' in result);
            assert.ok('page' in result);
            assert.ok('limit' in result);
        });

        it('filters by admin (matches adminUserId)', async () => {
            const col = fakeDb.collection('adminProtocols');
            await col.insertOne({ id: 'a', adminUserId: 'admin1', adminUsername: 'a', targetUserId: 't', targetUsername: 't', action: 'ban', reason: 'r', timestamp: 100, ipAddress: '1.1.1.1' });
            await col.insertOne({ id: 'b', adminUserId: 'admin2', adminUsername: 'b', targetUserId: 't', targetUsername: 't', action: 'ban', reason: 'r', timestamp: 200, ipAddress: '1.1.1.1' });
            await col.insertOne({ id: 'c', adminUserId: 'admin1', adminUsername: 'a', targetUserId: 't', targetUsername: 't', action: 'warn', reason: 'r', timestamp: 300, ipAddress: '1.1.1.1' });

            const result = await getProtocols({ admin: 'admin1' });

            assert.strictEqual(result.items.length, 2);
            assert.strictEqual(result.total, 2);
            for (const item of result.items) {
                assert.strictEqual(item.adminUserId, 'admin1');
            }
        });

        it('filters by action', async () => {
            const col = fakeDb.collection('adminProtocols');
            await col.insertOne({ id: 'a', adminUserId: 'a1', adminUsername: 'a', targetUserId: 't', targetUsername: 't', action: 'ban', reason: 'r', timestamp: 100, ipAddress: '1.1.1.1' });
            await col.insertOne({ id: 'b', adminUserId: 'a1', adminUsername: 'a', targetUserId: 't', targetUsername: 't', action: 'warn', reason: 'r', timestamp: 200, ipAddress: '1.1.1.1' });
            await col.insertOne({ id: 'c', adminUserId: 'a1', adminUsername: 'a', targetUserId: 't', targetUsername: 't', action: 'ban', reason: 'r', timestamp: 300, ipAddress: '1.1.1.1' });

            const result = await getProtocols({ action: 'ban' });

            assert.strictEqual(result.items.length, 2);
            assert.strictEqual(result.total, 2);
            for (const item of result.items) {
                assert.strictEqual(item.action, 'ban');
            }
        });

        it('filters by target (matches targetUserId)', async () => {
            const col = fakeDb.collection('adminProtocols');
            await col.insertOne({ id: 'a', adminUserId: 'a1', adminUsername: 'a', targetUserId: 'userA', targetUsername: 'ta', action: 'ban', reason: 'r', timestamp: 100, ipAddress: '1.1.1.1' });
            await col.insertOne({ id: 'b', adminUserId: 'a1', adminUsername: 'a', targetUserId: 'userB', targetUsername: 'tb', action: 'ban', reason: 'r', timestamp: 200, ipAddress: '1.1.1.1' });
            await col.insertOne({ id: 'c', adminUserId: 'a1', adminUsername: 'a', targetUserId: 'userA', targetUsername: 'ta', action: 'warn', reason: 'r', timestamp: 300, ipAddress: '1.1.1.1' });

            const result = await getProtocols({ target: 'userA' });

            assert.strictEqual(result.items.length, 2);
            assert.strictEqual(result.total, 2);
            for (const item of result.items) {
                assert.strictEqual(item.targetUserId, 'userA');
            }
        });

        it('paginates: page=1, limit=2 returns first 2 of 5 items with total=5', async () => {
            const col = fakeDb.collection('adminProtocols');
            for (let i = 0; i < 5; i++) {
                await col.insertOne({
                    id: String(i), adminUserId: 'a1', adminUsername: 'a',
                    targetUserId: 't' + i, targetUsername: 'tu',
                    action: 'ban', reason: 'r', timestamp: 1000 + i * 100,
                    ipAddress: '1.1.1.1'
                });
            }

            const result = await getProtocols({ page: 1, limit: 2 });

            assert.strictEqual(result.items.length, 2);
            assert.strictEqual(result.total, 5);
            assert.strictEqual(result.page, 1);
            assert.strictEqual(result.limit, 2);
        });

        it('sorts results by timestamp descending (newest first)', async () => {
            const col = fakeDb.collection('adminProtocols');
            await col.insertOne({ id: '1', adminUserId: 'a', adminUsername: 'a', targetUserId: 't', targetUsername: 't', action: 'ban', reason: 'r', timestamp: 100, ipAddress: '1.1.1.1' });
            await col.insertOne({ id: '2', adminUserId: 'a', adminUsername: 'a', targetUserId: 't', targetUsername: 't', action: 'ban', reason: 'r', timestamp: 300, ipAddress: '1.1.1.1' });
            await col.insertOne({ id: '3', adminUserId: 'a', adminUsername: 'a', targetUserId: 't', targetUsername: 't', action: 'ban', reason: 'r', timestamp: 200, ipAddress: '1.1.1.1' });

            const result = await getProtocols({});

            assert.strictEqual(result.items.length, 3);
            assert.ok(result.items[0].timestamp >= result.items[1].timestamp,
                `Expected ${result.items[0].timestamp} >= ${result.items[1].timestamp}`);
            assert.ok(result.items[1].timestamp >= result.items[2].timestamp,
                `Expected ${result.items[1].timestamp} >= ${result.items[2].timestamp}`);
        });
    });

    describe('getProtocolsByUser', () => {
        it('returns only protocols where targetUserId matches userId', async () => {
            const col = fakeDb.collection('adminProtocols');
            await col.insertOne({ id: 'a', adminUserId: 'a1', adminUsername: 'a', targetUserId: 'userX', targetUsername: 'tx', action: 'ban', reason: 'r', timestamp: 100, ipAddress: '1.1.1.1' });
            await col.insertOne({ id: 'b', adminUserId: 'a1', adminUsername: 'a', targetUserId: 'userY', targetUsername: 'ty', action: 'warn', reason: 'r', timestamp: 200, ipAddress: '1.1.1.1' });
            await col.insertOne({ id: 'c', adminUserId: 'a2', adminUsername: 'b', targetUserId: 'userX', targetUsername: 'tx', action: 'mute', reason: 'r', timestamp: 300, ipAddress: '1.1.1.1' });

            const result = await getProtocolsByUser('userX');

            assert.strictEqual(result.items.length, 2);
            for (const item of result.items) {
                assert.strictEqual(item.targetUserId, 'userX');
            }
        });
    });
});
