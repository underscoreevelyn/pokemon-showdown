# Itemmod (and its associated metagame Wonder Launcher OU)

This is a mod that implements usable items (the Bag action from in game battles) into Pokémon Showdown. This is the second version, which includes such mindblowing features as: 
    - Revives work now
    - Gen 9 DLC 1
    - Item Urge and Ability Urge, two shitty items that didn't do much, now do even less because I tested the items on cartridge, and it turns out they're both lame

Item mod implements all the items available in the Wonder Launcher by default. It also has three rules which you can use to customize item usage:
    - Item Mod Bag defines which items are available from the bag and how many of them each player has at the start of the game.
    - Item Mod Wonder Launcher changes the item usage rules to those of the Wonder Launcher.
    - Item Mod Targeting allows players to choose to target Pokémon on the backline with items from the bag. It's an option because the hacky bag UI I managed to shove into the mod doesn't support doing that naturally.

## Wonder Launcher OU
Wonder Launcher OU is the metagame this mod was originally designed for. It's basically the [Wonder Launcher](https://bulbapedia.bulbagarden.net/wiki/Wonder_Launcher) slapped on top of SV OU. If you'd like to play it, you can use the recommended format: 
```js
{
	name: "[Gen 9] Wonder Launcher OU",
	desc: "OU, but with items!",
	mod: "itemmod",
	ruleset: ['Standard', 'Item Mod Bag = {"xattack":1,"xattack2":1,"xattack3":1,"xattack6":1,"xdefend":1,"xdefend2":1,"xdefend3":1,"xdefend6":1,"xspecial":1,"xspecial2":1,"xspecial3":1,"xspecial6":1,"xspdef":1,"xspdef2":1,"xspdef3":1,"xspdef6":1,"xspeed":1,"xspeed2":1,"xspeed3":1,"xspeed6":1,"xaccuracy":1,"xaccuracy2":1,"xaccuracy3":1,"xaccuracy6":1,"direhit":1,"direhit2":1,"direhit3":1,"guardspec":1,"reseturge":1,"itemurge":1,"itemdrop":1,"potion":1,"superpotion":1,"hyperpotion":1,"maxpotion":1,"fullrestore":1,"revive":1,"maxrevive":1,"antidote":1,"parylzheal":1,"awakening":1,"burnheal":1,"iceheal":1,"fullheal":1,"ether":1}', 'Item Mod Wonder Launcher', 'Item Mod Targeting'],
	banlist: ['Uber', 'AG', 'Arena Trap', 'Moody', 'Sand Veil', 'Shadow Tag', 'Snow Cloak', 'King\'s Rock', 'Razor Fang', 'Baton Pass', 'Last Respects', 'Shed Tail'],
}
```
