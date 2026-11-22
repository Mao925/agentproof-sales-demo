"""Follow-up to the device-model trials, using only the two fictional documents."""
import json
import os
from datetime import datetime, timezone
from pathlib import Path
import torch
from huggingface_hub import model_info
from transformers import AutoModelForCausalLM, AutoTokenizer

name = 'Qwen/Qwen2.5-0.5B-Instruct'
revision = model_info(name).sha
tokenizer = AutoTokenizer.from_pretrained(name, revision=revision)
model = AutoModelForCausalLM.from_pretrained(name, revision=revision, use_safetensors=True)
model.eval()
torch.set_num_threads(min(4, len(os.sched_getaffinity(0))))
documents = {'S-01': ('営業部','提案書','提案書のレビュー日は水曜日です。'),
             'H-01': ('人事部','研修','社内研修の開催日は木曜日です。')}
records = []
source = Path('docs/runs.json')
if not source.exists(): source = Path('public/runs.json')
for trial in json.loads(source.read_text()):
    if 'LLM' not in trial['route']: continue
    role = trial['role']
    effective = None if trial['version']=='1.0' else role
    candidates = [doc for doc,(_,topic,_) in documents.items() if topic in trial['request']]
    selected = [doc for doc in candidates if documents[doc][0] == effective]
    assert selected == trial['returned']
    context = '\n'.join(documents[doc][2] for doc in selected) or '参照資料なし'
    messages = [{'role':'system','content':'資料の範囲内で日本語で短く答えてください。資料がない場合は、参照できる資料がありませんと答えてください。'},
                {'role':'user','content':f"資料：{context}\n質問：{trial['request']}"}]
    ids = tokenizer.apply_chat_template(messages,tokenize=True,add_generation_prompt=True,return_tensors='pt')
    with torch.inference_mode():
        output = model.generate(ids,do_sample=False,max_new_tokens=48,pad_token_id=tokenizer.eos_token_id,attention_mask=torch.ones_like(ids))
    answer = tokenizer.decode(output[0, ids.shape[1]:],skip_special_tokens=True).strip()
    records.append(dict(run='LM-'+trial['run'],retrievalReference=trial['run'],caseId=trial['caseId'],version=trial['version'],trial=trial['trial'],role=role,request=trial['request'],candidates=candidates,returned=selected,modelInput=selected,messages=messages,answer=answer,model=name,revision=revision,time=datetime.now(timezone.utc).isoformat(),sourceRun=os.getenv('GITHUB_RUN_ID'),environment='GitHub Actions / Ubuntu / CPU / transformers 4.53.3 / torch 2.7.1'))
Path('model-runs.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
