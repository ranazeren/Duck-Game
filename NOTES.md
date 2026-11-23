# Notes

Built from "Duck Game Build Guide for Claude Code" and the class diagram `Duck Game UML-canonical2.html`
(the newest of the three diagram files). This file lists what was added beyond them, what was assumed,
and what the team should confirm.

## Additions

Classes, files and members that are not in the diagram. None of them is a design pattern.

| Addition | Where | Why |
| --- | --- | --- |
| `Audio` | `src/assets/Audio.ts` | The guide's one sound helper (`play(category, id)`). Extended on request with a volume setting (`getVolume`, `setVolume`, saved under `duck-game-settings-v1`) and a `SoundBackend` interface that `BootScene` fills with Phaser's sound manager, so real `.ogg` files play once they exist. A missing sound effect plays a short generated beep (the guide asked for a silent no-op; changed so the volume setting has something to control). Missing music stays silent. |
| `SettingsPanel` | `src/ui/SettingsPanel.ts` | Requested after the guide: a settings menu with Save game, Pause, Volume and Exit. Plain UI class, no pattern. Opened with the top-bar button or `Esc`. |
| `UIScene.saveGame()`, `exitGame()` | `UIScene` | The menu's Save and Exit. A browser page cannot close its own tab, so Exit saves, pauses and shows a "Game saved, you can close this tab" screen that `P` leaves again. |
| `tools/generate-assets.mjs`, `npm run assets` | tools | Requested after the guide: draws all 31 images as pixel art (text grids scaled by whole numbers, written with a small built-in PNG encoder, no dependencies). The files land in `public/assets/`, so they are ordinary replaceable assets. |
| Nearest-neighbour filter on loaded images | `BootScene` | Keeps pixel art crisp when scaled. Generated placeholders keep the default filter. |
| `sceneHelpers` (functions) | `src/scenes/sceneHelpers.ts` | Shared fade transition, entrance zone, toast, and typed access to three values in the Phaser registry (the `DayCycle`, the house `CommandHistory`, the in-battle flag). Avoids repeating the same code in four scenes. |
| `PlayerAvatar` | `src/ui/PlayerAvatar.ts` | The walking duck shared by farm, house and pond: sprite stack plus the "last pressed key wins" movement. |
| `makeButton` (function) | `src/ui/Button.ts` | One clickable text label for all menus. |
| `tests/helpers.ts` | tests | A recording observer and an in-memory storage for the specs. |
| `GameState.resetForTests()`, `addCoins()` | `GameState` | Named as additions by the guide. |
| `GameState.getPhase()`, `getMinutesOfDay()`, `getInventory()`, `countOf()`, `getEquipped()`, `getPlaced()` | `GameState` | Read access for the first draw of a screen and for command guards. Changes still arrive by push through `update(event, data)`. |
| `Combatant.getHp/getMaxHp/isAlive/heal` | `Combatant` | Named as additions by the guide. |
| `CommandHistory.canUndo()`, `canRedo()` | `CommandHistory` | Lets the Undo and Redo buttons show whether they would do anything. |
| `Battle.getResult()`, `hpSnapshot()`, public `player` and `enemy` | `Battle` | The HUD's first draw and the menu need them. |
| `BattleLog.getLines()` | `BattleLog` | Used by tests. |
| `Being.id`, `boss`, `moves`, `reward`, `drop` | `Being` | `moves` is named by the guide; the rest carry the table values of section 6. |
| `HouseScene.removeItem(slot)` | `HouseScene` | The diagram lists `placeItem` only; removing needs its own client method. |
| `HouseLights.isOn()` | `HouseLights` | Read access to `lightsOn`. |
| `StorageLike`, `SaveData` types; `SpawnEntry`, `GiftHooks`, `StartBattle` types | core, factory | Type declarations only. |
| Extra config keys | `src/config.ts` | `dropChance` (0.5), `loseHpFraction`, `bossWeight`, `bossMinCoins`, `fadeMs`, `autosaveSec`, `toastMs`, `battleLogStepMs`, `startMinutesOfDay` (08:00), tint values, `houseSlots`, `startingInventory`, the being and item tables. |
| `B` debug key | `FarmScene` (dev builds) | Milestone 6 asks for a debug key that starts a battle from the farm. |
| Global pause (`UIScene.togglePause()`, `isPaused()`) | `UIScene` | Requested after the guide. The settings menu entry and the `P` key pause every other running scene with Phaser's scene pause and stop the clock tick. Plain code in the plain `UIScene`, no pattern. The inventory panel stays usable while paused. |
| Save on `pagehide` | `main.ts` | Catches a closed tab between two autosaves. |
| `Shift+N` debug key | `main.ts` (dev builds) | Deletes the save and reloads, so testers can start a new game. |
| `window.duckGame` | `main.ts` (dev builds) | Console access for manual checks. |

`UseItemCommand` depends on `GameState` (it consumes the item with `removeItem`). The guide asks for this
extra dependency to be flagged: it is an arrow from a battle command to the Singleton that the diagram does not draw.

## Second round of changes (requested after the first build)

| Change | Where | Pattern impact |
| --- | --- | --- |
| House is a cardboard box (entrance, inside, floor) and free multi-item placement on a floor grid (`config.houseGrid`, slot ids `c<col>r<row>`) | art, `HouseScene` | None. Still `PlaceItemCommand` / `RemoveItemCommand` through `CommandHistory`. Placing on an occupied cell is refused, so `previousOccupant` is always empty in practice. |
| Inventory screen with big duck, per-outfit and total attack, Up/Down/E keys | `InventoryPanel` | None. Still an Observer; equip still runs `EquipOutfitCommand`. |
| WASD walking, duck turns, outfit layers sync with the duck (POST_UPDATE) | `PlayerAvatar` | None. The outfits are still the decorator chain; no new class. |
| Night: no screen overlay. `SkyTint` swaps the scene background between `<id>` and `<id>_night` pictures | `SkyTint`, `addBackground` | None. Still the Observer of `phase-changed`. Manifest gained four `_night` backgrounds. |
| Conversations before Befriend and Fight (`src/content/dialogue.ts`, `DialogueBox`) | encounters | The encounter products now receive a `talk` callback through their constructors, as the guide asks for scene access. Same Factory Method structure. |
| Beings with `approachSpeed` walk toward the duck | `PondScene`, `config` | None, but see open question 8. |
| Settings: gear icon, duck-pattern background, volume slider 0-100, nicer font (`config.fontFamily`) | `SettingsPanel` | None. |
| `tests/patterns/skeleton.test.ts` | tests | Guards the skeleton: every concrete class extends or implements its pattern role. |

## Third round of changes

| Change | Where | Pattern impact |
| --- | --- | --- |
| Each spawned being follows the duck or not, at random with a preset chance per being (`config.beings[id].followChance`) | `BeingFactory.assignFollow`, `Being.follows` | A small addition inside the existing creator, next to `assignAI`. No new class. |
| The pond remembers a being when the duck leaves and brings it back (same being, same spot) if it is still the same phase. A fight or a befriend uses the being up | `PondScene`, Phaser registry | None. |
| The pond is one swimmable screen; beings appear in the water or on the shore; swimming hides feet and leaves ripples and bubbles | `PondScene`, `PlayerAvatar.setSubmerged`, `WaterEffects` | None. |
| Furniture is unlocked, not owned: `GameState.unlock / isUnlocked / getUnlocked`; unlimited placement; nothing at the start. `PlaceItemCommand` and `RemoveItemCommand` no longer touch the inventory | `GameState`, commands, `HouseScene` | Same Command structure. Placing on an occupied cell is refused, so `previousOccupant` is empty in practice. |
| Memory of positions: the farm animals stroll around their home spot, and the farm and the pond both remember where creatures stood when the duck left. Nothing is remembered if day or night came in between (even night and back to day). Counted with `GameState.getPhaseChanges()` | `FarmScene`, `PondScene`, `sceneHelpers`, `GameState` | None. One read-only counter added to the Singleton. Memory lives in the Phaser registry, so it is lost on a page reload (it is not saved to disk). |
| Four farm animals (hen, cow by day; owl, cat by night) with choice conversations; a kind answer unlocks the animal's furniture once | `content/farmAnimals.ts`, `content/farmTalk.ts`, `FarmScene`, `DialogueBox` | **Outside the diagram**: new plain content and a plain scene feature. No pattern. `FarmScene` reads the phase every frame instead of observing `GameState`, so the Observer list is unchanged. |
| New item `table`, new asset category `animal`, new ui ids `gear` and `settings` (now a duck head) | manifest, `Placeholders` | None. |
| Settings: more see-through, cross in the corner, gear picture as the title, keyboard volume | `SettingsPanel` | None. |
| WCAG 2.1 AA pass: text colors in `config.colors` (4.5:1, checked by `tests/ui/contrast.test.ts`), no color-only states, keyboard for every menu (inventory, dialogue choices, volume slider), larger minimum text, labelled game container | UI | None. |
| Inventory: double click on an outfit wears or takes it off; unlocked furniture is listed | `InventoryPanel` | None. |

WCAG scope: a canvas game cannot meet every criterion a web page can. Covered: contrast, keyboard operation, non-color cues, text size, no flashing. Not covered: screen-reader access to the game world itself, and the time limit of the day cycle (it can be paused with `P`).

## Fourth round of changes

| Change | Where | Pattern impact |
| --- | --- | --- |
| Two separate stats, move speed and attack speed. `Combatant` got `getMoveSpeed()` and `getAttackSpeed()`; outfits (Cone Hat: move +30, Boxing Gloves: attack speed +4) add to them | `Combatant`, `Duck`, `OutfitDecorator`, `Being`, `ConeHatOutfit`, `GlovesOutfit` | Two members added to the Decorator's own component interface. No new pattern or class family. Flagged, see docs/adr.md ADR-013. |
| Battle order: priority first, then attack speed, then submission order | `Battle.playTurn` | None. The guide said ties keep submission order; ties are now broken by speed first. |
| A following being that catches the duck starts the meeting itself, fight or befriend at random (`config.catchFightChance`); befriending can turn into a fight (`angerChance`) | `PondScene` | None. Still built through the two `EncounterFactory` creators. |
| Keyboard menus with a colored focus frame (`MenuNav`); black buttons | `MenuNav`, `Button`, `SettingsPanel`, `BattleMenu`, `PondScene` | None. |
| Combat animations (lunge, shake, red flash, green heal, fade) | `BattleScene`, `BattleHUD.onHpChange` hook | None. |
| Map hints fade after `config.hintSeconds` | `addHint` | None. |
| Animal names changed to film and series characters; Puss in Boots sprite; new gear icon | content, art | None. |

## Fifth round of changes

| Change | Where | Pattern impact |
| --- | --- | --- |
| Rotation of furniture with R. The turn count is stored in the placed string ("chair@1") | `HouseScene`, `content/placement.ts` | None. The house commands and the save file are unchanged. |
| Lights come from the furniture: a cone and a light pool per lamp (turned with the lamp), colored beams per disco ball. New item `disco_ball` | `HouseLights`, `items.ts` | `HouseLights` also listens to `house-changed`. Still a ConcreteObserver. |
| Losing a fight costs a quarter of the coins and sends the duck home | `Battle`, `BattleScene`, `config` | None. The guide said no penalty; changed on request. |
| The room does not change at night; the window glass shows the time of day | `HouseScene` | None. The house background is no longer registered with `SkyTint`. |
| Barn shop (`ShopScene`, `content/shop.ts`, `config.shop`) on the farm. A new game starts with 40 coins and no outfits | `FarmScene`, `ShopScene`, `config` | **Outside the diagram**: plain scene and content, no pattern. Flagged in docs/adr.md (ADR-021). |
| `content/houseGrid.ts` | content | Shared grid helpers moved out of `HouseScene` so `HouseLights` can use them. |
| `GameState.resetForTests` now starts with 0 coins | `GameState` | None (test helper only). |

## Sixth round of changes

| Change | Where | Pattern impact |
| --- | --- | --- |
| Stamina: moves cost it, a little comes back each turn, full at the start of a fight; stamina food (Corn, Seed Cake) | `Combatant`, `Duck`, `OutfitDecorator`, `Being`, `Move`, `Peck`, `Quack`, `UseMoveCommand`, `Battle`, `BattleMenu`, `BattleHUD` | Members added to the Decorator component interface and the Strategy interface (`staminaCost`). No new pattern or class family. Flagged, see docs/adr.md ADR-022. |
| HP bar in the top bar, read every frame from `GameState.getDuckHp()` | `UIScene` | None; no observer added (battle changes the HP outside GameState). |
| Box house entrance, lake sign, new cow, market-stall shop entrance, redesigned shop screen, "too expensive" labels removed | art, `ShopScene` | None. |

## Seventh round of changes

| Change | Where | Pattern impact |
| --- | --- | --- |
| Farm and pond join at their right and left screen edges (Stardew style); the two doors were removed. The house and the shop keep their doors | `content/mapEdges.ts`, `checkEdgeExit`, `addEdgeCue`, `FarmScene`, `PondScene` | None. Entrances `to_pond` and `to_farm` left the manifest. |

## Eighth round of changes

| Change | Where | Pattern impact |
| --- | --- | --- |
| The pond map was redrawn after the reference picture (grass and bricks on top, a pier, teal water). Its land/water layout is a mask shared by the picture and the game (`pondMask.json`, `pondMap.ts`); swimming uses it | `tools/generate-assets.mjs`, `PondScene`, `content/pondMap.ts` | None. |
| A swimming frog in a cowboy hat (`animal/frog`, `PondFrog`) | `ui/PondFrog.ts`, `PondScene` | None: ambient decoration, not a being and not created by a factory. |
| Farm arrival on the pond is clamped to the left bank (land) | `FarmScene` | None. |

## Ninth round of changes

| Change | Where | Pattern impact |
| --- | --- | --- |
| The brick road above the pier is gone; the pier enters from the top of the pond screen | `tools/generate-assets.mjs`, `pondMask.json` | None. |
| The farm reaches the pond by walking down a pier at the bottom of the screen (lined up with the pond map's pier); the pond top edge leads back. Map edges now work in four directions | `content/mapEdges.ts`, `FarmScene`, `PondScene`, `sceneHelpers` | None. `edge_farm` was removed. |

## Tenth round of changes

| Change | Where | Pattern impact |
| --- | --- | --- |
| More reeds, and a dense reed bed in the pond (the bed's position is written to `pondMask.json`) | `tools/generate-assets.mjs`, `pondMap.ts` | None. |
| The Reed Warden, a heron guarding the reed bed: hard fight, reward and a sure drop, away for a day when beaten | `ReedGuardian`, `PondScene`, `config.beings.reed_guardian`, `content/guardian.ts` | New concrete product (the documented way to add a being) **and a second factory method** `BeingFactory.spawnGuardian()` on both creators. The second method is not in the diagram: flagged, see docs/adr.md ADR-027. |
| `Being.dropChance` (default `config.dropChance`), used by `Battle.end` | `Being`, `Battle` | None. |

## Eleventh round of changes

| Change | Where | Pattern impact |
| --- | --- | --- |
| New grass tile (after the grass picture in docs), also used for the land of the pond picture | `tools/generate-assets.mjs` | None. |
| Decorations scattered over the grass (`decor` category: tree, bush, tall grass, flowers). Rules are plain and seeded (`content/decor.ts`) | `FarmScene`, `PondScene`, `sceneHelpers.addDecor` | None: decoration only, no collision. |

## Twelfth round of changes

| Change | Where | Pattern impact |
| --- | --- | --- |
| House and shop entrances drawn at 96 px; a winding dirt path picture from the house to the pier (waypoints in `farmPath.json`, shared with the game); tall grass decoration removed | `tools/generate-assets.mjs`, `FarmScene`, `content/farmPath.ts` | None. |

## Thirteenth round of changes

| Change | Where | Pattern impact |
| --- | --- | --- |
| New forest map to the right of the farm, joined through a gap in a wall of trees; the Frog King is its easier boss; squirrels and pigs wander | `ForestScene`, `content/forestMap.ts` + `forestMap.json`, `GuardianPost`, `Critter` | New concrete product `FrogKing`. The guardian factory method now takes a parameter, `spawnGuardian(which)` (flagged, see docs/adr.md ADR-027 and ADR-028). Forest scene is a plain scene. |
| After a fight the duck returns to the map it came from (`returnTo`) | `BattleScene` | None. |
| Piggy bank in the shop, wagon in the forest, new creature pictures | art | None. |

## Fourteenth round of changes (review against the Design Patterns book)

| Change | Where | Pattern impact |
| --- | --- | --- |
| The factory method of the being creators is now `createBeing(entry)`; `spawn()` is one operation in the base class that calls it | `BeingFactory`, `DayBeingFactory`, `NightBeingFactory` | **Differs from the diagram**, which labels `spawn()` as the factory method. Closer to the book (Creator with AnOperation). See docs/adr.md ADR-030. |
| `spawnGuardian(which)` is one concrete method of `BeingFactory` (it was identical in both creators) | `BeingFactory` | No longer called a factory method. |
| `EncounterFactory.begin(being)` creates through `create()` and starts the encounter | `EncounterFactory`, `PondScene`, `ForestScene` | One method added to the Creator. |
| `Being.chooseCommand(player)` forwards to its `ai`; `Battle` asks the being | `Being`, `Battle` | One method added: the Strategy context now forwards the request, as in the book. |
| `HouseScene` and `PondScene` attach a small observer object (`stateObserver`) instead of implementing `Observer` themselves | scenes | **Differs from the diagram**, which draws both scenes as ConcreteObservers. Closes open question 1. |
| `GameState.coins` is private; `getCoins()` reads it | `GameState` and its readers | None. |
| House commands and `UseItemCommand` store their receiver (default `GameState.getInstance()`) | commands | None: the book's form of the Command. |

## Assumptions

- **Diagram version:** `Duck Game UML-canonical2.html` is the contract. All 51 classes exist with the same names. `FarmScene` is not in the diagram ("it only draws") and exists as a plain scene.
- **Clock display lives in `SkyTint`.** The guide says the clock HUD is "updated only through observer events", and `SkyTint` is the only observer of `time-changed`, while `UIScene` is plain. So `SkyTint` draws the sky overlay, the sun or moon icon and the `HH:MM` text. `InventoryPanel` draws the coin counter.
- **House lights** are plain yellow circles, not textures, because the manifest has no light asset.
- **Outfits on the walking duck:** `PlayerAvatar` is not an observer (the diagram fixes the list of observers). It compares the equipped list each frame and rebuilds its sprite stack when it changed.
- **`HouseScene` also reacts to `outfit-changed`**, only to refresh its Undo and Redo buttons after an equip command ran through its history.
- **Bosses:** the day boss is a `TrashMob`, the night boss is a `RobotDuck` (weight 5, from 50 coins). The name gets a "Boss" prefix. The reward is not multiplied.
- **Drops:** a defeated being drops its item with `config.dropChance` (the guide says "sometimes").
- **Duck moves** are Peck and Quack, listed in `BattleMenu`.
- **Battle playback:** the rules resolve a turn instantly; `BattleHUD` queues the events and shows them one by one, and re-enables the menu when the queue is empty.
- **Being sprites:** the diagram shows `getSprites()` on each concrete being, the guide puts one implementation in `Being`. Followed the diagram: `Being.getSprites()` is abstract and each product returns its own key.
- **Git:** the game folder is its own repository. The work was done in one pass and committed once at the end, not once per milestone.
- **Starting time** is 08:00 on a new game.
- **Game text is English**, including the settings menu (Save game, Pause, Volume, Exit), to match the rest of the UI.
- **Art direction of the generated assets** is a first pass: the "trash mob" is drawn as a trash can with a duck beak, the day and night bosses reuse the normal sprites, and the battle background is always a dusk scene.

## Open questions

1. **(Resolved in the fourteenth round: each scene now attaches an inner observer object.)** `update` name clash in `HouseScene` and `PondScene`. The diagram makes both scenes concrete observers with `update(event, data)`, and Phaser calls `update(time, delta)` on every scene each frame. One method cannot have both meanings cleanly. Default chosen: a single `update(eventOrTime: string | number, data?)` that checks the type of its first argument, which keeps the diagram's "scene implements Observer" intact. Alternative: give each scene a small inner observer object, which changes the diagram.
2. **"No error is logged" versus loading every manifest file.** The guide tells `BootScene.preload()` to call `load.image` for every id and catch the file-error event. Phaser 4 prints a console error for each failed file, and the Vite dev server answers a missing PNG with the HTML page, which Phaser reports as a process error, not a load error. Default chosen: `BootScene.create()` first asks the server which files exist (a `HEAD` request per id, accepted only when the answer is an image), loads only those, still records loader errors in `missing`, and finally gives a placeholder to every key that has no texture. Result: no console errors in `npm run dev` and `npm run preview`. On a plain static host the browser itself still prints one 404 line per missing file; only a build-time file list could avoid that.
3. **Placeholder drawing call.** The guide names `Graphics.generateTexture` plus a baked text overlay. `generateTexture` cannot include a Text object, so the placeholder is drawn with a Graphics object and a Text object into `textures.addDynamicTexture(key, w, h)` followed by `render()` (the Phaser 4 call, checked against the installed 4.2.1 types).
4. **No sound files exist yet.** `BootScene` looks for `public/assets/sfx/<id>.ogg` and `public/assets/music/<id>.ogg` and plays them when present, but this path has not been tried with a real file. Until then sound effects are generated beeps and music is silent.
5. **Where the duck returns after a battle.** Default: the spot on the shore where the encounter started.
6. **Befriending is unlimited.** Every being can be befriended for its drop item, so items are easy to farm. A friendship limit or cost is a design decision for the team.
8. **Mob movement is not an AI class.** Following is a per-being chance and speed in `config.beings`, read by `PondScene`, not a new strategy. Making it a Strategy (say a `MoveAI` interface with `Chase` and `Stand`) would add a pattern the diagram does not have, so it was left out. Say if you want it added.
9. **Outfits following the duck** were fixed by syncing the layer sprites after the physics step. If the layers should become their own objects, that would be a new class outside the diagram; not done.
7. **The debug `B` battle** returns to the pond (every battle does), not to the farm.

The assumptions of the guide's section 10 were all kept at their defaults.
