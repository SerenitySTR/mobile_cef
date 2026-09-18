ANTARES RP — PC CEF HUD (RESPONSIVE)

index.html — HUD entry point. Background is transparent for CEF.

RESPONSIVE LAYOUT:
- Base design canvas: 1920x1080.
- HUD scales uniformly from the real viewport size; elements are never stretched.
- Tested layout logic targets 1280x720, 1366x768, 1600x900, 1920x1080, 2560x1440 and also 16:10 / 4:3 / 5:4 / ultrawide aspect ratios.
- Top-right blocks stay anchored to the top-right edge.
- Chat gradient stays anchored to the top-left edge.
- Circles remain circular and the Antares PNG keeps its original aspect ratio.

IMPORTANT:
- Standard SA:MP/open.mp chat text is NOT rendered by this CEF.
- The left gradient is only a background under the game chat and is sized for 10 chat lines at the 1920x1080 design scale.
- The GTA/open.mp radar/minimap is NOT rendered by this CEF and remains game-side.
- The supplied Antares PNG is in assets/antares_logo.png.

BROWSER TEST:
Open index.html?preview=1 for a temporary dark test background.
Resize the browser window to test adaptation live.
Open index.html normally for the transparent CEF layer.

Dynamic API:
AntaresHUD.setPlayer(name, id)
AntaresHUD.setTime(time, date)
AntaresHUD.setStats({hp, armor, hunger})
AntaresHUD.setAmmo(current, total)
AntaresHUD.setMoney(value)
AntaresHUD.setWanted(level)
