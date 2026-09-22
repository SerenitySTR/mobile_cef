const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;
const warnings = [];

function ok(condition, message) {
    if (!condition) throw new Error(message);
}

function equal(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual:   ${JSON.stringify(actual)}`);
    }
}

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`✓ ${name}`);
    } catch (error) {
        failed++;
        console.error(`✗ ${name}`);
        console.error(`  ${String(error && error.message ? error.message : error).replace(/\n/g, '\n  ')}`);
    }
}

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function walk(dir, predicate = () => true) {
    const result = [];
    const absolute = path.join(root, dir);
    if (!fs.existsSync(absolute)) return result;

    for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
        const rel = path.join(dir, entry.name);
        if (entry.isDirectory()) result.push(...walk(rel, predicate));
        else if (predicate(rel)) result.push(rel.replace(/\\/g, '/'));
    }
    return result;
}

function buildFromTemplate() {
    const template = read('src/index.template.html');
    return template.replace(/<!--\s*@include\s+(.+?)\s*-->/g, (match, filePath) => {
        const includePath = path.join(root, 'src', filePath.trim());
        ok(fs.existsSync(includePath), `Missing include: src/${filePath.trim()}`);
        return fs.readFileSync(includePath, 'utf8');
    });
}

function stripQueryHash(value) {
    return value.split('#')[0].split('?')[0];
}

function isExternal(value) {
    return /^(?:https?:|data:|blob:|javascript:|mailto:|tel:|#)/i.test(value) || value.startsWith('//');
}

function collectHtmlAssetRefs(html) {
    const refs = [];
    const re = /\b(?:src|href)\s*=\s*["']([^"']+)["']/gi;
    let match;
    while ((match = re.exec(html))) {
        const value = match[1].trim();
        if (!value || isExternal(value)) continue;
        refs.push(value);
    }
    return refs;
}

function collectCssUrls(css) {
    const refs = [];
    const re = /url\(\s*["']?([^"')]+)["']?\s*\)/gi;
    let match;
    while ((match = re.exec(css))) {
        const value = match[1].trim();
        if (!value || isExternal(value) || value.startsWith('var(')) continue;
        refs.push(value);
    }
    return refs;
}

function hasAll(source, values, label) {
    for (const value of values) {
        ok(source.includes(value), `${label} is missing ${value}`);
    }
}

console.log('\nCEF test suite\n==============');

test('build: all @include files exist', () => {
    const template = read('src/index.template.html');
    const includes = [...template.matchAll(/<!--\s*@include\s+(.+?)\s*-->/g)].map(match => match[1].trim());
    ok(includes.length > 0, 'No sections are included by src/index.template.html');
    for (const file of includes) {
        ok(fs.existsSync(path.join(root, 'src', file)), `Missing src/${file}`);
    }
    equal(new Set(includes).size, includes.length, 'Duplicate @include found in template');
});

test('build: index.html matches src/index.template.html exactly', () => {
    const expected = buildFromTemplate();
    const actual = read('index.html');
    equal(actual, expected, 'index.html is stale. Run: node build');
});

test('build: generated index contains no unresolved @include', () => {
    ok(!/@include\b/.test(read('index.html')), 'index.html still contains @include directives');
});

test('html: every id in generated index.html is unique', () => {
    const html = read('index.html');
    const ids = [...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map(match => match[1]);
    const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    ok(duplicates.length === 0, `Duplicate id values: ${duplicates.join(', ')}`);
});

test('assets: every local HTML src/href exists', () => {
    const refs = collectHtmlAssetRefs(read('index.html'));
    const missing = [];
    for (const ref of refs) {
        const clean = stripQueryHash(ref).replace(/^\.\//, '');
        if (!clean) continue;
        const absolute = path.join(root, clean);
        if (!fs.existsSync(absolute)) missing.push(ref);
    }
    ok(missing.length === 0, `Missing HTML assets:\n${missing.join('\n')}`);
});

test('assets: every local CSS url(...) exists', () => {
    const cssFiles = walk('assets/CSS/styles', file => file.endsWith('.css'));
    const missing = [];
    for (const file of cssFiles) {
        const absoluteCss = path.join(root, file);
        const css = fs.readFileSync(absoluteCss, 'utf8');
        for (const ref of collectCssUrls(css)) {
            const clean = stripQueryHash(ref);
            const absolute = path.resolve(path.dirname(absoluteCss), clean);
            if (!fs.existsSync(absolute)) missing.push(`${file} -> ${ref}`);
        }
    }
    ok(missing.length === 0, `Missing CSS assets:\n${missing.join('\n')}`);
});

test('javascript: every production JS file passes node --check', () => {
    const jsFiles = walk('assets/JavaScript', file => file.endsWith('.js'));
    const bad = [];
    for (const file of jsFiles) {
        const result = spawnSync(process.execPath, ['--check', path.join(root, file)], { encoding: 'utf8' });
        if (result.status !== 0) bad.push(`${file}: ${(result.stderr || result.stdout).trim()}`);
    }
    ok(bad.length === 0, bad.join('\n'));
});

test('cef-wrapper: Unicode JSON transport is ASCII-safe and decodes back correctly', () => {
    const emitted = [];
    const listeners = {};
    const context = {
        console,
        setInterval: () => 1,
        clearInterval: () => {},
        requestAnimationFrame: callback => callback(),
        window: {
            cef: {
                emit: (eventName, data) => emitted.push({ eventName, data }),
                on: (eventName, callback) => { listeners[eventName] = callback; },
                off: () => {}
            },
            addEventListener: () => {}
        }
    };
    context.window.window = context.window;
    vm.createContext(context);
    vm.runInContext(read('assets/JavaScript/cef-wrapper.js'), context, { filename: 'cef-wrapper.js' });
    const payload = { Message: 'Привіт, світ!' };
    context.window.GameCef.sendJson('test:unicode', payload);
    const sent = emitted.find(item => item.eventName === 'test:unicode');
    ok(sent, 'GameCef.sendJson did not emit payload');
    ok(/^[\x00-\x7F]*$/.test(sent.data), 'Transport JSON contains non-ASCII characters');
    equal(JSON.parse(sent.data).Message, payload.Message, 'Unicode payload did not round-trip');
});

test('events: core frontend/server event contracts still exist', () => {
    const expected = {
        'authorization.js': ['authorization:show', 'authorization:hide', 'authorization:submit'],
        'registration.js': ['registration:show', 'registration:hide', 'registration:submit'],
        'spawn.js': ['spawn:show', 'spawn:hide', 'spawn:submit'],
        'dialog.js': ['dialog:show', 'dialog:hide', 'dialog:response'],
        'notifications.js': ['notification:show', 'notification:toast', 'notification:banner', 'notification:reward', 'notification:achievement', 'notification:bottom', 'notification:hide', 'notification:clear'],
        'tickets.js': ['ticket:show', 'ticket:hide', 'ticket:update', 'ticket:create', 'ticket:message', 'ticket:close', 'ticket:close-ui'],
        'admin-panel.js': ['admin:show', 'admin:hide', 'admin:update', 'admin:ticket:open', 'admin:ticket:claim', 'admin:ticket:release', 'admin:ticket:close', 'admin:ticket:message', 'admin:ticket:transfer']
    };

    for (const [file, events] of Object.entries(expected)) {
        hasAll(read(`assets/JavaScript/${file}`), events, file);
    }
});

test('admin-panel: legacy and chunked ticket sync protocols are both supported', () => {
    const source = read('assets/JavaScript/admin-panel.js');
    hasAll(source, [
        'patch==="reset"',
        'patch==="sync-begin"',
        'patch==="ready" || patch==="sync-end"',
        'patch==="messages"',
        'patch==="messages-begin"',
        'patch==="messages-end"'
    ], 'admin-panel.js');
});

test('dialog hotkeys: Enter activates left button and Escape activates right button', () => {
    const documentListeners = {};
    let leftClicks = 0;
    let rightClicks = 0;
    const buttons = [
        { disabled: false, click: () => leftClicks++ },
        { disabled: false, click: () => rightClicks++ }
    ];
    const activeScreen = { classList: { contains: value => value === 'active', toggle: () => {} } };
    const inactiveScreen = { classList: { contains: () => false } };

    const document = {
        documentElement: { clientWidth: 1280, clientHeight: 720 },
        getElementById: id => id === 'error-screen' ? inactiveScreen : null,
        querySelectorAll: selector => selector === '#dialog-buttons .dialog-button' ? buttons : [],
        addEventListener: (type, callback) => { documentListeners[type] = callback; },
        createElement: () => ({})
    };
    const context = {
        console,
        document,
        navigator: { userAgent: '', maxTouchPoints: 0 },
        window: { innerWidth: 1280, innerHeight: 720, addEventListener: () => {} },
        GameCef: { on: () => {}, sendJson: () => {} },
        setTimeout: callback => callback()
    };
    vm.createContext(context);
    vm.runInContext(read('assets/JavaScript/dialog.js'), context, { filename: 'dialog.js' });
    context.Dialog.screen = activeScreen;

    const makeEvent = key => ({
        key,
        target: { tagName: 'BUTTON' },
        defaultPrevented: false,
        isComposing: false,
        keyCode: 0,
        repeat: false,
        shiftKey: false,
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        preventDefault() { this.defaultPrevented = true; },
        stopImmediatePropagation() {}
    });

    documentListeners.keydown(makeEvent('Enter'));
    equal(leftClicks, 1, 'Enter did not click the first/left dialog button');
    equal(rightClicks, 0, 'Enter unexpectedly clicked the right dialog button');

    documentListeners.keydown(makeEvent('Escape'));
    equal(rightClicks, 1, 'Escape did not click the last/right dialog button');
});

test('spawn hotkey: Enter submits selected spawn even when a button has focus', () => {
    const documentListeners = {};
    const sent = [];
    let clickHandler = null;
    const activeClassList = { contains: name => name === 'active', add: () => {}, remove: () => {}, toggle: () => {} };
    const inactiveClassList = { contains: () => false };
    const spawnSelection = { classList: activeClassList };
    const spawnButton = {
        disabled: false,
        addEventListener(type, callback) { if (type === 'click') clickHandler = callback; },
        click() { if (clickHandler) clickHandler(); }
    };
    const previewImage = { style: {} };
    const textNode = { textContent: '' };
    const map = {
        'spawn-selection': spawnSelection,
        'spawn-button': spawnButton,
        'spawn-preview-image': previewImage,
        'spawn-preview-title': textNode,
        'spawn-preview-text': textNode,
        'error-screen': { classList: inactiveClassList },
        'dialog-screen': { classList: inactiveClassList }
    };
    const document = {
        getElementById: id => map[id] || null,
        querySelectorAll: selector => selector === '.spawn-item' ? [] : [],
        addEventListener: (type, callback) => { documentListeners[type] = callback; }
    };
    const context = {
        console,
        document,
        GameCef: {
            sendJson: (eventName, data) => sent.push({ eventName, data }),
            on: () => {}
        },
        Loading: { Transition: () => {}, Hide: () => {} },
        Image: function() { this.onload = null; },
        requestAnimationFrame: callback => callback()
    };
    vm.createContext(context);
    vm.runInContext(read('assets/JavaScript/spawn.js'), context, { filename: 'spawn.js' });

    const event = {
        key: 'Enter',
        target: { tagName: 'BUTTON' },
        defaultPrevented: false,
        isComposing: false,
        keyCode: 0,
        repeat: false,
        shiftKey: false,
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        preventDefault() { this.defaultPrevented = true; },
        stopImmediatePropagation() {}
    };
    documentListeners.keydown(event);
    equal(sent.length, 1, 'Enter did not submit spawn');
    equal(sent[0].eventName, 'spawn:submit', 'Wrong spawn event emitted');
    equal(sent[0].data.SpawnType, 0, 'Default selected spawn should be LastPosition (0)');
});

test('button theme: global neon rectangular style is linked after component CSS', () => {
    const template = read('src/index.template.html');
    const themeIndex = template.indexOf('button-theme.css');
    const ticketsIndex = template.indexOf('tickets.css');
    ok(themeIndex !== -1, 'button-theme.css is not linked');
    ok(themeIndex > ticketsIndex, 'button-theme.css must load after component styles');

    const css = read('assets/CSS/styles/button-theme.css');
    hasAll(css, [
        '--neo-btn-border',
        '#authorization-button',
        '#registration-next-button',
        '#spawn-button',
        '.dialog-button',
        '#tickets-create',
        '#admin-panel button:not(#admin-close)'
    ], 'button-theme.css');
});

test('production: notification local test helpers are absent', () => {
    const source = read('assets/JavaScript/notifications.js');
    for (const marker of ['testShowNotifications', 'testNotificationBanner', 'testNotificationReward', 'testNotificationAchievement', 'testNotificationBottom', 'testShowAllNotifications']) {
        ok(!source.includes(marker), `Production notifications.js still contains ${marker}`);
    }
});

test('visual test: reusable UI selector is scrollable and available on PC/mobile', () => {
    const js = read('tests/visual-test.js');
    const css = read('tests/visual-test.css');
    hasAll(js, ['UI MENU', 'cef-visual-test-menu', 'setMenuOpen', 'cef-test-menu-item'], 'tests/visual-test.js');
    hasAll(css, ['#cef-visual-test-menu', 'overflow-y: auto', 'touch-action: pan-y', '-webkit-overflow-scrolling: touch'], 'tests/visual-test.css');
});

test('visual test: tests/index.html and reusable test assets are present', () => {
    ok(fs.existsSync(path.join(root, 'tests/index.html')), 'tests/index.html is missing. Run: node tests/build.js');
    const html = read('tests/index.html');
    hasAll(html, ['<base href="../">', './tests/visual-test.css', './tests/visual-test.js', './tests/cases.js', 'button-theme.css'], 'tests/index.html');
    ok(fs.existsSync(path.join(root, 'tests/visual-test.css')), 'tests/visual-test.css is missing');
    ok(fs.existsSync(path.join(root, 'tests/visual-test.js')), 'tests/visual-test.js is missing');
    ok(fs.existsSync(path.join(root, 'tests/cases.js')), 'tests/cases.js is missing');
    ok(fs.existsSync(path.join(root, 'tests/in-game.js')), 'tests/in-game.js is missing');

    for (const file of ['visual-test.js', 'cases.js', 'in-game.js']) {
        const result = spawnSync(process.execPath, ['--check', path.join(root, 'tests', file)], { encoding: 'utf8' });
        ok(result.status === 0, (result.stderr || result.stdout || `${file} syntax error`).trim());
    }
});

test('in-game visual test: lazy bridge and control events are wired into production', () => {
    const template = read('src/index.template.html');
    ok(template.includes('./tests/in-game.js'), 'Production template does not load tests/in-game.js');

    const source = read('tests/in-game.js');
    hasAll(source, [
        'cef-test:show',
        'cef-test:view',
        'cef-test:hide',
        'cef-test:ready',
        'cef-test:closed',
        './tests/visual-test.css',
        './tests/visual-test.js',
        './tests/cases.js',
        'blocked outgoing event'
    ], 'tests/in-game.js');

    ok(source.includes('active && !isTestControlEvent(eventName)'), 'In-game test does not guard real outbound UI events');
});

// Non-fatal cleanup hints.
const template = read('src/index.template.html');
const sectionFiles = walk('src/sections', file => file.endsWith('.html'));
for (const section of sectionFiles) {
    const short = section.replace(/^src\//, '');
    if (!template.includes(`@include ${short}`)) warnings.push(`Unused section: ${section}`);
}
const linkedJs = new Set();
for (const htmlFile of ['index.html', 'tests/index.html']) {
    if (!fs.existsSync(path.join(root, htmlFile))) continue;
    for (const ref of collectHtmlAssetRefs(read(htmlFile)))
        linkedJs.add(stripQueryHash(ref).replace(/^\.\//, ''));
}
for (const file of walk('assets/JavaScript', file => file.endsWith('.js'))) {
    if (!linkedJs.has(file)) warnings.push(`Unused JavaScript file: ${file}`);
}

console.log('\nSummary\n-------');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (warnings.length) {
    console.log(`Warnings: ${warnings.length}`);
    for (const warning of warnings) console.log(`! ${warning}`);
}

if (failed > 0) process.exit(1);
console.log('\nAll required CEF tests passed.');
