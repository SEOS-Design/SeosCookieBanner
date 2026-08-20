const { chromium } = require('./node_modules/playwright');
const UT = 'C:/Users/bjorn/AppData/Local/Temp/claude/C--Users-bjorn-development-Cookiebanner-restructure/8d41e77c-6e06-4ea9-beb3-d7b627a2a09f/scratchpad';
const R = "(function(){var v=document.getElementById('cookie-sectionId');return v&&v.shadowRoot?v.shadowRoot:document;})";
const V = ['.cookie-section','#cookie-banner','.cookie-header h2','.cookie-body p','.policy-link','.cookie-icon-container','.btn-customize','.btn-reject','#cookie-banner .btn-save','.cookie-buttons'];
const E = ['backgroundColor','color','fontFamily','fontSize','fontWeight','borderRadius','borderColor','borderWidth','padding','display','gap','width','height','lineHeight','filter'];
const fas = process.argv[2];
(async () => {
  const b = await chromium.launch(); const ut = {};
  for (const [namn, url] of [['brevenshus','https://www.brevenshus.se/'],['seosdesign','https://www.seosdesign.se/']]) {
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
    const fel = [];
    p.on('pageerror', (e) => fel.push(e.message));
    await p.goto(url, { waitUntil: 'domcontentloaded' });
    await p.locator('#cookie-banner').waitFor({ state: 'visible', timeout: 25000 });
    await p.waitForTimeout(700);
    ut[namn] = await p.evaluate(([V,E,R]) => { const rot = eval(R); const o={};
      V.forEach(s=>{const e=rot().querySelector(s); if(!e){o[s]=null;return;}
        const st=getComputedStyle(e),x={}; E.forEach(k=>x[k]=st[k]);
        const r=e.getBoundingClientRect(); x._box=Math.round(r.width)+'x'+Math.round(r.height); o[s]=x;});
      return o; }, [V,E,R]);
    for (const sel of ['#cookie-banner .btn-customize','#cookie-banner .btn-save']) {
      await p.locator(sel).hover(); await p.waitForTimeout(500);
      ut[namn]['HOVER ' + sel] = { v: await p.evaluate(([s,R])=>{const rot=eval(R);const st=getComputedStyle(rot().querySelector(s));
        return st.backgroundColor+' / '+st.filter+' / '+st.color;},[sel,R]) };
    }
    ut[namn]._fel = fel;
    ut[namn]._skugga = await p.evaluate(() => !!(document.getElementById('cookie-sectionId') || {}).shadowRoot);
    await p.screenshot({ path: UT + '/' + fas + '-' + namn + '.png' });
    await p.close();
  }
  require('fs').writeFileSync(UT + '/matning-' + fas + '.json', JSON.stringify(ut, null, 1));
  console.log('  ' + fas + ': brevenshus skugga=' + ut.brevenshus._skugga + ' fel=' + ut.brevenshus._fel.length +
              ' | seosdesign skugga=' + ut.seosdesign._skugga + ' fel=' + ut.seosdesign._fel.length);
  await b.close();
})();
