# CEF tests

All test infrastructure is kept in this folder so production UI files stay clean and test cases can be reused as the CEF grows.

## Browser visual test

Rebuild the production index and the reusable visual test page:

```bash
node tests/build.js
```

Then open:

```text
tests/index.html
```

Use the **UI MENU** button. It opens a scrollable selector containing every registered case from `tests/cases.js`.

## In-game visual test

The production `index.html` loads only the tiny `tests/in-game.js` bridge. The full visual-test CSS and mock cases are loaded lazily only after a test event is received.

Supported incoming events:

```text
cef-test:show
cef-test:view
cef-test:hide
```

Short aliases are also accepted:

```text
test:show
test:view
test:hide
```

### Payloads

Open the test hub. The gallery is shown and the scrollable **UI MENU** opens automatically:

```text
cef-test:show
```

Open a specific case immediately:

```json
{"View":"tickets"}
```

Available case ids currently include:

```text
gallery
authorization
registration1
registration2
spawn
dialog
tickets
admin
inventory
statistics
mainmenu
notifications
reward
achievement
bottom
```

Change the open test to another case without closing it:

```text
cef-test:view + {"View":"admin"}
```

Close it from the server:

```text
cef-test:hide
```

When the player presses the **×** button in the test controls, the browser sends:

```text
cef-test:closed
```

When the test UI has loaded successfully, the browser sends:

```text
cef-test:ready
```

If lazy loading fails, it sends:

```text
cef-test:error
```

### Safety

While the in-game visual test is active, normal outbound UI actions are blocked inside the browser. Clicking test Login, Spawn, Dialog, Tickets or AdminPanel controls will therefore **not** send real `authorization:*`, `spawn:*`, `dialog:*`, `ticket:*`, `admin:*`, etc. actions to the server.

Only `cef-test:*` / `test:*` control events are allowed through while the test is active.

### Focus

For phone touch and mouse interaction, the server command that emits `cef-test:show` should enable browser focus exactly the same way your `/apanel`, tickets or other interactive CEF commands do. On `cef-test:hide` / `cef-test:closed`, release focus using the same existing server-side focus method.

## Adding a new screen

Add one registration to `tests/cases.js`:

```js
CefVisualTests.register("garage", "Garage", function () {
    CefVisualTests.receive("garage:show", {
        // mock payload
    });
});
```

The new item appears automatically in the scrollable **UI MENU** in both `tests/index.html` and the in-game test. No change to the test framework is required.

## Automated tests

Run:

```bash
node tests/run.js
```

No npm packages are required.
