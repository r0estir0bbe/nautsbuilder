leiminauts.SkillView = Backbone.View.extend({
	tagName: 'div',

	className: 'skill-wrapper',

	events: {
		'mouseover .skill-icon': 'handleTooltip',
		'mouseout .skill-icon': 'handleTooltip',
		'click .skill-icon': 'toggleState'
	},

	initialize: function() {
		this.upgrades = [];
		this.model.get('upgrades').each(function(upgrade) {
			this.upgrades.push(new leiminauts.UpgradeView({ model: upgrade }));
		}, this);

		this.template = _.template( $('#build-skill-tpl').html() );

		this.model.get('upgrades').on('change', this.renderUpgradesInfo, this);

		this.model.on('change', this.render, this);
	},

	toggleState: function() {
		if (!this.model.get('toggable'))
			return false;
		this.model.set('active', !this.model.get('active'));
	},

	render: function() {
		this.$el.html(this.template( this.model.toJSON() ));
		_(this.upgrades).each(function(upgrade) {
			upgrade.delegateEvents();
			this.$('.skill-upgrades').append(upgrade.render().el);
		}, this);

		this.renderUpgradesInfo();
		return this;
	},

	renderUpgradesInfo: function() {
		this.$(".skill-upgrades-desc").html(
			_.template(
				$('#build-skill-info-tpl').html(),
				this.model.toJSON()
			)
		);
	},

	handleTooltip: function(e) {
		if (e.type != "mouseout")
			MouseTooltip.show(this.$('.skill-popup').html());
		else
			MouseTooltip.hide();
	}
});