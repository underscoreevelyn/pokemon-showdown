import {deepClone} from "../../../lib/utils";

export const Rulesets: { [k: string]: FormatData } = {
	itemmodbag: {
		name: 'Item Mod Bag',
		desc: 'Defines the initial Bag contents for each player, and enables the item choice UI.',
		shortDesc: 'Defines the players\' bags.',
		mod: 'itemmod',
		hasValue: true,
		onValidateRule(value) {
			try {
				const bags = JSON.parse(value);
				for (const id in bags) {
					const item = this.dex.items.get(id);
					// @ts-ignore
					if (!item.isUsable) throw new Error(); // Make sure the item is real and usable
					if (typeof bags[id] !== 'number') throw new Error; // There is a number of items in the bag
				}
			} catch {
				throw new Error('Malformed bag contents. Bag must be valid JSON of the form {"item": number, ...} or "wonderlauncher"');
			}
		},
		onBegin() {
			this.add('rule', 'Item Bag: Trainers start with a predefined selection of items.');

			const bag = JSON.parse(this.ruleTable.valueRules.get('itemmodbag')!);

			for (const side of this.sides) {
				// @ts-ignore This is probably bad that I'm mutating the side objects like this, but there's nowhere to store arbitrary data in these objects
				side.bag = deepClone(bag);
			}
		},
	},

	itemmodwonderlauncher: {
		name: 'Item Mod Wonder Launcher',
		desc: 'Enables the use of the Wonder Launcher.',
		mod: 'itemmod',
		onBegin() {
			this.add('rule', 'Wonder Launcher: Items are bought throught the Wonder Launcher');

			// @ts-ignore
			this.hasWonderLauncher = true;

			// @ts-ignore
			this.sides[0].launcherPoints = 0;
			// @ts-ignore
			this.sides[1].launcherPoints = 0;
		},
		onBeforeTurn(this, pokemon) {
			// @ts-ignore
			pokemon.side.launcherPoints = Math.min(pokemon.side.launcherPoints + 1, 14);
		},
	},

	itemmodtargeting: {
		name: 'Item Mod Targeting',
		desc: 'Allows players to target nonactive Pokémon with items. Not compatable with the item UI, so off by default.',
		mod: 'itemmod',
		onBegin() {
			this.add('rule', 'Item Targeting: Players may target nonactive Pokémon with items using /choose item <item> -<party position>');
		},
		// Implimented in scripts
	},
};
