function loadVip() {
	$.ajax("roster.xml")
	.success(function(roster) {

		var PL = new jPlayerPlaylist({
			jPlayer: "#jquery_jplayer_1",
			cssSelectorAncestor: "#jp_container_1"
		}, 
		[],
		{
			swfPath: "js",
			supplied: "m4a",
			wmode: "window",
			smoothPlayBar: true,
			keyEnabled: true,
			playlistOptions: {
				autoPlay: true,
				loopOnPrevious: false,
				shuffleOnLoop: true,
				enableRemoveControls: false,
				displayTime: 'slow',
				addTime: 'fast',
				removeTime: 'fast',
				shuffleTime: 'fast'
			},
		});
		
		var songsArr = [];
		$(roster).find("track").each(function(idx, track) {
			track = $(track);
			songsArr.push({
				title: track.find("creator").text() + ' - ' + track.find("title").text(),
				artist: "",
				m4a: track.find("location").text(),
			});
		});
		
		PL.setPlaylist(songsArr);
		PL.shuffle(true, true);
	});
}