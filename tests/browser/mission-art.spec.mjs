import {test,expect} from '@playwright/test';
test('mission artwork exports valid, transparent, editable SVGs at every preview size',async({page},info)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/assets/mission-art/preview.html');
  await expect(page.locator('figure')).toHaveCount(26);
  await expect.poll(()=>page.locator('img').evaluateAll(images=>images.every(image=>image.complete&&image.naturalWidth>0))).toBe(true);
  const assets=await(await page.request.get('/assets/mission-art/manifest.json')).json();
  for(const asset of [...assets,{file:'mission-art-sheet.svg'}]){
    const source=await(await page.request.get('/assets/mission-art/'+asset.file)).text();
    const data=await page.evaluate(source=>{const doc=new DOMParser().parseFromString(source,'image/svg+xml'),ids=[...doc.querySelectorAll('[id]')].map(el=>el.id);return {errors:doc.querySelectorAll('parsererror').length,unique:new Set(ids).size===ids.length,disallowed:doc.querySelectorAll('text,image,linearGradient,radialGradient,filter,script,foreignObject').length,groups:doc.querySelectorAll('g[data-part]').length};},source);
    expect(data.errors,asset.file).toBe(0);expect(data.unique,asset.file).toBe(true);expect(data.disallowed,asset.file).toBe(0);expect(data.groups,asset.file).toBeGreaterThan(1);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#sheet').screenshot({path:info.outputPath('mission-art-sheet-dark.png')});
  await page.locator('.postcards').screenshot({path:info.outputPath('mission-postcards.png')});
  await page.getByRole('button',{name:'Light backdrop'}).click();
  await expect(page.getByRole('button',{name:'Dark backdrop'})).toHaveAttribute('aria-pressed','true');
  await page.locator('#sheet').screenshot({path:info.outputPath('mission-art-sheet-light.png')});
  expect(errors).toEqual([]);
});
