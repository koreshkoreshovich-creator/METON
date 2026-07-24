(function(){
  'use strict';
  var ENDPOINT='https://script.google.com/macros/s/AKfycbwS0-3y7yTZIiQIpn0jqJhrLiBZzVCaMMaM5rG4TeKWFcPbB-N3rCqgVSDShJdPO1TXHQ/exec';
  var yields={north:1050,west:1080,center:1150,east:1180,south:1280};
  var sizes=[5,6,8,10,12,15,20,30,50,80,100,150,200];
  var latest=null;
  function nextSize(value){ for(var i=0;i<sizes.length;i++) if(sizes[i]>=value) return sizes[i]; return Math.ceil(value/50)*50; }
  function esc(value){ return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function calculate(form){
    var data=new FormData(form),monthly=Number(data.get('monthly')),coverage=Number(data.get('coverage'));
    var region=data.get('region'),annualUse=monthly*12,rawKw=annualUse*coverage/yields[region];
    var systemKw=nextSize(rawKw),panels=Math.ceil(systemKw*1000/620),areaNeeded=Math.ceil(panels*2.8);
    var goal=data.get('goal'),load=Number(data.get('criticalLoad')||0),hours=Number(data.get('reserveHours')||0);
    var battery=(goal==='economy'||!load)?0:Math.ceil((load*hours/0.8)/5.12)*5.12;
    var type=goal==='economy'?'Мережева станція':'Гібридна станція';
    var voltage=systemKw>=15?'високовольтна система АКБ (клас Deye BOS-G Pro)':'низьковольтна система АКБ';
    var phase=data.get('phase'),phaseText=phase==='1'?'однофазний':phase==='3'?'трифазний':'фазність після перевірки';
    var area=Number(data.get('area')||0),areaWarning=area&&area<areaNeeded?'Вказаної площі може бути недостатньо: потрібно орієнтовно '+areaNeeded+' м².':'Орієнтовна площа під панелі: '+areaNeeded+' м².';
    latest={systemKw:systemKw,panels:panels,panelWatts:620,type:type,phase:phaseText,batteryKwh:battery,batteryClass:battery?voltage:'без обов’язкового АКБ',annualGeneration:Math.round(systemKw*yields[region]),annualConsumption:annualUse,areaNeeded:areaNeeded,areaWarning:areaWarning,region:region,mount:data.get('mount'),goal:goal};
    localStorage.setItem('metonLastConfiguration',JSON.stringify(latest));
    return latest;
  }
  function render(result){
    document.getElementById('configResult').innerHTML='<span class="kicker">Рекомендований орієнтир</span><h2>'+esc(result.type)+' '+result.systemKw+' кВт</h2>'+
      '<div class="result-metrics"><div><strong>'+result.panels+'</strong><span>панелей близько 620 Вт</span></div><div><strong>'+result.annualGeneration.toLocaleString('uk-UA')+'</strong><span>кВт·год на рік</span></div><div><strong>'+result.areaNeeded+' м²</strong><span>орієнтовна площа</span></div></div>'+
      '<ul class="config-list"><li>Інвертор: '+esc(result.phase)+', клас потужності '+result.systemKw+' кВт</li><li>АКБ: '+(result.batteryKwh?result.batteryKwh.toLocaleString('uk-UA')+' кВт·год, '+esc(result.batteryClass):'не обов’язковий для вибраної мети')+'</li><li>'+esc(result.areaWarning)+'</li><li>Точну модель, стрінги, захист і кріплення перевіряє інженер.</li></ul>'+
      '<a class="btn ghost" href="#calculator">Перевірити генерацію та окупність</a>';
    document.querySelector('#paybackForm [name=systemKw]').value=result.systemKw;
    document.querySelector('#paybackForm [name=region]').value=result.region;
  }
  document.getElementById('configuratorForm').addEventListener('submit',function(e){e.preventDefault();render(calculate(e.currentTarget));});
  document.getElementById('paybackForm').addEventListener('submit',function(e){
    e.preventDefault();var d=new FormData(e.currentTarget),kw=Number(d.get('systemKw')),annual=Math.round(kw*yields[d.get('region')]),tariff=Number(d.get('tariff')),saving=Math.round(annual*tariff),investment=Number(d.get('investment')||0);
    document.getElementById('paybackResult').innerHTML='<span class="kicker">Орієнтовний прогноз</span><h3>'+annual.toLocaleString('uk-UA')+' кВт·год на рік</h3><p>Еквівалент економії за введеним тарифом: <strong>'+saving.toLocaleString('uk-UA')+' грн/рік</strong>.</p>'+(investment?'<p>Проста окупність: <strong>близько '+(investment/saving).toFixed(1)+' року</strong>.</p>':'<p>Вкажіть вартість отриманої пропозиції, щоб побачити просту окупність.</p>')+'<small>Без урахування деградації, затінення, зміни тарифів, кредитування та вартості обслуговування.</small>';
  });
  document.getElementById('configLeadForm').addEventListener('submit',function(e){
    e.preventDefault();if(!latest){document.getElementById('configLeadStatus').textContent='Спочатку розрахуйте систему.';return;}
    var f=e.currentTarget,d=new FormData(f),payload={action:'configuration',orderId:'CFG-'+Date.now().toString(36).toUpperCase(),name:d.get('name'),phone:d.get('phone'),comment:d.get('comment'),configuration:latest,source:location.href};
    document.getElementById('configLeadStatus').textContent='Надсилаємо конфігурацію…';
    fetch(ENDPOINT,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)}).then(function(){document.getElementById('configLeadStatus').innerHTML='Готово. Номер звернення: <strong>'+payload.orderId+'</strong>. Менеджер зв’яжеться з вами.';f.reset();}).catch(function(){document.getElementById('configLeadStatus').textContent='Не вдалося надіслати. Зателефонуйте +38 096 073 50 59.';});
  });
  try{var user=JSON.parse(localStorage.getItem('metonUser')||'null');if(user){document.querySelector('#configLeadForm [name=name]').value=user.name||'';document.querySelector('#configLeadForm [name=phone]').value=user.phone||'';}}catch(e){}
  document.querySelectorAll('[data-cart-count]').forEach(function(el){try{el.textContent=JSON.parse(localStorage.getItem('metonCart')||'[]').reduce(function(s,x){return s+(x.qty||1);},0);}catch(e){el.textContent='0';}});
  document.querySelectorAll('[data-account-link]').forEach(function(el){try{var u=JSON.parse(localStorage.getItem('metonUser')||'null');el.textContent=u&&u.name?u.name:'Клієнт';}catch(e){}});
  document.getElementById('paybackForm').dispatchEvent(new Event('submit',{cancelable:true}));
})();
