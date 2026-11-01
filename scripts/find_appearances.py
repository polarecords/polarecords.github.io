#!/usr/bin/env python3
"""Find likely open-mic / songwriter-night appearances from media on this phone.

Reads capture time (and GPS when present) from photos, videos and voice
recordings with exiftool, then flags anything captured on a show night at a
known venue, or near one. Results are written OUTSIDE the repo (default
~/polar-private/) because they contain personal location data. Nothing here is
published; the output is for cross-checking dates before adding them to
database.json by hand.

Call-recording folders are never scanned.

Usage: python3 scripts/find_appearances.py [--out DIR] [--timeline Timeline.json] [--calendar] [--texts]
"""
import argparse, json, math, os, re, subprocess, sys
from collections import defaultdict
from datetime import datetime, timedelta, timezone

SCAN_DIRS = [
    '/sdcard/DCIM/Camera', '/sdcard/DCIM/Snapchat', '/sdcard/DCIM/Restored',
    '/sdcard/Movies', '/sdcard/Recordings/Voice Recorder', '/sdcard/Recordings/Sounds',
]

# Recurring nights. weekday: Mon=0. A "night" runs 6 PM to 3 AM next day.
VENUES = {
    'The Nick':      {'lat': 33.50539, 'lon': -86.79059, 'nights': {0: 'Birmingham Bandstand (open mic)', 1: 'Songwriter Nights'}},
    'True Story':    {'lat': 33.52831, 'lon': -86.74827, 'nights': {3: 'True Story Songwriter Nights (2nd Thursday)'}},
    "Dave's Pub":    {'lat': 33.50101, 'lon': -86.79668, 'nights': {1: "Birmingham Songwriter's Night at Dave's Pub"}},
    "Dobber's":      {'lat': 33.49937, 'lon': -86.79576, 'nights': {1: "Dobber's Five Points Pub open mic"}},
    'Voodoo Lounge': {'lat': 34.72960, 'lon': -86.58502, 'nights': {3: 'Voodoo Lounge open mic (Huntsville)'}},
}
CALENDAR_WORDS = re.compile(r'open mic|songwriter|bandstand|perform|jam|gig', re.I)
DAY_CODES = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
NEAR_METERS = 250
# Words in a recording's filename that point at a show.
SHOW_WORDS = re.compile(r"\b(nick|gig|open ?mic|bandstand|songwriter'?s?|true story|dave'?s|jam|set|live)\b")


def to_central(dt_utc):
    """UTC -> US Central wall time (CDT from 2nd Sun of March to 1st Sun of Nov)."""
    y = dt_utc.year
    mar = datetime(y, 3, 8 + (6 - datetime(y, 3, 8).weekday()) % 7, 8)   # 2 AM CST = 08:00 UTC
    nov = datetime(y, 11, 1 + (6 - datetime(y, 11, 1).weekday()) % 7, 7)  # 2 AM CDT = 07:00 UTC
    naive = dt_utc.replace(tzinfo=None)
    return naive + timedelta(hours=-5 if mar <= naive < nov else -6)


def meters(a_lat, a_lon, b_lat, b_lon):
    r = 6371000
    p1, p2 = math.radians(a_lat), math.radians(b_lat)
    dp, dl = p2 - p1, math.radians(b_lon - a_lon)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def parse_time(rec):
    for key in ('DateTimeOriginal', 'CreateDate', 'MediaCreateDate', 'TrackCreateDate'):
        v = rec.get(key)
        if not v or str(v).startswith('0000'):
            continue
        v = str(v)
        try:
            dt = datetime.strptime(v[:19], '%Y:%m:%d %H:%M:%S')
        except ValueError:
            continue
        # QuickTime/MP4/M4A dates are UTC; EXIF photo dates are local.
        if key.startswith(('Media', 'Track')) or (key == 'CreateDate' and rec.get('FileType') in ('MP4', 'M4A', 'MOV', '3GP', '3G2')):
            dt = to_central(dt)
        return dt
    return None


def night_of(dt):
    """Evening date a capture belongs to (after-midnight captures count for the night before)."""
    if dt.hour < 3:
        return (dt - timedelta(days=1)).date()
    return dt.date() if dt.hour >= 18 else None


def scan():
    dirs = [d for d in SCAN_DIRS if os.path.isdir(d)]
    cmd = ['exiftool', '-j', '-n', '-q', '-q', '-r',
           '-DateTimeOriginal', '-CreateDate', '-MediaCreateDate', '-TrackCreateDate',
           '-GPSLatitude', '-GPSLongitude', '-GPSCoordinates', '-Duration', '-FileType', *dirs]
    out = subprocess.run(cmd, capture_output=True, text=True).stdout
    return json.loads(out or '[]')


def load_timeline(path):
    """Google Maps Timeline export (on-device, Settings > Location > Timeline > Export).
    Returns {date: [venue names visited]}."""
    visits = defaultdict(set)
    if not path:
        return visits
    data = json.load(open(path))
    segs = data.get('semanticSegments', data if isinstance(data, list) else [])
    for seg in segs:
        v = seg.get('visit', {}).get('topCandidate', {}).get('placeLocation', {}).get('latLng')
        start = seg.get('startTime')
        if not v or not start:
            continue
        lat, lon = (float(x.strip('°')) for x in v.split(','))
        dt = to_central(datetime.fromisoformat(start).astimezone(timezone.utc))
        n = night_of(dt)
        for name, venue in VENUES.items():
            if n and meters(lat, lon, venue['lat'], venue['lon']) < NEAR_METERS:
                visits[n].add(name)
    return visits


def load_calendar():
    """Calendar events that look like open mics/songwriter nights, via Shizuku (`rish`).
    Returns {date: [titles]}. Recurring events are expanded up to today (or UNTIL).
    These are plans, not proof, so they only add +1."""
    out = subprocess.run(['rish', '-c', 'content query --uri content://com.android.calendar/events '
                          '--projection title:dtstart:rrule:allDay'], capture_output=True, text=True, timeout=25).stdout
    nights = defaultdict(set)
    today = datetime.now().date()
    for line in out.splitlines():
        m = re.search(r'title=(.*?), dtstart=(\d+), rrule=(.*?), allDay=(\d)', line)
        if not m or not CALENDAR_WORDS.search(m.group(1)):
            continue
        title, ms, rrule, all_day = m.group(1), int(m.group(2)), m.group(3), m.group(4) == '1'
        start = datetime.fromtimestamp(ms / 1000, timezone.utc)
        first = start.date() if all_day else night_of(to_central(start)) or to_central(start).date()
        rule = dict(kv.split('=', 1) for kv in rrule.split(';') if '=' in kv) if rrule != 'NULL' else {}
        until = datetime.strptime(rule['UNTIL'][:8], '%Y%m%d').date() if 'UNTIL' in rule else today
        dates = [first]
        if rule.get('FREQ') == 'WEEKLY':
            step = timedelta(weeks=int(rule.get('INTERVAL', 1)))
            d = first
            while (d := d + step) <= min(until, today):
                dates.append(d)
        elif rule.get('FREQ') == 'MONTHLY' and re.fullmatch(r'\d[A-Z]{2}', rule.get('BYDAY', '')):
            nth, wd = int(rule['BYDAY'][0]), DAY_CODES.index(rule['BYDAY'][1:])
            y, mo = first.year, first.month
            while True:
                d0 = datetime(y, mo, 1).date()
                d = d0 + timedelta(days=(wd - d0.weekday()) % 7 + 7 * (nth - 1))
                if d > min(until, today):
                    break
                if d >= first:
                    dates.append(d)
                y, mo = (y + 1, 1) if mo == 12 else (y, mo + 1)
            dates = sorted(set(dates))
        for d in dates:
            nights[d].add(title)
    return nights


TEXT_VENUE = re.compile(r"\b(the nick|nick rocks|true story|dobber'?s?|dave'?s|voodoo|bandstand)\b", re.I)
TEXT_PLAY = re.compile(r"\b(perform(ed|ing)?|played|playing|my set|a set|on stage|signed up|gig|open ?mic|songwriter'?s?|bandstand)\b", re.I)


def rish_rows(uri, projection, where=None):
    cmd = f'content query --uri {uri} --projection {projection}' + (f' --where "{where}"' if where else '')
    out = subprocess.run(['rish', '-c', cmd], capture_output=True, text=True, timeout=40).stdout
    return [c for c in re.split(r'(?m)^Row: \d+ ', out) if c.strip()]


def load_texts():
    """Your own sent SMS/MMS that mention a venue and playing, bucketed by night.
    Only messages you sent count (msg type 2 / box 2). Returns {date: [snippets]}."""
    nights = defaultdict(list)

    def add(ms, body):
        if TEXT_VENUE.search(body) and TEXT_PLAY.search(body):
            local = to_central(datetime.fromtimestamp(ms / 1000, timezone.utc))
            d = (local - timedelta(days=1)).date() if local.hour < 4 else local.date()
            nights[d].append(re.sub(r'\s+', ' ', body)[:120])

    for c in rish_rows('content://sms', 'date:body', 'type=2'):
        m = re.match(r'date=(\d+), body=(.*)', c, re.S)
        if m:
            add(int(m.group(1)), m.group(2))
    sent_mms = {}
    for c in rish_rows('content://mms', '_id:date', 'msg_box=2'):
        m = re.match(r'_id=(\d+), date=(\d+)', c)
        if m:
            sent_mms[m.group(1)] = int(m.group(2)) * 1000
    for c in rish_rows('content://mms/part', 'mid:text', "ct='text/plain'"):
        m = re.match(r'mid=(\d+), text=(.*)', c, re.S)
        if m and m.group(1) in sent_mms:
            add(sent_mms[m.group(1)], m.group(2))
    return nights


def cached(name, loader, out_dir):
    """Run a Shizuku-backed loader; save its result, or reuse the last saved one if rish is down."""
    path = os.path.join(out_dir, f'{name}_cache.json')
    try:
        data = loader()
        if data:
            json.dump({k.isoformat(): sorted(v) if isinstance(v, set) else v for k, v in data.items()}, open(path, 'w'))
            return data
    except (subprocess.TimeoutExpired, OSError) as e:
        print(f'{name}: rish unavailable ({e.__class__.__name__}), using cache', file=sys.stderr)
    if os.path.exists(path):
        return {datetime.fromisoformat(k).date(): v for k, v in json.load(open(path)).items()}
    return {}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=os.path.expanduser('~/polar-private'))
    ap.add_argument('--timeline', help='Google Timeline JSON export')
    ap.add_argument('--calendar', action='store_true', help='also read calendar events through Shizuku (rish)')
    ap.add_argument('--texts', action='store_true', help='also read your sent SMS/MMS through Shizuku (rish)')
    args = ap.parse_args()

    records = scan()
    visits = load_timeline(args.timeline)
    os.makedirs(args.out, exist_ok=True)
    calendar = cached('calendar', load_calendar, args.out) if args.calendar else {}
    texts = cached('texts', load_texts, args.out) if args.texts else {}
    nights = defaultdict(lambda: {'files': [], 'gps_venues': set()})

    for rec in records:
        dt = parse_time(rec)
        if not dt:
            continue
        n = night_of(dt)
        if not n:
            continue
        lat, lon = rec.get('GPSLatitude'), rec.get('GPSLongitude')
        if lat is None and rec.get('GPSCoordinates'):
            try:
                lat, lon = (float(x) for x in str(rec['GPSCoordinates']).split()[:2])
            except ValueError:
                pass
        entry = nights[n]
        entry['files'].append({'path': rec['SourceFile'], 'time': dt.strftime('%H:%M'),
                               'kind': rec.get('FileType'), 'duration': rec.get('Duration')})
        if lat is not None:
            for name, venue in VENUES.items():
                if meters(float(lat), float(lon), venue['lat'], venue['lon']) < NEAR_METERS:
                    entry['gps_venues'].add(name)

    rows = []
    for n in sorted(set(nights) | set(visits) | set(texts) | {d for d in calendar if d in nights}):
        e = nights.get(n, {'files': [], 'gps_venues': set()})
        weekday_matches = [f'{name}: {v["nights"][n.weekday()]}' for name, v in VENUES.items() if n.weekday() in v['nights']]
        evidence = sorted(e['gps_venues'] | visits.get(n, set()))
        if not weekday_matches and not evidence:
            continue
        names = ' '.join(os.path.basename(f['path']).lower() for f in e['files'])
        audio = any(f['path'].lower().endswith('.m4a') for f in e['files'])
        named = bool(SHOW_WORDS.search(names))
        planned = sorted(calendar.get(n, ()))
        said = texts.get(n, [])
        score = (2 if evidence else 0) + (2 if named else 0) + (1 if weekday_matches else 0) + (1 if audio else 0) + (1 if planned else 0) + (2 if said else 0)
        rows.append({'date': n.isoformat(), 'weekday': n.strftime('%a'), 'score': score,
                     'location_evidence': evidence, 'named': named, 'calendar': planned, 'texts': said, 'show_night': weekday_matches, 'files': e['files']})

    os.makedirs(args.out, exist_ok=True)
    json.dump(rows, open(os.path.join(args.out, 'appearances.json'), 'w'), indent=1)
    with open(os.path.join(args.out, 'appearances.md'), 'w') as md:
        md.write('# Possible appearances (private)\n\nScore: +2 location at a venue, +2 filename mentions a show (nick, gig, open mic…), +1 show night, +1 voice recording that night, +1 on the calendar, +2 you texted about playing that night.\n\n')
        for r in sorted(rows, key=lambda r: r['date'], reverse=True):
            md.write(f"## {r['date']} ({r['weekday']}) score {r['score']}\n")
            if r['location_evidence']: md.write(f"- at: {', '.join(r['location_evidence'])}\n")
            for t in r['texts'][:3]: md.write(f"- you texted: {t}\n")
            if r['calendar']: md.write(f"- calendar: {'; '.join(r['calendar'])}\n")
            if r['show_night']: md.write(f"- show night: {'; '.join(r['show_night'])}\n")
            for f in r['files'][:12]:
                dur = f" {round(float(f['duration']))}s" if f.get('duration') else ''
                md.write(f"- {f['time']} {f['kind']}{dur}: {os.path.basename(f['path'])}\n")
            if len(r['files']) > 12: md.write(f"- … {len(r['files']) - 12} more\n")
            md.write('\n')
    print(f'{len(records)} files scanned, {len(rows)} candidate nights → {args.out}/appearances.md', file=sys.stderr)


if __name__ == '__main__':
    main()
