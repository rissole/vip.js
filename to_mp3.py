import xml.etree.ElementTree as ET
import urllib.request, urllib.parse, urllib.error
import json
import re
import os, subprocess, sys

downloaded_album_art = {}
M4A_FOLDER = 'm4a/'
IMG_FOLDER = 'img/'
MP3_FOLDER = 'mp3/'
FFMPEG_PATH = 'ffmpeg/bin/ffmpeg.exe'

def initialise_album_cache():
    for file in os.listdir(IMG_FOLDER):
        downloaded_album_art[file] = True

def download_art_for_game(game_name, *ignored_urls):
    image_name = re.sub(r'\W', '', game_name)+'.png'
    if downloaded_album_art.get(image_name) == True:
        return image_name

    q = urllib.parse.quote('"%s" soundtrack' % (game_name,))
    with urllib.request.urlopen("http://ajax.googleapis.com/ajax/services/search/images?v=1.0&rsz=6&q="+q) as response:
        images = json.loads(response.readall().decode('utf-8'))['responseData']['results']
        images = list(filter(lambda i: i['unescapedUrl'] not in ignored_urls, images))

    for ratio_tolerance in [x * 0.1 for x in range(1, 5)]:
        best_image = next((i for i in images if abs(int(i['width']) / int(i['height']) - 1) < ratio_tolerance), None)
        if best_image != None:
            break

    if best_image == None:
        print('[IMG] Couldn\'t find image for', game_name, file=sys.stderr)
        return IMG_FOLDER+'_unknown.png'

    image_url = best_image['unescapedUrl']
    try:
        urllib.request.urlretrieve(image_url, IMG_FOLDER+image_name)
    except urllib.error.URLError:
        return download_art_for_game(game_name, *(list(ignored_urls) + [image_url]))

    downloaded_album_art[image_name] = True
    print('[IMG] Retrieved album art for', game_name)

    return image_name

def make_mp3(song_name, game_name, m4a_filename, image_filename):
    mp3_path = MP3_FOLDER + m4a_filename[:-3] + 'mp3'
    if os.path.exists(mp3_path):
        return False
    subprocess.Popen([
        FFMPEG_PATH, '-y', '-loglevel', 'error'
        '-i', M4A_FOLDER + m4a_filename,
        '-i', IMG_FOLDER + image_filename,
        '-map', '0', '-map', '1', '-id3v2_version', '3',
        '-metadata', 'title=%s' % (song_name,),
        '-metadata', 'album=%s' % (game_name,),
        mp3_path
    ]).wait()
    return True

if __name__ == "__main__":
    initialise_album_cache()

    e = ET.parse('roster.xml').getroot()
    ns = {'pl':'http://xspf.org/ns/0/'}

    for track in e[0]:
        creator = track.find('pl:creator', ns).text
        title = track.find('pl:title', ns).text
        location = track.find('pl:location', ns).text
        image_filename = download_art_for_game(creator)
        make_mp3(title, creator, location.split('/')[-1], image_filename)