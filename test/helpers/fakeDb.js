/**
 * In-memory fake database for unit testing without a live MongoDB.
 *
 * Usage in a test file:
 *   const { installFakeDb, uninstallFakeDb, fakeDb } = require('./helpers/fakeDb');
 *
 *   installFakeDb();
 *   const myModule = require('../../myModule');  // now uses fakeDb
 *
 *   test('something', async () => {
 *     const db = await myModule.someDbCall();
 *     const col = fakeDb.collections.userData;
 *     assert.strictEqual(col.length, 1);
 *   });
 *
 *   uninstallFakeDb();  // restore real ./database
 */
const path = require('path');

const FAKE_MODULE_PATH = path.resolve(__dirname, '../../database.js');

class FakeCollection {
    constructor() {
        this.documents = [];
    }

    insertOne(doc) {
        this.documents.push({ ...doc });
        return Promise.resolve({ insertedId: doc._id || 'fake-id' });
    }

    updateOne(filter, update, options = {}) {
        const idx = this.documents.findIndex(d =>
            Object.entries(filter).every(([k, v]) => d[k] === v)
        );
        if (idx !== -1) {
            if (update.$set) {
                Object.assign(this.documents[idx], update.$set);
            } else {
                Object.assign(this.documents[idx], update);
            }
        } else if (options.upsert) {
            const newDoc = update.$set
                ? { ...filter, ...update.$set }
                : { ...filter, ...update };
            this.documents.push(newDoc);
        }
        return Promise.resolve({ matchedCount: idx !== -1 ? 1 : 0, upsertedCount: options.upsert && idx === -1 ? 1 : 0 });
    }

    _matchesFilter(doc, filter) {
        return Object.entries(filter).every(([k, v]) => {
            if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
                if ('$all' in v) {
                    return Array.isArray(doc[k]) && v.$all.every(x => doc[k].includes(x));
                }
                return JSON.stringify(doc[k]) === JSON.stringify(v);
            }
            return doc[k] === v;
        });
    }

    findOne(filter) {
        const match = this.documents.find(d => this._matchesFilter(d, filter));
        return Promise.resolve(match || null);
    }

    find(filter) {
        const docs = !filter ? [...this.documents] : this.documents.filter(d => this._matchesFilter(d, filter));
        const cursor = {
            _docs: docs,
            _sortSpec: null,
            _skip: 0,
            _limit: Infinity,
            toArray() {
                let result = [...this._docs];
                if (this._sortSpec) {
                    const entries = Object.entries(this._sortSpec);
                    result.sort((a, b) => {
                        for (const [field, order] of entries) {
                            if (a[field] < b[field]) return -1 * order;
                            if (a[field] > b[field]) return 1 * order;
                        }
                        return 0;
                    });
                }
                if (this._skip > 0) result = result.slice(this._skip);
                if (this._limit !== Infinity) result = result.slice(0, this._limit);
                return Promise.resolve(result);
            },
            sort(spec) { this._sortSpec = spec; return this; },
            skip(n) { this._skip = n; return this; },
            limit(n) { this._limit = n; return this; },
            project() { return this; },
            aggregate() { return this; },
        };
        return cursor;
    }

    deleteOne(filter) {
        const idx = this.documents.findIndex(d =>
            Object.entries(filter).every(([k, v]) => d[k] === v)
        );
        const deleted = idx !== -1 ? 1 : 0;
        if (idx !== -1) this.documents.splice(idx, 1);
        return Promise.resolve({ deletedCount: deleted });
    }

    deleteMany(filter) {
        const before = this.documents.length;
        this.documents = this.documents.filter(d =>
            !Object.entries(filter).every(([k, v]) =>
                Array.isArray(v) ? v.every(x => d[k]?.includes(x)) : d[k] === v
            )
        );
        return Promise.resolve({ deletedCount: before - this.documents.length });
    }

    countDocuments(filter) {
        const count = !filter ? this.documents.length : this.documents.filter(d =>
            Object.entries(filter).every(([k, v]) =>
                Array.isArray(v) ? v.every(x => d[k]?.includes(x)) : d[k] === v
            )
        ).length;
        return Promise.resolve(count);
    }

    reset() {
        this.documents = [];
    }
}

const fakeCollections = {};

const fakeDbObject = {
    collection(name) {
        if (!fakeCollections[name]) {
            fakeCollections[name] = new FakeCollection();
        }
        return fakeCollections[name];
    },
};

function installFakeDb() {
    if (require.cache[FAKE_MODULE_PATH]) {
        delete require.cache[FAKE_MODULE_PATH];
    }
    require.cache[FAKE_MODULE_PATH] = {
        id: FAKE_MODULE_PATH,
        path: FAKE_MODULE_PATH,
        filename: FAKE_MODULE_PATH,
        loaded: true,
        exports: {
            connectDatabase: () => Promise.resolve(fakeDbObject),
        },
    };
}

function uninstallFakeDb() {
    delete require.cache[FAKE_MODULE_PATH];
}

function resetAllCollections() {
    Object.values(fakeCollections).forEach(c => c.reset());
}

module.exports = {
    installFakeDb,
    uninstallFakeDb,
    resetAllCollections,
    fakeDb: fakeDbObject,
    getFakeCollections: () => fakeCollections,
    FakeCollection,
};
