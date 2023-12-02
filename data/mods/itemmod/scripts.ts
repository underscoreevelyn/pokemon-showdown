/**
 * Wonder Launcher OU
 *
 * In order to allow the client to draw the UI, I mangled the /choose handling. Most of the
 * unique code is separated into chooseItem(). This behavior is definitely not an intended
 * part of the engine and I would not trust this code with my baby. I cannot describe just
 * how bad and untrustworthy this code is.
 */

import {Utils} from "../../../lib";
import {UsableItemData} from './items';

import {Battle} from "../../../sim/battle";
import {Side} from "../../../sim/side";

// probably a slightly cursed way of doing this... but much easier to update
const origChoose = Side.prototype.choose;
const origRunAction = Battle.prototype.runAction;
const origNextTurn = Battle.prototype.nextTurn;

export const Scripts: ModdedBattleScriptsData = {
	inherit: 'gen9',
	side: {
		// @ts-ignore
		choose(this: Side, input: string): boolean {
			if (input.startsWith('item')) {
				this.clearChoice();
				// @ts-ignore
				return this.chooseItem(input.slice(5));
			} else {
				return origChoose.call(this, input);
			}
		},

		chooseItem(this: Side, data: string): boolean {
			if (this.requestState !== 'move') {
				return this.emitChoiceError(`Can't use item: You need a ${this.requestState} response`);
			}

			const pokemon = this.active[0];
			const parts = data.split(' ');
			const potentialTarget = parseInt(parts[parts.length - 1]);
			let target: number, item: UsableItemData;

			// if the last spot is not a number or targeting is off
			// also important to check if the last spot is positive, because many items end with a number
			if (isNaN(potentialTarget) || potentialTarget >= 0 || !this.battle.ruleTable.has('itemmodtargeting')) {
				target = -1;
				item = this.battle.dex.items.get(data);
			} else {
				target = potentialTarget;
				item = this.battle.dex.items.get(parts.slice(0, -1).join(''));
			}

			// @ts-ignore
			if (!item.isUsable) {
				return this.emitChoiceError(`Can't use item: ${item} is not a valid item.`);
			}

			// @ts-ignore bag check
			const bag = this.bag;
			if (bag) {
				if (!item.id || !bag[item.id]) {
					return this.emitChoiceError(`Can't use item: You don't have that item.`);
				}
			}

			// @ts-ignore Wonder Launcher check
			if (this.battle.hasWonderLauncher && item.isWonderLauncher) {
				// @ts-ignore
				if (this.launcherPoints < item.launcherCost) {
					return this.emitChoiceError(`Can't use item: You don't have enough Wonder Launcher points.`);
				}
			}

			if (target >= 0 || -target > this.pokemon.length) {
				return this.emitChoiceError(`Can't use item: Invalid target`);
			}

			// if (pokemon.volatiles.embargo || this.battle.field.pseudoWeather.magicroom) { // turns out these effects don't actually prevent item usage on cartridge
			//    return this.emitChoiceError(`Can't use item: An item suppressing condition is in effect.`);
			// }

			this.choice.actions.push({
				// @ts-ignore this is definitely okay. this will not cause me any headaches down the line.
				choice: 'item',
				itemid: item.id,
				targetLoc: target,
				pokemon,
				order: 107, // after every other prioritized action. cartridge accuracy?
			});

			return true;
		},
	},

	runAction(action: Action) {
		// @ts-ignore
		if (action.choice === 'item') {
			const act = action as {choice: 'item', itemid: string, pokemon: Pokemon, targetLoc: number};
			const item: UsableItemData = this.dex.items.get(act.itemid); // LET'S GOOOOOO
			const side = act.pokemon.side;
			const target = side.pokemon[-act.targetLoc - 1];

			this.add('-message', `${side.name} used the ${item.name}!`);
			if (target.isActive && item.animation) {
				this.add('-anim', target, item.animation);
			}

			// Hope and pray this doesn't crash :///

			if (item.heal) {
				let h = Array.isArray(item.heal) ? Math.floor(target.maxhp * item.heal[0] / item.heal[1]) : item.heal;
				if (h > target.maxhp - target.hp) h = target.maxhp - target.hp;
				if (h > 0) {
					target.hp += h;
					if (target.isActive) this.add('-heal', target, target.getHealth, `[silent]`);
					this.add('-message', `${target.name} had its HP restored.`);
				} else {
					this.add('-message', 'It had no effect!');
				}
			}

			if (item.healCondition) {
				if (item.healCondition === 'all' || item.healCondition === target.status) {
					target.cureStatus();
				} else {
					this.add('-message', 'It had no effect!');
				}
			}

			if (item.boosts) {
				this.boost(item.boosts, target);
			}

			if (item.revive) {
				if (target.fainted) {
					// basically copy from revival blessing, hope it works!
					target.fainted = false; // uhhh
					target.faintQueued = false;
					side.pokemonLeft += 1;
					target.hp = target.maxhp * item.revive[0] / item.revive[1];
					target.clearStatus();
					this.add('-message', `${target.name} was revived!`);
				} else {
					this.add('-message', 'It had no effect!');
				}
			}

			if (item.onUse) {
				const result = item.onUse.call(this, target);
				if (result !== undefined && !result) {
					this.add('-message', 'It had no effect!');
				}
			}

			// @ts-ignore Remove the item.
			if (this.hasWonderLauncher && item.isWonderLauncher) {
				// @ts-ignore
				side.launcherPoints -= item.launcherCost || 0;
			// @ts-ignore
			} else if (side.bag) {
				// @ts-ignore
				side.bag[item.id] -= 1;
			}
		}

		return origRunAction.call(this, action);
	},

	nextTurn() {
		origNextTurn.call(this);
		// Item Bag UI code - only works in single battles, doesn't support targeting, probably never will without client code -_-
		for (const side of this.sides) {
			// @ts-ignore
			const bag = side.bag;
			if (bag) {
				let buf = 'uhtml|itembag|<p><strong>Item Bag</strong></p>';
				// @ts-ignore
				if (this.hasWonderLauncher) buf += `<p><strong>${side.launcherPoints}</strong> Launcher Points</p>`;
				buf += '<details><summary>Availible Items</summary>';
				for (const id in bag) {
					const item: UsableItemData = this.dex.items.get(id);
					// @ts-ignore
					buf += `<button name="send" value="/choose item ${id}">${item.name}: ${this.hasWonderLauncher ? item.launcherCost || 0 : bag[id]}</button>`;
				}
				buf += '</details>';
				this.add(() => ({side: side.id, secret: buf, shared: ''}));
			}
		}
	},

	start() {
		if (this.gameType !== 'singles') throw new Error(`Itemmod does not support ${this.gameType} battles!`);
	},
};
