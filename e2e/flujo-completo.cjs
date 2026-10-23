const { chromium } = require('playwright');
// Prueba de punta a punta del sitio en un navegador real (Playwright).
// Requiere la API corriendo con una base de datos de PRUEBAS vacía y el sitio servido:
//   npm run build && npm run preview      (http://localhost:4173)
//   node e2e/flujo-completo.cjs
// Deja capturas de pantalla en e2e/capturas/.
const fs = require('fs');
const B = process.env.WEB_URL || 'http://localhost:4173';
const S = __dirname + '/capturas/';
fs.mkdirSync(S, { recursive: true });
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:1366,height:900}});
 const p=await ctx.newPage(); const errs=[];
 p.on('pageerror',e=>errs.push('pageerror '+e.message)); p.on('console',m=>{if(m.type()==='error')errs.push('console '+m.text())});
 const shot=async(n,full=true)=>{await p.waitForTimeout(500);await p.screenshot({path:S+n+'.png',fullPage:full});};
 const step=async(n,fn)=>{try{await fn();console.log('OK',n)}catch(e){console.log('FAIL',n,e.message.split('\n')[0]);await shot('FAIL_'+n)}};
 await step('landing',async()=>{await p.goto(B+'/');await p.waitForSelector('text=Calcula tu sistema');await shot('01_landing',false);
   await p.getByLabel('Consumo mensual (kWh)').fill('250');await p.getByRole('button',{name:'Calcular'}).click();await p.waitForSelector('text=paneles de 550 W');await shot('02_landing_result');});
 await step('register',async()=>{await p.goto(B+'/registro');await p.getByLabel('Nombre completo').fill('Ana María Prueba');await p.getByLabel('Teléfono').fill('3001234567');
   await p.getByLabel('Correo').fill('ana@prueba.com');await p.getByLabel('Contraseña',{exact:true}).fill('Clave1234');await p.getByLabel('Confirmar contraseña').fill('Clave1234');
   await p.getByRole('button',{name:'Crear cuenta'}).click();await p.waitForURL('**/app');await p.waitForSelector('text=Hola, Ana');await shot('03_user_home');});
 await step('calc',async()=>{await p.getByRole('link',{name:'Calcular sistema'}).first().click();await p.getByLabel('Consumo mensual (kWh)').fill('320');
   await p.getByLabel('Ciudad').selectOption('girardot');await p.getByRole('button',{name:'Calcular sistema'}).click();await p.waitForSelector('text=Guardar cálculo');
   await p.getByRole('button',{name:'Guardar cálculo'}).click();await p.waitForSelector('text=Ver en mi historial');await shot('04_calculator');});
 await step('history',async()=>{await p.getByRole('link',{name:'Historial',exact:true}).click();await p.waitForSelector('table.data');await shot('05_history');
   await p.getByRole('button',{name:'Ver detalle'}).first().click();await p.waitForSelector('text=Detalle del cálculo');await shot('06_detail');});
 await step('learn+profile',async()=>{await p.getByRole('link',{name:'Energía solar'}).click();await shot('07_learn');await p.getByRole('link',{name:'Perfil'}).click();await p.waitForSelector('text=ana@prueba.com');await shot('08_profile');});
 await step('logout-admin',async()=>{await p.getByRole('button',{name:'Cerrar sesión'}).first().click();await p.waitForURL('**/ingresar');
   await p.getByLabel('Correo').fill('admin@greensaver.com');await p.getByLabel('Contraseña').fill('admin');await p.getByRole('button',{name:'Ingresar'}).click();
   await p.waitForURL('**/admin');await p.waitForSelector('text=Cálculos esperando cotización');await shot('09_admin_home');});
 await step('users',async()=>{await p.getByRole('link',{name:'Usuarios'}).click();await p.waitForSelector('text=ana@prueba.com');await shot('10_users');});
 await step('quotes',async()=>{await p.getByRole('link',{name:'Cotizaciones'}).click();await p.waitForSelector('text=1. Elige el cálculo');
   await p.getByRole('radio').first().check();await p.getByLabel('Panel',{exact:true}).selectOption({index:1});await p.getByLabel('Inversor',{exact:true}).selectOption({index:1});
   await p.getByLabel('Batería',{exact:true}).selectOption({index:3});await p.getByLabel('Estructura',{exact:true}).selectOption({index:1});await p.getByLabel('Precio total (COP)').fill('14800000');
   await p.getByLabel('Notas técnicas').fill('Incluye instalación y trámite ante el operador de red.');await p.getByRole('button',{name:/Enviar cotización/}).click();
   await p.waitForSelector('text=Guardada sin correo, text=Enviada',{timeout:15000}).catch(()=>{});await p.waitForSelector('td >> text=Ana');await shot('11_quotes_sent');
   await p.getByRole('button',{name:'Aceptar',exact:true}).first().click();await p.getByLabel('Fecha de instalación').fill('2026-11-15');await p.getByRole('button',{name:'Aceptar cotización'}).click();
   await p.waitForSelector('.badge >> text=Aceptada');await shot('12_quotes_accepted');});
 await step('stats',async()=>{await p.getByRole('link',{name:'Estadísticas'}).click();await p.waitForSelector('text=Cálculos por mes');await shot('13_stats');});
 await step('eda',async()=>{await p.getByRole('link',{name:'Recurso solar (EDA)'}).click();await p.waitForSelector('text=Radiación mes a mes');await p.waitForTimeout(800);await shot('14_eda');});
 await step('user-system',async()=>{await p.getByRole('button',{name:'Cerrar sesión'}).first().click();await p.getByLabel('Correo').fill('ana@prueba.com');await p.getByLabel('Contraseña').fill('Clave1234');
   await p.getByRole('button',{name:'Ingresar'}).click();await p.waitForURL('**/app');await p.getByRole('link',{name:'Mi sistema'}).click();await p.waitForSelector('text=Inversor');await shot('15_my_system');});
 await step('refresh-token',async()=>{
   await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('greensaver-web-session'));s.token='token.vencido.invalido';localStorage.setItem('greensaver-web-session',JSON.stringify(s));});
   const refreshed=p.waitForResponse(r=>r.url().endsWith('/auth/refresh')&&r.status()===200,{timeout:15000});
   await p.goto(B+'/app/historial');await refreshed;await p.waitForSelector('table.data');console.log('   sesión renovada automáticamente');});
 await step('mobile',async()=>{await p.setViewportSize({width:390,height:844});await p.goto(B+'/app');await shot('16_mobile_home',false);await p.getByRole('button',{name:'Menú'}).click();await shot('17_mobile_menu',false);
   await p.goto(B+'/');await shot('18_mobile_landing',false);});
 await step('guards',async()=>{await p.goto(B+'/admin');await p.waitForURL('**/app');console.log('user->admin redirected to',p.url());});
 console.log('ERRORS',JSON.stringify(errs.slice(0,10)));await b.close();})();
