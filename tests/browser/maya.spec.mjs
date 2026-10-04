import {test,expect} from '@playwright/test';
test('Maya sheets render as native vector layers and readable small poses',async({page},info)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/assets/maya/preview.html');
  await expect(page.locator('#vector')).toBeVisible();
  expect(await page.locator('img').evaluateAll(images=>images.every(image=>image.complete&&image.naturalWidth>0))).toBe(true);
  const source=await (await page.request.get('/assets/maya/maya-character-sheet.svg')).text();
  const validation=await page.evaluate(source=>{const doc=new DOMParser().parseFromString(source,'image/svg+xml'),ids=[...doc.querySelectorAll('[id]')].map(e=>e.id);return {errors:doc.querySelectorAll('parsererror').length,ids:ids.length,unique:new Set(ids).size,images:doc.querySelectorAll('image').length,gradients:doc.querySelectorAll('linearGradient,radialGradient').length,poses:doc.querySelectorAll('[id^="pose-"][id$="-figure"]').length};},source);
  expect(validation.errors).toBe(0);expect(validation.ids).toBe(validation.unique);expect(validation.images).toBe(0);expect(validation.gradients).toBe(0);expect(validation.poses).toBe(5);
  await page.locator('#vector').screenshot({path:info.outputPath('maya-vector-sheet.png')});
  await page.locator('.swatches').screenshot({path:info.outputPath('maya-small-poses.png')});
  await page.locator('#reference').screenshot({path:info.outputPath('maya-reference-on-navy.png')});
  expect(errors).toEqual([]);
});
test('mission and intro character assets are embedded and stay offline',async({page})=>{
  await page.addInitScript(()=>{localStorage.setItem('pim-tour','done');localStorage.setItem('pim-missions-help','1');});
  await page.goto('/#missions');await expect(page.locator('.j-brief .mc-maya')).toHaveCount(1);await expect(page.locator('.j-brief .mc-maya [data-part="eyes"]')).toHaveCount(1);
  await page.locator('#jTest').click();await expect(page.locator('#jMissionResult .mc-maya.mc-worried')).toBeVisible();
  const ids=await page.locator('.mc-maya [id]').evaluateAll(elements=>elements.map(e=>e.id));expect(new Set(ids).size).toBe(ids.length);
  await expect(page.locator('.mc-maya image')).toHaveCount(0);
  await expect(page.locator('#jMissionResult .mc-engineer [data-part="glasses"]')).toHaveCount(1);
  await expect(page.locator('.mc-engineer image')).toHaveCount(0);
  await page.goto('/#intro');await expect(page.locator('.j-maya .mc-maya')).toBeVisible();
});

test('engineer sheet and both avatars render with unique vector layer IDs',async({page},info)=>{
  await page.goto('/assets/engineer/preview.html');
  await expect(page.locator('#vector')).toBeVisible();
  expect(await page.locator('img').evaluateAll(images=>images.every(image=>image.complete&&image.naturalWidth>0))).toBe(true);
  const source=await (await page.request.get('/assets/engineer/engineer-character-sheet.svg')).text();
  const validation=await page.evaluate(source=>{const doc=new DOMParser().parseFromString(source,'image/svg+xml'),ids=[...doc.querySelectorAll('[id]')].map(e=>e.id);return {errors:doc.querySelectorAll('parsererror').length,ids:ids.length,unique:new Set(ids).size,glasses:doc.querySelectorAll('[data-part="glasses"]').length};},source);
  expect(validation.errors).toBe(0);expect(validation.unique).toBe(validation.ids);expect(validation.glasses).toBe(14);
  await page.locator('#vector').screenshot({path:info.outputPath('engineer-vector-sheet.png')});
  await page.locator('.swatches').screenshot({path:info.outputPath('engineer-small-poses.png')});
  await page.locator('.avatars').screenshot({path:info.outputPath('both-avatars.png')});
  await page.locator('#reference').screenshot({path:info.outputPath('engineer-reference-on-navy.png')});
});
