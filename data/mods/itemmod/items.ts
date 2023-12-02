/**
 * Wonder Launcher OU
 *
 * UsableItem is an extension of the normal Item interface that describes the behavior
 * of using it from the bag. The common behaviors healing, restoring status conditions,
 * reviving fainted pokemon, and giving stat boosts are special cases handled by the
 * item action handler. onUse() may be used to describe more specialized features.
 *
 * This mod and the usable items it impliments are as accurate as I could get them. Ethers
 * are the only item that is knowingly inaccurate. It's likely that other items, mainly
 * Item Urge and Ability Urge, are inaccurate in their interactions with very specific items,
 * but honestly those items are not very useful, so accuracy is low priority.
 */

interface ItemUsageData {
	/** Inidcates the item's usablity */
	isUsable?: boolean;
	/** Indicates the item can be used by the Wonder Launcher. Required for use in a Wonder Launcher game. */
	isWonderLauncher?: boolean;
	/** Cost of the item. Default zero. */
	launcherCost?: number;
	/** Indicates the item can be used on a nonactive party member. */
	targetable?: boolean;
	/** How much the item heals. */
	heal?: number | [number, number];
	boosts?: Partial<BoostsTable>;
	/** Status condition to heal */
	healCondition?: 'psn' | 'par' | 'brn' | 'slp' | 'frz' | 'all';
	/** return a falsy, nonundefined value to indicate failure */
	onUse?(this: Battle, target: Pokemon): boolean | void;
	/** The animation to play when the item is used. */
	animation?: string;
	/** Revive is here for completeness, however it's nonfunctional. The client does not acknowledge the revival and freaks out, unfortunately. */
	revive?: [number, number];
}

export type UsableItemData = ModdedItemData & ItemUsageData;

const statNames: {[k in BoostID]: string} = {
	atk: "Attack",
	def: "Defense",
	spa: "Special Attack",
	spd: "Special Defense",
	spe: "Speed",
	accuracy: "Accuracy",
	evasion: "Evasion",
};

const xItemNames: {[k in BoostID]: string} = {
	atk: "Attack",
	def: "Defend",
	spa: "Special",
	spd: "Sp. Def",
	spe: "Speed",
	accuracy: "Accuracy",
	evasion: "Evasiveness",
};

type XItemLevel = 1 | 2 | 3 | 6;
const xCosts: {[k in XItemLevel]: number} = {
	1: 3,
	2: 5,
	3: 7,
	6: 12,
};

function XItem(type: BoostID, level: XItemLevel): UsableItemData {
	return {
		name: `X ${xItemNames[type]}${level === 1 ? '' : (' ' + level)}`,
		desc: `Raises the ${statNames[type]} of a Pokémon currently in battle by ${level} level${level === 1 ? '' : 's'}. `,
		isWonderLauncher: true,
		launcherCost: xCosts[level],
		boosts: {
			[type]: level,
		},
		isUsable: true,
		animation: 'calmmind',
	};
}

function direHit(level: number): UsableItemData {
	return {
		name: `Dire Hit${level === 1 ? '' : (' ' + level)}`,
		desc: `Raises the critical hit ratio of a Pokémon currently in battle by ${level} level${level === 1 ? '' : 's'}. `,
		isWonderLauncher: true,
		launcherCost: 1 + 2 * level,
		condition: {
			onStart(target) {
				this.add('-start', target, 'move: Focus Energy');
			},
			onModifyCritRatio(critRatio) {
				return critRatio + level;
			},
		},
		onUse(target) {
			for (const effect of ['focusenergy', 'direhit', 'direhit2', 'direhit3']) {
				if (target.getVolatile(effect)) return false;
			}
			target.addVolatile(`direhit${level === 1 ? '' : level}`);
		},
		isUsable: true,
		animation: 'focusenergy',
	};
}

export const Items: {[k: string]: UsableItemData} = {
	xattack: XItem('atk', 1),
	xattack2: XItem('atk', 2),
	xattack3: XItem('atk', 3),
	xattack6: XItem('atk', 6),

	xdefend: XItem('def', 1),
	xdefend2: XItem('def', 2),
	xdefend3: XItem('def', 3),
	xdefend6: XItem('def', 6),

	xspecial: XItem('spa', 1),
	xspecial2: XItem('spa', 2),
	xspecial3: XItem('spa', 3),
	xspecial6: XItem('spa', 6),

	xspdef: XItem('spd', 1),
	xspdef2: XItem('spd', 2),
	xspdef3: XItem('spd', 3),
	xspdef6: XItem('spd', 6),

	xspeed: XItem('spe', 1),
	xspeed2: XItem('spe', 2),
	xspeed3: XItem('spe', 3),
	xspeed6: XItem('spe', 6),

	xaccuracy: XItem('accuracy', 1),
	xaccuracy2: XItem('accuracy', 2),
	xaccuracy3: XItem('accuracy', 3),
	xaccuracy6: XItem('accuracy', 6),

	direhit: direHit(1),
	direhit2: direHit(2),
	direhit3: direHit(3),

	guardspec: {
		name: `Guard Spec`,
		desc: `Prevents stat reduction by opponents' moves for the user's party for five turns.`,
		isWonderLauncher: true,
		launcherCost: 3,
		onUse(target) {
			if (target.side.getSideCondition('mist')) return false;
			target.side.addSideCondition('mist'); // Actually just,,, starts mist. Uses the same text and everything. wild.
		},
		isUsable: true,
		animation: 'mist',
	},

	reseturge: {
		name: `Reset Urge`,
		desc: `When used, it restores any stat changes of an ally Pokémon.`,
		isWonderLauncher: true,
		launcherCost: 9,
		onUse(target) {
			this.add('-clearboost', target);
			target.clearBoosts();
		},
		isUsable: true,
		animation: 'haze',
	},

	itemurge: {
		name: `Item Urge`,
		desc: `When used, it causes an ally Pokémon to use its held item.`,
		isWonderLauncher: true,
		launcherCost: 1,
		animation: 'Acid Armor',
		onUse(this, target) {
			const item: UsableItemData = this.dex.items.get(target.item);

			if (item.isBerry) { // turns out berries are the ONLY held items this works on. dumb.
				target.eatItem();
			} else {
				return false;
			}
		},
		isUsable: true,
	},

	itemdrop: {
		name: `Item Drop`,
		desc: `When used, it causes an ally Pokémon to drop a held item.`,
		isWonderLauncher: true,
		launcherCost: 5,
		onUse(target) { // TODO - this works against pokemon with sticky hold; current behavior: crash
			const item = target.getItem();
			if (item) {
				const oldItemState = target.itemState;
				target.item = '';
				target.itemState = {id: '', target};
				target.pendingStaleness = undefined;
				this.singleEvent('End', item, oldItemState, target);
				this.add('-enditem', target, item.name);
			} else {
				return false;
			}
		},
		isUsable: true,
		animation: 'knockoff',
	},

	abilityurge: {
		name: `Ability Urge`,
		desc: `When used, it activates the Ability of an ally Pokémon.`,
		isWonderLauncher: true,
		launcherCost: 3,
		onUse(target) {
			// This item triggers abilities' onStart.
			this.singleEvent('Start', target.getAbility(), target.abilityState, target);
			return false;
		},
		isUsable: true,
		animation: 'amnesia',
	},

	potion: {
		name: `Potion`,
		desc: `A spray-type medicine for wounds. It restores the HP of one Pokémon by just 20 points.`,
		isWonderLauncher: true,
		launcherCost: 2,
		targetable: true,
		heal: 20,
		isUsable: true,
		animation: 'recover',
	},

	superpotion: {
		name: `Super Potion`,
		desc: `A spray-type medicine for wounds. It restores the HP of one Pokémon by 50 points.`,
		isWonderLauncher: true,
		launcherCost: 4,
		targetable: true,
		heal: 50,
		isUsable: true,
		animation: 'recover',
	},

	hyperpotion: {
		name: `Hyper Potion`,
		desc: `A spray-type medicine for wounds. It restores the HP of one Pokémon by 200 points.`,
		isWonderLauncher: true,
		launcherCost: 8,
		targetable: true,
		heal: 200,
		isUsable: true,
		animation: 'recover',
	},

	maxpotion: {
		name: `Max Potion`,
		desc: `A spray-type medicine for wounds. It completely restores the HP of a single Pokémon.`,
		isWonderLauncher: true,
		launcherCost: 10,
		targetable: true,
		heal: [1, 1],
		isUsable: true,
		animation: 'recover',
	},

	fullrestore: {
		name: `Full Restore`,
		desc: `A medicine that fully restores the HP and heals any status problems of a single Pokémon.`,
		isWonderLauncher: true,
		launcherCost: 13,
		targetable: true,
		heal: [1, 1],
		healCondition: 'all',
		isUsable: true,
		animation: 'recover',
	},

	antidote: {
		name: `Antidote`,
		desc: `A spray-type medicine. It lifts the effect of poison from one Pokémon.`,
		isWonderLauncher: true,
		launcherCost: 4,
		targetable: true,
		healCondition: 'psn',
		isUsable: true,
		animation: 'refresh',
	},

	parylzheal: {
		name: `Parylz Heal`,
		desc: `A spray-type medicine. It eliminates paralysis from a single Pokémon.`,
		isWonderLauncher: true,
		launcherCost: 4,
		targetable: true,
		healCondition: 'par',
		isUsable: true,
		animation: 'refresh',
	},

	awakening: {
		name: `Awakening`,
		desc: `A spray-type medicine. It awakens a Pokémon from the clutches of sleep.`,
		isWonderLauncher: true,
		launcherCost: 4,
		targetable: true,
		healCondition: 'slp',
		isUsable: true,
		animation: 'refresh',
	},

	burnheal: {
		name: `Burn Heal`,
		desc: `A spray-type medicine. It heals a single Pokémon that is suffering from a burn.`,
		isWonderLauncher: true,
		launcherCost: 4,
		targetable: true,
		healCondition: 'brn',
		isUsable: true,
		animation: 'refresh',
	},

	iceheal: {
		name: `Ice Heal`,
		desc: `A spray-type medicine. It defrosts a Pokémon that has been frozen solid.`,
		isWonderLauncher: true,
		launcherCost: 4,
		targetable: true,
		healCondition: 'frz',
		isUsable: true,
		animation: 'refresh',
	},

	fullheal: { // Why would you ever use a full heal for 6 points when you could just use the individual item for 4??
		name: `Full Heal`,
		desc: `A spray-type medicine. It heals all the status problems of a single Pokémon.`,
		isWonderLauncher: true,
		launcherCost: 6,
		targetable: true,
		healCondition: 'all',
		isUsable: true,
		animation: 'refresh',
	},

	revive: {
		name: `Revive`,
		desc: `A medicine that revives a fainted Pokémon. It restores half the Pokémon's maximum HP.`,
		isWonderLauncher: true,
		launcherCost: 11,
		targetable: true,
		isUsable: true,
		revive: [1, 2],
	},

	maxrevive: {
		name: `Max Revive`,
		desc: `A medicine that revives a fainted Pokémon. It fully restores the Pokémon's HP.`,
		isWonderLauncher: true,
		launcherCost: 14,
		targetable: true,
		isUsable: true,
		revive: [1, 1],
	},

	ether: { // Ether targets move by leppa berry rules. This is not accurate.
		name: `Ether`,
		desc: `It restores the PP of a Pokémon's move by a maximum of 10 points.`,
		isWonderLauncher: true,
		launcherCost: 12,
		targetable: true,
		onUse(this, target) {
			const moveSlot = target.moveSlots.find(move => move.pp === 0) ||
				target.moveSlots.find(move => move.pp < move.maxpp);
			if (!moveSlot) {
				return false;
			}
			moveSlot.pp += 10;
			if (moveSlot.pp > moveSlot.maxpp) moveSlot.pp = moveSlot.maxpp;
		},
		isUsable: true,
	},
};

