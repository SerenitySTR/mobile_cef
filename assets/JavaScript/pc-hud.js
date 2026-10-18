(() => {
    const $ = id => document.getElementById(id);
    const MAX_HEALTH = 170;
    const clampStat = (n, max = 100) => Math.max(0, Math.min(max, Number(n) || 0));
    const parsePayload = data => {
        if (data && typeof data === 'object')
            return data;
        if (typeof data === 'string') {
            try {
                const p = JSON.parse(data);
                return p && typeof p === 'object' ? p : null;
            }
            catch (_) { }
        }
        return null;
    };
    const HUD_WEAPON_IMAGES = {
        0: 'fist.webp', 1: 'brassknuckle.webp', 2: 'golfclub.webp', 3: 'nightstick.webp', 4: 'knife.webp', 5: 'bat.webp', 6: 'shovel.webp', 7: 'poolcue.webp', 8: 'katana.webp', 9: 'chainsaw.webp', 10: 'dildo1.webp', 11: 'dildo2.webp', 12: 'vibrator1.webp', 13: 'vibrator2.webp', 14: 'flowers.webp', 15: 'cane.webp', 16: 'grenade.webp', 17: 'teargas.webp', 18: 'molotov.webp', 22: 'colt45.webp', 23: 'silenced.webp', 24: 'deagle.webp', 25: 'shotgun.webp', 26: 'sawnoff.webp', 27: 'spas12.webp', 28: 'uzi.webp', 29: 'mp5.webp', 30: 'ak47.webp', 31: 'm4.webp', 32: 'tec9.webp', 33: 'rifle.webp', 34: 'sniper.webp', 35: 'rocketlauncher.webp', 36: 'heatseeker.webp', 37: 'flamethrower.webp', 38: 'minigun.webp', 39: 'satchel.webp', 40: 'detonator.webp', 41: 'spraycan.webp', 42: 'extinguisher.webp', 43: 'camera.webp', 44: 'nightvision.webp', 45: 'infrared.webp', 46: 'parachute.webp'
    };
    function setStat(id, value, max = 100) { const el = $(id); if (!el)
        return; const v = clampStat(value, max); el.textContent = Math.round(v); const stat = el.closest('.stat'); if (stat)
        stat.style.setProperty('--value', max > 0 ? (v / max) * 100 : 0); }
    function setHealth(value) { const el = $('hp'); if (!el)
        return; const v = clampStat(value, MAX_HEALTH); el.textContent = Math.round(v); const stat = el.closest('.stat'); if (stat)
        stat.style.setProperty('--value', clampStat(v)); }
    function fmtMoney(v) { return Number(v || 0).toLocaleString('uk-UA').replace(/\u00a0/g, ' '); }
    function renderWanted(level) { const root = $('wanted'); if (!root)
        return; root.innerHTML = ''; const n = Math.max(0, Math.min(5, Math.trunc(Number(level) || 0))); for (let i = 1; i <= 5; i++) {
        const s = document.createElement('span');
        s.textContent = '★';
        s.className = i <= n ? 'on' : 'off';
        root.appendChild(s);
    } }
    function setPlayer(name, id) { if (name != null)
        $('playerName').textContent = name; if (id != null)
        $('playerId').textContent = Math.max(0, Math.trunc(Number(id) || 0)); }
    function setTime(time, date) { if (time != null)
        $('clock').textContent = time; if (date != null)
        $('date').textContent = date; }
    function setMoney(value) { $('money').textContent = fmtMoney(value); }
    function setAmmo(current, total) { $('ammoClip').textContent = Math.max(0, Math.trunc(Number(current) || 0)); $('ammoTotal').textContent = Math.max(0, Math.trunc(Number(total) || 0)); }
    let currentWeaponId = 0;
    function updateWeapon(data) {
        if (data === undefined || data === null)
            return;
        if (typeof data === 'number')
            data = { WeaponId: data };
        if (typeof data === 'string') {
            const raw = data.trim();
            if (!raw)
                return;
            try {
                data = JSON.parse(raw);
            }
            catch (_) {
                const n = Number(raw);
                data = Number.isFinite(n) ? { WeaponId: n } : null;
            }
            if (typeof data === 'number')
                data = { WeaponId: data };
        }
        if (!data || typeof data !== 'object')
            return;
        const weaponValue = data.WeaponId ?? data.weaponId ?? data.weapon ?? data.Weapon;
        const clip = data.AmmoClip ?? data.ammoClip ?? data.ammo ?? data.Ammo;
        const total = data.AmmoTotal ?? data.ammoTotal ?? data.maxAmmo ?? data.MaxAmmo ?? data.max_ammo ?? data.totalAmmo ?? data.TotalAmmo ?? data.ammo_total;
        const hasWeapon = weaponValue !== undefined && weaponValue !== null && weaponValue !== '';
        if (hasWeapon) {
            currentWeaponId = Math.max(0, Math.trunc(Number(weaponValue) || 0));
            const image = $('weaponImage');
            if (image)
                image.src = './assets/CSS/Images/Hud/Weapons/' + (HUD_WEAPON_IMAGES[currentWeaponId] || HUD_WEAPON_IMAGES[0]);
            const ammo = $('ammo');
            if (ammo)
                ammo.style.display = currentWeaponId === 0 ? 'none' : '';
        }
        if (clip !== undefined || total !== undefined)
            setAmmo(clip ?? $('ammoClip').textContent, total ?? $('ammoTotal').textContent);
    }
    function updateHud(data) { if (!data)
        return; const hp = data.health ?? data.Health ?? data.hp ?? data.HP; const armor = data.armour ?? data.Armour ?? data.armor ?? data.Armor; const hunger = data.hunger ?? data.Hunger; const money = data.money ?? data.Money; const wanted = data.wanted ?? data.Wanted ?? data.wantedLevel ?? data.WantedLevel; const weapon = data.weapon ?? data.Weapon ?? data.weaponId ?? data.WeaponId; if (hp !== undefined)
        setHealth(hp); if (armor !== undefined)
        setStat('armor', armor); if (hunger !== undefined)
        setStat('hunger', hunger); if (money !== undefined)
        setMoney(money); if (wanted !== undefined)
        renderWanted(wanted); setPlayer(data.nickname ?? data.Nickname ?? data.name ?? data.Name, data.id ?? data.ID ?? data.playerId ?? data.PlayerId); setTime(data.time ?? data.Time, data.date ?? data.Date); if (weapon !== undefined || data.ammo !== undefined || data.ammoClip !== undefined || data.AmmoClip !== undefined || data.ammoTotal !== undefined || data.AmmoTotal !== undefined)
        updateWeapon(data); }
    function showHud() { if (window.hudMobilePlatform || window.__hudVisible === false)
        return; const root = $('pc-hud'); if (root) {
        root.style.removeProperty('display');
        root.style.removeProperty('opacity');
        root.style.removeProperty('visibility');
        root.style.removeProperty('pointer-events');
        root.classList.add('active');
        root.setAttribute('aria-hidden', 'false');
    } }
    function hideHud() { const root = $('pc-hud'); if (root) {
        root.classList.remove('active');
        root.setAttribute('aria-hidden', 'true');
        root.style.setProperty('display', 'none', 'important');
        root.style.setProperty('opacity', '0', 'important');
        root.style.setProperty('visibility', 'hidden', 'important');
        root.style.setProperty('pointer-events', 'none', 'important');
    } }
    window.AntaresHUD = { show: showHud, hide: hideHud, setPlayer, setTime, setStats({ hp, armor, hunger } = {}) { if (hp != null)
            setHealth(hp); if (armor != null)
            setStat('armor', armor); if (hunger != null)
            setStat('hunger', hunger); }, setAmmo, setMoney, setWanted: renderWanted, setWeapon: updateWeapon, update: updateHud };
    function updateScale() {
        const root = $('pc-hud');
        if (!root)
            return;
        const width = Math.max(1, window.innerWidth || 1920);
        const height = Math.max(1, window.innerHeight || 1080);
        const scale = Math.max(0.76, Math.min(1, width / 1700, height / 930));
        root.style.setProperty('--hud-scale', scale.toFixed(3));
    }
    if (window.UiViewport)
        UiViewport.on(updateScale);
    else
        updateScale();
    if (new URLSearchParams(location.search).get('preview') === '1')
        document.body.classList.add('preview');
    renderWanted(4);
    window.flushPcHudPendingCalls?.();
})();
