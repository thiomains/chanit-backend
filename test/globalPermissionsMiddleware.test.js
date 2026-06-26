/**
 * Test: globalPermissionsMiddleware truthiness bug
 *
 * Bug: Object.keys(userPerms).includes(perm) grants access even when
 * the perm value is false. Fix: check userPerms[perm] === true.
 */
const { test, after } = require('node:test');
const assert = require('node:assert/strict');

const GLOBAL_PERMS_PATH = require.resolve('../globalPermissions');
const MIDDLEWARE_PATH = require.resolve('../globalPermissionsMiddleware');

function stubGlobalPermissions(getPermissionsFn) {
    delete require.cache[MIDDLEWARE_PATH];
    delete require.cache[GLOBAL_PERMS_PATH];

    require.cache[GLOBAL_PERMS_PATH] = {
        id: GLOBAL_PERMS_PATH,
        path: GLOBAL_PERMS_PATH,
        filename: GLOBAL_PERMS_PATH,
        loaded: true,
        exports: {
            getPermissions: getPermissionsFn,
            setPermission: () => Promise.resolve(),
        },
    };
}

function cleanStubs() {
    delete require.cache[MIDDLEWARE_PATH];
    delete require.cache[GLOBAL_PERMS_PATH];
}

function makeReq(userId) {
    return { auth: { user: { id: userId || 'test-user' } } };
}

function makeRes() {
    const res = {
        statusCode: 200,
        _body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        send(body) {
            this._body = body;
            return this;
        },
    };
    return res;
}

function makeNext() {
    const next = function () {
        next.called = true;
    };
    next.called = false;
    return next;
}

after(() => {
    cleanStubs();
});

test('all required perms truthy — calls next()', async () => {
    stubGlobalPermissions(() => Promise.resolve({ adminAccess: true, viewEmail: true }));

    const globalPermissionsMiddleware = require(MIDDLEWARE_PATH);
    const req = makeReq();
    const res = makeRes();
    const next = makeNext();

    await globalPermissionsMiddleware(['adminAccess', 'viewEmail'])(req, res, next);

    assert.strictEqual(next.called, true, 'next() should be called');
    assert.strictEqual(res.statusCode, 200, 'status should remain 200');
});

test('perm value is false — returns 403', async () => {
    stubGlobalPermissions(() => Promise.resolve({ adminAccess: true, viewEmail: false }));

    const globalPermissionsMiddleware = require(MIDDLEWARE_PATH);
    const req = makeReq();
    const res = makeRes();
    const next = makeNext();

    await globalPermissionsMiddleware(['adminAccess', 'viewEmail'])(req, res, next);

    assert.strictEqual(next.called, false, 'next() should NOT be called');
    assert.strictEqual(res.statusCode, 403, 'status should be 403');
});

test('required perm is missing from userPerms — returns 403', async () => {
    stubGlobalPermissions(() => Promise.resolve({ adminAccess: true }));

    const globalPermissionsMiddleware = require(MIDDLEWARE_PATH);
    const req = makeReq();
    const res = makeRes();
    const next = makeNext();

    await globalPermissionsMiddleware(['adminAccess', 'viewEmail'])(req, res, next);

    assert.strictEqual(next.called, false, 'next() should NOT be called');
    assert.strictEqual(res.statusCode, 403, 'status should be 403');
});

test('getPermissions returns null — returns 403', async () => {
    stubGlobalPermissions(() => Promise.resolve(null));

    const globalPermissionsMiddleware = require(MIDDLEWARE_PATH);
    const req = makeReq();
    const res = makeRes();
    const next = makeNext();

    await globalPermissionsMiddleware(['adminAccess'])(req, res, next);

    assert.strictEqual(next.called, false, 'next() should NOT be called');
    assert.strictEqual(res.statusCode, 403, 'status should be 403');
});

test('sole required perm is false — returns 403', async () => {
    stubGlobalPermissions(() => Promise.resolve({ adminAccess: false }));

    const globalPermissionsMiddleware = require(MIDDLEWARE_PATH);
    const req = makeReq();
    const res = makeRes();
    const next = makeNext();

    await globalPermissionsMiddleware(['adminAccess'])(req, res, next);

    assert.strictEqual(next.called, false, 'next() should NOT be called');
    assert.strictEqual(res.statusCode, 403, 'status should be 403');
});
