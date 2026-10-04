import {test,expect} from '@playwright/test';
const SEED=33040;
test.beforeEach(async({page},info)=>{info.annotations.push({type:'random-seed',description:String(SEED)});await page.addInitScript(seed=>{window.PIM_TEST_SEED=seed;},SEED);
  await page.addInitScript(()=>{localStorage.setItem('pim-tour','done');localStorage.setItem('pim-missions-help','1');});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});info._courseErrors=errors;});
test.afterEach(async({},info)=>{expect(info._courseErrors,`browser errors (seed ${SEED})`).toEqual([]);});
async function lesson(page,id){await page.goto('/#'+id);const pause=page.getByRole('button',{name:'Pause',exact:true});if(await pause.isVisible())await pause.click();}
async function lab(page,id='sessions'){await lesson(page,id);await page.locator('#chalBtn').click();}
async function editor(page){await page.getByText('Components and connections',{exact:true}).click();}

test('delayed result cannot score or focus a chapter visited afterward',async({page})=>{
  await page.clock.install();await lab(page,'auth');for(let i=0;i<8;i++)await page.locator('#cRun button').filter({hasText:'Choose Session cookie'}).click();
  await page.locator('#nextBtn').click();await page.clock.runFor(1500);
  await expect(page.locator('#title')).toHaveText('CDNs & Edge Caching');await expect(page.locator('#result')).toBeHidden();
  expect(await page.evaluate(()=>localStorage.getItem('pim-stars'))).toBeNull();
  expect(await page.locator('#resNext').evaluate(e=>e===document.activeElement)).toBe(false);
});

test('closed dialogs and mobile drawer preserve native focus and transcript semantics',async({page},info)=>{
  await lesson(page,'auth');await expect(page.locator('#card')).toBeHidden();await expect(page.locator('#result')).toBeHidden();
  expect(await page.locator('#trList button button').count()).toBe(0);
  if(info.project.name==='touch-portrait'){await expect(page.locator('#side')).toHaveAttribute('inert','');await page.locator('#menuBtn').click();await expect(page.locator('#menuBtn')).toHaveAttribute('aria-expanded','true');await page.keyboard.press('Escape');await expect(page.locator('#side')).toHaveAttribute('inert','');await expect(page.locator('#menuBtn')).toBeFocused();}
  await page.locator('#tradeBtn').click();await expect(page.locator('#card')).toHaveJSProperty('open',true);
  for(let i=0;i<12;i++){await page.keyboard.press('Tab');expect(await page.locator('#card').evaluate(e=>e.contains(document.activeElement))).toBe(true);}
  await page.keyboard.press('Escape');await expect(page.locator('#card')).toBeHidden();await expect(page.locator('#tradeBtn')).toBeFocused();
  await page.locator('#trBtn').click();await expect(page.locator('#transcript')).toBeVisible();await page.locator('#trList .tr-step').nth(2).click();await page.getByRole('button',{name:'Pause',exact:true}).click();await expect(page.locator('#capStep')).toHaveText('3/8');
});

test('native Back and Continue restore lesson position and speed paused',async({page},info)=>{
  await lesson(page,'sessions');await page.locator('#stepNext').click();const speed=info.project.name==='desktop'?'1.5':'1';if(speed==='1.5')await page.locator('#speed').selectOption(speed);await page.locator('#nextBtn').click();await page.goBack();
  await expect(page.locator('#title')).toHaveText('Sessions: Sticky vs Shared Storage');await expect(page.locator('#time')).toHaveText('0:05 / 0:34');await expect(page.locator('#playBtn')).toHaveAttribute('aria-label','Play');
  await page.goto('/');await expect(page.locator('#resume')).toBeVisible();await page.locator('#continueBtn').click();await expect(page.locator('#time')).toHaveText('0:05 / 0:34');await expect(page.locator('#speed')).toHaveValue(speed);await expect(page.locator('#playBtn')).toHaveAttribute('aria-label','Play');
});

test('corrupt saved scores recover without startup errors or automatic completion',async({page})=>{
  await page.addInitScript(()=>{localStorage.setItem('pim-stars','{"packets":999,"auth":-1,"cdn":"3"}');});await lesson(page,'packets');await expect(page.locator('#starTotal')).toHaveText('★ 0 / 162 stars');
  await page.locator('#scrub').focus();await page.keyboard.press('End');expect(await page.evaluate(()=>localStorage.getItem('sdve-seen'))).toBeNull();await page.locator('#completeBtn').click();await expect(page.locator('#completeBtn')).toBeDisabled();
});

test('lab draft, options and exported graphs survive reload and import',async({page,browser},info)=>{
  await lab(page);await page.getByRole('button',{name:'Lock components until I have completed their chapter',exact:true}).click();await editor(page);
  await page.locator('#lab-kind').selectOption('app');await page.getByRole('button',{name:'Add component',exact:true}).click();
  await page.getByRole('button',{name:/^Sticky sessions:/}).click();await page.getByRole('button',{name:'Undo',exact:true}).click();
  await expect(page.locator('#labSummary')).toContainText('App server');await expect(page.locator('#labSummary')).toContainText('off');
  await page.reload();await page.locator('#chalBtn').click();await expect(page.locator('#labSummary')).toContainText('App server');
  await page.locator('#settingsBtn').click();const downloading=page.waitForEvent('download');await page.locator('#exportBtn').click();const download=await downloading,file=info.outputPath('progress.json');await download.saveAs(file);
  const context=await browser.newContext({baseURL:'http://127.0.0.1:4173'});try{const recipient=await context.newPage();await recipient.goto('/#sessions');await recipient.locator('#importFile').setInputFiles(file);await expect(recipient.locator('#ioMsg')).toContainText('Updated');await recipient.locator('#chalBtn').click();await expect(recipient.locator('#labSummary')).toContainText('App server');}finally{await context.close();}
});

test('failed clipboard exposes a usable share link whose received board survives reload',async({page,browser})=>{
  await page.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('Test clipboard denied'))}});});await lab(page);await editor(page);
  await page.locator('#lab-kind').selectOption('replica');await page.getByRole('button',{name:'Add component',exact:true}).click();await page.getByRole('button',{name:'Copy share link',exact:true}).click();
  const input=page.getByLabel('Share this design link');await expect(input).toBeVisible();await expect(page.locator('#cStatus')).not.toContainText('Link copied');const url=await input.inputValue();
  const context=await browser.newContext();try{const recipient=await context.newPage();await recipient.goto(url);await expect(recipient.locator('#labSummary')).toContainText('Store replica');await recipient.reload();await recipient.locator('#chalBtn').click();await expect(recipient.locator('#labSummary')).toContainText('Store replica');}finally{await context.close();}
});

test('lab goal and sticky actions remain usable with narrow touch layout',async({page})=>{
  await lab(page);const boxes=await page.evaluate(()=>['labIntro','labActions','stage'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {top:r.top,bottom:r.bottom};}));expect(boxes[0].bottom).toBeLessThanOrEqual(boxes[1].top);expect(boxes[1].bottom).toBeLessThanOrEqual(boxes[2].top);
  await editor(page);await page.getByLabel('Component to add').scrollIntoViewIfNeeded();const actions=await page.locator('#labActions').boundingBox();expect(actions.y).toBeGreaterThanOrEqual(0);expect(actions.y+actions.height).toBeLessThan(720);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.getByRole('button',{name:'Run load test',exact:true})).toBeVisible();
  await page.screenshot({path:test.info().outputPath('lab-layout.png')});
});

test('saved run replay restores its exact board and seed',async({page})=>{
  test.setTimeout(60000); // Two full animated runs, including touch rendering.
  await page.clock.install();await lab(page,'scaling');await page.getByRole('button',{name:'Open the doors',exact:true}).click();await page.clock.runFor(22000);await expect(page.locator('#result')).toBeVisible();const first=await page.locator('#resTitle').textContent(),seed=await page.evaluate(()=>JSON.parse(localStorage.getItem('pim-lab-runs')).runs.scaling.seed);await page.locator('#resRetry').click();
  await editor(page);await page.locator('#lab-kind').selectOption('medium');await page.getByRole('button',{name:'Add component',exact:true}).click();await expect(page.locator('#labSummary')).toContainText('Medium');await page.reload();await page.locator('#chalBtn').click();
  await page.getByRole('button',{name:'Replay last run',exact:true}).click();await expect(page.locator('#labSummary > ul')).not.toContainText('Medium');await page.clock.runFor(22000);await expect(page.locator('#resTitle')).toHaveText(first);await expect(page.locator('#resMsg')).toContainText(`Run seed: ${seed}`);
});
