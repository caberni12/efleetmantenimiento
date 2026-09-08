// R1.8.0: Checklist protagonista + privacidad estricta + combustible Pro + voz + QR + nombres legibles
const API_URL='https://hliqosobxhwdynhyubkc.supabase.co/functions/v1/super-handle';
const DIRECTORY_URL='https://mykndxvshtfydsetcync.supabase.co/functions/v1/bdempresaflota-api';
const WEB_VERSION='1.8.62';
const S={rut:'',key:'',company:null,connection:null,token:localStorage.getItem('efm_token')||'',user:null,vehicles:[],drivers:[],users:[],documents:[],roleProfiles:[],rows:{},notifications:[],notificationPending:[],notificationTimer:null,notificationFetchPromise:null,notificationHydratePromise:null,notificationFastAt:0,notificationHydrateAt:0,perfilOperativo:null,lastPrediction:null,lastCheckinSaved:null,history:[],companyConfig:null,talleres:[],checkinHistory:[],reportRows:[],orders:[],documentHistory:[],auditRows:[],fuelNearby:[],fuelPosition:null,activeWorkshopGeo:null,actionButton:null,actionButtonAt:0,qrStream:null,qrScanTimer:null,qrScanSeq:0,qrValidating:false,qrNativeMisses:0,qrDecoderPromise:null,liveSyncTimer:null,liveSyncBusy:false,liveSyncCursor:0,liveSyncPendingResources:[],voiceKind:null,voiceContext:null,voiceRecorder:null,voiceChunks:[],voiceBlob:null,loginSplashPending:false,checkinQrValidated:false,checkinQrVehicleId:'',currentNotificationDetailId:'',notificationPageFilter:'',previousView:'dashboard',catalogLoadedAt:{},dashboardDetailRows:[],chileDayKey:'',budgetSummary:null,budgetReportRows:[],budgetActionSaveHandler:null,moduleSearch:{},notificationRequestSeq:0,notificationAppliedSeq:0,notificationDataRequestSeq:0,notificationDataAppliedSeq:0,notificationMutationEpoch:0};

const PERMISSION_MODULES=[
 {id:'DASHBOARD',label:'Dashboard',actions:['LEER']},{id:'EMPRESA',label:'Empresa',actions:['LEER','EDITAR','LOGO']},{id:'PERFILES',label:'Perfiles',actions:['LEER','EDITAR']},
 {id:'VEHICULOS',label:'Vehículos',actions:['LEER','CREAR','EDITAR','ELIMINAR']},{id:'CONDUCTORES',label:'Conductores',actions:['LEER','CREAR','EDITAR','ELIMINAR']},
 {id:'ASIGNACIONES',label:'Asignaciones',actions:['LEER','CREAR','EDITAR','ELIMINAR','ACEPTAR']},{id:'DOCUMENTOS',label:'Documentos',actions:['LEER','CREAR','EDITAR','ELIMINAR']},
 {id:'CHECKIN',label:'Checklist técnico',actions:['LEER','CREAR','EDITAR','ELIMINAR','APROBAR_DIRECTO','GENERAR_QR']},{id:'FALLAS',label:'Fallas',actions:['LEER','REPORTAR','GESTIONAR','ELIMINAR']},
 {id:'MANTENCIONES',label:'Mantenciones',actions:['LEER','GESTIONAR','ELIMINAR']},{id:'TALLERES',label:'Talleres',actions:['LEER','CREAR','EDITAR','ELIMINAR']},{id:'HISTORIAL_MANTENCIONES',label:'Historial mantenciones',actions:['LEER']},
 {id:'COMBUSTIBLE',label:'Combustible',actions:['LEER','CREAR','GESTIONAR','ELIMINAR']},{id:'VELOCIDAD',label:'Velocidad',actions:['LEER','CONFIGURAR']},{id:'PREDICCIONES',label:'Análisis predictivo',actions:['LEER','USAR']},
 {id:'NOTIFICACIONES',label:'Notificaciones y alertas',actions:['LEER','MARCAR_LEIDA']},{id:'PRESUPUESTO_OPERACIONAL',label:'Presupuesto Operacional',actions:['LEER','CREAR','EDITAR','ELIMINAR','EXPORTAR','FONDO_EMERGENCIA','TAREAS']},{id:'REPORTES',label:'Reportes',actions:['LEER','EXPORTAR']},{id:'AUDITORIA',label:'Auditoría',actions:['LEER','EXPORTAR']},{id:'USUARIOS',label:'Usuarios',actions:['LEER','CREAR','EDITAR','ELIMINAR','PERMISOS']}
];
const VIEW_PERMISSIONS={dashboard:'DASHBOARD',empresa:'EMPRESA',perfiles:'PERFILES',vehiculos:'VEHICULOS',conductores:'CONDUCTORES',asignaciones:'ASIGNACIONES',documentos:'DOCUMENTOS',checkin:'CHECKIN',checkinhistorial:'CHECKIN',checkinaprobaciones:'CHECKIN',fallas:'FALLAS',mantenciones:'MANTENCIONES',ordenes:'MANTENCIONES',talleres:'TALLERES',historial:'HISTORIAL_MANTENCIONES',predicciones:'PREDICCIONES',notificaciones:'NOTIFICACIONES',combustible:'COMBUSTIBLE',velocidad:'VELOCIDAD',presupuesto:'PRESUPUESTO_OPERACIONAL',reportes:'REPORTES',auditoria:'AUDITORIA',usuarios:'USUARIOS'};
const FORM_MODULES={vehiculo:'VEHICULOS',conductor:'CONDUCTORES',checkin:'CHECKIN',falla:'FALLAS',mantencion:'MANTENCIONES',orden:'MANTENCIONES',taller:'TALLERES',combustible:'COMBUSTIBLE',asignacion:'ASIGNACIONES',taller:'TALLERES',usuario:'USUARIOS'};

const CHILE_TIME_ZONE='America/Santiago';
function chileDayKey(value=new Date()){
 const d=value instanceof Date?value:new Date(value);if(Number.isNaN(d.getTime()))return '';
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:CHILE_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
 const get=t=>parts.find(x=>x.type===t)?.value||'';return `${get('year')}-${get('month')}-${get('day')}`;
}
function chileMonthKey(value=new Date()){return chileDayKey(value).slice(0,7)}
function chileDayFromValue(value){if(!value)return '';return chileDayKey(new Date(value))}
function syncChileDayContext(){
 const today=chileDayKey();if(!today)return false;
 const storageKey=`efm_chile_day_${S.company?.id||S.connection?.empresa_id||'global'}`;
 const previous=S.chileDayKey||localStorage.getItem(storageKey)||'';S.chileDayKey=today;localStorage.setItem(storageKey,today);
 if(previous&&previous!==today){
  S.dashboardDetailRows=[];S.reportRows=[];S.lastCheckinSaved=null;S.lastPrediction=null;S.notificationFastAt=0;S.notificationHydrateAt=0;S.auditRows=[];
  S.liveSyncPendingResources=[...new Set([...(S.liveSyncPendingResources||[]),'CHECKINS','AUDITORIA','COMBUSTIBLE','COSTOS','DASHBOARD'])];
  return true;
 }
 return false;
}

const CHECKS=[
['NEUMATICOS','Neumáticos','CRITICA'],['LUCES','Luces','ALTA'],['FRENOS','Frenos','CRITICA'],
['PARABRISAS','Parabrisas','ALTA'],['CARROCERIA','Carrocería','MEDIA'],['ESPEJOS','Espejos','ALTA'],
['ACEITE','Nivel de aceite','ALTA'],['REFRIGERANTE','Refrigerante','ALTA'],['FRENOS_LIQ','Líquido de frenos','CRITICA'],
['DIRECCION','Dirección','CRITICA'],['SUSPENSION','Suspensión','ALTA'],['BATERIA','Batería','MEDIA'],
['TABLERO','Testigos tablero','ALTA'],['CINTURONES','Cinturones','CRITICA'],['EXTINTOR','Extintor','ALTA'],
['BOTIQUIN','Botiquín','MEDIA'],['DOCUMENTOS','Documentos','ALTA'],['BOCINA','Bocina','MEDIA']
];

function $(id){return document.getElementById(id)}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function normalizeRole(v){const r=String(v||'').toUpperCase().trim().replace(/_/g,'-').replace(/\s+/g,'-');if(['ADMIN','ADMINISTRADOR','ROL-ADMINISTRADOR','ROL-SYSADMIN'].includes(r))return 'ROL-ADMIN';if(['GERENCIA','GERENTE','ROL-GERENTE'].includes(r))return 'ROL-GERENCIA';if(['OPERADOR','ROL-OPERADOR'].includes(r))return 'ROL-OPERADOR';if(['SUPERVISOR','JEFE','ROL-JEFE'].includes(r))return 'ROL-SUPERVISOR';if(['CONDUCTOR','CHOFER','ROL-CHOFER'].includes(r))return 'ROL-CONDUCTOR';return r}
function roleId(){return normalizeRole(S.user?.rolId||S.user?.ROL_ID)}
function roleLabel(v){const r=normalizeRole(v);return({'ROL-ADMIN':'Administrador','ROL-GERENCIA':'Gerencia','ROL-OPERADOR':'Operador','ROL-SUPERVISOR':'Supervisor','ROL-CONDUCTOR':'Conductor','ROL-SUPERVISOR-GEO':'Supervisor geográfico'})[r]||String(v||'Sin perfil').replace('ROL-','')}
function personalPermissions(user=S.user){let p=user?.permisosPersonalizados??user?.permisos_personalizados??{};if(typeof p==='string'){try{p=JSON.parse(p)}catch{p={}}}return p&&typeof p==='object'?p:{}}
function canonicalPermission(module,action){let a=String(action||'LEER').toUpperCase(),m=String(module||'').toUpperCase();if(a==='VER')a='LEER';if(m==='CHECKIN'&&a==='APROBAR')a='APROBAR_DIRECTO';if(m==='PREDICCIONES'&&a==='GENERAR')a='USAR';if(m==='FALLAS'&&a==='CREAR')a='REPORTAR';if(m==='FALLAS'&&a==='EDITAR')a='GESTIONAR';if(m==='MANTENCIONES'&&['CREAR','EDITAR'].includes(a))a='GESTIONAR';if(m==='COMBUSTIBLE'&&a==='EDITAR')a='GESTIONAR';return{module:m,action:a}}
function permissionAllowed(module,action='LEER',user=S.user){const c=canonicalPermission(module,action);module=c.module;action=c.action;const rr=normalizeRole(user?.rolId||user?.rol_id);if(module==='VELOCIDAD'&&!['ROL-ADMIN','ROL-GERENCIA','ROL-OPERADOR'].includes(rr))return false;if(module==='CHECKIN'&&action==='APROBAR_DIRECTO'&&!['ROL-ADMIN','ROL-GERENCIA'].includes(rr))return false;if(rr==='ROL-ADMIN')return true;if(String(user?.modoPermisos||user?.modo_permisos||'ROL').toUpperCase()==='PERSONALIZADO')return personalPermissions(user)?.[module]?.[action]===true;const configured=user?.permisosRol?.[module]?.[action];if(typeof configured==='boolean')return configured;const defaults={
 'ROL-GERENCIA':'*','ROL-OPERADOR':{DASHBOARD:['LEER'],PERFILES:['LEER','EDITAR'],VEHICULOS:['LEER'],CONDUCTORES:['LEER'],ASIGNACIONES:['LEER','CREAR','EDITAR','ACEPTAR'],DOCUMENTOS:['LEER','CREAR','EDITAR'],CHECKIN:['LEER','CREAR','EDITAR','GENERAR_QR'],FALLAS:['LEER','REPORTAR','GESTIONAR'],MANTENCIONES:['LEER','GESTIONAR'],HISTORIAL_MANTENCIONES:['LEER'],COMBUSTIBLE:['LEER','CREAR','GESTIONAR'],VELOCIDAD:['LEER','CONFIGURAR'],PREDICCIONES:['LEER','USAR'],NOTIFICACIONES:['LEER','MARCAR_LEIDA']},
 'ROL-SUPERVISOR':{DASHBOARD:['LEER'],PERFILES:['LEER','EDITAR'],VEHICULOS:['LEER'],CONDUCTORES:['LEER'],ASIGNACIONES:['LEER','CREAR','EDITAR','ACEPTAR'],DOCUMENTOS:['LEER','CREAR','EDITAR'],CHECKIN:['LEER','CREAR','EDITAR','GENERAR_QR'],FALLAS:['LEER','REPORTAR','GESTIONAR'],MANTENCIONES:['LEER','GESTIONAR'],HISTORIAL_MANTENCIONES:['LEER'],COMBUSTIBLE:['LEER','CREAR','GESTIONAR'],PREDICCIONES:['LEER','USAR'],NOTIFICACIONES:['LEER','MARCAR_LEIDA']},
 'ROL-SUPERVISOR-GEO':{DASHBOARD:['LEER'],PERFILES:['LEER','EDITAR'],VEHICULOS:['LEER'],CONDUCTORES:['LEER'],ASIGNACIONES:['LEER','ACEPTAR'],DOCUMENTOS:['LEER'],CHECKIN:['LEER','CREAR'],FALLAS:['LEER','REPORTAR','GESTIONAR'],MANTENCIONES:['LEER'],HISTORIAL_MANTENCIONES:['LEER'],PREDICCIONES:['LEER','USAR'],NOTIFICACIONES:['LEER','MARCAR_LEIDA']},
 'ROL-CONDUCTOR':{DASHBOARD:['LEER'],PERFILES:['LEER','EDITAR'],VEHICULOS:['LEER'],ASIGNACIONES:['LEER','ACEPTAR'],DOCUMENTOS:['LEER'],CHECKIN:['LEER','CREAR'],FALLAS:['LEER','REPORTAR'],MANTENCIONES:['LEER'],HISTORIAL_MANTENCIONES:['LEER'],COMBUSTIBLE:['LEER','CREAR'],NOTIFICACIONES:['LEER','MARCAR_LEIDA']}};const d=defaults[normalizeRole(user?.rolId||user?.rol_id)];return d==='*'?true:Boolean(d?.[module]?.includes(action))}
function canManage(module,action='EDITAR'){return module?permissionAllowed(module,action):['ROL-ADMIN','ROL-GERENCIA'].includes(roleId())}
function isAdmin(){return roleId()==='ROL-ADMIN'}
function isManagement(){return ['ROL-ADMIN','ROL-GERENCIA'].includes(roleId())}
function adminActions(formKey,id,{approve=false}={}){
 const module=FORM_MODULES[formKey];
 if(!permissionAllowed(module,'EDITAR')&&!permissionAllowed(module,'ELIMINAR'))return '';
 return `<div class="card-actions">
   ${permissionAllowed(module,'EDITAR')?`<button class="mini edit" data-edit-form="${esc(formKey)}" data-id="${esc(id)}">✎ Editar</button>`:''}
   ${approve&&permissionAllowed('CHECKIN','APROBAR')?`<button class="mini approve" data-approve-checkin="${esc(id)}">✓ Aprobar directo</button>`:''}
   ${permissionAllowed(module,'ELIMINAR')?`<button class="mini danger" data-delete-form="${esc(formKey)}" data-id="${esc(id)}">Eliminar</button>`:''}
 </div>`;
}

const buttonFeedbackTimers=new WeakMap();
function actionButtonFresh(){return S.actionButton&&document.contains(S.actionButton)&&(Date.now()-Number(S.actionButtonAt||0)<5000)?S.actionButton:null}
function clearButtonFeedbackTimer(btn){const t=buttonFeedbackTimers.get(btn);if(t)clearTimeout(t);buttonFeedbackTimers.delete(btn)}
function setButtonFeedback(btn,state){
 if(!btn)return;btn.classList.add('ux-feedback-button');clearButtonFeedbackTimer(btn);
 btn.classList.remove('is-loading','is-success','is-error');
 // R1.8.23: el feedback (spinner/check/error) es SOLO visual. Nunca cambia disabled,
 // nunca captura clics y por tanto no puede bloquear otra acción del usuario.
 if(state==='loading'){
   btn.classList.add('is-loading');btn.setAttribute('aria-busy','true');return;
 }
 btn.removeAttribute('aria-busy');
 if(state==='success'||state==='error'){
   btn.classList.add(state==='success'?'is-success':'is-error');
   const timer=setTimeout(()=>{btn.classList.remove('is-success','is-error');buttonFeedbackTimers.delete(btn)},760);buttonFeedbackTimers.set(btn,timer);
 }
}
function toast(msg,error=false){
 const n=document.createElement('div');n.className='toast '+(error?'error':'success');
 const icon=document.createElement('span');icon.className='toast-status-icon';icon.textContent=error?'✕':'✓';
 const textNode=document.createElement('span');textNode.className='toast-message';textNode.textContent=String(msg||'');
 n.append(icon,textNode);$('toast').append(n);setTimeout(()=>n.remove(),4200)
}
function friendlyError(message){const raw=String(message||'ERROR');return({CHECKIN_YA_GUARDADO_USA_NUEVA_INSPECCION:'Este Checklist ya fue guardado. Usa “Nueva inspección” para iniciar otro.',KILOMETRAJE_REQUERIDO:'Ingresa el kilometraje actual del vehículo.',VEHICULO_REQUERIDO:'Selecciona una tarjeta de vehículo.',SOLO_CONDUCTOR_O_SUPERVISOR_GEO_PUEDE_ASOCIARSE:'Solo una cuenta Conductor o Supervisor geográfico puede asociarse a un conductor.',CONDUCTOR_ASOCIADO_NO_ENCONTRADO:'El conductor seleccionado ya no está disponible.',PERMISO_DENEGADO:'La cuenta no tiene permiso para esta acción. Si eres Administrador, despliega la API incluida en este paquete.',VEHICULO_NO_DISPONIBLE_PARA_CHECKLIST:'El vehículo asignado no está disponible para iniciar el Checklist.'})[raw]||raw}
function loading(btn,on){
 if(!btn)return;
 if(on){btn.dataset.busy='1';setButtonFeedback(btn,'loading')}
 else{btn.dataset.busy='0';if(!btn.classList.contains('is-success')&&!btn.classList.contains('is-error'))setButtonFeedback(btn,'idle')}
}

function ensureManualSyncSplash(){
 let overlay=$('efleetManualSyncSplash');if(overlay)return overlay;
 overlay=document.createElement('div');overlay.id='efleetManualSyncSplash';overlay.className='efleet-sync-splash hidden';
 overlay.innerHTML=`<div class="efleet-sync-card" role="status" aria-live="polite">
   <div class="efleet-sync-orbit"><span class="efleet-sync-ring"></span><span class="efleet-sync-ring ring-two"></span><div class="efleet-sync-logo"><img src="efleet-icon.png" alt="E-Fleet"></div><span class="efleet-sync-result" aria-hidden="true"></span></div>
   <strong class="efleet-sync-brand">E-Fleet</strong>
   <span class="efleet-sync-badge">SINCRONIZACIÓN MANUAL</span>
   <p class="efleet-sync-message">Sincronizando información…</p>
 </div>`;
 document.body.appendChild(overlay);return overlay;
}
function showTransitionSplash(message='Cargando…',badge='ABRIENDO MÓDULO',duration=430){
 const o=ensureManualSyncSplash();o.classList.remove('hidden','is-success','is-error');
 o.querySelector('.efleet-sync-badge').textContent=badge;o.querySelector('.efleet-sync-message').textContent=message;
 requestAnimationFrame(()=>o.classList.add('visible'));clearTimeout(o._transitionTimer);o._transitionTimer=setTimeout(()=>{o.classList.remove('visible');setTimeout(()=>o.classList.add('hidden'),140)},Math.max(260,duration));
}
function showManualSyncSplash(message='Sincronizando información…'){
 const o=ensureManualSyncSplash();o.classList.remove('hidden','is-success','is-error');
 o.querySelector('.efleet-sync-badge').textContent='SINCRONIZACIÓN MANUAL';o.querySelector('.efleet-sync-message').textContent=message;
 requestAnimationFrame(()=>o.classList.add('visible'));
}
function finishManualSyncSplash(ok=true,message='Sincronización completada'){
 const o=ensureManualSyncSplash();if(o.classList.contains('hidden'))return;
 o.classList.toggle('is-success',ok);o.classList.toggle('is-error',!ok);
 o.querySelector('.efleet-sync-badge').textContent=ok?'COMPLETADO':'REVISAR CONEXIÓN';o.querySelector('.efleet-sync-message').textContent=message;
 setTimeout(()=>{o.classList.remove('visible');setTimeout(()=>o.classList.add('hidden'),190)},720);
}
async function runManualSyncTask(message,job,successMessage='Sincronización completada'){
 showManualSyncSplash(message);
 try{const out=await job();finishManualSyncSplash(true,successMessage);return out}
 catch(e){finishManualSyncSplash(false,'No fue posible sincronizar');throw e}
}

async function api(action,data={},auth=true){
 const h={'Content-Type':'application/json'};if(auth&&S.token)h.Authorization='Bearer '+S.token;
 const actionBtn=actionButtonFresh();if(actionBtn)setButtonFeedback(actionBtn,'loading');
 try{
   const r=await fetch(API_URL,{method:'POST',headers:h,body:JSON.stringify({accion:action,...data})});
   let j={};try{j=await r.json()}catch{}
   if(!r.ok||j.ok===false){const e=new Error(j.error||'ERROR_API');e.status=r.status;e.data=j;throw e}
   if(actionBtn)setButtonFeedback(actionBtn,'success');return j;
 }catch(e){if(actionBtn)setButtonFeedback(actionBtn,'error');if(e instanceof TypeError||/Failed to fetch|NetworkError|Load failed/i.test(String(e?.message||'')))e.isNetworkError=true;throw e}
}

function saveConnection(company,needsSetup=false){
 const conn={id:company?.id||'',rut:company?.rut||'',nombre:company?.nombre||'',estado:company?.estado||'ACTIVA',needsSetup:Boolean(needsSetup),savedAt:new Date().toISOString()};
 if(!conn.id||!conn.rut)return;
 localStorage.setItem('efm_company_connection',JSON.stringify(conn));
 localStorage.setItem('efm_rut',conn.rut);
 S.connection=conn;S.company={id:conn.id,rut:conn.rut,nombre:conn.nombre,estado:conn.estado};S.rut=conn.rut;
}
function loadConnection(){
 try{
   const raw=localStorage.getItem('efm_company_connection');if(!raw)return false;
   const conn=JSON.parse(raw);if(!conn?.id||!conn?.rut)return false;
   S.connection=conn;S.company={id:conn.id,rut:conn.rut,nombre:conn.nombre,estado:conn.estado||'ACTIVA'};S.rut=conn.rut;return true;
 }catch{return false}
}
function updateConnectionSetup(needsSetup){
 if(!S.connection)return;S.connection.needsSetup=Boolean(needsSetup);localStorage.setItem('efm_company_connection',JSON.stringify(S.connection));
}
function showSavedLogin(){
 if(!S.company)return accessStep('stepCompany');
 $('loginCompany').textContent=`${S.company.nombre} · ${S.company.rut}`;accessStep('stepLogin');
}
function clearConnection(showMessage=true){
 S.token='';S.user=null;S.company=null;S.connection=null;S.rut='';S.key='';
 localStorage.removeItem('efm_token');localStorage.removeItem('efm_company_connection');localStorage.removeItem('efm_rut');
 $('rut').value='';$('installKey').value='';$('keyWrap').classList.add('hidden');accessStep('stepCompany');
 if(showMessage)toast('Conexión de empresa eliminada. Debes validar nuevamente el RUT.');
}

function accessStep(which){
 ['stepCompany','stepSetup','stepLogin'].forEach(x=>$(x).classList.add('hidden'));
 $(which).classList.remove('hidden');
}
async function resolveCompany(){
 const b=$('btnResolve');loading(b,true);
 const status=$('companyResult');if(status){status.classList.remove('hidden');status.textContent='Consultando empresa…';}
 try{
   S.rut=$('rut').value.trim(); S.key=$('installKey').value.trim();
   const j=await api('resolverEmpresa',{rut:S.rut,claveInstalacion:S.key},false);
   S.company=j.empresa;saveConnection(j.empresa,j.needsSetup);
   $('companyResult').classList.remove('hidden');
   $('companyResult').textContent=`${j.empresa.nombre} · ${j.empresa.rut}`;
   if(j.needsSetup) accessStep('stepSetup'); else {
     $('loginCompany').textContent=`${j.empresa.nombre} · ${j.empresa.rut}`;
     accessStep('stepLogin');
   }
 }catch(e){
   if(e.message==='CLAVE_INSTALACION_REQUERIDA'){
     $('keyWrap').classList.remove('hidden');toast('El Directorio requiere la clave de instalación.',true);$('installKey').focus();
   }else toast('No fue posible validar empresa: '+e.message,true);
 }finally{loading(b,false)}
}
async function setup(){
 const b=$('btnSetup');loading(b,true);
 try{
  await api('crearPrimerUsuario',{empresaId:S.company?.id,nombre:$('setupName').value,correo:$('setupEmail').value,contrasena:$('setupPassword').value},false);
  updateConnectionSetup(false);$('loginCompany').textContent=`${S.company.nombre} · ${S.company.rut}`;
  $('loginEmail').value=$('setupEmail').value;accessStep('stepLogin');toast('Administrador creado. Ya puedes ingresar.');
 }catch(e){toast('No fue posible crear administrador: '+e.message,true)}finally{loading(b,false)}
}
async function login(){
 const b=$('btnLogin');loading(b,true);
 try{
   const j=await api('login',{empresaId:S.company?.id,rut:S.company?.rut,correo:$('loginEmail').value,contrasena:$('loginPassword').value},false);
   S.token=j.token;S.user=j.user;S.company=j.empresa;saveConnection(j.empresa,false);localStorage.setItem('efm_token',S.token);
   S.loginSplashPending=true;enterApp();
 }catch(e){toast('Ingreso rechazado: '+e.message,true)}finally{loading(b,false)}
}
async function restore(){
 if(!S.token){if(S.connection?.needsSetup)accessStep('stepSetup');else if(S.company)showSavedLogin();else accessStep('stepCompany');return;}
 try{const j=await api('me',{},true);S.user=j.user;S.rut=j.empresa.rut;S.company=j.empresa;saveConnection(j.empresa,false);enterApp()}catch{logout(false)}
}
function logout(show=true){S.token='';S.user=null;S.viewHistory=[];S.notificationPageFilter='';localStorage.removeItem('efm_token');if(S.notificationTimer){clearInterval(S.notificationTimer);S.notificationTimer=null}if(S.liveSyncTimer){clearInterval(S.liveSyncTimer);S.liveSyncTimer=null}S.liveSyncCursor=0;S.liveSyncPendingResources=[];$('notificationCenter')?.classList.add('hidden');$('appView').classList.add('hidden');$('accessView').classList.remove('hidden');$('nexoDock')?.classList.add('hidden');$('nexoFab')?.classList.add('hidden');$('nexoPanel')?.classList.add('hidden');$('nexoVisibilityToggle')?.classList.add('hidden');if(S.company)showSavedLogin();else accessStep('stepCompany');if(show)toast('Sesión cerrada')}
const SIDEBAR_BREAKPOINT=760;
function sidebarIsMobile(){return window.innerWidth<=SIDEBAR_BREAKPOINT}
function syncSidebarA11y(){
 const app=$('appView'),toggle=$('sidebarToggle');if(!app||!toggle)return;
 const open=sidebarIsMobile()?app.classList.contains('sidebar-open'):!app.classList.contains('sidebar-collapsed');
 toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Cerrar menú principal':'Abrir menú principal');
}
function restoreSidebarState(){
 const app=$('appView');if(!app)return;
 if(sidebarIsMobile()){app.classList.remove('sidebar-collapsed','sidebar-open');}
 else{app.classList.remove('sidebar-open');app.classList.toggle('sidebar-collapsed',localStorage.getItem('efm_web_sidebar_collapsed')==='1');}
 syncSidebarA11y();
}
function toggleSidebar(){
 const app=$('appView');if(!app)return;
 if(sidebarIsMobile())app.classList.toggle('sidebar-open');
 else{app.classList.toggle('sidebar-collapsed');localStorage.setItem('efm_web_sidebar_collapsed',app.classList.contains('sidebar-collapsed')?'1':'0');}
 syncSidebarA11y();
}
function closeSidebar(){
 const app=$('appView');if(!app)return;
 if(sidebarIsMobile())app.classList.remove('sidebar-open');else{app.classList.add('sidebar-collapsed');localStorage.setItem('efm_web_sidebar_collapsed','1');}
 syncSidebarA11y();
}
function closeSidebarAfterNavigation(){if(sidebarIsMobile()){$('appView')?.classList.remove('sidebar-open');syncSidebarA11y();}}
function prepareOverlayOpen(){
 closeSidebarAfterNavigation();
 $('notificationCenter')?.classList.add('hidden');
 $('profileMenu')?.classList.add('hidden');
 $('nexoPanel')?.classList.add('hidden');
}
function openOverlay(id){prepareOverlayOpen();$(id)?.classList.remove('hidden')}
function firstAllowedView(){return Object.keys(VIEW_PERMISSIONS).find(v=>v!=='usuarios'&&permissionAllowed(VIEW_PERMISSIONS[v],'VER'))||'sin-acceso'}
function applyPermissionsUi(){
 document.querySelectorAll('#nav [data-view]').forEach(b=>{const v=b.dataset.view;if(v==='manual'){b.classList.remove('hidden');return;}const module=VIEW_PERMISSIONS[v];const managementOnly=['usuarios','checkinaprobaciones','presupuesto'].includes(v);b.classList.toggle('hidden',managementOnly?!isManagement():!permissionAllowed(module,'VER'))});
 document.querySelectorAll('[data-open-form]').forEach(b=>{const m=FORM_MODULES[b.dataset.openForm];b.classList.toggle('hidden',!permissionAllowed(m,'CREAR'))});
 $('btnNewDocument')?.classList.toggle('hidden',!permissionAllowed('DOCUMENTOS','CREAR'));
 $('btnNewAssignment')?.classList.toggle('hidden',!permissionAllowed('ASIGNACIONES','CREAR'));
 $('btnGenerateCheckinQr')?.classList.toggle('hidden',!permissionAllowed('CHECKIN','GENERAR_QR'));
 $('btnMarkAllConforme')?.classList.toggle('hidden',!permissionAllowed('CHECKIN','CREAR'));
 $('btnSaveCheckin')?.classList.toggle('hidden',!permissionAllowed('CHECKIN','CREAR'));
 syncNexoVisibility();
 updateCheckinActionHub();
}
function enterApp(){
 $('accessView').classList.add('hidden');$('appView').classList.remove('hidden');
 $('sideUser').innerHTML=`<strong>${esc(S.user?.nombre||'')}</strong><br>${esc(roleLabel(S.user?.rolId))}`;
 applyPermissionsUi();
 restoreSidebarState();
 loadProfile();loadCompanyModule(false);loadNotifications(false);if(S.notificationTimer)clearInterval(S.notificationTimer);S.notificationTimer=null;
 // R1.8.29: un solo ciclo de 2,5 s atiende notificaciones + cambios de datos.
 startLiveSync();
 showView(permissionAllowed('DASHBOARD','VER')?'dashboard':firstAllowedView());
}
function showView(v,fromHistory=false){
 const previous=liveSyncView();
 if(previous!==v)S.previousView=previous||S.previousView||'dashboard';
 const module=VIEW_PERMISSIONS[v];
 if((['usuarios','checkinaprobaciones','auditoria','presupuesto'].includes(v)&&!isManagement())||(module&&!permissionAllowed(module,'VER'))){toast('Tu perfil no tiene permiso para abrir este módulo',true);v=firstAllowedView()}
 document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));
 document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('active',x.dataset.view===v));
 $('view-'+v)?.classList.add('active');
 const titles={dashboard:'Dashboard',empresa:'Empresa',perfiles:'Perfiles',vehiculos:'Vehículos',conductores:'Conductores',asignaciones:'Asignaciones',documentos:'Documentos',checkin:'Checklist técnico',checkinhistorial:'Historial de Checklist',checkinaprobaciones:'Aprobar Checklist',fallas:'Fallas',mantenciones:'Mantenciones',ordenes:'Órdenes de servicio',talleres:'Talleres',historial:'Historial de mantenciones',predicciones:'Análisis predictivo',notificaciones:'Notificaciones y alertas',combustible:'Combustible',velocidad:'Velocidad',presupuesto:'Presupuesto Operacional',reportes:'Reportes PDF / XLSX',manual:'Manual de Uso / Ayuda',auditoria:'Auditoría',usuarios:'Usuarios y permisos','sin-acceso':'Sin módulos habilitados'};
 $('pageTitle').textContent=titles[v]||v;
 const loginTransition=Boolean(S.loginSplashPending);
 showTransitionSplash(loginTransition?'Cargando E-Fleet…':'Abriendo '+(titles[v]||v)+'…',loginTransition?'INICIANDO SESIÓN':'ABRIENDO MÓDULO',loginTransition?680:430);
 S.loginSplashPending=false;
 // Encabezado limpio. Se conserva título del módulo y badge de versión;
 // NO se muestra enunciado descriptivo entre ambos.
 if($('pageSubtitle')) $('pageSubtitle').textContent='';
 closeSidebarAfterNavigation();
 document.documentElement.dataset.efleetView=v;
 updateNotificationNavigationState();
 refresh(v);
}
async function refresh(v,silent=false){
 try{
   if(v==='dashboard')return loadDashboard();
   if(v==='empresa')return loadCompanyModule();
   if(v==='perfiles')return loadProfileView();
   if(v==='vehiculos')return loadVehicles();
   if(v==='conductores')return loadDrivers();
   if(v==='asignaciones')return loadAssignments();
   if(v==='documentos')return loadDocuments();
   if(v==='checkin')return loadCheckin();
   if(v==='checkinhistorial')return loadCheckinHistory();
   if(v==='checkinaprobaciones')return loadCheckinApprovals();
   if(v==='fallas')return loadCards('FALLAS','fallasRows',fallCard);
   if(v==='mantenciones')return loadMaintenance();
   if(v==='ordenes')return loadServiceOrders();
   if(v==='talleres')return loadWorkshops();
   if(v==='historial')return loadMaintenanceHistory();
   if(v==='predicciones')return loadPredictions();
   if(v==='notificaciones')return loadNotifications(true);
   if(v==='combustible')return loadFuelModule();
   if(v==='velocidad')return loadSpeedModule();
   if(v==='presupuesto')return loadBudget();
   if(v==='reportes')return loadReports();
   if(v==='manual')return;
   if(v==='auditoria')return loadAudit();
   if(v==='usuarios')return loadUsers();
 }catch(e){if(e.status===401){logout(false);if(!silent)toast('Sesión expirada',true)}else if(!silent)toast('Error: '+e.message,true)}
}
// R1.8.29 · SINCRONIZACIÓN INCREMENTAL.
// La API devuelve solo los recursos que cambiaron. La pantalla visible se actualiza
// automáticamente cuando es seguro hacerlo; nunca borra un formulario en edición.
function liveSyncView(){return document.documentElement.dataset.efleetView||document.querySelector('#nav button.active')?.dataset.view||'dashboard'}
function liveSyncModalOpen(){return [...document.querySelectorAll('.modal')].some(m=>!m.classList.contains('hidden'))}
function liveSyncEditing(){
 const el=document.activeElement,tag=String(el?.tagName||'').toUpperCase();
 return liveSyncModalOpen()||['INPUT','TEXTAREA','SELECT'].includes(tag)||(liveSyncView()==='checkin'&&Boolean(S.checkinQrValidated));
}
function liveSyncViewImpacted(view,resources){
 const map={
  dashboard:['VEHICULOS','CONDUCTORES','ASIGNACIONES','CHECKINS','CHECKIN_ITEMS','FALLAS','MANTENCIONES','ORDENES_TRABAJO','COMBUSTIBLE','COSTOS','SALUD_VEHICULO','PREDICCIONES','DOCUMENTOS'],
  empresa:['EMPRESA'],perfiles:['PERFILES','USUARIOS','ASIGNACIONES','CONDUCTORES','VEHICULOS'],usuarios:['USUARIOS','PERFILES'],
  vehiculos:['VEHICULOS','ASIGNACIONES','CHECKINS','FALLAS','MANTENCIONES','ORDENES_TRABAJO','COMBUSTIBLE','DOCUMENTOS','SALUD_VEHICULO'],
  conductores:['CONDUCTORES','ASIGNACIONES','CHECKINS','DOCUMENTOS'],asignaciones:['ASIGNACIONES','VEHICULOS','CONDUCTORES'],
  documentos:['DOCUMENTOS','DOCUMENTOS_HISTORIAL','VEHICULOS','CONDUCTORES'],
  checkin:['CHECKINS','CHECKIN_ITEMS','CHECKIN_EVIDENCIAS','CHECKIN_PROGRAMACIONES','ASIGNACIONES','VEHICULOS','CONDUCTORES'],
  checkinhistorial:['CHECKINS','CHECKIN_ITEMS','CHECKIN_EVIDENCIAS','ASIGNACIONES'],checkinaprobaciones:['CHECKINS','CHECKIN_ITEMS','CHECKIN_EVIDENCIAS'],
  fallas:['FALLAS','FALLAS_HISTORIAL','CHECKINS','MANTENCIONES','ORDENES_TRABAJO'],
  mantenciones:['MANTENCIONES','FALLAS','ORDENES_TRABAJO','TALLERES'],ordenes:['ORDENES_TRABAJO','MANTENCIONES','FALLAS','TALLERES'],
  talleres:['TALLERES','MANTENCIONES','ORDENES_TRABAJO'],historial:['MANTENCIONES','ORDENES_TRABAJO','FALLAS'],
  predicciones:['PREDICCIONES','SALUD_VEHICULO','FALLAS','MANTENCIONES','DOCUMENTOS','COMBUSTIBLE'],
  notificaciones:['NOTIFICACIONES','ASIGNACIONES','DOCUMENTOS','FALLAS','MANTENCIONES'],
  combustible:['COMBUSTIBLE','VEHICULOS','ASIGNACIONES'],presupuesto:['PRESUPUESTOS_OPERACIONALES','PRESUPUESTO_PERIODOS','PRESUPUESTO_CATEGORIAS','PRESUPUESTO_VEHICULOS','PRESUPUESTO_COMPROMISOS','PRESUPUESTO_MOVIMIENTOS','FONDO_EMERGENCIA_MOVIMIENTOS','PRESUPUESTO_ALERTAS','PRESUPUESTO_TAREAS','PRESUPUESTO_AUDITORIA','COMBUSTIBLE','MANTENCIONES','ORDENES_TRABAJO'],reportes:['VEHICULOS','CHECKINS','FALLAS','MANTENCIONES','COMBUSTIBLE','COSTOS','SALUD_VEHICULO','PREDICCIONES'],
  auditoria:['AUDITORIA','USUARIOS','CHECKINS','FALLAS','MANTENCIONES','DOCUMENTOS']
 };
 const wanted=map[view]||[];return resources.some(r=>wanted.includes(String(r||'').toUpperCase()));
}
async function applyLiveSyncResources(resources){
 const incoming=[...new Set((resources||[]).map(x=>String(x||'').toUpperCase()).filter(Boolean))];
 S.liveSyncPendingResources=[...new Set([...(S.liveSyncPendingResources||[]),...incoming])];
 if(!S.liveSyncPendingResources.length||liveSyncEditing())return;
 const pending=S.liveSyncPendingResources.slice();S.liveSyncPendingResources=[];
 const view=liveSyncView();if(liveSyncViewImpacted(view,pending))await refresh(view,true);
}
function nextNotificationRequestSeq(){S.notificationRequestSeq=Number(S.notificationRequestSeq||0)+1;return S.notificationRequestSeq}
function applyNotificationBadgeSnapshot(unread,seq,critical=false){
 unread=Math.max(0,Number(unread||0));seq=Number(seq||0);if(seq<Number(S.notificationAppliedSeq||0))return false;
 S.notificationAppliedSeq=seq;S.lastUnread=unread;
 const count=$('notificationCount');if(count){count.textContent=unread>99?'99+':String(unread);count.classList.toggle('hidden',unread<=0)}
 $('btnNotifications')?.classList.toggle('has-alerts',unread>0);$('btnNotifications')?.classList.toggle('critical-alert',unread>0&&Boolean(critical));
 if($('notificationSummary'))$('notificationSummary').textContent=unread?`${unread} pendiente${unread===1?'':'s'}`:'Sin notificaciones pendientes';return true;
}
async function pollNotificationBadgeSilent(){
 if(!S.token)return;const seq=nextNotificationRequestSeq();
 const j=await api('NOTIFICACIONES_PULSO',{sync_cursor:Number(S.liveSyncCursor||0)},true);
 const unread=Number(j.noLeidas||0),previous=Number(S.lastUnread||0);if(!applyNotificationBadgeSnapshot(unread,seq,Boolean(j.criticasPendientes)))return;
 const cambios=j.cambios||{},changedResources=(cambios.recursos||[]).map(x=>String(x||'').toUpperCase());
 if(cambios.habilitado){S.liveSyncCursor=Number(cambios.cursor||S.liveSyncCursor||0);if(!cambios.inicial)await applyLiveSyncResources(changedResources)}
 const centerOpen=!$('notificationCenter')?.classList.contains('hidden'),notificationView=liveSyncView()==='notificaciones';
 const assignmentEmergencyOpen=!$('assignmentEmergency')?.classList.contains('hidden');
 const assignmentChanged=changedResources.some(r=>r==='ASIGNACIONES'||r==='NOTIFICACIONES');
 if((centerOpen||notificationView||assignmentEmergencyOpen)&&(unread!==previous||assignmentChanged))await loadNotifications(false);
}
async function liveSyncCurrentView(){
 const dayChanged=syncChileDayContext();
 if(!S.token||!navigator.onLine||document.visibilityState!=='visible'||S.liveSyncBusy)return;
 S.liveSyncBusy=true;
 try{if(dayChanged&&!liveSyncEditing())await refresh(liveSyncView(),true);await pollNotificationBadgeSilent();await flushOfflineCheckins();if(!liveSyncEditing()&&S.liveSyncPendingResources?.length)await applyLiveSyncResources([])}catch(e){console.warn('[live-sync]',e)}finally{S.liveSyncBusy=false}
}
function startLiveSync(){if(S.liveSyncTimer)clearInterval(S.liveSyncTimer);syncChileDayContext();S.liveSyncTimer=setInterval(liveSyncCurrentView,2200);liveSyncCurrentView().catch(()=>{})}
function syncHeaderBackButton(){const b=$('pageBackButton');if(!b)return;const v=liveSyncView();b.classList.remove('hidden');b.disabled=false;b.title=(v==='notificaciones'&&(S.currentNotificationDetailId||S.notificationPageFilter))?'Volver atrás':'Volver al módulo anterior'}
function goBackView(){const v=liveSyncView();if(v==='notificaciones'){handleNotificationBack();return;}const target=S.previousView&&S.previousView!==v?S.previousView:'dashboard';showView(target)}

function kpiGlyph(label=''){
 const x=String(label||'').toLowerCase();
 if(x.includes('salud'))return '♥';if(x.includes('riesgo')||x.includes('crít'))return '!';if(x.includes('mant'))return '⌁';if(x.includes('falla'))return '⚠';if(x.includes('check'))return '✓';if(x.includes('costo')||x.includes('gasto'))return '$';if(x.includes('veh'))return '▣';if(x.includes('respuesta'))return '↗';if(x.includes('prioridad'))return '◆';return '●';
}
function ringValueFitClass(value=''){
 const n=String(value??'').trim().length;
 return n>=16?'value-fit-xxs':n>=12?'value-fit-xs':n>=9?'value-fit-sm':n>=7?'value-fit-md':'value-fit-lg';
}
function ringKpi(label,value,progress=0,tone='blue',detail='',action=''){
 const raw=String(value??'—'),p=Math.max(0,Math.min(100,Number(progress)||0)),money=/^\s*\$/.test(raw),fit=ringValueFitClass(raw),click=action?` data-dashboard-detail="${esc(action)}" role="button" tabindex="0"`:'';
 return `<article class="ring-kpi ${esc(tone)} ${fit}${money?' money':''}${action?' actionable':''}"${click}><div class="ring-kpi-top"><span class="ring-kpi-icon">${esc(kpiGlyph(label))}</span><span class="ring-kpi-state">EN LÍNEA</span></div><div class="ring-gauge" style="--progress:${p}"><div><strong title="${esc(raw)}">${esc(raw)}</strong><small>INDICADOR</small></div></div><div class="ring-kpi-copy"><h4>${esc(label)}</h4>${detail?`<p>${esc(detail)}</p>`:''}</div></article>`;
}
function notificationFilterLabel(key=''){const map={pendientes:'Pendientes',criticas:'Críticas',prioridad_alta:'Prioridad alta',respuesta_requerida:'Respuesta requerida'};return map[key]||'Notificaciones';}
function notificationRowsForFilter(rows,key=''){const all=[...(rows||[])];if(!key)return all;return all.filter(n=>{const awaiting=String(n.estado_respuesta||'').toUpperCase()==='PENDIENTE'||(String(n.requiere_aceptacion||'NO').toUpperCase()==='SI'&&String(n.estado_respuesta||'PENDIENTE').toUpperCase()==='PENDIENTE');const unread=String(n.leida||'NO').toUpperCase()!=='SI';const priority=notificationPriorityClass(n);if(key==='pendientes')return unread;if(key==='criticas')return priority==='critical'&&unread;if(key==='prioridad_alta')return priority==='high'&&unread;if(key==='respuesta_requerida')return awaiting;return true})}
function notificationSelectionSummary(key,rows){const label=notificationFilterLabel(key),count=(rows||[]).length;if(key==='pendientes')return {eyebrow:'RESUMEN ACTIVO',title:`${label} · ${count}`,text:'Aquí aparece el detalle filtrado de la categoría seleccionada.'};if(key==='criticas')return {eyebrow:'ATENCIÓN INMEDIATA',title:`${label} · ${count}`,text:'Se muestran solo notificaciones críticas que requieren prioridad operacional.'};if(key==='prioridad_alta')return {eyebrow:'GESTIÓN PRIORIZADA',title:`${label} · ${count}`,text:'Se muestran notificaciones de prioridad alta pendientes de gestión.'};if(key==='respuesta_requerida')return {eyebrow:'RESPUESTA OPERACIONAL',title:`${label} · ${count}`,text:'Se muestran las alertas que todavía requieren respuesta o aceptación.'};return {eyebrow:'NOTIFICACIONES',title:'Notificaciones y alertas',text:'Toca una tarjeta KPI o una notificación para ver su detalle.'}}
function renderInlineNotificationDetail(n){const awaiting=String(n.requiere_aceptacion||'NO').toUpperCase()==='SI'&&String(n.estado_respuesta||'PENDIENTE').toUpperCase()==='PENDIENTE';return `<div class="notification-detail-hero ${notificationPriorityClass(n)}"><div class="notification-detail-icon">${notificationIcon(n)}</div><div><span>${esc(n.prioridad||'NORMAL')}</span><h4>${esc(n.titulo||'Notificación')}</h4><p>${esc(n.mensaje_legible||n.mensaje||'Sin detalle adicional.')}</p></div></div><div class="notification-detail-grid">${notificationDetailRows(n)}</div>${awaiting?'<div class="notification-detail-warning">Esta notificación todavía requiere una respuesta operacional. Marcarla como leída no cierra esa obligación.</div>':''}<div class="notification-detail-actions">${notificationReadButton(n)}${n.audio_disponible?`<button type="button" class="mini detail" data-audio-notification="${esc(n.id)}">▶ Escuchar nota de voz</button>`:''}${String(n.entidad_tipo||'').toUpperCase()==='CHECKIN'?`<button type="button" class="mini edit" data-resend-checklist-notification="${esc(n.id)}">↻ Reenviar Checklist</button>`:''}</div>`}
function updateNotificationNavigationState(){const btn=$('pageBackButton'),inline=$('notificationPageInlineBack'),selection=$('notificationPageSelection');const inNotifications=liveSyncView()==='notificaciones';const hasDetail=Boolean(S.currentNotificationDetailId);const hasFilter=Boolean(S.notificationPageFilter);if(btn){btn.classList.remove('hidden');btn.disabled=false;btn.textContent='←';btn.title=inNotifications?(hasDetail?'Cerrar detalle':hasFilter?'Quitar filtro':'Volver al módulo anterior'):'Volver al módulo anterior';}if(inline)inline.classList.toggle('hidden',!(inNotifications&&(hasDetail||hasFilter)));if(selection)selection.classList.toggle('hidden',!(inNotifications&&(hasFilter||hasDetail)))}
function clearNotificationInlineDetail(scroll=false){S.currentNotificationDetailId='';const box=$('notificationPageDetail');if(box){box.classList.add('hidden');box.innerHTML='';}document.querySelectorAll('.notification-page-card.active-detail').forEach(x=>x.classList.remove('active-detail'));updateNotificationNavigationState();if(scroll)$('view-notificaciones')?.scrollIntoView({behavior:'smooth',block:'start'});}
function clearNotificationFilter(scroll=false){S.notificationPageFilter='';renderNotificationPage();updateNotificationNavigationState();if(scroll)$('view-notificaciones')?.scrollIntoView({behavior:'smooth',block:'start'});}
function handleNotificationBack(){if(S.currentNotificationDetailId){clearNotificationInlineDetail(true);return;}if(S.notificationPageFilter){clearNotificationFilter(true);return;}showView(S.previousView&&S.previousView!=='notificaciones'?S.previousView:'dashboard');}

function dashboardKpi(label,value,action,tone='blue',icon='●'){
 const raw=String(value??'—'),fit=ringValueFitClass(raw);
 return `<button class="kpi kpi-actionable kpi-modern ${esc(tone)} ${fit}" type="button" data-dashboard-detail="${esc(action)}"><span class="kpi-modern-icon">${esc(icon)}</span><span class="kpi-modern-copy"><small>${esc(label)}</small><strong title="${esc(raw)}">${esc(raw)}</strong><em>Ver detalle →</em></span></button>`;
}
async function loadDashboard(){
 const j=await api('dashboard');const r=j.resumen||{};
 const ks=[['Vehículos',r.vehiculos||0,'VEHICULOS','blue','▣'],['Checklist hoy',r.checkins_hoy||0,'CHECKINS_HOY','green','✓'],['Fallas abiertas',r.fallas_abiertas||0,'FALLAS_ABIERTAS','amber','⚠'],['Fallas críticas',r.fallas_criticas||0,'FALLAS_CRITICAS','red','!'],['Mantenciones',r.mantenciones_pendientes||0,'MANTENCIONES_PENDIENTES','amber','⌁'],['Costo mes','$ '+Number(r.costo_mes||0).toLocaleString('es-CL'),'COSTO_MES','teal','$']];
 $('kpis').innerHTML=ks.map(([a,b,action,tone,icon])=>dashboardKpi(a,b,action,tone,icon)).join('');
 const rows=j.saludVehiculos||[];
 const avgHealth=rows.length?Math.round(rows.reduce((a,x)=>a+Number(x.salud_porcentaje||0),0)/rows.length):0;
 const avgRisk=rows.length?Math.round(rows.reduce((a,x)=>a+Number(x.riesgo_porcentaje||0),0)/rows.length):0;
 const fleet=Math.max(1,Number(r.vehiculos||rows.length||1));
 const decisions=j.decisionKpis||[];
 $('fleetRings').innerHTML=ringKpi('Salud de flota',`${avgHealth}%`,avgHealth,avgHealth<50?'red':avgHealth<75?'amber':'green','Promedio de unidades','SALUD_FLOTA')+ringKpi('Riesgo operacional',`${avgRisk}%`,avgRisk,avgRisk>=60?'red':avgRisk>=30?'amber':'blue','Exposición estimada','RIESGO_FLOTA')+ringKpi('Mantención pendiente',String(r.mantenciones_pendientes||0),Math.min(100,Number(r.mantenciones_pendientes||0)/fleet*100),Number(r.mantenciones_pendientes||0)?'amber':'green','Ligada a vehículos','MANTENCIONES_PENDIENTES')+decisions.map((x,i)=>ringKpi(x.titulo,x.valorTexto||x.patente||'—',100,/FALLA|COSTO/.test(String(x.tipo||''))?'amber':/CONDUCTOR/.test(String(x.tipo||''))?'teal':'blue',`${x.detalle||''}${x.accion_sugerida?' · Decisión: '+x.accion_sugerida:''}`,x.vehiculo_id?`VEHICULO:${x.vehiculo_id}`:x.conductor_id?`CONDUCTOR:${x.conductor_id}`:'')).join('');
 $('healthRows').innerHTML=rows.length?rows.map(x=>`<div class="table-row dashboard-health-clickable" data-life-vehicle="${esc(x.vehiculo_id||x.id)}" role="button" tabindex="0"><strong>${esc(x.patente||x.vehiculo_patente||'Vehículo asociado')}</strong><span>${esc(x.marca||'')} ${esc(x.modelo||'')}</span><span>Salud ${Number(x.salud_porcentaje||0).toFixed(0)}%</span><div class="health-bar"><span style="width:${Math.max(0,Math.min(100,Number(x.salud_porcentaje||0)))}%"></span></div><span>Riesgo ${Number(x.riesgo_porcentaje||0).toFixed(0)}%</span></div>`).join(''):'<p class="muted">Aún no hay indicadores de salud calculados.</p>';
}

async function loadProfileView(){
 await loadProfile();const p=S.perfilOperativo||{},u=S.user||{},c=p.conductor||{},v=p.vehiculo||{};
 $('profileOverview').innerHTML=`<article class="profile-main-card"><div class="profile-big-avatar">${u.fotoUrl?`<img src="${esc(u.fotoUrl)}" alt="Foto">`:esc(initials(u.nombre))}</div><div><span class="profile-label">PERFIL DE ACCESO</span><h3>${esc(u.nombre||'Usuario')}</h3><p>${esc(u.correo||'')} · ${esc(u.telefono||'Sin teléfono')}</p><div class="profile-pills"><span>${esc(roleLabel(u.rolId))}</span><span>${esc(u.modoPermisos||'ROL')}</span></div></div></article>`;
 $('profileOperational').innerHTML=`<article class="life-summary-card"><span class="life-icon">👤</span><small>CONDUCTOR ASOCIADO</small><h3>${esc(c.nombre||'Sin asociación')}</h3><p>${c.id?`${esc(c.rut||'Sin RUT')} · Licencia ${esc(c.licencia_clase||'—')}`:'Un administrador puede asociar esta cuenta desde Conductores.'}</p>${c.id?`<button class="mini detail" data-life-driver="${esc(c.id)}">Abrir hoja de vida</button>`:''}</article><article class="life-summary-card"><span class="life-icon">🚙</span><small>VEHÍCULO VIGENTE</small><h3>${esc(v.patente||'Sin vehículo')}</h3><p>${v.id?`${esc(v.marca||'')} ${esc(v.modelo||'')} · ${Number(v.kilometraje||0).toLocaleString('es-CL')} km`:'No existe una asignación vigente asociada.'}</p>${v.id?`<button class="mini detail" data-life-vehicle="${esc(v.id)}">Abrir hoja de vida</button>`:''}</article>`;
 try{
  const profiles=await api('PERFILES_ACCESO',{},true);S.roleProfiles=profiles.rows||[];renderRoleProfiles();
 }catch(e){$('roleProfileCards').innerHTML=`<div class="notification-empty">No fue posible cargar los perfiles: ${esc(e.message)}</div>`}
}

function renderRoleProfiles(){
 const q=String($('profileSearch')?.value||'').trim(),filter=normalizeRole($('profileRoleFilter')?.value||'');
 let visible=isManagement()?S.roleProfiles:S.roleProfiles.filter(x=>normalizeRole(x.id)===roleId());
 if(filter)visible=visible.filter(x=>normalizeRole(x.id)===filter);
 if(q)visible=visible.filter(x=>searchMatch(`${x.nombre||''} ${x.descripcion||''} ${x.id||''}`,q));
 $('roleProfileCards').innerHTML=visible.length?visible.map(x=>{const modules=Object.values(x.permisos||{}),enabled=modules.reduce((n,a)=>n+Object.values(a||{}).filter(Boolean).length,0),total=modules.reduce((n,a)=>n+Object.keys(a||{}).length,0);return `<article class="role-profile-card ${x.irreductible?'admin-profile':''}"><div class="role-profile-head"><span>${esc(initials(x.nombre))}</span><div><small>PERFIL</small><h4>${esc(x.nombre)}</h4><code>${esc(x.id)}</code></div></div><p>${esc(x.descripcion||'Perfil de acceso')}</p><div class="role-profile-meter"><span style="width:${total?Math.round(enabled/total*100):0}%"></span></div><div class="role-profile-foot"><small>${enabled} de ${total} acciones habilitadas</small>${isManagement()?`<button class="mini permissions" data-role-permissions="${esc(x.id)}">${x.irreductible?'Ver matriz':'Configurar matriz'}</button>`:''}</div></article>`}).join(''):'<div class="notification-empty">No hay perfiles para este filtro.</div>';
}

// ====================== R1.8.6 · FILTROS AVANZADOS + TÍTULOS LIMPIOS ======================
const ADV_FILTERS={
 vehiculos:{state:['estado'],category:['categoria','tipo','combustible'],criticality:['criticidad','nivel_riesgo','riesgo'],date:['actualizado_en','creado_en']},
 conductores:{state:['estado'],category:['categoria','licencia_clase'],criticality:['criticidad','nivel_riesgo'],date:['actualizado_en','creado_en','licencia_vencimiento']},
 asignaciones:{state:['estado'],category:['categoria','tipo'],criticality:['criticidad','prioridad'],date:['fecha_asignacion','creado_en','actualizado_en']},
 documentos:{state:r=>docComputedState(r),category:['tipo_documento'],criticality:['criticidad','prioridad'],date:['fecha_vencimiento','fecha_emision','creado_en']},
 checkinhistorial:{state:['estado'],category:['resultado_tecnico','tipo','origen'],criticality:['criticidad','severidad'],date:['fecha_inicio','fecha_fin','creado_en']},
 checkinaprobaciones:{state:['estado'],category:['resultado_tecnico','tipo','origen'],criticality:['criticidad','severidad'],date:['fecha_inicio','fecha_fin','creado_en']},
 fallas:{state:['estado'],category:['categoria','origen','tipo'],criticality:['criticidad','severidad'],date:['fecha_detectada','creado_en','actualizado_en']},
 mantenciones:{state:['estado'],category:['tipo','categoria'],criticality:['prioridad','criticidad'],date:['fecha_programada','fecha_inicio','fecha_termino','creado_en']},
 ordenes:{state:['estado'],category:['tipo','categoria'],criticality:['prioridad','criticidad'],date:['fecha_programada','fecha_apertura','creado_en']},
 talleres:{state:['estado'],category:['especialidad','categoria'],criticality:['criticidad','prioridad'],date:['actualizado_en','creado_en']},
 historial:{state:['estado'],category:['tipo','categoria'],criticality:['prioridad','criticidad'],date:['fecha_termino','fecha_inicio','fecha_programada','actualizado_en']},
 predicciones:{state:['estado'],category:['tipo_prediccion','categoria'],criticality:['nivel_riesgo','criticidad'],date:['fecha_prediccion','creado_en','actualizado_en']},
 notificaciones:{state:r=>String(r.leida||'NO').toUpperCase()==='SI'?'LEIDA':'NO LEIDA',category:['categoria','entidad_tipo'],criticality:['prioridad','criticidad'],date:['fecha_hora','creado_en']},
 combustible:{state:['estado'],category:['tipo_combustible','combustible','categoria'],criticality:r=>String(r.consumo_anomalo||'').toUpperCase()==='SI'?'ANOMALIA':'NORMAL',date:['fecha_hora','fecha_carga','creado_en']},
 usuarios:{state:['estado'],category:['rol_id'],criticality:['criticidad'],date:['ultimo_acceso','creado_en','actualizado_en']},
 reportes:{state:['estado'],category:['categoria','tipo','tipo_documento','resultado_tecnico'],criticality:['criticidad','severidad','prioridad','nivel_riesgo'],date:['fecha_hora','fecha_inicio','fecha_programada','fecha_detectada','creado_en','actualizado_en']},
 auditoria:{state:['accion'],category:['modulo','entidad_tipo'],criticality:['rol_usuario'],date:['fecha_hora','creado_en']}
};
function advSpecValue(row,spec){
 if(typeof spec==='function')return spec(row);
 for(const k of(spec||[])){const v=row?.[k];if(v!==undefined&&v!==null&&String(v).trim()!=='')return String(v).trim()}
 return'';
}
function advDateValue(row,spec){
 const raw=advSpecValue(row,spec);if(!raw)return null;const d=new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw)?raw+'T12:00:00':raw);return Number.isNaN(d.getTime())?null:d;
}
function advText(row){
 const primitive=Object.values(row||{}).filter(v=>['string','number','boolean'].includes(typeof v)).join(' ');
 const related=[vehicleName(row?.vehiculo_id),driverName(row?.conductor_id),workshopName(row?.taller_id)].join(' ');
 return `${primitive} ${related}`.toLowerCase();
}
function advBar(module){return document.querySelector(`.advanced-filter-bar[data-filter-module="${module}"]`)}
function advControl(module,selector){return advBar(module)?.querySelector(selector)||null}
function searchNormalize(value){return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9k@]+/g,' ').replace(/\s+/g,' ').trim()}
function searchCompact(value){return searchNormalize(value).replace(/[^a-z0-9k@]/g,'')}
function searchMatch(value,query){const qNorm=searchNormalize(query),qCompact=searchCompact(query);if(!qNorm)return true;const hayNorm=searchNormalize(value),hayCompact=searchCompact(value);return hayNorm.includes(qNorm)||Boolean(qCompact&&hayCompact.includes(qCompact))}

function advancedFilteredRows(module,rows){
 const cfg=ADV_FILTERS[module]||{},bar=advBar(module);if(!bar)return rows||[];
 const q=String(bar.querySelector('[data-filter-search]')?.value||'').trim();
 const qNorm=searchNormalize(q),qCompact=searchCompact(q);
 const remote=S.moduleSearch?.[module],remoteApplied=Boolean(remote&&searchNormalize(remote.query)===qNorm);
 rows=remoteApplied?remote.rows:(rows||[]);
 const state=String(bar.querySelector('[data-filter-state]')?.value||'').toUpperCase();
 const category=String(bar.querySelector('[data-filter-category]')?.value||'').toUpperCase();
 const criticality=String(bar.querySelector('[data-filter-criticality]')?.value||'').toUpperCase();
 const from=bar.querySelector('[data-filter-from]')?.value||'',to=bar.querySelector('[data-filter-to]')?.value||'';
 const fromDate=from?new Date(from+'T00:00:00'):null,toDate=to?new Date(to+'T23:59:59.999'):null;
 const vehicle=bar.querySelector('[data-filter-extra="vehicle"]')?.value||'';
 const entity=String(bar.querySelector('[data-filter-extra="entity"]')?.value||'').toUpperCase();
 return (rows||[]).filter(row=>{
   // Si la API ya resolvió la búsqueda global, no volver a descartar el resultado localmente.
   if(q&&!remoteApplied){const hay=advText(row),hayNorm=searchNormalize(hay),hayCompact=searchCompact(hay);if(!hayNorm.includes(qNorm)&&(!qCompact||!hayCompact.includes(qCompact)))return false;}
   if(state&&String(advSpecValue(row,cfg.state)).toUpperCase()!==state)return false;
   if(category&&String(advSpecValue(row,cfg.category)).toUpperCase()!==category)return false;
   if(criticality&&String(advSpecValue(row,cfg.criticality)).toUpperCase()!==criticality)return false;
   if(vehicle&&String(row?.vehiculo_id||'')!==String(vehicle))return false;
   if(entity&&String(row?.tipo_entidad||'').toUpperCase()!==entity)return false;
   if(fromDate||toDate){const d=advDateValue(row,cfg.date);if(!d)return false;if(fromDate&&d<fromDate)return false;if(toDate&&d>toDate)return false}
   return true;
 });
}
function advOptionLabel(module,kind,value){
 if(module==='usuarios'&&kind==='category')return roleLabel(value);
 return String(value||'').replaceAll('_',' ');
}
function populateAdvancedFilter(module,rows){
 const cfg=ADV_FILTERS[module]||{},bar=advBar(module);if(!bar)return;
 for(const [kind,attr,spec,allLabel] of [['state','[data-filter-state]',cfg.state,'Todos'],['category','[data-filter-category]',cfg.category,'Todas'],['criticality','[data-filter-criticality]',cfg.criticality,'Todas']]){
   const sel=bar.querySelector(attr);if(!sel)continue;const keep=sel.value;
   const vals=[...new Set((rows||[]).map(r=>advSpecValue(r,spec)).filter(v=>String(v).trim()!==''))].sort((a,b)=>String(a).localeCompare(String(b),'es'));
   sel.innerHTML=`<option value="">${allLabel}</option>`+vals.map(v=>`<option value="${esc(v)}">${esc(advOptionLabel(module,kind,v))}</option>`).join('');
   if(vals.some(v=>String(v)===String(keep)))sel.value=keep;
   sel.disabled=vals.length===0;
 }
}
const ADV_RESOURCE={vehiculos:'VEHICULOS',conductores:'CONDUCTORES',asignaciones:'ASIGNACIONES',documentos:'DOCUMENTOS',checkinhistorial:'CHECKINS',checkinaprobaciones:'CHECKINS',fallas:'FALLAS',mantenciones:'MANTENCIONES',ordenes:'ORDENES_TRABAJO',talleres:'TALLERES',historial:'HISTORIAL_MANTENCIONES',predicciones:'PREDICCIONES',combustible:'COMBUSTIBLE',usuarios:'USUARIOS',auditoria:'AUDITORIA'};
async function applyAdvancedFilter(module,button=null){
 const bar=advBar(module);if(!bar){renderAdvancedModule(module);return;}
 const q=String(bar.querySelector('[data-filter-search]')?.value||'').trim(),resource=ADV_RESOURCE[module];
 if(!q||!resource){if(S.moduleSearch)delete S.moduleSearch[module];renderAdvancedModule(module);return;}
 if(button)loading(button,true);
 try{const j=await api('listar',{recurso:resource,limit:500,buscar:q});S.moduleSearch[module]={query:q,rows:j.rows||[]};renderAdvancedModule(module)}
 catch(e){toast(e.message||'No fue posible consultar');}
 finally{if(button)loading(button,false)}
}
function clearAdvancedFilter(module){
 const bar=advBar(module);if(!bar)return;if(S.moduleSearch)delete S.moduleSearch[module];bar.querySelectorAll('input').forEach(i=>i.value='');bar.querySelectorAll('select').forEach(s=>s.value='');renderAdvancedModule(module);
}
function renderAdvancedModule(module){
 const map={vehiculos:renderVehicles,conductores:renderDrivers,asignaciones:renderAssignments,documentos:renderDocuments,checkinhistorial:renderCheckinHistory,checkinaprobaciones:renderCheckinApprovals,fallas:renderFailures,mantenciones:renderMaintenance,ordenes:renderServiceOrders,talleres:renderWorkshops,historial:renderMaintenanceHistory,predicciones:renderPredictions,notificaciones:renderNotificationPage,combustible:renderFuelModule,usuarios:renderUsers,reportes:renderReport,auditoria:renderAudit};
 const fn=map[module];if(typeof fn==='function')fn();
}
function wireAdvancedFilters(){
 document.querySelectorAll('.advanced-filter-bar[data-filter-module]').forEach(bar=>{
   const module=bar.dataset.filterModule;
   bar.querySelector('[data-filter-apply]')?.addEventListener('click',e=>applyAdvancedFilter(module,e.currentTarget));
   bar.querySelector('[data-filter-clear]')?.addEventListener('click',()=>clearAdvancedFilter(module));
   bar.querySelector('[data-filter-refresh]')?.addEventListener('click',async e=>{const b=e.currentTarget;loading(b,true);try{await runManualSyncTask('Actualizando módulo…',()=>refresh(module),'Información actualizada')}catch(err){}finally{loading(b,false)}});
   bar.querySelector('[data-filter-search]')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();applyAdvancedFilter(module,bar.querySelector('[data-filter-apply]'))}});
 });
}
// ===========================================================================
async function loadVehicles(catalogOnly=false){
 const j=await api('listar',{recurso:'VEHICULOS',limit:300});S.vehicles=j.rows||[];S.rows.VEHICULOS=S.vehicles;S.catalogLoadedAt.VEHICULOS=Date.now();fillVehicleSelect();
 if(!catalogOnly){populateAdvancedFilter('vehiculos',S.vehicles);renderVehicles();}
}
function renderVehicles(){
 const rows=advancedFilteredRows('vehiculos',S.vehicles||[]);
 $('vehiculosRows').innerHTML=rows.length?rows.map(x=>`<div class="card"><h4>${esc(x.patente)}</h4><p>${esc(x.marca||'')} ${esc(x.modelo||'')} ${esc(x.anio||'')}</p><p>KM: <strong>${Number(x.kilometraje||0).toLocaleString('es-CL')}</strong></p><p>VIN: ${esc(x.vin||'—')} · Combustible: ${esc(x.combustible||'—')}</p><span class="badge">${esc(x.estado||'ACTIVO')}</span><div class="life-actions"><button class="mini detail" data-life-vehicle="${esc(x.id)}">Hoja de vida</button>${permissionAllowed('MANTENCIONES','CREAR')?`<button class="mini edit" data-new-maintenance="${esc(x.id)}">+ Mantención</button>`:''}</div>${adminActions('vehiculo',x.id)}</div>`).join(''):'<p class="muted">No hay vehículos para los filtros seleccionados.</p>';
}
async function loadDrivers(catalogOnly=false){
 const j=await api('listar',{recurso:'CONDUCTORES',limit:500});S.drivers=j.rows||[];S.rows.CONDUCTORES=S.drivers;S.catalogLoadedAt.CONDUCTORES=Date.now();fillDriverSelect();
 if(!catalogOnly&&permissionAllowed('DOCUMENTOS','LEER')){try{const dj=await api('listar',{recurso:'DOCUMENTOS',limit:500});S.documents=dj.rows||[];S.rows.DOCUMENTOS=S.documents}catch(e){console.warn('[conductores][documentos]',e)}}
 if(!catalogOnly){populateAdvancedFilter('conductores',S.drivers);renderDrivers();}
}
function renderDrivers(){
 const rows=advancedFilteredRows('conductores',S.drivers||[]);
 $('conductoresRows').innerHTML=rows.length?rows.map(x=>{const docs=(S.documents||[]).filter(d=>String(d.conductor_id||'')===String(x.id)),states=docs.map(docComputedState),expired=states.filter(v=>v==='VENCIDO').length,warn=states.filter(v=>v==='POR_VENCER').length;return `<div class="card"><h4>${esc(x.nombre)}</h4><p>RUT: ${esc(x.rut||'')}</p><p>${esc(x.correo||'')} · ${esc(x.telefono||'')}</p><p>Licencia: ${esc(x.licencia_clase||'—')} ${x.licencia_vencimiento?'· vence '+esc(new Date(x.licencia_vencimiento).toLocaleDateString('es-CL')):''}</p><div class="driver-doc-actions"><span class="driver-doc-pill ${expired?'danger':warn?'warn':'ok'}">📄 ${docs.length} documento(s)${expired?` · ${expired} vencido(s)`:warn?` · ${warn} por vencer`:' · al día'}</span><button class="mini detail" data-driver-docs="${esc(x.id)}">Documentación</button></div><span class="badge">${esc(x.estado||'Activo')}</span><div class="life-actions"><button class="mini detail" data-life-driver="${esc(x.id)}">Hoja de vida</button>${x.usuario_id?`<span class="linked-user">✓ Usuario asociado</span>`:'<span class="linked-user pending">Sin usuario</span>'}</div>${adminActions('conductor',x.id)}</div>`}).join(''):'<p class="muted">No hay conductores para los filtros seleccionados.</p>';
}
async function ensureCatalogs(maxAgeMs=45000){
 const now=Date.now(),fresh=k=>Number(S.catalogLoadedAt?.[k]||0)>0&&now-Number(S.catalogLoadedAt[k])<maxAgeMs;
 const tasks=[];if(!S.vehicles.length||!fresh('VEHICULOS'))tasks.push(loadVehicles(true));if(!S.drivers.length||!fresh('CONDUCTORES'))tasks.push(loadDrivers(true));
 if(tasks.length)await Promise.all(tasks);
}
function invalidateSavedCheckin(){S.lastCheckinSaved=null;updateCheckinActionHub()}
function selectCheckinVehicle(id,fromUser=false){
 const input=$('ciVehicle');if(!input)return;if(fromUser&&String(input.value)!==String(id))invalidateSavedCheckin();input.value=id||'';
 document.querySelectorAll('[data-ci-vehicle]').forEach(b=>{const active=String(b.dataset.ciVehicle)===String(input.value);b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active))});
 const vehicle=S.vehicles.find(v=>String(v.id)===String(input.value));if(fromUser&&vehicle&&(!$('ciKm').value||Number($('ciKm').value)===0))$('ciKm').value=Number(vehicle.kilometraje||0)||'';
 updateCheckinActionHub();
}
function selectCheckinDriver(id,fromUser=false){
 const input=$('ciDriver');if(!input)return;if(fromUser&&String(input.value)!==String(id))invalidateSavedCheckin();input.value=id||'';
 document.querySelectorAll('[data-ci-driver]').forEach(b=>{const active=String(b.dataset.ciDriver||'')===String(input.value);b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active))});
 updateCheckinActionHub();
}
function fillVehicleSelect(){
 const input=$('ciVehicle'),box=$('ciVehicleCards');if(!input||!box)return;
 if(input.value&&!S.vehicles.some(v=>String(v.id)===String(input.value)))input.value='';
 if(!input.value&&S.vehicles.length===1)input.value=S.vehicles[0].id;
 const q=String($('ciVehicleSearch')?.value||'').trim(),visible=S.vehicles.filter(v=>!q||searchMatch(`${v.patente||''} ${v.marca||''} ${v.modelo||''} ${v.vin||''}`,q));
 box.innerHTML=visible.length?visible.map(v=>`<button class="checkin-choice-card vehicle-card ${String(v.id)===String(input.value)?'selected':''}" type="button" data-ci-vehicle="${esc(v.id)}" aria-pressed="${String(v.id)===String(input.value)}"><span class="choice-icon">🚙</span><span><strong>${esc(v.patente||'Sin patente')}</strong><small>${esc([v.marca,v.modelo].filter(Boolean).join(' ')||'Vehículo')}</small><em>${Number(v.kilometraje||0).toLocaleString('es-CL')} km</em></span><b>✓</b></button>`).join(''):'<div class="checkin-choice-empty">No hay vehículos que coincidan con la búsqueda.</div>';
 box.querySelectorAll('[data-ci-vehicle]').forEach(b=>b.onclick=()=>selectCheckinVehicle(b.dataset.ciVehicle,true));
}
function fillDriverSelect(){
 const input=$('ciDriver'),box=$('ciDriverCards');if(!input||!box)return;
 if(input.value&&!S.drivers.some(v=>String(v.id)===String(input.value)))input.value='';
 const noneSelected=!input.value;
 const q=String($('ciDriverSearch')?.value||'').trim(),visible=S.drivers.filter(d=>!q||searchMatch(`${d.nombre||''} ${d.rut||''} ${d.correo||''} ${d.licencia_clase||''}`,q));
 box.innerHTML=`<button class="checkin-choice-card driver-card ${noneSelected?'selected':''}" type="button" data-ci-driver="" aria-pressed="${noneSelected}"><span class="choice-icon">—</span><span><strong>Sin conductor</strong><small>Inspección de la unidad</small></span><b>✓</b></button>`+visible.map(d=>`<button class="checkin-choice-card driver-card ${String(d.id)===String(input.value)?'selected':''}" type="button" data-ci-driver="${esc(d.id)}" aria-pressed="${String(d.id)===String(input.value)}"><span class="choice-icon">👤</span><span><strong>${esc(d.nombre||'Conductor')}</strong><small>${esc(d.rut||d.licencia_clase||'Registro activo')}</small></span><b>✓</b></button>`).join('');
 box.querySelectorAll('[data-ci-driver]').forEach(b=>b.onclick=()=>selectCheckinDriver(b.dataset.ciDriver||'',true));
}
function setCheckinQrGate(valid,vehicleId=''){
 S.checkinQrValidated=Boolean(valid);S.checkinQrVehicleId=valid?String(vehicleId||''):'';
 const area=$('checkinValidatedArea'),hint=$('checkinQrGateHint');
 if(area)area.classList.toggle('hidden',!valid);
 if(hint){hint.classList.toggle('ok',Boolean(valid));hint.innerHTML=valid?`<strong>✓ QR validado</strong><span>${esc(vehicleName(vehicleId)||'Vehículo asignado')} · 18 puntos habilitados</span>`:'<strong>QR requerido</strong><span>Valida el QR del vehículo asignado para habilitar los 18 puntos de chequeo.</span>';}
 if($('ciVehicle')){$('ciVehicle').dataset.qrLocked=valid?'1':'';$('ciVehicle').disabled=Boolean(valid);}
 document.querySelectorAll('[data-ci-vehicle]').forEach(b=>{b.disabled=Boolean(valid)&&String(b.dataset.ciVehicle)!==String(vehicleId)});
}
function renderChecklist(){
 const groups=[
  ['Seguridad crítica',[0,2,9,10,13]],
  ['Exterior y visibilidad',[1,3,4,5,17]],
  ['Motor y fluidos',[6,7,8,11,12]],
  ['Cabina y equipamiento',[14,15,16]]
 ];
 $('checklist').innerHTML=groups.map(([name,indexes],groupIndex)=>`<section class="check-group">
   <div class="check-group-title"><span>${groupIndex+1}</span><div><strong>${esc(name)}</strong><small>${name==='Seguridad crítica'?'Una falla crítica puede dejar el vehículo NO APTO.':'Selecciona la condición observada en cada punto.'}</small></div></div>
   <div class="check-group-items">${indexes.map(i=>{const x=CHECKS[i];return `<div class="check-item" data-check-card="${esc(x[0])}"><div class="check-item-head"><span><strong>${i+1}. ${esc(x[1])}</strong><small class="criticality ${String(x[2]).toLowerCase()}">${esc(x[2])}</small></span><span class="check-state-summary">Conforme</span></div><input type="hidden" data-check="${esc(x[0])}" data-name="${esc(x[1])}" data-critical="${esc(x[2])}" value="CONFORME"><div class="check-state-options" role="radiogroup" aria-label="Estado de ${esc(x[1])}"><button class="selected state-ok" type="button" data-check-option="${esc(x[0])}" data-check-state="CONFORME" aria-pressed="true">✓<span>Conforme</span></button><button class="state-watch" type="button" data-check-option="${esc(x[0])}" data-check-state="OBSERVACION" aria-pressed="false">◉<span>Observación</span></button><button class="state-fail" type="button" data-check-option="${esc(x[0])}" data-check-state="FALLA" aria-pressed="false">⚠<span>Falla</span></button></div></div>`}).join('')}</div>
  </section>`).join('');
 document.querySelectorAll('[data-check-option]').forEach(b=>b.onclick=()=>setCheckState(b.dataset.checkOption,b.dataset.checkState,true));calcResult();
}
function setCheckState(code,state,fromUser=false){
 const input=[...document.querySelectorAll('[data-check]')].find(x=>x.dataset.check===code);if(!input)return;if(fromUser&&input.value!==state)invalidateSavedCheckin();input.value=state;
 const card=input.closest('[data-check-card]');card?.querySelectorAll('[data-check-option]').forEach(b=>{const active=b.dataset.checkState===state;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active))});
 const summary=card?.querySelector('.check-state-summary');if(summary){summary.textContent=state==='OBSERVACION'?'Observación':state==='FALLA'?'Falla':'Conforme';summary.className='check-state-summary '+(state==='FALLA'?'danger':state==='OBSERVACION'?'warn':'ok')}
 calcResult();
}
function setAllCheckStates(state='CONFORME'){document.querySelectorAll('[data-check]').forEach(x=>setCheckState(x.dataset.check,state,false));invalidateSavedCheckin();calcResult()}
function calcResult(){
 let result='APTO',ok=0,observations=0,failures=0;document.querySelectorAll('[data-check]').forEach(s=>{if(s.value==='CONFORME')ok++;else if(s.value==='OBSERVACION')observations++;else failures++;if(s.value==='FALLA'&&s.dataset.critical==='CRITICA')result='NO APTO';else if(result!=='NO APTO'&&s.value!=='CONFORME')result='APTO CON OBSERVACIÓN'});
 $('ciResult').textContent=result;$('ciResultDetail').textContent=`${ok} conformes · ${observations} observaciones · ${failures} fallas`;
 $('ciResultBox').className='checkin-result '+(result==='NO APTO'?'result-danger':result.includes('OBSERVACIÓN')?'result-warn':'result-ok');
 updateCheckinActionHub();
 return result;
}

function checkinItemSnapshot(){return [...document.querySelectorAll('[data-check]')].map(x=>({codigo:x.dataset.check,nombre:x.dataset.name,criticidad:x.dataset.critical,estado:x.value}))}
function checkinSourceFromRow(row,extra={}){return{checkinId:row?.id||'',vehicleId:row?.vehiculo_id||'',driverId:row?.conductor_id||'',kilometraje:Number(row?.kilometraje||0),resultado:row?.resultado_tecnico||row?.estado||'',observacion:row?.observacion_general||'',failedItems:extra.failedItems||[],failureRows:extra.failureRows||[]}}
function updateCheckinActionHub(){
 const context=$('checkinActionContext'),failureCard=$('checkinFailureAction'),maintenanceCard=$('checkinMaintenanceAction'),failureOptions=$('checkinFailureOptions');if(!context||!failureCard||!maintenanceCard||!failureOptions)return;
 const saved=S.lastCheckinSaved,ready=Boolean(saved?.checkinId&&saved?.vehicleId),canFailure=permissionAllowed('FALLAS','REPORTAR'),canMaintenance=permissionAllowed('MANTENCIONES','CREAR');
 failureCard.classList.toggle('is-locked',!ready||!canFailure);maintenanceCard.classList.toggle('is-locked',!ready||!canMaintenance);
 context.textContent=ready?`${vehicleName(saved.vehicleId)} · Checklist guardado · las acciones quedarán vinculadas.`:'Guarda la inspección para vincular una falla o mantención.';
 const failed=saved?.failedItems?.filter(x=>x.estado==='FALLA')||[];
 failureOptions.innerHTML=(failed.length?failed.map(x=>`<button type="button" data-current-checkin-failure="${esc(x.codigo)}" ${ready&&canFailure?'':'disabled'}>⚠ ${esc(x.nombre)} · ${esc(x.criticidad)}</button>`).join(''):'')+`<button type="button" data-current-checkin-failure="ADICIONAL" ${ready&&canFailure?'':'disabled'}>+ Informar falla adicional</button>`;
 document.querySelectorAll('[data-current-checkin-maintenance]').forEach(b=>b.disabled=!ready||!canMaintenance);
}
function modalField(key){return $('modalBody')?.querySelector(`[data-field="${key}"]`)}
function setModalField(key,value){const field=modalField(key);if(field&&value!==undefined&&value!==null)field.value=String(value)}
function convertModalSelectToCards(key){
 const select=modalField(key);if(!select||select.tagName!=='SELECT'||select.nextElementSibling?.dataset?.cardSelect===key)return;select.classList.add('card-select-source');
 const options=document.createElement('div');options.className='modal-card-options';options.dataset.cardSelect=key;
 const render=()=>{options.innerHTML=[...select.options].map(o=>`<button type="button" class="${String(o.value)===String(select.value)?'selected':''}" data-card-select-value="${esc(o.value)}" aria-pressed="${String(o.value)===String(select.value)}">${esc(o.textContent)}</button>`).join('');options.querySelectorAll('[data-card-select-value]').forEach(b=>b.onclick=()=>{select.value=b.dataset.cardSelectValue;render()})};render();select.insertAdjacentElement('afterend',options);
}
function lockCheckinContextInModal(source,kind){
 const v=S.vehicles.find(x=>String(x.id)===String(source.vehicleId))||{},d=S.drivers.find(x=>String(x.id)===String(source.driverId))||{};
 for(const key of ['vehiculo_id','conductor_id'])modalField(key)?.closest('.form-field')?.classList.add('hidden');
 if(kind==='falla')modalField('origen')?.closest('.form-field')?.classList.add('hidden');
 const intro=$('modalBody')?.querySelector('.record-form-intro');intro?.insertAdjacentHTML('afterend',`<div class="checkin-linked-banner"><span>✓ VINCULADO AL CHECK-IN</span><strong>🚙 ${esc(v.patente||source.vehicleId)}${d.nombre?` · 👤 ${esc(d.nombre)}`:''}</strong><small>${Number(source.kilometraje||0).toLocaleString('es-CL')} km · ${esc(source.resultado||'Inspección registrada')} · ${esc(source.checkinId)}</small></div>`);
}
function faultSeverityFromItem(item){return item?.criticidad==='CRITICA'?'CRITICA':item?.criticidad==='ALTA'?'ALTA':item?.criticidad==='MEDIA'?'MEDIA':'BAJA'}
async function openCheckinFailure(source,code='ADICIONAL'){
 if(!source?.checkinId)return toast('Primero guarda el Checklist para mantener la trazabilidad.',true);
 if(!permissionAllowed('FALLAS','REPORTAR'))return toast('Tu perfil no tiene permiso para informar fallas.',true);
 const item=(source.failedItems||[]).find(x=>x.codigo===code),existing=(source.failureRows||[]).find(x=>x.codigo===code)?.row||null;
 await openForm('falla',existing);activeCheckinContext={...source,kind:'falla'};lockCheckinContextInModal(source,'falla');
 setModalField('vehiculo_id',source.vehicleId);setModalField('conductor_id',source.driverId);setModalField('origen','CHECKIN');setModalField('kilometraje',source.kilometraje);
 if(!existing){const severity=faultSeverityFromItem(item);setModalField('titulo',item?`Hallazgo Checklist: ${item.nombre}`:'Falla informada desde Checklist');setModalField('descripcion',item?`Condición marcada como Falla durante la inspección de ${item.nombre}. ${source.observacion||''}`:source.observacion||'Falla observada durante el Checklist técnico.');setModalField('severidad',severity);setModalField('criticidad',severity);setModalField('estado','DETECTADA');setModalField('puede_operar',severity==='CRITICA'?'NO':'SI');setModalField('requiere_inmovilizacion',severity==='CRITICA'?'SI':'NO')}
 for(const key of ['severidad','criticidad','estado','puede_operar','requiere_inmovilizacion'])convertModalSelectToCards(key);
 $('modalTitle').textContent=existing?'Completar informe de falla':'Informar falla desde Checklist';
}
async function openCheckinMaintenance(source,type='CORRECTIVA'){
 if(!source?.checkinId)return toast('Primero guarda el Checklist para mantener la trazabilidad.',true);
 if(!permissionAllowed('MANTENCIONES','CREAR'))return toast('Tu perfil no tiene permiso para programar mantenciones.',true);
 await openForm('mantencion');activeCheckinContext={...source,kind:'mantencion'};lockCheckinContextInModal(source,'mantencion');setModalField('vehiculo_id',source.vehicleId);setModalField('tipo',type);setModalField('estado','PROGRAMADA');setModalField('kilometraje_programado',source.kilometraje);
 const findings=(source.failedItems||[]).filter(x=>x.estado!=='CONFORME').map(x=>x.nombre).join(', ');setModalField('descripcion',findings?`Revisión por hallazgos de Checklist: ${findings}`:`Mantención ${String(type).toLowerCase()} programada desde Checklist`);setModalField('observaciones',`Origen Checklist ${source.checkinId}. Resultado: ${source.resultado||'registrado'}. ${source.observacion||''}`.trim());for(const key of ['tipo','estado'])convertModalSelectToCards(key);$('modalTitle').textContent=`Programar mantención ${String(type).toLowerCase()}`;
}
function openHistoricalCheckinAction(id,kind,type){const row=(S.rows.CHECKINS||[]).find(x=>String(x.id)===String(id));if(!row)return toast('Checklist no encontrado',true);const source=checkinSourceFromRow(row);return kind==='falla'?openCheckinFailure(source,'ADICIONAL'):openCheckinMaintenance(source,type||'CORRECTIVA')}
function resetCheckinWorkspace(){if($('ciVehicleSearch'))$('ciVehicleSearch').value='';if($('ciDriverSearch'))$('ciDriverSearch').value='';setCheckinQrGate(false,'');if($('ciVehicle'))$('ciVehicle').disabled=false;S.lastCheckinSaved=null;$('ciVehicle').value='';$('ciDriver').value='';$('ciKm').value='';$('ciObs').value='';if($('ciEvidenceFiles'))$('ciEvidenceFiles').value='';document.querySelectorAll('[data-guided-evidence]').forEach(i=>i.value='');updateGuidedEvidenceHint();fillVehicleSelect();fillDriverSelect();document.querySelectorAll('[data-check]').forEach(x=>setCheckState(x.dataset.check,'CONFORME',false));calcResult();$('ciVehicleCards')?.scrollIntoView({behavior:'smooth',block:'center'});updateCheckinActionHub()}

let qrState=null,qrTimer=null;
function qrAssignVehicleText(v){return `${v.patente||'Vehículo'} · ${[v.marca,v.modelo].filter(Boolean).join(' ')}${v.vin?' · '+v.vin:''}`.trim()}
function qrAssignDriverText(d){return `${d.nombre||'Conductor'}${d.rut?' · '+d.rut:''}${d.correo?' · '+d.correo:''}`}
function fillQrAssignVehicleOptions(){
 const sel=$('qrAssignVehicle'),q=String($('qrAssignVehicleSearch')?.value||'').trim(),keep=sel?.value||$('ciVehicle')?.value||'';if(!sel)return;
 const rows=(S.vehicles||[]).filter(v=>!q||searchMatch(`${v.patente||''} ${v.marca||''} ${v.modelo||''} ${v.vin||''}`,q));
 sel.innerHTML='<option value="">Selecciona vehículo</option>'+rows.map(v=>`<option value="${esc(v.id)}">${esc(qrAssignVehicleText(v))}</option>`).join('');
 if(rows.some(v=>String(v.id)===String(keep)))sel.value=keep;else if(rows.length===1)sel.value=rows[0].id;updateQrAssignSummary();
}
function fillQrAssignDriverOptions(){
 const sel=$('qrAssignDriver'),q=String($('qrAssignDriverSearch')?.value||'').trim(),keep=sel?.value||$('ciDriver')?.value||'';if(!sel)return;
 const rows=(S.drivers||[]).filter(d=>!q||searchMatch(`${d.nombre||''} ${d.rut||''} ${d.correo||''}`,q));
 sel.innerHTML='<option value="">Selecciona conductor</option>'+rows.map(d=>`<option value="${esc(d.id)}">${esc(qrAssignDriverText(d))}</option>`).join('');
 if(rows.some(d=>String(d.id)===String(keep)))sel.value=keep;else if(rows.length===1)sel.value=rows[0].id;updateQrAssignSummary();
}
function updateQrAssignSummary(){
 const vid=$('qrAssignVehicle')?.value||'',did=$('qrAssignDriver')?.value||'',v=(S.vehicles||[]).find(x=>String(x.id)===String(vid)),d=(S.drivers||[]).find(x=>String(x.id)===String(did));
 if($('qrAssignVehicleLabel'))$('qrAssignVehicleLabel').textContent=v?qrAssignVehicleText(v):'Selecciona vehículo';
 if($('qrAssignDriverLabel'))$('qrAssignDriverLabel').textContent=d?qrAssignDriverText(d):'Selecciona conductor';
}
async function openQuickQrAssignment(){
 if(!permissionAllowed('CHECKIN','GENERAR_QR'))return toast('Tu perfil no tiene permiso para generar el QR',true);
 if(!permissionAllowed('ASIGNACIONES','CREAR'))return toast('Tu perfil no tiene permiso para realizar la asignación rápida',true);
 await ensureCatalogs();if($('qrAssignVehicleSearch'))$('qrAssignVehicleSearch').value='';if($('qrAssignDriverSearch'))$('qrAssignDriverSearch').value='';fillQrAssignVehicleOptions();fillQrAssignDriverOptions();openOverlay('qrAssignModal');setTimeout(()=>$('qrAssignVehicleSearch')?.focus(),80);
}
function closeQuickQrAssignment(){$('qrAssignModal')?.classList.add('hidden')}
async function assignQuickQr(){
 const vehicleId=$('qrAssignVehicle')?.value||'',driverId=$('qrAssignDriver')?.value||'',btn=$('qrAssignSave');if(!vehicleId)return toast('Selecciona un vehículo',true);if(!driverId)return toast('Selecciona un conductor',true);loading(btn,true);
 try{
  const j=await api('ASIGNAR_Y_GENERAR_QR_CHECKIN',{vehiculo_id:vehicleId,conductor_id:driverId},true);if(!j.qrValue)throw new Error('QR_NO_GENERADO');
  if($('ciVehicle')){$('ciVehicle').disabled=false;$('ciVehicle').value=vehicleId}selectCheckinVehicle(vehicleId,true);selectCheckinDriver(driverId,true);
  closeQuickQrAssignment();showGeneratedCheckinQr(j,vehicleId,driverId);toast(j.asignacionReutilizada?'Asignación vigente reutilizada · QR generado':'Vehículo y conductor asignados · QR generado');loadNotifications(false).catch(()=>{});
 }catch(e){toast('Asignación QR: '+friendlyError(e.message),true)}finally{loading(btn,false)}
}
function showGeneratedCheckinQr(j,vehicleId,driverId=''){
 qrState={...j,vehicleId,driverId};const box=$('checkinQrCode');box.innerHTML='';if(typeof QRCode!=='function')throw new Error('MOTOR_QR_NO_DISPONIBLE');new QRCode(box,{text:j.qrValue,width:340,height:340,colorDark:'#101828',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});
 $('qrVehicleName').textContent=(j.vehiculo?.patente||vehicleName(vehicleId))+' · '+[j.vehiculo?.marca,j.vehiculo?.modelo].filter(Boolean).join(' ');const dr=j.conductor||(S.drivers||[]).find(x=>String(x.id)===String(driverId));if($('qrDriverName'))$('qrDriverName').textContent=dr?`Conductor: ${dr.nombre||driverName(driverId)}`:'Conductor asignado';openOverlay('qrModal');startQrCountdown(j.expiraEn||j.expiresAt);
}
async function generateCheckinQr(){return openQuickQrAssignment()}
function startQrCountdown(expiresAt){
 if(qrTimer)clearInterval(qrTimer);const expires=new Date(expiresAt).getTime();
 const tick=()=>{const left=Math.max(0,expires-Date.now()),m=Math.floor(left/60000),s=Math.floor((left%60000)/1000);$('qrExpiry').textContent=left>0?`Vence en ${m}:${String(s).padStart(2,'0')}`:'QR vencido · genera uno nuevo';if(left<=0){clearInterval(qrTimer);qrTimer=null}};
 tick();qrTimer=setInterval(tick,1000);
}
function qrDataUrl(){const canvas=$('checkinQrCode').querySelector('canvas');if(canvas)return canvas.toDataURL('image/png');return $('checkinQrCode').querySelector('img')?.src||''}
function downloadCheckinQr(){const data=qrDataUrl();if(!data)return toast('El QR todavía no está listo',true);const a=document.createElement('a');a.href=data;a.download='E-Fleet-QR-Checkin-'+String($('qrVehicleName').textContent||'vehiculo').split('·')[0].trim().replace(/[^A-Za-z0-9_-]/g,'')+'.png';a.click()}
function printCheckinQr(){const data=qrDataUrl();if(!data)return toast('El QR todavía no está listo',true);const w=window.open('','_blank','width=620,height=760');if(!w)return toast('Permite ventanas emergentes para imprimir',true);w.document.write(`<!doctype html><html><head><title>QR Checklist E-Fleet</title><style>body{font-family:Arial;text-align:center;padding:34px;color:#101828}.sheet{border:2px solid #101828;border-radius:22px;padding:28px}img{width:320px;height:320px}.tag{font-weight:900;letter-spacing:1px}.muted{color:#667085}</style></head><body><div class="sheet"><div class="tag">E-FLEET · CHECK-IN TÉCNICO</div><h1>${esc($('qrVehicleName').textContent)}</h1><p><strong>${esc($('qrDriverName')?.textContent||'Conductor asignado')}</strong></p><img src="${data}"><h2>QR temporal · 15 minutos</h2><p class="muted">Empresa: ${esc(S.company?.nombre||'')}</p></div><script>onload=()=>{print();setTimeout(()=>close(),500)}<\/script></body></html>`);w.document.close()}
function closeCheckinQr(){if(qrTimer){clearInterval(qrTimer);qrTimer=null}$('qrModal').classList.add('hidden')}


async function loadCompanyModule(render=true){
 try{
  const j=await api('CONFIGURACION_EMPRESA',{},true),c=j.row||{};S.companyConfig=c;
  const name=c.nombre_fantasia||c.razon_social||S.company?.nombre||'Empresa';
  if($('companyNameHeader'))$('companyNameHeader').textContent=name;
  const logo=c.logoUrl||c.logo_url||'';window.EFLEET_ACTIVE_COMPANY={nombre:name,rut:S.company?.rut||'',logoUrl:logo};
  if($('companyLogoHeader')){if(logo){$('companyLogoHeader').src=logo;$('companyLogoHeader').classList.remove('hidden')}else $('companyLogoHeader').classList.add('hidden')}
  if(!render||!$('companyDisplayName'))return;
  $('companyDisplayName').textContent=name;$('companyDisplayRut').textContent=S.company?.rut||'';$('companyStateBadge').textContent=S.company?.estado||'ACTIVA';
  if(logo){$('companyLogoPreview').src=logo;$('companyLogoPreview').classList.remove('hidden');$('companyLogoPlaceholder').classList.add('hidden')}else{$('companyLogoPreview').classList.add('hidden');$('companyLogoPlaceholder').classList.remove('hidden')}
  $('companyLegalName').value=c.razon_social||S.company?.nombre||'';$('companyTradeName').value=c.nombre_fantasia||'';$('companyAddress').value=c.direccion||'';$('companyPhone').value=c.telefono||'';$('companyEmail').value=c.correo||'';
  $('companySpeedAlert').value=c.limite_velocidad_alerta_kmh??90;$('companySpeedExcess').value=c.limite_velocidad_exceso_kmh??100;$('companyMaintenanceWarn').value=c.alerta_mantencion_preventiva_km??1000;$('companyMaintenanceUrgent').value=c.alerta_mantencion_urgente_km??500;
  const editable=permissionAllowed('EMPRESA','EDITAR')&&isManagement();document.querySelectorAll('#view-empresa input').forEach(x=>{if(x.id!=='companyLogoFile')x.disabled=!editable});$('btnSaveCompany').classList.toggle('hidden',!editable);$('btnCompanyLogo').classList.toggle('hidden',!permissionAllowed('EMPRESA','LOGO')||!isManagement());
 }catch(e){console.warn('empresa',e);if(render)toast('Empresa: '+e.message,true)}
}
async function saveCompanyModule(){const b=$('btnSaveCompany');loading(b,true);try{await api('GUARDAR_CONFIGURACION_EMPRESA',{row:{razon_social:$('companyLegalName').value,nombre_fantasia:$('companyTradeName').value,direccion:$('companyAddress').value,telefono:$('companyPhone').value,correo:$('companyEmail').value,limite_velocidad_alerta_kmh:Number($('companySpeedAlert').value||0),limite_velocidad_exceso_kmh:Number($('companySpeedExcess').value||0),alerta_mantencion_preventiva_km:Number($('companyMaintenanceWarn').value||0),alerta_mantencion_urgente_km:Number($('companyMaintenanceUrgent').value||0)}});toast('Datos de empresa guardados');await loadCompanyModule()}catch(e){toast('Empresa: '+e.message,true)}finally{loading(b,false)}}
async function uploadCompanyLogo(file){if(!file)return;const b=$('btnCompanyLogo');loading(b,true);try{if(file.size>5*1024*1024)throw new Error('LOGO_MAXIMO_5MB');const base64=await fileToBase64(file);await api('SUBIR_LOGO_EMPRESA',{base64,mime:file.type,nombreArchivo:file.name});toast('Logo de empresa actualizado');await loadCompanyModule()}catch(e){toast('Logo: '+e.message,true)}finally{loading(b,false);$('companyLogoFile').value=''}}

async function openCheckinSchedule(){
 await ensureCatalogs();$('modalTitle').textContent='Programar Checklist';activeForm=null;activeRecord=null;
 const defaultDate=new Date(Date.now()+3600000);defaultDate.setMinutes(0,0,0);const local=new Date(defaultDate.getTime()-defaultDate.getTimezoneOffset()*60000).toISOString().slice(0,16);
 $('modalBody').innerHTML=`<div class="record-form-intro"><span>PROGRAMACIÓN</span><p>Agenda el Checklist desde su módulo protagonista.</p></div><div class="record-form-grid"><div class="form-field"><label>Vehículo</label><select id="scheduleVehicle">${S.vehicles.map(v=>`<option value="${esc(v.id)}">${esc(v.patente)} · ${esc(v.marca||'')} ${esc(v.modelo||'')}</option>`).join('')}</select></div><div class="form-field"><label>Conductor</label><select id="scheduleDriver"><option value="">Sin conductor</option>${S.drivers.map(d=>`<option value="${esc(d.id)}">${esc(d.nombre)}</option>`).join('')}</select></div><div class="form-field"><label>Fecha y hora</label><input id="scheduleAt" type="datetime-local" value="${local}"></div><div class="form-field form-span-full"><label>Instrucciones</label><textarea id="scheduleNotes" rows="3" placeholder="Motivo, lugar o indicaciones"></textarea></div></div>`;
 $('modalSave').classList.remove('hidden');$('modalSave').textContent='Programar Checklist';$('modalSave').onclick=saveCheckinSchedule;openOverlay('modal');
}
async function saveCheckinSchedule(){const b=$('modalSave');loading(b,true);try{const veh=$('scheduleVehicle').value,driver=$('scheduleDriver').value||null,at=$('scheduleAt').value;if(!veh||!at)throw new Error('VEHICULO_Y_FECHA_REQUERIDOS');const iso=new Date(at).toISOString();await api('guardar',{recurso:'CHECKIN_PROGRAMACIONES',row:{id:'CIP-'+crypto.randomUUID().toUpperCase(),vehiculo_id:veh,conductor_id:driver,programado_para:iso,estado:'PROGRAMADO',observaciones:$('scheduleNotes').value}});closeModal();toast('Checklist programado');await loadCheckin()}catch(e){toast('Programación: '+e.message,true)}finally{loading(b,false)}}
function guidedEvidenceEntries(){return [...document.querySelectorAll('[data-guided-evidence]')].map(input=>({tipo:input.dataset.guidedEvidence,file:input.files?.[0]||null,label:input.dataset.guidedLabel||input.dataset.guidedEvidence}));}
function missingGuidedEvidence(){return guidedEvidenceEntries().filter(x=>!x.file).map(x=>x.label)}
function updateGuidedEvidenceHint(){const guided=guidedEvidenceEntries(),done=guided.filter(x=>x.file).length,extra=$('ciEvidenceFiles')?.files?.length||0,missing=guided.filter(x=>!x.file).map(x=>x.label);if($('ciEvidenceHint'))$('ciEvidenceHint').textContent=`Evidencia guiada ${done}/${guided.length} · ${extra} adicional(es)${missing.length?` · faltan ${missing.join(', ')} · no bloqueante`:' · completa'}`;document.querySelectorAll('[data-guided-evidence]').forEach(i=>i.closest('.guided-photo')?.classList.toggle('has-file',Boolean(i.files?.[0])))}
async function uploadCheckinEvidenceFiles(checkinId,vehicleId){
 const guided=guidedEvidenceEntries().filter(x=>x.file).map(x=>({file:x.file,tipo:x.tipo}));const extra=[...($('ciEvidenceFiles')?.files||[])].slice(0,8).map(file=>({file,tipo:file.type==='application/pdf'?'PDF':'FOTO_ADICIONAL'}));const files=[...guided,...extra].slice(0,14);let uploaded=0,failed=[];
 for(const entry of files){const file=entry.file;try{
   if(file.size>12*1024*1024)throw new Error('ARCHIVO_MAXIMO_12MB');
   const base64=await fileToBase64(file);await api('SUBIR_EVIDENCIA_CHECKIN',{checkin_id:checkinId,vehiculo_id:vehicleId,base64,mime:file.type,nombreArchivo:file.name,tipo:entry.tipo});uploaded++;
  }catch(e){failed.push({nombre:file.name,tipo:entry.tipo,error:String(e.message||e)});console.warn('[checkin][evidencia no bloqueante]',file.name,e)}
 }
 return{uploaded,failed,total:files.length};
}
async function openCheckinEvidence(id){try{const j=await api('VER_EVIDENCIA_CHECKIN',{id});if(!j.url)throw new Error('EVIDENCIA_NO_DISPONIBLE');window.open(j.url,'_blank','noopener')}catch(e){toast('Evidencia: '+e.message,true)}}

async function loadCheckinHistory(){
 await ensureCatalogs();let j;
 try{j=await api('listar',{recurso:'HISTORIAL_CHECKIN',limit:500})}
 catch(e){if(['RECURSO_NO_DISPONIBLE','ACCION_NO_DISPONIBLE'].includes(String(e.message||'').toUpperCase()))j=await api('listar',{recurso:'CHECKINS',limit:500});else throw e}
 S.checkinHistory=j.rows||[];const sel=$('checkinHistoryVehicle'),keep=sel?.value||'';if(sel){sel.innerHTML='<option value="">Todos los vehículos</option>'+S.vehicles.map(v=>`<option value="${esc(v.id)}">${esc(v.patente)}</option>`).join('');sel.value=keep}populateAdvancedFilter('checkinhistorial',S.checkinHistory);renderCheckinHistory();
}
function filteredCheckinHistory(){return advancedFilteredRows('checkinhistorial',S.checkinHistory||[])}
function renderCheckinHistory(){const rows=filteredCheckinHistory(),approved=rows.filter(x=>String(x.estado||'').toUpperCase()==='APROBADO'||String(x.aprobacion_directa||'').toUpperCase()==='SI'||String(x.aprobacion_automatica||'').toUpperCase()==='SI').length,noApto=rows.filter(x=>String(x.resultado_tecnico||'').toUpperCase().includes('NO APTO')).length;$('checkinHistoryKpis').innerHTML=ringKpi('Inspecciones',rows.length,Math.min(100,rows.length*2),'blue','Historial filtrado')+ringKpi('Aprobados',approved,rows.length?approved/rows.length*100:0,'green','Operacionales')+ringKpi('No aptos',noApto,rows.length?noApto/rows.length*100:0,noApto?'red':'green','Requieren atención');$('checkinHistoryRows').innerHTML=rows.length?rows.map(checkinHistoryCard).join(''):'<div class="notification-empty">No hay Checklist para los filtros seleccionados.</div>'}
function checkinHistoryCard(x){const v=S.vehicles.find(v=>v.id===x.vehiculo_id)||{},d=S.drivers.find(d=>d.id===x.conductor_id)||{},vehicleLabel=x.vehiculo_patente||v.patente||'Vehículo asociado',driverLabel=x.conductor_nombre||d.nombre||'Sin conductor',approved=String(x.estado||'').toUpperCase()==='APROBADO'||String(x.aprobacion_directa||'').toUpperCase()==='SI'||String(x.aprobacion_automatica||'').toUpperCase()==='SI';return `<article class="history-check-card"><div class="history-check-head"><div><strong>${esc(vehicleLabel)}</strong><small>${esc(driverLabel)}</small></div><span class="badge ${String(x.resultado_tecnico||'').includes('NO APTO')?'danger':String(x.resultado_tecnico||'').includes('OBS')?'warn':'ok'}">${esc(x.resultado_tecnico||x.estado||'PENDIENTE')}</span></div><div class="history-check-grid"><span><small>Fecha</small><strong>${esc(x.fecha_inicio?new Date(x.fecha_inicio).toLocaleString('es-CL'):'—')}</strong></span><span><small>KM</small><strong>${Number(x.kilometraje||0).toLocaleString('es-CL')}</strong></span><span><small>Aprobación</small><strong>${approved?'APROBADO':'PENDIENTE'}</strong></span></div><p>${esc(x.observacion_general||'Sin observación general')}</p><div class="card-actions"><button class="mini detail" data-checkin-detail="${esc(x.id)}">Ver inspección</button><button class="mini detail" data-checkin-pdf="${esc(x.id)}" title="Exportar PDF" aria-label="Exportar PDF">📄</button>${permissionAllowed('CHECKIN','APROBAR_DIRECTO')&&!approved?`<button class="mini approve" data-approve-checkin="${esc(x.id)}">✓ Aprobar directo</button>`:''}</div></article>`}
async function loadCheckinApprovals(){if(!isManagement())return showView('checkin');await ensureCatalogs();const j=await api('listar',{recurso:'CHECKINS',limit:500});S.checkinHistory=j.rows||[];populateAdvancedFilter('checkinaprobaciones',S.checkinHistory);renderCheckinApprovals()}
function renderCheckinApprovals(){const all=(S.checkinHistory||[]).filter(x=>String(x.requiere_decision||'').toUpperCase()==='SI'||String(x.estado||'').toUpperCase()==='PENDIENTE_DECISION'),rows=advancedFilteredRows('checkinaprobaciones',all),noApto=rows.filter(x=>String(x.resultado_tecnico||'').toUpperCase().includes('NO APTO')).length;$('checkinApprovalKpis').innerHTML=ringKpi('Pendientes',rows.length,Math.min(100,rows.length*8),'amber','Por revisar')+ringKpi('No aptos',noApto,rows.length?noApto/rows.length*100:0,noApto?'red':'green','Resultado técnico conservado');$('checkinApprovalRows').innerHTML=rows.length?rows.map(checkinHistoryCard).join(''):'<div class="notification-empty">No hay Checklist pendientes para estos filtros.</div>'}

async function loadWorkshops(){const j=await api('listar',{recurso:'TALLERES',limit:300});S.talleres=j.rows||[];S.rows.TALLERES=S.talleres;populateAdvancedFilter('talleres',S.talleres);renderWorkshops()}
function renderWorkshops(){const rows=advancedFilteredRows('talleres',S.talleres||[]),active=rows.filter(x=>String(x.estado||'').toUpperCase()==='ACTIVO').length,avg=rows.length?rows.reduce((a,x)=>a+Number(x.calidad_porcentaje||100),0)/rows.length:0;$('workshopKpis').innerHTML=ringKpi('Talleres',rows.length,Math.min(100,rows.length*10),'blue','Filtrados')+ringKpi('Activos',active,rows.length?active/rows.length*100:0,'green','Disponibles')+ringKpi('Calidad promedio',`${Math.round(avg)}%`,avg,avg<70?'red':avg<85?'amber':'green','Reparación');$('talleresRows').innerHTML=rows.length?rows.map(x=>`<article class="workshop-card"><div class="workshop-head"><span>🏭</span><div><h4>${esc(x.nombre)}</h4><p>${esc(x.especialidad||'Taller general')}</p></div><span class="badge ${String(x.estado).toUpperCase()==='ACTIVO'?'ok':'warn'}">${esc(x.estado||'ACTIVO')}</span></div><div class="workshop-info"><span class="workshop-address"><small>DIRECCIÓN</small><strong>${esc(x.direccion_normalizada||x.direccion||'Sin dirección')}</strong>${x.comuna||x.ciudad?`<em>${esc([x.comuna,x.ciudad].filter(Boolean).join(' · '))}</em>`:''}</span><span><small>TELÉFONO</small><strong>${esc(x.telefono||'—')}</strong></span><span><small>CONTACTO</small><strong>${esc(x.contacto||x.correo||'—')}</strong></span><span><small>CALIDAD</small><strong>${Number(x.calidad_porcentaje||100).toLocaleString('es-CL')}%</strong></span></div><div class="card-actions"><button class="mini detail" data-workshop-map="${esc(x.id)}">📍 Ver ubicación</button></div>${adminActions('taller',x.id)}</article>`).join(''):'<div class="notification-empty">No hay talleres para los filtros seleccionados.</div>'}
function openWorkshopMap(id){const t=S.talleres.find(x=>String(x.id)===String(id));if(!t)return;const q=(t.latitud!=null&&t.longitud!=null)?`${t.latitud},${t.longitud}`:(t.direccion||t.nombre);window.open('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q),'_blank','noopener')}


function speedRoleAllowed(){return ['ROL-ADMIN','ROL-GERENCIA','ROL-OPERADOR'].includes(roleId())}
function speedDate(v){try{return v?new Date(v).toLocaleString('es-CL',{timeZone:'America/Santiago'}):''}catch{return String(v||'')}}
function speedEventCard(x){return `<article class="speed-event-card"><div class="speed-event-title"><strong>🚨 Exceso de velocidad</strong><span class="badge">${esc(x.nivel||'ALERTA')}</span></div><div class="speed-event-grid"><span><small>Vehículo</small><strong>${esc(x.vehiculo_patente||vehicleName(x.vehiculo_id)||'—')}</strong></span><span><small>Conductor</small><strong>${esc(x.conductor_nombre||driverName(x.conductor_id)||'—')}</strong></span><span><small>Velocidad</small><strong>${esc(x.velocidad_kmh||0)} km/h</strong></span><span><small>Límite</small><strong>${esc(x.limite_kmh||0)} km/h</strong></span><span><small>Exceso</small><strong>+${esc(x.exceso_kmh||0)} km/h</strong></span><span><small>Fecha/Hora</small><strong>${esc(speedDate(x.fecha_hora))}</strong></span></div><div class="speed-address"><small>Dirección</small><strong>${esc(x.direccion||'Dirección no disponible')}</strong></div></article>`}
function speedSearchText(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ')}
function prepareSpeedSearchIndex(){for(const v of (S.vehicles||[]))v._speedSearch=speedSearchText([v.patente,v.marca,v.modelo].filter(Boolean).join(' '))}
function filteredSpeedVehicles(){const q=speedSearchText($('speedVehicleSearch')?.value),tokens=q.split(' ').filter(Boolean);if(!tokens.length)return S.vehicles||[];return (S.vehicles||[]).filter(v=>{const hay=v._speedSearch||speedSearchText([v.patente,v.marca,v.modelo].filter(Boolean).join(' '));return tokens.every(t=>hay.includes(t))})}
function speedLimitCardHtml(v){return `<article class="speed-limit-card"><div><small>PATENTE</small><h4>${esc(v.patente||'Vehículo')}</h4><p>${esc([v.marca,v.modelo].filter(Boolean).join(' '))}</p></div><label>Límite individual km/h<input type="number" min="10" max="220" step="1" value="${esc(v.limite_velocidad_kmh??'')}" placeholder="Heredado"></label><button class="primary" type="button" data-speed-limit-save="${esc(v.id)}">Guardar límite individual</button></article>`}
function paintSpeedVehicleLimits(rows,totalMatched,queryActive=false){const box=$('speedVehicleLimits');if(!box)return;const html=rows.map(speedLimitCardHtml).join('');const clipped=queryActive&&totalMatched>rows.length?`<div class="speed-filter-note">Mostrando ${rows.length} de ${totalMatched} coincidencias. Escribe más caracteres para afinar.</div>`:'';box.innerHTML=html+(totalMatched?clipped:`<div id="speedNoResults" class="notification-empty">No se encontraron vehículos para la patente, marca o modelo buscado.</div>`);updateSpeedBulkHint(totalMatched)}
function renderSpeedVehicleLimits(){prepareSpeedSearchIndex();const rows=S.vehicles||[];paintSpeedVehicleLimits(rows,rows.length,false)}
function applySpeedVehicleFilter(){const q=speedSearchText($('speedVehicleSearch')?.value);if(!q){const rows=S.vehicles||[];paintSpeedVehicleLimits(rows,rows.length,false);return}const matches=filteredSpeedVehicles();const MAX_RENDER=60;paintSpeedVehicleLimits(matches.slice(0,MAX_RENDER),matches.length,true)}
function executeSpeedVehicleSearch(){requestAnimationFrame(applySpeedVehicleFilter)}
function updateSpeedBulkHint(visibleOverride){const all=$('speedSelectAll'),input=$('speedGlobalLimit'),button=$('speedApplyGlobal'),hint=$('speedBulkHint');if(!all||!input||!button||!hint)return;const active=all.checked,total=(S.vehicles||[]).length,visible=Number.isFinite(Number(visibleOverride))?Number(visibleOverride):filteredSpeedVehicles().length;input.disabled=!active;button.disabled=!active;hint.classList.toggle('is-global',active);hint.textContent=active?`Seleccionar todo activo: el límite global se aplicará a los ${total} vehículo(s) de la flota, aunque el buscador esté filtrando ${visible}.`:`Seleccionar todo desactivado: cada vehículo utilizará su límite individual parametrizado por patente. Vehículos visibles: ${visible}.`;}
async function loadSpeedModule(){
 if(!speedRoleAllowed()){toast('Tu perfil no tiene acceso al módulo Velocidad',true);return showView('dashboard')}
 const [vj,ej]=await Promise.all([api('LISTAR',{recurso:'VEHICULOS',limit:300}),api('LISTAR',{recurso:'EVENTOS_VELOCIDAD',limit:200})]);
 S.vehicles=vj.rows||S.vehicles||[];S.rows.EVENTOS_VELOCIDAD=ej.rows||[];
 const eventBox=$('speedEvents');if(!eventBox)return;
 renderSpeedVehicleLimits();
 eventBox.innerHTML=S.rows.EVENTOS_VELOCIDAD.length?S.rows.EVENTOS_VELOCIDAD.map(speedEventCard).join(''):'<div class="notification-empty">No hay excesos de velocidad registrados.</div>';
}
async function saveVehicleSpeedLimit(button){const card=button.closest('.speed-limit-card'),input=card?.querySelector('input'),limit=Number(input?.value||0);if(limit<10||limit>220)return toast('Ingresa un límite entre 10 y 220 km/h',true);loading(button,true);try{await api('CONFIGURAR_LIMITE_VELOCIDAD',{vehiculo_id:button.dataset.speedLimitSave,limite_kmh:limit});toast('Límite individual guardado');await loadSpeedModule()}catch(e){toast('Velocidad: '+e.message,true)}finally{loading(button,false)}}
async function applyGlobalSpeedLimit(){const check=$('speedSelectAll'),input=$('speedGlobalLimit'),button=$('speedApplyGlobal'),limit=Number(input?.value||0);if(!check?.checked)return toast('Activa Seleccionar todo para aplicar un límite global',true);if(limit<10||limit>220)return toast('Ingresa una velocidad máxima entre 10 y 220 km/h',true);const total=(S.vehicles||[]).length;if(!total)return toast('No hay vehículos disponibles',true);if(!confirm(`Se aplicará ${limit} km/h como velocidad máxima a ${total} vehículo(s). ¿Continuar?`))return;loading(button,true);try{const j=await api('CONFIGURAR_LIMITE_VELOCIDAD_MASIVO',{seleccionar_todo:true,limite_kmh:limit});toast(`Límite global aplicado a ${Number(j.actualizados??j.total??total)} vehículo(s)`);await loadSpeedModule()}catch(e){toast('Velocidad: '+e.message,true)}finally{loading(button,false)}}

function currentViewRows(){const v=document.querySelector('#nav button.active')?.dataset.view||'dashboard';const maps={vehiculos:advancedFilteredRows('vehiculos',S.vehicles),conductores:advancedFilteredRows('conductores',S.drivers),asignaciones:advancedFilteredRows('asignaciones',S.assignments||[]),documentos:advancedFilteredRows('documentos',S.documents||[]),checkin:S.rows.CHECKINS||[],checkinhistorial:filteredCheckinHistory(),checkinaprobaciones:advancedFilteredRows('checkinaprobaciones',(S.checkinHistory||[]).filter(x=>String(x.requiere_decision||'').toUpperCase()==='SI'||String(x.estado||'').toUpperCase()==='PENDIENTE_DECISION')),fallas:advancedFilteredRows('fallas',S.rows.FALLAS||[]),mantenciones:advancedFilteredRows('mantenciones',S.rows.MANTENCIONES||[]),ordenes:advancedFilteredRows('ordenes',S.orders||S.rows.ORDENES_TRABAJO||[]),historial:advancedFilteredRows('historial',S.history||S.rows.MANTENCIONES||[]),talleres:advancedFilteredRows('talleres',S.talleres||[]),predicciones:advancedFilteredRows('predicciones',S.rows.PREDICCIONES||[]),notificaciones:advancedFilteredRows('notificaciones',S.notifications||[]),combustible:advancedFilteredRows('combustible',S.rows.COMBUSTIBLE||[]),velocidad:advancedFilteredRows('velocidad',S.rows.EVENTOS_VELOCIDAD||[]),usuarios:advancedFilteredRows('usuarios',S.users||[]),presupuesto:S.budgetReportRows||[],reportes:S.reportRows||[],auditoria:advancedFilteredRows('auditoria',S.auditRows||[]),perfiles:S.roleProfiles||[],empresa:S.companyConfig?[S.companyConfig]:[]};return{view:v,rows:(maps[v]||[]).map(reportNormalizeRow)}}
function exportCurrentView(kind){const {view,rows}=currentViewRows();if(!rows.length)return toast('Este módulo no tiene datos cargados para exportar',true);const title=(document.querySelector('#nav button.active')?.textContent||view).replace(/^\S+\s*/,'').trim(),stamp=chileDayKey(),file=`E-Fleet_${title.replace(/[^A-Za-z0-9ÁÉÍÓÚáéíóúÑñ]+/g,'_')}_${stamp}`;S.reportRows=rows;if(kind==='XLSX')EFleetExport.toXlsx(file+'.xlsx',reportExportRows(),title.slice(0,28));else EFleetExport.toPdf(file+'.pdf',`E-Fleet · ${title}`,reportExportRows(),`${S.company?.nombre||''} · ${S.company?.rut||''}`)}


async function downloadCheckinPdf(id){const row=(S.rows.CHECKINS||S.checkinHistory||[]).find(x=>String(x.id)===String(id))||(S.checkinHistory||[]).find(x=>String(x.id)===String(id));if(!row)return toast('Checklist no encontrado',true);try{const it=await api('listar',{recurso:'CHECKIN_ITEMS',checkin_id:id,limit:100});const v=S.vehicles.find(v=>v.id===row.vehiculo_id)||{},d=S.drivers.find(d=>d.id===row.conductor_id)||{},rows=[{Punto:'RESUMEN',Estado:row.resultado_tecnico||row.estado,Detalle:`${row.vehiculo_patente||v.patente||'Vehículo asociado'} · ${row.conductor_nombre||d.nombre||'Sin conductor'} · ${Number(row.kilometraje||0).toLocaleString('es-CL')} km`},...(it.rows||[]).map(x=>({Punto:x.nombre||x.codigo,Estado:x.estado,Detalle:x.observacion||x.criticidad||''}))];EFleetExport.toPdf(`E-Fleet_Checkin_${String(v.patente||id).replace(/[^A-Za-z0-9_-]/g,'')}.pdf`,'E-Fleet · Informe de Checklist',rows,`${S.company?.nombre||''} · ${row.fecha_inicio?new Date(row.fecha_inicio).toLocaleString('es-CL'):''}`)}catch(e){toast('PDF Checklist: '+e.message,true)}}

const REPORT_LABELS={CHECKINS:'Checklist',MANTENCIONES:'Mantenciones',ORDENES_TRABAJO:'Órdenes de servicio',FALLAS:'Fallas',TALLERES:'Talleres',VEHICULOS:'Vehículos',COMBUSTIBLE:'Combustible',EVENTOS_VELOCIDAD:'Velocidad',DOCUMENTOS:'Documentos',PREDICCIONES:'Análisis predictivo',USUARIOS:'Usuarios',PRESUPUESTO_OPERACIONAL:'Presupuesto Operacional'};
async function loadReports(){if(!S.companyConfig)await loadCompanyModule(false);const type=$('reportType')?.value||'CHECKINS';if(type==='USUARIOS'&&!isManagement()){$('reportType').value='CHECKINS';return loadReports()}if(type==='PRESUPUESTO_OPERACIONAL'){if(!isManagement()){$('reportType').value='CHECKINS';return loadReports()}const y=Number($('budgetYear')?.value||chileDayKey().slice(0,4)),m=Number($('budgetMonth')?.value||chileDayKey().slice(5,7));const j=await api('PRESUPUESTO_REPORTE',{anio:y,mes:m},true);S.reportRows=(j.rows||[]).map(reportNormalizeRow);S.budgetReportRows=S.reportRows.slice();populateAdvancedFilter('reportes',S.reportRows);renderReport();return}await ensureCatalogs();if(isManagement()&&!S.users.length){try{const u=await api('listar',{recurso:'USUARIOS',limit:500});S.users=u.rows||[]}catch{}}if(!S.talleres.length){try{const t=await api('listar',{recurso:'TALLERES',limit:500});S.talleres=t.rows||[]}catch{}}const j=await api('listar',{recurso:type,limit:500});S.reportRows=(j.rows||[]).map(reportNormalizeRow);populateAdvancedFilter('reportes',S.reportRows);renderReport()}
function userName(id){if(!id)return'';if(String(id)===String(S.user?.id||''))return S.user?.nombre||'Usuario actual';const u=S.users.find(u=>String(u.id)===String(id));return u?.nombre||'Usuario asociado'}
function driverName(id){if(!id)return'';const d=S.drivers.find(d=>String(d.id)===String(id));return d?.nombre||'Conductor asociado'}
function workshopName(id){if(!id)return'';const t=S.talleres.find(t=>String(t.id)===String(id));return t?.nombre||'Taller asociado'}
function reportNormalizeRow(x){
 const out={...x};
 if(out.vehiculo_id){out.vehiculo=out.vehiculo_patente||vehicleName(out.vehiculo_id);delete out.vehiculo_id}
 if(out.conductor_id){out.conductor=out.conductor_nombre||driverName(out.conductor_id);delete out.conductor_id}
 if(out.usuario_id){out.usuario=out.usuario_nombre||userName(out.usuario_id);delete out.usuario_id}
 if(out.creado_por){out.creado_por_nombre=out.creado_por_nombre||userName(out.creado_por);delete out.creado_por}
 if(out.aprobado_por){out.aprobado_por_nombre=out.aprobado_por_nombre||userName(out.aprobado_por);delete out.aprobado_por}
 if(out.taller_id){out.taller=out.taller_nombre||workshopName(out.taller_id);delete out.taller_id}
 delete out.empresa_id;delete out.eliminado;delete out.permisos_personalizados;delete out.permisosRol;
 for(const k of Object.keys(out)){if(/(^id$|_id$)/i.test(k))delete out[k]}
 return out
}
function reportKpiHtml(type,rows){
 const total=rows.length,pct=n=>total?Math.round(n/total*100):0,sum=k=>rows.reduce((a,x)=>a+Number(x[k]||0),0),avg=k=>total?rows.reduce((a,x)=>a+Number(x[k]||0),0)/total:0,up=v=>String(v||'').toUpperCase();
 if(type==='CHECKINS'){const apt=rows.filter(x=>up(x.resultado_tecnico||x.estado).includes('APTO')&&!up(x.resultado_tecnico||x.estado).includes('NO APTO')).length,obs=rows.filter(x=>/OBS/.test(up(x.resultado_tecnico||x.estado))).length,no=rows.filter(x=>/NO APTO/.test(up(x.resultado_tecnico||x.estado))).length,approved=rows.filter(x=>up(x.estado)==='APROBADO'||up(x.aprobacion_directa)==='SI'||up(x.aprobacion_automatica)==='SI').length;return ringKpi('Checklist',total,Math.min(100,total*4),'blue','Registros')+ringKpi('Aptos',apt,pct(apt),'green',pct(apt)+'%')+ringKpi('Observados',obs,pct(obs),'amber',pct(obs)+'%')+ringKpi('No aptos',no,pct(no),no?'red':'green','Riesgo')+ringKpi('Aprobados',approved,pct(approved),'blue',pct(approved)+'%');}
 if(type==='MANTENCIONES'){const pending=rows.filter(x=>!['COMPLETADA','CERRADA','ANULADA'].includes(up(x.estado))).length,over=rows.filter(x=>up(x.estado)==='VENCIDA'||(x.fecha_programada&&new Date(x.fecha_programada)<new Date()&&!['COMPLETADA','CERRADA','ANULADA'].includes(up(x.estado)))).length,done=rows.filter(x=>['COMPLETADA','CERRADA'].includes(up(x.estado))).length,cost=sum('costo_total');return ringKpi('Mantenciones',total,Math.min(100,total*5),'blue','Total')+ringKpi('Pendientes',pending,pct(pending),pending?'amber':'green','Por gestionar')+ringKpi('Vencidas',over,pct(over),over?'red':'green','Urgentes')+ringKpi('Completadas',done,pct(done),'green',pct(done)+'%')+ringKpi('Costo','$'+Math.round(cost).toLocaleString('es-CL'),Math.min(100,cost/1000000*100),'blue','Acumulado');}
 if(type==='ORDENES_TRABAJO'){const open=rows.filter(x=>!['COMPLETADA','CERRADA','ANULADA'].includes(up(x.estado))).length,urgent=rows.filter(x=>/URG|CRIT|ALTA/.test(up(x.prioridad))).length,closed=total-open,cost=rows.reduce((a,x)=>a+Number(x.costo_total||x.costo_real||0),0);return ringKpi('Órdenes',total,Math.min(100,total*6),'blue','Total')+ringKpi('Abiertas',open,pct(open),open?'amber':'green','En curso')+ringKpi('Prioritarias',urgent,pct(urgent),urgent?'red':'green','Atención')+ringKpi('Cerradas',closed,pct(closed),'green',pct(closed)+'%')+ringKpi('Costo','$'+Math.round(cost).toLocaleString('es-CL'),Math.min(100,cost/1000000*100),'blue','OT filtradas');}
 if(type==='FALLAS'){const open=rows.filter(x=>!['RESUELTA','VERIFICADA','CERRADA','ANULADA','DESCARTADA'].includes(up(x.estado))).length,critical=rows.filter(x=>/CRIT|URG/.test(up(x.criticidad||x.severidad))&&!['CERRADA','ANULADA'].includes(up(x.estado))).length,re=rows.filter(x=>up(x.reincidente)==='SI'||Number(x.reincidencias||0)>0).length,res=rows.filter(x=>['RESUELTA','VERIFICADA','CERRADA'].includes(up(x.estado))).length;return ringKpi('Fallas',total,Math.min(100,total*6),'blue','Total')+ringKpi('Abiertas',open,pct(open),open?'amber':'green','Activas')+ringKpi('Críticas',critical,pct(critical),critical?'red':'green','Seguridad')+ringKpi('Reincidentes',re,pct(re),re?'amber':'green','Tendencia')+ringKpi('Resueltas',res,pct(res),'green',pct(res)+'%');}
 if(type==='TALLERES'){const active=rows.filter(x=>up(x.estado||'ACTIVO')==='ACTIVO').length,quality=avg('calidad_porcentaje');return ringKpi('Talleres',total,Math.min(100,total*10),'blue','Registrados')+ringKpi('Activos',active,pct(active),'green','Disponibles')+ringKpi('Calidad',Math.round(quality)+'%',quality,quality<70?'red':quality<85?'amber':'green','Promedio')+ringKpi('Cobertura',total?100:0,total?100:0,'blue','Red técnica');}
 if(type==='VEHICULOS'){const active=rows.filter(x=>/ACTIVO|OPERATIVO|DISPONIBLE/.test(up(x.estado||'ACTIVO'))).length,maint=rows.filter(x=>/MANT|TALLER/.test(up(x.estado))).length,km=Math.round(avg('kilometraje'));return ringKpi('Vehículos',total,Math.min(100,total*5),'blue','Flota')+ringKpi('Operativos',active,pct(active),'green',pct(active)+'%')+ringKpi('En mantención',maint,pct(maint),maint?'amber':'green','Taller')+ringKpi('KM promedio',km.toLocaleString('es-CL'),Math.min(100,km/200000*100),'blue','Uso');}
 if(type==='COMBUSTIBLE'){const liters=sum('litros'),spend=sum('monto_total'),an=rows.filter(x=>up(x.consumo_anomalo)==='SI').length,eff=avg('rendimiento_km_l'),ck=avg('costo_km');return ringKpi('Cargas',total,Math.min(100,total*4),'blue','Registros')+ringKpi('Litros',Math.round(liters).toLocaleString('es-CL'),Math.min(100,liters/1000*100),'amber','Volumen')+ringKpi('Gasto','$'+Math.round(spend).toLocaleString('es-CL'),Math.min(100,spend/2000000*100),'blue','Total')+ringKpi('Rendimiento',eff.toFixed(1)+' km/L',Math.min(100,eff/20*100),'green','Promedio')+ringKpi('Anomalías',an,pct(an),an?'red':'green','Control')+ringKpi('Costo/km','$'+Math.round(ck),Math.min(100,ck/1000*100),'amber','Promedio');}
 if(type==='DOCUMENTOS'){const now=new Date();now.setHours(0,0,0,0);const days=x=>x.fecha_vencimiento?Math.ceil((new Date(String(x.fecha_vencimiento)+'T12:00:00').getTime()-now.getTime())/86400000):99999,expired=rows.filter(x=>days(x)<0).length,priority=rows.filter(x=>days(x)>=0&&days(x)<=15).length,preventive=rows.filter(x=>days(x)>15&&days(x)<=Math.max(30,Number(x.alerta_dias||30))).length,valid=Math.max(0,total-expired-priority-preventive);return ringKpi('Documentos',total,Math.min(100,total*4),'blue','Controlados')+ringKpi('Vigentes',valid,pct(valid),'green',pct(valid)+'%')+ringKpi('Preventiva ≤30',preventive,pct(preventive),preventive?'amber':'green','Renovar')+ringKpi('Prioritaria ≤15',priority,pct(priority),priority?'red':'green','Atención')+ringKpi('Vencidos',expired,pct(expired),expired?'red':'green','Críticos');}
 if(type==='PREDICCIONES'){const active=rows.filter(x=>!['CERRADA','DESCARTADA','ANULADA'].includes(up(x.estado))).length,high=rows.filter(x=>['ALTO','CRITICO','CRÍTICO'].includes(up(x.nivel_riesgo))).length,critical=rows.filter(x=>/CRIT/.test(up(x.nivel_riesgo))).length,avgRisk=total?rows.reduce((a,x)=>a+Number(x.riesgo_porcentaje||0),0)/total:0,maxRisk=rows.reduce((m,x)=>Math.max(m,Number(x.riesgo_porcentaje||0)),0);return ringKpi('Predicciones',total,Math.min(100,total*5),'blue','Historial')+ringKpi('Activas',active,pct(active),'green','Seguimiento')+ringKpi('Alto/Crítico',high,pct(high),high?'red':'green','Intervención')+ringKpi('Críticas',critical,pct(critical),critical?'red':'green','Inmediato')+ringKpi('Riesgo prom.',Math.round(avgRisk)+'%',avgRisk,avgRisk>=50?'red':avgRisk>=25?'amber':'green','Flota')+ringKpi('Riesgo máx.',Math.round(maxRisk)+'%',maxRisk,maxRisk>=75?'red':maxRisk>=50?'amber':'green','Vehículo');}
 if(type==='USUARIOS'){const active=rows.filter(x=>up(x.estado||'ACTIVO')==='ACTIVO').length,mg=rows.filter(x=>['ROL-ADMIN','ROL-GERENCIA'].includes(normalizeRole(x.rol_id))).length,drivers=rows.filter(x=>normalizeRole(x.rol_id)==='ROL-CONDUCTOR').length;return ringKpi('Usuarios',total,Math.min(100,total*5),'blue','Total')+ringKpi('Activos',active,pct(active),'green',pct(active)+'%')+ringKpi('Gestión',mg,pct(mg),'blue','Admin/Gerencia')+ringKpi('Conductores',drivers,pct(drivers),'amber','Operación');}
 if(type==='PRESUPUESTO_OPERACIONAL'){const sumMetric=name=>Number(rows.find(x=>String(x.indicador||'')===name)?.valor||0),month=sumMetric('Presupuesto mes'),executed=sumMetric('Ejecutado mes'),committed=sumMetric('Comprometido mes'),projection=sumMetric('Proyección mes');return ringKpi('Presupuesto mes','$'+Math.round(month).toLocaleString('es-CL'),100,'blue','Configurado')+ringKpi('Ejecutado','$'+Math.round(executed).toLocaleString('es-CL'),month?executed/month*100:0,'green','Gasto real')+ringKpi('Comprometido','$'+Math.round(committed).toLocaleString('es-CL'),month?committed/month*100:0,'amber','OT / mantenciones')+ringKpi('Proyección','$'+Math.round(projection).toLocaleString('es-CL'),month?projection/month*100:0,projection>month?'red':'blue','Cierre estimado');}
 return ringKpi('Registros',total,Math.min(100,total/5),'blue',REPORT_LABELS[type])+ringKpi('Exportación','PDF + XLSX',100,'green','Formato ejecutivo');
}
function renderReport(){const rows=advancedFilteredRows('reportes',S.reportRows||[]),type=$('reportType').value,keys=rows.length?Object.keys(rows[0]).slice(0,12):[];$('reportKpis').innerHTML=reportKpiHtml(type,rows);$('reportTable').innerHTML=rows.length?`<table><thead><tr>${keys.map(k=>`<th>${esc(k.replaceAll('_',' '))}</th>`).join('')}</tr></thead><tbody>${rows.slice(0,200).map(r=>`<tr>${keys.map(k=>`<td>${esc(formatReportValue(r[k]))}</td>`).join('')}</tr>`).join('')}</tbody></table>`:'<div class="notification-empty">Sin datos para este informe.</div>'} 
function formatReportValue(v){if(v==null)return '';if(typeof v==='object')return JSON.stringify(v);if(typeof v==='string'&&/^\d{4}-\d\d-\d\dT/.test(v)){const d=new Date(v);if(!Number.isNaN(d.getTime()))return d.toLocaleString('es-CL')}return String(v)}
function reportExportRows(){return advancedFilteredRows('reportes',S.reportRows||[]).map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,formatReportValue(v)])))}
function exportCurrentReport(kind){const type=$('reportType').value,label=REPORT_LABELS[type]||type,rows=reportExportRows(),stamp=chileDayKey(),filename=`E-Fleet_${label.replace(/\s+/g,'_')}_${stamp}`;if(!rows.length)return toast('No hay datos para exportar',true);if(kind==='XLSX')EFleetExport.toXlsx(filename+'.xlsx',rows,label.slice(0,28));else EFleetExport.toPdf(filename+'.pdf',`E-Fleet · ${label}`,rows,`${S.company?.nombre||''} · ${S.company?.rut||''}`)}


// R1.8.33 · PRESUPUESTO OPERACIONAL · Administración / Gerencia
const BUDGET_MONTHS=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
function budgetMoney(v){return '$'+Math.round(Number(v||0)).toLocaleString('es-CL')}
function budgetPct(v){return `${Number(v||0).toLocaleString('es-CL',{maximumFractionDigits:1})}%`}
function budgetTone(p){p=Number(p||0);return p>=100?'danger':p>=85?'warn':p>=70?'warn':'ok'}
function initBudgetPeriodSelectors(){const now=chileDayKey(),cy=Number(now.slice(0,4));if($('budgetYear')&&!$('budgetYear').options.length){for(let y=cy-3;y<=cy+3;y++)$('budgetYear').add(new Option(String(y),String(y)));$('budgetYear').value=String(cy)}if($('budgetMonth')&&!$('budgetMonth').dataset.init){$('budgetMonth').value=String(Number(now.slice(5,7)));$('budgetMonth').dataset.init='1'}}
async function loadBudget(){
 if(!isManagement())return showView('dashboard');initBudgetPeriodSelectors();const y=Number($('budgetYear')?.value||chileDayKey().slice(0,4)),m=Number($('budgetMonth')?.value||chileDayKey().slice(5,7));
 const j=await api('PRESUPUESTO_RESUMEN',{anio:y,mes:m},true);S.budgetSummary=j;S.budgetReportRows=[];renderBudget(j);
}
function budgetKpi(label,value,detail,tone=''){return `<article class="budget-kpi ${tone}"><small>${esc(label)}</small><strong>${esc(value)}</strong><em>${esc(detail||'')}</em></article>`}
function renderBudget(s){
 const configured=Boolean(s?.configurado);$('budgetEmpty')?.classList.toggle('hidden',configured);$('budgetContent')?.classList.toggle('hidden',!configured);$('btnBudgetAnnul')?.classList.toggle('hidden',!configured);const pill=$('budgetStatusPill');if(!configured){if(pill){pill.textContent='SIN CONFIGURAR';pill.className='budget-status normal'}return}
 const k=s.kpi||{},p=s.presupuesto||{},state=String(k.estado||'NORMAL').toUpperCase(),stateClass=state.includes('CRIT')||state.includes('EXCES')?'critico':state.includes('ALTO')?'alto':state.includes('VIG')?'vigilancia':'normal';if(pill){pill.textContent=state;pill.className='budget-status '+stateClass}
 $('budgetKpis').innerHTML=[budgetKpi('Presupuesto anual',budgetMoney(k.presupuestoAnual),'Límite vigente'),budgetKpi('Ejecutado anual',budgetMoney(k.ejecutadoAnual),budgetPct(k.ejecucionAnualPct),budgetTone(k.ejecucionAnualPct)),budgetKpi('Disponible anual',budgetMoney(k.disponibleAnual),'Ejecutado + comprometido',Number(k.disponibleAnual)<0?'danger':''),budgetKpi('Proyección anual',budgetMoney(k.proyeccionAnual),budgetPct(k.proyeccionAnualPct),budgetTone(k.proyeccionAnualPct)),budgetKpi('Presupuesto mes',budgetMoney(k.presupuestoMes),BUDGET_MONTHS[(s.mes||1)-1]),budgetKpi('Ejecutado mes',budgetMoney(k.ejecutadoMes),budgetPct(k.ejecucionMesPct),budgetTone(k.ejecucionMesPct)),budgetKpi('Comprometido',budgetMoney(k.comprometidoMes),'OT / mantenciones abiertas',budgetTone(k.consumoComprometidoPct)),budgetKpi('Disponible mes',budgetMoney(k.disponibleMes),'Después de compromisos',Number(k.disponibleMes)<0?'danger':''),budgetKpi('Proyección fin de mes',budgetMoney(k.proyeccionMes),budgetPct(k.proyeccionMesPct),budgetTone(k.proyeccionMesPct)),budgetKpi('Desviación a la fecha',budgetMoney(k.desviacionFecha),`Esperado ${budgetMoney(k.esperadoFecha)}`,Number(k.desviacionFecha)>0?'warn':'ok'),budgetKpi('Fondo emergencia',budgetMoney(k.fondoDisponible),`Uso ${budgetPct(k.fondoUsoPct)}`,budgetTone(k.fondoUsoPct>=90?100:k.fondoUsoPct)),budgetKpi('Días de presupuesto',k.diasPresupuestoRestantes==null?'—':Number(k.diasPresupuestoRestantes).toLocaleString('es-CL',{maximumFractionDigits:1}),`Quedan ${Number(k.diasMesRestantes||0)} días del mes`,k.diasPresupuestoRestantes!=null&&Number(k.diasPresupuestoRestantes)<Number(k.diasMesRestantes||0)?'danger':'ok')].join('');
 const proj=Math.max(0,Number(k.proyeccionMesPct||0));$('budgetProjectionValue').textContent=budgetPct(proj);$('budgetProjectionBar').style.width=Math.min(100,proj)+'%';$('budgetAnalysis').innerHTML=(s.analisis||[]).map(x=>`<div>${esc(x)}</div>`).join('');
 const fund=Math.max(0,Number(k.fondoUsoPct||0));$('budgetFundGauge').innerHTML=`<div class="budget-fund-ring" style="--p:${Math.min(100,fund)}%"><div><strong>${budgetPct(fund)}</strong><small>utilizado</small></div></div><div class="budget-fund-meta"><span><small>Total</small><strong>${budgetMoney(k.fondoEmergencia)}</strong></span><span><small>Usado</small><strong>${budgetMoney(k.fondoUtilizado)}</strong></span><span><small>Disponible</small><strong>${budgetMoney(k.fondoDisponible)}</strong></span></div><div class="budget-analysis-note">${esc(p.fondo_emergencia_modo==='ADICIONAL'?'Fondo adicional al presupuesto anual':'Fondo incluido dentro del presupuesto anual')}</div>`;
 $('budgetCategories').innerHTML=(s.categorias||[]).length?(s.categorias||[]).map(c=>`<div class="budget-category-row"><div><strong>${esc(c.nombre)}</strong><small>${budgetMoney(c.consumo)} de ${budgetMoney(c.presupuesto)}</small></div><div><div class="budget-category-bar"><span class="${Number(c.porcentaje)>=100?'excess':Number(c.porcentaje)>=85?'high':''}" style="width:${Math.min(100,Number(c.porcentaje||0))}%"></span></div><div class="budget-category-meta"><span>Ejecutado ${budgetMoney(c.ejecutado)}</span><span>Comprometido ${budgetMoney(c.comprometido)}</span><span>${budgetPct(c.porcentaje)}</span></div></div><button class="mini detail" data-budget-category="${esc(c.categoria)}">Editar</button></div>`).join(''):'<div class="budget-no-data">Sin categorías configuradas.</div>';
 $('budgetVehicles').innerHTML=(s.vehiculos||[]).length?s.vehiculos.map((v,i)=>`<article class="budget-rank-card"><span class="budget-rank-number">${i+1}</span><div><strong>${esc(v.patente)}</strong><small>${esc(v.descripcion||'')} · ${budgetPct(v.participacion_pct)} del gasto</small></div><div class="budget-rank-value"><strong>${budgetMoney(v.gasto)}</strong><small>${v.costo_km!=null?budgetMoney(v.costo_km)+'/km':'sin costo/km'}${v.presupuesto_asignado?` · límite ${budgetMoney(v.presupuesto_asignado)}`:''}</small></div></article>`).join(''):'<div class="budget-no-data">Sin gasto vehicular en el período.</div>';
 $('budgetDrivers').innerHTML=(s.conductores||[]).length?s.conductores.map((d,i)=>`<article class="budget-rank-card"><span class="budget-rank-number">${i+1}</span><div><strong>${esc(d.nombre)}</strong><small>Gasto asociado al conductor · no atribuye causalidad</small></div><div class="budget-rank-value"><strong>${budgetMoney(d.gasto_asociado)}</strong><small>${budgetPct(d.participacion_pct)} del total</small></div></article>`).join(''):'<div class="budget-no-data">Sin gasto asociado a conductores en el período.</div>';
 $('budgetAlerts').innerHTML=(s.alertas||[]).length?s.alertas.slice(0,20).map(a=>`<article class="budget-alert-card ${String(a.severidad||'').toLowerCase()}"><span>⚠</span><div><strong>${esc(a.titulo||a.tipo)}</strong><small>${esc(a.detalle||'')} · ${esc(a.periodo||'')}</small></div><span class="badge">${esc(a.severidad||'')}</span></article>`).join(''):'<div class="budget-no-data">Sin alertas presupuestarias activas.</div>';
 $('budgetTasks').innerHTML=(s.tareas||[]).length?s.tareas.slice(0,20).map(t=>`<article class="budget-task-card"><div><strong>${esc(t.titulo)}</strong><small>${esc(t.descripcion||'')} · ${esc(t.estado||'PENDIENTE')}</small></div><div class="budget-task-actions">${String(t.estado||'').toUpperCase()==='PENDIENTE'?`<button class="mini" data-budget-task="${esc(t.id)}" data-budget-state="EN_PROCESO">Iniciar</button>`:''}${!['COMPLETADA','ANULADA'].includes(String(t.estado||'').toUpperCase())?`<button class="mini approve" data-budget-task="${esc(t.id)}" data-budget-state="COMPLETADA">Completar</button>`:''}</div></article>`).join(''):'<div class="budget-no-data">Sin tareas de control pendientes.</div>';
 $('budgetAudit').innerHTML=(s.auditoria||[]).length?s.auditoria.slice(0,30).map(a=>`<article class="budget-audit-card"><small>${a.creado_en?new Date(a.creado_en).toLocaleString('es-CL'):'—'}<br>${esc(a.rol||a.rol_usuario||'Gestión')}</small><div><strong>${esc(a.accion||'EVENTO')} · ${esc(a.campo||a.entidad_tipo||'Presupuesto')}</strong><div class="budget-audit-change">Antes: ${esc(typeof a.valor_anterior==='object'?JSON.stringify(a.valor_anterior):a.valor_anterior??'—')} → Después: ${esc(typeof a.valor_nuevo==='object'?JSON.stringify(a.valor_nuevo):a.valor_nuevo??'—')}</div><small>${esc(a.motivo||'Sin motivo registrado')}${a.desviacion_previa!=null?` · Desviación previa: ${budgetMoney(a.desviacion_previa)}`:''}</small></div></article>`).join(''):'<div class="budget-no-data">Sin movimientos de auditoría.</div>';
}
function openBudgetConfig(){
 initBudgetPeriodSelectors();const s=S.budgetSummary||{},p=s.presupuesto||{},year=Number($('budgetYear')?.value||chileDayKey().slice(0,4));$('budgetCfgYear').value=String(year);$('budgetCfgAnnual').value=p.monto_anual||'';$('budgetCfgFund').value=p.fondo_emergencia||'';$('budgetCfgFundModeSelect').value=p.fondo_emergencia_modo||'INCLUIDO';$('budgetCfgDistribution').value=p.distribucion_mensual||'EQUITATIVA';$('budgetCfgPolicy').value=p.politica_nuevos_compromisos||'ALERTAR';$('budgetCfgWarn').value=p.umbral_vigilancia||70;$('budgetCfgHigh').value=p.umbral_alto||85;$('budgetCfgExcess').value=p.umbral_exceso||100;$('budgetCfgProjection').value=p.umbral_proyeccion_critica||110;$('budgetCfgReason').value='';renderBudgetMonthEditor();$('budgetConfigModal').classList.remove('hidden');
}
function closeBudgetConfig(){$('budgetConfigModal')?.classList.add('hidden')}
function renderBudgetMonthEditor(){const custom=$('budgetCfgDistribution').value==='PERSONALIZADA',annual=Number($('budgetCfgAnnual').value||0),periods=S.budgetSummary?.periodos||[];$('budgetMonthEditor').classList.toggle('hidden',!custom);if(custom)$('budgetMonthEditor').innerHTML=BUDGET_MONTHS.map((name,i)=>{const old=periods.find(x=>Number(x.mes)===i+1);return `<label>${name}<input type="number" min="0" step="1000" data-budget-month="${i+1}" value="${Math.round(Number(old?.monto_presupuestado??annual/12)||0)}"></label>`}).join('')}
async function saveBudgetConfig(){const annual=Number($('budgetCfgAnnual').value||0);if(annual<=0)return toast('Ingresa el presupuesto anual',true);const custom=$('budgetCfgDistribution').value==='PERSONALIZADA',meses=custom?[...document.querySelectorAll('[data-budget-month]')].map(i=>({mes:Number(i.dataset.budgetMonth),monto:Number(i.value||0)})):[];const b=$('budgetConfigSave');loading(b,true);try{await api('PRESUPUESTO_CONFIGURAR',{origen:'WEB',anio:Number($('budgetCfgYear').value),monto_anual:annual,fondo_emergencia:Number($('budgetCfgFund').value||0),fondo_emergencia_modo:$('budgetCfgFundModeSelect').value,distribucion_mensual:$('budgetCfgDistribution').value,politica_nuevos_compromisos:$('budgetCfgPolicy').value,umbral_vigilancia:Number($('budgetCfgWarn').value||70),umbral_alto:Number($('budgetCfgHigh').value||85),umbral_exceso:Number($('budgetCfgExcess').value||100),umbral_proyeccion_critica:Number($('budgetCfgProjection').value||110),meses,motivo:$('budgetCfgReason').value});$('budgetYear').value=$('budgetCfgYear').value;closeBudgetConfig();await loadBudget();toast('Presupuesto guardado con trazabilidad')}catch(e){toast('Presupuesto: '+e.message,true)}finally{loading(b,false)}}
function openBudgetAction(title,html,handler){$('budgetActionTitle').textContent=title;$('budgetActionBody').innerHTML=html;S.budgetActionSaveHandler=handler;$('budgetActionSave').classList.toggle('hidden',typeof handler!=='function');$('budgetActionModal').classList.remove('hidden')}
function closeBudgetAction(){$('budgetActionModal')?.classList.add('hidden');S.budgetActionSaveHandler=null}
function openBudgetCategory(category='OTROS'){const c=(S.budgetSummary?.categorias||[]).find(x=>x.categoria===category)||{};openBudgetAction('Presupuesto por categoría',`<div class="budget-action-fields"><label>Categoría<input id="budgetActCategory" value="${esc(category)}"></label><label>Nombre<input id="budgetActName" value="${esc(c.nombre||category.replaceAll('_',' '))}"></label><label>Presupuesto mensual<input id="budgetActMonthly" type="number" min="0" step="1000" value="${Number(c.presupuesto||0)}"></label><label>Motivo<textarea id="budgetActReason" rows="3"></textarea></label></div>`,async()=>api('PRESUPUESTO_CATEGORIA_GUARDAR',{origen:'WEB',anio:Number($('budgetYear').value),categoria:$('budgetActCategory').value,nombre:$('budgetActName').value,monto_mensual:Number($('budgetActMonthly').value||0),monto_anual:Number($('budgetActMonthly').value||0)*12,motivo:$('budgetActReason').value}))}
async function openBudgetVehicleLimit(){await ensureCatalogs();const opts=(S.vehicles||[]).map(v=>`<option value="${esc(v.id)}">${esc(v.patente)} · ${esc([v.marca,v.modelo].filter(Boolean).join(' '))}</option>`).join('');openBudgetAction('Tope presupuestario por vehículo',`<div class="budget-action-fields"><label>Vehículo<select id="budgetActVehicle">${opts}</select></label><label>Tope mensual<input id="budgetActMonthly" type="number" min="0" step="1000"></label><label>Alerta desde %<input id="budgetActAlert" type="number" min="1" max="200" value="85"></label><label>Motivo<textarea id="budgetActReason" rows="3"></textarea></label></div>`,async()=>api('PRESUPUESTO_VEHICULO_GUARDAR',{origen:'WEB',anio:Number($('budgetYear').value),vehiculo_id:$('budgetActVehicle').value,monto_mensual:Number($('budgetActMonthly').value||0),monto_anual:Number($('budgetActMonthly').value||0)*12,alerta_porcentaje:Number($('budgetActAlert').value||85),motivo:$('budgetActReason').value}))}
async function openBudgetEmergency(){await ensureCatalogs();const opts=(S.vehicles||[]).map(v=>`<option value="${esc(v.id)}">${esc(v.patente)}</option>`).join('');openBudgetAction('Movimiento Fondo de Emergencia',`<div class="budget-action-fields"><label>Tipo<select id="budgetActType"><option value="USO">Uso</option><option value="REINTEGRO">Reintegro</option><option value="AJUSTE">Ajuste</option></select></label><label>Monto<input id="budgetActAmount" type="number" min="1" step="1000"></label><label>Vehículo<select id="budgetActVehicle">${opts}</select></label><label>OT relacionada (ID opcional)<input id="budgetActOrder"></label><label>Mantención relacionada (ID opcional)<input id="budgetActMaintenance"></label><label>Falla relacionada (ID opcional)<input id="budgetActFailure"></label><label>Motivo / autorización<textarea id="budgetActReason" rows="3"></textarea></label></div>`,async()=>api('PRESUPUESTO_FONDO_MOVIMIENTO',{origen:'WEB',anio:Number($('budgetYear').value),tipo:$('budgetActType').value,monto:Number($('budgetActAmount').value||0),vehiculo_id:$('budgetActVehicle').value,orden_trabajo_id:$('budgetActOrder').value,mantencion_id:$('budgetActMaintenance').value,falla_id:$('budgetActFailure').value,motivo:$('budgetActReason').value}))}
async function updateBudgetTask(id,state){if(state==='COMPLETADA')openBudgetAction('Completar tarea presupuestaria',`<div class="budget-action-fields"><label>Resultado / acción aplicada<textarea id="budgetActReason" rows="4" placeholder="Describe qué se revisó y qué decisión se tomó"></textarea></label></div>`,async()=>api('PRESUPUESTO_TAREA_ACTUALIZAR',{origen:'WEB',id,estado:state,resultado:$('budgetActReason').value}));else{await api('PRESUPUESTO_TAREA_ACTUALIZAR',{origen:'WEB',id,estado:state});await loadBudget();toast('Tarea actualizada')}}
async function saveBudgetAction(){if(typeof S.budgetActionSaveHandler!=='function')return;const b=$('budgetActionSave');loading(b,true);try{await S.budgetActionSaveHandler();closeBudgetAction();await loadBudget();toast('Acción presupuestaria guardada')}catch(e){toast('Presupuesto: '+e.message,true)}finally{loading(b,false)}}
async function evaluateBudget(){const b=$('btnBudgetEvaluate');loading(b,true);try{const j=await api('PRESUPUESTO_EVALUAR',{origen:'WEB',anio:Number($('budgetYear').value),mes:Number($('budgetMonth').value)});await loadBudget();toast(`Evaluación lista · ${Number(j.evaluacion?.alertasCreadas||0)} alerta(s) · ${Number(j.evaluacion?.tareasCreadas||0)} tarea(s)`)}catch(e){toast('Evaluación presupuestaria: '+e.message,true)}finally{loading(b,false)}}
async function openBudgetHistory(){
 try{const j=await api('PRESUPUESTO_HISTORIAL',{anio:Number($('budgetYear').value)},true),rows=j.rows||[];const html=rows.length?`<div class="budget-action-fields">${rows.map(r=>`<article class="budget-audit-card"><div><strong>${esc(r.anio)} · ${esc(r.estado||'')}</strong><small>${budgetMoney(r.monto_anual)} · versión ${Number(r.version||1)}</small></div><div>${String(r.eliminado||'NO').toUpperCase()==='SI'||String(r.estado||'').toUpperCase()==='ANULADO'?`<button class="mini approve" data-budget-restore="${esc(r.id)}">Restaurar</button>`:'<span class="badge ok">Vigente</span>'}</div></article>`).join('')}</div>`:'<div class="budget-no-data">No existe historial para el año seleccionado.</div>';openBudgetAction('Historial de Presupuesto Operacional',html,null);$('budgetActionSave').classList.add('hidden')}catch(e){toast('Historial presupuesto: '+e.message,true)}}
function openBudgetAnnul(){const p=S.budgetSummary?.presupuesto;if(!p?.id)return;openBudgetAction('Anular Presupuesto Operacional',`<div class="budget-action-fields"><div class="budget-error">La anulación es lógica. El historial y los KPI anteriores se conservan.</div><label>Motivo obligatorio<textarea id="budgetActReason" rows="4"></textarea></label></div>`,async()=>api('PRESUPUESTO_ANULAR',{origen:'WEB',id:p.id,motivo:$('budgetActReason').value}))}
async function restoreBudget(id){try{await api('PRESUPUESTO_RESTAURAR',{origen:'WEB',id,motivo:'Restauración autorizada desde historial Web'});closeBudgetAction();await loadBudget();toast('Presupuesto restaurado')}catch(e){toast('Restaurar presupuesto: '+e.message,true)}}
async function exportBudget(kind){if(!S.budgetSummary?.configurado)return toast('Configura el presupuesto antes de exportar',true);try{const j=await api('PRESUPUESTO_REPORTE',{anio:Number($('budgetYear').value),mes:Number($('budgetMonth').value)},true),rows=(j.rows||[]).map(reportNormalizeRow);S.budgetReportRows=rows;if(!rows.length)return toast('No hay datos de presupuesto para exportar',true);const stamp=`${$('budgetYear').value}-${String($('budgetMonth').value).padStart(2,'0')}`,name=`E-Fleet_Presupuesto_Operacional_${stamp}`;if(kind==='XLSX')EFleetExport.toXlsx(name+'.xlsx',rows,'Presupuesto');else EFleetExport.toPdf(name+'.pdf','E-Fleet · Presupuesto Operacional',rows,`${S.company?.nombre||''} · ${BUDGET_MONTHS[Number($('budgetMonth').value)-1]} ${$('budgetYear').value} · Análisis ejecutivo`) }catch(e){toast('Exportación presupuesto: '+e.message,true)}}

async function loadUsers(){
 if(!isManagement())return showView('dashboard');
 const [conductores,j]=await Promise.all([api('listar',{recurso:'CONDUCTORES',limit:500}),api('listar',{recurso:'USUARIOS',limit:300})]);S.drivers=conductores.rows||[];S.rows.CONDUCTORES=S.drivers;S.users=j.rows||[];S.rows.USUARIOS=S.users;populateAdvancedFilter('usuarios',S.users);renderUsers();
}
function filteredUsers(){return advancedFilteredRows('usuarios',S.users||[])}
function renderUsers(){
 const rows=filteredUsers(),all=S.users||[],active=all.filter(u=>String(u.estado).toUpperCase()==='ACTIVO').length,admins=all.filter(u=>normalizeRole(u.rol_id)==='ROL-ADMIN').length,management=all.filter(u=>normalizeRole(u.rol_id)==='ROL-GERENCIA').length;
 $('userKpis').innerHTML=`<div><small>Total</small><strong>${all.length}</strong></div><div><small>Activos</small><strong>${active}</strong></div><div><small>Administradores</small><strong>${admins}</strong></div><div><small>Gerencia</small><strong>${management}</strong></div><div><small>Filtrados</small><strong>${rows.length}</strong></div>`;
 $('userRows').innerHTML=rows.length?rows.map(u=>{const linked=S.drivers.find(c=>String(c.usuario_id)===String(u.id));return `<article class="user-card"><div class="user-card-head"><span class="user-avatar">${esc(initials(u.nombre))}</span><div><h4>${esc(u.nombre)}</h4><p>${esc(u.correo)}</p></div><span class="badge ${String(u.estado).toUpperCase()==='ACTIVO'?'ok':'warn'}">${esc(u.estado)}</span></div><div class="user-details"><span><small>PERFIL</small><strong>${esc(roleLabel(u.rol_id))}</strong></span><span><small>PERMISOS</small><strong>${esc(u.modo_permisos||'ROL')}</strong></span><span><small>CONDUCTOR</small><strong>${esc(linked?.nombre||'Sin asociación')}</strong></span><span><small>ÚLTIMO ACCESO</small><strong>${esc(u.ultimo_acceso?new Date(u.ultimo_acceso).toLocaleString('es-CL'):'Sin acceso')}</strong></span></div><div class="card-actions"><button class="mini permissions" data-user-permissions="${esc(u.id)}">▦ Configurar permisos</button><button class="mini edit" data-edit-form="usuario" data-id="${esc(u.id)}">✎ Editar</button>${String(u.id)!==String(S.user?.id)?`<button class="mini danger" data-delete-form="usuario" data-id="${esc(u.id)}">Eliminar</button>`:''}</div></article>`}).join(''):'<div class="notification-empty">No existen usuarios para los filtros seleccionados.</div>';
}
let permissionUser=null,permissionRole=null,permissionDraft={};
function effectiveMatrixFor(user){const out={};for(const m of PERMISSION_MODULES){out[m.id]={};for(const a of m.actions)out[m.id][a]=permissionAllowed(m.id,a,user)}return out}
function permissionActionLabel(a){return({LEER:'Leer',CREAR:'Crear',EDITAR:'Editar',ELIMINAR:'Eliminar',ACEPTAR:'Aceptar',REPORTAR:'Reportar',GESTIONAR:'Gestionar',APROBAR_DIRECTO:'Aprobar directo',GENERAR_QR:'Generar QR',USAR:'Usar NEXO',MARCAR_LEIDA:'Marcar leída',PERMISOS:'Administrar permisos'})[a]||a.replaceAll('_',' ')}
function renderPermissionMatrix(){
 const isRole=Boolean(permissionRole),isTargetAdmin=normalizeRole(permissionUser?.rol_id)==='ROL-ADMIN',mode=isRole?'PERSONALIZADO':$('permissionMode').value;
 $('permissionMode').value=mode;$('permissionMode').disabled=isRole||isTargetAdmin;$('permissionTools').classList.toggle('hidden',isTargetAdmin);
 $('permissionHelp').textContent=isTargetAdmin?'ROL-ADMIN es irreductible y conserva autoridad total.':isRole?'Esta es la matriz base exclusiva de este perfil. Los cambios actualizan sus sesiones activas.':mode==='PERSONALIZADO'?'La matriz personalizada es autoritativa; una matriz vacía permanece vacía.':'Se muestra la base del perfil. Al tocar una casilla cambia a PERSONALIZADO.';
 const source=(isRole||mode==='PERSONALIZADO')?permissionDraft:effectiveMatrixFor(permissionUser);
 $('permissionMatrix').innerHTML=PERMISSION_MODULES.map(m=>`<section class="permission-module"><div><strong>${esc(m.label)}</strong><small>${esc(m.id)}</small></div><div class="permission-actions">${m.actions.map(a=>`<label><input type="checkbox" data-permission-module="${esc(m.id)}" data-permission-action="${esc(a)}" ${source?.[m.id]?.[a]?'checked':''} ${isTargetAdmin?'disabled':''}><span>${esc(permissionActionLabel(a))}</span></label>`).join('')}</div></section>`).join('');
 $('permissionMatrix').querySelectorAll('[data-permission-module]').forEach(box=>box.onchange=()=>{if(!isRole&&$('permissionMode').value==='ROL'){$('permissionMode').value='PERSONALIZADO';permissionDraft=effectiveMatrixFor(permissionUser)}permissionDraft[box.dataset.permissionModule]??={};permissionDraft[box.dataset.permissionModule][box.dataset.permissionAction]=box.checked;renderPermissionMatrix()});
}
function openUserPermissions(id){
 permissionRole=null;permissionUser=S.users.find(u=>String(u.id)===String(id));if(!permissionUser)return;
 $('permissionTitle').textContent='Permisos del usuario';$('permissionUserLabel').textContent=`${permissionUser.nombre} · ${roleLabel(permissionUser.rol_id)}`;
 const existing=personalPermissions(permissionUser);permissionDraft={};for(const m of PERMISSION_MODULES){permissionDraft[m.id]={};for(const a of m.actions)permissionDraft[m.id][a]=existing?.[m.id]?.[a]===true}
 $('permissionMode').value=normalizeRole(permissionUser.rol_id)==='ROL-ADMIN'?'ROL':String(permissionUser.modo_permisos||'ROL').toUpperCase();renderPermissionMatrix();openOverlay('permissionModal');
}
function openRolePermissions(id){
 permissionRole=S.roleProfiles.find(x=>String(x.id)===String(id));if(!permissionRole)return;permissionUser={rol_id:permissionRole.id};permissionDraft={};
 for(const m of PERMISSION_MODULES){permissionDraft[m.id]={};for(const a of m.actions)permissionDraft[m.id][a]=permissionRole.permisos?.[m.id]?.[a]===true}
 $('permissionTitle').textContent=`Perfil ${permissionRole.nombre}`;$('permissionUserLabel').textContent=`${permissionRole.id} · Matriz base del perfil`;$('permissionMode').value='PERSONALIZADO';renderPermissionMatrix();openOverlay('permissionModal');
}
function closePermissionModal(){$('permissionModal').classList.add('hidden');permissionUser=null;permissionRole=null;permissionDraft={}}
function setAllPermissions(enabled){if(!permissionUser||normalizeRole(permissionUser.rol_id)==='ROL-ADMIN')return;$('permissionMode').value='PERSONALIZADO';for(const m of PERMISSION_MODULES){permissionDraft[m.id]={};for(const a of m.actions)permissionDraft[m.id][a]=enabled}renderPermissionMatrix()}
async function saveUserPermissions(){if(!permissionUser)return;const btn=$('permissionSave');loading(btn,true);try{if(permissionRole){if(permissionRole.irreductible){closePermissionModal();return toast('ROL-ADMIN es irreductible')};await api('GUARDAR_PERMISOS_ROL',{rol_id:permissionRole.id,permisos:permissionDraft},true);closePermissionModal();toast('Matriz del perfil guardada y verificada');await loadProfileView();return}const mode=$('permissionMode').value;await api('GUARDAR_PERMISOS_USUARIO',{usuario_id:permissionUser.id,modo_permisos:mode,permisos:mode==='PERSONALIZADO'?permissionDraft:{}},true);closePermissionModal();toast('Permisos del usuario guardados y versionados');await loadUsers()}catch(e){toast('Permisos: '+e.message,true)}finally{loading(btn,false)}}
async function loadCheckin(){
 await ensureCatalogs();fillVehicleSelect();fillDriverSelect();
 const [j,scheduled]=await Promise.all([api('listar',{recurso:'CHECKINS',limit:80}),api('listar',{recurso:'CHECKIN_PROGRAMACIONES',limit:100})]);
 S.rows.CHECKINS=j.rows||[];S.rows.CHECKIN_PROGRAMACIONES=scheduled.rows||[];
 renderCheckinSchedules();
 const rows=j.rows||[];
 $('checkinRows').innerHTML=rows.length?rows.map(x=>{
   const result=String(x.resultado_tecnico||x.estado||'PENDIENTE').toUpperCase();
   const cls=result.includes('NO APTO')?'danger':result.includes('OBS')?'warn':'ok';
   const v=S.vehicles.find(v=>v.id===x.vehiculo_id)||{};
   const d=S.drivers.find(d=>d.id===x.conductor_id)||{};
   const obs=String(x.observacion_general||'Sin observaciones registradas.');
   const approved=String(x.estado||'').toUpperCase()==='APROBADO'||String(x.aprobacion_directa||'').toUpperCase()==='SI'||String(x.aprobacion_automatica||'').toUpperCase()==='SI';
   const needsDecision=String(x.requiere_decision||'').toUpperCase()==='SI'||String(x.estado||'').toUpperCase()==='PENDIENTE_DECISION';
   return `<article class="checkin-card ${cls}">
     <div class="checkin-card-head">
       <div class="checkin-vehicle">
         <div class="checkin-car-icon">🚙</div>
         <div>
           <div class="checkin-plate">${esc(x.vehiculo_patente||v.patente||'Vehículo asociado')}</div>
           <div class="checkin-model">${esc([v.marca,v.modelo].filter(Boolean).join(' ')||'Ficha técnica')}</div>
         </div>
       </div>
       <span class="checkin-status-pill">${esc(result)}</span>
     </div>
     <div class="checkin-metrics">
       <div class="checkin-metric"><small>Conductor</small><strong>${esc(d.nombre||'Sin conductor')}</strong></div>
       <div class="checkin-metric"><small>Kilometraje</small><strong>${Number(x.kilometraje||0).toLocaleString('es-CL')} km</strong></div>
       <div class="checkin-metric"><small>Fecha</small><strong>${esc(x.fecha_inicio?new Date(x.fecha_inicio).toLocaleDateString('es-CL'):'—')}</strong></div>
     </div>
     <div class="checkin-tech-banner">
       <span>${approved?'✓ Aprobado operacionalmente':'Inspección técnica registrada'}</span>
       <span>Operar: ${esc(x.autorizado_operar||'NO')}</span>
     </div>
     <div class="checkin-observation">${esc(obs)}</div>
     <div class="checkin-card-actions">
       <button class="mini detail" data-checkin-detail="${esc(x.id)}">Ver inspección</button><button class="mini detail" data-checkin-pdf="${esc(x.id)}" title="Exportar PDF" aria-label="Exportar PDF">📄</button>
       ${permissionAllowed('FALLAS','REPORTAR')?`<button class="mini checkin-fault" data-checkin-create-failure="${esc(x.id)}">⚠ Informar falla</button>`:''}
       ${permissionAllowed('MANTENCIONES','CREAR')?`<button class="mini checkin-maintenance" data-checkin-create-maintenance="${esc(x.id)}">🔧 Programar mantención</button>`:''}
       ${permissionAllowed('CHECKIN','EDITAR')?`<button class="mini edit" data-edit-form="checkin" data-id="${esc(x.id)}">✎ Editar</button>`:''}
       ${permissionAllowed('CHECKIN','APROBAR_DIRECTO')&&needsDecision?`<button class="mini approve" data-approve-checkin="${esc(x.id)}">✓ Aprobar decisión</button>`:''}
       ${permissionAllowed('CHECKIN','ELIMINAR')?`<button class="mini danger" data-delete-form="checkin" data-id="${esc(x.id)}">Eliminar</button>`:''}
     </div>
   </article>`;
 }).join(''):'<p class="muted">No hay Checklist todavía.</p>';updateCheckinActionHub();
}


function renderCheckinSchedules(){const rows=(S.rows.CHECKIN_PROGRAMACIONES||[]).filter(x=>!['COMPLETADO','CANCELADO','ANULADO'].includes(String(x.estado||'').toUpperCase()));const box=$('checkinScheduleRows');if(!box)return;box.innerHTML=rows.length?rows.map(x=>{const v=S.vehicles.find(v=>v.id===x.vehiculo_id)||{},d=S.drivers.find(d=>d.id===x.conductor_id)||{};return `<article class="schedule-card"><div><small>PROGRAMADO</small><strong>${esc(x.vehiculo_patente||v.patente||'Vehículo asociado')}</strong><span>${esc(x.conductor_nombre||d.nombre||'Sin conductor')}</span></div><div><strong>${esc(x.programado_para?new Date(x.programado_para).toLocaleString('es-CL'):'—')}</strong><span>${esc(x.observaciones||'Sin instrucciones')}</span></div><span class="badge ok">${esc(x.estado||'PROGRAMADO')}</span>${permissionAllowed('CHECKIN','ELIMINAR')?`<button class="mini danger" data-checkin-schedule-delete="${esc(x.id)}">Cancelar</button>`:''}</article>`}).join(''):'<div class="notification-empty">No hay Checklist programados.</div>'}
async function cancelCheckinSchedule(id){if(!confirm('¿Cancelar esta programación de Checklist?'))return;try{await api('eliminar',{recurso:'CHECKIN_PROGRAMACIONES',id});toast('Programación cancelada');await loadCheckin()}catch(e){toast('Programación: '+e.message,true)}}
async function openCheckinDetail(id){
 let row=(S.rows.CHECKINS||[]).find(x=>String(x.id)===String(id))||(S.checkinHistory||[]).find(x=>String(x.id)===String(id));
 if(!row){try{const one=await api('listar',{recurso:'CHECKINS',id,limit:1});row=one.rows?.[0];if(row){S.rows.CHECKINS=S.rows.CHECKINS||[];S.rows.CHECKINS.push(row)}}catch(e){return toast('Checklist: '+friendlyError(e.message),true)}}
 if(!row)return toast('Checklist no encontrado',true);
 let items=[],evidences=[],trace=[];
 try{
   const [r,ev,tr]=await Promise.all([api('listar',{recurso:'CHECKIN_ITEMS',checkin_id:id,limit:100}),api('listar',{recurso:'CHECKIN_EVIDENCIAS',checkin_id:id,limit:100}),api('TRAZABILIDAD_CHECKIN',{checkin_id:id},true).catch(()=>({rows:[]}))]);
   items=r.rows||[];evidences=ev.rows||[];trace=tr.rows||[];
 }catch(e){toast('No fue posible cargar todo el detalle: '+e.message,true)}
 const v=S.vehicles.find(v=>v.id===row.vehiculo_id)||{}, d=S.drivers.find(d=>d.id===row.conductor_id)||{};
 $('modalTitle').textContent='Inspección técnica · '+(v.patente||'Vehículo');
 $('modalBody').innerHTML=`
   <div class="checkin-detail-summary">
     <div><small>Resultado</small><strong>${esc(row.resultado_tecnico||row.estado||'—')}</strong></div>
     <div><small>Conductor</small><strong>${esc(d.nombre||'Sin conductor')}</strong></div>
     <div><small>Kilometraje</small><strong>${Number(row.kilometraje||0).toLocaleString('es-CL')} km</strong></div>
   </div>
   <div class="checkin-detail-items">
     ${items.length?items.map((it,i)=>{
       const st=String(it.estado||'PENDIENTE').toUpperCase(),cls=st==='FALLA'?'danger':st.includes('OBS')?'warn':'ok';
       return `<div class="checkin-detail-item ${cls}">
         <strong>${i+1}. ${esc(it.nombre||it.codigo)}</strong>
         <span class="state">${esc(st)}</span>
       </div>`;
     }).join(''):'<div class="notification-empty">Este Checklist todavía no tiene detalle de puntos registrado.</div>'}
   </div>
   ${row.observacion_general?`<label>Observación general</label><div class="checkin-observation">${esc(row.observacion_general)}</div>`:''}
   <div class="checkin-evidence-detail"><h4>Evidencias (${evidences.length})</h4>${evidences.length?evidences.map(ev=>`<button class="mini detail" type="button" data-checkin-evidence="${esc(ev.id)}">${ev.mime==='application/pdf'?'📄':'📷'} ${esc(ev.nombre_archivo||ev.tipo||'Evidencia')}</button>`).join(''):'<span class="muted">Sin evidencias adjuntas.</span>'}</div>
   <div class="checkin-trace-detail"><h4>Línea de tiempo del Checklist</h4>${trace.length?trace.map((x,i)=>`<article class="timeline-item"><div class="timeline-dot ok"></div><div class="timeline-date">${esc(x.fecha_hora?new Date(x.fecha_hora).toLocaleString('es-CL'):'')}</div><div class="timeline-card"><strong>${i+1}. ${esc(x.titulo||x.evento||'Evento')}</strong><p>${esc(x.detalle||'')}</p></div></article>`).join(''):'<span class="muted">La trazabilidad se construye desde la asignación del vehículo hasta el cierre.</span>'}</div>
 `;
 $('modalCancel').textContent='Cerrar';$('modalSave').classList.add('hidden');openOverlay('modal');
}
function vehicleName(id){const v=S.vehicles.find(x=>x.id===id);return v?.patente||'Vehículo asociado'}
function offlineCheckinQueue(){try{return JSON.parse(localStorage.getItem('efm_checkin_offline_queue')||'[]')}catch{return[]}}
function setOfflineCheckinQueue(rows){localStorage.setItem('efm_checkin_offline_queue',JSON.stringify(rows.slice(-50)))}
function queueOfflineCheckin(payload){const q=offlineCheckinQueue();q.push({...payload,queuedAt:new Date().toISOString(),attempts:0});setOfflineCheckinQueue(q);return q.length}
async function persistCheckinPayload(payload){
 const {id,veh,driver,km,result,items,observation}=payload;
 const hasDetail=items.some(x=>String(x.estado||'').toUpperCase()!=='CONFORME');
 const autoApproved=items.length>=18&&!hasDetail;
 const photoCount=Number(payload.evidencias_fotograficas||0);
 const checkinRow={id,vehiculo_id:veh,conductor_id:driver,kilometraje:km,estado:autoApproved?'APROBADO':'PENDIENTE_DECISION',resultado_tecnico:result,autorizado_operar:autoApproved?'SI':(result==='NO APTO'?'NO':'PENDIENTE'),aprobacion_automatica:autoApproved?'SI':'NO',requiere_decision:autoApproved?'NO':'SI',decision_estado:autoApproved?'APROBADO':'PENDIENTE',evidencias_fotograficas:photoCount,sin_evidencia_fotografica:photoCount===0?'SI':'NO',observacion_general:observation,fecha_inicio:payload.fecha_inicio,fecha_termino:new Date().toISOString(),odometro_fuente:payload.odometro_fuente||'MANUAL',evidencia_pendiente:payload.evidencia_pendiente||'NO',sincronizacion_estado:'SINCRONIZADO',advertencias:payload.advertencias||[]};
 const itemRows=items.map(item=>({id:item.id||'CHI-'+crypto.randomUUID().toUpperCase(),checkin_id:id,codigo:item.codigo,nombre:item.nombre,categoria:'CHECKIN_TECNICO',estado:item.estado,criticidad:item.criticidad,observacion:item.observacion||null,detectado_por:'HUMANO'}));
 try{
   const bulk=await api('GUARDAR_CHECKLIST_COMPLETO',{checkin:checkinRow,items:itemRows,crear_fallas:'SI',evidencias_fotograficas:photoCount},true);
   return{saved:{row:bulk.row||checkinRow},failureRows:(bulk.fallas||[]).map(row=>({codigo:row.codigo_checklist||'',row}))};
 }catch(e){
   if(!['ACCION_NO_DISPONIBLE','RECURSO_NO_DISPONIBLE'].includes(String(e.message||'').toUpperCase()))throw e;
 }
 const saved=await api('guardar',{recurso:'CHECKINS',row:checkinRow});
 const failureRows=[];
 for(const item of items){
   try{await api('guardar',{recurso:'CHECKIN_ITEMS',row:{id:item.id||'CHI-'+crypto.randomUUID().toUpperCase(),checkin_id:id,codigo:item.codigo,nombre:item.nombre,categoria:'CHECKIN_TECNICO',estado:item.estado,criticidad:item.criticidad,observacion:item.observacion||null,detectado_por:'HUMANO'}})}catch(e){console.warn('[checkin][item no bloqueante]',item.codigo,e)}
   if(item.estado==='FALLA'&&permissionAllowed('FALLAS','REPORTAR')){
     try{const failure=await api('guardar',{recurso:'FALLAS',row:{id:'FAL-'+crypto.randomUUID().toUpperCase(),vehiculo_id:veh,conductor_id:driver,checkin_id:id,titulo:'Hallazgo Checklist: '+item.nombre,descripcion:'Generada automáticamente desde Checklist técnico. Puede completarse desde las acciones de esta inspección.',origen:'CHECKIN',severidad:item.criticidad,criticidad:item.criticidad,estado:'DETECTADA',kilometraje:km,puede_operar:(item.criticidad==='CRITICA'?'NO':'SI'),requiere_inmovilizacion:(item.criticidad==='CRITICA'?'SI':'NO')}});failureRows.push({codigo:item.codigo,row:failure.row})}catch(e){console.warn('[checkin][falla no bloqueante]',e)}
   }
 }
 return{saved,failureRows};
}
async function flushOfflineCheckins(){
 if(!S.token||!navigator.onLine)return;const q=offlineCheckinQueue();if(!q.length)return;const remain=[];
 for(const payload of q){try{await persistCheckinPayload(payload);console.info('[checkin][offline sincronizado]',payload.id)}catch(e){payload.attempts=Number(payload.attempts||0)+1;payload.lastError=String(e.message||e);remain.push(payload)}}
 setOfflineCheckinQueue(remain);if(q.length!==remain.length)toast(`${q.length-remain.length} Checklist pendiente(s) sincronizado(s)`);
}
async function saveCheckin(){
 const b=$('btnSaveCheckin');loading(b,true);
 try{
  if(S.lastCheckinSaved)throw new Error('CHECKIN_YA_GUARDADO_USA_NUEVA_INSPECCION');
  const veh=$('ciVehicle').value,driver=$('ciDriver').value||null,km=Number($('ciKm').value||0);if(!S.checkinQrValidated||!S.checkinQrVehicleId)throw new Error('QR_REQUERIDO_ANTES_CHECKLIST');if(String(veh)!==String(S.checkinQrVehicleId))throw new Error('VEHICULO_NO_COINCIDE_QR');if(!veh)throw new Error('VEHICULO_REQUERIDO');if(!km)throw new Error('KILOMETRAJE_REQUERIDO');
  if($('ciKmStatus')){$('ciKmStatus').textContent='KM confirmado ✓';$('ciKmStatus').classList.add('ok')}
  const id='CHK-'+crypto.randomUUID().toUpperCase(),result=calcResult(),items=checkinItemSnapshot(),observation=$('ciObs').value;
  const missingEvidence=missingGuidedEvidence(),photoCount=guidedEvidenceEntries().filter(x=>x.file&&String(x.file.type||'').startsWith('image/')).length+[...($('ciEvidenceFiles')?.files||[])].filter(f=>String(f.type||'').startsWith('image/')).length;const payload={id,veh,driver,km,result,items,observation,fecha_inicio:new Date().toISOString(),odometro_fuente:'MANUAL',evidencias_fotograficas:photoCount,evidencia_pendiente:missingEvidence.length?'SI':'NO',advertencias:missingEvidence.length?[`Evidencia fotográfica guiada pendiente: ${missingEvidence.join(', ')}`]:[]};
  let saved,failureRows=[],offline=false;
  try{const r=await persistCheckinPayload(payload);saved=r.saved;failureRows=r.failureRows}
  catch(e){
    if(e.isNetworkError||!navigator.onLine){
      const pending=queueOfflineCheckin(payload);offline=true;saved={row:{id,vehiculo_id:veh,conductor_id:driver,kilometraje:km,resultado_tecnico:result,observacion_general:observation,sincronizacion_estado:'PENDIENTE'}};
      toast(`Checklist guardado localmente · ${pending} pendiente(s) de sincronizar`);
    }else throw e;
  }
  if(!offline){
    uploadCheckinEvidenceFiles(id,veh).then(async ev=>{
      if(ev.failed.length){try{await api('REGISTRAR_ADVERTENCIA_CHECKIN',{id,advertencia:`${ev.failed.length} evidencia(s) pendiente(s) de carga`},true)}catch{}}
      if(ev.uploaded||ev.failed.length)toast(`Evidencias Checklist: ${ev.uploaded} cargada(s)${ev.failed.length?` · ${ev.failed.length} pendiente(s)`:''}`);
    }).catch(e=>console.warn('[checkin][evidencias segundo plano]',e));
  }
  S.lastCheckinSaved=checkinSourceFromRow(saved.row||{id,vehiculo_id:veh,conductor_id:driver,kilometraje:km,resultado_tecnico:result,observacion_general:observation},{failedItems:items,failureRows});
  S.lastCheckinSaved.offline=offline;updateCheckinActionHub();
  if(offline)toast('✓ KM confirmado · Checklist completo · sincronización pendiente');
  else{
    const hasDetail=items.some(x=>String(x.estado||'').toUpperCase()!=='CONFORME');
    toast(hasDetail?'Checklist finalizado · PENDIENTE DE DECISIÓN':'Checklist finalizado y APROBADO automáticamente · no requiere aprobación manual');
  }
  if(!offline)loadCheckin().catch(e=>console.warn('[checkin][refresco segundo plano]',e));
 }catch(e){toast('No se pudo guardar: '+friendlyError(e.message),true)}finally{loading(b,false)}
}
async function loadCards(resource,target,renderer){const j=await api('listar',{recurso:resource,limit:200});S.rows[resource]=j.rows||[];if(resource==='FALLAS'){populateAdvancedFilter('fallas',S.rows[resource]);return renderFailures()}$(target).innerHTML=(j.rows||[]).length?(j.rows||[]).map(renderer).join(''):'<p class="muted">Sin registros.</p>'}
function renderFailures(){const rows=advancedFilteredRows('fallas',S.rows.FALLAS||[]);$('fallasRows').innerHTML=rows.length?rows.map(fallCard).join(''):'<div class="notification-empty">No hay fallas para los filtros seleccionados.</div>'}
const fallCard=x=>`<div class="card fault-card" data-fault-open="${esc(x.id)}"><h4>${esc(x.titulo)}</h4><p>${esc(x.vehiculo_patente||vehicleName(x.vehiculo_id))}${x.conductor_nombre?` · 👤 ${esc(x.conductor_nombre)}`:''}</p><button class="fault-comment-link" type="button" data-fault-open="${esc(x.id)}"><b>Comentario / detalle:</b> ${esc(x.descripcion||x.diagnostico_tecnico||'Pincha para ver la información completa')}</button><p>KM ${Number(x.kilometraje||0).toLocaleString('es-CL')} · ${esc(x.fecha_detectada?new Date(x.fecha_detectada).toLocaleString('es-CL'):'')}</p><span class="badge ${upperClass(x.criticidad)}">${esc(x.criticidad)}</span> <span class="badge">${esc(x.estado)}</span>${adminActions('falla',x.id)}</div>`;
const mantCard=x=>{const t=S.talleres.find(t=>String(t.id)===String(x.taller_id))||{};return `<div class="card"><h4>${esc(x.descripcion)}</h4><p>${esc(vehicleName(x.vehiculo_id))} · ${esc(x.tipo)}</p><p>Programada: ${esc(x.fecha_programada?new Date(x.fecha_programada).toLocaleDateString('es-CL'):'—')} · $${Number(x.costo_total||0).toLocaleString('es-CL')}</p>${x.taller_id?`<p>🏭 ${esc(x.taller_nombre||t.nombre||'Taller asociado')} · ${esc(x.taller_direccion||t.direccion||'Dirección no informada')}</p>`:''}<span class="badge">${esc(x.estado)}</span>${adminActions('mantencion',x.id)}<div class="life-actions"><button class="mini detail" data-life-vehicle="${esc(x.vehiculo_id)}">Ver vehículo</button>${permissionAllowed('MANTENCIONES','EDITAR')?`<button class="mini edit" data-order-from-maintenance="${esc(x.id)}">📋 Crear orden de servicio</button>`:''}</div></div>`};
const fuelCard=x=>`<article class="card fuel-card ${String(x.consumo_anomalo||'NO').toUpperCase()==='SI'?'anomaly':''}"><h4>${esc(x.vehiculo_patente||vehicleName(x.vehiculo_id))}</h4><p>${x.conductor_nombre?`👤 ${esc(x.conductor_nombre)} · `:''}${esc(x.estacion||'Estación no informada')}</p><div class="fuel-metrics"><span><small>LITROS</small><strong>${Number(x.litros||0).toLocaleString('es-CL')}</strong></span><span><small>MONTO</small><strong>$${Number(x.monto_total||0).toLocaleString('es-CL')}</strong></span><span><small>$/L</small><strong>$${Number(x.precio_litro||0).toLocaleString('es-CL')}</strong></span><span><small>KM</small><strong>${Number(x.kilometraje||0).toLocaleString('es-CL')}</strong></span><span><small>KM/L</small><strong>${Number(x.rendimiento_km_l||0).toFixed(2)}</strong></span><span><small>COSTO/KM</small><strong>$${Number(x.costo_km||0).toFixed(0)}</strong></span></div>${x.direccion?`<p>📍 ${esc(x.direccion)}</p>`:''}<span class="badge">${esc(new Date(x.fecha_hora).toLocaleString('es-CL'))}</span>${String(x.consumo_anomalo||'NO').toUpperCase()==='SI'?'<span class="badge danger">Consumo anómalo</span>':''}${adminActions('combustible',x.id)}</article>`;
function upperClass(v){v=String(v||'').toUpperCase();return /CRIT|URG|ALTA/.test(v)?'danger':/MED|OBS|ALERTA/.test(v)?'warn':'ok'}
async function loadFuelModule(){await ensureCatalogs();const j=await api('listar',{recurso:'COMBUSTIBLE',limit:500});S.rows.COMBUSTIBLE=j.rows||[];populateAdvancedFilter('combustible',S.rows.COMBUSTIBLE);renderFuelModule()}
function renderFuelModule(){const rows=advancedFilteredRows('combustible',S.rows.COMBUSTIBLE||[]),liters=rows.reduce((a,x)=>a+Number(x.litros||0),0),spend=rows.reduce((a,x)=>a+Number(x.monto_total||0),0),avgPrice=liters?spend/liters:0,efficiencies=rows.map(x=>Number(x.rendimiento_km_l||0)).filter(x=>x>0),avgEff=efficiencies.length?efficiencies.reduce((a,x)=>a+x,0)/efficiencies.length:0,anomalies=rows.filter(x=>String(x.consumo_anomalo||'NO').toUpperCase()==='SI').length;$('fuelKpis').innerHTML=ringKpi('Gasto','$'+Math.round(spend).toLocaleString('es-CL'),Math.min(100,spend/1000000*100),'blue',`${rows.length} cargas`)+ringKpi('Litros',liters.toFixed(1)+' L',Math.min(100,liters/20),'amber','Consumo registrado')+ringKpi('Precio promedio','$'+Math.round(avgPrice).toLocaleString('es-CL'),Math.min(100,avgPrice/25),'green','Por litro')+ringKpi('Rendimiento',avgEff.toFixed(2)+' km/L',Math.min(100,avgEff*7),'green','Promedio calculado')+ringKpi('Anomalías',anomalies,Math.min(100,anomalies*20),anomalies?'red':'green','Requieren revisión');$('combustibleRows').innerHTML=rows.length?rows.map(fuelCard).join(''):'<div class="notification-empty">No hay cargas para los filtros seleccionados.</div>';const alert=$('fuelAlert');if(alert){alert.classList.toggle('hidden',!anomalies);alert.textContent=anomalies?`⚠ ${anomalies} carga(s) muestran desviación de consumo/costo y deben revisarse.`:''}}
function getBrowserPosition(){return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(new Error('GPS_NO_DISPONIBLE'));navigator.geolocation.getCurrentPosition(p=>resolve({latitud:p.coords.latitude,longitud:p.coords.longitude,precision:p.coords.accuracy}),reject,{enableHighAccuracy:true,timeout:12000,maximumAge:15000})})}
async function captureFuelGps(show=true){
 try{S.fuelPosition=await getBrowserPosition();const r=await api('GEOCODIFICAR_COORDENADAS',S.fuelPosition,true);S.fuelPosition={...S.fuelPosition,direccion:r.ubicacion?.direccion||''};if(show)toast('Ubicación de combustible obtenida');return S.fuelPosition}catch(e){if(show)toast('Ubicación combustible: '+(e.message||e),true);return null}
}
async function loadNearbyFuelStations(){
 const b=$('btnFuelNearby');loading(b,true);try{const pos=S.fuelPosition||await captureFuelGps(false);if(!pos)throw new Error('UBICACION_REQUERIDA');const j=await api('ESTACIONES_COMBUSTIBLE_CERCANAS',{latitud:pos.latitud,longitud:pos.longitud,radio_m:8000},true);S.fuelNearby=j.rows||[];$('fuelNearbyRows').innerHTML=S.fuelNearby.length?S.fuelNearby.map(x=>`<article class="fuel-station"><h4>${esc(x.nombre||'Estación de servicio')}</h4><p>📍 ${esc(x.direccion||'Dirección no disponible')}</p><p>${Number(x.distancia_km||0).toFixed(2)} km${x.precio_litro?` · $${Number(x.precio_litro).toLocaleString('es-CL')}/L`:''}</p><div class="card-actions"><button class="mini detail" data-fuel-nav="${esc(x.latitud)},${esc(x.longitud)}">Ir / Navegar</button></div></article>`).join(''):'<div class="notification-empty">No se encontraron estaciones dentro del radio consultado.</div>';toast(`${S.fuelNearby.length} estación(es) cercana(s)`)}catch(e){toast('Estaciones: '+e.message,true)}finally{loading(b,false)}
}



function serviceOrderNumber(x){return x.correlativo?`OS-${String(x.correlativo).padStart(6,'0')}`:`OS-${String(x.id||'').replace(/^ORDE-/,'').slice(-8)}`}
function orderTotal(x){return Number(x.costo_repuestos||0)+Number(x.costo_mano_obra||0)+Number(x.costo_otros||0)}
function serviceOrderCard(x){const t=S.talleres.find(t=>String(t.id)===String(x.taller_id))||{},total=orderTotal(x),number=serviceOrderNumber(x);return `<article class="service-order-card"><div class="service-order-head"><div><span class="service-order-number">${esc(number)}</span><h4>${esc(x.titulo||'Orden de servicio')}</h4><p>${esc(vehicleName(x.vehiculo_id))}${t.nombre?` · ${esc(t.nombre)}`:''}</p></div><span class="badge ${upperClass(x.estado)}">${esc(x.estado||'ABIERTA')}</span></div><div class="service-order-metrics"><span><small>PRIORIDAD</small><strong>${esc(x.prioridad||'NORMAL')}</strong></span><span><small>PROGRAMADA</small><strong>${esc(x.fecha_programada?new Date(x.fecha_programada).toLocaleDateString('es-CL'):'—')}</strong></span><span><small>COSTO</small><strong>$${Math.round(total).toLocaleString('es-CL')}</strong></span></div><p class="service-order-description">${esc(x.descripcion||'Sin descripción')}</p><div class="card-actions"><button class="mini detail" data-order-pdf="${esc(x.id)}" title="Exportar PDF" aria-label="Exportar PDF">📄</button>${permissionAllowed('MANTENCIONES','EDITAR')?`<button class="mini edit" data-edit-form="orden" data-id="${esc(x.id)}">✎ Editar</button>`:''}${permissionAllowed('MANTENCIONES','ELIMINAR')?`<button class="mini danger" data-delete-form="orden" data-id="${esc(x.id)}">Eliminar</button>`:''}</div></article>`}
async function loadServiceOrders(){await ensureCatalogs();if(!S.talleres.length){try{const tw=await api('listar',{recurso:'TALLERES',limit:300});S.talleres=tw.rows||[]}catch{}}const j=await api('listar',{recurso:'ORDENES_TRABAJO',limit:500});S.orders=j.rows||[];S.rows.ORDENES_TRABAJO=S.orders;populateAdvancedFilter('ordenes',S.orders);renderServiceOrders()}
function renderServiceOrders(){const rows=advancedFilteredRows('ordenes',S.orders||[]),open=rows.filter(x=>!['FINALIZADA','CERRADA','ANULADA'].includes(String(x.estado||'').toUpperCase())).length,urgent=rows.filter(x=>['URGENTE','ALTA','CRITICA'].includes(String(x.prioridad||x.criticidad||'').toUpperCase())).length,total=rows.reduce((a,x)=>a+orderTotal(x),0);$('orderKpis').innerHTML=ringKpi('Órdenes',rows.length,Math.min(100,rows.length*8),'blue','Filtradas')+ringKpi('Abiertas',open,rows.length?open/rows.length*100:0,open?'amber':'green','Requieren gestión')+ringKpi('Alta / urgente',urgent,rows.length?urgent/rows.length*100:0,urgent?'red':'green','Prioridad técnica')+ringKpi('Costo acumulado','$'+Math.round(total).toLocaleString('es-CL'),Math.min(100,total/1000000*100),'blue','Servicios filtrados');$('orderRows').innerHTML=rows.length?rows.map(serviceOrderCard).join(''):'<div class="notification-empty">No hay órdenes para los filtros seleccionados.</div>'}
async function openOrderFromMaintenance(id){const m=(S.rows.MANTENCIONES||[]).find(x=>String(x.id)===String(id));await openForm('orden');if(!m)return;setModalField('vehiculo_id',m.vehiculo_id);setModalField('mantencion_id',m.id);setModalField('taller_id',m.taller_id||'');setModalField('titulo',`Servicio · ${m.descripcion||vehicleName(m.vehiculo_id)}`);setModalField('descripcion',m.observaciones||m.descripcion||'');setModalField('kilometraje_apertura',m.kilometraje_real||m.kilometraje_programado||'')}
function downloadServiceOrderPdf(id){const x=S.orders.find(o=>String(o.id)===String(id));if(!x)return;const t=S.talleres.find(t=>String(t.id)===String(x.taller_id))||{},v=S.vehicles.find(v=>String(v.id)===String(x.vehiculo_id))||{};const rows=[{'Folio':serviceOrderNumber(x),'Vehículo':x.vehiculo_patente||v.patente||'Vehículo asociado','Marca / modelo':[v.marca,v.modelo].filter(Boolean).join(' '),'Taller':t.nombre||'Sin taller','Dirección taller':t.direccion||'','Prioridad':x.prioridad||'NORMAL','Estado':x.estado||'ABIERTA','Fecha programada':formatReportValue(x.fecha_programada),'KM apertura':x.kilometraje_apertura||0,'Diagnóstico':x.diagnostico||'','Trabajo realizado':x.trabajo_realizado||'','Repuestos':Number(x.costo_repuestos||0),'Mano de obra':Number(x.costo_mano_obra||0),'Otros':Number(x.costo_otros||0),'Costo total':orderTotal(x)}];EFleetExport.toPdf(`E-Fleet_${serviceOrderNumber(x)}.pdf`,`ORDEN DE SERVICIO · ${serviceOrderNumber(x)}`,rows,`${S.company?.nombre||''} · ${S.company?.rut||''}`)}

async function loadMaintenance(){if(!S.vehicles.length)await loadVehicles();if(!S.talleres.length){try{const tw=await api('listar',{recurso:'TALLERES',limit:300});S.talleres=tw.rows||[];S.rows.TALLERES=S.talleres}catch{}}const j=await api('listar',{recurso:'MANTENCIONES',limit:500});S.rows.MANTENCIONES=j.rows||[];populateAdvancedFilter('mantenciones',S.rows.MANTENCIONES);renderMaintenance()}
function renderMaintenance(){const rows=advancedFilteredRows('mantenciones',S.rows.MANTENCIONES||[]),closed=rows.filter(x=>['COMPLETADA','CERRADA'].includes(String(x.estado||'').toUpperCase())).length,overdue=rows.filter(x=>String(x.estado||'').toUpperCase()==='VENCIDA').length,totalCost=rows.reduce((a,x)=>a+Number(x.costo_total||0),0);$('maintenanceKpis').innerHTML=ringKpi('Cumplimiento',`${rows.length?Math.round(closed/rows.length*100):0}%`,rows.length?closed/rows.length*100:0,'green',`${closed} completadas`)+ringKpi('Pendientes',String(rows.length-closed),rows.length?(rows.length-closed)/rows.length*100:0,overdue?'red':'amber',`${overdue} vencidas`)+ringKpi('Costo acumulado','$'+Math.round(totalCost).toLocaleString('es-CL'),Math.min(100,totalCost/1000000*100),'blue','Registros filtrados');$('mantencionesRows').innerHTML=rows.length?rows.map(mantCard).join(''):'<div class="notification-empty">No hay mantenciones para los filtros seleccionados.</div>'}

async function loadMaintenanceHistory(){
 if(!S.vehicles.length)await loadVehicles();let j;
 try{j=await api('listar',{recurso:'HISTORIAL_MANTENCIONES',limit:500})}
 catch(e){if(['RECURSO_NO_DISPONIBLE','ACCION_NO_DISPONIBLE'].includes(String(e.message||'').toUpperCase()))j=await api('listar',{recurso:'MANTENCIONES',limit:500});else throw e}
 S.history=j.rows||[];
 const select=$('historyVehicle'),current=select?.value||'';if(select){select.innerHTML='<option value="">Todos los vehículos</option>'+S.vehicles.map(v=>`<option value="${esc(v.id)}">${esc(v.patente)} · ${esc(v.marca||'')} ${esc(v.modelo||'')}</option>`).join('');select.value=current}populateAdvancedFilter('historial',S.history);
 renderMaintenanceHistory();
}
function renderMaintenanceHistory(){
 const rows=advancedFilteredRows('historial',S.history||[]).slice().sort((a,b)=>new Date(b.fecha_termino||b.fecha_inicio||b.fecha_programada||b.actualizado_en||0)-new Date(a.fecha_termino||a.fecha_inicio||a.fecha_programada||a.actualizado_en||0));
 const completed=rows.filter(x=>['COMPLETADA','CERRADA'].includes(String(x.estado||'').toUpperCase())).length,cost=rows.reduce((a,x)=>a+Number(x.costo_total||0),0),preventive=rows.filter(x=>String(x.tipo||'').toUpperCase()==='PREVENTIVA').length;
 $('historyKpis').innerHTML=ringKpi('Registros',String(rows.length),Math.min(100,rows.length*5),'blue','Trazabilidad visible')+ringKpi('Completadas',String(completed),rows.length?completed/rows.length*100:0,'green',`${rows.length?Math.round(completed/rows.length*100):0}% del historial`)+ringKpi('Preventivas',String(preventive),rows.length?preventive/rows.length*100:0,'amber','Control planificado')+ringKpi('Costo total','$'+Math.round(cost).toLocaleString('es-CL'),Math.min(100,cost/1000000*100),'blue','Mantenciones filtradas');
 $('historyRows').innerHTML=rows.length?rows.map((x,i)=>{const date=x.fecha_termino||x.fecha_inicio||x.fecha_programada||x.actualizado_en;return `<article class="timeline-item unified-timeline-item" data-maintenance-open="${esc(x.id)}" role="button" tabindex="0"><div class="timeline-dot ${upperClass(x.estado)}"></div><div class="timeline-date">${esc(date?new Date(date).toLocaleDateString('es-CL'):'Sin fecha')}<small>${esc(date?new Date(date).toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'}):'')}</small></div><div class="timeline-card"><div class="timeline-head"><div><span class="badge">${esc(x.tipo||'MANTENCIÓN')}</span><h4>${esc(x.descripcion||'Mantención')}</h4></div><span class="badge ${upperClass(x.estado)}">${esc(x.estado||'PENDIENTE')}</span></div><p>🚙 ${esc(vehicleName(x.vehiculo_id))} · KM ${Number(x.kilometraje_real||x.kilometraje_programado||0).toLocaleString('es-CL')} · <b>$${Number(x.costo_total||0).toLocaleString('es-CL')}</b></p>${x.observaciones?`<p>${esc(x.observaciones)}</p>`:''}<div class="timeline-link-hint">Pincha para abrir el detalle completo y sus asociaciones</div></div></article>`}).join(''):'<div class="notification-empty">No hay mantenciones para estos filtros.</div>';
}

function predictionCard(x){const risk=Number(x.riesgo_porcentaje||x.probabilidad_porcentaje||0),tone=risk>=75?'danger':risk>=50?'warn':'ok';return `<article class="card prediction-card"><div class="prediction-card-head"><div><span class="badge ${tone}">${esc(x.nivel_riesgo||'BAJO')}</span><h4>${esc(vehicleName(x.vehiculo_id)||'Vehículo')}</h4></div><strong>${Math.round(risk)}%</strong></div><p>${esc(x.explicacion||x.tipo_prediccion||'Análisis registrado')}</p><p><b>Acción sugerida:</b> ${esc(x.recomendacion||'Mantener control preventivo')}</p><div class="metric-bar"><span style="width:${Math.max(0,Math.min(100,risk))}%"></span></div><div class="life-actions"><button class="mini detail" data-life-vehicle="${esc(x.vehiculo_id)}">Ver vehículo</button></div></article>`}
async function loadPredictions(){if(!S.vehicles.length&&permissionAllowed('VEHICULOS','LEER'))await loadVehicles();try{await api('PREDICCIONES_AUTOMATICAS',{forzar:'NO'})}catch{}const j=await api('listar',{recurso:'PREDICCIONES',limit:200});S.rows.PREDICCIONES=j.rows||[];populateAdvancedFilter('predicciones',S.rows.PREDICCIONES);renderPredictions()}
function renderPredictions(){const rows=advancedFilteredRows('predicciones',S.rows.PREDICCIONES||[]);$('predictionRows').innerHTML=rows.length?rows.map(predictionCard).join(''):'<div class="notification-empty">No hay análisis para los filtros seleccionados.</div>'}
function renderPredictionOverview(a){
 if(!a)return;const risk=String(a.nivelRiesgo||'BAJO').toUpperCase(),health=Number(a.saludPorcentaje||0),k=a.kpis||{},priorities=a.prioridades||[];
 $('predictionOverview').innerHTML=`<div class="prediction-ring-card">${ringKpi('Salud estimada',`${Math.round(health)}%`,health,health<50?'red':health<75?'amber':'green',`Riesgo ${risk}`)}</div><div class="prediction-summary"><span class="risk-banner ${risk.toLowerCase()}">RIESGO ${esc(risk)}</span><h3>${esc(a.resumenEjecutivo||'Análisis completado')}</h3><div class="prediction-mini-grid"><div><small>Fallas abiertas</small><strong>${Number(k.fallasAbiertas||0)}</strong></div><div><small>Críticas</small><strong>${Number(k.fallasCriticas||0)}</strong></div><div><small>Mantenciones</small><strong>${Number(k.mantencionesPendientes||0)}</strong></div><div><small>Documentos vencidos</small><strong>${Number(k.documentosVencidos||0)}</strong></div></div></div><div class="priority-list"><h4>Prioridades</h4>${priorities.length?priorities.map((p,i)=>`<div class="priority-item"><b>${i+1}</b><span><strong>${esc(p.titulo)}</strong><small>${esc(p.evidencia)}</small><em>${esc(p.accion)}</em></span></div>`).join(''):'<p class="muted">Sin prioridades críticas registradas.</p>'}</div>`;
}
async function runPredictiveAnalysis(){const btn=$('btnRunPrediction');loading(btn,true);try{await api('PREDICCIONES_AUTOMATICAS',{forzar:'SI'}).catch(()=>{});const j=await api('NEXO',{pregunta:'Genera el análisis predictivo integral de la flota, prioriza riesgos de mantenimiento y explica la acción humana recomendada.'},true);S.lastPrediction=j.analisis||null;renderPredictionOverview(S.lastPrediction);toast('Análisis predictivo actualizado y guardado');await loadPredictions();await loadNotifications(false)}catch(e){toast('Análisis predictivo: '+e.message,true)}finally{loading(btn,false)}}

function lifeList(title,rows,render){return `<section class="life-section"><div class="life-section-head"><h4>${esc(title)}</h4><span>${rows.length}</span></div>${rows.length?rows.slice(0,12).map(render).join(''):'<p class="muted">Sin registros.</p>'}</section>`}
async function openVehicleLife(id){
 try{
  const j=await api('HOJA_VIDA_VEHICULO',{id},true),v=j.vehiculo,k=j.kpis||{};$('modalTitle').textContent=`Hoja de vida · ${v.patente||'Vehículo'}`;$('modal').querySelector('.modal-card').classList.add('wide-modal');
  $('modalBody').innerHTML=`<div class="life-identity"><span class="life-icon">🚙</span><div><span class="profile-label">VEHÍCULO</span><h3>${esc(v.patente)}</h3><p>${esc(v.marca||'')} ${esc(v.modelo||'')} · ${Number(v.kilometraje||0).toLocaleString('es-CL')} km · ${esc(v.estado||'')}</p></div></div><div class="ring-kpi-grid compact">${ringKpi('Mantenciones',k.mantenciones||0,Math.min(100,(k.mantenciones||0)*8),'blue','$'+Number(k.costoMantenciones||0).toLocaleString('es-CL'))}${ringKpi('Fallas abiertas',k.fallasAbiertas||0,Math.min(100,(k.fallasAbiertas||0)*20),k.fallasAbiertas?'red':'green','Riesgo vigente')}${ringKpi('Checklist',k.checkins||0,Math.min(100,(k.checkins||0)*5),'green','Inspecciones')}${ringKpi('Combustible',Math.round(k.combustibleLitros||0)+' L',Math.min(100,(k.combustibleLitros||0)/20),'amber','Acumulado')}</div><div class="life-columns">${lifeList('Mantenciones',j.mantenciones||[],x=>`<div class="life-row clickable" data-maintenance-open="${esc(x.id)}"><span>🔧</span><div><strong>${esc(x.descripcion)}</strong><small>${esc(x.estado)} · $${Number(x.costo_total||0).toLocaleString('es-CL')} · Pincha para detalle</small></div></div>`)}${lifeList('Fallas',j.fallas||[],x=>`<div class="life-row clickable" data-fault-open="${esc(x.id)}"><span>⚠</span><div><strong>${esc(x.titulo||'Falla')}</strong><small>${esc(x.criticidad||x.severidad)} · ${esc(x.estado)} · Pincha para ver detalle</small></div></div>`)}${lifeList('Documentos',j.documentos||[],x=>`<div class="life-row clickable" data-document-detail="${esc(x.id)}"><span>📄</span><div><strong>${esc(x.tipo_documento||'Documento')}</strong><small>${esc(x.fecha_vencimiento||'Sin vencimiento')} · Pincha para detalle</small></div></div>`)}${lifeList('Checklist',j.checkins||[],x=>`<div class="life-row clickable" data-checkin-open="${esc(x.id)}"><span>✓</span><div><strong>${esc(x.resultado_tecnico||x.estado)}</strong><small>${esc(x.fecha_inicio?new Date(x.fecha_inicio).toLocaleString('es-CL'):'')} · Pincha para detalle</small></div></div>`)}</div>`;
  $('modalSave').classList.add('hidden');$('modalCancel').textContent='Cerrar';openOverlay('modal');
 }catch(e){toast('Hoja de vida: '+e.message,true)}
}
async function openDriverLife(id){
 try{
  const j=await api('HOJA_VIDA_CONDUCTOR',{id},true),c=j.conductor,k=j.kpis||{};$('modalTitle').textContent=`Hoja de vida · ${c.nombre||'Conductor'}`;$('modal').querySelector('.modal-card').classList.add('wide-modal');
  $('modalBody').innerHTML=`<div class="life-identity"><span class="life-icon">👤</span><div><span class="profile-label">CONDUCTOR</span><h3>${esc(c.nombre)}</h3><p>${esc(c.rut||'Sin RUT')} · Licencia ${esc(c.licencia_clase||'—')} · ${c.usuario_id?'Usuario asociado':'Sin usuario asociado'}</p></div></div><div class="ring-kpi-grid compact">${ringKpi('Asignaciones',k.asignaciones||0,Math.min(100,(k.asignaciones||0)*12),'blue','Vehículos')}${ringKpi('Checklist',k.checkins||0,Math.min(100,(k.checkins||0)*6),'green','Inspecciones')}${ringKpi('Fallas',k.fallas||0,Math.min(100,(k.fallas||0)*15),k.fallas?'red':'green','Reportadas')}${ringKpi('Combustible',k.cargasCombustible||0,Math.min(100,(k.cargasCombustible||0)*8),'amber','Cargas')}</div><div class="life-columns">${lifeList('Asignaciones',j.asignaciones||[],x=>`<div class="life-row clickable" data-assignment-detail="${esc(x.id)}"><span>🚙</span><div><strong>${esc(vehicleName(x.vehiculo_id))}</strong><small>${esc(x.estado)} · ${esc(x.fecha_asignacion?new Date(x.fecha_asignacion).toLocaleDateString('es-CL'):'')} · Pincha para detalle</small></div></div>`)}${lifeList('Checklist',j.checkins||[],x=>`<div class="life-row clickable" data-checkin-open="${esc(x.id)}"><span>✓</span><div><strong>${esc(vehicleName(x.vehiculo_id))}</strong><small>${esc(x.resultado_tecnico||x.estado)} · Pincha para detalle</small></div></div>`)}${lifeList('Fallas reportadas',j.fallas||[],x=>`<div class="life-row clickable" data-fault-open="${esc(x.id)}"><span>⚠</span><div><strong>${esc(x.titulo||'Falla')}</strong><small>${esc(x.criticidad||x.severidad)} · ${esc(x.estado)} · Pincha para ver detalle</small></div></div>`)}${lifeList('Documentación y antecedentes',j.documentos||[],x=>{const st=docComputedState(x);return `<div class="life-row clickable" data-document-detail="${esc(x.id)}"><span>📄</span><div><strong>${esc(x.tipo_documento||'Documento')}</strong><small>${esc(st.replace('_',' '))} · ${esc(x.fecha_vencimiento||'Sin vencimiento')} · Pincha para detalle</small></div></div>`})}</div><div class="driver-doc-actions"><button class="mini detail" data-driver-docs="${esc(c.id)}">📄 Administrar documentación desde Conductores</button></div>`;
  $('modalSave').classList.add('hidden');$('modalCancel').textContent='Cerrar';openOverlay('modal');
 }catch(e){toast('Hoja de vida: '+e.message,true)}
}
async function openMaintenanceForVehicle(id){await openForm('mantencion');const select=$('modalBody').querySelector('[data-field="vehiculo_id"]');if(select)select.value=id}

const FORMS={
 vehiculo:{title:'Vehículo',resource:'VEHICULOS',fields:[
   ['patente','Patente','text'],['marca','Marca','text'],['modelo','Modelo','text'],['anio','Año','number'],
   ['color','Color','text'],['vin','VIN / Chasis','text'],['combustible','Combustible','text'],
   ['kilometraje','Kilometraje actual','number'],['estado','Estado','select:ACTIVO,DETENIDO,EN MANTENCION,INMOVILIZADO'],
   ['proxima_mantencion_fecha','Próxima mantención fecha','date'],['proxima_mantencion_km','Próxima mantención KM','number']
 ]},
 conductor:{title:'Conductor',resource:'CONDUCTORES',fields:[
   ['nombre','Nombre','text'],['rut','RUT','text'],['correo','Correo','email'],['telefono','Teléfono','text'],
   ['licencia_clase','Licencia clase','text'],['licencia_vencimiento','Vencimiento licencia','date'],
   ['usuario_id','Usuario de acceso asociado','user'],['estado','Estado','select:Activo,Inactivo,Suspendido']
 ]},
 checkin:{title:'Checklist técnico',resource:'CHECKINS',needsVehicle:true,needsDriver:true,fields:[
   ['kilometraje','Kilometraje','number'],
   ['resultado_tecnico','Resultado técnico','select:APTO,APTO CON OBSERVACIÓN,NO APTO'],
   ['autorizado_operar','Autorizado a operar','select:SI,NO'],
   ['estado','Estado','select:PENDIENTE,FINALIZADO,APROBADO,ANULADO'],
   ['observacion_general','Observación general','textarea']
 ]},
 falla:{title:'Falla',resource:'FALLAS',needsVehicle:true,needsDriver:true,fields:[
   ['titulo','Título / síntoma','text'],['descripcion','Descripción técnica','textarea'],
   ['origen','Origen','select:MANUAL,CHECKIN,MANTENCION,CONDUCTOR,NEXO'],
   ['severidad','Severidad','select:BAJA,MEDIA,ALTA,CRITICA'],['criticidad','Criticidad','select:BAJA,MEDIA,ALTA,CRITICA'],
   ['estado','Estado','select:DETECTADA,INFORMADA,REVISION,PROGRAMADA,EN REPARACION,RESUELTA,VERIFICADA'],
   ['kilometraje','Kilometraje','number'],['puede_operar','Puede operar','select:SI,NO'],
   ['requiere_inmovilizacion','Requiere inmovilización','select:NO,SI'],
   ['diagnostico_tecnico','Diagnóstico técnico','textarea'],['recomendacion','Recomendación','textarea']
 ]},
 mantencion:{title:'Mantención',resource:'MANTENCIONES',needsVehicle:true,fields:[
   ['descripcion','Descripción / trabajo','textarea'],['tipo','Tipo','select:PREVENTIVA,CORRECTIVA,PREDICTIVA'],['taller_id','Taller / lugar de atención','workshop'],
   ['estado','Estado','select:PENDIENTE,PROGRAMADA,EN PROCESO,COMPLETADA,VENCIDA,ANULADA'],
   ['kilometraje_programado','KM programado','number'],['kilometraje_real','KM real','number'],
   ['fecha_programada','Fecha programada','date'],['fecha_inicio','Fecha inicio','date'],['fecha_termino','Fecha término','date'],
   ['costo_total','Costo total','number'],['observaciones','Observaciones','textarea']
 ]},
 combustible:{title:'Carga de combustible',resource:'COMBUSTIBLE',needsVehicle:true,needsDriver:true,fields:[
   ['kilometraje','Kilometraje','number'],['litros','Litros','number'],['precio_litro','Precio/litro','number'],
   ['monto_total','Monto total','number'],['tipo_combustible','Tipo combustible','text'],['estacion','Estación','text'],
   ['direccion','Dirección','text'],['observaciones','Observaciones','textarea']
 ]},
 taller:{title:'Taller',resource:'TALLERES',fields:[
   ['nombre','Nombre / Empresa','text'],['rut','RUT','text'],['direccion','Dirección completa','text'],['telefono','Teléfono','text'],
   ['correo','Correo','email'],['contacto','Contacto','text'],['especialidad','Especialidad','text'],['estado','Estado','select:ACTIVO,INACTIVO']
 ]},
 orden:{title:'Orden de servicio',resource:'ORDENES_TRABAJO',needsVehicle:true,fields:[
   ['titulo','Título / servicio requerido','text'],['mantencion_id','Mantención asociada','maintenance'],['falla_id','Falla asociada','failure'],['taller_id','Taller','workshop'],
   ['prioridad','Prioridad','select:NORMAL,ALTA,URGENTE'],['estado','Estado','select:ABIERTA,PROGRAMADA,EN PROCESO,FINALIZADA,CERRADA,ANULADA'],
   ['fecha_programada','Fecha programada','date'],['kilometraje_apertura','KM apertura','number'],
   ['descripcion','Descripción / alcance','textarea'],['diagnostico','Diagnóstico','textarea'],['trabajo_realizado','Trabajo realizado','textarea'],
   ['costo_repuestos','Costo repuestos','number'],['costo_mano_obra','Costo mano de obra','number'],['costo_otros','Otros costos','number']
 ]},
 usuario:{title:'Usuario',resource:'USUARIOS',fields:[
   ['nombre','Nombre completo','text'],['correo','Correo de acceso','email'],['telefono','Teléfono','text'],
   ['rol_id','Perfil','role'],
   ['conductor_asociado_id','Conductor asociado (solo Conductor o Supervisor geográfico)','driverassociation'],
   ['estado','Estado','select:Activo,Inactivo,Suspendido'],
   ['contrasena','Contraseña (mínimo 8 caracteres; al editar es opcional)','password']
 ]}
};
let activeForm=null,activeRecord=null,activeCheckinContext=null;
const RESOURCE_BY_FORM={vehiculo:'VEHICULOS',conductor:'CONDUCTORES',checkin:'CHECKINS',falla:'FALLAS',mantencion:'MANTENCIONES',orden:'MANTENCIONES',taller:'TALLERES',combustible:'COMBUSTIBLE',asignacion:'ASIGNACIONES',taller:'TALLERES',usuario:'USUARIOS'};

function recordByForm(formKey,id){
 const resource=RESOURCE_BY_FORM[formKey], rows=resource==='VEHICULOS'?S.vehicles:resource==='CONDUCTORES'?S.drivers:(S.rows[resource]||[]);
 return rows.find(x=>String(x.id)===String(id))||null;
}
function dateForInput(v){if(!v)return '';const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toISOString().slice(0,10)}
async function openForm(k,record=null){
 activeForm=FORMS[k];activeRecord=record;activeCheckinContext=null;if(!activeForm)return;await ensureCatalogs();
 if(k==='conductor'&&isManagement()&&!S.users.length){const users=await api('listar',{recurso:'USUARIOS',limit:300});S.users=users.rows||[];S.rows.USUARIOS=S.users}
 if(['mantencion','orden'].includes(k)&&!S.talleres.length){try{const tw=await api('listar',{recurso:'TALLERES',limit:300});S.talleres=tw.rows||[];S.rows.TALLERES=S.talleres}catch{}}
 if(k==='orden'){if(!S.rows.MANTENCIONES?.length){try{const mm=await api('listar',{recurso:'MANTENCIONES',limit:300});S.rows.MANTENCIONES=mm.rows||[]}catch{}}if(!S.rows.FALLAS?.length){try{const ff=await api('listar',{recurso:'FALLAS',limit:300});S.rows.FALLAS=ff.rows||[]}catch{}}}
 $('modalTitle').textContent=(record?'Editar ':'Nuevo ')+activeForm.title;
 let h='';
 if(record)h+=`<div class="edit-id form-span-full">ID: ${esc(record.id)}</div>`;
 if(activeForm.needsVehicle)h+=`<div class="form-field"><label>Vehículo</label><select data-field="vehiculo_id"><option value="">Seleccione</option>${S.vehicles.map(v=>`<option value="${esc(v.id)}">${esc(v.patente)} · ${esc(v.marca||'')} ${esc(v.modelo||'')}</option>`).join('')}</select></div>`;
 if(activeForm.needsDriver)h+=`<div class="form-field"><label>Conductor</label><select data-field="conductor_id"><option value="">Sin conductor</option>${S.drivers.map(v=>`<option value="${esc(v.id)}">${esc(v.nombre)}</option>`).join('')}</select></div>`;
 for(const [key,label,type] of activeForm.fields){
   h+=`<div class="form-field ${type==='textarea'?'form-span-full':''}"><label>${esc(label)}</label>`;
   if(type==='textarea')h+=`<textarea data-field="${key}" rows="3"></textarea>`;
   else if(type.startsWith('select:'))h+=`<select data-field="${key}">${type.slice(7).split(',').map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('')}</select>`;
   else if(type==='role')h+=`<select data-field="${key}"><option value="ROL-CONDUCTOR">Conductor</option><option value="ROL-OPERADOR">Operador</option><option value="ROL-SUPERVISOR-GEO">Supervisor geográfico</option><option value="ROL-SUPERVISOR">Supervisor</option><option value="ROL-GERENCIA">Gerencia</option><option value="ROL-ADMIN">Administrador</option></select>`;
   else if(type==='workshop')h+=`<select data-field="${key}"><option value="">Sin taller asignado</option>${S.talleres.map(t=>`<option value="${esc(t.id)}">${esc(t.nombre)} · ${esc(t.direccion||'Sin dirección')}</option>`).join('')}</select>`;
   else if(type==='maintenance')h+=`<select data-field="${key}"><option value="">Sin mantención asociada</option>${(S.rows.MANTENCIONES||[]).map(m=>`<option value="${esc(m.id)}">${esc(vehicleName(m.vehiculo_id))} · ${esc(m.descripcion||m.id)}</option>`).join('')}</select>`;
   else if(type==='failure')h+=`<select data-field="${key}"><option value="">Sin falla asociada</option>${(S.rows.FALLAS||[]).map(f=>`<option value="${esc(f.id)}">${esc(vehicleName(f.vehiculo_id))} · ${esc(f.titulo||f.id)}</option>`).join('')}</select>`;
   else if(type==='driverassociation')h+=`<select data-field="${key}"><option value="">Sin conductor asociado</option>${S.drivers.filter(c=>!c.usuario_id||String(c.usuario_id)===String(record?.id||'')).map(c=>`<option value="${esc(c.id)}">${esc(c.nombre)} · ${esc(c.rut||'Sin RUT')}</option>`).join('')}</select>`;
   else if(type==='user')h+=`<select data-field="${key}" ${isManagement()?'':'disabled'}><option value="">Sin usuario asociado</option>${S.users.filter(u=>['ROL-CONDUCTOR','ROL-SUPERVISOR-GEO'].includes(normalizeRole(u.rol_id))).map(u=>`<option value="${esc(u.id)}">${esc(u.nombre)} · ${esc(u.correo)}</option>`).join('')}</select>`;
   else h+=`<input data-field="${key}" type="${type}">`;
   h+='</div>';
 }
 $('modalBody').innerHTML=`<div class="record-form-intro"><span>${record?'EDICIÓN SEGURA':'NUEVO REGISTRO'}</span><p>Los cambios quedan vinculados a la empresa activa y registrados para trazabilidad.</p></div><div class="record-form-grid">${h}</div>`;
 if(record){
   $('modalBody').querySelectorAll('[data-field]').forEach(el=>{
     const key=el.dataset.field;let value=record[key]??'';
     if(el.type==='date')value=dateForInput(value);
     el.value=value==null?'':String(value);
   });
 }
 if(k==='usuario'){
   const linked=record?.id?S.drivers.find(c=>String(c.usuario_id||'')===String(record.id)):null;setModalField('conductor_asociado_id',linked?.id||'');convertModalSelectToCards('rol_id');convertModalSelectToCards('estado');
   $('modalBody').querySelector('.record-form-intro p').textContent='La cuenta se crea dentro de la empresa activa. Después podrás abrir su matriz y habilitar cada módulo.';
 }
 if(k==='combustible'){
   const intro=$('modalBody').querySelector('.record-form-intro');intro.querySelector('p').textContent='Registra la carga con kilometraje y evidencia. E-Fleet calcula rendimiento/costo y puede tomar GPS automáticamente.';
   intro.insertAdjacentHTML('afterend',`<div class="fuel-form-tools"><button id="btnFuelFormGps" class="ghost" type="button">⌖ Capturar GPS y dirección</button><span id="fuelFormGpsStatus">${S.fuelPosition?.direccion?`✓ ${esc(S.fuelPosition.direccion)}`:'Ubicación pendiente'}</span></div><div class="record-form-grid"><div class="form-field"><label>Foto odómetro</label><input id="fuelOdometerFile" type="file" accept="image/jpeg,image/png,image/webp"></div><div class="form-field"><label>Boleta / comprobante</label><input id="fuelReceiptFile" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"></div></div>`);
   $('btnFuelFormGps').onclick=async()=>{const p=await captureFuelGps(false);if(p)$('fuelFormGpsStatus').textContent=`✓ ${p.direccion||`${p.latitud.toFixed(5)}, ${p.longitud.toFixed(5)}`}`};
 }
 if(k==='taller'){
   S.activeWorkshopGeo=record?{latitud:record.latitud,longitud:record.longitud,direccion:record.direccion_normalizada||record.direccion,comuna:record.comuna||'',ciudad:record.ciudad||'',region:record.region||''}:null;
   const addressField=$('modalBody').querySelector('[data-field="direccion"]')?.closest('.form-field');
   if(addressField){addressField.classList.add('form-span-full');addressField.insertAdjacentHTML('beforeend',`<div class="workshop-geocode-actions"><button id="btnGeocodeWorkshop" class="ghost" type="button">⌖ Buscar y validar dirección</button><span id="workshopGeocodeStatus">${record?.latitud!=null&&record?.longitud!=null?`✓ Ubicación guardada · ${Number(record.latitud).toFixed(5)}, ${Number(record.longitud).toFixed(5)}`:'Escribe la dirección; E-Fleet obtendrá las coordenadas automáticamente.'}</span></div>`);$('btnGeocodeWorkshop').onclick=()=>geocodeWorkshopAddress(true)}
   $('modalBody').querySelector('.record-form-intro p').textContent='Solo escribe la dirección. E-Fleet buscará la ubicación, normalizará el texto y guardará las coordenadas automáticamente.';
 }
 $('modalSave').textContent=record?'Guardar cambios':'Guardar';
 openOverlay('modal');
}

async function geocodeWorkshopAddress(showToast=false){
 const input=$('modalBody')?.querySelector('[data-field="direccion"]'),status=$('workshopGeocodeStatus');
 const direccion=String(input?.value||'').trim();if(direccion.length<5){if(showToast)toast('Escribe una dirección más completa',true);return null}
 const button=$('btnGeocodeWorkshop');loading(button,true);
 try{
   const j=await api('GEOCODIFICAR_DIRECCION',{direccion},true),g=j.ubicacion||j;
   S.activeWorkshopGeo={latitud:Number(g.latitud),longitud:Number(g.longitud),direccion:g.direccion||direccion,comuna:g.comuna||'',ciudad:g.ciudad||'',region:g.region||''};
   if(input&&g.direccion)input.value=g.direccion;
   if(status)status.textContent=`✓ ${g.comuna||g.ciudad||'Ubicación encontrada'} · ${Number(g.latitud).toFixed(5)}, ${Number(g.longitud).toFixed(5)}`;
   if(showToast)toast('Dirección encontrada y coordenadas listas');
   return S.activeWorkshopGeo;
 }catch(e){S.activeWorkshopGeo=null;if(status)status.textContent='No fue posible ubicar esa dirección. Corrígela e intenta nuevamente.';if(showToast)toast('Dirección: '+e.message,true);return null}
 finally{loading(button,false)}
}

async function saveModal(){
 if(!activeForm)return;const saveBtn=$('modalSave');loading(saveBtn,true);
 const row=activeRecord?{id:activeRecord.id}:{};
 $('modalBody').querySelectorAll('[data-field]').forEach(x=>{
   let v=x.value;
   if(x.type==='number')v=v===''?null:Number(v);
   if(x.type==='date')v=v?new Date(v+'T12:00:00').toISOString():null;
   row[x.dataset.field]=v===''?null:v;
 });
 const requestedDriverId=activeForm.resource==='USUARIOS'?String(row.conductor_asociado_id||''):'';if(activeForm.resource==='USUARIOS')delete row.conductor_asociado_id;
 if(activeCheckinContext&&activeForm.resource==='FALLAS'){
   row.vehiculo_id=activeCheckinContext.vehicleId;row.conductor_id=activeCheckinContext.driverId||null;row.checkin_id=activeCheckinContext.checkinId;row.origen='CHECKIN';row.kilometraje=Number(activeCheckinContext.kilometraje||row.kilometraje||0);
 }
 if(activeCheckinContext&&activeForm.resource==='MANTENCIONES'){
   row.vehiculo_id=activeCheckinContext.vehicleId;const trace=`Origen Checklist ${activeCheckinContext.checkinId}.`;if(!String(row.observaciones||'').includes(activeCheckinContext.checkinId))row.observaciones=`${trace} ${row.observaciones||''}`.trim();
 }
 if(activeForm.resource==='FALLAS'){
   row.origen=row.origen||'MANUAL';row.severidad=row.severidad||row.criticidad;
   row.puede_operar=row.puede_operar||((row.criticidad==='CRITICA')?'NO':'SI');
   row.requiere_inmovilizacion=row.requiere_inmovilizacion||((row.criticidad==='CRITICA')?'SI':'NO');
   if(!activeRecord)row.fecha_detectada=new Date().toISOString();
 }
 if(activeForm.resource==='COMBUSTIBLE'){
   if(!activeRecord)row.fecha_hora=new Date().toISOString();
   if(S.fuelPosition){row.latitud=S.fuelPosition.latitud;row.longitud=S.fuelPosition.longitud;row.precision_gps=S.fuelPosition.precision;row.direccion=S.fuelPosition.direccion||row.direccion;row.origen_ubicacion='GPS'}
 }
 if(activeForm.resource==='VEHICULOS'&&!row.estado)row.estado='ACTIVO';
 if(activeForm.resource==='CONDUCTORES'&&!row.estado)row.estado='Activo';
 try{
   if(activeForm.resource==='TALLERES'){
     const addressChanged=!activeRecord||String(activeRecord.direccion||'').trim()!==String(row.direccion||'').trim();
     if(row.direccion&&(addressChanged||!S.activeWorkshopGeo?.latitud||!S.activeWorkshopGeo?.longitud))await geocodeWorkshopAddress(false);
     if(row.direccion&&!S.activeWorkshopGeo)throw new Error('DIRECCION_NO_ENCONTRADA');
     if(S.activeWorkshopGeo){row.direccion=S.activeWorkshopGeo.direccion||row.direccion;row.direccion_normalizada=S.activeWorkshopGeo.direccion||row.direccion;row.latitud=S.activeWorkshopGeo.latitud;row.longitud=S.activeWorkshopGeo.longitud;row.comuna=S.activeWorkshopGeo.comuna||null;row.ciudad=S.activeWorkshopGeo.ciudad||null;row.region=S.activeWorkshopGeo.region||null;row.geocodificado_en=new Date().toISOString()}
   }
   if(activeForm.resource==='USUARIOS'){
     if(!isManagement())throw new Error('PERMISO_DENEGADO');
     if(!String(row.nombre||'').trim())throw new Error('NOMBRE_REQUERIDO');
     if(!String(row.correo||'').includes('@'))throw new Error('CORREO_INVALIDO');
     if(!activeRecord&&String(row.contrasena||'').length<8)throw new Error('CONTRASENA_MINIMO_8');
     if(requestedDriverId&&!['ROL-CONDUCTOR','ROL-SUPERVISOR-GEO'].includes(normalizeRole(row.rol_id)))throw new Error('SOLO_CONDUCTOR_O_SUPERVISOR_GEO_PUEDE_ASOCIARSE');
   }
   const saved=await api('guardar',{recurso:activeForm.resource,row});
   if(activeForm.resource==='COMBUSTIBLE'){
     const fuelId=saved.row?.id||activeRecord?.id;
     const odo=$('fuelOdometerFile')?.files?.[0],receipt=$('fuelReceiptFile')?.files?.[0];
     for(const [kind,file] of [['ODOMETRO',odo],['BOLETA',receipt]]){
       if(!file)continue;
       try{if(file.size>15*1024*1024)throw new Error('ARCHIVO_MAXIMO_15MB');await api('GUARDAR_EVIDENCIA_COMBUSTIBLE',{id:fuelId,tipo:kind,base64:await fileToBase64(file),mime:file.type,nombreArchivo:file.name})}
       catch(e){console.warn('[combustible][evidencia]',kind,e);toast(`Carga guardada; evidencia ${kind.toLowerCase()} pendiente: ${e.message}`,true)}
     }
   }
   if(activeForm.resource==='USUARIOS'){
     const userId=saved.row?.id||activeRecord?.id,previous=S.drivers.find(c=>String(c.usuario_id||'')===String(userId||''));
     if(previous&&String(previous.id)!==requestedDriverId)await api('guardar',{recurso:'CONDUCTORES',row:{...previous,usuario_id:null}});
     if(requestedDriverId){const target=S.drivers.find(c=>String(c.id)===requestedDriverId);if(!target)throw new Error('CONDUCTOR_ASOCIADO_NO_ENCONTRADO');await api('guardar',{recurso:'CONDUCTORES',row:{...target,usuario_id:userId}})}
   }
   const wasEdit=Boolean(activeRecord);closeModal();toast(wasEdit?'Cambios guardados':'Registro guardado');
   await refresh(document.querySelector('#nav button.active')?.dataset.view||'dashboard');
 }catch(e){toast('No se pudo guardar: '+friendlyError(e.message),true)}finally{loading(saveBtn,false)}
}
async function deleteRecord(formKey,id){
 const form=FORMS[formKey]||((formKey==='asignacion')?{resource:'ASIGNACIONES'}:null);if(!form)return;
 const module=FORM_MODULES[formKey]||form.resource;if(!permissionAllowed(module,'ELIMINAR'))return toast('Tu perfil no tiene permiso para eliminar',true);
 const rec=recordByForm(formKey,id);
 const label=rec?.patente||rec?.nombre||rec?.titulo||rec?.descripcion||id;
 if(!confirm(`¿Eliminar administrativamente "${label}"?\\n\\nEl registro quedará marcado como eliminado y la acción será auditada.`))return;
 try{
   await api('eliminar',{recurso:form.resource,id});
   if(form.resource==='ASIGNACIONES'){
     S.assignments=(S.assignments||[]).filter(x=>String(x.id)!==String(id));
     renderAssignments();
   }
   toast('Registro eliminado');await refresh(document.querySelector('#nav button.active')?.dataset.view||'dashboard');
 }catch(e){toast('No se pudo eliminar: '+e.message,true)}
}
async function approveCheckin(id){
 if(!permissionAllowed('CHECKIN','APROBAR_DIRECTO'))return toast('Tu perfil no tiene permiso para aprobar directamente',true);
 if(!confirm('¿Aprobar directamente este Checklist?\\nSe conservará el resultado técnico original.'))return;
 try{await api('APROBAR_CHECKIN_DIRECTO',{id});toast('Checklist aprobado directamente');await loadCheckin()}
 catch(e){toast('No se pudo aprobar: '+e.message,true)}
}
function closeModal(){$('modal').classList.add('hidden');$('modal').querySelector('.modal-card')?.classList.remove('wide-modal');activeForm=null;activeRecord=null;activeCheckinContext=null;S.activeWorkshopGeo=null;$('modalSave').textContent='Guardar';$('modalSave').classList.remove('hidden');$('modalSave').onclick=saveModal;$('modalCancel').textContent='Cancelar'}




function initials(name){
 const p=String(name||'Usuario').trim().split(/\s+/).filter(Boolean);
 return ((p[0]?.[0]||'U')+(p.length>1?(p[p.length-1]?.[0]||''):'')).toUpperCase();
}
async function loadProfile(){
 try{
   const previousVersion=Number(S.user?.versionPermisos||0),j=await api('PERFIL',{},true);if(j.user)S.user={...S.user,...j.user};
   if(j.empresa){S.company={...(S.company||{}),...j.empresa,nombre:j.empresa.nombre||S.company?.nombre||''};saveConnection(S.company,S.connection?.needsSetup||false)}
   S.perfilOperativo=j.perfilOperativo||S.perfilOperativo;applyPermissionsUi();
   $('profileInitials').textContent=initials(S.user?.nombre);
   $('profileMenuName').textContent=S.user?.nombre||'Usuario';
   $('profileMenuRole').textContent=roleLabel(S.user?.rolId);
   if(S.user?.fotoUrl){
     const pimg=$('profileImage');pimg.onerror=()=>{pimg.classList.add('hidden');$('profileInitials').classList.remove('hidden')};pimg.src=S.user.fotoUrl+(S.user.fotoUrl.includes('?')?'&':'?')+'efv='+Date.now();pimg.classList.remove('hidden');$('profileInitials').classList.add('hidden');
   }else{$('profileImage').classList.add('hidden');$('profileInitials').classList.remove('hidden')}
   const side=$('sideUser');if(side){const photo=S.user?.fotoUrl?`<img src="${esc(S.user.fotoUrl)}" alt="Foto de perfil" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">`:'';side.innerHTML=`<div class="side-user-profile">${photo}<span style="${S.user?.fotoUrl?'display:none':''}">${esc(initials(S.user?.nombre))}</span><div><strong>${esc(S.user?.nombre||'Usuario')}</strong><small>${esc(roleLabel(S.user?.rolId))}</small></div></div>`;}
   const active=document.querySelector('.view.active')?.id?.replace('view-',''),module=VIEW_PERMISSIONS[active];
   if(previousVersion&&Number(S.user?.versionPermisos||0)!==previousVersion&&module&&!permissionAllowed(module,'LEER'))showView(firstAllowedView());
 }catch(e){console.warn('perfil',e)}
}
function fileToBase64(file){
 return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=reject;r.readAsDataURL(file)});
}
async function uploadProfilePhoto(file){
 if(!file)return;const btn=$('btnChangePhoto');loading(btn,true);
 try{
  if(file.size>5*1024*1024)throw new Error('La foto no puede superar 5 MB');
  const base64=await fileToBase64(file);
  const j=await api('SUBIR_FOTO_PERFIL',{base64,mime:file.type,nombreArchivo:file.name},true);
  if(j.user)S.user={...S.user,...j.user};await loadProfile();$('profileMenu').classList.add('hidden');toast('Foto de perfil actualizada');
 }catch(e){toast('Foto de perfil: '+e.message,true)}finally{loading(btn,false);$('profileFile').value=''}
}

function docComputedState(d){
 if(!d.fecha_vencimiento)return 'VIGENTE';
 const now=new Date();now.setHours(0,0,0,0);const due=new Date(d.fecha_vencimiento+'T12:00:00');
 const days=Math.ceil((due-now)/86400000);
 if(days<0)return 'VENCIDO';if(days<=15)return 'PRIORITARIA';if(days<=Math.max(30,Number(d.alerta_dias||30)))return 'POR_VENCER';return 'VIGENTE';
}
function documentEntityLabel(d){
 if(String(d.tipo_entidad).toUpperCase()==='VEHICULO'){const v=S.vehicles.find(v=>v.id===d.vehiculo_id);return v?.patente||'Vehículo asociado'}
 const c=S.drivers.find(c=>c.id===d.conductor_id);return c?.nombre||'Conductor asociado';
}
async function loadDocuments(){
 await ensureCatalogs();
 const j=await api('listar',{recurso:'DOCUMENTOS',limit:500});S.documents=j.rows||[];populateAdvancedFilter('documentos',S.documents);try{const h=await api('listar',{recurso:'DOCUMENTOS_HISTORIAL',limit:500});S.documentHistory=h.rows||[]}catch{S.documentHistory=[]}
 renderDocuments();renderDocumentTimeline();
}
function renderDocuments(){
 const rows=advancedFilteredRows('documentos',S.documents||[]);
 const states=S.documents.map(docComputedState);
 $('docKpiTotal').textContent=S.documents.length;$('docKpiOk').textContent=states.filter(x=>x==='VIGENTE').length;
 $('docKpiWarn').textContent=states.filter(x=>x==='POR_VENCER').length;$('docKpiPriority').textContent=states.filter(x=>x==='PRIORITARIA').length;$('docKpiExpired').textContent=states.filter(x=>x==='VENCIDO').length;
 $('documentRows').innerHTML=rows.length?rows.map(d=>{
   const state=docComputedState(d),cls=state==='VENCIDO'?'danger':state==='PRIORITARIA'?'danger':state==='POR_VENCER'?'warn':'ok',isVeh=d.tipo_entidad==='VEHICULO';
   return `<article class="document-card">
    <div class="document-card-top"><div class="document-entity"><div class="document-entity-icon">${isVeh?'🚙':'👤'}</div><div><h4>${esc(d.tipo_documento)}</h4><p>${esc(documentEntityLabel(d))}</p></div></div><span class="doc-state ${cls}">${esc(state.replace('_',' '))}</span></div>
    <p>N° ${esc(d.numero_documento||'—')} · Vence: ${esc(d.fecha_vencimiento?new Date(d.fecha_vencimiento+'T12:00:00').toLocaleDateString('es-CL'):'Sin vencimiento')}</p>
    <p>${esc(d.nombre_archivo||'Sin archivo adjunto')}</p>
    <div class="document-actions">
      ${d.ruta?`<button class="mini detail" data-doc-view="${esc(d.id)}">Ver archivo</button>`:''}
      ${permissionAllowed('DOCUMENTOS','EDITAR')?`<button class="mini edit" data-doc-edit="${esc(d.id)}">✎ Editar</button>`:''}${permissionAllowed('DOCUMENTOS','ELIMINAR')?`<button class="mini danger" data-doc-delete="${esc(d.id)}">Eliminar</button>`:''}
    </div>
   </article>`;
 }).join(''):'<div class="notification-empty">No hay documentos con estos filtros.</div>';
}
function renderDocumentTimeline(){const box=$('documentTimeline');if(!box)return;const rows=(S.documentHistory||[]).slice().sort((a,b)=>new Date(b.fecha_hora||0)-new Date(a.fecha_hora||0));box.innerHTML=rows.length?rows.slice(0,120).map(x=>`<article class="timeline-item document-history-item"><div class="timeline-dot ${/ELIM|VENC/.test(String(x.tipo_evento||'').toUpperCase())?'danger':/REEMPL|CARGA/.test(String(x.tipo_evento||'').toUpperCase())?'ok':'warn'}"></div><div class="timeline-date">${esc(x.fecha_hora?new Date(x.fecha_hora).toLocaleString('es-CL'):'')}</div><div class="timeline-card"><div class="timeline-head"><div><span class="badge">${esc(x.tipo_evento||'EVENTO')}</span><h4>${esc(x.tipo_documento||'Documento')}</h4></div><span class="badge">${esc(roleLabel(x.rol_usuario||''))}</span></div><p>${esc(x.detalle||'Cambio documental registrado.')}</p><small>${esc(x.archivo_nuevo||x.archivo_anterior||'Sin nombre de archivo')} ${x.fecha_vencimiento_nueva?'· vence '+esc(new Date(x.fecha_vencimiento_nueva+'T12:00:00').toLocaleDateString('es-CL')):''}</small></div></article>`).join(''):'<div class="notification-empty">La línea de tiempo se irá construyendo con cada carga, reemplazo, edición o eliminación documental.</div>'}

async function openDocumentForm(record=null,prefill=null){
 await ensureCatalogs();
 activeRecord=record;activeForm=null;$('modalTitle').textContent=(record?'Editar':'Nuevo')+' documento';
 const type=record?.tipo_entidad||'VEHICULO';
 $('modalBody').innerHTML=`
  <label>Asociar a</label><select id="docEntityType"><option value="VEHICULO">Vehículo</option><option value="CONDUCTOR">Conductor</option></select>
  <div id="docEntityWrap"></div>
  <label>Tipo de documento</label><select id="docType"><option>Permiso de circulación</option><option>Revisión técnica</option><option>SOAP</option><option>Padrón</option><option>Licencia de conducir</option><option>Cédula de identidad</option><option>Hoja de vida del conductor</option><option>Certificado</option><option>Contrato</option><option>Otro</option></select>
  <label>Número / folio</label><input id="docNumber">
  <div class="form-grid"><div><label>Fecha emisión</label><input id="docIssue" type="date"></div><div><label>Fecha vencimiento</label><input id="docExpiry" type="date"></div><div><label>Alertar antes (días)</label><input id="docAlertDays" type="number" value="30"></div></div>
  <label>Observaciones</label><textarea id="docObs" rows="3"></textarea>
  <label>Archivo privado (PDF/JPG/PNG/WEBP · máximo 15 MB)</label><input id="docFile" type="file" accept="application/pdf,image/jpeg,image/png,image/webp">
 `;
 $('docEntityType').value=prefill?.tipo_entidad||type;
 const renderEntity=()=>{$('docEntityWrap').innerHTML=$('docEntityType').value==='VEHICULO'
   ?`<label>Vehículo</label><select id="docEntityId">${S.vehicles.map(v=>`<option value="${esc(v.id)}">${esc(v.patente)} · ${esc(v.marca||'')} ${esc(v.modelo||'')}</option>`).join('')}</select>`
   :`<label>Conductor</label><select id="docEntityId">${S.drivers.map(c=>`<option value="${esc(c.id)}">${esc(c.nombre)} · ${esc(c.rut||'')}</option>`).join('')}</select>`;
   if(record)$('docEntityId').value=record.vehiculo_id||record.conductor_id||'';
 };
 $('docEntityType').onchange=renderEntity;renderEntity();
 if(prefill){$('docEntityType').value=prefill.tipo_entidad||'CONDUCTOR';renderEntity();if($('docEntityId'))$('docEntityId').value=prefill.conductor_id||prefill.vehiculo_id||'';if(prefill.tipo_documento)$('docType').value=prefill.tipo_documento}
 if(record){$('docType').value=record.tipo_documento||'Otro';$('docNumber').value=record.numero_documento||'';$('docIssue').value=record.fecha_emision||'';$('docExpiry').value=record.fecha_vencimiento||'';$('docAlertDays').value=record.alerta_dias||30;$('docObs').value=record.observaciones||''}
 $('modalSave').onclick=saveDocument;$('modalSave').textContent=record?'Guardar cambios':'Guardar documento';openOverlay('modal');
}
async function saveDocument(){
 const btn=$('modalSave');loading(btn,true);
 try{
   const type=$('docEntityType').value,id=$('docEntityId').value,file=$('docFile').files[0];if(!activeRecord&&!file)throw new Error('Debes adjuntar el archivo del documento');
   const row={id:activeRecord?.id,tipo_entidad:type,vehiculo_id:type==='VEHICULO'?id:null,conductor_id:type==='CONDUCTOR'?id:null,
    tipo_documento:$('docType').value,numero_documento:$('docNumber').value,fecha_emision:$('docIssue').value||null,
    fecha_vencimiento:$('docExpiry').value||null,alerta_dias:Number($('docAlertDays').value||30),observaciones:$('docObs').value,
    estado:'VIGENTE'};
   let payload={row};
   if(file){if(file.size>15*1024*1024)throw new Error('Archivo máximo 15 MB');payload={...payload,base64:await fileToBase64(file),mime:file.type,nombreArchivo:file.name}}
   await api('GUARDAR_DOCUMENTO_ARCHIVO',payload,true);closeModal();toast('Documento guardado');await loadDocuments();
 }catch(e){toast('Documento: '+e.message,true)}finally{loading(btn,false)}
}
async function viewDocument(id,btn){
 loading(btn,true);try{const j=await api('VER_DOCUMENTO',{id},true);if(j.url)window.open(j.url,'_blank','noopener')}catch(e){toast('Documento: '+e.message,true)}finally{loading(btn,false)}
}
async function deleteDocument(id,btn){
 if(!confirm('¿Eliminar administrativamente este documento?'))return;loading(btn,true);
 try{await api('eliminar',{recurso:'DOCUMENTOS',id});toast('Documento eliminado');await loadDocuments()}catch(e){toast(e.message,true)}finally{loading(btn,false)}
}

async function loadAssignments(){await ensureCatalogs();const j=await api('listar',{recurso:'ASIGNACIONES',limit:300});S.assignments=j.rows||[];populateAdvancedFilter('asignaciones',S.assignments);renderAssignments()}
function renderAssignments(){
 const rows=advancedFilteredRows('asignaciones',S.assignments||[]);
 $('assignmentRows').innerHTML=rows.length?rows.map(a=>{
  const v=S.vehicles.find(v=>v.id===a.vehiculo_id)||{},c=S.drivers.find(c=>c.id===a.conductor_id)||{};
  const accepted=String(a.estado||'').toUpperCase()==='ACEPTADA',state=String(a.estado||'').toUpperCase();
  const qrAllowed=Boolean(a.vehiculo_id&&a.conductor_id&&!['FINALIZADA','CANCELADA','ANULADA'].includes(state)&&permissionAllowed('CHECKIN','GENERAR_QR'));
  const plate=a.vehiculo_patente||v.patente||'Vehículo asociado';
  const vehicleDesc=a.vehiculo_descripcion||[v.marca,v.modelo].filter(Boolean).join(' ')||'Unidad asignada';
  const driver=a.conductor_nombre||c.nombre||'Sin conductor asociado';
  const assignedUser=a.conductor_usuario_nombre||a.usuario_nombre||a.conductor_nombre||c.nombre||'Sin usuario asociado';
  const assignedBy=a.asignado_por_nombre||a.creado_por_nombre||'';
  const date=a.fecha_asignacion?new Date(a.fecha_asignacion).toLocaleString('es-CL'):'';
  return `<article class="assignment-card assignment-card-modern">
   <div class="assignment-top"><div><span class="assignment-eyebrow">VEHÍCULO ASIGNADO</span><div class="assignment-plate">🚙 ${esc(plate)}</div><div class="assignment-vehicle-desc">${esc(vehicleDesc)}</div></div><span class="assignment-status ${accepted?'accepted':''}">${esc(a.estado||'PENDIENTE')}</span></div>
   <div class="assignment-person"><span class="assignment-person-icon">👤</span><div><small>Usuario asignado</small><strong>${esc(assignedUser)}</strong>${driver&&driver!==assignedUser?`<span>Conductor: ${esc(driver)}</span>`:''}${assignedBy?`<span>Asignado por: ${esc(assignedBy)}</span>`:''}</div></div>
   <div class="assignment-meta">${date?`<span>📅 ${esc(date)}</span>`:''}${a.observaciones?`<span>📝 ${esc(a.observaciones)}</span>`:''}</div>
   <div class="card-actions assignment-actions"><button class="mini detail assignment-trace-button" data-assignment-trace="${esc(a.id)}">↺ Trazabilidad</button>${qrAllowed?`<button class="mini detail assignment-qr-button" data-assignment-qr="${esc(a.id)}" title="Generar QR para imprimir" aria-label="Generar QR para imprimir">▦ QR</button>`:''}${permissionAllowed('ASIGNACIONES','EDITAR')?`<button class="mini edit" data-assignment-edit="${esc(a.id)}">✎ Editar</button>`:''}${permissionAllowed('ASIGNACIONES','ELIMINAR')?`<button class="mini danger" data-assignment-delete="${esc(a.id)}">Eliminar</button>`:''}</div>
  </article>`
 }).join(''):'<div class="notification-empty">No hay asignaciones para los filtros seleccionados.</div>'
}

async function openAssignmentQr(id){
 const a=(S.assignments||[]).find(x=>String(x.id)===String(id));if(!a)return toast('Asignación no encontrada',true);
 if(!a.vehiculo_id||!a.conductor_id)return toast('La asignación requiere vehículo y conductor',true);
 if(!permissionAllowed('CHECKIN','GENERAR_QR'))return toast('Tu perfil no tiene permiso para generar QR',true);
 const btn=document.querySelector(`[data-assignment-qr="${CSS.escape(String(id))}"]`);loading(btn,true);
 try{const j=await api('GENERAR_QR_CHECKIN',{vehiculo_id:a.vehiculo_id,conductor_id:a.conductor_id},true);if(!j.qrValue)throw new Error('QR_NO_GENERADO');showGeneratedCheckinQr(j,a.vehiculo_id,a.conductor_id);toast('QR nuevo generado · listo para imprimir');}
 catch(e){toast('QR de asignación: '+friendlyError(e.message),true)}finally{loading(btn,false)}
}
async function openAssignmentForm(record=null){
 await ensureCatalogs();activeRecord=record;activeForm=null;$('modalTitle').textContent=(record?'Editar':'Nueva')+' asignación';
 $('modalBody').innerHTML=`<label>Vehículo</label><select id="asgVehicle">${S.vehicles.map(v=>`<option value="${esc(v.id)}">${esc(v.patente)} · ${esc(v.marca||'')} ${esc(v.modelo||'')}</option>`).join('')}</select>
 <label>Conductor</label><select id="asgDriver">${S.drivers.map(c=>`<option value="${esc(c.id)}">${esc(c.nombre)} · ${esc(c.rut||'')}</option>`).join('')}</select>
 <label>Estado</label><select id="asgState"><option value="PENDIENTE_ACEPTACION">Pendiente aceptación</option><option value="ACEPTADA">Aceptada</option><option value="FINALIZADA">Finalizada</option></select>
 <label>Observaciones</label><textarea id="asgObs" rows="3"></textarea>`;
 if(record){$('asgVehicle').value=record.vehiculo_id;$('asgDriver').value=record.conductor_id;$('asgState').value=record.estado;$('asgObs').value=record.observaciones||''}
 $('modalSave').onclick=saveAssignment;$('modalSave').textContent=record?'Guardar cambios':'Asignar y notificar';openOverlay('modal');
}
async function saveAssignment(){
 const btn=$('modalSave');loading(btn,true);
 try{await api('guardar',{recurso:'ASIGNACIONES',row:{id:activeRecord?.id,vehiculo_id:$('asgVehicle').value,conductor_id:$('asgDriver').value,estado:$('asgState').value,observaciones:$('asgObs').value}},true);
 closeModal();toast('Asignación guardada y notificación emitida');await loadAssignments();await loadNotifications(false)}catch(e){toast('Asignación: '+e.message,true)}finally{loading(btn,false)}
}
function assignmentEmergencyKind(n){
 const category=String(n?.categoria||'').toUpperCase(),title=String(n?.titulo||'').toUpperCase();
 if(category.includes('RETIRADA')||category.includes('REASIGN')||title.includes('REASIGN')||title.includes('RETIRAD'))return 'INFO';
 return 'ACCEPT';
}
function speakAssignmentEmergency(n){
 try{
   if(!n?.id||S.lastAssignmentVoiceId===n.id||!('speechSynthesis' in window))return;
   S.lastAssignmentVoiceId=n.id;
   window.speechSynthesis.cancel();
   const info=assignmentEmergencyKind(n)==='INFO';
   const speech=info
     ?`E-Fleet. Aviso de asignación. ${n.mensaje||'El vehículo dejó de estar asignado a tu perfil.'}`
     :`E-Fleet. Vehículo asignado. ${n.mensaje||'Tienes un vehículo asignado. Debes aceptar y validar el QR para realizar el Checklist.'}`;
   const msg=new SpeechSynthesisUtterance(speech);
   msg.lang='es-CL';msg.rate=0.96;msg.pitch=1;window.speechSynthesis.speak(msg);
 }catch(e){console.warn('[asignacion][voz]',e)}
}
function checkAssignmentEmergency(){
 const notifications=S.notifications||[];
 const pending=notifications.find(n=>{
   const category=String(n.categoria||'').toUpperCase(),entity=String(n.entidad_tipo||'').toUpperCase();
   return (category==='ASIGNACION'||category==='VEHICULO_CHECKIN_ASIGNADO'||entity==='ASIGNACION')
     &&String(n.requiere_aceptacion||'NO').toUpperCase()==='SI'
     &&String(n.estado_respuesta||'PENDIENTE').toUpperCase()==='PENDIENTE'
     &&String(n.eliminado||'NO').toUpperCase()!=='SI';
 });
 const info=pending?null:notifications.find(n=>{
   const category=String(n.categoria||'').toUpperCase(),title=String(n.titulo||'').toUpperCase();
   return String(n.eliminado||'NO').toUpperCase()!=='SI'
     &&String(n.leida||'NO').toUpperCase()!=='SI'
     &&(category==='VEHICULO_ASIGNACION_RETIRADA'||category.includes('REASIGN')||title.includes('REASIGN')||title.includes('RETIRAD'));
 });
 const n=pending||info;
 if(!n){
   S.pendingAssignment=null;
   $('assignmentEmergency')?.classList.add('hidden');
   return;
 }
 const kind=assignmentEmergencyKind(n);
 S.pendingAssignment=n;
 if($('assignmentEmergencyTitle'))$('assignmentEmergencyTitle').textContent=kind==='INFO'?(n.titulo||'Asignación actualizada'):'Vehículo asignado';
 $('assignmentEmergencyText').textContent=n.mensaje||(kind==='INFO'?'El vehículo dejó de estar asignado a tu perfil.':'Tienes un vehículo nuevo asignado. Acepta para validar el QR y comenzar el Checklist.');
 if($('btnAssignmentAccept'))$('btnAssignmentAccept').textContent=kind==='INFO'?'Entendido':'Aceptar y validar QR';
 if($('assignmentEmergency')?.classList.contains('hidden'))openOverlay('assignmentEmergency');
 speakAssignmentEmergency(n);
}
async function acceptPendingAssignment(){
 const n=S.pendingAssignment;if(!n)return;const btn=$('btnAssignmentAccept');loading(btn,true);
 try{
   if(assignmentEmergencyKind(n)==='INFO'){
     $('assignmentEmergency').classList.add('hidden');S.pendingAssignment=null;
     try{window.speechSynthesis?.cancel()}catch{}
     await markNotification(n.id);
     toast('Aviso de asignación confirmado');
     await loadAssignments().catch(()=>{});
     return;
   }
   const r=await api('ACEPTAR_ASIGNACION',{id:n.entidad_id},true);
   $('assignmentEmergency').classList.add('hidden');S.pendingAssignment=null;
   try{window.speechSynthesis?.cancel()}catch{}
   toast('Asignación ACEPTADA · valida ahora el QR del vehículo');
   await loadNotifications(false);
   showView('checkin');
   setTimeout(()=>openQrScanner().catch?.(()=>{}),450);
 }catch(e){toast('Asignación: '+e.message,true)}finally{loading(btn,false)}
}

function notificationIcon(n){
 const cat=String(n.categoria||n.entidad_tipo||'').toUpperCase();
 if(cat.includes('CHECK'))return '✓';
 if(cat.includes('FALLA'))return '⚠';
 if(cat.includes('MANT'))return '🔧';
 if(cat.includes('COMB'))return '⛽';
 return '🔔';
}
function notificationPriorityClass(n){
 const p=String(n.prioridad||'').toUpperCase();
 return /CRIT|URG/.test(p)?'critical':/ALTA|HIGH/.test(p)?'high':'';
}
async function hydrateNotificationsRich(force=false){
 if(!S.token||S.notificationHydratePromise)return S.notificationHydratePromise;
 const now=Date.now();if(!force&&now-Number(S.notificationHydrateAt||0)<30000)return;
 const badgeSeq=nextNotificationRequestSeq(),dataSeq=++S.notificationDataRequestSeq,epoch=Number(S.notificationMutationEpoch||0);
 S.notificationHydratePromise=api('NOTIFICACIONES_TIEMPO_REAL',{limit:100,modo:'DETALLE'},true).then(j=>{
   const rows=j.rows||[];const serverUnread=Number(j.noLeidas||0),critical=rows.some(n=>notificationPriorityClass(n)==='critical'&&String(n.leida||'NO').toUpperCase()!=='SI');
   applyNotificationBadgeSnapshot(serverUnread,badgeSeq,critical);
   // Secuencia de datos separada del pulso de campana: una lectura vieja no revive un estado anterior.
   if(epoch!==Number(S.notificationMutationEpoch||0)||dataSeq<Number(S.notificationDataAppliedSeq||0))return;
   S.notificationDataAppliedSeq=dataSeq;S.notificationHydrateAt=Date.now();S.notifications=rows;
   S.notificationPending=(S.notifications||[]).filter(n=>String(n.leida||'NO').toUpperCase()!=='SI'||(String(n.requiere_aceptacion||'NO').toUpperCase()==='SI'&&String(n.estado_respuesta||'PENDIENTE').toUpperCase()==='PENDIENTE'));
   const viewOpen=liveSyncView()==='notificaciones'||!$('notificationCenter')?.classList.contains('hidden');
   if(viewOpen){populateAdvancedFilter('notificaciones',S.notifications);renderNotifications();renderNotificationPage(Number(S.lastUnread??serverUnread));checkAssignmentEmergency();}
 }).catch(()=>{}).finally(()=>{S.notificationHydratePromise=null});
 return S.notificationHydratePromise;
}
async function loadNotifications(showErrors=true){
 if(!S.token)return;
 if((S.notifications||[]).length){renderNotifications();renderNotificationPage(Number(S.lastUnread||0));}
 if(S.notificationFetchPromise)return S.notificationFetchPromise;
 S.notificationFetchPromise=(async()=>{
  const badgeSeq=nextNotificationRequestSeq(),dataSeq=++S.notificationDataRequestSeq,epoch=Number(S.notificationMutationEpoch||0);
  try{
   const j=await api('NOTIFICACIONES_TIEMPO_REAL',{limit:100,modo:'RAPIDO'},true);
   const rows=j.rows||[];const serverUnread=Number(j.noLeidas||0),critical=rows.some(n=>notificationPriorityClass(n)==='critical'&&String(n.leida||'NO').toUpperCase()!=='SI');
   applyNotificationBadgeSnapshot(serverUnread,badgeSeq,critical);
   if(epoch!==Number(S.notificationMutationEpoch||0)||dataSeq<Number(S.notificationDataAppliedSeq||0))return;
   S.notificationDataAppliedSeq=dataSeq;S.notificationFastAt=Date.now();
   const currentPermissionVersion=Number(S.user?.versionPermisos||1),serverPermissionVersion=Number(j.versionPermisos||currentPermissionVersion);
   if(serverPermissionVersion!==currentPermissionVersion)loadProfile().catch(()=>{});
   S.notifications=rows;populateAdvancedFilter('notificaciones',S.notifications);
   S.notificationPending=(S.notifications||[]).filter(n=>String(n.leida||'NO').toUpperCase()!=='SI'||(String(n.requiere_aceptacion||'NO').toUpperCase()==='SI'&&String(n.estado_respuesta||'PENDIENTE').toUpperCase()==='PENDIENTE'));
   renderNotifications();renderNotificationPage(Number(S.lastUnread??serverUnread));checkAssignmentEmergency();
   const needsRich=liveSyncView()==='notificaciones'||!$('notificationCenter')?.classList.contains('hidden');if(needsRich)hydrateNotificationsRich(showErrors).catch(()=>{});
  }catch(e){if(showErrors)toast('Notificaciones: '+e.message,true)}
 })().finally(()=>{S.notificationFetchPromise=null});
 return S.notificationFetchPromise;
}
function notificationReadButton(n){
 const read=String(n.leida||'NO').toUpperCase()==='SI';
 return `<button type="button" class="mini ${read?'notification-read-done':'notification-mark-read'}" data-mark-notification="${esc(n.id)}" ${read?'disabled':''}>${read?'✓ Leída':'✓ Marcar como leída'}</button>`;
}
function notificationDetailRows(n){
 const when=n.fecha_hora?new Date(n.fecha_hora).toLocaleString('es-CL'):'Sin fecha';
 const rows=[
  ['Prioridad',n.prioridad||'NORMAL'],['Categoría',n.categoria||n.entidad_tipo||'Sistema'],['Fecha y hora',when],
  ['Estado',String(n.leida||'NO').toUpperCase()==='SI'?'Leída':'Pendiente'],['Respuesta',n.estado_respuesta||'—'],
  ['Vehículo',n.vehiculo_patente?`${n.vehiculo_patente}${n.vehiculo_descripcion?' · '+n.vehiculo_descripcion:''}`:'—'],
  ['Usuario',n.responsable_nombre||n.usuario_nombre||'—'],['Taller',n.taller_nombre||'—'],['Entidad',n.entidad_tipo||'—']
 ];
 return rows.map(([k,v])=>`<div class="notification-detail-field"><small>${esc(k)}</small><strong>${esc(v)}</strong></div>`).join('');
}
function openNotificationDetail(id){
 const n=(S.notifications||[]).find(x=>String(x.id)===String(id))||(S.notificationPending||[]).find(x=>String(x.id)===String(id));
 if(!n)return toast('Notificación no encontrada',true);
 S.currentNotificationDetailId=String(id);
 if(liveSyncView()==='notificaciones'&&$('notificationPageDetail')){
  const box=$('notificationPageDetail');
  box.innerHTML=renderInlineNotificationDetail(n);
  box.classList.remove('hidden');
  document.querySelectorAll('.notification-page-card').forEach(x=>x.classList.toggle('active-detail',String(x.dataset.notificationOpen)===String(id)));
  updateNotificationNavigationState();
  box.scrollIntoView({behavior:'smooth',block:'nearest'});
  return;
 }
 const modal=$('notificationDetailModal');if(!modal)return;
 $('notificationDetailTitle').textContent=n.titulo||'Detalle de notificación';
 $('notificationDetailBody').innerHTML=renderInlineNotificationDetail(n);
 modal.classList.remove('hidden');
}
function closeNotificationDetail(){if(liveSyncView()==='notificaciones'&&$('notificationPageDetail')&&!$('notificationPageDetail').classList.contains('hidden')){clearNotificationInlineDetail();return;}S.currentNotificationDetailId='';$('notificationDetailModal')?.classList.add('hidden');updateNotificationNavigationState();}
function renderNotifications(){
 const box=$('notificationRows');if(!box)return;
 const rows=S.notificationPending||[];
 box.innerHTML=rows.length?rows.map(n=>{
   const awaiting=String(n.requiere_aceptacion||'NO').toUpperCase()==='SI'&&String(n.estado_respuesta||'PENDIENTE').toUpperCase()==='PENDIENTE';
   const unread=String(n.leida||'NO').toUpperCase()!=='SI';
   const when=n.fecha_hora?new Date(n.fecha_hora).toLocaleString('es-CL'):'';
   return `<div class="notification-item ${unread?'unread':''} ${notificationPriorityClass(n)}" data-notification-open="${esc(n.id)}" role="button" tabindex="0" aria-haspopup="dialog">
      <div class="notification-symbol">${notificationIcon(n)}</div>
      <div class="notification-main">
        <div class="notification-card-top"><strong>${esc(n.titulo||'Notificación')}</strong><button type="button" class="mini notification-open-detail" data-notification-open-button="${esc(n.id)}">Ver detalle</button></div>
        <p>${esc(n.mensaje_legible||n.mensaje||'')}</p>
        ${(n.vehiculo_patente||n.responsable_nombre||n.usuario_nombre||n.taller_nombre)?`<div class="notification-context">${n.vehiculo_patente?`<span>🚙 <b>${esc(n.vehiculo_patente)}</b>${n.vehiculo_descripcion?` · ${esc(n.vehiculo_descripcion)}`:''}</span>`:''}${n.responsable_nombre?`<span>👤 Responsable: <b>${esc(n.responsable_nombre)}</b></span>`:n.usuario_nombre?`<span>👤 Usuario: <b>${esc(n.usuario_nombre)}</b></span>`:''}${n.taller_nombre?`<span>🏭 ${esc(n.taller_nombre)}</span>`:''}</div>`:''}
        <div class="notification-meta">
          <span>${esc(n.categoria||n.entidad_tipo||'Sistema')}</span><span>·</span><span>${esc(when)}</span>
          ${awaiting?'<span>· Respuesta pendiente</span>':''}${String(n.silenciosa||'NO').toUpperCase()==='SI'?'<span>· Silenciosa</span>':''}
        </div><div class="notification-inline-actions">${notificationReadButton(n)}${n.audio_disponible?`<button type="button" class="mini detail" data-audio-notification="${esc(n.id)}">▶ Escuchar nota de voz</button>`:''}${String(n.entidad_tipo||'').toUpperCase()==='CHECKIN'?`<button type="button" class="mini edit" data-resend-checklist-notification="${esc(n.id)}">↻ Reenviar Checklist</button>`:''}</div>
      </div>
   </div>`;
 }).join(''):'<div class="notification-empty">No hay notificaciones para mostrar.</div>';
}
function notificationFilterKpi(label,value,progress,tone,detail,filter,active){
 return `<article class="ring-kpi ${esc(tone)} actionable ${active?'active-selection':''}" data-notification-filter="${esc(filter)}" role="button" tabindex="0"><div class="ring-kpi-top"><span class="ring-kpi-icon">${esc(kpiGlyph(label))}</span><span class="ring-kpi-state">EN LÍNEA</span></div><div class="ring-gauge" style="--progress:${Math.max(0,Math.min(100,Number(progress)||0))}"><div><strong>${esc(value)}</strong><small>INDICADOR</small></div></div><div class="ring-kpi-copy"><h4>${esc(label)}</h4>${detail?`<p>${esc(detail)}</p>`:''}</div></article>`;
}
function notificationPageFilterMeta(filter){
 const map={pending:{title:'Detalle de pendientes',empty:'No hay notificaciones pendientes.',subtitle:'Elementos aún no leídos o con gestión pendiente.'},critical:{title:'Detalle de críticas',empty:'No hay notificaciones críticas.',subtitle:'Atención inmediata para eventos de criticidad alta.'},high:{title:'Detalle de prioridad alta',empty:'No hay notificaciones de prioridad alta.',subtitle:'Gestión prioritaria para el equipo operacional.'},response:{title:'Detalle de respuesta requerida',empty:'No hay notificaciones con respuesta requerida.',subtitle:'Asignaciones o eventos que todavía esperan acción.'}};
 return map[filter]||{title:'Detalle de notificaciones',empty:'No hay notificaciones en esta categoría.',subtitle:'Historial asociado al filtro seleccionado.'};
}
function notificationPageFilterRows(filter,sourceRows){
 const rows=Array.isArray(sourceRows)?sourceRows:advancedFilteredRows('notificaciones',S.notifications||[]);
 if(filter==='pending')return rows.filter(n=>String(n.leida||'NO').toUpperCase()!=='SI');
 if(filter==='critical')return rows.filter(n=>notificationPriorityClass(n)==='critical');
 if(filter==='high')return rows.filter(n=>notificationPriorityClass(n)==='high');
 if(filter==='response')return rows.filter(n=>String(n.estado_respuesta||'').toUpperCase()==='PENDIENTE');
 return rows;
}
function notificationPageCardMarkup(n){
 const awaiting=String(n.estado_respuesta||'').toUpperCase()==='PENDIENTE',unreadRow=String(n.leida||'NO').toUpperCase()!=='SI',when=n.fecha_hora?new Date(n.fecha_hora).toLocaleString('es-CL'):'';
 return `<article class="notification-page-card ${unreadRow?'unread':''} ${notificationPriorityClass(n)}" data-notification-open="${esc(n.id)}" role="button" tabindex="0" aria-haspopup="dialog"><div class="notification-symbol">${notificationIcon(n)}</div><div><div class="notification-card-title"><strong>${esc(n.titulo||'Notificación')}</strong><span>${esc(n.prioridad||'NORMAL')}</span></div><p>${esc(n.mensaje_legible||n.mensaje||'')}</p>${(n.vehiculo_patente||n.responsable_nombre||n.usuario_nombre)?`<div class="notification-context page">${n.vehiculo_patente?`<span>🚙 <b>${esc(n.vehiculo_patente)}</b>${n.vehiculo_descripcion?` · ${esc(n.vehiculo_descripcion)}`:''}</span>`:''}${n.responsable_nombre?`<span>👤 ${esc(n.responsable_nombre)}</span>`:n.usuario_nombre?`<span>👤 ${esc(n.usuario_nombre)}</span>`:''}</div>`:''}<small>${esc(n.categoria||n.entidad_tipo||'Sistema')} · ${esc(when)}${awaiting?' · Respuesta pendiente':''}</small><div class="notification-inline-actions"><button type="button" class="mini notification-open-detail" data-notification-open-button="${esc(n.id)}">Ver detalle</button>${notificationReadButton(n)}${n.audio_disponible?`<button type="button" class="mini detail" data-audio-notification="${esc(n.id)}">▶ Escuchar nota de voz</button>`:''}${String(n.entidad_tipo||'').toUpperCase()==='CHECKIN'?`<button type="button" class="mini edit" data-resend-checklist-notification="${esc(n.id)}">↻ Reenviar Checklist</button>`:''}</div></div></article>`;
}
function renderNotificationPageDetail(filteredRows){
 const box=$('notificationPageDetail');if(!box)return;const filter=String(S.notificationPageFilter||'');
 if(!filter){box.classList.add('hidden');box.innerHTML='';return}
 const meta=notificationPageFilterMeta(filter);
 box.classList.remove('hidden');
 box.innerHTML=`<div class="notification-focus-head"><div><small>DETALLE ACTIVO</small><h4>${esc(meta.title)}</h4><p>${esc(meta.subtitle)}</p></div><button type="button" class="ghost" data-notification-filter-clear="1">← Volver al resumen</button></div><div class="notification-focus-stats"><span>${filteredRows.length} registro(s)</span><span>Empresa y perfil respetados</span></div><div class="notification-focus-grid">${filteredRows.length?filteredRows.map(notificationPageCardMarkup).join(''):`<div class="notification-empty">${esc(meta.empty)}</div>`}</div>`;
}
function renderNotificationPage(unread=Number(S.lastUnread||0)){
 if(!$('notificationPageRows'))return;
 const rows=advancedFilteredRows('notificaciones',S.notifications||[]),critical=rows.filter(n=>notificationPriorityClass(n)==='critical'&&String(n.leida||'NO').toUpperCase()!=='SI').length,high=rows.filter(n=>notificationPriorityClass(n)==='high'&&String(n.leida||'NO').toUpperCase()!=='SI').length,pending=rows.filter(n=>String(n.estado_respuesta||'').toUpperCase()==='PENDIENTE').length;
 const active=String(S.notificationPageFilter||'');
 $('notificationKpis').innerHTML=
   notificationFilterKpi('Pendientes',unread,Math.min(100,unread*12),unread?'amber':'green','Campana autoritativa','pending',active==='pending')+
   notificationFilterKpi('Críticas',critical,Math.min(100,critical*25),critical?'red':'green','Atención inmediata','critical',active==='critical')+
   notificationFilterKpi('Prioridad alta',high,Math.min(100,high*20),high?'amber':'green','Gestión prioritaria','high',active==='high')+
   notificationFilterKpi('Respuesta requerida',pending,Math.min(100,pending*25),pending?'blue':'green','Asignaciones abiertas','response',active==='response');
 const displayRows=active?notificationPageFilterRows(active,rows):rows;
 renderNotificationPageDetail(active?displayRows:[]);
 $('notificationPageRows').innerHTML=displayRows.length?displayRows.map(notificationPageCardMarkup).join(''):`<div class="notification-empty">${esc(active?notificationPageFilterMeta(active).empty:'No existen alertas para esta cuenta.')}</div>`;
}

async function loadAudit(){if(!isManagement())return;const j=await api('listar',{recurso:'AUDITORIA',limit:500});S.auditRows=j.rows||[];populateAdvancedFilter('auditoria',S.auditRows);renderAudit()}
function auditTokenLabel(value){const raw=String(value||'').trim();if(!raw)return 'Sistema';const key=raw.toUpperCase().replace(/[^A-Z0-9ÁÉÍÓÚÑ]+/g,'_');const known={CHECKIN:'Checklist',CHECKINS:'Checklist',CHECKLIST:'Checklist',CHECKIN_ITEMS:'Ítems del Checklist',CHECKLIST_ITEMS:'Ítems del Checklist',CHECKIN_EVIDENCIAS:'Evidencias del Checklist',CHECKIN_PROGRAMACIONES:'Programación de Checklist',DOCUMENTOS:'Documentación',DOCUMENTOS_HISTORIAL:'Historial documental',MANTENCIONES:'Mantenciones',ORDENES_TRABAJO:'Órdenes de servicio',FALLAS:'Fallas',VEHICULOS:'Vehículos',CONDUCTORES:'Conductores',USUARIOS:'Usuarios',NOTIFICACIONES:'Notificaciones',PREDICCIONES:'Análisis predictivo',COMBUSTIBLE:'Combustible',AUDITORIA:'Auditoría',SISTEMA:'Sistema',GUARDAR:'Guardado',CREAR:'Creación',ACTUALIZAR:'Actualización',ELIMINAR:'Eliminación',APROBAR:'Aprobación',ENVIAR:'Envío',REENVIAR:'Reenvío',LEER:'Consulta'};return known[key]||raw.toLowerCase().replace(/_/g,' ').replace(/(^|\s)\S/g,m=>m.toUpperCase())}
function auditFieldLabel(key){const k=String(key||'').toLowerCase();const map={recurso:'Recurso',estado:'Estado',resultado:'Resultado',motivo:'Motivo',mensaje:'Detalle',descripcion:'Detalle',observacion:'Observación',observaciones:'Observaciones',cantidad:'Cantidad',archivo:'Archivo',tipo:'Tipo',accion:'Acción',modulo:'Módulo',entidad:'Entidad',origen:'Origen',destino:'Destino',prioridad:'Prioridad',criticidad:'Criticidad'};return map[k]||auditTokenLabel(key)}
function auditHumanValue(value,depth=0){if(value===null||value===undefined||value==='')return '';if(Array.isArray(value))return value.slice(0,6).map(v=>auditHumanValue(v,depth+1)).filter(Boolean).join(', ');if(typeof value==='object'){if(depth>1)return 'Información registrada';const parts=[];for(const [k,v] of Object.entries(value)){if(['empresa_id','empresaid','token','authorization','contrasena','password','service_key','apikey'].includes(String(k).toLowerCase()))continue;const hv=auditHumanValue(v,depth+1);if(hv)parts.push(`${auditFieldLabel(k)}: ${hv}`);if(parts.length>=6)break}return parts.join(' · ')}const str=String(value).trim();if(!str)return '';if((str.startsWith('{')&&str.endsWith('}'))||(str.startsWith('[')&&str.endsWith(']'))){try{return auditHumanValue(JSON.parse(str),depth+1)}catch{}}if(/^[A-Z0-9_ÁÉÍÓÚÑ-]{3,}$/.test(str))return auditTokenLabel(str);return str}
function auditReadableDetail(row){const detail=auditHumanValue(row?.detalle);if(detail)return detail;const resource=auditHumanValue(row?.recurso);if(resource)return `Recurso: ${resource}`;return 'Acción registrada correctamente en la trazabilidad del sistema.'}
function renderAudit(){if(!$('auditRows'))return;const rows=advancedFilteredRows('auditoria',S.auditRows||[]),today=chileDayKey(),todayCount=rows.filter(x=>chileDayFromValue(x.fecha_hora)===today).length,users=new Set(rows.map(x=>x.usuario_id).filter(Boolean)).size,modules=new Set(rows.map(x=>x.modulo).filter(Boolean)).size;$('auditKpis').innerHTML=ringKpi('Eventos',rows.length,Math.min(100,rows.length/5),'blue','Trazabilidad')+ringKpi('Hoy',todayCount,Math.min(100,todayCount*5),'green','Actividad')+ringKpi('Usuarios',users,Math.min(100,users*10),'amber','Actores')+ringKpi('Módulos',modules,Math.min(100,modules*8),'blue','Cobertura');$('auditRows').innerHTML=rows.length?rows.map(x=>`<article class="timeline-item audit-readable-item"><div class="timeline-dot ok"></div><div class="timeline-date">${esc(x.fecha_hora?new Date(x.fecha_hora).toLocaleString('es-CL'):'')}</div><div class="timeline-card audit-readable-card"><div class="timeline-head"><div><span class="badge">${esc(auditTokenLabel(x.modulo||'SISTEMA'))}</span><h4>${esc(auditTokenLabel(x.accion||'EVENTO'))}</h4></div><span class="badge">${esc(roleLabel(x.rol_usuario||''))}</span></div><p><strong>${esc(auditTokenLabel(x.entidad_tipo||'Registro'))}</strong>${x.entidad_id?` · <span class="audit-entity-id">${esc(x.entidad_id)}</span>`:''}</p><small class="audit-readable-detail">${esc(auditReadableDetail(x))}</small></div></article>`).join(''):'<div class="notification-empty">No hay eventos para los filtros seleccionados.</div>'}

function setNotificationPageFilter(filter=''){S.notificationPageFilter=String(filter||'');renderNotificationPage();const box=$('notificationPageDetail');if(S.notificationPageFilter&&box)requestAnimationFrame(()=>box.scrollIntoView({behavior:'smooth',block:'start'}))}

function clearNotificationBellVisual(){applyNotificationBadgeSnapshot(0,nextNotificationRequestSeq(),false)}
function openNotifications(){
 $('notificationCenter')?.classList.remove('hidden');
 loadNotifications(false);
}
function closeNotifications(){$('notificationCenter')?.classList.add('hidden')}
async function markNotification(id){
 try{
  const j=await api('MARCAR_NOTIFICACION',{id});
  S.notificationMutationEpoch=Number(S.notificationMutationEpoch||0)+1;
  const row=(S.notifications||[]).find(x=>String(x.id)===String(id));if(row){row.leida='SI';row.leida_en=j?.row?.leida_en||new Date().toISOString();}
  S.notificationPending=(S.notifications||[]).filter(n=>String(n.leida||'NO').toUpperCase()!=='SI'||(String(n.requiere_aceptacion||'NO').toUpperCase()==='SI'&&String(n.estado_respuesta||'PENDIENTE').toUpperCase()==='PENDIENTE'));
  const localUnread=(S.notifications||[]).filter(x=>String(x.leida||'NO').toUpperCase()!=='SI').length;
  const unread=Number.isFinite(Number(j?.noLeidas))?Number(j.noLeidas):localUnread;
  const critical=(S.notifications||[]).some(n=>String(n.leida||'NO').toUpperCase()!=='SI'&&notificationPriorityClass(n)==='critical');
  applyNotificationBadgeSnapshot(unread,nextNotificationRequestSeq(),critical);
  renderNotifications();renderNotificationPage(unread);if(String(S.currentNotificationDetailId||'')===String(id))openNotificationDetail(id);
  toast('Notificación marcada como leída');
  // Esperar cualquier lectura iniciada antes de la mutación y luego confirmar con el servidor.
  const pendingReads=[S.notificationFetchPromise,S.notificationHydratePromise].filter(Boolean);if(pendingReads.length)await Promise.allSettled(pendingReads);
  await loadNotifications(false);
 }catch(e){toast('No fue posible marcar la notificación: '+e.message,true)}
}
async function playNotificationAudio(id){try{const j=await api('AUDIO_NOTIFICACION',{id},true);if(!j.url)throw new Error('AUDIO_NO_DISPONIBLE');const a=new Audio(j.url);a.controls=true;a.autoplay=true;const wrap=document.createElement('div');wrap.className='floating-audio-player';wrap.innerHTML='<strong>Nota de voz</strong>';wrap.appendChild(a);const close=document.createElement('button');close.textContent='×';close.onclick=()=>{a.pause();wrap.remove()};wrap.appendChild(close);document.body.appendChild(wrap);await a.play().catch(()=>{});if(j.transcripcion)toast('Audio disponible · transcripción vinculada')}catch(e){toast('Audio: '+e.message,true)}}
async function resendChecklistNotification(notificationId){try{const j=await api('REENVIAR_NOTIFICACION_CHECKLIST',{notificacion_id:notificationId},true);toast(`Checklist reenviado a ${Number(j.enviadas||0)} destinatario(s)`);await loadNotifications(false)}catch(e){toast('Reenvío Checklist: '+e.message,true)}}

async function markAllNotifications(){
 try{
  const j=await api('MARCAR_TODAS_NOTIFICACIONES',{});S.notificationMutationEpoch=Number(S.notificationMutationEpoch||0)+1;(S.notifications||[]).forEach(x=>{x.leida='SI';x.leida_en=new Date().toISOString();});
  S.notificationPending=(S.notifications||[]).filter(n=>String(n.requiere_aceptacion||'NO').toUpperCase()==='SI'&&String(n.estado_respuesta||'PENDIENTE').toUpperCase()==='PENDIENTE');
  const unread=Number.isFinite(Number(j?.noLeidas))?Number(j.noLeidas):0;applyNotificationBadgeSnapshot(unread,nextNotificationRequestSeq(),false);
  renderNotifications();renderNotificationPage(unread);toast(`${Number(j?.marcadas||0)} notificación(es) marcada(s) como leídas`);
  const pendingReads=[S.notificationFetchPromise,S.notificationHydratePromise].filter(Boolean);if(pendingReads.length)await Promise.allSettled(pendingReads);
  await loadNotifications(false);
 }catch(e){toast('No fue posible marcar todas: '+e.message,true)}
}

function nexoCollapsed(){return localStorage.getItem('efm_nexo_collapsed')==='1'}
function syncNexoVisibility(){
 const allowed=Boolean(S.token),collapsed=nexoCollapsed();
 const dock=$('nexoDock'),fab=$('nexoFab'),toggle=$('nexoVisibilityToggle');
 // R1.8.8: una sola geometría autoritativa. El dock siempre está fijado con RIGHT.
 // Nunca se usa left ni un translateX negativo para ocultar NEXO; por eso el círculo
 // no puede saltar al costado izquierdo en escritorio, móvil o cambios de orientación.
 if(dock){
  dock.classList.toggle('hidden',!allowed);
  dock.classList.toggle('collapsed',allowed&&collapsed);
  dock.dataset.state=collapsed?'collapsed':'expanded';
 }
 if(toggle){
  toggle.classList.toggle('hidden',!allowed);
  toggle.classList.toggle('collapsed',collapsed);
  toggle.textContent=collapsed?'‹':'›';
  toggle.setAttribute('aria-label',collapsed?'Mostrar círculo de NEXO IA':'Ocultar círculo de NEXO IA');
  toggle.title=collapsed?'Mostrar círculo de NEXO IA':'Ocultar círculo de NEXO IA';
  toggle.setAttribute('aria-expanded',collapsed?'false':'true');
 }
 if(fab){
  fab.classList.toggle('hidden',!allowed);
  fab.classList.remove('nexo-hidden-by-toggle','nexo-collapsed');
  fab.setAttribute('aria-label','Abrir NEXO IA');
  fab.title='Abrir NEXO IA';
 }
 if(!allowed||collapsed)$('nexoPanel')?.classList.add('hidden');
}
function toggleNexoVisibility(){
 if(toggleNexoVisibility.busy)return;
 toggleNexoVisibility.busy=true;
 const willCollapse=!nexoCollapsed();
 localStorage.setItem('efm_nexo_collapsed',willCollapse?'1':'0');
 syncNexoVisibility();
 window.setTimeout(()=>{toggleNexoVisibility.busy=false},260);
}

function nexoOpen(){
  if(nexoCollapsed()){
    localStorage.setItem('efm_nexo_collapsed','0');
    syncNexoVisibility();
  }
  $('nexoPanel')?.classList.remove('hidden');
  setTimeout(()=>$('nexoInput')?.focus(),50);
}
function nexoClose(){
  $('nexoPanel')?.classList.add('hidden');
}
function nexoAdd(textValue,who='assistant',extra=''){
  const box=$('nexoMessages'); if(!box)return null;
  const div=document.createElement('div');
  div.className=`nexo-msg ${who} ${extra}`.trim();
  div.textContent=textValue;
  box.appendChild(div);
  box.scrollTop=box.scrollHeight;
  return div;
}
async function nexoAsk(question){
  question=String(question||'').trim();
  if(!question)return;
  nexoOpen();
  nexoAdd(question,'user');
  const input=$('nexoInput'); if(input)input.value='';
  const pending=nexoAdd('Consultando NEXO IA tu Asistente Virtual…','assistant','loading');
  const send=$('nexoSend'); if(send){send.setAttribute('aria-busy','true');send.classList.add('is-busy');}
  try{
    const j=await api('nexo',{pregunta:question},true);
    pending?.remove();
    const mode=j.iaDisponible ? `IA · ${j.modelo||'Gemini'}` : 'NEXO local · IA externa no configurada';
    nexoAdd(`${j.respuesta||'Sin respuesta'}\n\n${mode}`,'assistant');
  }catch(e){
    pending?.remove();
    nexoAdd(`No pude completar el análisis: ${e.message}`,'assistant');
  }finally{
    if(send){send.removeAttribute('aria-busy');send.classList.remove('is-busy');}
  }
}


function faultById(id){return (S.rows.FALLAS||[]).find(x=>String(x.id)===String(id))}
function cacheFaultDetail(f){
 if(!f?.id)return;
 S.rows.FALLAS=S.rows.FALLAS||[];
 const i=S.rows.FALLAS.findIndex(x=>String(x.id)===String(f.id));
 if(i>=0)S.rows.FALLAS[i]={...S.rows.FALLAS[i],...f};else S.rows.FALLAS.push(f);
}
async function openFaultDetail(id){
 id=String(id||'').trim();if(!id)return toast('Falla no identificada',true);
 // R1.8.29: una falla mostrada desde la hoja de vida puede no estar cargada en S.rows.FALLAS.
 // Abrimos el modal de inmediato y consultamos el registro canónico por ID para que el click nunca quede sin respuesta.
 $('modalTitle').textContent='Detalle de falla';
 $('modal').querySelector('.modal-card').classList.add('wide-modal');
 $('modalBody').innerHTML='<div class="notification-empty">Cargando detalle de la falla…</div>';
 $('modalSave').classList.add('hidden');$('modalCancel').textContent='Cerrar';openOverlay('modal');
 let f=faultById(id),trace=[],evidences=[],maintenance=[],orders=[];
 try{
   const j=await api('DETALLE_FALLA',{id},true);
   if(j.falla){f={...(f||{}),...j.falla};cacheFaultDetail(f)}
   trace=j.historial||[];evidences=j.evidencias||[];maintenance=j.mantenciones||[];orders=j.ordenes||[];
 }catch(e){
   console.warn('[falla][detalle]',e);
   if(!f){
     $('modalBody').innerHTML=`<div class="notification-empty">No fue posible abrir esta falla.<br><small>${esc(friendlyError(e.message||'DETALLE_FALLA_NO_DISPONIBLE'))}</small></div>`;
     return;
   }
 }
 if(!f){$('modalBody').innerHTML='<div class="notification-empty">Falla no encontrada.</div>';return}
 const vehicle=f.vehiculo_patente||vehicleName(f.vehiculo_id),driver=f.conductor_nombre||driverName(f.conductor_id),user=f.creado_por_nombre||userName(f.creado_por);
 $('modalTitle').textContent=`Falla · ${f.titulo||'Detalle'}`;
 $('modalBody').innerHTML=`<div class="life-identity"><span class="life-icon">⚠</span><div><span class="profile-label">FALLA REGISTRADA</span><h3>${esc(f.titulo||'Falla')}</h3><p>🚙 ${esc(vehicle)}${driver?` · 👤 ${esc(driver)}`:''}</p></div></div>
 <div class="fault-detail-grid"><div><small>CRITICIDAD</small><strong>${esc(f.criticidad||f.severidad||'MEDIA')}</strong></div><div><small>ESTADO</small><strong>${esc(f.estado||'DETECTADA')}</strong></div><div><small>KILOMETRAJE</small><strong>${Number(f.kilometraje||0).toLocaleString('es-CL')} km</strong></div><div><small>REPORTADO POR</small><strong>${esc(user||driver||'Perfil asociado')}</strong></div><div><small>FECHA</small><strong>${esc(f.fecha_detectada?new Date(f.fecha_detectada).toLocaleString('es-CL'):'—')}</strong></div><div><small>UBICACIÓN</small><strong>${esc(f.direccion||'Sin ubicación')}</strong></div></div>
 <h4>Comentario / descripción</h4><div class="fault-long-text">${esc(f.descripcion||'Sin comentario adicional.')}</div>
 ${f.diagnostico_tecnico?`<h4>Diagnóstico técnico</h4><div class="fault-long-text">${esc(f.diagnostico_tecnico)}</div>`:''}
 ${f.recomendacion?`<h4>Recomendación</h4><div class="fault-long-text">${esc(f.recomendacion)}</div>`:''}
 ${lifeList('Evidencias',evidences,x=>`<div class="life-row"><span>📷</span><div><strong>${esc(x.nombre||x.tipo||'Evidencia')}</strong><small>${esc(x.descripcion||x.mime||'')}</small></div></div>`)}
 ${lifeList('Trazabilidad',trace,x=>`<div class="life-row"><span>↺</span><div><strong>${esc(x.estado_nuevo||'Actualización')}</strong><small>${esc(x.detalle||'')} · ${esc(x.fecha_hora?new Date(x.fecha_hora).toLocaleString('es-CL'):'')}</small></div></div>`)}
 ${lifeList('Mantenciones asociadas',maintenance,x=>`<div class="life-row clickable" data-maintenance-open="${esc(x.id)}"><span>🔧</span><div><strong>${esc(x.descripcion||'Mantención')}</strong><small>${esc(x.estado||'')} · Pincha para detalle</small></div></div>`) }
 ${lifeList('Órdenes de servicio',orders,x=>`<div class="life-row"><span>📋</span><div><strong>${esc(x.titulo||serviceOrderNumber(x))}</strong><small>${esc(x.estado||'')}</small></div></div>`)}
 <div class="card-actions">${permissionAllowed('MANTENCIONES','GESTIONAR')?`<button class="mini edit" data-new-maintenance="${esc(f.vehiculo_id)}">+ Mantención</button>`:''}${permissionAllowed('FALLAS','GESTIONAR')?`<button class="mini edit" data-edit-form="falla" data-id="${esc(f.id)}">✎ Gestionar falla</button>`:''}</div>`;
}

async function openMaintenanceDetail(id){
 id=String(id||'').trim();if(!id)return toast('Mantención no identificada',true);
 $('modalTitle').textContent='Detalle de mantención';$('modal').querySelector('.modal-card').classList.add('wide-modal');$('modalBody').innerHTML='<div class="notification-empty">Cargando detalle de la mantención…</div>';$('modalSave').classList.add('hidden');$('modalCancel').textContent='Cerrar';openOverlay('modal');
 let m=(S.rows.MANTENCIONES||S.history||[]).find(x=>String(x.id)===id),failure=null,orders=[],workshop=null;
 try{const j=await api('DETALLE_MANTENCION',{id},true);m=j.mantencion||m;failure=j.falla||null;orders=j.ordenes||[];workshop=j.taller||null;if(m){S.rows.MANTENCIONES=S.rows.MANTENCIONES||[];const pos=S.rows.MANTENCIONES.findIndex(x=>String(x.id)===id);if(pos>=0)S.rows.MANTENCIONES[pos]={...S.rows.MANTENCIONES[pos],...m};else S.rows.MANTENCIONES.push(m)}}catch(e){console.warn('[mantencion][detalle]',e);if(!m){$('modalBody').innerHTML=`<div class="notification-empty">No fue posible abrir la mantención.<br><small>${esc(friendlyError(e.message||'DETALLE_MANTENCION_NO_DISPONIBLE'))}</small></div>`;return}}
 $('modalTitle').textContent=`Mantención · ${m.descripcion||'Detalle'}`;
 const start=m.fecha_inicio||m.fecha_programada,end=m.fecha_termino||m.fecha_cierre;
 $('modalBody').innerHTML=`<div class="life-identity"><span class="life-icon">🔧</span><div><span class="profile-label">MANTENCIÓN</span><h3>${esc(m.descripcion||'Mantención')}</h3><p>🚙 ${esc(m.vehiculo_patente||vehicleName(m.vehiculo_id))} · ${esc(m.tipo||'')}</p></div></div>
 <div class="fault-detail-grid"><div><small>ESTADO</small><strong>${esc(m.estado||'PENDIENTE')}</strong></div><div><small>COSTO TOTAL</small><strong>$${Number(m.costo_total||0).toLocaleString('es-CL')}</strong></div><div><small>KM PROGRAMADO</small><strong>${Number(m.kilometraje_programado||0).toLocaleString('es-CL')} km</strong></div><div><small>KM REAL</small><strong>${Number(m.kilometraje_real||0).toLocaleString('es-CL')} km</strong></div><div><small>INICIO / PROGRAMADA</small><strong>${esc(start?new Date(start).toLocaleString('es-CL'):'—')}</strong></div><div><small>TÉRMINO</small><strong>${esc(end?new Date(end).toLocaleString('es-CL'):'—')}</strong></div></div>
 ${m.observaciones?`<h4>Observaciones</h4><div class="fault-long-text">${esc(m.observaciones)}</div>`:''}
 ${workshop?`<h4>Taller</h4><div class="fault-long-text"><b>${esc(workshop.nombre||'Taller asociado')}</b><br>${esc(workshop.direccion||'Sin dirección')} ${workshop.telefono?'· '+esc(workshop.telefono):''}</div>`:''}
 ${failure?lifeList('Falla asociada',[failure],x=>`<div class="life-row clickable" data-fault-open="${esc(x.id)}"><span>⚠</span><div><strong>${esc(x.titulo||'Falla')}</strong><small>${esc(x.criticidad||x.severidad||'')} · ${esc(x.estado||'')} · Pincha para detalle</small></div></div>`):''}
 ${lifeList('Órdenes de servicio asociadas',orders,x=>`<div class="life-row"><span>📋</span><div><strong>${esc(x.titulo||serviceOrderNumber(x))}</strong><small>${esc(x.estado||'')} · $${Number(orderTotal(x)).toLocaleString('es-CL')}</small></div></div>`)}
 <div class="card-actions"><button class="mini detail" data-life-vehicle="${esc(m.vehiculo_id)}">Abrir hoja de vida</button>${permissionAllowed('MANTENCIONES','GESTIONAR')?`<button class="mini edit" data-edit-form="mantencion" data-id="${esc(m.id)}">✎ Gestionar mantención</button>`:''}</div>`;
}
async function openDocumentDetail(id){
 id=String(id||'').trim();let d=(S.documents||[]).find(x=>String(x.id)===id);if(!d){try{const j=await api('listar',{recurso:'DOCUMENTOS',id,limit:1});d=j.rows?.[0]}catch{}}
 if(!d)return toast('Documento no encontrado',true);const state=docComputedState(d);
 $('modalTitle').textContent=`Documento · ${d.tipo_documento||'Detalle'}`;$('modal').querySelector('.modal-card').classList.add('wide-modal');$('modalSave').classList.add('hidden');$('modalCancel').textContent='Cerrar';
 $('modalBody').innerHTML=`<div class="life-identity"><span class="life-icon">📄</span><div><span class="profile-label">DOCUMENTO</span><h3>${esc(d.tipo_documento||'Documento')}</h3><p>${esc(documentEntityLabel(d))}</p></div></div><div class="fault-detail-grid"><div><small>ESTADO</small><strong>${esc(state.replace('_',' '))}</strong></div><div><small>NÚMERO / FOLIO</small><strong>${esc(d.numero_documento||'—')}</strong></div><div><small>EMISIÓN</small><strong>${esc(d.fecha_emision||'—')}</strong></div><div><small>VENCIMIENTO</small><strong>${esc(d.fecha_vencimiento||'Sin vencimiento')}</strong></div><div><small>ARCHIVO</small><strong>${esc(d.nombre_archivo||'Sin archivo')}</strong></div><div><small>ALERTA</small><strong>${Number(d.alerta_dias||30)} días</strong></div></div>${d.observaciones?`<h4>Observaciones</h4><div class="fault-long-text">${esc(d.observaciones)}</div>`:''}<div class="card-actions">${d.ruta?`<button class="mini detail" data-doc-view="${esc(d.id)}">📄 Abrir archivo</button>`:''}${permissionAllowed('DOCUMENTOS','EDITAR')?`<button class="mini edit" data-doc-edit="${esc(d.id)}">✎ Editar</button>`:''}</div>`;openOverlay('modal');
}
async function openAssignmentDetail(id){
 id=String(id||'').trim();let a=(S.assignments||S.rows.ASIGNACIONES||[]).find(x=>String(x.id)===id);if(!a){try{const j=await api('listar',{recurso:'ASIGNACIONES',id,limit:1});a=j.rows?.[0]}catch{}}
 if(!a)return toast('Asignación no encontrada',true);
 $('modalTitle').textContent='Detalle de asignación';$('modal').querySelector('.modal-card').classList.add('wide-modal');$('modalSave').classList.add('hidden');$('modalCancel').textContent='Cerrar';$('modalBody').innerHTML=`<div class="life-identity"><span class="life-icon">🚙</span><div><span class="profile-label">ASIGNACIÓN</span><h3>${esc(a.vehiculo_patente||vehicleName(a.vehiculo_id))}</h3><p>👤 ${esc(a.conductor_nombre||driverName(a.conductor_id)||'Conductor asociado')}</p></div></div><div class="fault-detail-grid"><div><small>ESTADO</small><strong>${esc(a.estado||'PENDIENTE')}</strong></div><div><small>ASIGNADA</small><strong>${esc(a.fecha_asignacion?new Date(a.fecha_asignacion).toLocaleString('es-CL'):'—')}</strong></div><div><small>ACEPTADA</small><strong>${esc(a.fecha_aceptacion?new Date(a.fecha_aceptacion).toLocaleString('es-CL'):'—')}</strong></div><div><small>FIN</small><strong>${esc(a.fecha_fin?new Date(a.fecha_fin).toLocaleString('es-CL'):'—')}</strong></div></div><div class="card-actions"><button class="mini detail" data-life-vehicle="${esc(a.vehiculo_id)}">Hoja de vida vehículo</button>${a.conductor_id?`<button class="mini detail" data-life-driver="${esc(a.conductor_id)}">Hoja de vida conductor</button>`:''}</div>`;openOverlay('modal');
}

function formatElapsedSeconds(value){const sec=Number(value);if(!Number.isFinite(sec)||sec<0)return '—';const d=Math.floor(sec/86400),h=Math.floor((sec%86400)/3600),m=Math.floor((sec%3600)/60),ss=Math.floor(sec%60);return [d?`${d} d`:null,h?`${h} h`:null,m?`${m} min`:null,(!d&&!h&&m===0)?`${ss} s`:null].filter(Boolean).join(' ')||'0 min'}
async function openAssignmentTrace(id){
 id=String(id||'').trim();if(!id)return;
 $('modalTitle').textContent='Trazabilidad de asignación';$('modal').querySelector('.modal-card').classList.add('wide-modal');$('modalSave').classList.add('hidden');$('modalCancel').textContent='Cerrar';$('modalBody').innerHTML='<div class="notification-empty">Cargando línea de tiempo…</div>';openOverlay('modal');
 try{
  const j=await api('TRAZABILIDAD_ASIGNACION',{id},true),a=j.asignacion||{},r=j.resumen||{},rows=j.rows||[];
  $('modalTitle').textContent=`Trazabilidad · ${a.vehiculo_patente||vehicleName(a.vehiculo_id)||'Asignación'}`;
  $('modalBody').innerHTML=`<div class="life-identity"><span class="life-icon">↺</span><div><span class="profile-label">LÍNEA DE TIEMPO</span><h3>${esc(a.vehiculo_patente||vehicleName(a.vehiculo_id)||'Vehículo')}</h3><p>👤 ${esc(a.conductor_nombre||driverName(a.conductor_id)||'Conductor asociado')} · ${esc(a.estado||'')}</p></div></div>
   <div class="fault-detail-grid assignment-trace-summary"><div><small>ASIGNACIÓN</small><strong>${esc(r.fecha_asignacion?new Date(r.fecha_asignacion).toLocaleString('es-CL'):'—')}</strong></div><div><small>ACEPTACIÓN</small><strong>${esc(r.fecha_aceptacion?new Date(r.fecha_aceptacion).toLocaleString('es-CL'):'Pendiente')}</strong></div><div><small>HASTA ACEPTAR</small><strong>${esc(formatElapsedSeconds(r.segundos_hasta_aceptacion))}</strong></div><div><small>INICIO CHECKLIST</small><strong>${esc(r.primer_checklist_inicio?new Date(r.primer_checklist_inicio).toLocaleString('es-CL'):'Pendiente')}</strong></div><div><small>CHECKLIST FINALIZADOS</small><strong>${Number(r.checklists_finalizados||0)} / ${Number(r.checklists||0)}</strong></div><div><small>TIEMPO TOTAL</small><strong>${esc(formatElapsedSeconds(r.segundos_total))}</strong></div></div>
   <div class="checkin-trace-detail assignment-trace"><h4>Línea de tiempo de la asignación</h4>${rows.length?rows.map((x,i)=>`<article class="timeline-item assignment-timeline-item"><div class="timeline-dot ${/FIN|CIERRE|ACEPT/.test(String(x.tipo||'').toUpperCase())?'ok':/CANCEL|ANUL|ELIM/.test(String(x.tipo||'').toUpperCase())?'danger':'warn'}"></div><div class="timeline-date">${esc(x.fecha_hora?new Date(x.fecha_hora).toLocaleString('es-CL'):'')}</div><div class="timeline-card"><div class="timeline-head"><div><span class="badge">${esc(x.tipo||'EVENTO')}</span><h4>${i+1}. ${esc(x.titulo||'Evento')}</h4></div></div><p>${esc(x.detalle||'')}</p><small>Responsable: ${esc(x.usuario_nombre||'Sistema')}</small>${x.entidad_tipo==='CHECKIN'&&x.entidad_id?`<div class="timeline-link-hint">Checklist ${esc(x.entidad_id)}</div>`:''}</div></article>`).join(''):'<div class="notification-empty">Todavía no hay eventos registrados para esta asignación.</div>'}</div>`;
 }catch(e){$('modalBody').innerHTML=`<div class="notification-empty">No fue posible cargar la trazabilidad.<br><small>${esc(friendlyError(e.message||'TRAZABILIDAD_NO_DISPONIBLE'))}</small></div>`;}
}
async function openCheckinById(id){
 id=String(id||'').trim();let row=(S.rows.CHECKINS||S.checkinHistory||[]).find(x=>String(x.id)===id);if(!row){try{const j=await api('listar',{recurso:'CHECKINS',id,limit:1});row=j.rows?.[0];if(row){S.rows.CHECKINS=S.rows.CHECKINS||[];S.rows.CHECKINS.push(row)}}catch(e){return toast('Checklist: '+friendlyError(e.message),true)}}if(!row)return toast('Checklist no encontrado',true);openCheckinDetail(id);
}
async function openDashboardDetail(kind){
 kind=String(kind||'').toUpperCase();if(kind.startsWith('VEHICULO:'))return openVehicleLife(kind.slice(9));if(kind.startsWith('CONDUCTOR:'))return openDriverLife(kind.slice(10));
 $('modalTitle').textContent='Detalle del Dashboard';$('modal').querySelector('.modal-card').classList.add('wide-modal');$('modalBody').innerHTML='<div class="notification-empty">Cargando detalle…</div>';$('modalSave').classList.add('hidden');$('modalCancel').textContent='Cerrar';openOverlay('modal');
 try{
  let rows=[],title='Detalle';
  if(kind==='VEHICULOS'){title='Vehículos de la flota';const j=await api('listar',{recurso:'VEHICULOS',limit:300});rows=j.rows||[];$('modalBody').innerHTML=lifeList(title,rows,x=>`<div class="life-row clickable" data-life-vehicle="${esc(x.id)}"><span>🚙</span><div><strong>${esc(x.patente||'Vehículo')}</strong><small>${esc([x.marca,x.modelo].filter(Boolean).join(' '))} · ${Number(x.kilometraje||0).toLocaleString('es-CL')} km</small></div></div>`);}
  else if(kind==='FALLAS_ABIERTAS'||kind==='FALLAS_CRITICAS'){title=kind==='FALLAS_CRITICAS'?'Fallas críticas':'Fallas abiertas';const j=await api('listar',{recurso:'FALLAS',limit:500});rows=(j.rows||[]).filter(x=>!['RESUELTA','VERIFICADA','CERRADA','ANULADA','DESCARTADA'].includes(String(x.estado||'').toUpperCase())&&(kind!=='FALLAS_CRITICAS'||/CRIT|URG/.test(String(x.criticidad||x.severidad||'').toUpperCase())));$('modalBody').innerHTML=lifeList(title,rows,x=>`<div class="life-row clickable" data-fault-open="${esc(x.id)}"><span>⚠</span><div><strong>${esc(x.titulo||'Falla')}</strong><small>${esc(x.vehiculo_patente||vehicleName(x.vehiculo_id))} · ${esc(x.criticidad||x.severidad)} · ${esc(x.estado)}${x.descripcion?' · '+esc(String(x.descripcion).slice(0,90)):''}</small><em>Pincha para abrir el detalle de la falla</em></div></div>`);}
  else if(kind==='CHECKINS_HOY'){title='Checklist de hoy';const j=await api('listar',{recurso:'CHECKINS',limit:300});const today=chileDayKey();rows=(j.rows||[]).filter(x=>chileDayFromValue(x.fecha_inicio)===today);$('modalBody').innerHTML=lifeList(title,rows,x=>`<div class="life-row clickable" data-checkin-open="${esc(x.id)}"><span>✓</span><div><strong>${esc(x.vehiculo_patente||vehicleName(x.vehiculo_id))}</strong><small>${esc(x.resultado_tecnico||x.estado)} · ${esc(x.fecha_inicio?new Date(x.fecha_inicio).toLocaleTimeString('es-CL'):'')}</small></div></div>`);}
  else if(kind==='MANTENCIONES_PENDIENTES'){title='Mantenciones pendientes';const j=await api('listar',{recurso:'MANTENCIONES',limit:500});rows=(j.rows||[]).filter(x=>!['COMPLETADA','CERRADA','ANULADA'].includes(String(x.estado||'').toUpperCase()));$('modalBody').innerHTML=lifeList(title,rows,x=>`<div class="life-row clickable" data-maintenance-open="${esc(x.id)}"><span>🔧</span><div><strong>${esc(x.descripcion||'Mantención')}</strong><small>${esc(x.vehiculo_patente||vehicleName(x.vehiculo_id))} · ${esc(x.estado)} · $${Number(x.costo_total||0).toLocaleString('es-CL')}</small></div></div>`);}
  else if(kind==='COSTO_MES'){title='Costos del mes';const j=await api('listar',{recurso:'COSTOS',limit:500});const ym=new Date().toISOString().slice(0,7);rows=(j.rows||[]).filter(x=>String(x.fecha||x.creado_en||'').slice(0,7)===ym);const total=rows.reduce((a,x)=>a+Number(x.monto||x.costo||0),0);$('modalBody').innerHTML=`${ringKpi('Costo total','$'+Math.round(total).toLocaleString('es-CL'),Math.min(100,total/1000000*100),'blue','Mes actual')}<div class="dashboard-detail-list">${rows.map(x=>`<div class="life-row"><span>💲</span><div><strong>${esc(x.categoria||x.tipo||'Costo')}</strong><small>${esc(x.descripcion||'')} · $${Number(x.monto||x.costo||0).toLocaleString('es-CL')}</small></div></div>`).join('')||'<p class="muted">Sin costos registrados este mes.</p>'}</div>`;}
  else if(kind==='SALUD_FLOTA'||kind==='RIESGO_FLOTA'){title=kind==='SALUD_FLOTA'?'Salud de flota':'Riesgo operacional';const j=await api('listar',{recurso:'SALUD_VEHICULO',limit:500});rows=j.rows||[];$('modalBody').innerHTML=lifeList(title,rows,x=>`<div class="life-row clickable" data-life-vehicle="${esc(x.vehiculo_id)}"><span>📊</span><div><strong>${esc(x.vehiculo_patente||vehicleName(x.vehiculo_id))}</strong><small>Salud ${Number(x.salud_porcentaje||0).toFixed(0)}% · Riesgo ${Number(x.riesgo_porcentaje||0).toFixed(0)}%</small></div></div>`);}
  $('modalTitle').textContent=title;
 }catch(e){$('modalBody').innerHTML=`<div class="notification-empty">No fue posible cargar el detalle.<br><small>${esc(friendlyError(e.message))}</small></div>`}
}
async function openDriverDocuments(id){
 const c=S.drivers.find(x=>String(x.id)===String(id));if(!c)return;
 if(permissionAllowed('DOCUMENTOS','LEER')){try{const j=await api('listar',{recurso:'DOCUMENTOS',conductor_id:id,limit:200});S.documents=(S.documents||[]).filter(d=>String(d.conductor_id)!==String(id)).concat(j.rows||[])}catch(e){toast('Documentación: '+e.message,true)}}
 const docs=(S.documents||[]).filter(d=>String(d.conductor_id||'')===String(id));
 $('modalTitle').textContent=`Documentación · ${c.nombre}`;$('modal').querySelector('.modal-card').classList.add('wide-modal');
 const buttons=permissionAllowed('DOCUMENTOS','CREAR')?`<div class="driver-doc-actions"><button class="mini detail" data-driver-doc-add="${esc(id)}" data-doc-kind="Licencia de conducir">+ Licencia</button><button class="mini detail" data-driver-doc-add="${esc(id)}" data-doc-kind="Cédula de identidad">+ Cédula</button><button class="mini detail" data-driver-doc-add="${esc(id)}" data-doc-kind="Hoja de vida del conductor">+ Hoja de vida</button><button class="mini detail" data-driver-doc-add="${esc(id)}" data-doc-kind="Otro">+ Otro</button></div>`:'';
 $('modalBody').innerHTML=`<div class="life-identity"><span class="life-icon">📄</span><div><span class="profile-label">MISMO MÓDULO DOCUMENTOS</span><h3>${esc(c.nombre)}</h3><p>Todo lo cargado aquí queda registrado en Documentos con este conductor y la empresa activa.</p></div></div>${buttons}<div class="document-grid">${docs.length?docs.map(d=>{const st=docComputedState(d),cl=st==='VENCIDO'?'danger':st==='POR_VENCER'?'warn':'ok';return `<article class="document-card"><div class="document-card-top"><div><h4>${esc(d.tipo_documento)}</h4><p>${esc(d.numero_documento||'Sin número')}</p></div><span class="doc-state ${cl}">${esc(st.replace('_',' '))}</span></div><p>Vence: ${esc(d.fecha_vencimiento?new Date(d.fecha_vencimiento+'T12:00:00').toLocaleDateString('es-CL'):'Sin vencimiento')}</p><div class="document-actions">${d.ruta?`<button class="mini detail" data-doc-view="${esc(d.id)}">Ver archivo</button>`:''}${permissionAllowed('DOCUMENTOS','EDITAR')?`<button class="mini edit" data-doc-edit="${esc(d.id)}">Editar</button>`:''}</div></article>`}).join(''):'<div class="notification-empty">Sin documentos cargados para este conductor.</div>'}</div>`;
 $('modalSave').classList.add('hidden');$('modalCancel').textContent='Cerrar';openOverlay('modal');
}

let qrDetector=null;
async function ensureQrFallbackDecoder(){
 if(typeof window.jsQR==='function')return true;
 if(S.qrDecoderPromise)return S.qrDecoderPromise;
 S.qrDecoderPromise=(async()=>{
   const sources=['https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js','https://unpkg.com/jsqr@1.4.0/dist/jsQR.js'];
   for(const src of sources){
     try{
       await new Promise((resolve,reject)=>{const tag=document.createElement('script');const timer=setTimeout(()=>{tag.remove();reject(new Error('QR_DECODER_TIMEOUT'))},4500);tag.src=src;tag.async=true;tag.crossOrigin='anonymous';tag.onload=()=>{clearTimeout(timer);resolve()};tag.onerror=()=>{clearTimeout(timer);tag.remove();reject(new Error('QR_DECODER_LOAD'))};document.head.appendChild(tag)});
       if(typeof window.jsQR==='function')return true;
     }catch(e){console.warn('[qr][decoder]',src,e)}
   }
   return false;
 })();
 return S.qrDecoderPromise;
}
async function prepareNativeQrDetector(){
 qrDetector=null;
 try{
   if(!('BarcodeDetector' in window))return false;
   if(typeof BarcodeDetector.getSupportedFormats==='function'){
     const formats=await BarcodeDetector.getSupportedFormats();if(!formats.includes('qr_code'))return false;
   }
   qrDetector=new BarcodeDetector({formats:['qr_code']});return true;
 }catch(e){console.warn('[qr][native detector]',e);qrDetector=null;return false}
}
async function openQrScanner(){
 $('qrScannerModal').classList.remove('hidden');$('qrScannerInput').value='';$('qrScannerStatus').textContent='Preparando cámara y lector QR…';$('qrScannerStatus').className='qr-scanner-status scanning';
 S.qrNativeMisses=0;S.qrValidating=false;
 await Promise.allSettled([prepareNativeQrDetector(),ensureQrFallbackDecoder()]);
 await startQrScanner();
}
function stopQrScanner(){
 S.qrScanSeq=Number(S.qrScanSeq||0)+1;S.qrValidating=false;S.qrNativeMisses=0;
 if(S.qrScanTimer){clearTimeout(S.qrScanTimer);S.qrScanTimer=null}
 if(S.qrStream){for(const t of S.qrStream.getTracks())t.stop();S.qrStream=null}
 const v=$('qrScannerVideo');if(v)v.srcObject=null;
}
function closeQrScanner(){stopQrScanner();$('qrScannerModal').classList.add('hidden')}
async function validateQrValue(value){
 const status=$('qrScannerStatus'),clean=String(value||'').trim();if(!clean)throw new Error('QR_SIN_CONTENIDO');
 if(S.qrValidating)return null;S.qrValidating=true;status.textContent='QR detectado · validando con E-fleet…';status.className='qr-scanner-status detected';
 try{
   const j=await api('VALIDAR_QR_CHECKIN',{qrValue:clean},true);if(!j.valido)throw new Error('QR_INVALIDO');
   status.textContent=`✓ QR válido · ${j.vehiculo?.patente||'Vehículo'} · ${Math.ceil(Number(j.restanteSegundos||0)/60)} min restantes`;status.className='qr-scanner-status ok';
   if(navigator.vibrate)navigator.vibrate([80,40,80]);
   if(j.vehiculo?.id){selectCheckinVehicle(j.vehiculo.id,true);if(j.conductor?.id)selectCheckinDriver(j.conductor.id,true);setCheckinQrGate(true,j.vehiculo.id);if(!$('ciKm').value&&j.vehiculo.kilometraje)$('ciKm').value=j.vehiculo.kilometraje;setTimeout(()=>closeQrScanner(),380);toast(`QR validado · ${j.vehiculo.patente||vehicleName(j.vehiculo.id)}${j.conductor?.nombre?' · '+j.conductor.nombre:''}`)}
   return j;
 }catch(e){status.textContent='✕ '+friendlyError(e.message)+' · vuelve a apuntar al QR';status.className='qr-scanner-status error';throw e}
 finally{S.qrValidating=false}
}
function qrCanvasFrame(){
 const video=$('qrScannerVideo'),canvas=$('qrScannerCanvas');if(!video||!canvas||video.readyState<2||!video.videoWidth||!video.videoHeight)return null;
 const vw=video.videoWidth,vh=video.videoHeight,size=Math.min(vw,vh),crop=Math.floor(size*.92),sx=Math.floor((vw-crop)/2),sy=Math.floor((vh-crop)/2);
 const out=Math.min(900,Math.max(420,crop));canvas.width=out;canvas.height=out;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(video,sx,sy,crop,crop,0,0,out,out);return{canvas,ctx,width:out,height:out};
}
async function decodeQrFrame(frame){
 if(qrDetector){
   try{const codes=await qrDetector.detect(frame.canvas);const value=codes?.find(c=>String(c.rawValue||'').trim())?.rawValue;if(value)return String(value).trim();S.qrNativeMisses++}
   catch(e){S.qrNativeMisses++;if(S.qrNativeMisses<4)console.warn('[qr][native scan]',e)}
 }
 if(typeof window.jsQR==='function'){
   try{const img=frame.ctx.getImageData(0,0,frame.width,frame.height),code=window.jsQR(img.data,img.width,img.height,{inversionAttempts:'attemptBoth'});if(code?.data)return String(code.data).trim()}
   catch(e){console.warn('[qr][jsQR scan]',e)}
 }
 return '';
}
async function scanQrFrame(seq){
 if(seq!==S.qrScanSeq||!S.qrStream)return;const frame=qrCanvasFrame();
 if(frame&&!S.qrValidating){const value=await decodeQrFrame(frame);if(value){$('qrScannerInput').value=value;try{await validateQrValue(value);return}catch{}}}
 if(seq!==S.qrScanSeq||!S.qrStream)return;const status=$('qrScannerStatus');if(status&&!status.classList.contains('error')&&!S.qrValidating){status.textContent='Escaneo activo · centra el QR dentro del marco';status.className='qr-scanner-status scanning'}
 S.qrScanTimer=setTimeout(()=>scanQrFrame(seq),180);
}
async function startQrScanner(){
 const b=$('qrScannerStart');loading(b,true);
 try{
  stopQrScanner();if(!navigator.mediaDevices?.getUserMedia)throw new Error('CAMARA_NO_DISPONIBLE_EN_ESTE_NAVEGADOR');
  if(!qrDetector)await prepareNativeQrDetector();if(typeof window.jsQR!=='function')ensureQrFallbackDecoder();
  S.qrStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});
  const video=$('qrScannerVideo');video.srcObject=S.qrStream;video.setAttribute('playsinline','');video.muted=true;await video.play();
  const track=S.qrStream.getVideoTracks?.()[0];try{const caps=track?.getCapabilities?.()||{},advanced=[];if(caps.focusMode?.includes?.('continuous'))advanced.push({focusMode:'continuous'});if(advanced.length)await track.applyConstraints({advanced})}catch(e){console.warn('[qr][focus]',e)}
  const status=$('qrScannerStatus');status.className='qr-scanner-status scanning';status.textContent='Escaneo activo · centra el QR dentro del marco';const seq=++S.qrScanSeq;scanQrFrame(seq);
 }catch(e){const status=$('qrScannerStatus');status.textContent='No fue posible iniciar el escáner. Puedes validar el código manualmente. · '+friendlyError(e.message);status.className='qr-scanner-status error'}finally{loading(b,false)}
}

function blobToDataUrl(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob)})}
function openVoiceCommand(kind,context=null){
 S.voiceKind=kind;S.voiceContext=context;S.voiceBlob=null;S.voiceChunks=[];$('voiceTranscript').value='';$('voiceRecord').classList.remove('recording');$('voiceStatus').textContent='Presiona para grabar';
 const titles={FALLA:'Reportar falla por voz',NOTIFICACION:'Enviar notificación por voz',CHECKIN:'Comando de voz desde Checklist'};$('voiceTitle').textContent=titles[kind]||'Comando de voz';$('voiceSubtitle').textContent='Habla de forma natural. NEXO identifica la intención y respeta tu perfil y empresa.';$('voiceModal').classList.remove('hidden')
}
async function toggleVoiceRecording(){
 const button=$('voiceRecord');
 if(S.voiceRecorder&&S.voiceRecorder.state==='recording'){S.voiceRecorder.stop();return}
 try{
  const stream=await navigator.mediaDevices.getUserMedia({audio:true});const rec=new MediaRecorder(stream);S.voiceChunks=[];S.voiceRecorder=rec;
  rec.ondataavailable=e=>{if(e.data?.size)S.voiceChunks.push(e.data)};
  rec.onstop=()=>{S.voiceBlob=new Blob(S.voiceChunks,{type:rec.mimeType||'audio/webm'});for(const t of stream.getTracks())t.stop();button.classList.remove('recording');$('voiceStatus').textContent=`Nota lista · ${Math.max(1,Math.round(S.voiceBlob.size/1024))} KB`};
  rec.start();button.classList.add('recording');$('voiceStatus').textContent='Grabando… vuelve a presionar para detener';
 }catch(e){toast('Micrófono: '+e.message,true)}
}
function closeVoiceModal(){if(S.voiceRecorder?.state==='recording')S.voiceRecorder.stop();$('voiceModal').classList.add('hidden')}
async function sendVoiceCommand(){
 const b=$('voiceSend');loading(b,true);try{
  const transcript=String($('voiceTranscript').value||'').trim();let audioBase64=null,mime=null;
  if(S.voiceBlob){audioBase64=await blobToDataUrl(S.voiceBlob);mime=S.voiceBlob.type||'audio/webm'}
  if(!transcript&&!audioBase64)throw new Error('GRABA_O_ESCRIBE_LA_INSTRUCCION');
  const ctx=S.voiceContext||{},j=await api('COMANDO_VOZ',{tipo:S.voiceKind,transcripcion:transcript,audioBase64,mime,vehiculo_id:ctx.vehicleId||$('ciVehicle')?.value||null,conductor_id:ctx.driverId||$('ciDriver')?.value||null,checkin_id:ctx.checkinId||S.lastCheckinSaved?.checkinId||null,kilometraje:ctx.kilometraje||Number($('ciKm')?.value||0)},true);
  if(S.voiceKind==='CHECKIN'&&j.transcripcion){$('ciObs').value=[$('ciObs').value,j.transcripcion].filter(Boolean).join('\n');invalidateSavedCheckin()}
  closeVoiceModal();toast(j.mensaje||'Comando de voz procesado');if(S.voiceKind==='FALLA')await refresh('fallas');if(S.voiceKind==='NOTIFICACION')await loadNotifications(false)
 }catch(e){toast('Voz: '+friendlyError(e.message),true)}finally{loading(b,false)}
}

document.addEventListener('DOMContentLoaded',()=>{
 document.documentElement.dataset.efleetWebVersion=WEB_VERSION;
 document.addEventListener('pointerdown',e=>{const b=e.target.closest('button');if(!b||b.disabled||b.classList.contains('login-password-toggle'))return;S.actionButton=b;S.actionButtonAt=Date.now();b.classList.add('ux-feedback-button')},true);
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled||b.classList.contains('login-password-toggle'))return;b.classList.add('ux-feedback-button');if(!b.classList.contains('is-loading')){b.classList.add('tap-loading');setTimeout(()=>b.classList.remove('tap-loading'),360)}},true);
 renderChecklist();
 loadConnection();$('rut').value=S.company?.rut||localStorage.getItem('efm_rut')||'';
 $('btnResolve').onclick=resolveCompany;$('btnSetup').onclick=setup;$('btnLogin').onclick=login;$('btnLogout').onclick=()=>logout(true);$('btnChangeCompany').onclick=()=>clearConnection(false);$('btnClearConnection').onclick=()=>clearConnection(true);
 const loginPassword=$('loginPassword'),loginEmail=$('loginEmail'),toggleLoginPassword=$('btnToggleLoginPassword');
 if(toggleLoginPassword&&loginPassword){toggleLoginPassword.onclick=()=>{const show=loginPassword.type==='password';loginPassword.type=show?'text':'password';toggleLoginPassword.setAttribute('aria-pressed',String(show));toggleLoginPassword.setAttribute('aria-label',show?'Ocultar contraseña':'Mostrar contraseña');toggleLoginPassword.title=show?'Ocultar contraseña':'Mostrar contraseña';toggleLoginPassword.classList.toggle('showing',show);loginPassword.focus({preventScroll:true});const n=loginPassword.value.length;try{loginPassword.setSelectionRange(n,n)}catch{}}}
 const submitLoginOnEnter=e=>{if(e.key!=='Enter'||e.isComposing)return;e.preventDefault();if(!$('stepLogin')?.classList.contains('hidden')&&!$('btnLogin')?.disabled)$('btnLogin').click()};
 loginEmail?.addEventListener('keydown',submitLoginOnEnter);loginPassword?.addEventListener('keydown',submitLoginOnEnter);
 $('sidebarToggle').onclick=toggleSidebar;$('sidebarClose').onclick=closeSidebar;$('sidebarBackdrop').onclick=closeSidebar;
 window.addEventListener('resize',()=>{restoreSidebarState();syncNexoVisibility()});
 window.addEventListener('orientationchange',()=>setTimeout(syncNexoVisibility,80));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('appView')?.classList.contains('sidebar-open'))closeSidebar()});
 document.addEventListener('keydown',e=>{
   if(!['Enter',' '].includes(e.key))return;
   const a=document.activeElement;if(!a)return;
   if(a.dataset?.dashboardDetail){e.preventDefault();openDashboardDetail(a.dataset.dashboardDetail);return;}
   if(a.dataset?.maintenanceOpen){e.preventDefault();openMaintenanceDetail(a.dataset.maintenanceOpen);return;}
   if(a.dataset?.documentDetail){e.preventDefault();openDocumentDetail(a.dataset.documentDetail);return;}
   if(a.dataset?.assignmentTrace){e.preventDefault();openAssignmentTrace(a.dataset.assignmentTrace);return;}if(a.dataset?.assignmentDetail){e.preventDefault();openAssignmentDetail(a.dataset.assignmentDetail);return;}
   if(a.dataset?.checkinOpen){e.preventDefault();openCheckinById(a.dataset.checkinOpen);return;}
 });
 document.querySelectorAll('[data-back]').forEach(x=>x.onclick=()=>clearConnection(false));
 document.querySelectorAll('#nav button').forEach(x=>x.onclick=()=>showView(x.dataset.view));
 document.querySelectorAll('[data-open-form]').forEach(x=>x.onclick=()=>openForm(x.dataset.openForm));
 document.addEventListener('click',e=>{
   const edit=e.target.closest('[data-edit-form]');
   if(edit){const rec=recordByForm(edit.dataset.editForm,edit.dataset.id);if(rec)openForm(edit.dataset.editForm,rec);return;}
   const del=e.target.closest('[data-delete-form]');
   if(del){deleteRecord(del.dataset.deleteForm,del.dataset.id);return;}
   const app=e.target.closest('[data-approve-checkin]');
   if(app){approveCheckin(app.dataset.approveCheckin);return;}
   const detail=e.target.closest('[data-checkin-detail]');
   if(detail){openCheckinDetail(detail.dataset.checkinDetail);return;}
   const evidence=e.target.closest('[data-checkin-evidence]');if(evidence){openCheckinEvidence(evidence.dataset.checkinEvidence);return;}
   const scheduleDelete=e.target.closest('[data-checkin-schedule-delete]');if(scheduleDelete){cancelCheckinSchedule(scheduleDelete.dataset.checkinScheduleDelete);return;}
   const checkPdf=e.target.closest('[data-checkin-pdf]');if(checkPdf){downloadCheckinPdf(checkPdf.dataset.checkinPdf);return;}
   const workshopMap=e.target.closest('[data-workshop-map]');if(workshopMap){openWorkshopMap(workshopMap.dataset.workshopMap);return;}
   const orderFromMaintenance=e.target.closest('[data-order-from-maintenance]');if(orderFromMaintenance){openOrderFromMaintenance(orderFromMaintenance.dataset.orderFromMaintenance);return;}
   const orderPdf=e.target.closest('[data-order-pdf]');if(orderPdf){downloadServiceOrderPdf(orderPdf.dataset.orderPdf);return;}
   const lifeVehicle=e.target.closest('[data-life-vehicle]');if(lifeVehicle){openVehicleLife(lifeVehicle.dataset.lifeVehicle);return;}
   const lifeDriver=e.target.closest('[data-life-driver]');if(lifeDriver){openDriverLife(lifeDriver.dataset.lifeDriver);return;}
   const driverDocs=e.target.closest('[data-driver-docs]');if(driverDocs){openDriverDocuments(driverDocs.dataset.driverDocs);return;}
   const speedSave=e.target.closest('[data-speed-limit-save]');if(speedSave){saveVehicleSpeedLimit(speedSave);return;}
   const dashboardDetail=e.target.closest('[data-dashboard-detail]');if(dashboardDetail){openDashboardDetail(dashboardDetail.dataset.dashboardDetail);return;}
   const maintenanceOpen=e.target.closest('[data-maintenance-open]');if(maintenanceOpen&&!e.target.closest('[data-edit-form],[data-delete-form]')){openMaintenanceDetail(maintenanceOpen.dataset.maintenanceOpen);return;}
   const documentDetail=e.target.closest('[data-document-detail]');if(documentDetail&&!e.target.closest('[data-doc-view],[data-doc-edit],[data-doc-delete]')){openDocumentDetail(documentDetail.dataset.documentDetail);return;}
   const assignmentDetail=e.target.closest('[data-assignment-detail]');if(assignmentDetail&&!e.target.closest('[data-assignment-edit],[data-assignment-delete],[data-assignment-qr],[data-assignment-trace]')){openAssignmentDetail(assignmentDetail.dataset.assignmentDetail);return;}
   const checkinOpen=e.target.closest('[data-checkin-open]');if(checkinOpen&&!e.target.closest('[data-checkin-detail],[data-checkin-pdf]')){openCheckinById(checkinOpen.dataset.checkinOpen);return;}
   const driverDocAdd=e.target.closest('[data-driver-doc-add]');if(driverDocAdd){closeModal();openDocumentForm(null,{tipo_entidad:'CONDUCTOR',conductor_id:driverDocAdd.dataset.driverDocAdd,tipo_documento:driverDocAdd.dataset.docKind});return;}
   const faultOpen=e.target.closest('[data-fault-open]');if(faultOpen&&!e.target.closest('[data-edit-form],[data-delete-form]')){openFaultDetail(faultOpen.dataset.faultOpen);return;}
   const fuelNav=e.target.closest('[data-fuel-nav]');if(fuelNav){window.open('https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(fuelNav.dataset.fuelNav),'_blank','noopener');return;}
   const newMaintenance=e.target.closest('[data-new-maintenance]');if(newMaintenance){openMaintenanceForVehicle(newMaintenance.dataset.newMaintenance);return;}
   const userPermissions=e.target.closest('[data-user-permissions]');if(userPermissions){openUserPermissions(userPermissions.dataset.userPermissions);return;}
   const rolePermissions=e.target.closest('[data-role-permissions]');if(rolePermissions){openRolePermissions(rolePermissions.dataset.rolePermissions);return;}
   const currentFailure=e.target.closest('[data-current-checkin-failure]');if(currentFailure){openCheckinFailure(S.lastCheckinSaved,currentFailure.dataset.currentCheckinFailure);return;}
   const currentMaintenance=e.target.closest('[data-current-checkin-maintenance]');if(currentMaintenance){openCheckinMaintenance(S.lastCheckinSaved,currentMaintenance.dataset.currentCheckinMaintenance);return;}
   const checkinFailure=e.target.closest('[data-checkin-create-failure]');if(checkinFailure){openHistoricalCheckinAction(checkinFailure.dataset.checkinCreateFailure,'falla');return;}
   const checkinMaintenance=e.target.closest('[data-checkin-create-maintenance]');if(checkinMaintenance){openHistoricalCheckinAction(checkinMaintenance.dataset.checkinCreateMaintenance,'mantencion','CORRECTIVA');return;}
   const filterKpi=e.target.closest('[data-notification-filter]');if(filterKpi){e.preventDefault();e.stopPropagation();setNotificationPageFilter(filterKpi.dataset.notificationFilter);return;}
  const clearFilter=e.target.closest('[data-notification-filter-clear]');if(clearFilter){e.preventDefault();e.stopPropagation();setNotificationPageFilter('');return;}
  const audioNote=e.target.closest('[data-audio-notification]');if(audioNote){e.preventDefault();e.stopPropagation();playNotificationAudio(audioNote.dataset.audioNotification);return;}
   const resendCheck=e.target.closest('[data-resend-checklist-notification]');if(resendCheck){e.preventDefault();e.stopPropagation();resendChecklistNotification(resendCheck.dataset.resendChecklistNotification);return;}
   const markNote=e.target.closest('[data-mark-notification]');if(markNote){e.preventDefault();e.stopPropagation();if(!markNote.disabled)markNotification(markNote.dataset.markNotification);return;}
   const openNoteButton=e.target.closest('[data-notification-open-button]');if(openNoteButton){e.preventDefault();e.stopPropagation();openNotificationDetail(openNoteButton.dataset.notificationOpenButton);return;}
   const note=e.target.closest('[data-notification-open]');if(note&&!e.target.closest('button')){openNotificationDetail(note.dataset.notificationOpen);return;}
   const dv=e.target.closest('[data-doc-view]');if(dv){viewDocument(dv.dataset.docView,dv);return;}
   const de=e.target.closest('[data-doc-edit]');if(de){openDocumentForm(S.documents.find(x=>String(x.id)===String(de.dataset.docEdit)));return;}
   const dd=e.target.closest('[data-doc-delete]');if(dd){deleteDocument(dd.dataset.docDelete,dd);return;}
   const at=e.target.closest('[data-assignment-trace]');if(at){openAssignmentTrace(at.dataset.assignmentTrace);return;}
   const aq=e.target.closest('[data-assignment-qr]');if(aq){openAssignmentQr(aq.dataset.assignmentQr);return;}
   const ae=e.target.closest('[data-assignment-edit]');if(ae){openAssignmentForm(S.assignments.find(x=>String(x.id)===String(ae.dataset.assignmentEdit)));return;}
   const ad=e.target.closest('[data-assignment-delete]');if(ad){deleteRecord('asignacion',ad.dataset.assignmentDelete);return;}
   const bc=e.target.closest('[data-budget-category]');if(bc){openBudgetCategory(bc.dataset.budgetCategory);return;}
   const bt=e.target.closest('[data-budget-task]');if(bt){updateBudgetTask(bt.dataset.budgetTask,bt.dataset.budgetState);return;}
   const br=e.target.closest('[data-budget-restore]');if(br){restoreBudget(br.dataset.budgetRestore);return;}
 });

 $('btnSaveCheckin').onclick=saveCheckin;
 $('btnProgramCheckin').onclick=openCheckinSchedule;$('btnProgramCheckinSecondary').onclick=openCheckinSchedule;$('btnGoCheckinHistory').onclick=()=>showView('checkinhistorial');$('btnGoCheckinApprovals').onclick=()=>showView('checkinaprobaciones');
 $('btnMarkAllConforme').onclick=()=>setAllCheckStates('CONFORME');
 $('btnNewCheckin').onclick=resetCheckinWorkspace;
 $('ciVehicleSearch')?.addEventListener('input',fillVehicleSelect);
 $('ciDriverSearch')?.addEventListener('input',fillDriverSelect);
 $('ciKm').addEventListener('input',()=>{invalidateSavedCheckin();if($('ciKmStatus')){$('ciKmStatus').textContent=Number($('ciKm').value||0)>0?'KM listo para confirmar':'Pendiente de confirmar';$('ciKmStatus').classList.toggle('ok',Number($('ciKm').value||0)>0)}});$('ciObs').addEventListener('input',invalidateSavedCheckin);$('ciEvidenceFiles').addEventListener('change',updateGuidedEvidenceHint);document.querySelectorAll('[data-guided-evidence]').forEach(i=>i.addEventListener('change',updateGuidedEvidenceHint));updateGuidedEvidenceHint();
 $('btnGenerateCheckinQr').onclick=openQuickQrAssignment;$('qrAssignClose').onclick=closeQuickQrAssignment;$('qrAssignCancel').onclick=closeQuickQrAssignment;$('qrAssignSave').onclick=assignQuickQr;$('qrAssignVehicleSearch').oninput=fillQrAssignVehicleOptions;$('qrAssignDriverSearch').oninput=fillQrAssignDriverOptions;$('qrAssignVehicle').onchange=updateQrAssignSummary;$('qrAssignDriver').onchange=updateQrAssignSummary;$('qrAssignModal').addEventListener('click',e=>{if(e.target===$('qrAssignModal'))closeQuickQrAssignment()});
 $('btnScanCheckinQr').onclick=openQrScanner;$('qrScannerClose').onclick=closeQrScanner;$('qrScannerStart').onclick=startQrScanner;$('qrScannerValidate').onclick=()=>validateQrValue($('qrScannerInput').value).catch(()=>{});$('qrScannerModal').addEventListener('click',e=>{if(e.target===$('qrScannerModal'))closeQrScanner()});
 $('btnCheckinVoice').onclick=()=>openVoiceCommand('CHECKIN',{vehicleId:$('ciVehicle').value,driverId:$('ciDriver').value,kilometraje:Number($('ciKm').value||0)});$('btnFailureVoice').onclick=()=>openVoiceCommand('FALLA');$('btnNotificationVoice').onclick=()=>openVoiceCommand('NOTIFICACION');$('voiceRecord').onclick=toggleVoiceRecording;$('voiceClose').onclick=closeVoiceModal;$('voiceCancel').onclick=closeVoiceModal;$('voiceSend').onclick=sendVoiceCommand;
 $('qrClose').onclick=closeCheckinQr;$('qrDone').onclick=closeCheckinQr;$('qrDownload').onclick=downloadCheckinQr;$('qrPrint').onclick=printCheckinQr;
 $('qrModal').addEventListener('click',e=>{if(e.target===$('qrModal'))closeCheckinQr()});
 $('modalClose').onclick=closeModal;$('modalCancel').onclick=closeModal;$('modalSave').onclick=saveModal;
 $('btnExportPdfCurrent').onclick=()=>exportCurrentView('PDF');$('btnExportXlsxCurrent').onclick=()=>exportCurrentView('XLSX');
 $('btnRefresh').onclick=async()=>{const b=$('btnRefresh');loading(b,true);try{await runManualSyncTask('Sincronizando E-Fleet…',()=>refresh(document.querySelector('#nav button.active')?.dataset.view||'dashboard'),'Sincronización completada')}catch(e){}finally{loading(b,false)}};

 $('profileButton').onclick=()=> $('profileMenu').classList.toggle('hidden');
 $('btnChangePhoto').onclick=()=> $('profileFile').click();
 $('profileFile').onchange=()=>uploadProfilePhoto($('profileFile').files[0]);
 $('btnProfileLogout').onclick=()=>logout(true);
 $('btnProfilePhoto').onclick=()=> $('profileFile').click();
 $('btnNewDocument').onclick=()=>openDocumentForm();
 $('btnNewAssignment').onclick=()=>openAssignmentForm();
 $('btnAssignmentLater').onclick=()=>{try{window.speechSynthesis?.cancel()}catch{};toast('Voz silenciada · el aviso permanece en la bandeja')};
 $('btnAssignmentAccept').onclick=acceptPendingAssignment;

 $('btnNotifications').onclick=openNotifications;syncHeaderBackButton();$('pageBackButton')&&($('pageBackButton').onclick=goBackView);$('notificationClose').onclick=closeNotifications;$('notificationDetailClose').onclick=closeNotificationDetail;$('notificationDetailDone').onclick=closeNotificationDetail;$('notificationDetailModal').addEventListener('click',e=>{if(e.target===$('notificationDetailModal'))closeNotificationDetail()});document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&document.activeElement?.dataset?.notificationOpen){e.preventDefault();openNotificationDetail(document.activeElement.dataset.notificationOpen)}if((e.key==='Enter'||e.key===' ')&&document.activeElement?.dataset?.notificationKpi){e.preventDefault();S.notificationPageFilter=document.activeElement.dataset.notificationKpi||'';clearNotificationInlineDetail();renderNotificationPage();}});$('notificationRefresh').onclick=()=>runManualSyncTask('Actualizando notificaciones…',()=>loadNotifications(true),'Notificaciones actualizadas').catch(()=>{});$('notificationMarkAll').onclick=markAllNotifications;$('pageBackButton')&&( $('pageBackButton').onclick=handleNotificationBack );$('notificationPageInlineBack')&&($('notificationPageInlineBack').onclick=handleNotificationBack);
 $('btnFuelGps').onclick=()=>captureFuelGps(true);$('btnFuelNearby').onclick=loadNearbyFuelStations;
 $('pageNotificationRefresh').onclick=()=>runManualSyncTask('Actualizando notificaciones…',()=>loadNotifications(true),'Notificaciones actualizadas').catch(()=>{});$('pageNotificationMarkAll').onclick=markAllNotifications;
 $('btnRunPrediction').onclick=runPredictiveAnalysis;
 $('btnSaveCompany').onclick=saveCompanyModule;$('btnCompanyLogo').onclick=()=>$('companyLogoFile').click();$('companyLogoFile').onchange=()=>uploadCompanyLogo($('companyLogoFile').files[0]);
 const speedSearch=$('speedVehicleSearch'),speedSearchButton=$('speedSearchButton');if(speedSearch){speedSearch.oninput=null;speedSearch.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();executeSpeedVehicleSearch();}}}if(speedSearchButton)speedSearchButton.onclick=executeSpeedVehicleSearch;$('speedSelectAll').onchange=()=>updateSpeedBulkHint();$('speedGlobalLimit').oninput=()=>updateSpeedBulkHint();$('speedApplyGlobal').onclick=applyGlobalSpeedLimit;
 $('btnCheckinHistoryPdf').onclick=()=>{S.reportRows=filteredCheckinHistory().map(reportNormalizeRow);EFleetExport.toPdf('E-Fleet_Historial_Checkin.pdf','E-Fleet · Historial de Checklist',reportExportRows(),S.company?.nombre||'')};$('btnCheckinHistoryXlsx').onclick=()=>{S.reportRows=filteredCheckinHistory().map(reportNormalizeRow);EFleetExport.toXlsx('E-Fleet_Historial_Checkin.xlsx',reportExportRows(),'Checklist')};
 wireAdvancedFilters();
 $('reportType').onchange=loadReports;$('btnReportRefresh').onclick=()=>runManualSyncTask('Actualizando informe…',()=>loadReports(),'Informe actualizado').catch(()=>{});$('btnReportPdf').onclick=()=>exportCurrentReport('PDF');$('btnReportXlsx').onclick=()=>exportCurrentReport('XLSX');
 initBudgetPeriodSelectors();$('budgetYear').onchange=loadBudget;$('budgetMonth').onchange=loadBudget;$('btnBudgetRefresh').onclick=()=>runManualSyncTask('Actualizando presupuesto…',()=>loadBudget(),'Presupuesto actualizado').catch(()=>{});$('btnBudgetConfigure').onclick=openBudgetConfig;$('btnBudgetConfigureEmpty').onclick=openBudgetConfig;$('btnBudgetEvaluate').onclick=evaluateBudget;$('btnBudgetPdf').onclick=()=>exportBudget('PDF');$('btnBudgetXlsx').onclick=()=>exportBudget('XLSX');$('btnBudgetEmergency').onclick=openBudgetEmergency;$('btnBudgetVehicleLimit').onclick=openBudgetVehicleLimit;$('btnBudgetHistory').onclick=openBudgetHistory;$('btnBudgetAnnul').onclick=openBudgetAnnul;$('budgetConfigClose').onclick=closeBudgetConfig;$('budgetConfigCancel').onclick=closeBudgetConfig;$('budgetConfigSave').onclick=saveBudgetConfig;$('budgetCfgDistribution').onchange=renderBudgetMonthEditor;$('budgetCfgAnnual').oninput=()=>{if($('budgetCfgDistribution').value==='PERSONALIZADA')renderBudgetMonthEditor()};$('budgetActionClose').onclick=closeBudgetAction;$('budgetActionCancel').onclick=closeBudgetAction;$('budgetActionSave').onclick=saveBudgetAction;$('budgetConfigModal').addEventListener('click',e=>{if(e.target===$('budgetConfigModal'))closeBudgetConfig()});$('budgetActionModal').addEventListener('click',e=>{if(e.target===$('budgetActionModal'))closeBudgetAction()});
 $('profileSearch').oninput=renderRoleProfiles;$('profileRoleFilter').onchange=renderRoleProfiles;$('profileFilterClear').onclick=()=>{$('profileSearch').value='';$('profileRoleFilter').value='';renderRoleProfiles()};
 $('permissionClose').onclick=closePermissionModal;$('permissionCancel').onclick=closePermissionModal;$('permissionSave').onclick=saveUserPermissions;$('permissionAll').onclick=()=>setAllPermissions(true);$('permissionNone').onclick=()=>setAllPermissions(false);
 $('permissionMode').onchange=()=>{if($('permissionMode').value==='PERSONALIZADO'&&String(permissionUser?.modo_permisos||'ROL').toUpperCase()!=='PERSONALIZADO')permissionDraft=effectiveMatrixFor(permissionUser);renderPermissionMatrix()};
 $('permissionModal').addEventListener('click',e=>{if(e.target===$('permissionModal'))closePermissionModal()});
  $('nexoFab').onclick=nexoOpen;$('nexoVisibilityToggle').onclick=toggleNexoVisibility;$('nexoClose').onclick=nexoClose;$('nexoSend').onclick=()=>nexoAsk($('nexoInput').value);
 document.querySelectorAll('[data-nexo-q]').forEach(b=>b.onclick=()=>nexoAsk(b.dataset.nexoQ));
 $('nexoInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();nexoAsk($('nexoInput').value)}});
 document.addEventListener('click',e=>{if(!e.target.closest('.profile-wrap'))$('profileMenu')?.classList.add('hidden')});
 window.addEventListener('focus',()=>{if(S.token){pollNotificationBadgeSilent().catch(()=>{});flushOfflineCheckins();liveSyncCurrentView()}});window.addEventListener('online',()=>{flushOfflineCheckins();liveSyncCurrentView()});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&S.token){pollNotificationBadgeSilent().catch(()=>{});liveSyncCurrentView()}});
 syncNexoVisibility();
 restore();setTimeout(()=>flushOfflineCheckins(),2500);
});
