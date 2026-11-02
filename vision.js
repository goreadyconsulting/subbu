let V;
let items=[], imageUrls={}, view="board", results=[], selectedWeb=null, clearImage=false, currentEdit=null;
const esc=x=>V.esc(x??"");
const stages={dreaming:"Dreaming",in_progress:"In progress",achieved:"Achieved"};
export function visionInit(context){V=context;}
export function visionClear(){items=[];imageUrls={};view="board";results=[];selectedWeb=null;clearImage=false;currentEdit=null;}
export function visionCount(){return items.length;}
function picture(item){return item.image_source==="upload"?imageUrls[item.id]||"":item.image_source==="web"?item.image_url||"":"";}
function credit(item){
 if(item.image_source!=="web"||!item.image_page_url)return "";
 const artist=(item.image_artist||"Wikimedia Commons").slice(0,120),lic=(item.image_license||"See license");
 return `<a class="vision-credit" href="${esc(item.image_page_url)}" target="_blank" rel="noopener noreferrer" title="View photo source and license">© ${esc(artist)} · ${esc(lic)}</a>`;
}
function placeholder(){return `<div class="vision-placeholder"><span>✦</span><small>A dream is growing here</small></div>`;}
function heroImage(item){const img=picture(item);return img
 ?`<img src="${esc(img)}" alt="${esc(item.title)} vision board picture" loading="lazy" decoding="async" referrerpolicy="no-referrer">`
 :placeholder();}
export async function visionLoad(){
 if(!V?.state.owner)return;
 const {data,error}=await V.supabase.from("vision_board_items").select("*").eq("year",2027).order("created_at",{ascending:false});
 if(error)throw error;
 items=data||[];
 const signed=await Promise.all(items.filter(i=>i.image_source==="upload"&&i.image_path).map(async i=>{
  const r=await V.supabase.storage.from("charitha-vision").createSignedUrl(i.image_path,86400);
  return [i.id,r.error?"":r.data?.signedUrl||""];
 }));
 imageUrls=Object.fromEntries(signed);
}
export function visionView(){
 const board=view==="board";
 const total=items.length,achieved=items.filter(x=>x.stage==="achieved").length;
 const content=total?(board
  ?`<div class="vision-masonry">${items.map(item=>`<article class="vision-tile">
     <button class="vision-tile-open" data-vision="edit" data-id="${esc(item.id)}" aria-label="Edit ${esc(item.title)}">
       <div class="vision-tile-image">${heroImage(item)}</div>
       <span class="vision-tile-title">${esc(item.title)}</span>
       ${item.note?`<span class="vision-tile-note">${esc(item.note)}</span>`:""}
       <span class="vision-stage ${esc(item.stage)}">${esc(stages[item.stage]||"Dreaming")}</span>
     </button>${credit(item)}</article>`).join("")}</div>`
  :`<div class="vision-list">${items.map(item=>`<article class="vision-list-row">
       <button class="vision-list-open" data-vision="edit" data-id="${esc(item.id)}" aria-label="Edit ${esc(item.title)}">
         <div class="vision-list-thumb">${heroImage(item)}</div>
         <div class="vision-list-info"><strong>${esc(item.title)}</strong>
           ${item.note?`<small>${esc(item.note)}</small>`:""}
           <span class="vision-stage ${esc(item.stage)}">${esc(stages[item.stage]||"Dreaming")}</span>
         </div><span class="vision-open-arrow">↗</span>
       </button>${credit(item)}
     </article>`).join("")}</div>`)
  :`<div class="vision-blank"><span class="vision-empty-star">✧</span><h2>Every big dream starts somewhere.</h2>
     <p>A little car, a place you want to go, the life you want to build. Make a wish and watch this board come to life.</p>
     <button class="button button-dark" data-vision="add">Add my first dream ♡</button>
   </div>`;
 return `<section class="vision-page">
   <header class="vision-heading"><span class="eyebrow">A LITTLE CORNER FOR BIG THINGS</span>
     <h1>Charitha's <em>Vision Board</em> <span>2027 ✨</span></h1>
     <p>Collect every beautiful thing you want to do, own, experience, and become. One dream at a time.</p>
   </header>
   <div class="vision-tools">
    <div class="vision-count"><strong>${total}</strong> dreams <span>·</span> <strong>${achieved}</strong> achieved</div>
    <div class="vision-view-toggle" role="group" aria-label="Vision board display">
       <button data-vision="board" aria-pressed="${board}" class="${board?"active":""}">▦ Board</button>
       <button data-vision="list" aria-pressed="${!board}" class="${board?"":"active"}">☷ List</button>
    </div>
    <button class="button button-dark vision-add" data-vision="add">+ Add dream</button>
   </div>
   ${content}
   ${total?`<p class="vision-footer-note">Little by little, it all becomes real ♡</p>`:""}
 </section>`;
}
function sanitizeHtml(v){
 // Image metadata may contain HTML: extract text without preserving markup.
 return String(v||"").replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&")
  .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g," ").trim().slice(0,160);
}
function allowedUrl(url,host){
 try{const u=new URL(url);return u.protocol==="https:"&&u.hostname===host;}catch{return false;}
}
async function searchCommons(query){
 let q=String(query||"").trim().slice(0,110);
 if(!q)return [];
 const params=new URLSearchParams({
   action:"query",format:"json",formatversion:"2",generator:"search",
   gsrsearch:q+" filetype:bitmap",gsrnamespace:"6",gsrlimit:"20",
   prop:"imageinfo",iiprop:"url|extmetadata|mime",iiurlwidth:"850",
   iiextmetadatafilter:"Artist|LicenseShortName",origin:"*"
 });
 const response=await fetch("https://commons.wikimedia.org/w/api.php?"+params.toString(),{mode:"cors"});
 if(!response.ok)throw Error("Image search isn't available right now.");
 const body=await response.json();
 const pages=body?.query?.pages||[];
 const images=pages.map(page=>{
   const info=page.imageinfo?.[0];
   if(!info||!/^image\/(jpeg|png|webp)$/i.test(info.mime||""))return null;
   const image=info.thumburl||info.url,link=info.descriptionurl;
   if(!allowedUrl(image,"upload.wikimedia.org")||!allowedUrl(link,"commons.wikimedia.org"))return null;
   const license=sanitizeHtml(info.extmetadata?.LicenseShortName?.value)||"Check license";
   const artist=sanitizeHtml(info.extmetadata?.Artist?.value)||"Wikimedia Commons contributor";
   return {src:image,page:link,license,artist,filename:page.title||""};
 }).filter(Boolean);
 const words=q.toLowerCase().split(/\s+/).filter(w=>w.length>2);
 return images
  .map(img=>{
   const title=img.filename.toLowerCase();
   const score=words.reduce((n,w)=>n+(title.includes(w)?3:0),0)
    + (/\.(jpg|jpeg)$/i.test(title)?3:0)
    - (/logo|coat of arms|emblem|icon|diagram|symbol|badge|technical drawing|interior/i.test(title)?15:0);
   return {...img,score};
  }).sort((a,b)=>b.score-a.score).slice(0,12);
}
function imageChoiceData(item){
 return {
   image_source:"web",image_url:item.src,image_page_url:item.page,
   image_artist:item.artist,image_license:item.license,image_path:null
 };
}
function imagePreviewOption(item,i){
 return `<button type="button" class="vision-result ${selectedWeb?.src===item.src?"selected":""}"
      data-vision="choose" data-index="${i}" aria-label="Choose image ${i+1}" aria-pressed="${selectedWeb?.src===item.src}">
    <img src="${esc(item.src)}" alt="${esc(item.filename.replace(/^File:/,"").slice(0,100))}" loading="lazy" referrerpolicy="no-referrer">
    <span>${selectedWeb?.src===item.src?"✓ Selected":"Choose"}</span>
  </button>`;
}
function selectedMarkup(){
 if(!selectedWeb)return '<span class="vision-muted">No web image selected yet.</span>';
 return `<div class="vision-selected-box"><img src="${esc(selectedWeb.src)}" alt="Selected image">
 <div><strong>Selected picture ✓</strong><small>${esc(selectedWeb.artist)} · ${esc(selectedWeb.license)}</small>
 <button type="button" data-vision="unselect" class="vision-text-link">Clear selection</button></div></div>`;
}
export function visionOpen(id=null){
 currentEdit=items.find(x=>x.id===id)||null;
 results=[];selectedWeb=null;clearImage=false;
 const item=currentEdit;
 const showImage=item?picture(item):"";
 const html=`<section class="vision-editor">
   <span class="eyebrow">VISION BOARD 2027</span>
   <h2>${item?"Edit this dream":"What are you dreaming of?"} ♡</h2>
   <form data-vision-form="save" data-id="${esc(item?.id||"")}">
    <label class="form-label" for="vision-title">Your dream</label>
    <input id="vision-title" class="field" name="title" minlength="2" maxlength="120" required
      placeholder="e.g. A white Škoda car" value="${esc(item?.title||"")}">
    <label class="form-label" for="vision-note">A little note (optional)</label>
    <textarea class="field" id="vision-note" name="note" maxlength="1200" rows="2"
      placeholder="Describe it as vividly as you like...">${esc(item?.note||"")}</textarea>
    <label class="form-label" for="vision-stage">Your progress</label>
    <select class="field" id="vision-stage" name="stage">
      ${Object.entries(stages).map(([value,label])=>`<option value="${value}" ${(item?.stage||"dreaming")===value?"selected":""}>${label}</option>`).join("")}
    </select>
    <div class="vision-image-section">
      <h3>The picture in your head ✦</h3>
      <p>Choose your own photo, or find a picture online. If you don't choose one, I'll look for a match when you save.</p>
      ${showImage?`<div class="vision-current-picture"><img src="${esc(showImage)}" alt="Current vision board picture">
        <button type="button" data-vision="clear-image" class="vision-text-link">Remove current image</button></div>`:""}
      <label class="vision-upload-choice"><span>↑ Upload my picture</span><small>JPG, PNG, WebP or AVIF · up to 10 MB</small>
        <input type="file" name="picture" accept="image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif" data-vision-file>
      </label>
      <p class="vision-or">or find the perfect picture online</p>
      <div class="vision-searchbar"><input class="field" name="image_query" maxlength="110" aria-label="Search for picture"
          placeholder="e.g. white Skoda Kushaq" value="${esc(item?.title||"")}">
        <button type="button" class="button button-outline" data-vision="search">Find pictures</button></div>
      <div id="vision-search-status" role="status" class="vision-search-status"></div>
      <div id="vision-search-results" class="vision-search-results" aria-label="Picture suggestions"></div>
      <div id="vision-selected">${selectedMarkup()}</div>
    </div>
    <div class="vision-form-actions">
      ${item?`<button type="button" class="vision-text-link vision-remove" data-vision="delete" data-id="${esc(item.id)}">Remove dream</button>`:""}
      <button type="submit" class="button button-dark">${item?"Save changes":"Add to my board ♡"}</button>
    </div>
   </form>
 </section>`;
 V.openModal(html,true,false);
}
async function findPictures(){
 const modal=document.querySelector("[data-vision-form='save']");
 if(!modal)return;
 const q=modal.querySelector("[name='image_query']")?.value?.trim()
  ||modal.querySelector("[name='title']")?.value?.trim();
 if(!q){V.toast("Write a dream first, like ‘Skoda car’.");return;}
 const region=document.getElementById("vision-search-results");
 const notice=document.getElementById("vision-search-status");
 if(!region||!notice)return;
 notice.textContent="Looking for lovely pictures…";region.innerHTML="";
 try{
  results=await searchCommons(q);
  if(!region.isConnected)return;
  notice.textContent=results.length?"Choose a picture that feels right ♡":
    "No pictures found. Try a more specific search, or upload your own photo.";
  region.innerHTML=results.map(imagePreviewOption).join("");
 }catch(err){if(notice.isConnected)notice.textContent=err.message||"Couldn't find images. Try again.";}
}
export async function visionClick(button){
 const act=button.dataset.vision;
 if(act==="board"||act==="list"){view=act;V.render();return;}
 if(act==="add"){visionOpen();return;}
 if(act==="edit"){visionOpen(button.dataset.id);return;}
 if(act==="search"){await findPictures();return;}
 if(act==="choose"){
  const i=Number(button.dataset.index);
  if(!Number.isSafeInteger(i)||!results[i])return;
  selectedWeb=results[i];clearImage=false;
  const display=document.getElementById("vision-selected");
  if(display)display.innerHTML=selectedMarkup();
  document.querySelectorAll(".vision-result").forEach(btn=>{
   const yes=Number(btn.dataset.index)===i;btn.classList.toggle("selected",yes);
   btn.setAttribute("aria-pressed",String(yes));
   const label=btn.querySelector("span");if(label)label.textContent=yes?"✓ Selected":"Choose";
  });
  return;
 }
 if(act==="unselect"){selectedWeb=null;document.getElementById("vision-selected").innerHTML=selectedMarkup();document.querySelectorAll(".vision-result").forEach(b=>{b.classList.remove("selected");b.setAttribute("aria-pressed","false");const l=b.querySelector("span");if(l)l.textContent="Choose";});return;}
 if(act==="clear-image"){clearImage=true;selectedWeb=null;const old=button.closest(".vision-current-picture");if(old)old.remove();V.toast("Image will be removed when you save.");return;}
 if(act==="delete"){
  const item=items.find(x=>x.id===button.dataset.id);
  if(!item||!confirm("Remove “"+item.title+"” from the 2027 vision board?"))return;
  const {error}=await V.supabase.from("vision_board_items").delete().eq("id",item.id);
  if(error)throw error;
  // Safely remove only uploads. Externally hosted images are never altered.
  if(item.image_source==="upload"&&item.image_path)await removeOldUpload(item.image_path);
  V.closeModal();await visionLoad();V.render();V.toast("Dream removed from your board.");
 }
}
async function removeOldUpload(path){
 if(!path)return;
 const s=await V.supabase.storage.from("charitha-vision").remove([path]);
 if(s.error)console.warn("Could not remove old vision image:",s.error.message);
}
function validFile(file){
 if(!file||!file.size)return false;
 return ["image/jpeg","image/png","image/webp","image/avif"].includes(file.type)&&file.size<=10*1024*1024;
}
export async function visionSubmit(form,fd){
 if(!V.state.owner)throw Error("Sign in to edit your vision board.");
 const id=form.dataset.id;
 const item=items.find(x=>x.id===id)||null;
 const title=String(fd.get("title")||"").trim();
 if(title.length<2)throw Error("Please add a little more to your dream.");
 const stage=String(fd.get("stage")||"dreaming");
 if(!stages[stage])throw Error("Choose a valid progress status.");
 const file=fd.get("picture");
 const hasFile=file&&typeof file==="object"&&file.size>0;
 if(hasFile&&!validFile(file))throw Error("Use a JPG, PNG, WebP or AVIF image under 10 MB.");
 const details={title,note:String(fd.get("note")||"").trim().slice(0,1200),stage,year:2027};
 let image={
   image_source:item?.image_source||"none",image_url:item?.image_url||null,image_path:item?.image_path||null,
   image_page_url:item?.image_page_url||null,image_artist:item?.image_artist||null,image_license:item?.image_license||null
 };
 let uploadedPath=null;
 try{
  if(clearImage)image={image_source:"none",image_path:null,image_url:null,image_page_url:null,image_artist:null,image_license:null};
  if(selectedWeb&&!hasFile)image=imageChoiceData(selectedWeb);
  if(hasFile){
    const ext={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/avif":"avif"}[file.type];
    uploadedPath=V.state.session.user.id+"/"+crypto.randomUUID()+"."+ext;
    const up=await V.supabase.storage.from("charitha-vision").upload(uploadedPath,file,
      {upsert:false,contentType:file.type,cacheControl:"3600"});
    if(up.error)throw up.error;
    image={image_source:"upload",image_path:uploadedPath,image_url:null,image_page_url:null,image_artist:null,image_license:null};
  }else if(!selectedWeb&&!clearImage&&image.image_source==="none"){
    // Saving a new text wish automatically tries to add a matching web photograph.
    const web=await searchCommons(title).catch(()=>[]);
    if(web.length)image=imageChoiceData(web[0]);
  }
  const payload={...details,...image,updated_at:new Date().toISOString()};
  let db;
  if(item)db=await V.supabase.from("vision_board_items").update(payload).eq("id",item.id).select("id").single();
  else db=await V.supabase.from("vision_board_items").insert({...payload,created_by:V.state.session.user.id}).select("id").single();
  if(db.error)throw db.error;
  if(item?.image_source==="upload"&&item.image_path&&item.image_path!==image.image_path)
    await removeOldUpload(item.image_path);
  V.closeModal();await visionLoad();V.render();
  V.toast(image.image_source==="none"?"Wish saved ♡ Add a photo whenever you like.":"A little dream has joined your board ♡");
 }catch(err){
  if(uploadedPath)await removeOldUpload(uploadedPath);
  throw err;
 }
}
