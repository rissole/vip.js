/*
 * Playlist Object for the jPlayer Plugin
 * http://www.jplayer.org
 *
 * Copyright (c) 2009 - 2013 Happyworm Ltd
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/MIT
 *
 * Author: Mark J Panaghiston
 * Version: 2.3.0
 * Date: 20th April 2013
 *
 * Requires:
 *  - jQuery 1.7.0+
 *  - jPlayer 2.3.0+
 */

/* Code verified using http://www.jshint.com/ */
/*jshint asi:false, bitwise:false, boss:false, browser:true, curly:true, debug:false, eqeqeq:true, eqnull:false, evil:false, forin:false, immed:false, jquery:true, laxbreak:false, newcap:true, noarg:true, noempty:true, nonew:true, onevar:false, passfail:false, plusplus:false, regexp:false, undef:true, sub:false, strict:false, white:false, smarttabs:true */
/*global  jPlayerPlaylist:true */

(function($, undefined) {

	jPlayerPlaylist = function(cssSelector, playlist, options) {
		var self = this;

		this.current = 0;
		this.loop = false; // Flag used with the jPlayer repeat event
		this.shuffled = false;
		this.removing = false; // Flag is true during remove animation, disabling the remove() method until complete.

		this.cssSelector = $.extend({}, this._cssSelector, cssSelector); // Object: Containing the css selectors for jPlayer and its cssSelectorAncestor
		this.options = $.extend(true, {
			keyBindings: {
				next: {
					key: 39, // RIGHT
					fn: function() {
						self.next();
					}
				},
				previous: {
					key: 37, // LEFT
					fn: function() {
						self.previous();
					}
				}
			}
		}, this._options, options); // Object: The jPlayer constructor options for this playlist and the playlist options

		this.playlist = []; // Array of Objects: The current playlist displayed (Un-shuffled or Shuffled)
		this.shuffledIndices = []; // The shuffle ordering

		this._initPlaylist(playlist);

		// Setup the css selectors for the extra interface items used by the playlist.
		this.cssSelector.title = this.cssSelector.cssSelectorAncestor + " .jp-title"; // Note that the text is written to the decendant li node.
		this.cssSelector.playlist = this.cssSelector.cssSelectorAncestor + " .jp-playlist";
		this.cssSelector.next = this.cssSelector.cssSelectorAncestor + " .jp-next";
		this.cssSelector.previous = this.cssSelector.cssSelectorAncestor + " .jp-previous";
		this.cssSelector.shuffle = this.cssSelector.cssSelectorAncestor + " .jp-shuffle";
		this.cssSelector.shuffleOff = this.cssSelector.cssSelectorAncestor + " .jp-shuffle-off";

		// Override the cssSelectorAncestor given in options
		this.options.cssSelectorAncestor = this.cssSelector.cssSelectorAncestor;

		// Override the default repeat event handler
		this.options.repeat = function(event) {
			self.loop = event.jPlayer.options.loop;
		};

		// Create a ready event handler to initialize the playlist
		$(this.cssSelector.jPlayer).bind($.jPlayer.event.ready, function() {
			self._init();
		});

		// Create an ended event handler to move to the next item
		$(this.cssSelector.jPlayer).bind($.jPlayer.event.ended, function() {
			self.next();
		});

		// Create a play event handler to pause other instances
		$(this.cssSelector.jPlayer).bind($.jPlayer.event.play, function() {
			$(this).jPlayer("pauseOthers");
		});

		// Create a resize event handler to show the title in full screen mode.
		$(this.cssSelector.jPlayer).bind($.jPlayer.event.resize, function(event) {
			if(event.jPlayer.options.fullScreen) {
				$(self.cssSelector.title).show();
			} else {
				$(self.cssSelector.title).hide();
			}
		});

		// Create click handlers for the extra buttons that do playlist functions.
		$(this.cssSelector.previous).click(function() {
			self.previous();
			$(this).blur();
			return false;
		});

		$(this.cssSelector.next).click(function() {
            var oldLoop = self.loop;
            self.loop = false;
			self.next();
            self.loop = oldLoop;
			$(this).blur();
			return false;
		});

		$(this.cssSelector.shuffle).click(function() {
			self.shuffle(true);
			return false;
		});
		$(this.cssSelector.shuffleOff).click(function() {
			self.shuffle(false);
			return false;
		}).hide();

		// Put the title in its initial display state
		if(!this.options.fullScreen) {
			$(this.cssSelector.title).hide();
		}

		// Remove the empty <li> from the page HTML. Allows page to be valid HTML, while not interfereing with display animations
		$(this.cssSelector.playlist + " ul").empty();

		// Create .on() handlers for the playlist items along with the free media and remove controls.
		this._createItemHandlers();

		// Instance jPlayer
		$(this.cssSelector.jPlayer).jPlayer(this.options);
	};

	jPlayerPlaylist.prototype = {
		_cssSelector: { // static object, instanced in constructor
			jPlayer: "#jquery_jplayer_1",
			cssSelectorAncestor: "#jp_container_1"
		},
		_options: { // static object, instanced in constructor
			playlistOptions: {
				autoPlay: false,
				loopOnPrevious: false,
				shuffleOnLoop: true,
				enableRemoveControls: false,
				displayTime: 'slow',
				addTime: 'fast',
				removeTime: 'fast',
				shuffleTime: 'slow',
				itemClass: "jp-playlist-item",
				freeGroupClass: "jp-free-media",
				freeItemClass: "jp-playlist-item-free",
				removeItemClass: "jp-playlist-item-remove",
                favItemClass: "jp-playlist-item-fav"
			}
		},
		option: function(option, value) { // For changing playlist options only
			if(value === undefined) {
				return this.options.playlistOptions[option];
			}

			this.options.playlistOptions[option] = value;

			switch(option) {
				case "enableRemoveControls":
					this._updateControls();
					break;
				case "itemClass":
				case "freeGroupClass":
				case "freeItemClass":
				case "removeItemClass":
				case "favItemClass":
					this._refresh(true); // Instant
					this._createItemHandlers();
					break;
			}
			return this;
		},
		_init: function() {
			var self = this;
			this._refresh(function() {
				if(self.options.playlistOptions.autoPlay) {
					self.play(self.current, true);
				} else {
					self.select(self.current, true);
				}
			});
		},
		_initPlaylist: function(playlist) {
			this.current = 0;
			this.shuffled = false;
			this.removing = false;
			this.playlist = $.extend(true, [], playlist);
		},
		_refresh: function(instant) {
			/* instant: Can be undefined, true or a function.
			 *	undefined -> use animation timings
			 *	true -> no animation
			 *	function -> use animation timings and excute function at half way point.
			 */
			var self = this;

			if(instant && !$.isFunction(instant)) {
				$(this.cssSelector.playlist + " ul").empty();
				$.each(this.playlist, function(i) {
					$(self.cssSelector.playlist + " ul").append(self._createListItem(self.playlist[i]));
				});
				this._updateControls();
			} else {
				var displayTime = $(this.cssSelector.playlist + " ul").children().length ? this.options.playlistOptions.displayTime : 0;

				$(this.cssSelector.playlist + " ul").slideUp(displayTime, function() {
					var $this = $(this);
					$(this).empty();
					
					$.each(self.playlist, function(i) {
						$this.append(self._createListItem(self.playlist[i]));
					});
					self._updateControls();
					if($.isFunction(instant)) {
						instant();
					}
					if(self.playlist.length) {
						$(this).slideDown(self.options.playlistOptions.displayTime);
					} else {
						$(this).show();
					}
				});
			}
		},
		_createListItem: function(media) {
			var self = this;

			// Wrap the <li> contents in a <div>
			var listItem = "<li><div>";

			// Create remove control
			listItem += "<a href='javascript:;' class='" + this.options.playlistOptions.removeItemClass + "'>&times;</a>";

            // Add favourite control
            listItem += "<a href='javascript:;' class='" + this.options.playlistOptions.favItemClass + "'>&hearts;</a>";

			// Create links to free media
			if(media.free) {
				var first = true;
				listItem += "<span class='" + this.options.playlistOptions.freeGroupClass + "'>(";
				$.each(media, function(property,value) {
					if($.jPlayer.prototype.format[property]) { // Check property is a media format.
						if(first) {
							first = false;
						} else {
							listItem += " | ";
						}
						listItem += "<a class='" + self.options.playlistOptions.freeItemClass + "' href='" + value + "' tabindex='1'>" + property + "</a>";
					}
				});
				listItem += ")</span>";
			}

			// The title is given next in the HTML otherwise the float:right on the free media corrupts in IE6/7
			listItem += "<a href='javascript:;' class='" + this.options.playlistOptions.itemClass + "' tabindex='1'>" + media.title + (media.artist ? " <span class='jp-artist'>by " + media.artist + "</span>" : "") + "</a>";
			listItem += "</div></li>";

			return listItem;
		},
		_createItemHandlers: function() {
			var self = this;
			// Create live handlers for the playlist items
			$(this.cssSelector.playlist).off("click", "a." + this.options.playlistOptions.itemClass).on("click", "a." + this.options.playlistOptions.itemClass, function() {
				var index = $(this).parent().parent().index();
				if(self.current !== index) {
					self.play(index);
				} else {
					$(self.cssSelector.jPlayer).jPlayer("play");
				}
				$(this).blur();
				return false;
			});

			// Create live handlers that disable free media links to force access via right click
			$(this.cssSelector.playlist).off("click", "a." + this.options.playlistOptions.freeItemClass).on("click", "a." + this.options.playlistOptions.freeItemClass, function() {
				$(this).parent().parent().find("." + self.options.playlistOptions.itemClass).click();
				$(this).blur();
				return false;
			});

			// Create live handlers for the remove controls
			$(this.cssSelector.playlist).off("click", "a." + this.options.playlistOptions.removeItemClass).on("click", "a." + this.options.playlistOptions.removeItemClass, function() {
				var index = $(this).parent().parent().index();
				self.remove(index);
				$(this).blur();
				return false;
			});
		},
		_updateControls: function() {
			if(this.options.playlistOptions.enableRemoveControls) {
				$(this.cssSelector.playlist + " ." + this.options.playlistOptions.removeItemClass).show();
			} else {
				$(this.cssSelector.playlist + " ." + this.options.playlistOptions.removeItemClass).hide();
			}
			if(this.shuffled) {
				$(this.cssSelector.shuffleOff).show();
				$(this.cssSelector.shuffle).hide();
			} else {
				$(this.cssSelector.shuffleOff).hide();
				$(this.cssSelector.shuffle).show();
			}
		},
		_highlight: function(index) {
			if(this.playlist.length && index !== undefined) {
				$(this.cssSelector.playlist + " .jp-playlist-current").removeClass("jp-playlist-current");
				$(this.cssSelector.playlist + " li:nth-child(" + (index + 1) + ")").addClass("jp-playlist-current").find(".jp-playlist-item").addClass("jp-playlist-current");
				$(this.cssSelector.title + " li").html(this.playlist[index].title + (this.playlist[index].artist ? " <span class='jp-artist'>by " + this.playlist[index].artist + "</span>" : ""));
			}
		},
		_shuffledIndex: function(index) {
		    if(this.shuffled) {
		        return this.shuffledIndices[index];
		    }
		    return index;
        },
		setPlaylist: function(playlist) {
			this._initPlaylist(playlist);
			this._init();
		},
		add: function(media, playNow) {
			$(this.cssSelector.playlist + " ul").append(this._createListItem(media)).find("li:last-child").hide().slideDown(this.options.playlistOptions.addTime);
			this._updateControls();
			this.playlist.push(media); // Both array elements share the same object pointer. Comforms with _initPlaylist(p) system.

			if(playNow) {
				this.play(this.playlist.length - 1);
			} else {
				if(this.playlist.length === 1) {
					this.select(0);
				}
			}
		},
		remove: function(index) {
			var self = this;

			if(index === undefined) {
				this._initPlaylist([]);
				this._refresh(function() {
					$(self.cssSelector.jPlayer).jPlayer("clearMedia");
				});
				return true;
			} else {

				if(this.removing) {
					return false;
				} else {
					index = (index < 0) ? self.playlist.length + index : index; // Negative index relates to end of array.
					if(0 <= index && index < this.playlist.length) {
						this.removing = true;

						$(this.cssSelector.playlist + " li:nth-child(" + (index + 1) + ")").slideUp(this.options.playlistOptions.removeTime, function() {
							$(this).remove();

							if(self.shuffled) {
								var item = self.playlist[index];
								self.playlist.splice(index, 1);
							} else {
								self.playlist.splice(index, 1);
							}

							if(self.playlist.length) {
								if(index === self.current) {
									self.current = (index < self.playlist.length) ? self.current : self.playlist.length - 1; // To cope when last element being selected when it was removed
									self.select(self.current);
								} else if(index < self.current) {
									self.current--;
								}
							} else {
								$(self.cssSelector.jPlayer).jPlayer("clearMedia");
								self.current = 0;
								self.shuffled = false;
								self._updateControls();
							}

							self.removing = false;
						});
					}
					return true;
				}
			}
		},
		select: function(index, shuffleSelect) {
			index = (index < 0) ? this.playlist.length + index : index; // Negative index relates to end of array.
			var shuffledIndex = shuffleSelect ? this._shuffledIndex(index) : index;

			// we clicked one manually and we are shuffled => put it in the shuffle queue in this position.
			if(!shuffleSelect && this.shuffled) {
                var temp = this.shuffledIndices[this.current+1];
                var self = this;
                // swap out what would've been here
                $.each(this.shuffledIndices, function(i) {
                    if (self.shuffledIndices[i] === index) {
                        self.shuffledIndices[i] = temp;
                        return false;
                    }
                });
                this.shuffledIndices[this.current+1] = index;
                // since we're shuffled we want to use the next index in the shuffle queue
                // which now maps to the song we just manually clicked
                index = this.current+1;
            }
			if(0 <= index && index < this.playlist.length) {
				this.current = index;
				this._highlight(shuffledIndex);
				$(this.cssSelector.jPlayer).jPlayer("setMedia", this.playlist[shuffledIndex]);
			} else {
				this.current = 0;
			}
            $('html,body').animate({
                scrollTop: $(this.cssSelector.playlist + " li:nth-child(" + (shuffledIndex + 1) + ")").offset().top - 
                    $('.jp-playlist').offset().top
            }, 1000);
		},
		play: function(index, shuffleSelect) {
			index = (index < 0) ? this.playlist.length + index : index; // Negative index relates to end of array.
			if(0 <= index && index < this.playlist.length) {
				if(this.playlist.length) {
					this.select(index, shuffleSelect);
					$(this.cssSelector.jPlayer).jPlayer("play");
				}
			} else if(index === undefined) {
				$(this.cssSelector.jPlayer).jPlayer("play");
			}
		},
		pause: function() {
			$(this.cssSelector.jPlayer).jPlayer("pause");
		},
		next: function() {
			var index = (this.current + 1 < this.playlist.length) ? this.current + 1 : 0;

			if(this.loop) {
                this.play(this.current);
			} else {
				// The index will be zero if it just looped round
				if(index > 0) {
					this.play(index, true);
				}
			}
		},
		previous: function() {
			var index = (this.current - 1 >= 0) ? this.current - 1 : this.playlist.length - 1;

			if(this.loop && this.options.playlistOptions.loopOnPrevious || index < this.playlist.length - 1) {
				this.play(index, true);
			}
		},
		shuffle: function(shuffled, playNow) {
			var self = this;

			if(shuffled === undefined) {
				shuffled = !this.shuffled;
			}

			if(shuffled || shuffled !== this.shuffled) {
                self.shuffled = shuffled;
                
                var index = 0;

                if(self.shuffled) {
                    // Do the Fisher-Yates shuffle!
                    var i = 0;
                    for (; i < self.playlist.length; ++i) {
                        self.shuffledIndices[i] = i;
                    }
                    for (var j = i - 1; j > 0; --j) {
                        var r = Math.floor(Math.random()*(j+1)); // 0 <= r <= i
                        var temp = self.shuffledIndices[r];
                        self.shuffledIndices[r] = self.shuffledIndices[j];
                        self.shuffledIndices[j] = temp;
                    }

                    if(playNow || !$(self.cssSelector.jPlayer).data("jPlayer").status.paused) {
                        self.play(0, true);
                    } else {
                        self.select(0, true);
                    }
                } else {
                    self.current = self._shuffledIndex(self.current);
                }
                self._updateControls();
			}
		}
	};
})(jQuery);
