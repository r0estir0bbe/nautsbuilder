<?php
	define('PROD', (!empty($_SERVER['SERVER_NAME']) && strpos($_SERVER['SERVER_NAME'], "nautsbuilder.com") !== false));
	// define('PROD', true);
	$now = time();
	$v = "0.12.0";
?>

<!DOCTYPE html>
<!--[if lt IE 7]>      <html lang="en" class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]-->
<!--[if IE 7]>         <html lang="en" class="no-js lt-ie9 lt-ie8"> <![endif]-->
<!--[if IE 8]>         <html lang="en" class="no-js lt-ie9"> <![endif]-->
<!--[if gt IE 8]><!--> <html lang="en" class="no-js"> <!--<![endif]-->
	<head>
		<meta charset="utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
		<title>Nautsbuilder - Awesomenauts builder: skills calculator, skills simulator - Make and share your Awesomenauts builds!</title>
		<meta name="description" content="">
		<meta name="viewport" content="width=device-width">
		<link rel="icon" type="image/png" href="img/favicon.png">
		<?php if (!PROD): ?>
		<link rel="stylesheet" href="css/style.css?v=<?php echo $v ?>">
		<?php else: ?>
		<link rel="stylesheet" href="dist/styles.min.css?v=<?php echo $v ?>">
		<?php endif ?>
		<script src="js/lib/modernizr.custom.js"></script>
	</head>
	<body>
		<!--[if lte IE 8]>
			<p class="obsolete-browser">You use an <strong>obsolete</strong> browser. <a href="http://browsehappy.com/">Upgrade it</a> to use the web <strong>safely</strong>!</p>
		<![endif]-->

		<div id="container">

		</div>

		<div id="footer">
			<p>Made by <a href="http://manu.habite.la" target="_blank">Leimi</a> - Like what you see?
				<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank">
					<input type="hidden" name="cmd" value="_donations">
					<input type="hidden" name="business" value="pelletier.emmanuel@gmail.com">
					<input type="hidden" name="lc" value="FR">
					<input type="hidden" name="item_name" value="A beer for Leimi">
					<input type="hidden" name="no_note" value="0">
					<input type="hidden" name="currency_code" value="EUR">
					<input type="hidden" name="bn" value="PP-DonationsBF:btn_donate_SM.gif:NonHostedGuest">
					<button>Buy me a beer! Or a pizza. Whatever.</button>
				</form>
				<a href="https://github.com/Leimi/nautsbuilder" target="_blank"><?php echo "v".$v ?></a> - <a style="color: #ccc" href="http://www.awesomenauts.com/forum/viewtopic.php?f=14&amp;t=13663" target="_blank">Forum topic</a> -
				Data gathered from the <a href="http://www.awesomenauts.com" target="_blank">Awesomenauts game</a> and the <a href="http://awesomenauts.gamepedia.com/Awesomenauts_Wiki" target="_blank">Wiki</a> by the community.
			</p>
		</div>

		<script type="text/template" id="chars-tpl">
			<% if (!mini) { %>
				<div class="console-info" title="Currently viewing <%= console ? 'Console Nautsbuilder' : 'PC Nautsbuilder' %>"></div>
			<% } %>
			<div class="current-char <%= mini ? 'mini' : '' %>">
				<% if (currentChar) { %>
					<div class="current-char-left">
						<div class="current-char-box current-char-type">
						<%= _.capitalized(currentChar.get('role')) %> - <%= _.capitalized(currentChar.get('attacktype')) %>
						</div>
						<div class="current-char-box current-char-skills">
							<% currentChar.get('skills').each(function(skill) { %>
							<div class="current-char-skill">
								<div class="current-char-skill-icon"><img src="<%= skill.get('icon') %>" alt=""></div>
								<div class="current-char-skill-desc"><p><%= skill.get('description') %><p></div>
							</div>
							<% }) %>
						</div>
					</div>
					<div class="current-char-info">
						<img class="current-char-image" src="<%= currentChar.get('image') %>" alt="">
						<h1 class="current-char-name"><%= currentChar.get('name') %></h1>
					</div>
					<div class="current-char-right">
						<div class="current-char-box current-char-desc">
							<p><%= currentChar.get('description') %></p>
						</div>
					</div>
				<% } else { %>
					<div class="current-char-placeholder"></div>
				<% } %>
			</div>
			<ul class="chars-list <%= mini ? 'mini' : '' %>">
			<% if (mini) { %>
				<li title="Back to home" class="char home-button"><a href="#<%= console ? 'console' : '' %>"><img class="char-icon" src="img/home.png" alt="Home"></a></li>
			<% } %>
			<% _.each(characters, function(charac) { %>
				<li title="<%= charac.name %>" data-char="<%= charac.name %>" class="char <%= charac.beta && charac.beta == "1" ? 'beta' : '' %> <%= character && character.name == charac.name ? 'active' : '' %> <%= !character && currentChar && currentChar.get('name') == charac.name ? 'active' : '' %>">
					<a href="#<%= _.underscored(charac.name) %><%= console ? '/console' : '' %>"><img class="char-icon" src="<%= charac.icon %>" alt=""></a>
				</li>
			<% }); %>
			<% if (character) { %>
				<!-- <li title="Switch to <%= console ? 'PC build' : 'Console build' %>" class="char console-button <%= console ? 'pc' : 'gamepad' %>">
					<a href="#<%= console ? '' : 'console' %>">
						<img class="char-icon" src="img/<%= console ? 'pc_blue.png' : 'gamepad_blue.png' %>" alt="">
					</a>
				</li> -->
			<% } %>
			</ul>
		</script>

		<script type="text/template" id="char-tpl">
			<% if (!forum) { %>
			<div class="console-info" title="Currently viewing <%= console ? 'Console Nautsbuilder' : 'PC Nautsbuilder' %>"></div>
			<div class="chars"></div>
			<% } else { %>
				<div class="char-info"></div>
				<div class="forum-info">
					<ul class="char-forum-switch">
						<li><button data-item="build">Build</button></li>
						<li><button data-item="order">Build order</button></li>
					</ul>
					<a href="" target="_blank" class="website-url">View in detail</a>
				</div>
			<% } %>
			<div class="build"></div>
			<div class="order"></div>

			<% if (!forum) { %>
				<div class="char-info"></div>
			<% } %>
		</script>

		<script type="text/template" id="build-tpl">
			<div class="build-cancel" title="Reset this build">x</div>
		</script>

		<script type="text/template" id="info-tpl">
			<p class="char-total-cost"><span class="cost">Total cost</span>: <span class="info"><%= total_cost %></span></p>
			<p class="char-level"><span>Required level</span>: <span class="info"><%= level %></span></p>
			<% if (!forum) { %>
			<label>Embed on the forum:
				<textarea rows=1 class="forum-snippet" readonly>

				</textarea>
			</label>
			<% } %>
		</script>

		<script type="text/template" id="order-tpl">
			<% if (!forum) { %>
				<p class="order-title">
					<label>
						<input type="checkbox" <%= active ? 'checked="checked"' : '' %> name="active">
						Build Order
						<em>(drag &amp; drop to change)</em>
					</label>
				</p>
			<% } %>
			<ul>
			<% _(items).each(function(item) { %>
				<li data-cid="<%= item.cid %>" class="<%= item.upgrade ? 'order-item order-item-upgrade' : 'order-item order-item-skill' %>">
					<div>
						<div class="order-icon"><img src="<%= item.upgrade ? item.upgrade.icon : item.icon %>" alt=""></div>
						<div class="order-popup hidden">
							<p><strong><%= item.upgrade ? item.upgrade.name + ' (stage ' + item.level + ')' : item.name %></strong></p>
							<p class="cost">Cost: <span class="info"><%= item.upgrade ? item.upgrade.cost : item.cost %></span></p>
							<p class="cost"><strong>Total cost</strong> at this time: <span class="info"><%= item.order_total_cost %></span></p>
							<p><strong>Required level</strong> at this time: <span class="info"><%= item.order_req_lvl %></span></p>
							<% if (item.upgrade) { %>
							<p>Stage <%= item.level %>: <%= item.description %></p>
							<% } %>
						</div>
					</div>
				</li>
			<% }) %>
			</ul>
		</script>

		<script type="text/template" id="build-skill-tpl">
		<div class="skill <%= active ? 'active' : '' %> <%= maxed_out ? 'skill-maxed-out' : '' %> <%= type ? type : '' %>">
			<div class="skill-info">
				<div class="skill-icon"><img src="<%= icon %>" alt=""></div>
				<% if (cost > 0) { %><div class="skill-cost icon-details"><%= cost %></div><% } %>
				<div class="skill-popup hidden">
					<p><strong><%= name %></strong></p>
					<p><%= description %></p>
					<p class="cost">Cost: <span class="info"><%= cost %></span></p>
					<p><strong>Effects:</strong><br>
					<% _(baseEffects).each(function(effect) { %>
						<%= _(effect.key).capitalized() %>: <%= effect.value %>;
					<% }) %>
					</p>
				</div>
			</div>
			<div class="skill-upgrades">
			</div>
			<div class="skill-cancel <%= ((toggable && active) || (upgrades.where({ active: true }).length > 0)) ? 'active' : '' %>" title="Reset this skill">x</div>
		</div>
		<div class="skill-effects <%= !effects.length ? 'hidden': '' %>">
		</div>
		</script>

		<script type="text/template" id="build-skill-effects-tpl">
			<% var finalEffects = _(effects).clone();
			if (total_cost > 0) finalEffects.push({key: "Total cost", value: total_cost});
			_(finalEffects).each(function(effect, i, list) {
				if (i % 5 == 0) { if (i !== 0) { %></dl><% } %><dl><% } %>
				<dt class="<%= _(effect.key).underscored().toLowerCase() %>" <%= effect.key.toLowerCase() === "attack speed" ? 'title="Attacks per minute"' : '' %>><span><%= _(effect.key).capitalized() %>:</span></dt>
				<dd><%= effect.value %></dd>
				<% if (list[i+1] == undefined) { %>
				</dl><% } %>
			<% }) %>
		</script>

		<script type="text/template" id="build-upgrade-tpl">
			<div class="upgrade-icon"><img src="<%= icon %>" alt=""></div>
			<div class="upgrade-cost icon-details "><%= cost %></div>
			<div class="upgrade-step icon-details <%= current_step.get('level') == max_step ? 'max' : '' %>"><%= current_step.get('level') || 0 %>/<%= max_step %></div>
			<div class="upgrade-popup hidden">
				<p><strong><%= name %></strong></p>
				<p><%= description %></p>
				<p class="cost">Cost: <span class="info"><%= cost %></span></p>
				<p><strong>Effects:</strong>
				<% steps.each(function(step) { if (step.get('level') > 0) { %>
				<br>
				<% if (_(current_step).isEqual(step)) { %><strong><% } %>
					Stage <%= step.get('level') %>: <%= step.get('description') %>
				<% if (_(current_step).isEqual(step)) { %></strong><% } %>
				<% } }) %>
			</div>
		</script>

		<script type="text/template" id="favs-tpl">
		<div class="chars"></div>
		<p class="warning">The favorites list, <a href="http://www.awesomenauts.com/forum/viewtopic.php?p=216258#p216258" target="_blank">being kinda useless</a>, will be totally removed at the end of August. Be sure to backup your builds in your browser's bookmarks or something.</p>
		<p class="favs-header">These are your favorite builds. They are stored locally on your device. You can share them all at once easily by copy/pasting all the URLs at the bottom.</p>
		<ul class="favs-list">
		<% _.each(favorites, function(fav) { %>
			<li class="fav <%= fav.console && fav.console == "1" ? 'console' : '' %>">
				<img class="fav-icon" src="<%= fav.character.icon %>" alt="">
				<a class="fav-name" href="#<%= fav.hash %>"><%= fav.character.name + (fav.name ? ' - ' + fav.name : '')  %></a>
				<span class="fav-delete" title="Delete from favorites (without confirmation)">x</span>
			</li>
		<% }); %>
		</ul>
		<form action="#" class="favs-share">
			<p>Share your builds
			<select name="favs-text-list" class="favs-share-switch">
				<option value="simple">with text</option>
				<option value="html">with HTML links</option>
				<option value="forum">on the forum</option>
			</select>
			</p>
			<textarea rows=10><%= favoritesText %></textarea>
		</form>
		</script>

		<script type="text/template" id="favs-list-simple-tpl">
<% _.each(favorites, function(fav) { %><%= fav.character.name + (fav.name ? ' - ' + fav.name : '') + ': ' + root + '/#' + fav.hash %>&#13;&#10;<% }); %></script>

		<script type="text/template" id="favs-list-html-tpl">
<% _.each(favorites, function(fav) { %><a href="<%= root + '/#' + fav.hash %>" target="_blank"><%= fav.character.name + (fav.name ? ' - ' + fav.name : '') %></a><br/>&#13;&#10;<% }); %></script>

		<script type="text/template" id="favs-list-forum-tpl">
<% _.each(favorites, function(fav) { %>[url="<%= root + '/#' + fav.hash %>"]<%= fav.character.name + (fav.name ? ' - ' + fav.name : '') %>[/url]&#13;&#10;<% }); %></script>


		<script src="data/last-update.js?v=<?php echo $now ?>"></script>
		<script src="js/nautsbuilder/spreadsheet/last-update.js?v=<?php echo $now ?>"></script>
		<?php if (!PROD): ?>
		<script src="js/lib/jquery.min.js"></script>
		<script src="js/lib/underscore.js"></script>
		<script src="js/lib/backbone.js"></script>
		<script src="js/lib/backbone.localStorage.js"></script>
		<script src="js/lib/tabletop.js"></script>
		<script src="js/lib/mousetooltip.js"></script>
		<script src="js/lib/fastclick.js"></script>
		<script src="js/lib/jquery.sortable.js"></script>
		<script src="js/lib/biginteger.js"></script>		
		<script src="js/nautsbuilder/utils.js?v=<?php echo $v ?>"></script>
		<script src="js/nautsbuilder/data/character.js?v=<?php echo $v ?>"></script>
		<script src="js/nautsbuilder/data/skill.js?v=<?php echo $v ?>"></script>
		<script src="js/nautsbuilder/data/upgrade.js?v=<?php echo $v ?>"></script>
		<script src="js/nautsbuilder/data/step.js?v=<?php echo $v ?>"></script>
		<script src="js/nautsbuilder/data/favorite.js?v=<?php echo $v ?>"></script>
		<script src="js/nautsbuilder/views/characters.js?v=<?php echo $v ?>"></script>
		<script src="js/nautsbuilder/views/character.js?v=<?php echo $v ?>"></script>
		<script src="js/nautsbuilder/views/character-build.js?v=<?php echo $v ?>"></script>
		<script src="js/nautsbuilder/views/character-order.js?v=<?php echo $v ?>"></script>
		<script src="js/nautsbuilder/views/character-info.js?v=<?php echo $v ?>"></script>
		<script src="js/nautsbuilder/views/skill.js?v=<?php echo $v ?>"></script>
		<script src="js/nautsbuilder/views/upgrade.js?v=<?php echo $v ?>"></script>
		<script src="js/nautsbuilder/views/favorites.js?v=<?php echo $v ?>"></script>
		<script src="js/nautsbuilder/app.js?v=<?php echo $v ?>"></script>
		<script src="js/main.js?v=<?php echo $v ?>"></script>
		<!-- ok so this is ugly - be sure to put the update.js script at the very end so that in cases of crash, it doesn't put down the whole app
		in fact, there is a rare bug with google spreadsheet API that will make Tabletop crash. I can't reproduce and well, can't debug this SO updating data is made at the very end in case the bug occurs -->
		<script src="js/nautsbuilder/spreadsheet/update.js?v=<?php echo $v ?>"></script>
		<?php else: ?>
		<script src="dist/libs.min.js?v=<?php echo $v ?>"></script>
		<script src="dist/scripts.min.js?v=<?php echo $v ?>"></script>
		<?php endif ?>
		<script>
			var _gaq=[['_setAccount','UA-13184829-6'],['_trackPageview']];
			(function(d,t){var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
			g.src=('https:'==location.protocol?'//ssl':'//www')+'.google-analytics.com/ga.js';
			s.parentNode.insertBefore(g,s)}(document,'script'));
			$(window).on('hashchange', function(){
			    _gaq.push(['_trackPageview', location.pathname + location.search + location.hash]);
			});
		</script>
	</body>
</html>
