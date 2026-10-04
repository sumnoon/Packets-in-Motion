import {test,expect} from '@playwright/test';

test.beforeEach(async({page},info)=>{const errors=[];page.on('pageerror',e=>errors.push(e.message));info._journeyErrors=errors;});
test.afterEach(async({},info)=>{expect(info._journeyErrors).toEqual([]);});
const go=async(page,id)=>{await page.locator('#'+id).click();};
const stored=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('pim-journey')));
async function solveLaunch(page){await page.locator('#jEast').selectOption('2');await page.locator('#jBalancer').check();await go(page,'jTest');await expect(page.locator('#jResultTitle')).toHaveText('Your design holds up.');}

test('Home remembers a selected route and Continue preserves lesson position through browser history',async({page})=>{
  await page.goto('/');await expect(page).toHaveURL(/#home$/);await expect(page.locator('#resume')).toBeHidden();
  await go(page,'jPath-interview');await page.reload();await expect(page.locator('#jPath-interview')).toHaveAttribute('aria-pressed','true');
  await go(page,'jStart');await expect(page).toHaveURL(/#estimation$/);await go(page,'stepNext');await go(page,'playBtn');
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
test('interactive introduction exposes overload, idle app and balanced recovery without a timer',async({page})=>{
  await page.goto('/#intro');await expect(page.locator('.j-metrics')).toContainText('80');
  await go(page,'jIntroNext');await expect(page.locator('.j-metrics')).toContainText('160');
  await go(page,'jIntroNext');await expect(page.locator('.j-loads')).toContainText('App 2 · 0 / 200');
  await page.locator('#jIntroNext').focus();await page.keyboard.press('Enter');await expect(page.locator('#jIntroStep')).toHaveText('Now the work is shared.');await expect(page.locator('#jIntroStep')).toBeFocused();
  expect((await stored(page)).intro).toBe(true);await expect(page.locator('.j-loads')).toContainText('App 2 · 180 / 200');await go(page,'jIntroReset');await expect(page.locator('#jIntroStep')).toHaveText('A quiet morning.');
});
test('quizzes and suggested practice open their visible challenge from Home',async({page},info)=>{
  await page.goto('/');if(info.project.name==='touch-portrait')await go(page,'menuBtn');
  await page.locator('.qz[data-q="Traffic"]').click();await expect(page.locator('#journey')).toBeHidden();await expect(page.locator('#cStart')).toBeVisible();await expect(page).toHaveURL(/#quiz-traffic$/);
  await page.goBack();await expect(page).toHaveURL(/#home$/);await expect(page.locator('#journey')).toBeVisible();
  await go(page,'jStart');await go(page,'completeBtn');await go(page,'navHome');await page.getByRole('button',{name:/Suggested practice:/}).click();await expect(page.locator('#cStart')).toBeVisible();await expect(page.locator('#cTitle')).toHaveText('Knock on the right door');
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
  if(info.project.name==='touch-portrait')await go(page,'menuBtn');
  const downloading=page.waitForEvent('download');await go(page,'exportBtn');const download=await downloading,file=info.outputPath('journey-progress.json');await download.saveAs(file);
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
    if(route==='home'){await page.locator('.j-story-strip').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('home-story.png')});}
    if(route==='intro'){await go(page,'jIntroNext');await page.screenshot({path:info.outputPath('intro-active.png')});}
    if(route==='missions'){await page.locator('.j-design-controls').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('mission-controls.png')});await solveLaunch(page);await page.locator('#jMissionResult').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('mission-result.png')});}
  }
  for(const theme of ['light','contrast']){await page.evaluate(t=>{document.getElementById('theme').value=t;document.getElementById('theme').dispatchEvent(new Event('change'));},theme);await expect(page.locator('html')).toHaveAttribute('data-theme',theme);await page.screenshot({path:info.outputPath('missions-'+theme+'.png')});}
});
test('Home greets newcomers with Start learning and the three paths, then turns a paused lesson into Continue learning',async({page})=>{
  await page.goto('/');await expect(page.locator('#jStart')).toHaveText('Start learning');await expect(page.locator('#jPathTitle')).toHaveText('Where would you like to start?');
  await expect(page.locator('.j-path strong')).toHaveText(['Learn the basics','Prepare for interviews','Explore systems']);
  await go(page,'jStart');await expect(page).toHaveURL(/#packets$/);await go(page,'stepNext');await go(page,'navHome');
  await expect(page.locator('#resume')).toContainText('Continue learning');await expect(page.locator('#resumeText')).toContainText('How Computers Talk');
  await expect(page.locator('#continueBtn')).toHaveText('Continue learning');await expect(page.locator('#jStart')).not.toHaveClass(/pri/);await expect(page.locator('#jPathTitle')).toHaveText('Your learning path');
});
test('the introduction animates the overload and ends with a clear next lesson',async({page})=>{
  await page.goto('/#intro');await expect(page.locator('#journeyTitle')).toHaveText('Your app suddenly gets popular.');
  await go(page,'jIntroNext');await expect(page.locator('.j-intro-diagram .j-node-over')).toHaveCount(1);await expect(page.locator('.j-tag-over')).toContainText('OVERLOADED');expect(await page.locator('.j-flow circle').count()).toBeGreaterThan(0);
  await go(page,'jIntroNext');await expect(page.locator('.j-tag-idle')).toContainText('IDLE');
  await go(page,'jIntroNext');await expect(page.locator('.j-intro-diagram .j-node-over')).toHaveCount(0);await expect(page.locator('.j-intro-diagram .j-node-ok')).toHaveCount(2);
  await expect(page.locator('#jIntroLesson')).toHaveText('Next lesson: Load Balancers →');await go(page,'jIntroLesson');await expect(page).toHaveURL(/#load-balancers$/);await expect(page.locator('#lessonView')).toBeVisible();
});
test('the map marks where you are: the paused lesson, otherwise the route\u2019s next lesson',async({page})=>{
  await page.goto('/#map');await expect(page.locator('li.j-here a.j-map-lesson')).toHaveAttribute('href','#packets');await expect(page.locator('li.j-here')).toContainText('You are here');await expect(page.locator('li.j-here')).toHaveCount(1);
  await page.goto('/#caching');await go(page,'stepNext');await go(page,'navMap');await expect(page.locator('li.j-here a.j-map-lesson')).toHaveAttribute('href','#caching');await expect(page.locator('li.j-here a.j-map-lesson')).toHaveAttribute('aria-current','step');
});
