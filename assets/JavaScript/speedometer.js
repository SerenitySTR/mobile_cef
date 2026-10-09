(() => {
    "use strict";
    const root = document.getElementById("speedometer");
    if (!root)
        return;
    const elements = {
        speed: document.getElementById("speedometer-speed-value"),
        unit: document.getElementById("speedometer-speed-unit"),
        gear: document.getElementById("speedometer-gear"),
        fuelCurrent: document.getElementById("speedometer-fuel-current"),
        fuelMax: document.getElementById("speedometer-fuel-max"),
        fuelFill: document.getElementById("speedometer-fuel-fill"),
        lights: document.getElementById("speedometer-indicator-lights"),
        doors: document.getElementById("speedometer-indicator-doors"),
        engine: document.getElementById("speedometer-indicator-engine")
    };
    function ParsePayload(data) {
        if (data && typeof data === "object")
            return data;
        if (typeof data !== "string")
            return null;
        try {
            const parsed = JSON.parse(data);
            return parsed && typeof parsed === "object" ? parsed : null;
        }
        catch {
            return null;
        }
    }
    function ParseBoolean(value) {
        if (typeof value === "string") {
            const normalized = value.trim().toLowerCase();
            if (["false", "0", "off", "no"].includes(normalized))
                return false;
            if (["true", "1", "on", "yes"].includes(normalized))
                return true;
        }
        return !!value;
    }
    function ParseGear(value) {
        if (value === undefined || value === null || value === "")
            return "N";
        if (typeof value === "string") {
            const text = value.trim().toUpperCase();
            if (text)
                return text;
        }
        const gear = Math.trunc(Number(value) || 0);
        if (gear < 0)
            return "R";
        return gear === 0 ? "N" : String(gear);
    }
    function SetIndicator(element, value) {
        if (!element || value === undefined)
            return;
        element.classList.toggle("active", ParseBoolean(value));
    }
    function IsMobilePlatform() {
        const userAgent = navigator.userAgent || "";
        const platform = navigator.platform || "";
        const touchDevice = (navigator.maxTouchPoints || 0) > 0;
        const shortSide = Math.min(window.innerWidth || 0, window.innerHeight || 0);
        if (window.hudMobilePlatform === true || document.body.classList.contains("hud-platform-mobile"))
            return true;
        if (/Android|iPhone|iPad|iPod|Mobile/i.test(userAgent) || /Android|iPhone|iPad|iPod|Linux arm|aarch64/i.test(platform))
            return true;
        if (touchDevice && shortSide > 0 && shortSide <= 900)
            return true;
        return false;
    }
    function UpdatePlatform() {
        const mobile = IsMobilePlatform();
        root.classList.toggle("speedometer-mobile", mobile);
        root.classList.toggle("speedometer-pc", !mobile);
        return mobile;
    }
    function UpdateScale() {
        const width = Math.max(1, window.innerWidth || 1920);
        const height = Math.max(1, window.innerHeight || 1080);
        const mobile = UpdatePlatform();
        const minScale = mobile ? 0.62 : 0.76;
        const maxScale = mobile ? 0.82 : 1;
        const scale = Math.max(minScale, Math.min(maxScale, width / 1700, height / 930));
        root.style.setProperty("--speedometer-scale", scale.toFixed(3));
    }
    const Speedometer = {
        Show(data) {
            if (data !== undefined)
                this.Update(data);
            root.classList.add("active");
            root.setAttribute("aria-hidden", "false");
            UpdateScale();
        },
        Hide() {
            root.classList.remove("active");
            root.setAttribute("aria-hidden", "true");
        },
        Update(data) {
            data = ParsePayload(data) || data;
            if (!data || typeof data !== "object")
                return;
            const visible = data.visible ?? data.Visible ?? data.show ?? data.Show ?? data.inVehicle ?? data.InVehicle ?? data.active ?? data.Active;
            if (visible !== undefined && !ParseBoolean(visible)) {
                this.Hide();
                return;
            }
            const speed = data.speed ?? data.Speed ?? data.kmh ?? data.Kmh ?? data.velocity ?? data.Velocity;
            const gear = data.gear ?? data.Gear ?? data.currentGear ?? data.CurrentGear ?? data.transmission ?? data.Transmission;
            const fuel = data.fuel ?? data.Fuel ?? data.currentFuel ?? data.CurrentFuel;
            const fuelMax = data.fuelMax ?? data.FuelMax ?? data.maxFuel ?? data.MaxFuel ?? data.fuelCapacity ?? data.FuelCapacity;
            const unit = data.unit ?? data.Unit;
            if (speed !== undefined)
                elements.speed.textContent = String(Math.max(0, Math.trunc(Number(speed) || 0)));
            if (gear !== undefined)
                elements.gear.textContent = ParseGear(gear);
            if (unit !== undefined)
                elements.unit.textContent = String(unit);
            if (fuel !== undefined || fuelMax !== undefined) {
                const current = Math.max(0, Number(fuel ?? elements.fuelCurrent.textContent) || 0);
                const maximum = Math.max(1, Number(fuelMax ?? elements.fuelMax.textContent) || 100);
                const percent = Math.max(0, Math.min(100, current / maximum * 100));
                elements.fuelCurrent.textContent = String(Math.round(current));
                elements.fuelMax.textContent = String(Math.round(maximum));
                elements.fuelFill.style.width = percent.toFixed(1) + "%";
            }
            SetIndicator(elements.lights, data.lights ?? data.Lights ?? data.headlights ?? data.Headlights);
            SetIndicator(elements.doors, data.doors ?? data.Doors ?? data.locked ?? data.Locked ?? data.doorsLocked ?? data.DoorsLocked);
            SetIndicator(elements.engine, data.engine ?? data.Engine ?? data.checkEngine ?? data.CheckEngine);
            if (visible === undefined || ParseBoolean(visible))
                this.Show();
        }
    };
    window.Speedometer = Speedometer;
    if (window.GameCef) {
        GameCef.on("speedometer:show", data => Speedometer.Show(ParsePayload(data) || data));
        GameCef.on("speedometer:update", data => Speedometer.Update(data));
        GameCef.on("speedometer:hide", () => Speedometer.Hide());
        // Backwards-compatible aliases from the first implementation.
        GameCef.on("hud:vehicle", data => Speedometer.Update(data));
        GameCef.on("hud:speedometer", data => Speedometer.Update(data));
        GameCef.on("game:data:vehicleHud", data => Speedometer.Update(data));
        GameCef.on("game:data:speedometer", data => Speedometer.Update(data));
    }
    window.addEventListener("resize", UpdateScale, { passive: true });
    if (window.visualViewport)
        window.visualViewport.addEventListener("resize", UpdateScale, { passive: true });
    UpdateScale();
})();
