import {test,expect} from '@playwright/test';

// returning visitors: the first-visit tour and missions explanation are already dismissed, unless a test is about a first visit
test.beforeEach(async({page},info)=>{const errors=[];page.on('pageerror',e=>errors.push(e.message));info._journeyErrors=errors;
  if(!/first visit/.test(info.title))await page.addInitScript(()=>{localStorage.setItem('pim-tour','done');localStorage.setItem('pim-missions-help','1');});});
test.afterEach(async({},info)=>{expect(info._journeyErrors).toEqual([]);});
const go=async(page,id)=>{await page.locator('#'+id).click();};
const stored=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('pim-journey')));
async function solveLaunch(page){await page.locator('#jEast').selectOption('2');await page.locator('#jBalancer').check();await go(page,'jTest');await expect(page.locator('#jResultTitle')).toHaveText('Your design holds up.');}

test('Home remembers a selected route and Continue preserves lesson position through browser history',async({page})=>{
  await page.goto('/');await expect(page).toHaveURL(/#home$/);await expect(page.locator('#resume')).toBeHidden();
  await go(page,'navMap');await page.locator('#jMapPath').selectOption('interview');await page.reload();await expect(page.locator('#jMapPath')).toHaveValue('interview');
  await go(page,'navHome');await go(page,'jStart');await expect(page).toHaveURL(/#estimation$/);await go(page,'stepNext');await go(page,'playBtn');
  const time=await page.locator('#time').textContent();await go(page,'navHome');await expect(page.locator('#resume')).toBeVisible();
  await page.keyboard.press(']');await expect(page).toHaveURL(/#home$/);await page.goBack();await expect(page).toHaveURL(/#estimation$/);await expect(page.locator('#time')).toHaveText(time);
  await page.goForward();await expect(page.locator('#journeyTitle')).toContainText('Build an instinct');await go(page,'continueBtn');await expect(page.locator('#time')).toHaveText(time);await expect(page.locator('#playBtn')).toHaveAttribute('aria-label','Play');
});
test('the map shows completion, practice and open prerequisites, while the list stays usable',async({page},info)=>{
  await page.goto('/#packets');await go(page,'completeBtn');await go(page,'navMap');await page.locator('#jMapPath').selectOption('explore');
  await expect(page.locator('a.j-map-lesson[href="#packets"]')).toContainText('Completed · 0/3');
  const prerequisites=page.locator('.j-map-group details').first();await prerequisites.locator('summary').click();await expect(prerequisites.locator('a').first()).toBeVisible();
  await page.locator('a.j-map-lesson[href="#caching"]').click();await expect(page).toHaveURL(/#caching$/);await expect(page.locator('#lessonView')).toBeVisible();
  await go(page,'navHome');if(info.project.name==='touch-portrait')await go(page,'menuBtn');
  await page.locator('#find').fill('sharding');await page.locator('#toc').getByRole('button',{name:/16\. Sharding/}).click();await expect(page).toHaveURL(/#sharding$/);await expect(page.locator('#lessonView')).toBeVisible();
});
test('interactive introduction explains system design, then shows overload, idle app and balanced recovery without a timer',async({page})=>{
  await page.goto('/#intro');await expect(page.locator('#journeyTitle')).toHaveText('What is system design?');await expect(page.locator('#jIntroStep')).toHaveText('Every app you use is a system.');await expect(page.locator('.j-what')).toBeVisible();await expect(page.locator('.j-metrics')).toHaveCount(0);
  await go(page,'jIntroNext');await expect(page.locator('.j-metrics')).toContainText('80');
  await go(page,'jIntroNext');await expect(page.locator('.j-metrics')).toContainText('160');
  await go(page,'jIntroNext');await expect(page.locator('.j-loads')).toContainText('App 2 · 0 / 200');
  await go(page,'jIntroNext');await expect(page.locator('#jIntroStep')).toHaveText('Now the work is shared.');await expect(page.locator('.j-loads')).toContainText('App 2 · 180 / 200');
  await page.locator('#jIntroNext').focus();await page.keyboard.press('Enter');await expect(page.locator('#jIntroStep')).toHaveText('That was system design.');await expect(page.locator('#jIntroStep')).toBeFocused();await expect(page.locator('.j-recap li')).toHaveCount(3);await expect(page.locator('.j-why li')).toHaveCount(4);
  expect((await stored(page)).intro).toBe(true);await go(page,'jIntroReset');await expect(page.locator('#jIntroStep')).toHaveText('Every app you use is a system.');
});
test('quizzes open their visible challenge, and Back returns Home',async({page},info)=>{
  await page.goto('/');if(info.project.name==='touch-portrait')await go(page,'menuBtn');
  await page.locator('.qz[data-q="Traffic"]').click();await expect(page.locator('#journey')).toBeHidden();await expect(page.locator('#cStart')).toBeVisible();await expect(page).toHaveURL(/#quiz-traffic$/);
  await page.goBack();await expect(page).toHaveURL(/#home$/);await expect(page.locator('#journey')).toBeVisible();
});
test('TownSquare carries a design through all three missions and restores valid progress',async({page})=>{
  await page.goto('/#missions');await expect(page.locator('#jMission-1')).toBeDisabled();await go(page,'jTest');await expect(page.locator('#jResultTitle')).toContainText('useful failure');
  await solveLaunch(page);await go(page,'jNextMission');await expect(page.locator('#jEast')).toHaveValue('2');await expect(page.locator('#jBalancer')).toBeChecked();
  await page.locator('#jCache').check();await go(page,'jTest');await expect(page.locator('.j-condition-list')).toContainText('Needs work');
  await page.locator('#jEast').selectOption('3');await expect(page.locator('#jMissionResult')).toBeHidden();await go(page,'jTest');await expect(page.locator('#jResultTitle')).toHaveText('Your design holds up.');
  await go(page,'jNextMission');await page.locator('#jWest').selectOption('2');await go(page,'jTest');await expect(page.locator('#jMissionResult')).toContainText('You completed the story');expect(Object.keys((await stored(page)).proofs)).toHaveLength(3);
  await page.reload();await expect(page.locator('#jWest')).toHaveValue('2');await expect(page.locator('#jSavedProof')).toContainText('Completed');
  await page.locator('#jWest').selectOption('1');await expect(page.locator('#jMissionResult')).toBeHidden();await go(page,'jTest');await expect(page.locator('.j-condition-list')).toContainText('Needs work');expect(Object.keys((await stored(page)).proofs)).toHaveLength(3);
  await go(page,'jMission-0');await expect(page.locator('#jEast')).toHaveValue('2');await expect(page.locator('#jCache')).toHaveCount(0);
});
test('journey export/import restores missions and rejects invented completion atomically',async({page,browser},info)=>{
  await page.goto('/#missions');await solveLaunch(page);await go(page,'jNextMission');
  await go(page,'settingsBtn');const downloading=page.waitForEvent('download');await go(page,'exportBtn');const download=await downloading,file=info.outputPath('journey-progress.json');await download.saveAs(file);
  const context=await browser.newContext({baseURL:'http://127.0.0.1:4173'});
  try{const other=await context.newPage();await other.goto('/#missions');await other.locator('#importFile').setInputFiles(file);await expect(other.locator('#jMission-1')).toHaveAttribute('aria-current','step');await expect(other.locator('#jEast')).toHaveValue('2');
    const before=await stored(other),bad={app:'packets-in-motion',version:2,seen:{packets:1},stars:{packets:3},journey:{...before,proofs:{launch:{east:1,west:0,balancer:false,cache:false}}}};
    await other.locator('#importFile').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});await expect(other.locator('#ioMsg')).toContainText('Nothing was imported');expect(await stored(other)).toEqual(before);expect(await other.evaluate(()=>JSON.parse(localStorage.getItem('sdve-seen')).packets)).toBeUndefined();
  }finally{await context.close();}
});
test('journey surfaces fit desktop and touch widths in dark, light and contrast themes',async({page},info)=>{
  for(const route of ['home','map','intro','missions']){
    await page.goto('/#'+route);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect(page.locator('#journeyTitle')).toBeVisible();
    await page.screenshot({path:info.outputPath(route+'.png')});
    if(route==='intro'){await go(page,'jIntroNext');await page.screenshot({path:info.outputPath('intro-active.png')});}
    if(route==='missions'){await page.locator('.j-design-controls').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('mission-controls.png')});await solveLaunch(page);await page.locator('#jMissionResult').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('mission-result.png')});}
  }
  for(const theme of ['light','contrast']){await page.evaluate(t=>{document.getElementById('theme').value=t;document.getElementById('theme').dispatchEvent(new Event('change'));},theme);await expect(page.locator('html')).toHaveAttribute('data-theme',theme);await page.screenshot({path:info.outputPath('missions-'+theme+'.png')});}
});
test('Home shows only Start learning for a newcomer, then only Continue learning once a lesson is paused',async({page})=>{
  await page.goto('/');await expect(page.locator('#jStartTitle')).toHaveText('Start learning');await expect(page.locator('#jStart')).toHaveText('Start learning');
  await expect(page.locator('.j-path, .j-story-strip, .j-practice')).toHaveCount(0);await expect(page.locator('#resume')).toBeHidden();
  await go(page,'jStart');await expect(page).toHaveURL(/#packets$/);await go(page,'stepNext');await go(page,'navHome');
  await expect(page.locator('#resume')).toBeVisible();await expect(page.locator('#resumeText')).toContainText('How Computers Talk');await expect(page.locator('#continueBtn')).toHaveText('Continue learning');
  await expect(page.locator('#jStart')).toHaveCount(0);
});
test('the introduction animates the overload and ends with a clear next lesson',async({page})=>{
  await page.goto('/#intro');await expect(page.locator('#journeyTitle')).toHaveText('What is system design?');await expect(page.locator('.j-what .j-flow circle')).toHaveCount(8);
  await go(page,'jIntroNext');
  await go(page,'jIntroNext');await expect(page.locator('.j-intro-diagram .j-node-over')).toHaveCount(1);await expect(page.locator('.j-tag-over')).toContainText('OVERLOADED');expect(await page.locator('.j-flow circle').count()).toBeGreaterThan(0);
  await go(page,'jIntroNext');await expect(page.locator('.j-tag-idle')).toContainText('IDLE');
  await go(page,'jIntroNext');await expect(page.locator('.j-intro-diagram .j-node-over')).toHaveCount(0);await expect(page.locator('.j-intro-diagram .j-node-ok')).toHaveCount(2);
  await go(page,'jIntroNext');await expect(page.locator('#jIntroStep')).toHaveText('That was system design.');
  await expect(page.locator('#jIntroLesson')).toHaveText(/^Start your first lesson: How Computers Talk/);await expect(page.locator('#jIntroBalancer')).toHaveCount(0);await expect(page.locator('.j-intro-next')).toContainText('starting with How Computers Talk');await go(page,'jIntroLesson');await expect(page).toHaveURL(/#packets$/);await expect(page.locator('#lessonView')).toBeVisible();
});
test('the map marks where you are: the paused lesson, otherwise the route\u2019s next lesson',async({page})=>{
  await page.goto('/#map');await expect(page.locator('li.j-here a.j-map-lesson')).toHaveAttribute('href','#packets');await expect(page.locator('li.j-here')).toContainText('You are here');await expect(page.locator('li.j-here')).toHaveCount(1);
  await page.goto('/#caching');await go(page,'stepNext');await go(page,'navMap');await expect(page.locator('li.j-here a.j-map-lesson')).toHaveAttribute('href','#caching');await expect(page.locator('li.j-here a.j-map-lesson')).toHaveAttribute('aria-current','step');
});
test('a first visit takes a guided tour of each part of the page, once, and Settings can replay it',async({page})=>{
  await page.goto('/');await expect(page.locator('#tour')).toBeVisible();await expect(page.locator('#tourTitle')).toHaveText('Welcome to Packets in Motion');await expect(page.locator('#tourNext')).toBeFocused();
  for(const title of ['Home','Learning map','Missions','Chapters','Settings','Ready when you are']){await go(page,'tourNext');await expect(page.locator('#tourTitle')).toHaveText(title);}
  await go(page,'tourBack');await expect(page.locator('#tourTitle')).toHaveText('Settings');await go(page,'tourNext');
  await expect(page.locator('#tourNext')).toHaveText('Done');await go(page,'tourNext');await expect(page.locator('#tour')).toBeHidden();
  expect(await page.evaluate(()=>localStorage.getItem('pim-tour'))).toBe('done');await page.reload();await expect(page.locator('#tour')).toBeHidden();
  await go(page,'settingsBtn');await go(page,'tourBtn');await expect(page.locator('#tour')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('#tour')).toBeHidden();
});
test('a first visit to Missions explains the page, once, and the explanation can be reopened',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('pim-tour','done'));
  await page.goto('/#missions');await expect(page.locator('#missionHelp')).toBeVisible();await expect(page.locator('#mhTitle')).toHaveText('Design a system that survives real growth');
  await expect(page.locator('#mhScene .mc-maya.mc-wave')).toBeVisible();await expect(page.locator('#mhScene')).toContainText("Hi, I'm Maya");await expect(page.locator('#mhStart')).toHaveText('Start the first mission');await go(page,'mhStart');await expect(page.locator('#missionHelp')).toBeHidden();
  await page.reload();await expect(page.locator('#journeyTitle')).toHaveText('Engineering missions');await expect(page.locator('#missionHelp')).toBeHidden();
  await go(page,'jMissionHelp');await expect(page.locator('#missionHelp')).toBeVisible();await expect(page.locator('#mhStart')).toHaveText('Got it');await page.keyboard.press('Escape');await expect(page.locator('#missionHelp')).toBeHidden();
});
test('Settings opens from the top navigation without scrolling, on Home and in a lesson',async({page})=>{
  for(const route of ['home','packets']){await page.goto('/#'+route);
    await expect(page.locator('#settingsBtn')).toBeInViewport();await go(page,'settingsBtn');await expect(page.locator('#settings')).toBeVisible();
    for(const id of ['theme','shortcutsBtn','soundBtn','exportBtn','importBtn','tourBtn'])await expect(page.locator('#'+id)).toBeVisible();
    await page.locator('#theme').selectOption('light');await expect(page.locator('html')).toHaveAttribute('data-theme','light');
    await page.keyboard.press('Escape');await expect(page.locator('#settings')).toBeHidden();await page.evaluate(()=>localStorage.setItem('pim-theme','dark'));}
});
test('Maya tells each mission\u2019s story and reacts to your result, with you beside the rack',async({page})=>{
  await page.goto('/#missions');await expect(page.locator('.j-brief .mc-maya')).toBeVisible();await expect(page.locator('.j-brief .m-bubble-maya')).toContainText('We launch TownSquare tomorrow');
  await go(page,'jTest');await expect(page.locator('#jMissionResult .mc-maya.mc-worried')).toBeVisible();await expect(page.locator('#jMissionResult .m-rack-fail')).toBeVisible();await expect(page.locator('#jMissionResult .m-bubble-maya')).toContainText('turned away');
  await solveLaunch(page);await expect(page.locator('#jMissionResult .mc-maya.mc-celebrate')).toBeVisible();await expect(page.locator('#jMissionResult .m-bubble-maya')).toContainText('Launch day is a success');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
