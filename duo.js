let C;
const D={members:[],tasks:[],requests:[],messages:[],notifications:[],entries:[],reveals:[],progress:[]};
export function duoInit(ctx){C=ctx;}
export function duoClear(){Object.keys(D).forEach(k=>D[k]=[]);}
export function duoUnread(){return D.notifications.filter(x=>!x.read_at).length;}
export async function duoLoad(){
 if(!C?.state.owner)return;
 const s=C.supabase;
 const jobs=[s.rpc("get_pair_members"),s.from("collab_tasks").select("*").order("created_at",{ascending:false}),
 s.from("pair_requests").select("*").order("created_at",{ascending:false}),s.from("pair_messages").select("*").order("created_at",{ascending:true}).limit(200),
 s.from("pair_notifications").select("*").order("created_at",{ascending:false}).limit(100),
 s.from("memory_entries").select("storage_path,title,message"),s.rpc("get_memory_reveals"),s.rpc("get_memory_progress")];
 const results=await Promise.allSettled(jobs);
 Object.keys(D).forEach((k,i)=>{if(results[i].status==="fulfilled"&&!results[i].value.error)D[k]=results[i].value.data||[];});
}
const esc=v=>C.esc(v??"");
const kittu=()=>C.state.role==="kittu";
const partner=()=>D.members.find(m=>m.role!==C.state.role);
const own=p=>D.entries.find(x=>x.storage_path===p);
const unlocked=p=>D.reveals.find(x=>x.storage_path===p);
const progress=p=>D.progress.find(x=>x.storage_path===p);
const date=t=>new Date(t).toLocaleDateString("en-IN",{day:"numeric",month:"short"});
const heading=(small,big,subtitle)=>`<header class="duo-heading"><span class="eyebrow">${small}</span><h1>${big}</h1><p>${subtitle}</p></header>`;
const empty=v=>`<div class="duo-empty">♡ <span>${v}</span></div>`;
const refresh='<button class="duo-text-button" data-duo-action="refresh">↻ Refresh</button>';
const thumb=(path,i)=>{const p=C.state.photos.find(x=>x.storage_path===path);return p&&!/\.mp4$/i.test(path)?`<img loading="lazy" src="${esc(C.state.photoUrls[p.id]||"")}" alt="Memory ${i+1}">`:'<span class="duo-video-thumb">▶</span>';};
export function duoView(v){
 const kt=kittu();
 if(v==="dashboard")return `<section class="duo-center">${heading("OUR LITTLE SPACE","Hi, Kittu. ♡","Your corner for everything you do with Subbu.")}
 <div class="duo-stats">${[["tasks",D.tasks.filter(x=>x.status==="open").length,"Open tasks"],["requests",D.requests.filter(x=>x.status==="new").length,"New requests"],["notifications",duoUnread(),"Notifications"]].map(([a,n,label])=>`<button data-action="view" data-view="${a}"><strong>${n}</strong>${label} ↗</button>`).join("")}</div>
 <div class="duo-simple-links"><button data-action="view" data-view="tasks">✎ Assign a little task to Subbu</button><button data-action="view" data-view="requests">♡ Read Subbu's requests</button><button data-action="view" data-view="messages">✉ Leave a message</button></div></section>`;
 if(v==="tasks"){
  const maker=kt?`<div class="duo-panel"><h2>Assign Subbu a task ♡</h2>
    <form data-duo-form="task"><label class="form-label">Task title</label><input class="field" name="title" maxlength="150" required placeholder="Give these photos a title and write your message">
    <label class="form-label">What should she do?</label><textarea class="field" rows="3" maxlength="2000" name="instructions" placeholder="Write a thoughtful little instruction..."></textarea>
    <div class="duo-form-row"><strong>Choose memories</strong><button type="button" class="duo-text-button" data-duo-action="all">Select all</button></div>
    <div class="duo-pick-list">${C.state.photos.map((p,i)=>`<label><input type="checkbox" name="media" value="${esc(p.storage_path)}">${thumb(p.storage_path,i)}<small>Memory ${i+1}</small></label>`).join("")}</div>
    <button class="button button-dark" type="submit">Assign to Subbu ♡</button></form></div>`:"";
  return `<section class="duo-center">${heading("TASK CENTER",kt?"Little missions for Subbu.":"Your little missions. ♡",kt?"Assign tasks and choose memories for Subbu to write about.":"Kittu's tasks and your progress live here.")}
  ${refresh}${maker}<h2 class="duo-list-heading">${kt?"Tasks you assigned":"Assigned by Kittu"}</h2>
  ${D.tasks.map(t=>{
    const paths=t.media_paths||[],written=paths.filter(p=>own(p)?.message).length;
    return `<article class="duo-panel"><div class="duo-task-meta"><span class="duo-pill">${t.status==="done"?"Completed":"Open"}</span><small>${date(t.created_at)}</small></div><h3>${esc(t.title)}</h3><p>${esc(t.instructions)}</p>
      ${paths.length?`<p class="duo-hint">${kt?paths.filter(p=>unlocked(p)).length:written} of ${paths.length} memories ${kt?"unlocked":"written"}</p>
      <div class="duo-task-images">${paths.map((p,i)=>`<button type="button" data-duo-action="memory" data-path="${esc(p)}">${thumb(p,i)}<span>${unlocked(p)?"♡ Open":own(p)?"✓ Saved":"✎ Write"}</span></button>`).join("")}</div>`:""}
      ${!kt&&t.status==="open"?`<button class="button button-outline" data-duo-action="finish" data-id="${t.id}" ${paths.length&&written!==paths.length?"disabled":""}>Mark complete ✓</button>`:""}
      ${kt&&t.status==="open"?`<button class="duo-text-button" data-duo-action="close-task" data-id="${t.id}">Close task</button>`:""}
    </article>`;
  }).join("")||empty("No tasks yet.")}</section>`;
 }
 if(v==="requests")return `<section class="duo-center">${heading("REQUEST CENTER",kt?"Requests from Subbu.":"Request Kittu ♡","A little place for things you need from each other.")}
 ${refresh}${kt?"":`<div class="duo-panel"><form data-duo-form="request"><label class="form-label">What would you like?</label>
 <input class="field" name="title" maxlength="150" required placeholder="Could you help me with...">
 <label class="form-label">More details</label><textarea class="field" rows="3" maxlength="4000" name="details" required></textarea>
 <button class="button button-dark" type="submit">Send to Kittu ♡</button></form></div>`}
 <h2 class="duo-list-heading">${kt?"Received requests":"Your requests"}</h2>
 ${D.requests.map(r=>`<article class="duo-panel"><div class="duo-task-meta"><span class="duo-pill">${esc(r.status)}</span><small>${date(r.created_at)}</small></div>
 <h3>${esc(r.title)}</h3><p>${esc(r.details)}</p>
 ${kt?`<form data-duo-form="reply" data-id="${r.id}"><label class="form-label">Your response</label>
 <textarea class="field" name="response" rows="3" maxlength="4000">${esc(r.response)}</textarea>
 <div class="duo-form-row"><select name="status" class="field">${["new","accepted","done","declined"].map(x=>`<option value="${x}" ${r.status===x?"selected":""}>${x}</option>`).join("")}</select>
 <button class="button button-dark" type="submit">Save response</button></div></form>`:r.response?`<div class="duo-reply"><strong>Kittu replied</strong><p>${esc(r.response)}</p></div>`:'<p class="duo-hint">Waiting for Kittu ♡</p>'}
 </article>`).join("")||empty("No requests yet.")}</section>`;
 if(v==="messages")return `<section class="duo-center">${heading("MESSAGE CENTER","Just the two of you. ♡","Private messages between Kittu and Subbu.")}${refresh}
 <div class="duo-panel duo-message-room"><div class="duo-thread">${D.messages.map(m=>`<div class="duo-message ${m.from_user===C.state.session.user.id?"mine":"other"}"><strong>${m.from_user===C.state.session.user.id?(kt?"Kittu":"Subbu"):(kt?"Subbu":"Kittu")}</strong><p>${esc(m.body)}</p><small>${date(m.created_at)}</small></div>`).join("")||empty("Say hello first. ♡")}</div>
 <form data-duo-form="message"><label class="form-label">Your message</label><textarea class="field" name="body" maxlength="4000" rows="2" required placeholder="Write a little message..."></textarea>
 <button class="button button-dark" type="submit">Send ♡</button></form></div></section>`;
 if(v==="notifications")return `<section class="duo-center">${heading("NOTIFICATION CENTER","Your little updates. ♡","A separate notification center for you.")}<div class="duo-form-row">${refresh}<button class="duo-text-button" data-duo-action="read-all">Mark all read</button></div>
 ${D.notifications.map(n=>`<button type="button" class="duo-notification ${n.read_at?"read":""}" data-duo-action="notice" data-id="${n.id}" data-section="${esc(n.section)}"><span>${n.read_at?"○":"●"}</span><span><b>${esc(n.heading)}</b><small>${esc(n.detail)}</small><em>${date(n.created_at)}</em></span><span>↗</span></button>`).join("")||empty("All caught up. ♡")}</section>`;
 if(v==="more")return `<section class="duo-center">${heading("YOUR SPACE","More little corners. ♡","Everything else is one tap away.")}<div class="duo-more">
 ${[["gallery","Memories","▧"],["songs","Our songs","♫"],["notes","Notes","✎"],["activities","Daily rituals","☼"],["birthday","Birthday letter","♡"]].map(([v,name,icon])=>`<button data-action="view" data-view="${v}"><span>${icon}</span>${name} ↗</button>`).join("")}</div>
 <button class="duo-text-button" data-action="signout">Sign out</button></section>`;
 return "";
}
export async function duoOpen(path){
 const p=C.state.photos.find(x=>x.storage_path===path);if(!p)return;
 const url=C.state.photoUrls[p.id]||"",isVideo=/\.mp4$/i.test(path),entry=own(path),pair=unlocked(path),state=progress(path);
 const media=isVideo?`<video class="modal-photo modal-video" controls playsinline src="${esc(url)}"></video>`:`<img class="modal-photo" src="${esc(url)}" alt="Private memory" data-private-media="${esc(path)}">`;
 const revealed=pair?`<div class="duo-unlocked"><h3>♡ Your messages are unlocked ♡</h3>
 <div class="duo-two-messages"><div><span>Subbu</span>${pair.subbu_title?`<h4>${esc(pair.subbu_title)}</h4>`:""}<p>${esc(pair.subbu_message)}</p></div>
 <div><span>Kittu</span>${pair.kittu_title?`<h4>${esc(pair.kittu_title)}</h4>`:""}<p>${esc(pair.kittu_message)}</p></div></div></div>`:
 `<div class="duo-locked"><b>✉ One moment, two messages</b><p>These words stay hidden until both of you have submitted your message.</p>
 <small>Subbu ${state?.subbu_done?"✓":"○"} · Kittu ${state?.kittu_done?"✓":"○"}</small></div>`;
 const assigned=D.tasks.find(t=>(t.media_paths||[]).includes(path));
 C.openModal(`<section class="duo-memory-editor"><span class="eyebrow">ONE MEMORY, TWO HEARTS</span><h2>Our little moment ♡</h2>
 ${media}${assigned?.instructions?`<p class="duo-task-prompt">${esc(assigned.instructions)}</p>`:""}${revealed}
 <form data-duo-form="memory" data-path="${esc(path)}"><h3>${entry?"Edit your half":"Write your half"} ✎</h3><label class="form-label">Give it a title (optional)</label>
 <input name="title" class="field" maxlength="160" placeholder="A title for this memory" value="${esc(entry?.title||"")}">
 <label class="form-label">Your message</label><textarea name="message" class="field" required maxlength="5000" rows="5" placeholder="What does this moment mean to you?">${esc(entry?.message||"")}</textarea>
 <button type="submit" class="button button-dark">${entry?"Update my words":"Seal my words ♡"}</button></form></section>`,true);
}
export async function duoClick(button){
 const a=button.dataset.duoAction,s=C.supabase;
 if(a==="memory"){await duoOpen(button.dataset.path);return;}
 if(a==="refresh"){await duoLoad();C.render();C.toast("Up to date ♡");return;}
 if(a==="all"){const xs=[...button.closest("form").querySelectorAll('input[name="media"]')],all=xs.some(x=>!x.checked);xs.forEach(x=>x.checked=all);button.textContent=all?"Clear all":"Select all";return;}
 if(a==="finish"){const {data,error}=await s.rpc("complete_assigned_task",{task_id:button.dataset.id});if(error)throw error;if(!data){C.toast("Write all your assigned messages first.");return;}}
 if(a==="close-task"){if(!kittu())return;const {error}=await s.from("collab_tasks").update({status:"done",updated_at:new Date().toISOString()}).eq("id",button.dataset.id);if(error)throw error;}
 if(a==="read-all"){const ids=D.notifications.filter(x=>!x.read_at).map(x=>x.id);if(ids.length){const {error}=await s.from("pair_notifications").update({read_at:new Date().toISOString()}).in("id",ids);if(error)throw error;}}
 if(a==="notice"){const n=D.notifications.find(x=>x.id===button.dataset.id);if(n&&!n.read_at)await s.from("pair_notifications").update({read_at:new Date().toISOString()}).eq("id",n.id);
 C.state.view=["tasks","requests","messages","gallery","home"].includes(button.dataset.section)?button.dataset.section:"notifications";}
 await duoLoad();C.render();
}
export async function duoSubmit(form,fd){
 const s=C.supabase,a=form.dataset.duoForm,p=partner(),me=C.state.session.user.id;
 if(a==="task"){if(!kittu()||!p)throw Error("Subbu must be linked before assigning.");
  const paths=fd.getAll("media").map(String);
  const {error}=await s.from("collab_tasks").insert({assigned_by:me,assigned_to:p.user_id,title:String(fd.get("title")||"").trim(),instructions:String(fd.get("instructions")||"").trim(),media_paths:paths,kind:paths.length?"memory":"general"});if(error)throw error;
 }else if(a==="request"){if(kittu()||!p)throw Error("Kittu is not connected yet.");
  const {error}=await s.from("pair_requests").insert({from_user:me,to_user:p.user_id,title:String(fd.get("title")||"").trim(),details:String(fd.get("details")||"").trim()});if(error)throw error;
 }else if(a==="reply"){if(!kittu())throw Error("Only Kittu can respond.");
  const {error}=await s.from("pair_requests").update({response:String(fd.get("response")||"").trim(),status:String(fd.get("status")||"new"),updated_at:new Date().toISOString()}).eq("id",form.dataset.id);if(error)throw error;
 }else if(a==="message"){if(!p)throw Error("The other user is not connected yet.");
  const {error}=await s.from("pair_messages").insert({from_user:me,to_user:p.user_id,body:String(fd.get("body")||"").trim()});if(error)throw error;
 }else if(a==="memory"){const path=form.dataset.path;if(!C.state.photos.some(x=>x.storage_path===path))throw Error("Memory not found.");
  const text=String(fd.get("message")||"").trim();if(!text)throw Error("Please write a message.");
  const {error}=await s.from("memory_entries").upsert({storage_path:path,author_id:me,title:String(fd.get("title")||"").trim(),message:text,updated_at:new Date().toISOString()},{onConflict:"storage_path,author_id"});if(error)throw error;
  await duoLoad();await duoOpen(path);C.toast("Your half is saved ♡");return;
 }
 await duoLoad();C.render();C.toast("Saved ♡");
}
