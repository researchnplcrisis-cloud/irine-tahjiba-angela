import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate,classify,cleanState,annuity,SCENARIOS} from '../model.mjs';
const near=(actual,expected,tol=1e-8)=>assert.ok(Math.abs(actual-expected)<=tol,actual+' ≠ '+expected);
test('Treasury benchmark reproduces article arithmetic with correct pp conversion',()=>{
 const r=calculate({});
 near(r.perFirmAUD,136807.81758957655);
 near(r.thresholdPP,1.3680781758957655);
 near(r.reciprocal,73.0952380952381);
 near(r.extraFailures,21);
 near(r.annualHarm,153.5);
 near(r.npv,396.832357062692);
});
test('Mandala published aggregate profile reproduces 2.70 pp rather than recurring 555m',()=>{
 const r=calculate({scenario:'mandala'});
 near(r.profile.first,555);near(r.profile.ongoing,393);
 near(r.profile.equivalent,414.55622003909633);
 near(r.thresholdPP,2.700691987225383);
 near(calculate({scenario:'mandala',basis:'first'}).thresholdPP,3.6156351791530943);
});
test('Earlier unit-cost reconstruction has distinct first and ongoing savings',()=>{
 near(SCENARIOS.earlier.first,60.1758375);
 near(SCENARIOS.earlier.ongoing,59.5541625);
 near(calculate({scenario:'earlier'}).thresholdPP,.38851390550097736);
});
test('0%, 50% and 100% realisation; no harm at zero incremental risk',()=>{
 const zero=calculate({realized:0,risk:0});near(zero.thresholdPP,0);near(zero.npv,0);assert.equal(zero.reciprocal,null);
 const full=calculate({}),half=calculate({realized:50});
 near(half.thresholdPP,full.thresholdPP/2);near(half.pvSavings,full.pvSavings/2);
 near(calculate({risk:0}).npv,full.pvSavings);
});
test('Boundary is a zero NPV under every scenario; above/below changes sign',()=>{
 for(const scenario of Object.keys(SCENARIOS))for(const basis of ['first','ongoing','equivalent']){
  const r=calculate({scenario,basis,loss:10});
  const exact=calculate({scenario,basis,loss:10,risk:r.thresholdPP});
  near(exact.net,0);
  assert.ok(calculate({scenario,basis,risk:r.thresholdPP+.01}).net<0);
  assert.ok(calculate({scenario,basis,risk:r.thresholdPP-.01}).net>0);
 }
});
test('Discount period limits and independently evaluated golden vectors',()=>{
 near(annuity(10,0),10);
 near(calculate({scenario:'mandala',discount:0}).gross,409.2);
 near(calculate({scenario:'mandala',years:1}).gross,555);
 // 2 years, zero discount: average of 555 and 393 = 474.
 near(calculate({scenario:'mandala',years:2,discount:0}).gross,474);
 // Two years at 10%: EAC = (555*1.1 + 393)/2.1.
 near(calculate({scenario:'mandala',years:2,discount:10}).gross,477.8571428571429);
 for(const discount of[0,3,7,10])for(const years of[1,3,10,30])near(calculate({discount,years}).gross,210);
 assert.throws(()=>annuity(0,.07),RangeError);
});
test('One-year views ignore horizon and discount settings and do not mislabel NPV',()=>{
 for(const basis of['first','ongoing'])for(const scenario of Object.keys(SCENARIOS)){
  const a=calculate({scenario,basis,years:1,discount:0}),b=calculate({scenario,basis,years:30,discount:10});
  near(a.net,b.net);near(a.thresholdPP,b.thresholdPP);assert.equal(a.npv,null);
 }
});
test('Increasing social loss halves risk capacity; expected cohort harm is additive',()=>{
 const a=calculate({loss:10}),b=calculate({loss:20});
 near(b.thresholdPP,a.thresholdPP/2);near(b.annualHarm,2*a.annualHarm);
});
test('Inclusive two-of-three classification at all threshold boundaries',()=>{
 assert.deepEqual(classify(50,25,0).current,[true,true,false]);
 assert.equal(classify(50,25,0).currentLarge,true);
 assert.equal(classify(49.999,24.999,100).currentLarge,false);
 assert.equal(classify(100,50,0).proposedLarge,true);
 assert.equal(classify(100,0,100).proposedLarge,true);
 assert.equal(classify(0,50,100).proposedLarge,true);
 assert.equal(classify(99.999,49.999,100).proposedLarge,false);
 assert.equal(classify(75,40,80).currentLarge,true);
 assert.equal(classify(75,40,80).proposedLarge,false);
 assert.throws(()=>classify(-1,1,1),RangeError);
});
test('Untrusted URL inputs are clamped and unknown values fall back safely',()=>{
 const s=cleanState({scenario:'<script>',basis:'bad',loss:'Infinity',risk:100,realized:-1,years:2.7,discount:'NaN'});
 assert.equal(s.scenario,'treasury');assert.equal(s.basis,'equivalent');assert.equal(s.loss,10);assert.equal(s.risk,6);assert.equal(s.realized,0);assert.equal(s.years,3);assert.equal(s.discount,7);
});

