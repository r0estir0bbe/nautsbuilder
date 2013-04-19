leiminauts.UpgradeView = Backbone.View.extend({
	tagName: 'div',

	className: 'upgrade',

	events: {
		'mouseover': 'handleTooltip',
		'mouseout': 'handleTooltip'
	},

	initialize: function() {
		this.template = _.template( $('#build-upgrade-tpl').html() );
	},

	render: function() {
		this.$el.html(this.template( this.model.toJSON() ));
		return this;
	},

	handleTooltip: function(e) {
		if (e.type == "mouseover") {
			MouseTooltip.show(this.$('.upgrade-popup').html());
		} else {
			MouseTooltip.hide();
		}
	}
});