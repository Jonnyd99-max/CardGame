import {describe,it,expect} from 'vitest';
import {compare,aiStat,createBattle,playRound,rewardMatch} from './battle';
import {playerLevel,grantXP,statsFor,unlock,validateDeck,compatible,items,refreshPeriods} from './progression';
import {newSave,parseSave} from '../state/save';
import {characters} from '../data/characters';
import {statKeys} from '../types';
const fresh=()=>newSave('Explorer','marvel','marvel-0');
describe('battle rules',()=>{
it('compares win, loss and tie',()=>{expect(compare(80,60)).toBe('player');expect(compare(60,80)).toBe('ai');expect(compare(70,70)).toBe('draw');});
it('AI chooses from its own stats and public data only',()=>{const stats={strength:99,speed:20,intelligence:40,combat:50,durability:60,power:80,special:50,tech:50};expect(aiStat(stats,'Hard')).toBe('strength');expect(aiStat(stats,'Easy',()=>0)).toBe('strength');expect(statKeys).toContain(aiStat(stats,'Expert'));});
it('classic transfers two cards to winner',()=>{const s=fresh(),b=createBattle(s.owned,'Classic','Easy');b.player=['marvel-0','marvel-1'];b.ai=['rangers-0','rangers-1'];const stat=statKeys.find(k=>characters[8].baseStats[k]!==characters[0].baseStats[k])!;const n=playRound(b,stat,s);expect(n.player.length+n.ai.length+n.pot.length).toBe(4);expect(n.scores[0]+n.scores[1]).toBe(1);expect(Math.max(n.player.length,n.ai.length)).toBe(3);expect(b.round).toBe(0);});
it('ties accumulate a pot while conserving the deck',()=>{const s=fresh(),b=createBattle(s.owned,'Classic','Easy');b.player=['marvel-0','marvel-1'];b.ai=['marvel-0','marvel-2'];const n=playRound(b,'strength',s);expect(n.pot.length).toBe(2);expect(n.player.length+n.ai.length+n.pot.length).toBe(4);expect(n.scores).toEqual([0,0]);});
it('best-of ends when majority is won',()=>{const s=fresh(),b=createBattle(s.owned,'Best of','Easy',5);b.scores=[2,0];b.round=2;b.player=['marvel-0'];b.ai=['marvel-0'];s.cards['marvel-0'].boosts.strength=2;expect(playRound(b,'strength',s).result).toBe('player');});
it('rewards match, character XP and challenge progress',()=>{const s=fresh(),b=createBattle(s.owned,'Quick Battle','Easy');b.result='player';b.scores=[2,0];b.strengthWins=2;rewardMatch(s,b);expect(s.wins).toBe(1);expect(s.xp).toBe(65);expect(s.coins).toBe(440);expect(s.cards['marvel-0'].xp).toBe(40);expect(s.perfectWins).toBe(1);expect(s.strengthWins).toBe(2);});
});
describe('progression and equipment',()=>{
it('calculates level boundaries and level rewards',()=>{expect(playerLevel(149)).toBe(1);expect(playerLevel(150)).toBe(2);const s=fresh();grantXP(s,600);expect(playerLevel(s.xp)).toBe(5);expect(s.coins).toBe(750);expect(s.owned).toContain('marvel-4');});
it('unlocks use data requirements',()=>{const s=fresh();s.xp=29*150;unlock(s);expect(s.owned.length).toBe(32);expect(s.cards['dc-7'].level).toBe(1);});
it('applies level, equipped enhancement and ability modifiers capped at 100',()=>{const s=fresh(),c=characters[8];s.cards[c.id].level=10;s.cards[c.id].equipment=['shield'];s.items.shield=2;s.cards[c.id].abilities=['signature'];const stats=statsFor(c,s);expect(stats.strength).toBe(Math.min(100,c.baseStats.strength+4+4));expect(stats.special).toBe(Math.min(100,c.baseStats.special+4+3));});
it('enforces item compatibility',()=>{const morpher=items.find(i=>i.id==='morpher')!;expect(compatible(characters[0],morpher)).toBe(true);expect(compatible(characters[8],morpher)).toBe(false);});
it('validates deck ownership, uniqueness and size',()=>{const s=fresh();expect(validateDeck(s.decks[0],s)).toBe('');expect(validateDeck({...s.decks[0],cards:['marvel-0']},s)).not.toBe('');expect(validateDeck({...s.decks[0],cards:['marvel-0','marvel-0','marvel-1','marvel-2']},s)).not.toBe('');});
});
describe('save boundary',()=>{
it('round trips all progress',()=>{const s=fresh();s.coins=123;s.settings.sound=true;s.cards['marvel-0'].level=4;expect(parseSave(JSON.stringify(s)).cards['marvel-0'].level).toBe(4);expect(parseSave(JSON.stringify(s)).coins).toBe(123);});
it('rejects malformed and unsupported saves',()=>{expect(()=>parseSave('{}')).toThrow();expect(()=>parseSave(JSON.stringify({...fresh(),version:2}))).toThrow();expect(()=>parseSave(JSON.stringify({...fresh(),coins:-1}))).toThrow();});
it('refreshes daily counters independently from weekly',()=>{const s=fresh();refreshPeriods(s);s.periods.dailyWins=4;s.periods.daily='old';s.periods.weeklyWins=6;refreshPeriods(s);expect(s.periods.dailyWins).toBe(0);expect(s.periods.weeklyWins).toBe(6);});
});
