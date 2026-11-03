"""Only approved public content is snapshotted; failure never changes data.js."""
import json, os, pathlib, urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[1]
def parse_source(text):
 return json.loads(text.removeprefix('\ufeff').split('=',1)[1].strip().removesuffix(';'))
def validate(rows,old):
 if not isinstance(rows,list) or len(rows)!=len(old):raise ValueError('Article count mismatch')
 by_id={x['id']:x for x in old}
 if len({x['id'] for x in rows})!=len(old):raise ValueError('Duplicate IDs')
 for x in rows:
  prior=by_id[x['id']]
  if type(x.get('_version')) is not int or x['_version']<prior.get('_version',0):raise ValueError('Missing or older version')
  if x.get('pages')!=prior['pages']:raise ValueError('Original scans changed')
  if x.get('grade') not in (1,2,3):raise ValueError('Invalid grade')
  for key in ('chapter','number','summary','text','explanation'):
   if not isinstance(x.get(key),str) or not x[key].strip():raise ValueError('Invalid text')
 return sorted(rows,key=lambda x:list(by_id).index(x['id']))
def main():
 target=ROOT/'data.js';old=parse_source(target.read_text(encoding='utf8'));changed=False
 try:
  request=urllib.request.Request('https://shanghan-api.xilidada123-shanghan.workers.dev/data',headers={'Cache-Control':'no-cache','User-Agent':'Shanghan-Approved-Snapshot/1.0','Accept':'application/json'})
  with urllib.request.urlopen(request,timeout=25) as response:
   payload=response.read(2000001)
  if len(payload)>2000000:raise ValueError('Oversized snapshot')
  rows=validate(json.loads(payload)['articles'],old)
  if rows!=old:
   tmp=target.with_suffix('.js.tmp');tmp.write_text('window.ARTICLES = '+json.dumps(rows,ensure_ascii=False,indent=2)+';\n',encoding='utf8');tmp.replace(target);changed=True
  print('Approved snapshot updated' if changed else 'Approved snapshot unchanged')
 except Exception as error:print('Retaining existing static snapshot:',type(error).__name__,str(error))
 if os.environ.get('GITHUB_OUTPUT'):
  with open(os.environ['GITHUB_OUTPUT'],'a') as f:f.write('changed='+str(changed).lower()+'\n')
 return changed
if __name__=='__main__':main()
