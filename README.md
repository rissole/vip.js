### See it in action! http://rissole.github.io/vip.js
# vip.js
An implementation of [vip.swf](http://vip.aersia.net/vip.swf) in Javascript using [JPlayer](http://www.jplayer.org/). This allows vip to be enjoyed on mobile devices.

The skin used is [Midnight Black](https://github.com/TheInfection/Midnight-Black), specifically [the responsive version](http://www.mediafire.com/?axx792ad525dvp5) the author made, which is absolutely fantastic.

# Notes
This is not much more than a JPlayer playlist populated with song data from vip's [roster.xml](http://vip.aersia.net/roster.xml). Extra things I've done are:

* The styling in index.html to make the controls fixed position.
* Changed the shuffling behaviour of JPlayer playlist extension to match vip.swf's.
* Added a Favourites system.

# Album art
A whole bunch of album art was obtained for these songs for your use! They can be downloaded from [Dropbox](https://www.dropbox.com/sh/2dzhh325gq02wbv/AAAcyr3HK1OFgEkEiObzRPKga?dl=0).

These album art images were downloaded programmatically (see to_mp3.py) and are not 100% correct, but they should be good start. The program just Googled for `"<game name>" soundtrack` and looked for relevant and square images.