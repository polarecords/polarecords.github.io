#!/usr/bin/env python3
"""Add new @thejohnpolar uploads to database.json from the channel's public RSS feed.

Existing entries (and their artist tags) are left alone; only unseen video IDs are
added. Titles mentioning "freestyle" are tagged PolarAF, everything else John Polar.
The feed only lists the latest 15 uploads, so run it regularly (the GitHub Action
does this weekly).
"""
import json, re, sys, urllib.request
from pathlib import Path

CHANNEL_ID = 'UC_1_DnmZ-2uQdvtQQ48jnJQ'  # youtube.com/@thejohnpolar
DB = Path(__file__).resolve().parent.parent / 'database.json'


def fetch_feed():
    url = f'https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}'
    with urllib.request.urlopen(url, timeout=30) as r:
        xml = r.read().decode()
    for entry in re.findall(r'<entry>(.*?)</entry>', xml, re.S):
        vid = re.search(r'<yt:videoId>(.*?)</yt:videoId>', entry).group(1)
        title = re.search(r'<title>(.*?)</title>', entry).group(1)
        title = title.replace('&amp;', '&').replace('&quot;', '"').replace('&#39;', "'")
        date = re.search(r'<published>(.*?)</published>', entry).group(1)[:10]
        yield {'id': vid, 'date': date, 'title': title,
               'artists': ['polaraf'] if 'freestyle' in title.lower() else ['john']}


def main():
    data = json.loads(DB.read_text())
    known = {v['id'] for v in data.get('videos', [])}
    new = [v for v in fetch_feed() if v['id'] not in known]
    if not new:
        print('No new uploads.')
        return 0
    data['videos'] = sorted(data.get('videos', []) + new, key=lambda v: v['date'], reverse=True)
    DB.write_text(json.dumps(data, indent=4, ensure_ascii=False) + '\n')
    for v in new:
        print(f"Added {v['date']} {v['title']}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
