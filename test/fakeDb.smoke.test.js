/**
 * Smoke test for fakeDb — tests FakeCollection API directly.
 * Works without any MongoDB connection.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { FakeCollection } = require('./helpers/fakeDb');

test('FakeCollection: insertOne + findOne', async () => {
    const col = new FakeCollection();
    await col.insertOne({ id: '1', name: 'test', active: true });
    const doc = await col.findOne({ id: '1' });
    assert.strictEqual(doc.name, 'test');
    assert.strictEqual(doc.active, true);
});

test('FakeCollection: findOne returns null for no match', async () => {
    const col = new FakeCollection();
    await col.insertOne({ id: 'x' });
    assert.strictEqual(await col.findOne({ id: 'y' }), null);
});

test('FakeCollection: updateOne with $set', async () => {
    const col = new FakeCollection();
    await col.insertOne({ userId: 'u1', adminAccess: true });
    await col.updateOne({ userId: 'u1' }, { $set: { viewEmail: true } });
    const doc = await col.findOne({ userId: 'u1' });
    assert.strictEqual(doc.adminAccess, true);
    assert.strictEqual(doc.viewEmail, true);
});

test('FakeCollection: upsert creates new document', async () => {
    const col = new FakeCollection();
    await col.updateOne({ userId: 'new' }, { $set: { active: true } }, { upsert: true });
    const doc = await col.findOne({ userId: 'new' });
    assert.strictEqual(doc.active, true);
});

test('FakeCollection: find with $all array filter', async () => {
    const col = new FakeCollection();
    await col.insertOne({ users: ['a', 'b'], friendsSince: 100 });
    await col.insertOne({ users: ['a', 'c'], friendsSince: 200 });
    const docs = await col.find({ users: { $all: ['a'] } }).toArray();
    assert.strictEqual(docs.length, 2);
});

test('FakeCollection: countDocuments', async () => {
    const col = new FakeCollection();
    await col.insertOne({ active: true });
    await col.insertOne({ active: true });
    await col.insertOne({ active: false });
    assert.strictEqual(await col.countDocuments(), 3);
    assert.strictEqual(await col.countDocuments({ active: true }), 2);
});

test('FakeCollection: deleteOne + deleteMany', async () => {
    const col = new FakeCollection();
    await col.insertOne({ id: 'a' });
    await col.insertOne({ id: 'b' });
    await col.insertOne({ id: 'b' });
    const r1 = await col.deleteOne({ id: 'a' });
    assert.strictEqual(r1.deletedCount, 1);
    assert.strictEqual(await col.countDocuments(), 2);
    const r2 = await col.deleteMany({ id: 'b' });
    assert.strictEqual(r2.deletedCount, 2);
    assert.strictEqual(await col.countDocuments(), 0);
});

test('FakeCollection: reset clears all', async () => {
    const col = new FakeCollection();
    await col.insertOne({ value: 1 });
    col.reset();
    assert.strictEqual(await col.countDocuments(), 0);
});

test('node:test runner works', () => {
    assert.ok(true);
});
