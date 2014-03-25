/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */

/**
 * THIS is the messy part.
 */
leiminauts.Skill = Backbone.Model.extend({
	initialize: function(attrs, opts) {
		this.set('upgrades', new leiminauts.Upgrades());
		this.upgrades = this.get('upgrades');

		this.on('change:selected', this.onSelectedChange, this);
	},

	onSelectedChange: function() {
		if (this.get('selected')) {
			this.upgrades.on('change', this.updateEffects, this);
			this.on('change:active', this.updateEffects, this);
			this.on('change:active', this.resetUpgradesState, this);
		} else {
			this.upgrades.off('change', this.updateEffects, this);
			this.off('change:active', this.updateEffects, this);
			this.off('change:active', this.resetUpgradesState, this);
		}

		//first initialization of the skill: activating upgrades and shit
		if (this.get('selected') && this.get('upgrades').length <= 0) {
			this.set('maxed_out', false);
			this._originalEffects = this.get('effects');
			this.initBaseEffects();
			this.initUpgrades();
			this.set('total_cost', 0);
			this.set('active', this.get('cost') !== undefined && this.get('cost') <= 0);
			this.set('toggable', !this.get('active'));
		}
	},

	initBaseEffects: function() {
		if (!this.get('selected'))
			return false;
		if (!_(this.get('effects')).isString())
			return false;
		
		var baseEffects = leiminauts.utils.treatEffects(this.get('effects'));
		
		if (this.get('type') == "jump") {
			var currentSolar = _(baseEffects).findWhere({key: "solar"});
			var currentSolarPerMin = _(baseEffects).findWhere({key: "solar per min"});
			
			var baseSolar;
			var baseSolarPerMin;
			
			// Get solar values from common skill "Solar"
			var solarSkill = _(leiminauts.skills).findWhere({ name: "Solar", type: "jump" });
			if (solarSkill) {
				var solarEffects = _(leiminauts.utils.treatEffects(solarSkill['effects']));
				baseSolar = solarEffects.findWhere({key: "solar"});
				baseSolarPerMin = solarEffects.findWhere({key: "solar per min"});
			}
			
			if (!currentSolar && baseSolar)
				baseEffects.push(baseSolar);
			
			if (!currentSolarPerMin && baseSolarPerMin)
				baseEffects.push(baseSolarPerMin);
		}
		
		this.set('baseEffects', baseEffects);
	},

	initUpgrades: function() {
		// Use the common upgrades named Jump for the jump skill
		var skillName = (this.get('type') == "jump" ? "Jump" : this.get('name'));
		var skillUpgrades = _(leiminauts.upgrades).where({ skill: skillName });
		
		// Handle pills and unique character upgrades for the jump skill
		if (skillName === "Jump") {
			var upgradesObj = _(skillUpgrades);
			
			// Handle character specific pills
			var baseEffects = this.get('baseEffects');
			var pills = _(baseEffects).findWhere({key: "pills"});
			var pillsType = (pills ? pills.value : "turbo"); // default to Power Pills Turbo if not set
			
			if (pills) {
				// Remove pills value from baseEffects
				var index = _(baseEffects).indexOf(pills);
				baseEffects.splice(index, 1);
			}
			
			// Find and remove all Power Pills upgrades except pillsType
			var pillsPrefix = "Power Pills ";
			var indices = [];
			upgradesObj.each(function(upgrade, index) {
				var name = upgrade.name;
				if (name.indexOf(pillsPrefix) === 0 && name.length > pillsPrefix.length) {
					var type = name.substr(pillsPrefix.length).toLowerCase();
					if (type !== pillsType) {
						indices.push(index);
					}
				}
			});			
			// Remove elements from back to front to ensure that every index remains valid
			indices.sort(); indices.reverse();
			_(indices).each(function(index) {
				skillUpgrades.splice(index, 1);
			});

			// Replace unique jump upgrades with common ones
			var characterJumpUpgrades = _(leiminauts.upgrades).where({ skill: this.get('name') });
			_(characterJumpUpgrades).each(function(newUpgrade) {
				var oldUpgrade = upgradesObj.findWhere({ skill: "Jump", name: newUpgrade.replaces });
				var index = upgradesObj.indexOf(oldUpgrade);
				skillUpgrades[index] = _(newUpgrade).clone();
			});
		}
		this.get('upgrades').reset(skillUpgrades);
		this.resetUpgradesState();
	},

	setActive: function(active) {
		if (this.get('toggable'))
			this.set('active', !!active);
	},

	resetUpgradesState: function(active) {
		active = active !== undefined ? active : !this.get('active');
		this.upgrades.each(function(upgrade) {
			upgrade.setStep(0);
			upgrade.set('locked', active);
		}, this);
		this.set('maxed_out', false);
	},

	getActiveUpgrades: function() {
		var activeUpgrades = this.upgrades.filter(function(upgrade) {
			return upgrade.get('active') === true;
		});
		return activeUpgrades;
	},

	getActiveSteps: function() {
		var activeSteps = [];
		this.upgrades.each(function(upgrade) {
			if (upgrade.get('active') === true) {
				activeSteps.push(upgrade.get('current_step'));
			}
		});
		return activeSteps;
	},

	updateEffects: function(e) {
		if (!this.get('selected')) return false;
		if (!this.get('active')) {
			this.set('effects', []);
			this.set('total_cost', 0);
			return false;
		}
		var activeUpgrades = this.getActiveUpgrades();

		//is the skill maxed out?
		var maxedOut = true;
		if (activeUpgrades.length >= 3) {
			_(activeUpgrades).each(function(upgrade) {
				if (upgrade.get('current_step').get('level') !== upgrade.get('max_step')) {
					maxedOut = false;
					return false;
				}
			});
		} else
			maxedOut = false;
		this.set('maxed_out', maxedOut);

		var activeSteps = this.getActiveSteps();
		this.upgrades.each(function(upgrade) {
			if (this.get('active'))
				upgrade.set('locked', activeUpgrades.length >= 3 && !_(activeUpgrades).contains(upgrade));
		}, this);

		var cost = parseInt(this.get('cost'), 10);
		//update total skill cost
		_(activeUpgrades).each(function(upgrade) {
			cost += upgrade.get('current_step').get('level')*upgrade.get('cost');
		});
		this.set('total_cost', cost);

		//combine similar steps: some characters have upgrades that enhance similar things.
		// Ie Leon has 2 upgrades that add damages to its tong (1: +3/+6/+9 and 2: +9)
		//
		// this is KIND OF a mess
		// update 2nd of may 2013: THIS IS A BIG FREAKIN MESS. HOW DARE YOU. Sorry, future me.
		this.set('effects', [], {silent: true});
		var effects = {};
		var effectsAtEnd = [];
		var organizeEffects = function(attributesList) {
			_(attributesList).each(function(attr) {
				var val = attr.value;
				//if the effect concerns a division, it is put at the end of the array so that it divides the whole value
				if (attributesList !== effectsAtEnd && val.toString().charAt(0) == "/" && !_(parseFloat(val.substr(1))).isNaN())
					effectsAtEnd.push({key: attr.key, value: val});
				else {
					if (effects[attr.key] !== undefined)
						effects[attr.key].push(attr.value);
					else
						effects[attr.key] = [attr.value];
				}
			});
		};
		organizeEffects(this.get('baseEffects'));
		_(activeSteps).each(function(step, i) {
			organizeEffects(step.get('attrs'));
		});
		organizeEffects(effectsAtEnd);

		//for leon tong with max damage, our effects var now looks like: { "damage": ["+9", "+9"], "range": ["+2.4"], ...  }
		//we must combine effects values that looks like numbers so we have "damage": "+18",
		//without forgetting the possible "+", "-", "%", "/", "s"
		//@ is a flag to indicate not to add similar values between them and only take the last one that'll replace others. Yeah, ugly, as usual o/ Used for lonestar missiles attack speed
		var effectRegex = /^(\+|-|\/|@)?([0-9]+[\.,]?[0-9]*)([%s])?$/i; //matchs "+8", "+8,8", "+8.8", "+8s", "+8%", "-8", etc
		_(effects).each(function(values, key) {
			var effect = "";
			var oldEffect = false;
			_(values).each(function(value, i) {
				regexRes = effectRegex.exec(value);
				if (regexRes !== null) {
					var showUnit = true;
					var effectNumber = parseFloat(effect);
					if (_(effectNumber).isNaN()) effectNumber = 0;

					//if original value is %, we just += values. Otherwise (ie attack speed), we calculate the % based on original value
					if (regexRes[3] && regexRes[3] == "%" && effectNumber !== 0 && values[0].substr(-1) != "%") {
						effectNumber += parseFloat(values[0]) * (parseFloat(value)/100);
						showUnit = false;
					}
					//we divide if there is a "/"
					else if (regexRes[1] && regexRes[1] == "/") {
						effectNumber = effectNumber/parseFloat(value.substr(1));
					}
					else if (regexRes[1] && regexRes[1] == "@")
						effectNumber = parseFloat(value.substr(1));
					else
						effectNumber += parseFloat(value);
					effectNumber = leiminauts.utils.number(effectNumber);
					effect = effectNumber;
					if (regexRes[3] && showUnit) effect += regexRes[3];
					if (regexRes[1] && regexRes[1] == "+" && effectNumber > 0 && (!oldEffect || oldEffect.toString().indexOf('+') === 0))
						effect = "+" + effect;
				} else
					effect = value;
				oldEffect = effect;
			});
			this.get('effects').push({ "key": key, value: effect });
		}, this);
		this.setSpecificEffects();
		this.setDPS();
		this.setSpecificEffectsTheReturnOfTheRevenge();
		this.set('effects', _(this.get('effects')).sortBy(function(effect) { return effect.key.toLowerCase(); }));
	},

	setSpecificEffects: function() {
		if (!this.get('selected')) return false;
		var effects = _(this.get('effects'));
		var avgDmg = 0;
		var dmg = 0;

		var bonusesDmg = [];
		if (this.get('name') == "Bolt .45 Fish-gun") {
			bonusesDmg.push('bonus damage');
		}

		if (this.get('name') == "Bubble Gun") {
			bonusesDmg.push('yakoiza damage', 'godfish damage');
		}

		if (this.get('name') == "Chain whack") {
			bonusesDmg.push('ion blowtorch damage');
		}

		_(bonusesDmg).each(function(bonus) {
			var bonusDmg = effects.findWhere({key: bonus});
			if (bonusDmg) {
				bonusDmgVal = this.bonusDamage(effects.findWhere({key: "damage"}), bonus, effects);
				bonusDmg.value = bonusDmgVal;
			}
		}, this);

		if (this.get('name') == "Missiles") {
			var missilesSequence = [];
			var baseDamage = effects.findWhere({key: "damage"}).value;
			_(4).times(function() { missilesSequence.push(baseDamage); });
			var missiles = effects.filter(function(effect) {
				return (/^missile [0-9]$/).test(effect.key);
			});
			_(missiles).each(function(missile) {
				var number = parseInt(missile.key.substr(-1), 10)-1;
				missilesSequence[number] = (baseDamage + (4*number))*parseInt(missile.value, 10);
				effects.splice( _(effects).indexOf( _(effects).findWhere({ key: missile.key }) ), 1 );
			});
			while ((missilesSequence.length > 1) && (missilesSequence[missilesSequence.length-1] == baseDamage))
				missilesSequence.pop();
			avgDmg = _(missilesSequence).reduce(function(memo, num){ return memo + num; }, 0) / missilesSequence.length;
			effects.findWhere({key: "damage"}).value = missilesSequence.join(' > ');
			if (missilesSequence.length !== 1 && avgDmg !== missilesSequence[0])
				effects.push({key: "avg damage", value: leiminauts.utils.number(avgDmg)});
		}

		if (this.get('name') == "Bash") {
			var punchsSequence = _(this.get('baseEffects')).findWhere({key:"damage"}).value.split(' > ');
			var punchs = effects.filter(function(effect) {
				return (/^punch [0-9]$/).test(effect.key);
			});
			_(punchs).each(function(punch) {
				var number = parseInt(punch.key.substr(-1), 10)-1;
				punchsSequence[number] = punchsSequence[number]*1 + parseInt(punch.value, 10);
				effects.splice( _(effects).indexOf( _(effects).findWhere({ key: punch.key }) ), 1 );
			});

			avgDmg = _(punchsSequence).reduce(function(memo, num){ return memo + num*1; }, 0) / punchsSequence.length;
			effects.findWhere({key: "damage"}).value = punchsSequence.join(' > ');
			effects.push({key: "avg damage", value: leiminauts.utils.number(avgDmg)});
		}

		if (this.get('name') == "Slash") {
			var clover = this.getActiveUpgrade("clover of honour");
			var backstab = this.getActiveUpgrade("backstab blade");
			var backstabDmg, bsEffect;
			dmg = effects.findWhere({key: "damage"});

			if (backstab) {
				backstabDmg = this.bonusDamage(dmg, "backstab damage", effects);
				bsEffect = effects.findWhere({key: "backstab damage"});
				if (bsEffect) bsEffect.value = backstabDmg;
			}

			if (clover) {
				cloverDmg = this.bonusDamage(dmg, "3rd hit damage", effects);
				avgDmg = (dmg.value*2+cloverDmg)/3;
				dmg.value = [dmg.value*1, dmg.value*1, cloverDmg].join(' > ');
				effects.push({key: "avg damage", value: leiminauts.utils.number(avgDmg)});

				if (backstab && bsEffect) {
					cloverDmgBs = this.bonusDamage(backstabDmg, "3rd hit damage", effects);
					bsEffect.value = [backstabDmg*1, backstabDmg*1, cloverDmgBs].join(' > ');
					backstabDmg = (backstabDmg*2+cloverDmgBs)/3;
					effects.push({key: "avg backstab damage", value: leiminauts.utils.number(backstabDmg)});
				}

				effects.splice( _(effects).indexOf( _(effects).findWhere({ key: "3rd hit damage" }) ), 1 );
			}
		}

		//monkey's avg dps and max dps. Avg dps is the dps including all charges but the last one.
		if (this.get('name') == "Laser") {
			var minDamage = effects.findWhere({key: "damage"}).value;
			var maxDamage = effects.findWhere({key: "max damage"}).value;
			var steps = [];
			_(maxDamage - minDamage).times(function(i) { steps.push(i+minDamage); });
			var attackPerSecond = effects.findWhere({key: "attack speed"}).value/60;
			var tickPerSecond = effects.findWhere({key: "time to next charge"}).value.replace('s', '')*1;
			var stepAttackPerSecond = attackPerSecond*tickPerSecond;
			var time = 0;
			dmg = 0;
			_(steps).each(function(step) {
				dmg += stepAttackPerSecond*step;
				time += tickPerSecond;
			});
			var avgDPS = dmg/time;
			effects.push({key: "DPS until max", value: leiminauts.utils.number(avgDPS)});
			effects.push({key: "DPS max", value: leiminauts.utils.number(attackPerSecond*maxDamage)});
		}

		if (this.get('name') == "Spike Dive") {
			dmg = effects.findWhere({key: "damage"}).value;
			var seahorse = this.getActiveUpgrade("dead seahorse head");
			var seahorseEffect = null;
			var seahorsePercent = effects.findWhere({key: "extra spike damage"});
			seahorsePercent = seahorsePercent ? parseInt(seahorsePercent.value, 10) : null;
			if (seahorse && seahorsePercent) {
				effects.splice( _(effects).indexOf( _(effects).findWhere({ key: "extra spike" }) ), 1 );
				effects.splice( _(effects).indexOf( _(effects).findWhere({ key: "extra spike damage" }) ), 1 );
				seahorseEffect = {key: "Extra Spike", value: dmg*seahorsePercent/100 };
				effects.push(seahorseEffect);
			}

			var goldfish = this.getActiveUpgrade("bag full of gold fish");
			var goldfishEffect = effects.findWhere({key: "damage with 150 solar"});
			if (goldfish && goldfishEffect) {
				goldfishEffect.value = goldfishEffect.value*1 + dmg;
				if (seahorseEffect) {
					effects.push({key: "Extra Spike With 150 Solar", value: Math.floor(goldfishEffect.value*seahorsePercent/100)});
				}
			}
		}

		if (this.get('name') == "Evil Eye") {
			var toothbrush = this.getActiveUpgrade("toothbrush shank");
			if (toothbrush) {
				dmg = _(this.get('baseEffects')).findWhere({key:"damage"}).value.split(' > ');
				toothbrushVal = toothbrush.get('current_step').get('level') > 0 ? toothbrush.get('current_step').get('attrs') : null;
				if (toothbrushVal) {
					var percentToAdd = parseInt(_(toothbrushVal).findWhere({key: "damage"}).value, 10);
					var newDmg = [];
					_(dmg).each(function(val) {
						newDmg.push(((val*1)/100*(percentToAdd*1))+val*1);
					});
					effects.findWhere({key: "damage"}).value = newDmg.join(' > ');
				}
			}
		}
	},

	setDPS: function() {
		if (!this.get('selected')) return false;
		if (this.get('name') == "Laser") return false; //dps is set in specifics for the laser

		var effects = _(this.get('effects'));

		//normal DPS
		var attackSpeed = effects.findWhere({key: "attack speed"});
		var damage = effects.findWhere({key: "avg damage"});
		if (!damage) damage = effects.findWhere({key: "damage"});
		var dps = effects.findWhere({key: "DPS"});
		if (attackSpeed && damage) {
			dpsVal = leiminauts.utils.dps(damage.value, attackSpeed.value);
			if (dps) dps.value = dpsVal;
			else {
				dps = {key: "DPS", value: dpsVal};
				effects.push(dps);
			}
		}

		//dot DPS
		var dot = effects.findWhere({key: "damage over time"});
		var dotDuration = effects.findWhere({key: "damage duration"});
		if (dot && dotDuration) {
			effects.push({ key: "DOT DPS", value: leiminauts.utils.number(dot.value/dotDuration.value.replace('s', '')) });
		}

		if (this.get('type') === "auto") {
			//"bonus" DPS
			//we look for any bonus dps activated. A "bonus dps" is generally given from an upgrade of the AA (lonestar missiles, coco conductor, etc)
			//couple of effects like "missile damage" and "missile attack speed" represents a "bonus dps" that can be calculated
			//if one part is not detected (ie we have a "missile damage" effect but no "missile attack speed") we take default attack speed and vice versa
			//"Bonus Damage" or "Avg damage" are usually not calculated
			var bonusCheck = { "damage": [], "attackSpeed": [] };
			var deniedBonusWords = ["storm", "bonus", "avg", "turret", "yakoiza", "grenade", "snipe", "min", "max", "droid"];
			effects.each(function(e) {
				var denied = false;
				_(deniedBonusWords).each(function(word) { if (e.key.toLowerCase().indexOf(word) === 0) { denied = true; }});
				if (denied) return false;
				var specificDmg = (e.key).match(/(.+) damage/i);
				var specificAS = (e.key).match(/(.+) attack speed/i);
				if (specificDmg) bonusCheck.damage.push(specificDmg[1]);
				if (specificAS)	bonusCheck.attackSpeed.push(specificAS[1]);
			});
			var totalDPS = dps ? +dps.value : 0;
			var bonus = _.union(bonusCheck.damage, bonusCheck.attackSpeed); //in our example, contains "missile"
			_(bonus).each(function(i) {
				var dmgEffect;
				if (effects.findWhere({key: "avg " + i + " damage"}))
					dmgEffect = effects.findWhere({key: "avg " + i + " damage"});
				else
					dmgEffect = effects.findWhere({key: i + " damage"}) ? effects.findWhere({key: i + " damage"}) : effects.findWhere({key: "damage"});
				var asEffect = effects.findWhere({key: i + " attack speed"}) ? effects.findWhere({key: i + " attack speed"}) : effects.findWhere({key: "attack speed"});
				var itemBonus = {key: i + " DPS", value: leiminauts.utils.dps( dmgEffect.value, asEffect.value )};
				totalDPS += +itemBonus.value;
				effects.push(itemBonus);
			});
			if (bonus.length && dps && totalDPS !== dps.value && !_(['Slash', 'Bubble Gun', 'Chain whack']).contains(this.get('name')))
				effects.push({key: "total DPS", value: leiminauts.utils.number(totalDPS) });
		}
	},

	//set specifics effects after DPS calculation
	setSpecificEffectsTheReturnOfTheRevenge: function() {
		if (!this.get('selected')) return false;
		var effects = _(this.get('effects'));

		effects.each(function(effect) {
			var result = (effect.key).match(/(.+) multiplier/i);
			if (result && effect.value) {
				effects.splice(effects.indexOf(effect), 1);
				this.multiplyEffect(effect.value, effects, result[1]);

				if (this.get('name') == "Bubble Gun") {
					this.multiplyEffect(effect.value, effects, "godfish damage");
					this.multiplyEffect(effect.value, effects, "yakoiza damage");
				}
			}
		}, this);
	},

	multiplyEffect: function(times, effects, effectKey) {
		effectKey = effectKey || "damage";
		var effect = effects.findWhere({key: effectKey});
		if (effect) effect.value = leiminauts.utils.number(effect.value*times) + "&nbsp; ( " + effect.value + "×" + times + " )";

		var dmgLength = "damage".length;
		if (effectKey.substr(-dmgLength) === "damage") {
			var dpsPrefix = effectKey.substr(0, effectKey.length - dmgLength);
			var dps = effects.findWhere({key: dpsPrefix + "DPS"});
			if (dps) dps.value = leiminauts.utils.number(dps.value*times) + "&nbsp; ( " + dps.value + "×" + times + " )";
		}
	},

	bonusDamage: function(baseDmg, effect, effects) {
		var dmg = parseFloat(baseDmg && baseDmg.value ? baseDmg.value : baseDmg);
		var eff = effects.findWhere({key: effect});
		eff = eff ? eff.value : 0;
		return dmg + eff*1;
	},

	getActiveUpgrade: function(name) {
		var upgrade = _(this.getActiveUpgrades()).filter(function(upg) { return upg.get('name').toLowerCase() == name.toLowerCase(); });
		if (upgrade.length) return upgrade[0]; else return false;
	}
});

leiminauts.Skills = Backbone.Collection.extend({
	model: leiminauts.Skill
});
