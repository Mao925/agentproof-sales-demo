const { chromium } = require('playwright-core')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const base = 'https://mao925.github.io/agentproof-sales-demo/'
async function main(){
  fs.mkdirSync('qa',{recursive:true})
  const browser = await chromium.launch({executablePath:process.env.CHROME_BIN || '/usr/bin/google-chrome',headless:true})
  try{
    for(const width of [1440,375]){
      const context = await browser.newContext({viewport:{width,height:900},permissions:['clipboard-read','clipboard-write']})
      const page = await context.newPage()
      const errors=[], events=[]
      page.on('pageerror',e=>errors.push(e.message))
      // Keep automated acceptance checks out of the public event counters.
      await page.route('https://github.com/**/releases/download/**',r=>{
        events.push(new URL(r.request().url()).pathname.split('/').pop())
        return r.fulfill({status:200,contentType:'image/gif',body:Buffer.from('R0lGODlhAQABAAAAACw=','base64')})
      })
      assert.equal((await page.goto(base)).status(),200)
      await page.locator('h2').waitFor()
      console.log(width,'cold navigation load ms',await page.evaluate(()=>performance.getEntriesByType('navigation')[0].loadEventEnd))
      assert.equal(events.length,0)
      await page.screenshot({path:'qa/overview-'+width+'.png',fullPage:true})
      for(let i=0;i<6;i++){
        assert.equal(await page.locator('[aria-current=step]').count(),1)
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow on '+page.url())
        if(i===1)await page.locator('summary').first().click()
        if(i===2){await page.locator('summary').filter({hasText:'元記録'}).click();assert.match(await page.locator('pre').innerText(),/AP-1\.0-A01-1/)}
        if(i===3){
          await page.locator('[data-version="1.1"]').click()
          for(const id of ['A01','A02','A03','N01','N02']){
            await page.selectOption('#case',id)
            assert.match(await page.locator('#compare-result').innerText(),/期待どおり/)
          }
          await page.locator('[data-version="1.0"]').click()
          assert.match(await page.locator('#compare-result').innerText(),/要修正/)
          await page.screenshot({path:'qa/retest-'+width+'.png',fullPage:true})
        }
        if(i===4){
          const response=await context.request.get(base+'agentproof-sample.pdf')
          assert.equal(response.status(),200)
          assert.equal((await response.body()).subarray(0,5).toString(),'%PDF-')
          const sample=page.locator('main [data-event=sample_download]')
          await sample.click()
          await page.bringToFront()
        }
        if(i<5){await page.locator('.pager .primary').click();await page.waitForURL('**#'+['questions','evidence','retest','package','contact'][i])}
      }
      await page.locator('#consult').click()
      await page.locator('#copy').click()
      await page.waitForFunction(()=>document.querySelector('#copy-status').textContent.includes('コピーしました'))
      assert.match(await page.evaluate(()=>navigator.clipboard.readText()),/回答期限/)
      await page.locator('a[href="#monitoring"]').click()
      await page.waitForURL('**#monitoring')
      await page.locator('.pager .back').click()
      await page.waitForURL('**#contact')
      await page.reload()
      assert.equal(await page.locator('h2').innerText(),'自社の質問票で相談する')
      for(const event of ['demo_start','evidence_open','retest_open','sample_download','contact_click','reply_copy']){
        assert.equal(events.filter(e=>e===event+'.gif').length,1,event)
      }
      assert.deepEqual(errors,[])
      await context.close()
    }
  }finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1})
