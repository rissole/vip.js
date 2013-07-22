# vip.js
An implementation of [vip.swf](http://vip.aersia.net/vip.swf) in Javascript using [JPlayer](http://www.jplayer.org/). This allows vip to be enjoyed on mobile devices.

The skin used is [Midnight Black](https://github.com/TheInfection/Midnight-Black), specifically [the responsive version](http://www.mediafire.com/?axx792ad525dvp5) the author made, which is absolutely fantastic.

# Notes
This is not much more than a JPlayer playlist populated with song data from vip's [roster.xml](http://vip.aersia.net/roster.xml). Extra things I've done are:

* The styling in vip.htm to make the controls fixed position.
* Some changes in roster.xml, namely replacing "&" with "&amp;" to make it well-formed.

Additionally, the vip audio files are *m4a format* which *do not play on Firefox.* It should work on mobile devices though.