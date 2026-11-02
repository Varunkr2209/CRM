const people=["Varun","Lakshay","Yukti","Astha","Deepanshu","Vishwesh"];
const channels=["Care Line","Email","Social DM","Live Chat"];
const caseTypes=["Request for Information","Quality Complaint","Marketing Contact","Consumer Feedback","Adverse Effect","Error Call"];
const statuses=["New","In Progress","Pending Consumer","Escalated","Resolved","Closed"];
const closureReasons=["Unconcluded by consumer","Information provided","Warranty delivered","Refund applied","Referred to stakeholder","Other"];
const COUNTRY="Colombia";
const STORAGE_KEY="pulsedesk-careline-crm-v3";
const PREVIOUS_STORAGE_KEY="pulsedesk-careline-crm-v2";
const LEGACY_STORAGE_KEY="pulsedesk-careline-crm-v1";
const seedContacts=[
  {id:"CON-2001",name:"Alex Morgan",email:"alex.morgan@example.test",phone:"+57 300 555 0101",market:COUNTRY,city:"Bogotá"},
  {id:"CON-2002",name:"Jamie Chen",email:"jamie.chen@example.test",phone:"+57 300 555 0102",market:COUNTRY,city:"Medellín"},
  {id:"CON-2003",name:"Sam Rivera",email:"sam.rivera@example.test",phone:"+57 300 555 0103",market:COUNTRY,city:"Cali"},
  {id:"CON-2004",name:"Taylor Brooks",email:"taylor.brooks@example.test",phone:"+57 300 555 0104",market:COUNTRY,city:"Barranquilla"},
  {id:"CON-2005",name:"Jordan Patel",email:"jordan.patel@example.test",phone:"+57 300 555 0105",market:COUNTRY,city:"Cartagena"}
];
const legacySampleContactLocations={
  "CON-2001":{city:"Monterrey",phone:"+1 555 0101"},
  "CON-2002":{city:"Bogotá",phone:"+1 555 0102"},
  "CON-2003":{city:"Guatemala City",phone:"+1 555 0103"},
  "CON-2004":{city:"Tegucigalpa",phone:"+1 555 0104"},
  "CON-2005":{city:"Mexico City",phone:"+1 555 0105"}
};
const $=id=>document.getElementById(id);
function copy(value){return JSON.parse(JSON.stringify(value))}
function normalizeContact(contact){
  const seed=seedContacts.find(item=>item.id===contact.id);
  const legacyLocation=legacySampleContactLocations[contact.id];
  const isLegacySample=seed&&legacyLocation&&contact.name===seed.name&&contact.email===seed.email&&contact.city===legacyLocation.city&&contact.phone===legacyLocation.phone;
  return{...contact,...(isLegacySample?{city:seed.city,phone:seed.phone}:{}),market:COUNTRY};
}
function loadData(){
  let raw;
  try{
    raw=localStorage.getItem(STORAGE_KEY);
    if(!raw){
      const previousRaw=localStorage.getItem(PREVIOUS_STORAGE_KEY);
      const legacyRaw=previousRaw||localStorage.getItem(LEGACY_STORAGE_KEY);
      let contacts=copy(seedContacts);
      let cases=[];
      let activity=[];
      if(legacyRaw){
        try{
          const legacy=JSON.parse(legacyRaw);
          if(Array.isArray(legacy.contacts))contacts=legacy.contacts;
          if(previousRaw&&Array.isArray(legacy.cases)&&Array.isArray(legacy.activity)){
            cases=legacy.cases;
            activity=legacy.activity;
          }
        }catch(error){
          showToast("Previous saved data could not be read. Starting with an empty case queue.",true);
        }
      }
      const freshData={contacts:contacts.map(normalizeContact),cases,activity};
      localStorage.setItem(STORAGE_KEY,JSON.stringify(freshData));
      localStorage.removeItem(PREVIOUS_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return freshData;
    }
  }
  catch(error){
    showToast("Browser storage is unavailable. Changes will last only until this page closes.",true);
    return{contacts:copy(seedContacts),cases:[],activity:[]};
  }
  try{
    const data=JSON.parse(raw);
    if(!Array.isArray(data.contacts)||!Array.isArray(data.cases)||!Array.isArray(data.activity))throw new Error("Saved CRM data has an invalid format.");
    data.contacts=data.contacts.map(normalizeContact);
    return data;
  }catch(error){
    showToast("Saved data could not be read. Starting with an empty case queue.",true);
    return{contacts:copy(seedContacts),cases:[],activity:[]};
  }
}
let data=loadData();
function persist(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));return true}
  catch(error){showToast("Could not save this change in browser storage. It will be lost when this page closes.",true);return false}
}
function esc(value){return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]))}
function contactFor(id){return data.contacts.find(contact=>contact.id===id)}
function activeCases(){return data.cases.filter(item=>!["Resolved","Closed"].includes(item.status))}
function priorityClass(priority){return"p-"+String(priority).toLowerCase()}
function statusClass(status){return status==="Escalated"?"p-escalated":["Resolved","Closed"].includes(status)?"p-resolved":status==="Pending Consumer"?"p-pending":"p-info"}
function caseButton(item){return`<button class="link" data-case-id="${esc(item.id)}">${esc(item.id)}</button>`}
function caseRow(item,compact=false){
  const contact=contactFor(item.contactId);
  return`<tr><td>${caseButton(item)}</td><td><b>${esc(contact?.name||"Contact unavailable")}</b><div class="muted" style="margin-top:3px">${esc(item.summary)}</div></td><td><span class="pill">${esc(item.caseType)}</span><div class="muted" style="margin-top:4px">${esc(item.channel)}</div></td><td><span class="pill ${priorityClass(item.priority)}">${esc(item.priority)}</span></td><td><span class="pill ${statusClass(item.status)}">${esc(item.status)}</span></td>${compact?"":`<td>${esc(item.assignee||"Unassigned")}</td>`}</tr>`;
}
function renderMembers(targetId){
  $(targetId).innerHTML=people.map(name=>{
    const assigned=activeCases().filter(item=>item.assignee===name).length;
    const urgent=data.cases.filter(item=>item.assignee===name&&item.priority==="Urgent"&&!["Resolved","Closed"].includes(item.status)).length;
    return`<div><div class="member"><div class="member-left"><div class="mini">${esc(name.split(" ").map(part=>part[0]).join(""))}</div>${esc(name)}</div><b>${assigned}${urgent?` <span class="muted">· ${urgent} urgent</span>`:""}</b></div><div class="bar"><i style="width:${Math.min(assigned/5*100,100)}%"></i></div></div>`;
  }).join("");
}
function render(){
  const open=activeCases();
  $("activeCount").textContent=open.length;
  $("escalatedCount").textContent=open.filter(item=>item.status==="Escalated").length;
  $("pendingCount").textContent=open.filter(item=>item.status==="Pending Consumer").length;
  $("adverseCount").textContent=open.filter(item=>item.caseType==="Adverse Effect").length;
  const newest=[...data.cases].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  $("overviewRows").innerHTML=newest.slice(0,5).map(item=>caseRow(item,true)).join("")||'<tr><td colspan="5" class="empty">No cases yet. Create a new case to get started.</td></tr>';
  const query=$("caseSearch").value.trim().toLowerCase();
  const type=$("caseTypeFilter").value,status=$("caseStatusFilter").value,channel=$("caseChannelFilter").value;
  const visible=data.cases.filter(item=>{
    const contact=contactFor(item.contactId);
    const text=[item.id,item.summary,item.caseType,item.channel,item.brand,contact?.name,contact?.email].join(" ").toLowerCase();
    return(!query||text.includes(query))&&(!type||item.caseType===type)&&(!status||item.status===status)&&(!channel||item.channel===channel);
  }).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  $("caseRows").innerHTML=visible.map(item=>caseRow(item)).join("")||(data.cases.length?'<tr><td colspan="6" class="empty">No cases match these filters.</td></tr>':'<tr><td colspan="6" class="empty">No cases yet. Create a new case to get started.</td></tr>');
  $("caseTotal").textContent=`${visible.length} of ${data.cases.length} cases`;
  const contactQuery=$("contactSearch").value.trim().toLowerCase();
  const contacts=data.contacts.filter(contact=>[contact.name,contact.email,contact.phone,contact.market,contact.city].join(" ").toLowerCase().includes(contactQuery));
  $("contactRows").innerHTML=contacts.map(contact=>{
    const count=data.cases.filter(item=>item.contactId===contact.id).length;
    return`<tr><td><button class="link" data-contact-id="${esc(contact.id)}">${esc(contact.name)}</button></td><td>${esc(contact.email||"—")}</td><td>${esc(contact.phone||"—")}</td><td>${esc(contact.market||"—")}</td><td>${esc(contact.city||"—")}</td><td>${count}</td></tr>`;
  }).join("")||'<tr><td colspan="6" class="empty">No contacts match. Add a contact to get started.</td></tr>';
  $("contactTotal").textContent=`${contacts.length} of ${data.contacts.length} contacts`;
  renderMembers("overviewMembers");
  renderMembers("teamMembers");
  const activity=data.activity.slice(0,5);
  $("activity").innerHTML=activity.map(event=>`<div class="event"><span class="dot"></span><span>${esc(event.text)}<br><span class="muted">${esc(event.time)}</span></span></div>`).join("")||'<div class="muted">No activity yet.</div>';
  const escalations=open.filter(item=>item.caseType==="Adverse Effect"||item.status==="Escalated");
  $("escalationList").innerHTML=escalations.map(item=>`<div class="event"><span class="dot" style="background:var(--red)"></span><span>${caseButton(item)} · ${esc(item.caseType)}<br><span class="muted">${esc(item.summary)} · ${esc(item.assignee||"Unassigned")}</span></span></div>`).join("")||'<div class="muted">No open escalations.</div>';
}
function logActivity(text){data.activity.unshift({text,time:new Date().toLocaleString()});data.activity=data.activity.slice(0,30)}
function showToast(message,isError=false){
  const toast=$("toast");toast.textContent=message;toast.classList.toggle("error",isError);toast.style.display="block";
  clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.style.display="none",3200);
}
function openModal(title,body,actions){
  $("modalTitle").textContent=title;$("modalBody").innerHTML=body;$("modalActions").innerHTML=actions;$("modal").classList.add("show");
  const focusable=$("modal").querySelector("input,select,textarea,button");if(focusable)focusable.focus();
}
function closeModal(){$("modal").classList.remove("show");$("modalBody").innerHTML="";$("modalActions").innerHTML=""}
function nextId(collection,prefix){
  const numbers=collection.map(item=>Number(item.id.match(/(\d+)$/)?.[1]||0));
  return`${prefix}-${Math.max(0,...numbers)+1}`;
}
function openContactForm(existing=null){
  const body=`<p class="dialog-note">Store only the minimum approved contact details; this local prototype is not approved for real consumer data.</p>
    <form id="contactForm"><div class="field-grid">
      <div class="field full"><label for="contactName">Full name *</label><input id="contactName" name="name" required maxlength="120" autocomplete="name" value="${esc(existing?.name||"")}"></div>
      <div class="field"><label for="contactEmail">Email</label><input id="contactEmail" name="email" type="email" maxlength="160" autocomplete="email" value="${esc(existing?.email||"")}"></div>
      <div class="field"><label for="contactPhone">Phone</label><input id="contactPhone" name="phone" type="tel" maxlength="40" autocomplete="tel" placeholder="+57" value="${esc(existing?.phone||"")}"></div>
      <div class="field"><label for="contactMarket">End market</label><input id="contactMarket" name="market" value="${COUNTRY}" readonly></div>
      <div class="field"><label for="contactCity">City</label><input id="contactCity" name="city" maxlength="100" placeholder="e.g. Bogotá" value="${esc(existing?.city||"")}"></div>
    </div></form>`;
  openModal(existing?"Edit consumer contact":"Add consumer contact",body,`<button class="btn" type="button" data-close>Cancel</button><button class="btn primary" type="submit" form="contactForm">${existing?"Save changes":"Save contact"}</button>`);
  $("contactForm").addEventListener("submit",event=>{
    event.preventDefault();const form=Object.fromEntries(new FormData(event.currentTarget));
    const contact={id:existing?.id||nextId(data.contacts,"CON"),name:form.name.trim(),email:form.email.trim(),phone:form.phone.trim(),market:COUNTRY,city:form.city.trim()};
    if(existing){data.contacts=data.contacts.map(current=>current.id===existing.id?contact:current);logActivity(`Updated contact ${contact.name} (${contact.id}).`)}
    else{data.contacts.unshift(contact);logActivity(`Created contact ${contact.name} (${contact.id}).`)}
    const saved=persist();closeModal();render();if(saved)showToast(existing?"Contact updated.":"Contact created.");else showToast(existing?"Contact updated for this session only.":"Contact created for this session only.",true);
  });
}
function openCaseForm(){
  if(!data.contacts.length){showToast("Add a contact before creating a case.",true);openContactForm();return}
  const body=`<p class="dialog-note">Create or confirm the consumer contact before logging a case. Adverse-effect reports are automatically marked urgent and escalated for Quality review.</p>
    <form id="caseForm"><div class="field-grid">
      <div class="field full"><label for="caseContact">Consumer contact *</label><select id="caseContact" name="contactId" required>${data.contacts.map(contact=>`<option value="${esc(contact.id)}">${esc(contact.name)} · ${esc(contact.market||"Market not set")}</option>`).join("")}</select></div>
      <div class="field"><label for="caseChannel">Touchpoint channel *</label><select id="caseChannel" name="channel" required>${channels.map(value=>`<option>${esc(value)}</option>`).join("")}</select></div>
      <div class="field"><label for="caseType">Case type *</label><select id="caseType" name="caseType" required>${caseTypes.map(value=>`<option>${esc(value)}</option>`).join("")}</select></div>
      <div class="field"><label for="caseBrand">Brand family</label><select id="caseBrand" name="brand"><option>VELO</option><option>VUSE</option></select></div>
      <div class="field"><label for="caseProduct">Product</label><input id="caseProduct" name="product" maxlength="100" placeholder="Optional"></div>
      <div class="field"><label for="caseFlavor">Flavor / color</label><input id="caseFlavor" name="flavor" maxlength="80"></div>
      <div class="field"><label for="caseStrength">Nicotine level</label><input id="caseStrength" name="strength" maxlength="30" placeholder="Optional"></div>
      <div class="field"><label for="casePriority">Priority</label><select id="casePriority" name="priority"><option>Low</option><option selected>Medium</option><option>High</option><option>Urgent</option></select></div>
      <div class="field"><label for="caseAssignee">Assigned agent</label><select id="caseAssignee" name="assignee"><option value="">Unassigned</option>${people.map(name=>`<option>${esc(name)}</option>`).join("")}</select></div>
      <div class="field full"><label for="caseSummary">Verbatim / case summary *</label><textarea id="caseSummary" name="summary" required maxlength="1200" placeholder="Briefly record the consumer's issue and requested follow-up."></textarea></div>
    </div><p id="adverseNotice" class="dialog-note" style="display:none;color:var(--red);margin-top:10px">Adverse-effect cases are set to Urgent and Escalated. Route to Quality; do not make a medical assessment in this tool.</p></form>`;
  openModal("Create care case",body,'<button class="btn" type="button" data-close>Cancel</button><button class="btn primary" type="submit" form="caseForm">Create case</button>');
  let autoUrgent=false;
  $("casePriority").addEventListener("change",()=>{autoUrgent=false});
  $("caseType").addEventListener("change",()=>{
    const adverse=$("caseType").value==="Adverse Effect";
    $("adverseNotice").style.display=adverse?"block":"none";
    if(adverse&&$("casePriority").value!=="Urgent"){$("casePriority").value="Urgent";autoUrgent=true}
    else if(!adverse&&autoUrgent){$("casePriority").value="Medium";autoUrgent=false}
  });
  $("caseForm").addEventListener("submit",event=>{
    event.preventDefault();const form=Object.fromEntries(new FormData(event.currentTarget));
    const adverse=form.caseType==="Adverse Effect";
    const item={id:nextId(data.cases,"CARE"),contactId:form.contactId,summary:form.summary.trim(),caseType:form.caseType,channel:form.channel,brand:form.brand,product:form.product.trim(),flavor:form.flavor.trim(),strength:form.strength.trim(),priority:adverse?"Urgent":form.priority,status:adverse?"Escalated":"New",assignee:form.assignee,closureReason:"",createdAt:new Date().toISOString()};
    data.cases.unshift(item);
    logActivity(`${item.id} created for ${contactFor(item.contactId)?.name||"contact"} via ${item.channel}${adverse?" and escalated to Quality":""}.`);
    const saved=persist();closeModal();render();if(saved)showToast(`Case ${item.id} created${adverse?" and escalated":""}.`);else showToast("Case created for this session only.",true);
  });
}
function openContactDetail(id){
  const contact=contactFor(id);if(!contact)return;
  const related=data.cases.filter(item=>item.contactId===id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const body=`<div class="detail-grid">
      <div class="detail"><small>Contact ID</small><div>${esc(contact.id)}</div></div><div class="detail"><small>End market</small><div>${esc(contact.market||"—")}</div></div>
      <div class="detail"><small>Email</small><div>${esc(contact.email||"—")}</div></div><div class="detail"><small>Phone</small><div>${esc(contact.phone||"—")}</div></div>
      <div class="detail"><small>City</small><div>${esc(contact.city||"—")}</div></div><div class="detail"><small>Cases</small><div>${related.length}</div></div>
    </div><h3 style="font-size:13px;margin:18px 0 8px">Case history</h3>
    <div class="activity">${related.map(item=>`<div class="event"><span class="dot"></span><span>${caseButton(item)} · ${esc(item.caseType)} · ${esc(item.status)}<br><span class="muted">${esc(item.summary)}</span></span></div>`).join("")||'<div class="muted">No cases recorded.</div>'}</div>`;
  openModal(contact.name,body,`<button class="btn" type="button" data-close>Close</button><button class="btn primary" type="button" data-edit-contact="${esc(contact.id)}">Edit contact</button>`);
}
function openCaseDetail(id){
  const item=data.cases.find(entry=>entry.id===id);if(!item)return;
  const contact=contactFor(item.contactId);
  const body=`<div class="detail-grid" style="margin-bottom:14px">
      <div class="detail"><small>Contact</small><div>${esc(contact?.name||"Contact unavailable")}</div></div><div class="detail"><small>Contact details</small><div>${esc(contact?.email||contact?.phone||"Not provided")}</div></div>
      <div class="detail"><small>Channel / type</small><div>${esc(item.channel)} · ${esc(item.caseType)}</div></div><div class="detail"><small>Brand / product</small><div>${esc(item.brand)} · ${esc([item.product,item.flavor,item.strength].filter(Boolean).join(" / ")||"Not specified")}</div></div>
      <div class="detail"><small>Market / city</small><div>${esc(contact?.market||"—")} · ${esc(contact?.city||"—")}</div></div><div class="detail"><small>Created</small><div>${esc(new Date(item.createdAt).toLocaleString())}</div></div>
    </div><form id="caseDetailForm"><div class="field-grid">
      <div class="field"><label for="detailStatus">Status</label><select id="detailStatus" name="status">${statuses.map(value=>`<option ${item.status===value?"selected":""}>${esc(value)}</option>`).join("")}</select></div>
      <div class="field"><label for="detailAssignee">Assigned agent</label><select id="detailAssignee" name="assignee"><option value="">Unassigned</option>${people.map(name=>`<option ${item.assignee===name?"selected":""}>${esc(name)}</option>`).join("")}</select></div>
      <div class="field full" id="closureField" style="display:${["Resolved","Closed"].includes(item.status)?"grid":"none"}"><label for="detailClosure">Closure reason *</label><select id="detailClosure" name="closureReason"><option value="">Choose closure reason</option>${closureReasons.map(value=>`<option ${item.closureReason===value?"selected":""}>${esc(value)}</option>`).join("")}</select></div>
    </div></form><h3 style="font-size:13px;margin:16px 0 6px">Case summary</h3><p style="font-size:13px;line-height:1.5;margin:0">${esc(item.summary)}</p>`;
  openModal(`${item.id} · ${item.priority}`,body,'<button class="btn" type="button" data-close>Cancel</button><button class="btn primary" type="button" id="saveCaseDetail">Save case</button>');
  $("detailStatus").addEventListener("change",()=>{$("closureField").style.display=["Resolved","Closed"].includes($("detailStatus").value)?"grid":"none"});
  $("saveCaseDetail").addEventListener("click",()=>{
    const form=Object.fromEntries(new FormData($("caseDetailForm")));
    if(["Resolved","Closed"].includes(form.status)&&!form.closureReason){showToast("Choose a closure reason before resolving or closing this case.",true);$("detailClosure").focus();return}
    const previous=item.status;item.status=form.status;item.assignee=form.assignee;item.closureReason=form.closureReason||"";
    if(item.caseType==="Adverse Effect"&&!["Resolved","Closed"].includes(item.status)){item.priority="Urgent";item.status="Escalated"}
    if(previous!==item.status)logActivity(`${item.id} moved from ${previous} to ${item.status}${item.closureReason?` — ${item.closureReason}`:""}.`);
    else logActivity(`${item.id} updated${item.assignee?` · assigned to ${item.assignee}`:""}.`);
    const saved=persist();closeModal();render();if(saved)showToast("Case updated.");else showToast("Case updated for this session only.",true);
  });
}
const pageText={
  overview:["Support overview","Contacts, cases and follow-up across support channels."],
  cases:["Case queue","Review, classify, assign and update consumer-care cases."],
  contacts:["Consumer contacts","Manage contact profiles and review their case history."],
  team:["Team workload","Review active assignments and cases needing Quality follow-up."]
};
function showPage(name){
  document.querySelectorAll(".view").forEach(view=>view.classList.toggle("active",view.id===`view-${name}`));
  document.querySelectorAll(".nav button").forEach(button=>button.classList.toggle("active",button.dataset.page===name));
  $("pageTitle").textContent=pageText[name][0];$("pageSubtitle").textContent=pageText[name][1];
}
document.querySelectorAll(".nav button").forEach(button=>button.addEventListener("click",()=>showPage(button.dataset.page)));
document.querySelectorAll("[data-go]").forEach(button=>button.addEventListener("click",()=>showPage(button.dataset.go)));
$("addContactTop").addEventListener("click",()=>openContactForm());
$("addContactPage").addEventListener("click",()=>openContactForm());
$("newCaseTop").addEventListener("click",openCaseForm);
$("newCaseOverview").addEventListener("click",openCaseForm);
$("newCaseQueue").addEventListener("click",openCaseForm);
["caseSearch","caseTypeFilter","caseStatusFilter","caseChannelFilter","contactSearch"].forEach(id=>$(id).addEventListener("input",render));
document.addEventListener("click",event=>{
  const caseLink=event.target.closest("[data-case-id]");if(caseLink){openCaseDetail(caseLink.dataset.caseId);return}
  const contactLink=event.target.closest("[data-contact-id]");if(contactLink){openContactDetail(contactLink.dataset.contactId);return}
  const editContact=event.target.closest("[data-edit-contact]");if(editContact){const contact=contactFor(editContact.dataset.editContact);closeModal();if(contact)openContactForm(contact);return}
  if(event.target.closest("[data-close]"))closeModal();
});
$("modal").addEventListener("click",event=>{if(event.target===$("modal"))closeModal()});
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&$("modal").classList.contains("show"))closeModal()});
render();
