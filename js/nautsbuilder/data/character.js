/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * copyright (c) 2013, Emmanuel Pelletier
 */
leiminauts.Character = Backbone.Model.extend({
	initialize: function() {
		this.set('totalCost', 0);
		this.set('level', 0);
		this.get('skills').on('change:totalCost', this.onCostChange, this);

		this.on('change:selected', this.onSelectedChange, this);
	},

	onCostChange: function() {
		var cost = 0;
		this.get('skills').each(function(skill) {
			cost += skill.get('totalCost');
		});
		this.set('level', Math.floor( (cost-100)/100) <= 0 ? 0 : Math.floor((cost-100)/100));
		this.set('totalCost', cost);
	},

	onSelectedChange: function() {
		this.get('skills').each(function(skill) {
			skill.set('selected', this.get('selected'));
		}, this);
	}
});

/**
 * this is our full "database"
 * we have a characters list > each character has skills > each skills has upgrades
 *
 * you must pass the tabletop object which contains the google spreadsheet with all the data in the options at initialization
 */
leiminauts.CharactersData = Backbone.Collection.extend({
	model: leiminauts.Character,

	initialize: function(models, opts) {
		//treating spreadsheet data:
		//each character has skills
		//each skills has upgrades
		if (opts.spreadsheet !== undefined) {
			this.spreadsheet = opts.spreadsheet;

			var characters, skills, upgrades;
			if (this.spreadsheet) {
				leiminauts.characters = this.spreadsheet.sheets('Characters').all();
				leiminauts.skills = this.spreadsheet.sheets('Skills').all();
				leiminauts.upgrades = this.spreadsheet.sheets('Upgrades').all();

				if (Modernizr.localstorage) {
					localStorage.setItem('nautsbuilder.characters', JSON.stringify(characters));
					localStorage.setItem('nautsbuilder.skills', JSON.stringify(skills));
					localStorage.setItem('nautsbuilder.upgrades', JSON.stringify(upgrades));
					localStorage.setItem('nautsbuilder.date', new Date().getTime());
				}
			} else {
				leiminauts.characters = JSON.parse(localStorage.getItem('nautsbuilder.characters'));
				leiminauts.skills = JSON.parse(localStorage.getItem('nautsbuilder.skills'));
				leiminauts.upgrades = JSON.parse(localStorage.getItem('nautsbuilder.upgrades'));
			}
			_.each(leiminauts.characters, function(character) {
				var charSkills = _(leiminauts.skills).where({ character: character.name });
				character.skills = new leiminauts.Skills(charSkills);
				this.add(character);
			}, this);
		}
	}
});